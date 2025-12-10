/**
 * useLoadPrediction Hook
 * Hook para predecir cargas en sesiones de entrenamiento
 * 
 * REFACTORED: Now uses AIOrchestrator.checkPerformance for centralized validation.
 * Falls back to direct AI call only for text-based predictions.
 */

import { useState, useCallback } from 'react';
import { aiOrchestrator } from '../AIOrchestrator';
import { AIEngine } from '../AIEngine';
import { useAIStore } from '../aiStore';
import { useAthletes, useExercises } from '../../store/store';
import type { LoadPrediction, AIRequest } from '../types';

// ============================================
// TYPES
// ============================================

interface PredictionContext {
    exerciseId: string;
    exerciseName: string;
    athleteId: string;
    previousWeight?: number;
    previousReps?: number;
    targetReps?: number;
    targetRPE?: number;
    previousSets?: number;
    // Historial para mejor predicción
    recentHistory?: Array<{
        weight: number;
        reps: number;
        rpe?: number;
        date: string;
    }>;
}

interface UseLoadPredictionResult {
    predict: (context: PredictionContext) => Promise<LoadPrediction | null>;
    isPredicting: boolean;
    prediction: LoadPrediction | null;
    error: string | null;
    isEnabled: boolean;
    clearPrediction: () => void;
}

// ============================================
// HOOK
// ============================================

export function useLoadPrediction(): UseLoadPredictionResult {
    const [isPredicting, setIsPredicting] = useState(false);
    const [prediction, setPrediction] = useState<LoadPrediction | null>(null);
    const [error, setError] = useState<string | null>(null);

    const settings = useAIStore((state) => state.settings);
    const athletes = useAthletes();
    const exercises = useExercises();
    const isEnabled = settings.isEnabled && settings.loadPrediction;

    const predict = useCallback(async (context: PredictionContext): Promise<LoadPrediction | null> => {
        if (!isEnabled) {
            return null; // Silently skip if disabled
        }

        setIsPredicting(true);
        setError(null);

        try {
            // Find athlete and exercise for orchestrator
            const athlete = athletes.find(a => a.id === context.athleteId);
            const exercise = exercises.find(e => e.id === context.exerciseId);

            // If we have enough context, use the orchestrator
            if (athlete && context.targetReps && context.targetRPE) {
                // Calculate weekly volumes from history
                const weeklyVolumes = context.recentHistory?.length
                    ? [context.recentHistory.reduce((sum, h) => sum + (h.weight * h.reps), 0)]
                    : [0];

                // Calculate recent intensity from history
                const recentIntensity = context.recentHistory
                    ?.filter(h => h.rpe !== undefined)
                    .map(h => h.rpe as number) || [];

                const result = aiOrchestrator.checkPerformance({
                    weeklyVolumes,
                    recentIntensity,
                    sessionsPerWeek: 3, // Default estimate
                    averageIntensity: recentIntensity.length > 0
                        ? recentIntensity.reduce((a, b) => a + b, 0) / recentIntensity.length
                        : 7,
                    exerciseId: context.exerciseId,
                    targetReps: context.targetReps,
                    targetRPE: context.targetRPE,
                    athlete,
                    exercises: exercise ? [exercise] : [],
                });

                if (result.success && result.data?.loadSuggestion) {
                    const loadSuggestion = result.data.loadSuggestion;
                    const loadPrediction: LoadPrediction = {
                        suggestedWeight: loadSuggestion.weight,
                        suggestedReps: loadSuggestion.reps,
                        confidence: loadSuggestion.confidence,
                        reasoning: `Based on ${loadSuggestion.basedOn} 1RM data`,
                        basedOn: {
                            previousSets: 1,
                            trend: 'stable',
                        },
                    };
                    setPrediction(loadPrediction);
                    return loadPrediction;
                }
            }

            // Fallback: use AIEngine directly for text-based prediction
            const historyText = context.recentHistory?.length
                ? `Historial reciente: ${context.recentHistory.map(h => `${h.weight}kg x ${h.reps}`).join(', ')}`
                : 'Sin historial previo';

            const request: AIRequest = {
                type: 'prediction',
                prompt: `
Ejercicio: ${context.exerciseName}
Peso anterior: ${context.previousWeight ?? 'N/A'}kg
Reps anteriores: ${context.previousReps ?? 'N/A'}
Reps objetivo: ${context.targetReps ?? 10}
${historyText}

Sugiere peso y repeticiones para la siguiente serie.
                `.trim(),
                context: {
                    exerciseId: context.exerciseId,
                    athleteId: context.athleteId,
                    previousWeight: context.previousWeight,
                    previousReps: context.previousReps,
                    targetReps: context.targetReps,
                    previousSets: context.previousSets,
                },
                options: {
                    temperature: 0.3, // Más determinístico para predicciones
                    maxTokens: 300,
                },
            };

            const response = await AIEngine.complete<LoadPrediction>(request);

            if (response.success && response.data) {
                setPrediction(response.data);
                return response.data;
            } else {
                setError(response.error || 'Error en predicción');
                return null;
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Error inesperado';
            setError(errorMessage);
            console.error('[useLoadPrediction] Error:', err);
            return null;
        } finally {
            setIsPredicting(false);
        }
    }, [isEnabled, athletes, exercises]);

    const clearPrediction = useCallback(() => {
        setPrediction(null);
        setError(null);
    }, []);

    return {
        predict,
        isPredicting,
        prediction,
        error,
        isEnabled,
        clearPrediction,
    };
}
