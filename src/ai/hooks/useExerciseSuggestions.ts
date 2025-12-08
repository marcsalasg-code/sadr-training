/**
 * useExerciseSuggestions Hook
 * Hook para obtener sugerencias de ejercicios con IA
 */

import { useState, useCallback } from 'react';
import { AIEngine } from '../AIEngine';
import { useAIStore } from '../aiStore';
import type { ExerciseSuggestion, AIRequest } from '../types';

interface SuggestionContext {
    currentExerciseNames: string[];
    sessionType?: string;
    sessionGoal?: string;
}

interface UseExerciseSuggestionsResult {
    suggest: (context: SuggestionContext) => Promise<ExerciseSuggestion[] | null>;
    suggestions: ExerciseSuggestion[];
    isLoading: boolean;
    error: string | null;
    isEnabled: boolean;
    clearSuggestions: () => void;
}

export function useExerciseSuggestions(): UseExerciseSuggestionsResult {
    const [isLoading, setIsLoading] = useState(false);
    const [suggestions, setSuggestions] = useState<ExerciseSuggestion[]>([]);
    const [error, setError] = useState<string | null>(null);

    const settings = useAIStore((state) => state.settings);
    const isEnabled = settings.isEnabled && settings.exerciseSuggestions;

    const suggest = useCallback(async (context: SuggestionContext): Promise<ExerciseSuggestion[] | null> => {
        if (!isEnabled) {
            setError('La IA está desactivada');
            return null;
        }

        setIsLoading(true);
        setError(null);

        const currentExercisesText = context.currentExerciseNames.length > 0
            ? `Ejercicios ya en la sesión: ${context.currentExerciseNames.join(', ')}`
            : 'La sesión está vacía';

        const request: AIRequest = {
            type: 'suggestion',
            prompt: `
Sugiere ejercicios complementarios para esta sesión de entrenamiento.
${currentExercisesText}
${context.sessionType ? `Tipo de sesión: ${context.sessionType}` : ''}
${context.sessionGoal ? `Objetivo: ${context.sessionGoal}` : ''}

Devuelve ejercicios que complementen los ya añadidos.
            `.trim(),
            context: {
                currentExercises: context.currentExerciseNames,
                sessionType: context.sessionType,
            },
            options: {
                temperature: 0.7,
                maxTokens: 500,
            },
        };

        try {
            const response = await AIEngine.complete<ExerciseSuggestion[]>(request);

            if (response.success && response.data) {
                setSuggestions(response.data);
                return response.data;
            } else {
                setError(response.error || 'Error al obtener sugerencias');
                return null;
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Error inesperado';
            setError(errorMessage);
            return null;
        } finally {
            setIsLoading(false);
        }
    }, [isEnabled]);

    const clearSuggestions = useCallback(() => {
        setSuggestions([]);
        setError(null);
    }, []);

    return {
        suggest,
        suggestions,
        isLoading,
        error,
        isEnabled,
        clearSuggestions,
    };
}
