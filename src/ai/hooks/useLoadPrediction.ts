/**
 * useLoadPrediction Hook
 * Hook para predecir cargas y repeticiones en sesiones de entrenamiento
 */

import { useState, useCallback } from 'react';
import { AIEngine } from '../AIEngine';
import { useAIStore } from '../aiStore';
import type { LoadPrediction, AIRequest } from '../types';

interface PredictionContext {
    exerciseId: string;
    exerciseName: string;
    athleteId: string;
    previousWeight?: number;
    previousReps?: number;
    targetReps?: number;
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

export function useLoadPrediction(): UseLoadPredictionResult {
    const [isPredicting, setIsPredicting] = useState(false);
    const [prediction, setPrediction] = useState<LoadPrediction | null>(null);
    const [error, setError] = useState<string | null>(null);

    const settings = useAIStore((state) => state.settings);
    const isEnabled = settings.isEnabled && settings.loadPrediction;

    const predict = useCallback(async (context: PredictionContext): Promise<LoadPrediction | null> => {
        if (!isEnabled) {
            return null; // Silently skip if disabled
        }

        setIsPredicting(true);
        setError(null);

        // Construir prompt con contexto
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

        try {
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
            return null;
        } finally {
            setIsPredicting(false);
        }
    }, [isEnabled]);

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
