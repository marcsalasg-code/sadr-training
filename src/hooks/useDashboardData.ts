/**
 * useDashboardData - Hook para datos y estadísticas del Dashboard
 * 
 * Extrae la lógica de cálculo de Dashboard.tsx:
 * - Estadísticas semanales y mensuales
 * - Sesiones recientes y próximas
 * - Intensidad/fatiga semanal
 * - Sesión activa y última completada
 */

import { useMemo } from 'react';
import { useSessions, useAthletes, useTemplates } from '../store/store';
import { useTrainingPlan } from './useTrainingPlan';
import { getWeeklyIntensityFatigue } from '../utils/metrics';
import {
    calculateWeeklyStats,
    countActiveAthletes,
    getMostUsedTemplateId,
    calculateCompletionRate,
    getWeekStart,
} from '../utils/dashboardMetrics';
import type { WorkoutSession, WorkoutTemplate } from '../types/types';

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

export interface UseDashboardDataReturn {
    // Statistics
    stats: DashboardStats;
    weeklyIntensityFatigue: WeeklyIntensityFatigue;

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
    const sessions = useSessions();
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

    // Recent sessions
    const recentSessions = useMemo(() => {
        return sessions
            .filter(s => s.status === 'completed')
            .sort((a, b) => new Date(b.completedAt || 0).getTime() - new Date(a.completedAt || 0).getTime())
            .slice(0, 5);
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

    // Last completed session for duplication
    const lastCompletedSession = useMemo(() => {
        return sessions
            .filter(s => s.status === 'completed')
            .sort((a, b) => new Date(b.completedAt || 0).getTime() - new Date(a.completedAt || 0).getTime())[0];
    }, [sessions]);

    // Get athlete name helper
    const getAthleteName = (id: string) => athletes.find(a => a.id === id)?.name || 'Atleta';

    return {
        // Statistics
        stats,
        weeklyIntensityFatigue,

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
