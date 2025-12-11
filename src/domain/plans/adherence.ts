/**
 * Domain Layer - Plans / Adherence
 * 
 * Pure functions for calculating training plan adherence.
 * No React/Zustand dependencies.
 * 
 * PHASE 4: Extracted from useTrainingAdherence hook
 */

import type { WorkoutSession } from '../../types/types';
import { getWeekRange } from '../../utils/dateHelpers';

// ============================================
// TYPES
// ============================================

/**
 * Weekly adherence metrics
 */
export interface WeeklyAdherence {
    planned: number;
    completed: number;
    percentage: number;
    volumeTarget: number;
    volumeActual: number;
    volumeDeviation: number;
    weeklyScore: number;
}

/**
 * Adherence level classification
 */
export type AdherenceLevel = 'excellent' | 'good' | 'warning' | 'poor';

/**
 * Minimal plan interface for adherence calculations
 * Allows usage with different plan types
 */
export interface AdherencePlanInput {
    athleteId: string;
    sessionsPerWeek: number;
    weeklyVolume: number;
    metadata?: {
        currentMicrocycle?: number;
    };
}

/**
 * Week range for adherence calculation
 * Note: Named differently from calendar.WeekRange to avoid export conflicts
 */
export interface AdherenceWeekRange {
    start: Date;
    end: Date;
}

// ============================================
// DEFAULT VALUES
// ============================================

export const DEFAULT_WEEKLY_ADHERENCE: WeeklyAdherence = {
    planned: 0,
    completed: 0,
    percentage: 0,
    volumeTarget: 0,
    volumeActual: 0,
    volumeDeviation: 0,
    weeklyScore: 0,
};

// ============================================
// PURE FUNCTIONS
// ============================================

/**
 * Calculate weekly adherence for a training plan
 * 
 * @param plan - Training plan with athlete and volume info
 * @param sessions - All sessions (will be filtered)
 * @param weekRange - Optional week range (defaults to current week)
 * @returns WeeklyAdherence metrics
 */
export function calculateWeeklyAdherence(
    plan: AdherencePlanInput,
    sessions: WorkoutSession[],
    weekRange?: AdherenceWeekRange
): WeeklyAdherence {
    const { start, end } = weekRange || getWeekRange();

    // Filter sessions completed this week for the athlete
    const weekSessions = sessions.filter(s => {
        if (s.athleteId !== plan.athleteId) return false;
        if (s.status !== 'completed') return false;
        if (!s.completedAt) return false;
        const completedDate = new Date(s.completedAt);
        return completedDate >= start && completedDate <= end;
    });

    const completed = weekSessions.length;
    const planned = plan.sessionsPerWeek;
    const percentage = planned > 0 ? Math.round((completed / planned) * 100) : 0;
    const volumeActual = weekSessions.reduce((sum, s) => sum + (s.totalVolume || 0), 0);
    const volumeTarget = plan.weeklyVolume;

    // Calculate deviation (negative = under target, positive = over target)
    const volumeDeviation = volumeTarget > 0
        ? Math.round(((volumeActual - volumeTarget) / volumeTarget) * 100)
        : 0;

    // Calculate weekly score (0-100)
    // Score = (adherence % * 0.6) + (volume accuracy * 0.4)
    const volumeAccuracy = volumeTarget > 0
        ? Math.max(0, 100 - Math.abs(volumeDeviation))
        : 100;
    const weeklyScore = Math.round(
        (Math.min(percentage, 100) * 0.6) + (volumeAccuracy * 0.4)
    );

    return {
        planned,
        completed,
        percentage: Math.min(percentage, 100),
        volumeTarget,
        volumeActual,
        volumeDeviation,
        weeklyScore,
    };
}

/**
 * Determine adherence level from weekly score
 * 
 * @param adherence - Weekly adherence or just the score
 * @returns AdherenceLevel classification
 */
export function getAdherenceLevel(adherence: WeeklyAdherence | number): AdherenceLevel {
    const score = typeof adherence === 'number' ? adherence : (adherence.weeklyScore ?? 0);
    if (score >= 90) return 'excellent';
    if (score >= 70) return 'good';
    if (score >= 50) return 'warning';
    return 'poor';
}

/**
 * Check if training is on track based on adherence
 * 
 * @param adherence - Weekly adherence or just the score
 * @returns boolean indicating if on track
 */
export function isOnTrack(adherence: WeeklyAdherence | number): boolean {
    const score = typeof adherence === 'number' ? adherence : (adherence.weeklyScore ?? 0);
    return score >= 70;
}

/**
 * Generate AI recommendations based on adherence and plan state
 * 
 * @param plan - Training plan with metadata
 * @param adherence - Calculated weekly adherence
 * @returns Array of recommendation strings
 */
export function generateAdherenceRecommendations(
    plan: AdherencePlanInput,
    adherence: WeeklyAdherence
): string[] {
    const recommendations: string[] = [];

    // Check adherence
    if (adherence.percentage < 70) {
        recommendations.push('📉 Low adherence this week. Consider reducing training days.');
    }

    // Check volume deviation
    if (adherence.volumeDeviation < -20) {
        recommendations.push('⚠️ Volume significantly below target. Increase intensity or add sets.');
    } else if (adherence.volumeDeviation > 20) {
        recommendations.push('💪 Volume above target. Monitor recovery and fatigue.');
    }

    // Check microcycle
    if (plan.metadata?.currentMicrocycle === 4) {
        recommendations.push('🔄 End of microcycle. Consider a deload week.');
    }

    return recommendations.length > 0 ? recommendations : ['✅ Training on track!'];
}

/**
 * Calculate adherence for multiple weeks
 * Useful for trend analysis
 * 
 * @param plan - Training plan
 * @param sessions - All sessions
 * @param weeksBack - Number of weeks to analyze (default: 4)
 * @returns Array of weekly adherence data
 */
export function calculateAdherenceTrend(
    plan: AdherencePlanInput,
    sessions: WorkoutSession[],
    weeksBack: number = 4
): Array<{ weekStart: string; adherence: WeeklyAdherence }> {
    const results: Array<{ weekStart: string; adherence: WeeklyAdherence }> = [];
    const now = new Date();

    for (let i = weeksBack - 1; i >= 0; i--) {
        const weekStart = new Date(now);
        // Go back to start of current week, then subtract weeks
        const dayOfWeek = weekStart.getDay();
        const daysToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
        weekStart.setDate(weekStart.getDate() + daysToMonday - (i * 7));
        weekStart.setHours(0, 0, 0, 0);

        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);
        weekEnd.setHours(23, 59, 59, 999);

        const adherence = calculateWeeklyAdherence(plan, sessions, {
            start: weekStart,
            end: weekEnd,
        });

        results.push({
            weekStart: weekStart.toISOString().split('T')[0],
            adherence,
        });
    }

    return results;
}
