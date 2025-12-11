/**
 * Domain Layer - Sessions / Workout
 * 
 * Pure functions for mutating workout sessions.
 * All functions return a new session (immutable).
 * No React/Zustand dependencies.
 * 
 * PHASE 4: Extracted from useLiveSession handlers
 */

import type { WorkoutSession, ExerciseEntry, SetEntry } from '../../types/types';

// ============================================
// TYPES
// ============================================

/**
 * Data for completing a set
 */
export interface CompleteSetData {
    actualWeight?: number;
    actualReps?: number;
    rpe?: number;
    rir?: number;
    intensity?: number;
    notes?: string;
}

/**
 * Defaults for a new set
 */
export interface NewSetDefaults {
    targetReps?: number;
    targetWeight?: number;
    restSeconds?: number;
    type?: SetEntry['type'];
}

/**
 * Session lifecycle update data
 */
export interface SessionStatusUpdate {
    status: WorkoutSession['status'];
    startedAt?: string;
    completedAt?: string;
    totalVolume?: number;
    durationMinutes?: number;
}

// ============================================
// SET OPERATIONS
// ============================================

/**
 * Complete a set in a session
 * Returns a new session with the updated set
 */
export function completeSet(
    session: WorkoutSession,
    exerciseId: string,
    setId: string,
    data: CompleteSetData
): Partial<WorkoutSession> {
    const exercises = session.exercises.map(exercise => {
        if (exercise.id !== exerciseId) return exercise;

        return {
            ...exercise,
            sets: exercise.sets.map(set => {
                if (set.id !== setId) return set;

                return {
                    ...set,
                    ...data,
                    isCompleted: true,
                    completedAt: new Date().toISOString(),
                };
            }),
        };
    });

    return { exercises };
}

/**
 * Uncomplete a set (revert to pending)
 */
export function uncompleteSet(
    session: WorkoutSession,
    exerciseId: string,
    setId: string
): Partial<WorkoutSession> {
    const exercises = session.exercises.map(exercise => {
        if (exercise.id !== exerciseId) return exercise;

        return {
            ...exercise,
            sets: exercise.sets.map(set => {
                if (set.id !== setId) return set;

                return {
                    ...set,
                    isCompleted: false,
                    completedAt: undefined,
                    actualWeight: undefined,
                    actualReps: undefined,
                };
            }),
        };
    });

    return { exercises };
}

/**
 * Add a new set to an exercise
 */
export function addSet(
    session: WorkoutSession,
    exerciseId: string,
    defaults: NewSetDefaults = {}
): Partial<WorkoutSession> {
    const exercises = session.exercises.map(exercise => {
        if (exercise.id !== exerciseId) return exercise;

        const lastSet = exercise.sets[exercise.sets.length - 1];
        const newSet: SetEntry = {
            id: crypto.randomUUID(),
            setNumber: exercise.sets.length + 1,
            type: defaults.type || 'working',
            targetReps: defaults.targetReps || lastSet?.targetReps || 10,
            targetWeight: defaults.targetWeight || lastSet?.actualWeight || lastSet?.targetWeight || 0,
            restSeconds: defaults.restSeconds || lastSet?.restSeconds || 90,
            isCompleted: false,
        };

        return {
            ...exercise,
            sets: [...exercise.sets, newSet],
        };
    });

    return { exercises };
}

/**
 * Remove a set from an exercise
 */
export function removeSet(
    session: WorkoutSession,
    exerciseId: string,
    setId: string
): Partial<WorkoutSession> {
    const exercises = session.exercises.map(exercise => {
        if (exercise.id !== exerciseId) return exercise;

        // Don't allow removing last set
        if (exercise.sets.length <= 1) return exercise;

        const filteredSets = exercise.sets
            .filter(set => set.id !== setId)
            .map((set, i) => ({ ...set, setNumber: i + 1 }));

        return {
            ...exercise,
            sets: filteredSets,
        };
    });

    return { exercises };
}

// ============================================
// EXERCISE OPERATIONS
// ============================================

/**
 * Add an exercise to a session
 */
export function addExerciseToSession(
    session: WorkoutSession,
    exerciseId: string,
    defaults: NewSetDefaults = {}
): Partial<WorkoutSession> {
    const newExercise: ExerciseEntry = {
        id: crypto.randomUUID(),
        exerciseId,
        order: session.exercises.length,
        sets: [{
            id: crypto.randomUUID(),
            setNumber: 1,
            type: defaults.type || 'working',
            targetReps: defaults.targetReps || 10,
            targetWeight: defaults.targetWeight,
            restSeconds: defaults.restSeconds || 90,
            isCompleted: false,
        }],
    };

    return {
        exercises: [...session.exercises, newExercise],
    };
}

/**
 * Remove an exercise from a session
 */
export function removeExerciseFromSession(
    session: WorkoutSession,
    exerciseId: string
): Partial<WorkoutSession> {
    const exercises = session.exercises
        .filter(ex => ex.id !== exerciseId)
        .map((ex, i) => ({ ...ex, order: i }));

    return { exercises };
}

/**
 * Reorder exercises in a session
 */
export function reorderExercises(
    session: WorkoutSession,
    exerciseId: string,
    newIndex: number
): Partial<WorkoutSession> {
    const exercises = [...session.exercises];
    const currentIndex = exercises.findIndex(ex => ex.id === exerciseId);

    if (currentIndex === -1 || currentIndex === newIndex) {
        return { exercises };
    }

    const [removed] = exercises.splice(currentIndex, 1);
    exercises.splice(newIndex, 0, removed);

    // Update order property
    const updatedExercises = exercises.map((ex, i) => ({ ...ex, order: i }));

    return { exercises: updatedExercises };
}

// ============================================
// SESSION LIFECYCLE
// ============================================

/**
 * Start a session (transition from planned to in_progress)
 */
export function startSession(session: WorkoutSession): Partial<WorkoutSession> {
    if (session.status !== 'planned') {
        return {}; // Already started or completed
    }

    return {
        status: 'in_progress',
        startedAt: new Date().toISOString(),
    };
}

/**
 * Finish a session (transition from in_progress to completed)
 */
export function finishSession(
    session: WorkoutSession,
    stats?: {
        totalVolume?: number;
        durationMinutes?: number;
        avgIntensity?: number;
    }
): Partial<WorkoutSession> {
    if (session.status !== 'in_progress') {
        return {}; // Not in progress
    }

    return {
        status: 'completed',
        completedAt: new Date().toISOString(),
        totalVolume: stats?.totalVolume,
        durationMinutes: stats?.durationMinutes,
        avgIntensity: stats?.avgIntensity,
    };
}

/**
 * Cancel a session
 */
export function cancelSession(session: WorkoutSession): Partial<WorkoutSession> {
    return {
        status: 'cancelled',
    };
}

// ============================================
// CALCULATIONS
// ============================================

/**
 * Calculate session volume from exercises
 */
export function calculateSessionVolume(session: WorkoutSession): number {
    return session.exercises.reduce((total, exercise) => {
        return total + exercise.sets.reduce((setTotal, set) => {
            if (!set.isCompleted) return setTotal;
            const weight = set.actualWeight || 0;
            const reps = set.actualReps || 0;
            return setTotal + (weight * reps);
        }, 0);
    }, 0);
}

/**
 * Calculate completed sets count
 */
export function calculateCompletedSets(session: WorkoutSession): number {
    return session.exercises.reduce((total, exercise) => {
        return total + exercise.sets.filter(set => set.isCompleted).length;
    }, 0);
}

/**
 * Calculate total sets count
 */
export function calculateTotalSets(session: WorkoutSession): number {
    return session.exercises.reduce((total, exercise) => {
        return total + exercise.sets.length;
    }, 0);
}

/**
 * Calculate session progress percentage
 */
export function calculateSessionProgress(session: WorkoutSession): number {
    const total = calculateTotalSets(session);
    if (total === 0) return 0;
    const completed = calculateCompletedSets(session);
    return Math.round((completed / total) * 100);
}

/**
 * Get exercise by index - helper for handlers that work with indices
 */
export function getExerciseAtIndex(
    session: WorkoutSession,
    index: number
): ExerciseEntry | undefined {
    return session.exercises[index];
}

/**
 * Get set by indices - helper for handlers that work with indices
 */
export function getSetAtIndices(
    session: WorkoutSession,
    exerciseIndex: number,
    setIndex: number
): SetEntry | undefined {
    return session.exercises[exerciseIndex]?.sets[setIndex];
}
