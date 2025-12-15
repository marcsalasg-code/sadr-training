/**
 * normalizeExercise - Phase 17A
 * 
 * Normalizes exercise records from storage to ensure typed equipment field.
 * Maps legacy string values to ExerciseEquipment enum.
 * Pure function, non-destructive.
 */

import type { Exercise, ExerciseEquipment } from './types';

/**
 * Valid equipment values
 */
const VALID_EQUIPMENT: ExerciseEquipment[] = [
    'barbell', 'dumbbell', 'kettlebell', 'machine',
    'cable', 'bodyweight', 'bands', 'smith', 'other'
];

/**
 * Equipment synonym mapping (legacy strings → typed values)
 */
const EQUIPMENT_SYNONYMS: Record<string, ExerciseEquipment> = {
    // Bodyweight variants
    'bw': 'bodyweight',
    'body': 'bodyweight',
    'bodyweight': 'bodyweight',
    'bweight': 'bodyweight',
    'peso corporal': 'bodyweight',

    // Barbell variants
    'bb': 'barbell',
    'bar': 'barbell',
    'barbell': 'barbell',
    'barra': 'barbell',

    // Dumbbell variants
    'db': 'dumbbell',
    'dumbbell': 'dumbbell',
    'dumbbells': 'dumbbell',
    'mancuerna': 'dumbbell',
    'mancuernas': 'dumbbell',

    // Kettlebell variants
    'kb': 'kettlebell',
    'kettlebell': 'kettlebell',
    'pesa rusa': 'kettlebell',

    // Cable variants
    'cables': 'cable',
    'cable': 'cable',
    'poleas': 'cable',
    'polea': 'cable',

    // Machine variants
    'machine': 'machine',
    'máquina': 'machine',
    'maquina': 'machine',

    // Bands variants
    'bands': 'bands',
    'band': 'bands',
    'resistance bands': 'bands',
    'gomas': 'bands',
    'bandas': 'bands',

    // Smith variants
    'smith': 'smith',
    'smith machine': 'smith',
    'multipower': 'smith',
};

/**
 * Normalize equipment string to typed enum
 */
function normalizeEquipment(raw: string | undefined): ExerciseEquipment {
    if (!raw) return 'other';

    const lower = raw.toLowerCase().trim();

    // Check direct synonym match
    if (EQUIPMENT_SYNONYMS[lower]) {
        return EQUIPMENT_SYNONYMS[lower];
    }

    // Check if already valid
    if (VALID_EQUIPMENT.includes(lower as ExerciseEquipment)) {
        return lower as ExerciseEquipment;
    }

    // Default
    return 'other';
}

/**
 * Normalize an exercise record from storage.
 * Ensures equipment is typed and valid.
 * Does NOT mutate input.
 */
export function normalizeExercise(exercise: Exercise): Exercise {
    // If equipment is already valid, return as-is (avoid unnecessary object creation)
    if (exercise.equipment && VALID_EQUIPMENT.includes(exercise.equipment)) {
        return exercise;
    }

    return {
        ...exercise,
        equipment: normalizeEquipment(exercise.equipment as unknown as string),
    };
}

/**
 * Normalize an array of exercises.
 */
export function normalizeExercises(exercises: Exercise[]): Exercise[] {
    return exercises.map(normalizeExercise);
}
