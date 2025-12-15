/**
 * useDashboardData - Hook para datos y estadísticas del Dashboard
 * 
 * Extrae la lógica de cálculo de Dashboard.tsx:
 * - Estadísticas semanales y mensuales
 * - Sesiones recientes y próximas
 * - Intensidad/fatiga semanal
 * - Sesión activa y última completada
 * - Métricas core (topSet, e1RM, RPE)
 */

import { useMemo } from 'react';
import { useAthletes, useTemplates, useTrainingStore } from '../store/store';
import { useVisibleSessions } from './useVisibleSessions';
import { useTrainingPlan } from './useTrainingPlan';
import { getWeeklyIntensityFatigue } from '../core/analysis/metrics';
import {
    calculateWeeklyStats,
    countActiveAthletes,
    getMostUsedTemplateId,
    calculateCompletionRate,
    getWeekStart,
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
    filterSessionsByStatus,
    getCompletedSessions,
    sortSessionsByDate,
} from '../domain/sessions';
import type { WorkoutSession, WorkoutTemplate, SetEntry } from '../types/types';

// ============================================
// TYPES
// ============================================

export interface DashboardStats {
    totalSessions: number;
    plannedCount: number;
    weekSessions: number;
    monthSessions: number;
    totalVolume: number;
    weekVolume: number;
    avgDuration: number;
    activeAthletes: number;
    inProgressSessions: number;
    totalAthletes: number;
    totalTemplates: number;
    mostUsedTemplate: WorkoutTemplate | null;
    completionRate: number;
}

export interface WeeklyIntensityFatigue {
    avgIntensity: number | null;
    avgFatigue: number | null;
    count: number;
}

/**
 * Core metrics from metrics engine
 */
export interface CoreMetrics {
    weekVolume: number;
    weekVolumeFormatted: string;
    weekTopSet: number | null;
    weekBestE1RM: number | null;
    weekAvgRPE: number | null;
    weekTotalSets: number;
}

export interface UseDashboardDataReturn {
    // Statistics
    stats: DashboardStats;
    weeklyIntensityFatigue: WeeklyIntensityFatigue;
    coreMetrics: CoreMetrics;

    // Session lists
    recentSessions: WorkoutSession[];
    upcomingSessions: WorkoutSession[];
    activeSession: WorkoutSession | undefined;
    lastCompletedSession: WorkoutSession | undefined;

    // Training plan context
    activePlan: ReturnType<typeof useTrainingPlan>['activePlan'];
    weeklyAdherence: ReturnType<typeof useTrainingPlan>['weeklyAdherence'];
    todayPlan: ReturnType<typeof useTrainingPlan>['todayPlan'];
    getAIRecommendations: ReturnType<typeof useTrainingPlan>['getAIRecommendations'];

    // Flags
    hasSessionToday: boolean;

    // Utilities
    getAthleteName: (id: string) => string;
}

// ============================================
// HOOK IMPLEMENTATION
// ============================================

export function useDashboardData(): UseDashboardDataReturn {
    // Phase 18: Use role-filtered sessions for data isolation
    const sessions = useVisibleSessions();
    const athletes = useAthletes();
    const templates = useTemplates();
    const { activePlan, weeklyAdherence, getAIRecommendations, todayPlan } = useTrainingPlan();

    // Check if there's a session completed today
    const hasSessionToday = useMemo(() =>
        sessions.some(s =>
            s.status === 'completed' &&
            s.completedAt &&
            new Date(s.completedAt).toDateString() === new Date().toDateString()
        )
        , [sessions]);

    // Main statistics - using centralized metrics
    const stats = useMemo((): DashboardStats => {
        const weeklyStats = calculateWeeklyStats(sessions);
        const plannedSessions = sessions.filter(s => s.status === 'planned');
        const inProgressSessions = sessions.filter(s => s.status === 'in_progress').length;

        // Template usage
        const mostUsedTemplateId = getMostUsedTemplateId(sessions);
        const mostUsedTemplate = mostUsedTemplateId
            ? templates.find(t => t.id === mostUsedTemplateId) || null
            : null;

        // Completion rate
        const weekStart = getWeekStart();
        const now = new Date();
        const weekPlanned = plannedSessions.filter(s =>
            s.scheduledDate &&
            new Date(s.scheduledDate) >= weekStart &&
            new Date(s.scheduledDate) <= now
        );
        const completionRate = calculateCompletionRate(
            weeklyStats.weekSessions,
            weekPlanned.length
        );

        return {
            totalSessions: weeklyStats.totalSessions,
            plannedCount: plannedSessions.length,
            weekSessions: weeklyStats.weekSessions,
            monthSessions: weeklyStats.monthSessions,
            totalVolume: weeklyStats.totalVolume,
            weekVolume: weeklyStats.weekVolume,
            avgDuration: weeklyStats.avgDuration,
            activeAthletes: countActiveAthletes(athletes),
            inProgressSessions,
            totalAthletes: athletes.length,
            totalTemplates: templates.length,
            mostUsedTemplate,
            completionRate,
        };
    }, [sessions, athletes, templates]);

    // Weekly Intensity & Fatigue Stats
    const weeklyIntensityFatigue = useMemo((): WeeklyIntensityFatigue => {
        const now = new Date();
        const thisWeekStart = new Date(now);
        thisWeekStart.setDate(now.getDate() - now.getDay());
        thisWeekStart.setHours(0, 0, 0, 0);

        const weekSessions = sessions.filter(s =>
            s.status === 'completed' &&
            s.completedAt &&
            new Date(s.completedAt) >= thisWeekStart
        );

        return getWeeklyIntensityFatigue(weekSessions);
    }, [sessions]);

    // Recent sessions - using domain layer functions
    const recentSessions = useMemo(() => {
        const completed = getCompletedSessions(sessions);
        const sorted = sortSessionsByDate(completed);
        return sorted.slice(0, 5);
    }, [sessions]);

    // Upcoming sessions
    const upcomingSessions = useMemo(() => {
        return sessions
            .filter(s => s.status === 'planned' && s.scheduledDate)
            .sort((a, b) => new Date(a.scheduledDate!).getTime() - new Date(b.scheduledDate!).getTime())
            .slice(0, 3);
    }, [sessions]);

    // Active session
    const activeSession = useMemo(() => {
        return sessions.find(s => s.status === 'in_progress');
    }, [sessions]);

    // Last completed session for duplication - using domain layer
    const lastCompletedSession = useMemo(() => {
        const completed = getCompletedSessions(sessions);
        const sorted = sortSessionsByDate(completed);
        return sorted[0];
    }, [sessions]);

    // Get athlete name helper
    const getAthleteName = (id: string) => athletes.find(a => a.id === id)?.name || 'Atleta';

    // Core Metrics - using metrics engine for accurate calculations
    const trainingConfig = useTrainingStore((s) => s.trainingConfig);
    const coreMetrics = useMemo((): CoreMetrics => {
        const now = new Date();
        const thisWeekStart = new Date(now);
        thisWeekStart.setDate(now.getDate() - now.getDay());
        thisWeekStart.setHours(0, 0, 0, 0);

        // Get completed sessions this week
        const weekSessions = sessions.filter(s =>
            s.status === 'completed' &&
            s.completedAt &&
            new Date(s.completedAt) >= thisWeekStart
        );

        // Convert to ExecutedSet[]
        const allSets: ExecutedSet[] = [];
        for (const session of weekSessions) {
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
        const weekVolume = computeSessionVolumeKg(allSets);

        return {
            weekVolume,
            weekVolumeFormatted: formatVolume(weekVolume, volumeDisplay),
            weekTopSet: computeTopSetLoadKg(allSets),
            weekBestE1RM: computeBestE1RM(allSets, rmMethod),
            weekAvgRPE: computeAverageRPE(allSets),
            weekTotalSets: allSets.filter(s => !s.isWarmup).length,
        };
    }, [sessions, trainingConfig.analysis]);

    return {
        // Statistics
        stats,
        weeklyIntensityFatigue,
        coreMetrics,

        // Session lists
        recentSessions,
        upcomingSessions,
        activeSession,
        lastCompletedSession,

        // Training plan context
        activePlan,
        weeklyAdherence,
        todayPlan,
        getAIRecommendations,

        // Flags
        hasSessionToday,

        // Utilities
        getAthleteName,
    };
}

export default useDashboardData;
