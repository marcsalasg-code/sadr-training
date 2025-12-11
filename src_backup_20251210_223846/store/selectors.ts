/**
 * Store Selectors - Memoized selectors for optimized data access
 * 
 * These selectors provide:
 * - Centralized data transformation logic
 * - Reduced re-renders through memoization
 * - Single source of truth for derived data
 * 
 * OPTIMIZATION NOTES:
 * - Use useShallow for returning arrays/objects to prevent re-renders
 * - Use helper functions outside selectors for filtering
 * - Cache selector results when possible
 */

import { useTrainingStore } from './store';
import { useShallow } from 'zustand/react/shallow';
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
import type { WorkoutSession } from '../types/types';

// ============================================
// HELPER FUNCTIONS (pure, outside hooks)
// ============================================

/**
 * Filter sessions by athlete ID - helper for memoized selector
 */
export function filterSessionsByAthlete(sessions: WorkoutSession[], athleteId: string): WorkoutSession[] {
    return sessions.filter(s => s.athleteId === athleteId);
}

/**
 * Filter sessions by status - helper for memoized selector
 */
export function filterSessionsByStatus(sessions: WorkoutSession[], status: WorkoutSession['status']): WorkoutSession[] {
    return sessions.filter(s => s.status === status);
}

/**
 * Get exercise IDs from sessions - helper
 */
export function getSessionExerciseIds(sessions: WorkoutSession[]): string[] {
    const ids = new Set<string>();
    for (const session of sessions) {
        for (const entry of session.exercises) {
            ids.add(entry.exerciseId);
        }
    }
    return Array.from(ids);
}

// ============================================
// BASIC SELECTORS (already exist in store, re-exported for convenience)
// ============================================

export const useAthletes = () => useTrainingStore((state) => state.athletes);
export const useExercises = () => useTrainingStore((state) => state.exercises);
export const useSessions = () => useTrainingStore((state) => state.sessions);
export const useTemplates = () => useTrainingStore((state) => state.templates);
export const useSettings = () => useTrainingStore((state) => state.settings);

// ============================================
// CONFIG SELECTORS (NEW - Training Config)
// ============================================

/**
 * Get training config
 */
export const useTrainingConfig = () => useTrainingStore((state) => state.trainingConfig);

/**
 * Get enabled patterns (memoized)
 */
export const useEnabledPatterns = () => useTrainingStore(
    useShallow((state) =>
        state.trainingConfig.patterns
            .filter(p => p.enabled)
            .sort((a, b) => a.order - b.order)
    )
);

/**
 * Get enabled muscle groups (memoized)
 */
export const useEnabledMuscleGroups = () => useTrainingStore(
    useShallow((state) =>
        state.trainingConfig.muscleGroups
            .filter(m => m.enabled)
            .sort((a, b) => a.order - b.order)
    )
);

/**
 * Get analysis settings
 */
export const useAnalysisSettings = () => useTrainingStore((state) => state.trainingConfig.analysis);

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
 * Get sessions for specific athlete - MEMOIZED VERSION
 * Uses useShallow to avoid creating new array refs on every render
 */
export const useSessionsByAthlete = (athleteId: string) => {
    return useTrainingStore(
        useShallow((state) => filterSessionsByAthlete(state.sessions, athleteId))
    );
};

/**
 * Get athlete session IDs only (for minimal re-renders)
 */
export const useSessionIdsByAthlete = (athleteId: string): string[] => {
    return useTrainingStore(
        useShallow((state) =>
            state.sessions
                .filter(s => s.athleteId === athleteId)
                .map(s => s.id)
        )
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
 * Get in-progress sessions - MEMOIZED VERSION
 */
export const useInProgressSessions = () => {
    return useTrainingStore(
        useShallow((state) => filterSessionsByStatus(state.sessions, 'in_progress'))
    );
};

/**
 * Get in-progress session count (scalar, no re-render issues)
 */
export const useInProgressSessionCount = (): number => {
    return useTrainingStore((state) =>
        state.sessions.filter(s => s.status === 'in_progress').length
    );
};

/**
 * Get planned sessions - MEMOIZED VERSION
 */
export const usePlannedSessions = () => {
    return useTrainingStore(
        useShallow((state) => filterSessionsByStatus(state.sessions, 'planned'))
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

/**
 * Get session by ID - optimized
 */
export const useSessionById = (sessionId: string | null) => {
    return useTrainingStore((state) => {
        if (!sessionId) return null;
        return state.sessions.find(s => s.id === sessionId) || null;
    });
};

/**
 * Get athlete by ID - optimized
 */
export const useAthleteById = (athleteId: string | null) => {
    return useTrainingStore((state) => {
        if (!athleteId) return null;
        return state.athletes.find(a => a.id === athleteId) || null;
    });
};

/**
 * Get exercise by ID - optimized
 */
export const useExerciseById = (exerciseId: string | null) => {
    return useTrainingStore((state) => {
        if (!exerciseId) return null;
        return state.exercises.find(e => e.id === exerciseId) || null;
    });
};
