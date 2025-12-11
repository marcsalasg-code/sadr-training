/**
 * useSetRow - Hook for SetRow component logic
 * 
 * Extracts state management and business logic from SetRow UI component.
 * Handles weight/reps, RPE/RIR, validation, and "duplicate previous" functionality.
 */

import { useState, useCallback, useMemo } from 'react';
import { useLoadPrediction, useAIEnabled } from '../ai';
import type { SetEntry } from '../types/types';

// ============================================
// TYPES
// ============================================

export interface UseSetRowOptions {
    set: SetEntry;
    previousSets: SetEntry[];
    exerciseId: string;
    exerciseName: string;
    athleteId: string;
    exerciseHistory: Array<{ weight: number; reps: number; date: string }>;
    weightIncrement?: number;
}

export interface UseSetRowReturn {
    // State
    weight: number;
    reps: number;
    rpe: number | undefined;
    rir: number | undefined;
    intensity: number;
    notes: string;
    showExtras: boolean;
    showPrediction: boolean;

    // Actions
    setWeight: (value: number) => void;
    setReps: (value: number) => void;
    setRpe: (value: number | undefined) => void;
    setRir: (value: number | undefined) => void;
    setIntensity: (value: number) => void;
    setNotes: (value: string) => void;
    setShowExtras: (value: boolean) => void;
    setShowPrediction: (value: boolean) => void;

    // Helpers
    incrementWeight: () => void;
    decrementWeight: () => void;
    incrementReps: () => void;
    decrementReps: () => void;
    incrementIntensity: () => void;
    decrementIntensity: () => void;
    duplicatePreviousSet: () => void;
    applyPrediction: () => void;
    handleInputFocus: () => void;
    requestPrediction: () => void;
    getCompletionData: () => Partial<SetEntry>;
    getExtrasToggleText: () => string;

    // AI State
    prediction: ReturnType<typeof useLoadPrediction>['prediction'];
    isPredicting: boolean;
    hasPrediction: boolean;
    aiEnabled: boolean;
}

// ============================================
// HOOK
// ============================================

export function useSetRow(options: UseSetRowOptions): UseSetRowReturn {
    const {
        set,
        previousSets,
        exerciseId,
        exerciseName,
        athleteId,
        exerciseHistory,
        weightIncrement = 2.5,
    } = options;

    // Core state
    const [weight, setWeight] = useState(set.actualWeight || set.targetWeight || 0);
    const [reps, setReps] = useState(set.actualReps || set.targetReps || 0);
    const [rpe, setRpe] = useState<number | undefined>(set.rpe);
    const [rir, setRir] = useState<number | undefined>(set.rir);
    const [intensity, setIntensity] = useState<number>(set.intensity ?? set.rpe ?? 7);
    const [notes, setNotes] = useState<string>(set.notes || '');
    const [showExtras, setShowExtras] = useState(false);
    const [showPrediction, setShowPrediction] = useState(false);
    const [hasFocused, setHasFocused] = useState(false);

    // AI Prediction
    const aiEnabled = useAIEnabled();
    const { predict, prediction, isPredicting, isEnabled: predictionEnabled } = useLoadPrediction();

    // Get last completed set from session
    const lastCompletedSet = useMemo(() => {
        return previousSets[previousSets.length - 1] || null;
    }, [previousSets]);

    // Build prediction context
    const getPredictionContext = useCallback(() => {
        return {
            exerciseId,
            exerciseName,
            athleteId,
            previousWeight: lastCompletedSet?.actualWeight || exerciseHistory[exerciseHistory.length - 1]?.weight,
            previousReps: lastCompletedSet?.actualReps || exerciseHistory[exerciseHistory.length - 1]?.reps,
            targetReps: set.targetReps,
            previousSets: previousSets.length,
            recentHistory: exerciseHistory,
            lastRpe: lastCompletedSet?.rpe,
            lastRir: lastCompletedSet?.rir,
        };
    }, [exerciseId, exerciseName, athleteId, lastCompletedSet, exerciseHistory, set.targetReps, previousSets.length]);

    // ============================================
    // ACTIONS
    // ============================================

    const incrementWeight = useCallback(() => {
        setWeight(w => w + weightIncrement);
    }, [weightIncrement]);

    const decrementWeight = useCallback(() => {
        setWeight(w => Math.max(0, w - weightIncrement));
    }, [weightIncrement]);

    const incrementReps = useCallback(() => {
        setReps(r => r + 1);
    }, []);

    const decrementReps = useCallback(() => {
        setReps(r => Math.max(0, r - 1));
    }, []);

    const incrementIntensity = useCallback(() => {
        setIntensity(i => Math.min(10, i + 1));
    }, []);

    const decrementIntensity = useCallback(() => {
        setIntensity(i => Math.max(1, i - 1));
    }, []);

    // Duplicate values from previous set
    const duplicatePreviousSet = useCallback(() => {
        if (lastCompletedSet) {
            setWeight(lastCompletedSet.actualWeight || lastCompletedSet.targetWeight || 0);
            setReps(lastCompletedSet.actualReps || lastCompletedSet.targetReps || 0);
            if (lastCompletedSet.rpe !== undefined) setRpe(lastCompletedSet.rpe);
            if (lastCompletedSet.rir !== undefined) setRir(lastCompletedSet.rir);
        }
    }, [lastCompletedSet]);

    // Apply AI prediction
    const applyPrediction = useCallback(() => {
        if (prediction) {
            setWeight(prediction.suggestedWeight);
            setReps(prediction.suggestedReps);
            setShowPrediction(false);
        }
    }, [prediction]);

    // Request AI prediction on first focus
    const handleInputFocus = useCallback(() => {
        if (!hasFocused && !set.isCompleted && predictionEnabled && aiEnabled) {
            setHasFocused(true);
            predict(getPredictionContext());
        }
    }, [hasFocused, set.isCompleted, predictionEnabled, aiEnabled, predict, getPredictionContext]);

    // Manual prediction request
    const requestPrediction = useCallback(() => {
        if (predictionEnabled && aiEnabled && !isPredicting) {
            predict(getPredictionContext());
        }
    }, [predictionEnabled, aiEnabled, isPredicting, predict, getPredictionContext]);

    // Get data for completing the set
    const getCompletionData = useCallback((): Partial<SetEntry> => {
        return {
            actualWeight: weight,
            actualReps: reps,
            rpe: rpe ?? intensity,
            rir,
            intensity,
            notes: notes.trim() || undefined,
        };
    }, [weight, reps, rpe, rir, intensity, notes]);

    // Get toggle text for RPE/RIR extras
    const getExtrasToggleText = useCallback((): string => {
        if (rpe && rir !== undefined) return `RPE ${rpe} | RIR ${rir}`;
        if (rpe) return `RPE ${rpe}`;
        if (rir !== undefined) return `RIR ${rir}`;
        if (notes) return '📝';
        return 'RPE/RIR';
    }, [rpe, rir, notes]);

    return {
        // State
        weight,
        reps,
        rpe,
        rir,
        intensity,
        notes,
        showExtras,
        showPrediction,

        // Setters
        setWeight,
        setReps,
        setRpe,
        setRir,
        setIntensity,
        setNotes,
        setShowExtras,
        setShowPrediction,

        // Actions
        incrementWeight,
        decrementWeight,
        incrementReps,
        decrementReps,
        incrementIntensity,
        decrementIntensity,
        duplicatePreviousSet,
        applyPrediction,
        handleInputFocus,
        requestPrediction,
        getCompletionData,
        getExtrasToggleText,

        // AI
        prediction,
        isPredicting,
        hasPrediction: !!prediction,
        aiEnabled: aiEnabled && predictionEnabled,
    };
}

export default useSetRow;
