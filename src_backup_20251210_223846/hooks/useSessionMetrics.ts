/**
 * useSessionMetrics - Hook para cálculo de métricas de sesión
 * 
 * Provee acceso fácil al motor core de métricas con tipos correctos.
 * Convierte SetEntry[] de una sesión a ExecutedSet[] para el motor.
 */

import { useMemo } from 'react';
import type { WorkoutSession, SetEntry } from '../types/types';
import {
    computeSessionStats,
    computeTopSetLoadKg,
    computeBestE1RM,
    computeSessionVolumeKg,
    computeAverageRPE,
    formatVolume,
    type ExecutedSet,
    type SessionStats,
} from '../core/analysis/metrics';
import type { OneRMMethod, VolumeDisplay } from '../core/config/trainingConfig.model';
import { useTrainingStore } from '../store/store';

/**
 * Convert session sets to ExecutedSet format for metrics engine
 */
function convertToExecutedSets(session: WorkoutSession): ExecutedSet[] {
    const sets: ExecutedSet[] = [];

    for (const exercise of session.exercises) {
        for (const set of exercise.sets) {
            if (set.isCompleted && set.actualReps && set.actualWeight !== undefined) {
                sets.push({
                    id: set.id,
                    exerciseId: exercise.exerciseId,
                    blockId: set.blockId || exercise.blockId,
                    actualReps: set.actualReps,
                    actualLoadKg: set.actualWeight,
                    actualRPE: set.rpe ?? set.intensity,
                    isWarmup: set.type === 'warmup',
                });
            }
        }
    }

    return sets;
}

/**
 * Hook para calcular métricas de una sesión individual
 */
export function useSessionMetrics(session: WorkoutSession | null) {
    const trainingConfig = useTrainingStore((s) => s.trainingConfig);
    const oneRMMethod = trainingConfig.analysis.defaultRMMethod;
    const volumeDisplay = trainingConfig.analysis.showVolumeAs;

    return useMemo(() => {
        if (!session) {
            return {
                executedSets: [],
                stats: null,
                topSetLoad: null,
                bestE1RM: null,
                totalVolume: 0,
                avgRPE: null,
                formattedVolume: '0 kg',
            };
        }

        const executedSets = convertToExecutedSets(session);
        const stats = computeSessionStats(executedSets, oneRMMethod);

        return {
            executedSets,
            stats,
            topSetLoad: stats.topSetLoad,
            bestE1RM: stats.bestE1RM,
            totalVolume: stats.totalVolume,
            avgRPE: stats.avgRPE,
            formattedVolume: formatVolume(stats.totalVolume, volumeDisplay),
        };
    }, [session, oneRMMethod, volumeDisplay]);
}

/**
 * Hook para calcular métricas de múltiples sesiones
 */
export function useMultiSessionMetrics(sessions: WorkoutSession[]) {
    const trainingConfig = useTrainingStore((s) => s.trainingConfig);
    const oneRMMethod = trainingConfig.analysis.defaultRMMethod;
    const volumeDisplay = trainingConfig.analysis.showVolumeAs;

    return useMemo(() => {
        const allSets: ExecutedSet[] = [];
        const sessionStats: Map<string, SessionStats> = new Map();

        for (const session of sessions) {
            const sets = convertToExecutedSets(session);
            allSets.push(...sets);
            sessionStats.set(session.id, computeSessionStats(sets, oneRMMethod));
        }

        const totalVolume = computeSessionVolumeKg(allSets);
        const avgRPE = computeAverageRPE(allSets);
        const bestE1RM = computeBestE1RM(allSets, oneRMMethod);
        const topSetLoad = computeTopSetLoadKg(allSets);

        return {
            totalSessions: sessions.length,
            totalSets: allSets.length,
            totalVolume,
            formattedVolume: formatVolume(totalVolume, volumeDisplay),
            avgRPE,
            bestE1RM,
            topSetLoad,
            bySession: sessionStats,
        };
    }, [sessions, oneRMMethod, volumeDisplay]);
}

// Re-export types for convenience
export type { ExecutedSet, SessionStats };
