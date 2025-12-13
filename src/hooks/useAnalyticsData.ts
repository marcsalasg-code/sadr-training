/**
 * useAnalyticsData - Hook para datos y métricas de Analytics
 * 
 * Extrae la lógica de cálculo de AnalyticsView.tsx:
 * - Filtro de sesiones por tiempo y atleta
 * - Métricas principales (volumen, sets, duración)
 * - Volumen semanal
 * - Top ejercicios
 * - Session log
 * - 1RM y intensity metrics (now from core engine)
 * 
 * PHASE 6: Refactored to use domain functions for analytics (LT5)
 */

import { useMemo, useState } from 'react';
import { useSessions, useAthletes, useExercises, useTrainingPlans, useTrainingStore } from '../store/store';
import { getSessionLog } from '../utils/sessionLog';
import { getWeeklyIntensityFatigue } from '../core/analysis/metrics';
import {
    calculateTotalVolume,
    calculateTotalDuration,
    calculateAvgDuration,
} from '../utils/dashboardMetrics';
import {
    computeSessionVolumeKg,
    computeAverageRPE,
    computeBestE1RM,
    computeTopSetLoadKg,
    formatVolume,
    type ExecutedSet,
} from '../core/analysis/metrics';
import {
    getCompletedSessions,
    filterSessionsByAthlete,
    filterSessionsByDateRange,
} from '../domain/sessions';
// PHASE 6: Use domain functions for analytics (LT5)
import {
    getWeeklyVolumeSeries,
    getTopExercisesByVolume,
} from '../domain/performance/metrics';
import type { WorkoutSession, Athlete, Exercise, TrainingPlan } from '../types/types';

// ============================================
// TYPES
// ============================================

export interface AnalyticsMetrics {
    totalVolume: number;
    totalSets: number;
    totalReps: number;
    totalDuration: number;
    avgVolume: number;
    avgDuration: number;
    sessionCount: number;
}

export interface TopExercise {
    id: string;
    name: string;
    volume: number;
    sets: number;
}

export interface WeeklyIntensityFatigueData {
    avgIntensity: number | null;
    avgFatigue: number | null;
    count: number;
}

/**
 * Core metrics from metrics engine
 */
export interface AnalyticsCoreMetrics {
    totalVolume: number;
    volumeFormatted: string;
    topSetLoad: number | null;
    bestE1RM: number | null;
    avgRPE: number | null;
    workingSets: number;
}

export interface UseAnalyticsDataReturn {
    // State
    selectedAthlete: string;
    setSelectedAthlete: (id: string) => void;
    timeRange: string;
    setTimeRange: (range: string) => void;

    // Filtered data
    filteredSessions: WorkoutSession[];

    // Calculations
    metrics: AnalyticsMetrics;
    coreMetrics: AnalyticsCoreMetrics;
    weeklyVolume: [string, number][];
    maxWeekVolume: number;
    topExercises: TopExercise[];
    sessionLog: ReturnType<typeof getSessionLog>;
    weeklyIntensityFatigue: WeeklyIntensityFatigueData;

    // Reference data
    athletes: Athlete[];
    exercises: Exercise[];
    sessions: WorkoutSession[];
    trainingPlans: TrainingPlan[];
}

// ============================================
// HOOK IMPLEMENTATION
// ============================================

export function useAnalyticsData(): UseAnalyticsDataReturn {
    const sessions = useSessions();
    const athletes = useAthletes();
    const exercises = useExercises();
    const trainingPlans = useTrainingPlans();

    // Filter state
    const [selectedAthlete, setSelectedAthlete] = useState<string>('all');
    const [timeRange, setTimeRange] = useState<string>('month');

    // Filter sessions by time range and athlete - using domain layer
    const filteredSessions = useMemo(() => {
        let cutoff = new Date();
        if (timeRange === 'week') cutoff.setDate(cutoff.getDate() - 7);
        else if (timeRange === 'month') cutoff.setMonth(cutoff.getMonth() - 1);
        else if (timeRange === '3months') cutoff.setMonth(cutoff.getMonth() - 3);
        else cutoff = new Date(0);

        // Use domain layer for filtering
        let result = getCompletedSessions(sessions);

        if (selectedAthlete !== 'all') {
            result = filterSessionsByAthlete(result, selectedAthlete);
        }

        result = filterSessionsByDateRange(result, cutoff);

        return result;
    }, [sessions, selectedAthlete, timeRange]);

    // Main metrics
    const metrics = useMemo((): AnalyticsMetrics => {
        const totalVolume = calculateTotalVolume(filteredSessions);
        const totalSets = filteredSessions.reduce((sum, s) => sum + (s.totalSets || 0), 0);
        const totalReps = filteredSessions.reduce((sum, s) => sum + (s.totalReps || 0), 0);
        const totalDuration = calculateTotalDuration(filteredSessions);
        const avgVolume = filteredSessions.length > 0 ? Math.round(totalVolume / filteredSessions.length) : 0;
        const avgDuration = calculateAvgDuration(filteredSessions);

        return { totalVolume, totalSets, totalReps, totalDuration, avgVolume, avgDuration, sessionCount: filteredSessions.length };
    }, [filteredSessions]);

    // Weekly volume for chart - using domain function (PHASE 6 LT5)
    const weeklyVolume = useMemo((): [string, number][] => {
        const volumeSeries = getWeeklyVolumeSeries(filteredSessions, 8);
        return volumeSeries.map(point => [point.weekStart, point.volume] as [string, number]);
    }, [filteredSessions]);

    // Max volume for chart scaling
    const maxWeekVolume = weeklyVolume.length > 0 ? Math.max(...weeklyVolume.map(([, v]) => v)) : 1;

    // Top exercises by volume - using domain function (PHASE 6 LT5)
    const topExercises = useMemo((): TopExercise[] => {
        const topData = getTopExercisesByVolume(filteredSessions, 5);
        return topData.map(data => ({
            id: data.exerciseId,
            name: exercises.find(e => e.id === data.exerciseId)?.name || 'Ejercicio',
            volume: data.volume,
            sets: data.sets,
        }));
    }, [filteredSessions, exercises]);

    // Session log
    const sessionLog = useMemo(() => {
        let fromDate: string | undefined;
        const now = new Date();
        if (timeRange === 'week') {
            const cutoff = new Date(now);
            cutoff.setDate(cutoff.getDate() - 7);
            fromDate = cutoff.toISOString();
        } else if (timeRange === 'month') {
            const cutoff = new Date(now);
            cutoff.setMonth(cutoff.getMonth() - 1);
            fromDate = cutoff.toISOString();
        } else if (timeRange === '3months') {
            const cutoff = new Date(now);
            cutoff.setMonth(cutoff.getMonth() - 3);
            fromDate = cutoff.toISOString();
        }

        return getSessionLog(sessions, athletes, {
            athleteId: selectedAthlete === 'all' ? null : selectedAthlete,
            statuses: ['completed'],
            fromDate,
        });
    }, [sessions, athletes, selectedAthlete, timeRange]);

    // Weekly intensity/fatigue
    const weeklyIntensityFatigue = useMemo((): WeeklyIntensityFatigueData => {
        return getWeeklyIntensityFatigue(filteredSessions);
    }, [filteredSessions]);

    // Core Metrics - using metrics engine for accurate calculations
    const trainingConfig = useTrainingStore((s) => s.trainingConfig);
    const coreMetrics = useMemo((): AnalyticsCoreMetrics => {
        // Convert filtered sessions to ExecutedSet[]
        const allSets: ExecutedSet[] = [];
        for (const session of filteredSessions) {
            for (const exercise of session.exercises) {
                for (const set of exercise.sets) {
                    if (set.isCompleted && set.actualReps && set.actualWeight !== undefined) {
                        allSets.push({
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
        }

        const volumeDisplay = trainingConfig.analysis.showVolumeAs;
        const rmMethod = trainingConfig.analysis.defaultRMMethod;
        const totalVolume = computeSessionVolumeKg(allSets);

        return {
            totalVolume,
            volumeFormatted: formatVolume(totalVolume, volumeDisplay),
            topSetLoad: computeTopSetLoadKg(allSets),
            bestE1RM: computeBestE1RM(allSets, rmMethod),
            avgRPE: computeAverageRPE(allSets),
            workingSets: allSets.filter(s => !s.isWarmup).length,
        };
    }, [filteredSessions, trainingConfig.analysis]);

    return {
        // State
        selectedAthlete,
        setSelectedAthlete,
        timeRange,
        setTimeRange,

        // Filtered data
        filteredSessions,

        // Calculations
        metrics,
        coreMetrics,
        weeklyVolume,
        maxWeekVolume,
        topExercises,
        sessionLog,
        weeklyIntensityFatigue,

        // Reference data
        athletes,
        exercises,
        sessions,
        trainingPlans,
    };
}

export default useAnalyticsData;
