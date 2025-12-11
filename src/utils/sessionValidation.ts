/**
 * Session Validation - Validaciones y sanitización de sesiones
 * 
 * Evita datos corruptos validando sesiones antes de guardar.
 * Maneja casos límite como RM=0, sesiones vacías, etc.
 */

import type { WorkoutSession, ExerciseEntry, SetEntry } from '../types/types';

// ============================================
// VALIDATION TYPES
// ============================================

export interface ValidationResult {
    isValid: boolean;
    errors: ValidationError[];
    warnings: ValidationWarning[];
}

export interface ValidationError {
    code: string;
    message: string;
    field?: string;
}

export interface ValidationWarning {
    code: string;
    message: string;
    field?: string;
}

// ============================================
// VALIDATION FUNCTIONS
// ============================================

/**
 * Validate a session before saving
 * Returns errors that must be fixed and warnings that are advisory
 */
export function validateSession(session: WorkoutSession): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Required: Session must have at least one exercise
    if (!session.exercises || session.exercises.length === 0) {
        errors.push({
            code: 'EMPTY_SESSION',
            message: 'La sesión debe tener al menos un ejercicio',
            field: 'exercises',
        });
    }

    // Validate each exercise
    session.exercises?.forEach((exercise, exIndex) => {
        const exErrors = validateExercise(exercise, exIndex);
        errors.push(...exErrors.errors);
        warnings.push(...exErrors.warnings);
    });

    // Warning: Session without completed sets
    const completedSets = session.exercises?.reduce(
        (acc, ex) => acc + ex.sets.filter(s => s.isCompleted).length,
        0
    ) || 0;

    if (completedSets === 0 && session.status === 'completed') {
        warnings.push({
            code: 'NO_COMPLETED_SETS',
            message: 'La sesión está marcada como completada pero no tiene series completadas',
        });
    }

    // Warning: Invalid pre-session fatigue
    if (session.preSessionFatigue !== null &&
        session.preSessionFatigue !== undefined &&
        (session.preSessionFatigue < 1 || session.preSessionFatigue > 10)) {
        warnings.push({
            code: 'INVALID_FATIGUE',
            message: 'La fatiga pre-sesión debe estar entre 1 y 10',
            field: 'preSessionFatigue',
        });
    }

    return {
        isValid: errors.length === 0,
        errors,
        warnings,
    };
}

/**
 * Validate a single exercise entry
 */
function validateExercise(exercise: ExerciseEntry, index: number): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    const prefix = `exercises[${index}]`;

    // Required: Exercise must have at least one set
    if (!exercise.sets || exercise.sets.length === 0) {
        errors.push({
            code: 'EMPTY_EXERCISE',
            message: `El ejercicio ${index + 1} debe tener al menos una serie`,
            field: `${prefix}.sets`,
        });
    }

    // Required: Exercise must have a valid exerciseId
    if (!exercise.exerciseId) {
        errors.push({
            code: 'MISSING_EXERCISE_ID',
            message: `El ejercicio ${index + 1} no tiene ID de ejercicio`,
            field: `${prefix}.exerciseId`,
        });
    }

    // Validate each set
    exercise.sets?.forEach((set, setIndex) => {
        const setErrors = validateSet(set, index, setIndex);
        errors.push(...setErrors.errors);
        warnings.push(...setErrors.warnings);
    });

    return { isValid: errors.length === 0, errors, warnings };
}

/**
 * Validate a single set entry
 */
function validateSet(set: SetEntry, exIndex: number, setIndex: number): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    const prefix = `exercises[${exIndex}].sets[${setIndex}]`;

    // Warning: Completed set with 0 weight (might be intentional for bodyweight)
    if (set.isCompleted && set.actualWeight === 0 && set.actualReps && set.actualReps > 0) {
        warnings.push({
            code: 'ZERO_WEIGHT',
            message: `Serie ${setIndex + 1} tiene 0kg de peso (¿ejercicio con peso corporal?)`,
            field: `${prefix}.actualWeight`,
        });
    }

    // Warning: Completed set with 0 reps
    if (set.isCompleted && (set.actualReps === 0 || set.actualReps === undefined)) {
        warnings.push({
            code: 'ZERO_REPS',
            message: `Serie ${setIndex + 1} tiene 0 repeticiones`,
            field: `${prefix}.actualReps`,
        });
    }

    // Warning: RPE/Intensity out of range
    if (set.rpe !== undefined && (set.rpe < 1 || set.rpe > 10)) {
        warnings.push({
            code: 'INVALID_RPE',
            message: `Serie ${setIndex + 1} tiene RPE fuera de rango (1-10)`,
            field: `${prefix}.rpe`,
        });
    }

    if (set.intensity !== undefined && (set.intensity < 1 || set.intensity > 10)) {
        warnings.push({
            code: 'INVALID_INTENSITY',
            message: `Serie ${setIndex + 1} tiene intensidad fuera de rango (1-10)`,
            field: `${prefix}.intensity`,
        });
    }

    return { isValid: errors.length === 0, errors, warnings };
}

// ============================================
// SANITIZATION FUNCTIONS
// ============================================

/**
 * Sanitize session data before saving
 * Fixes common issues and normalizes values
 */
export function sanitizeSession(session: WorkoutSession): WorkoutSession {
    return {
        ...session,
        exercises: session.exercises.map(sanitizeExercise),
        // Normalize optional fields
        preSessionFatigue: normalizeIntensityValue(session.preSessionFatigue),
        avgIntensity: normalizeIntensityValue(session.avgIntensity),
        // Ensure updatedAt is current
        updatedAt: new Date().toISOString(),
    };
}

/**
 * Sanitize a single exercise entry
 */
function sanitizeExercise(exercise: ExerciseEntry): ExerciseEntry {
    return {
        ...exercise,
        sets: exercise.sets.map(sanitizeSet),
    };
}

/**
 * Sanitize a single set entry
 */
function sanitizeSet(set: SetEntry): SetEntry {
    return {
        ...set,
        // Ensure numeric values are positive or undefined
        actualWeight: set.actualWeight !== undefined ? Math.max(0, set.actualWeight) : undefined,
        actualReps: set.actualReps !== undefined ? Math.max(0, set.actualReps) : undefined,
        targetWeight: set.targetWeight !== undefined ? Math.max(0, set.targetWeight) : undefined,
        targetReps: set.targetReps !== undefined ? Math.max(0, set.targetReps) : undefined,
        // Normalize RPE to 1-10 range
        rpe: normalizeIntensityValue(set.rpe),
        intensity: normalizeIntensityValue(set.intensity),
    };
}

/**
 * Normalize intensity/RPE value to 1-10 range
 */
function normalizeIntensityValue(value: number | null | undefined): number | undefined {
    if (value === null || value === undefined) return undefined;
    return Math.max(1, Math.min(10, value));
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Check if session can be marked as completed
 */
export function canCompleteSession(session: WorkoutSession): { canComplete: boolean; reason?: string } {
    if (!session.exercises || session.exercises.length === 0) {
        return { canComplete: false, reason: 'La sesión no tiene ejercicios' };
    }

    const completedSets = session.exercises.reduce(
        (acc, ex) => acc + ex.sets.filter(s => s.isCompleted).length,
        0
    );

    if (completedSets === 0) {
        return { canComplete: false, reason: 'No hay series completadas' };
    }

    return { canComplete: true };
}

/**
 * Calculate safe 1RM (handles edge cases)
 * Returns null if calculation is not possible
 */
export function safeCaculateE1RM(weight: number, reps: number): number | null {
    // Handle edge cases
    if (!weight || weight <= 0) return null;
    if (!reps || reps <= 0) return null;
    if (reps > 30) return null; // Formula unreliable above 30 reps

    // Brzycki formula: 1RM = weight × (36 / (37 - reps))
    const e1rm = weight * (36 / (37 - reps));

    // Sanity check
    if (!isFinite(e1rm) || e1rm < weight) return null;

    return Math.round(e1rm * 10) / 10; // Round to 1 decimal
}
