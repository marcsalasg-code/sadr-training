/**
 * Exercise Core Model - Modelo unificado de ejercicios
 * 
 * Este es el modelo canónico que usa toda la aplicación.
 * TrainingConfig controla las etiquetas visibles, pero los IDs internos son fijos.
 */

// ============================================
// MOVEMENT PATTERNS (Categoría principal)
// ============================================

/**
 * Movement pattern - categoría principal de movimiento
 * Los IDs son fijos; las etiquetas visibles se configuran en TrainingConfig
 */
export type MovementPattern =
    | 'squat'       // Dominantes de rodilla
    | 'hinge'       // Dominantes de cadera
    | 'push'        // Empujes (horizontal + vertical)
    | 'pull'        // Tirones (horizontal + vertical)
    | 'core'        // Estabilidad y anti-movimiento
    | 'carry'       // Loaded carries
    | 'other';      // Otros (cardio, movilidad, etc.)

/**
 * Default labels for movement patterns (Spanish)
 */
export const DEFAULT_PATTERN_LABELS: Record<MovementPattern, string> = {
    squat: 'Sentadilla',
    hinge: 'Bisagra de cadera',
    push: 'Empuje',
    pull: 'Tirón',
    core: 'Core',
    carry: 'Acarreo',
    other: 'Otros',
};

// ============================================
// MUSCLE GROUPS (Filtro secundario)
// ============================================

/**
 * Muscle group - filtro secundario por grupo muscular
 */
export type MuscleGroup =
    | 'legs'        // Piernas (quads, hamstrings, glutes, calves)
    | 'chest'       // Pecho
    | 'back'        // Espalda
    | 'shoulders'   // Hombros
    | 'arms'        // Brazos (biceps, triceps, forearms)
    | 'full'        // Full body
    | 'other';      // Otros

/**
 * Default labels for muscle groups (Spanish)
 */
export const DEFAULT_MUSCLE_GROUP_LABELS: Record<MuscleGroup, string> = {
    legs: 'Piernas',
    chest: 'Pecho',
    back: 'Espalda',
    shoulders: 'Hombros',
    arms: 'Brazos',
    full: 'Full Body',
    other: 'Otros',
};

// ============================================
// EXERCISE MODEL
// ============================================

/**
 * Exercise - Modelo unificado de ejercicio
 * 
 * Campos críticos:
 * - pattern: categoría principal (squat, hinge, push, pull, core, carry, other)
 * - muscleGroup: grupo muscular principal (filtro secundario)
 * - tags: metadatos flexibles para búsquedas avanzadas
 */
export interface Exercise {
    id: string;
    name: string;
    description?: string;

    // === CATEGORIZACIÓN ===
    pattern: MovementPattern;           // Categoría principal
    muscleGroup: MuscleGroup;           // Grupo muscular principal
    tags: string[];                     // Tags flexibles: ['compound', 'bilateral', 'barbell']

    // === METADATOS ===
    equipment?: string;                 // 'barbell', 'dumbbell', 'cable', 'machine', 'bodyweight'
    videoUrl?: string;
    imageUrl?: string;
    instructions?: string;
    isCustom: boolean;                  // Creado por usuario vs predefinido

    // === BODYWEIGHT & 1RM ===
    isBodyweight?: boolean;             // Dominadas, fondos, etc.
    allowsLoadedWeight?: boolean;       // Permite añadir lastre
    isPrimaryOneRM?: boolean;           // Es ejercicio ancla de 1RM
    oneRMGroupId?: string;              // Grupo lógico: 'squat_pattern', 'horizontal_push'

    // === TIMESTAMPS ===
    createdAt: string;
    updatedAt: string;
}

// ============================================
// HELPERS
// ============================================

/**
 * Create a new exercise with defaults
 */
export function createExercise(
    data: Omit<Exercise, 'id' | 'createdAt' | 'updatedAt' | 'tags'> & { tags?: string[] }
): Omit<Exercise, 'id' | 'createdAt' | 'updatedAt'> {
    return {
        ...data,
        tags: data.tags || [],
    };
}

/**
 * Infer pattern from exercise name (for migration)
 */
export function inferPatternFromName(name: string): MovementPattern {
    const lower = name.toLowerCase();

    // Squat patterns
    if (/squat|sentadilla|goblet|leg press|lunge|zancada|pistol|step.?up|split.?squat/i.test(lower)) {
        return 'squat';
    }

    // Hinge patterns
    if (/deadlift|peso muerto|hip.?thrust|swing|rdl|romanian|good.?morning|glute.?bridge|hip.?extension/i.test(lower)) {
        return 'hinge';
    }

    // Push patterns
    if (/press|push|bench|pecho|dip|fondo|fly|cable.?cross|shoulder|ohp|overhead|militar/i.test(lower)) {
        return 'push';
    }

    // Pull patterns
    if (/row|pull|chin|dominada|lat|face.?pull|curl|bicep|dorsal|remo|jalon/i.test(lower)) {
        return 'pull';
    }

    // Core patterns
    if (/plank|plancha|crunch|ab|core|oblique|dead.?bug|bird.?dog|hollow|pallof|anti/i.test(lower)) {
        return 'core';
    }

    // Carry patterns
    if (/carry|farmer|suitcase|waiter|loaded|caminar/i.test(lower)) {
        return 'carry';
    }

    return 'other';
}

/**
 * Infer muscle group from exercise name (for migration)
 */
export function inferMuscleGroupFromName(name: string): MuscleGroup {
    const lower = name.toLowerCase();

    // Legs
    if (/squat|leg|pierna|quad|hamstring|glute|calf|lunge|step|extension|curl.*leg/i.test(lower)) {
        return 'legs';
    }

    // Chest
    if (/bench|chest|pecho|fly|press.*pec|dip/i.test(lower)) {
        return 'chest';
    }

    // Back
    if (/row|pull|lat|dorsal|espalda|deadlift|back/i.test(lower)) {
        return 'back';
    }

    // Shoulders
    if (/shoulder|hombro|delt|lateral|rear|front.*raise|ohp|military|overhead/i.test(lower)) {
        return 'shoulders';
    }

    // Arms
    if (/bicep|tricep|curl|extension.*arm|hammer|preacher|skull|brazo/i.test(lower)) {
        return 'arms';
    }

    // Full body
    if (/clean|snatch|thruster|burpee|turkish|full.*body/i.test(lower)) {
        return 'full';
    }

    return 'other';
}

/**
 * All movement patterns
 */
export const ALL_PATTERNS: MovementPattern[] = [
    'squat', 'hinge', 'push', 'pull', 'core', 'carry', 'other'
];

/**
 * All muscle groups
 */
export const ALL_MUSCLE_GROUPS: MuscleGroup[] = [
    'legs', 'chest', 'back', 'shoulders', 'arms', 'full', 'other'
];
