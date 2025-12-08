/**
 * useTemplateGenerator Hook
 * Hook para generar plantillas de entrenamiento con IA
 */

import { useState, useCallback } from 'react';
import { AIEngine } from '../AIEngine';
import { useAIStore } from '../aiStore';
import type { GeneratedTemplate, AIRequest } from '../types';

interface UseTemplateGeneratorResult {
    generate: (prompt: string) => Promise<GeneratedTemplate | null>;
    isGenerating: boolean;
    error: string | null;
    lastGenerated: GeneratedTemplate | null;
    isEnabled: boolean;
}

export function useTemplateGenerator(): UseTemplateGeneratorResult {
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [lastGenerated, setLastGenerated] = useState<GeneratedTemplate | null>(null);

    const settings = useAIStore((state) => state.settings);
    const isEnabled = settings.isEnabled && settings.templateGeneration;

    const generate = useCallback(async (prompt: string): Promise<GeneratedTemplate | null> => {
        if (!isEnabled) {
            setError('La generación de plantillas con IA está desactivada');
            return null;
        }

        if (!prompt.trim()) {
            setError('Por favor, describe la plantilla que quieres generar');
            return null;
        }

        setIsGenerating(true);
        setError(null);

        const request: AIRequest = {
            type: 'generation',
            prompt: `Genera una plantilla de entrenamiento basada en esta descripción: ${prompt}`,
            options: {
                temperature: 0.7,
                maxTokens: 1500,
            },
        };

        try {
            const response = await AIEngine.complete<GeneratedTemplate>(request);

            if (response.success && response.data) {
                setLastGenerated(response.data);
                return response.data;
            } else {
                setError(response.error || 'Error desconocido al generar plantilla');
                return null;
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Error inesperado';
            setError(errorMessage);
            return null;
        } finally {
            setIsGenerating(false);
        }
    }, [isEnabled]);

    return {
        generate,
        isGenerating,
        error,
        lastGenerated,
        isEnabled,
    };
}
