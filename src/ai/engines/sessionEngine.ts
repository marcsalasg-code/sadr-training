/**
 * Session Engine - Motor IA para generación de sesiones
 * 
 * Genera sesiones completas basadas en:
 * - Tipo de sesión del plan
 * - Catálogo real de ejercicios
 * - Historial del atleta
 * - Templates existentes
 */

import type {
    Exercise,
    ExerciseEntry,
    SetEntry,
    WorkoutSession,
    WorkoutTemplate,
    DayPlan,
    BlockType,
    UUID,
    Athlete,
} from '../../types/types';
// Using native crypto.randomUUID() instead of uuid package
const generateId = () => crypto.randomUUID();
import { generateLoadSuggestion, type PerformanceContext } from '../performance/performanceEngine';

// ============================================
// INPUT/OUTPUT TYPES
// ============================================

export interface SessionGenerationInput {
    dayPlan: DayPlan;
    athleteId: UUID;
    athlete?: Athlete;               // Full athlete for 1RM suggestions (Sprint 6)
    catalog: Exercise[];             // Catálogo REAL de ejercicios
    templates: WorkoutTemplate[];
    recentSessions?: WorkoutSession[];  // Para evitar repetición
    athletePreferences?: {
        favoriteExerciseIds?: UUID[];
        avoidExerciseIds?: UUID[];
    };
}

export interface ExerciseRecommendation {
    exerciseId: UUID;
    exercise: Exercise;
    sets: number;
    reps: number;
    blockType: BlockType;
    reasoning: string;
    suggestedWeight?: number;  // Sprint 6: IA-suggested weight based on 1RM
    weightSource?: 'direct' | 'reference' | 'none'; // Sprint 6: weight source
}

export interface SessionGenerationOutput {
    name: string;
    exercises: ExerciseRecommendation[];
    totalEstimatedVolume: number;
    notes: string[];
    alternatives?: ExerciseRecommendation[][]; // 2-3 variaciones
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Filter exercises by muscle group or category
 */
function filterExercisesByType(
    catalog: Exercise[],
    sessionType: string
): Exercise[] {
    const typeToMuscles: Record<string, string[]> = {
        upper: ['chest', 'back', 'shoulders', 'arms', 'biceps', 'triceps'],
        lower: ['legs', 'quads', 'hamstrings', 'glutes', 'calves'],
        push: ['chest', 'shoulders', 'triceps'],
        pull: ['back', 'biceps', 'rear_delts'],
        full_body: [], // No filter
        strength: [],
        technique: [],
        mobility: ['core', 'flexibility'],
        power: ['legs', 'back'],
        endurance: [],
        recovery: ['core', 'flexibility'],
        mixed: [],
    };

    const targetMuscles = typeToMuscles[sessionType] || [];

    if (targetMuscles.length === 0) {
        return catalog;
    }

    return catalog.filter(ex =>
        (ex.muscleGroups || []).some(mg =>
            targetMuscles.some(tm => mg.toLowerCase().includes(tm))
        )
    );
}

/**
 * Select exercises avoiding recent repetition
 */
function selectExercisesWithVariety(
    available: Exercise[],
    count: number,
    recentExerciseIds: Set<UUID>
): Exercise[] {
    // Prioritize exercises not used recently
    const fresh = available.filter(ex => !recentExerciseIds.has(ex.id));
    const result: Exercise[] = [];

    // Take from fresh first
    for (const ex of fresh) {
        if (result.length >= count) break;
        result.push(ex);
    }

    // Fill remainder from all available
    for (const ex of available) {
        if (result.length >= count) break;
        if (!result.includes(ex)) {
            result.push(ex);
        }
    }

    return result;
}

/**
 * Determine sets and reps based on block type and intensity
 */
function determineSetsReps(
    blockType: BlockType,
    intensity: string
): { sets: number; reps: number } {
    const config: Record<BlockType, Record<string, { sets: number; reps: number }>> = {
        movilidad_calentamiento: {
            light: { sets: 2, reps: 12 },
            moderate: { sets: 2, reps: 10 },
            heavy: { sets: 2, reps: 8 },
        },
        fuerza: {
            light: { sets: 3, reps: 12 },
            moderate: { sets: 4, reps: 8 },
            heavy: { sets: 5, reps: 5 },
        },
        tecnica_especifica: {
            light: { sets: 2, reps: 15 },
            moderate: { sets: 3, reps: 12 },
            heavy: { sets: 3, reps: 10 },
        },
        emom_hiit: {
            light: { sets: 2, reps: 15 },
            moderate: { sets: 2, reps: 12 },
            heavy: { sets: 2, reps: 10 },
        },
    };

    return config[blockType]?.[intensity] || { sets: 3, reps: 10 };
}

/**
 * Create SetEntry array for an exercise
 */
function createSets(count: number, targetReps: number): SetEntry[] {
    return Array.from({ length: count }, (_, i) => ({
        id: generateId(),
        setNumber: i + 1,
        type: 'working' as const,
        targetReps,
        isCompleted: false,
    }));
}

// ============================================
// MAIN ENGINE FUNCTION
// ============================================

/**
 * Generate a training session based on the day plan and catalog
 * 
 * Uses ONLY exercises from the real catalog.
 * Never invents new exercises.
 */
export function generateSession(input: SessionGenerationInput): SessionGenerationOutput | null {
    const {
        dayPlan,
        catalog,
        athlete,
        recentSessions = [],
    } = input;

    if (catalog.length === 0) {
        return null; // Cannot generate without catalog
    }

    // Get recently used exercise IDs
    const recentExerciseIds = new Set<UUID>(
        recentSessions.flatMap(s => s.exercises.map(e => e.exerciseId))
    );

    // Filter catalog by session type
    const filteredCatalog = filterExercisesByType(catalog, dayPlan.sessionType);

    if (filteredCatalog.length === 0) {
        // Fallback to full catalog
        return generateSession({ ...input, dayPlan: { ...dayPlan, sessionType: 'mixed' } });
    }

    // Define block structure based on intensity
    const blockStructure: { type: BlockType; count: number }[] =
        dayPlan.intensity === 'light'
            ? [{ type: 'movilidad_calentamiento', count: 2 }, { type: 'fuerza', count: 2 }, { type: 'emom_hiit', count: 1 }]
            : dayPlan.intensity === 'moderate'
                ? [{ type: 'movilidad_calentamiento', count: 2 }, { type: 'fuerza', count: 3 }, { type: 'tecnica_especifica', count: 2 }]
                : [{ type: 'movilidad_calentamiento', count: 2 }, { type: 'fuerza', count: 4 }, { type: 'tecnica_especifica', count: 2 }, { type: 'emom_hiit', count: 1 }];

    // Build exercise recommendations
    const exercises: ExerciseRecommendation[] = [];
    let remaining = [...filteredCatalog];

    // Performance context for weight suggestions (Sprint 6)
    const performanceContext: PerformanceContext | null = athlete ? {
        athlete,
        exercises: catalog,
    } : null;

    for (const block of blockStructure) {
        const selected = selectExercisesWithVariety(remaining, block.count, recentExerciseIds);
        const { sets, reps } = determineSetsReps(block.type, dayPlan.intensity);

        for (const ex of selected) {
            // Calculate suggested weight if athlete is provided
            let suggestedWeight: number | undefined;
            let weightSource: 'direct' | 'reference' | 'none' = 'none';

            if (performanceContext) {
                // Target RPE based on block type
                const targetRPE = block.type === 'fuerza' ? 8 : block.type === 'movilidad_calentamiento' ? 6 : 7;
                const suggestion = generateLoadSuggestion(ex.id, reps, targetRPE, performanceContext);
                if (suggestion && suggestion.weight > 0) {
                    suggestedWeight = suggestion.weight;
                    weightSource = suggestion.basedOn as 'direct' | 'reference';
                }
            }

            exercises.push({
                exerciseId: ex.id,
                exercise: ex,
                sets,
                reps,
                blockType: block.type,
                reasoning: `${block.type} block for ${dayPlan.sessionType} session`,
                suggestedWeight,
                weightSource,
            });

            // Remove from remaining to avoid duplication
            remaining = remaining.filter(e => e.id !== ex.id);
        }
    }

    // Calculate estimated volume (using suggested weights when available)
    const totalEstimatedVolume = exercises.reduce((sum, ex) => {
        const weight = ex.suggestedWeight || 20; // Fallback 20kg
        return sum + (ex.sets * ex.reps * weight);
    }, 0);

    // Generate session name
    const sessionName = `${dayPlan.sessionType.charAt(0).toUpperCase() + dayPlan.sessionType.slice(1)} - ${dayPlan.intensity.charAt(0).toUpperCase() + dayPlan.intensity.slice(1)}`;

    // Notes
    const notes: string[] = [];
    if (dayPlan.aiNotes) {
        notes.push(dayPlan.aiNotes);
    }
    notes.push(`Generated from ${catalog.length} available exercises`);

    return {
        name: sessionName,
        exercises,
        totalEstimatedVolume,
        notes,
    };
}

/**
 * Convert SessionGenerationOutput to ExerciseEntry array for WorkoutSession
 */
export function convertToExerciseEntries(output: SessionGenerationOutput): ExerciseEntry[] {
    return output.exercises.map((rec, index) => {
        const { sets, reps } = rec;
        return {
            id: generateId(),
            exerciseId: rec.exerciseId,
            exercise: rec.exercise,
            sets: createSets(sets, reps),
            order: index,
            blockType: rec.blockType,
            notes: rec.reasoning,
        };
    });
}
