/**
 * useSessionGenerator - Hook for AI-powered structured session generation
 * 
 * Generates workout sessions with 4 fixed blocks:
 * 1. movilidad_calentamiento
 * 2. fuerza
 * 3. tecnica_especifica
 * 4. emom_hiit
 */

import { useState, useCallback } from 'react';
import { AIEngine } from '../AIEngine';
import { useExercises, useSessions } from '../../store/store';
import { mapCatalogForPrompt, mapGeneratedToSession } from '../utils';
import type { SessionGenerationConfig, GeneratedSession, SessionGenerationResponse } from '../types';
import type { WorkoutSession, BlockType } from '../../types/types';

interface UseSessionGeneratorReturn {
    /** Generate session proposals */
    generate: (config: SessionGenerationConfig, athleteId: string, numProposals?: number) => Promise<void>;
    /** Whether generation is in progress */
    isGenerating: boolean;
    /** Generated session proposals (mapped to WorkoutSession format) */
    proposals: Omit<WorkoutSession, 'id' | 'createdAt' | 'updatedAt'>[];
    /** Raw AI response */
    rawProposals: GeneratedSession[];
    /** Error message if failed */
    error: string | null;
    /** Clear results */
    clear: () => void;
}

/**
 * Default block distribution for a 60-minute session
 */
export const DEFAULT_BLOCKS: { tipo: BlockType; tiempo_min: number }[] = [
    { tipo: 'movilidad_calentamiento', tiempo_min: 10 },
    { tipo: 'fuerza', tiempo_min: 25 },
    { tipo: 'tecnica_especifica', tiempo_min: 15 },
    { tipo: 'emom_hiit', tiempo_min: 10 },
];

/**
 * Creates default block distribution scaled to total duration
 */
export function createDefaultBlocks(totalMinutes: number): { tipo: BlockType; tiempo_min: number }[] {
    // Proportional: 17%, 42%, 25%, 16%
    const warmup = Math.round(totalMinutes * 0.17);
    const strength = Math.round(totalMinutes * 0.42);
    const technique = Math.round(totalMinutes * 0.25);
    const emom = totalMinutes - warmup - strength - technique; // Remainder

    return [
        { tipo: 'movilidad_calentamiento', tiempo_min: warmup },
        { tipo: 'fuerza', tiempo_min: strength },
        { tipo: 'tecnica_especifica', tiempo_min: technique },
        { tipo: 'emom_hiit', tiempo_min: emom },
    ];
}

export function useSessionGenerator(): UseSessionGeneratorReturn {
    const exercises = useExercises();
    const sessions = useSessions();

    const [isGenerating, setIsGenerating] = useState(false);
    const [proposals, setProposals] = useState<Omit<WorkoutSession, 'id' | 'createdAt' | 'updatedAt'>[]>([]);
    const [rawProposals, setRawProposals] = useState<GeneratedSession[]>([]);
    const [error, setError] = useState<string | null>(null);

    const generate = useCallback(async (
        config: SessionGenerationConfig,
        athleteId: string,
        numProposals: number = 1
    ) => {
        setIsGenerating(true);
        setError(null);
        setProposals([]);
        setRawProposals([]);

        try {
            // 1. Mapear catálogo al formato del prompt
            const catalog = mapCatalogForPrompt(exercises);

            // 2. Obtener ejemplos recientes del coach (últimas 3 sesiones completadas)
            const recentSessions = sessions
                .filter(s => s.status === 'completed')
                .sort((a, b) => new Date(b.completedAt || 0).getTime() - new Date(a.completedAt || 0).getTime())
                .slice(0, 3)
                .map(s => ({
                    id: s.id,
                    disciplina_global: config.disciplina_global,
                    duracion_total_min: s.durationMinutes || config.duracion_total_min,
                    nivel: config.nivel,
                    bloques: config.bloques.map(b => ({
                        tipo: b.tipo,
                        tiempo_min: b.tiempo_min,
                        ejercicios: s.exercises
                            .filter(e => e.blockType === b.tipo)
                            .map(e => ({
                                id: e.exerciseId,
                                series: e.sets.length || null,
                                reps: e.sets[0]?.targetReps || null,
                                duracion_seg: e.durationSeconds || null,
                                notas: e.notes,
                            })),
                    })),
                }));

            // 3. Construir payload
            const payload = {
                configuracion_sesion: config,
                catalogo_ejercicios: catalog,
                ejemplos_sesiones_coach: recentSessions,
                parametros_generacion: { numero_propuestas: numProposals },
            };

            // 4. Llamar a AIEngine
            const response = await AIEngine.complete<SessionGenerationResponse>({
                type: 'session_generation',
                prompt: JSON.stringify(payload),
                options: {
                    temperature: 0.7,
                    maxTokens: 4000,
                },
            });

            if (!response.success || !response.data) {
                throw new Error(response.error || 'Failed to generate session');
            }

            // 5. Validar respuesta
            if (!response.data.propuestas || !Array.isArray(response.data.propuestas)) {
                throw new Error('Invalid AI response: missing propuestas array');
            }

            // 6. Guardar raw y mapear a WorkoutSession
            setRawProposals(response.data.propuestas);

            const mapped = response.data.propuestas.map(proposal =>
                mapGeneratedToSession(proposal, athleteId, exercises)
            );

            setProposals(mapped);

        } catch (err) {
            const message = err instanceof Error ? err.message : 'Unknown error';
            setError(message);
            console.error('[useSessionGenerator] Error:', err);
        } finally {
            setIsGenerating(false);
        }
    }, [exercises, sessions]);

    const clear = useCallback(() => {
        setProposals([]);
        setRawProposals([]);
        setError(null);
    }, []);

    return {
        generate,
        isGenerating,
        proposals,
        rawProposals,
        error,
        clear,
    };
}
