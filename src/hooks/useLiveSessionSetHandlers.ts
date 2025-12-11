/**
 * useLiveSessionSetHandlers - Set operation handlers for live sessions
 * 
 * Extracted from useLiveSession to reduce hook complexity.
 * Contains handlers for completing, adding, removing, and uncompleting sets.
 * Uses domain functions from domain/sessions/workout.
 */

import { useCallback } from 'react';
import type { WorkoutSession, SetEntry, Settings } from '../types/types';
import type { useRestTimer } from './useRestTimer';
import {
    completeSet as domainCompleteSet,
    uncompleteSet as domainUncompleteSet,
    addSet as domainAddSet,
    removeSet as domainRemoveSet,
    getExerciseAtIndex,
    getSetAtIndices,
} from '../domain/sessions';

export interface UseLiveSessionSetHandlersReturn {
    handleCompleteSet: (exerciseIndex: number, setIndex: number, data: Partial<SetEntry>) => void;
    handleAddSet: (exerciseIndex: number) => void;
    handleRemoveSet: (exerciseIndex: number, setIndex: number) => void;
    handleUncompleteSet: (exerciseIndex: number, setIndex: number) => void;
}

interface SetHandlersDeps {
    session: WorkoutSession | undefined;
    updateSession: (id: string, updates: Partial<WorkoutSession>) => void;
    settings: Settings;
    restTimer: ReturnType<typeof useRestTimer>;
}

/**
 * Hook providing set operation handlers for live sessions
 */
export function useLiveSessionSetHandlers({
    session,
    updateSession,
    settings,
    restTimer,
}: SetHandlersDeps): UseLiveSessionSetHandlersReturn {

    // Complete a set with actual values
    const handleCompleteSet = useCallback((
        exerciseIndex: number,
        setIndex: number,
        data: Partial<SetEntry>
    ) => {
        if (!session) return;

        const exercise = getExerciseAtIndex(session, exerciseIndex);
        const set = getSetAtIndices(session, exerciseIndex, setIndex);
        if (!exercise || !set) return;

        const updates = domainCompleteSet(session, exercise.id, set.id, data);
        updateSession(session.id, updates);

        if (settings.autoStartRest) {
            restTimer.start(set.restSeconds || settings.defaultRestSeconds);
        }
    }, [session, updateSession, settings, restTimer]);

    // Add a new set to an exercise
    const handleAddSet = useCallback((exerciseIndex: number) => {
        if (!session) return;

        const exercise = getExerciseAtIndex(session, exerciseIndex);
        if (!exercise) return;

        const updates = domainAddSet(session, exercise.id, {
            restSeconds: settings.defaultRestSeconds,
        });
        updateSession(session.id, updates);
    }, [session, updateSession, settings]);

    // Remove a set from an exercise
    const handleRemoveSet = useCallback((exerciseIndex: number, setIndex: number) => {
        if (!session) return;

        const exercise = getExerciseAtIndex(session, exerciseIndex);
        const set = getSetAtIndices(session, exerciseIndex, setIndex);
        if (!exercise || !set) return;
        if (exercise.sets.length <= 1) return; // Don't remove last set

        const updates = domainRemoveSet(session, exercise.id, set.id);
        updateSession(session.id, updates);
    }, [session, updateSession]);

    // Uncomplete a previously completed set
    const handleUncompleteSet = useCallback((exerciseIndex: number, setIndex: number) => {
        if (!session) return;

        const exercise = getExerciseAtIndex(session, exerciseIndex);
        const set = getSetAtIndices(session, exerciseIndex, setIndex);
        if (!exercise || !set) return;

        const updates = domainUncompleteSet(session, exercise.id, set.id);
        updateSession(session.id, updates);
    }, [session, updateSession]);

    return {
        handleCompleteSet,
        handleAddSet,
        handleRemoveSet,
        handleUncompleteSet,
    };
}

export default useLiveSessionSetHandlers;
