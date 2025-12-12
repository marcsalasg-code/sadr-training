/**
 * Domain Layer - Exercises
 * 
 * Pure types and business logic for exercise domain.
 * No React/Zustand dependencies.
 */

// ============================================
// TYPES
// ============================================

export type MovementPattern =
    | 'squat'
    | 'hinge'
    | 'push'
    | 'pull'
    | 'lunge'
    | 'carry'
    | 'rotation'
    | 'core'
    | 'other';

export type MuscleGroup =
    | 'chest'
    | 'back'
    | 'shoulders'
    | 'arms'
    | 'legs'
    | 'core'
    | 'full'
    | 'other'
    // Legacy values for backward compatibility
    | 'quads'
    | 'hamstrings'
    | 'glutes'
    | 'calves'
    | 'biceps'
    | 'triceps'
    | 'forearms';

export type BodyRegion = 'upper' | 'lower' | 'full' | 'core';

export interface Exercise {
    id: string;
    name: string;
    description?: string;
    pattern?: MovementPattern;
    muscleGroup?: MuscleGroup;
    bodyRegion?: BodyRegion;
    category?: string; // Legacy
    muscleGroups?: string[]; // Legacy
    equipment?: string;
    tags?: string[];
    isCustom?: boolean;
    isPrimaryOneRM?: boolean;
    isBodyweight?: boolean;
    oneRMGroupId?: string;
    notes?: string;
    createdAt?: string;
    updatedAt?: string;
}

export interface ExerciseHistory {
    exerciseId: string;
    date: string;
    weight: number;
    reps: number;
    rpe?: number;
    volume: number;
    e1rm?: number;
}

// ============================================
// CALCULATIONS (Pure Functions)
// ============================================

/**
 * Calculate estimated 1RM using Brzycki formula
 */
export function calculateE1RM(weight: number, reps: number): number {
    if (reps <= 0 || weight <= 0) return 0;
    if (reps === 1) return weight;
    if (reps > 12) reps = 12; // Cap for accuracy

    return Math.round(weight * (36 / (37 - reps)));
}

/**
 * Calculate Epley formula 1RM (alternative)
 */
export function calculateEpley1RM(weight: number, reps: number): number {
    if (reps <= 0 || weight <= 0) return 0;
    if (reps === 1) return weight;

    return Math.round(weight * (1 + reps / 30));
}

/**
 * Calculate relative intensity (% of 1RM)
 */
export function calculateRelativeIntensity(weight: number, oneRM: number): number {
    if (oneRM <= 0) return 0;
    return Math.round((weight / oneRM) * 100);
}

/**
 * Suggest weight from 1RM and target percentage
 */
export function suggestWeightFromPercentage(oneRM: number, percentage: number): number {
    return Math.round((oneRM * percentage) / 100 / 2.5) * 2.5; // Round to 2.5kg
}

/**
 * Filter exercises by pattern
 */
export function filterExercisesByPattern(
    exercises: Exercise[],
    pattern: MovementPattern
): Exercise[] {
    return exercises.filter(e => e.pattern === pattern);
}

/**
 * Filter exercises by muscle group
 */
export function filterExercisesByMuscleGroup(
    exercises: Exercise[],
    muscleGroup: MuscleGroup
): Exercise[] {
    return exercises.filter(e => e.muscleGroup === muscleGroup);
}

/**
 * Search exercises by name
 */
export function searchExercises(exercises: Exercise[], query: string): Exercise[] {
    if (!query.trim()) return exercises;
    const lower = query.toLowerCase();
    return exercises.filter(e => e.name.toLowerCase().includes(lower));
}

/**
 * Get anchor exercises (1RM reference)
 */
export function getAnchorExercises(exercises: Exercise[]): Exercise[] {
    return exercises.filter(e => e.isPrimaryOneRM);
}

/**
 * Group exercises by pattern
 */
export function groupExercisesByPattern(
    exercises: Exercise[]
): Record<MovementPattern, Exercise[]> {
    const groups: Record<MovementPattern, Exercise[]> = {
        squat: [],
        hinge: [],
        push: [],
        pull: [],
        lunge: [],
        carry: [],
        rotation: [],
        core: [],
        other: [],
    };

    for (const exercise of exercises) {
        const pattern = exercise.pattern || 'other';
        groups[pattern].push(exercise);
    }

    return groups;
}

/**
 * Get exercise display info
 */
export function getExerciseDisplayInfo(exercise: Exercise): {
    patternLabel: string;
    muscleGroupLabel: string;
    tags: string[];
} {
    const patternLabels: Record<MovementPattern, string> = {
        squat: 'Sentadilla',
        hinge: 'Bisagra',
        push: 'Empuje',
        pull: 'Tirón',
        lunge: 'Zancada',
        carry: 'Acarreo',
        rotation: 'Rotación',
        core: 'Core',
        other: 'Otro',
    };

    const muscleGroupLabels: Partial<Record<MuscleGroup, string>> = {
        chest: 'Pecho',
        back: 'Espalda',
        shoulders: 'Hombros',
        arms: 'Brazos',
        legs: 'Piernas',
        core: 'Core',
        full: 'Cuerpo Completo',
        other: 'Otro',
        quads: 'Cuádriceps',
        hamstrings: 'Isquiotibiales',
        glutes: 'Glúteos',
        calves: 'Pantorrillas',
        biceps: 'Bíceps',
        triceps: 'Tríceps',
        forearms: 'Antebrazos',
    };

    return {
        patternLabel: patternLabels[exercise.pattern || 'other'],
        muscleGroupLabel: muscleGroupLabels[exercise.muscleGroup || 'other'] || 'Otro',
        tags: exercise.tags || [],
    };
}
