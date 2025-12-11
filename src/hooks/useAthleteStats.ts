/**
 * useAthleteStats - Hook for athlete-specific statistics
 * 
 * Provides centralized stats calculation for an athlete, eliminating
 * duplicate logic in AthleteDetail and other views.
 */

import { useMemo } from 'react';
import { useSessions } from '../store/store';
import {
    calculateAthleteStats,
    filterSessionsByAthlete,
    filterCompletedSessions,
    getWeeklyIntensityFatigue,
    getAthleteIntensityFatigueSeries,
    type AthleteStats,
} from '../core/analysis/metrics';
import type { WorkoutSession } from '../types/types';

// ============================================
// TYPES
// ============================================

export interface AthleteDetailStats extends AthleteStats {
    recentSessions: WorkoutSession[];
    intensityFatigueData: ReturnType<typeof getAthleteIntensityFatigueSeries>;
    weeklyIntensityFatigue: ReturnType<typeof getWeeklyIntensityFatigue>;
}

// ============================================
// HOOK
// ============================================

export function useAthleteStats(athleteId: string): AthleteDetailStats {
    const sessions = useSessions();

    return useMemo(() => {
        // Use centralized calculation
        const baseStats = calculateAthleteStats(sessions, athleteId);

        // Get athlete sessions sorted by date
        const athleteSessions = filterSessionsByAthlete(sessions, athleteId);
        const completedSessions = filterCompletedSessions(athleteSessions);
        const recentSessions = completedSessions
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .slice(0, 10);

        // Intensity-Fatigue data
        const intensityFatigueData = getAthleteIntensityFatigueSeries(sessions, athleteId);
        const weeklyIntensityFatigue = getWeeklyIntensityFatigue(athleteSessions);

        return {
            ...baseStats,
            recentSessions,
            intensityFatigueData,
            weeklyIntensityFatigue,
        };
    }, [sessions, athleteId]);
}
