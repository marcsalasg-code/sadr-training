/**
 * Store Selectors - Memoized selectors for optimized data access
 * 
 * These selectors provide:
 * - Centralized data transformation logic
 * - Reduced re-renders through memoization
 * - Single source of truth for derived data
 */

import { useTrainingStore } from './store';
import {
    calculateWeeklyStats,
    calculateAthleteStats,
    filterWeekSessions,
    filterCompletedSessions,
    getTemplateUsage,
    getMostUsedTemplateId,
    countActiveAthletes,
    calculateCompletionRate,
    getWeekStart,
    type WeeklyStats,
    type AthleteStats,
} from '../utils/dashboardMetrics';

// ============================================
// BASIC SELECTORS (already exist in store, re-exported for convenience)
// ============================================

export const useAthletes = () => useTrainingStore((state) => state.athletes);
export const useExercises = () => useTrainingStore((state) => state.exercises);
export const useSessions = () => useTrainingStore((state) => state.sessions);
export const useTemplates = () => useTrainingStore((state) => state.templates);
export const useSettings = () => useTrainingStore((state) => state.settings);

// ============================================
// COMPUTED SELECTORS
// ============================================

/**
 * Get weekly stats for all sessions
 */
export const useWeeklyStats = (): WeeklyStats => {
    return useTrainingStore((state) => calculateWeeklyStats(state.sessions));
};

/**
 * Get stats for a specific athlete
 */
export const useAthleteStats = (athleteId: string): AthleteStats => {
    return useTrainingStore((state) => 
        calculateAthleteStats(state.sessions, athleteId)
    );
};

/**
 * Get completed sessions for the current week
 */
export const useWeekSessions = () => {
    return useTrainingStore((state) => filterWeekSessions(state.sessions));
};

/**
 * Get all completed sessions
 */
export const useCompletedSessions = () => {
    return useTrainingStore((state) => filterCompletedSessions(state.sessions));
};

/**
 * Get active athletes count
 */
export const useActiveAthletesCount = (): number => {
    return useTrainingStore((state) => countActiveAthletes(state.athletes));
};

/**
 * Get template usage statistics
 */
export const useTemplateUsageStats = (): Record<string, number> => {
    return useTrainingStore((state) => getTemplateUsage(state.sessions));
};

/**
 * Get the most used template
 */
export const useMostUsedTemplate = () => {
    return useTrainingStore((state) => {
        const templateId = getMostUsedTemplateId(state.sessions);
        return templateId ? state.templates.find(t => t.id === templateId) : null;
    });
};

/**
 * Get completion rate for the current week
 */
export const useWeeklyCompletionRate = (): number => {
    return useTrainingStore((state) => {
        const weekStart = getWeekStart();
        const weekSessions = filterWeekSessions(state.sessions);
        const plannedThisWeek = state.sessions.filter(s => 
            s.status === 'planned' &&
            s.scheduledDate &&
            new Date(s.scheduledDate) >= weekStart &&
            new Date(s.scheduledDate) <= new Date()
        );
        return calculateCompletionRate(weekSessions.length, plannedThisWeek.length);
    });
};

/**
 * Get sessions for specific athlete
 */
export const useSessionsByAthlete = (athleteId: string) => {
    return useTrainingStore((state) => 
        state.sessions.filter(s => s.athleteId === athleteId)
    );
};

/**
 * Get active training plan with metadata
 */
export const useActivePlanWithMeta = () => {
    return useTrainingStore((state) => {
        if (!state.activeTrainingPlanId) return null;
        const plan = state.trainingPlans.find(p => p.id === state.activeTrainingPlanId);
        if (!plan) return null;
        
        const athlete = state.athletes.find(a => a.id === plan.athleteId);
        return {
            plan,
            athlete,
        };
    });
};

/**
 * Get in-progress sessions
 */
export const useInProgressSessions = () => {
    return useTrainingStore((state) => 
        state.sessions.filter(s => s.status === 'in_progress')
    );
};

/**
 * Get planned sessions
 */
export const usePlannedSessions = () => {
    return useTrainingStore((state) => 
        state.sessions.filter(s => s.status === 'planned')
    );
};

/**
 * Check if there's an active session
 */
export const useHasActiveSession = (): boolean => {
    return useTrainingStore((state) => state.activeSessionId !== null);
};

/**
 * Get the active session
 */
export const useActiveSession = () => {
    return useTrainingStore((state) => {
        if (!state.activeSessionId) return null;
        return state.sessions.find(s => s.id === state.activeSessionId) || null;
    });
};
