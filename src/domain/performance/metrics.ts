/**
 * Intensity & Fatigue Metrics Module
 * 
 * PHASE 3: Centralized pure functions for intensity/fatigue calculations
 * 
 * This module provides:
 * - Set-level intensity/fatigue calculations
 * - Exercise-level aggregations
 * - Session-level aggregations
 * - Weekly time-series data
 * 
 * Used by: LiveSession, SessionTimeline, AnalyticsOverviewTab, performanceEngine
 */

import type { SetEntry, ExerciseEntry, WorkoutSession } from '../../types/types';
import { getWeekStart } from '../../utils/dateHelpers';

// ============================================
// TYPES
// ============================================

export interface SetIntensityFatigue {
    intensity: number;  // 1-10 scale
    fatigue: number;    // Calculated fatigue value
}

export interface ExerciseIntensityFatigue {
    avgIntensity: number;
    avgFatigue: number;
    totalFatigue: number;
    completedSets: number;
    targetIntensity: number | null;  // Planned intensity (from RIR/RPE)
}

export interface SessionIntensityFatigue {
    avgIntensity: number;
    avgFatigue: number;
    totalVolume: number;
    completedSets: number;
    completedExercises: number;
    peakIntensity: number | null;
}

export interface WeeklyLoadData {
    weekStart: string;  // 'YYYY-MM-DD'
    totalVolume: number;
    avgIntensity: number | null;
    avgFatigue: number | null;
    completedSessions: number;
    totalSets: number;
}

export interface WeeklyAdherenceData {
    weekStart: string;
    planned: number;
    completed: number;
    adherenceRate: number;  // 0-100%
}

// ============================================
// SET-LEVEL CALCULATIONS
// ============================================

/**
 * Get intensity for a single set
 * 
 * Priority:
 * 1. RPE (if defined)
 * 2. Intensity field (if defined)
 * 3. 10 - RIR (completed or target)
 * 4. Default: 7
 */
export function getSetIntensity(set: SetEntry): number {
    // Use RPE directly if available
    if (typeof set.rpe === 'number' && set.rpe > 0) {
        return Math.min(10, Math.max(1, set.rpe));
    }

    // Use intensity field if available
    if (typeof set.intensity === 'number' && set.intensity > 0) {
        return Math.min(10, Math.max(1, set.intensity));
    }

    // Convert RIR to intensity (10 - RIR)
    if (typeof set.rir === 'number' && set.rir >= 0) {
        return Math.max(1, 10 - set.rir);
    }

    // Fallback: moderate intensity
    return 7;
}

/**
 * Get target (planned) intensity for a set
 * 
 * Used to show "before" state in UI
 */
export function getSetTargetIntensity(set: SetEntry): number | null {
    // If there's a target RIR, convert to intensity
    if (typeof set.rir === 'number' && set.rir >= 0) {
        return 10 - set.rir;
    }
    // If there's target RPE (stored for prescription)
    if (typeof set.rpe === 'number' && !set.isCompleted) {
        return set.rpe;
    }
    return null;
}

/**
 * Calculate fatigue contribution of a single set
 * 
 * Formula: intensity * log(1 + reps) * loadFactor
 * 
 * This accounts for:
 * - Higher intensity = more fatigue
 * - More reps = more fatigue (diminishing returns)
 * - Heavier loads = more fatigue
 */
export function getSetFatigue(set: SetEntry): number {
    if (!set.isCompleted) return 0;

    const intensity = getSetIntensity(set);
    const reps = set.actualReps ?? set.targetReps ?? 1;
    const weight = set.actualWeight ?? set.targetWeight ?? 0;

    // Base fatigue from intensity and reps
    const baseFatigue = intensity * Math.log1p(reps);

    // Load factor (normalize around 100kg as baseline)
    const loadFactor = weight > 0 ? Math.sqrt(weight / 100) : 0.5;

    return baseFatigue * loadFactor;
}

// ============================================
// EXERCISE-LEVEL CALCULATIONS
// ============================================

/**
 * Calculate intensity/fatigue metrics for an entire exercise
 */
export function getExerciseIntensityFatigue(exercise: ExerciseEntry): ExerciseIntensityFatigue {
    const completedSets = exercise.sets.filter(s => s.isCompleted);

    if (completedSets.length === 0) {
        // Return target-based values for planned exercises
        const targetIntensities = exercise.sets
            .map(s => getSetTargetIntensity(s))
            .filter((v): v is number => v !== null);

        return {
            avgIntensity: 0,
            avgFatigue: 0,
            totalFatigue: 0,
            completedSets: 0,
            targetIntensity: targetIntensities.length > 0
                ? targetIntensities.reduce((a, b) => a + b, 0) / targetIntensities.length
                : null,
        };
    }

    const totalIntensity = completedSets.reduce(
        (sum, set) => sum + getSetIntensity(set),
        0
    );
    const totalFatigue = completedSets.reduce(
        (sum, set) => sum + getSetFatigue(set),
        0
    );

    return {
        avgIntensity: totalIntensity / completedSets.length,
        avgFatigue: totalFatigue / completedSets.length,
        totalFatigue,
        completedSets: completedSets.length,
        targetIntensity: null,  // Already completed
    };
}

/**
 * Get intensity label for display
 */
export function getIntensityLabel(intensity: number): string {
    if (intensity < 5) return 'Light';
    if (intensity < 7) return 'Moderate';
    if (intensity < 8.5) return 'Hard';
    return 'Max Effort';
}

/**
 * Get intensity color class for styling
 */
export function getIntensityColor(intensity: number): string {
    if (intensity < 5) return 'text-green-400';
    if (intensity < 7) return 'text-blue-400';
    if (intensity < 8.5) return 'text-yellow-400';
    return 'text-red-400';
}

// ============================================
// SESSION-LEVEL CALCULATIONS
// ============================================

/**
 * Calculate comprehensive intensity/fatigue metrics for a session
 */
export function getSessionIntensityFatigue(session: WorkoutSession): SessionIntensityFatigue {
    let totalIntensity = 0;
    let totalFatigue = 0;
    let totalVolume = 0;
    let completedSets = 0;
    let completedExercises = 0;
    let peakIntensity = 0;

    for (const exercise of session.exercises) {
        const exerciseMetrics = getExerciseIntensityFatigue(exercise);

        if (exerciseMetrics.completedSets > 0) {
            completedExercises++;
            completedSets += exerciseMetrics.completedSets;
            totalIntensity += exerciseMetrics.avgIntensity * exerciseMetrics.completedSets;
            totalFatigue += exerciseMetrics.totalFatigue;

            // Track peak intensity
            for (const set of exercise.sets) {
                if (set.isCompleted) {
                    const setIntensity = getSetIntensity(set);
                    if (setIntensity > peakIntensity) {
                        peakIntensity = setIntensity;
                    }
                    // Add to volume
                    totalVolume += (set.actualWeight ?? 0) * (set.actualReps ?? 0);
                }
            }
        }
    }

    return {
        avgIntensity: completedSets > 0 ? totalIntensity / completedSets : 0,
        avgFatigue: completedSets > 0 ? totalFatigue / completedSets : 0,
        totalVolume,
        completedSets,
        completedExercises,
        peakIntensity: peakIntensity > 0 ? peakIntensity : null,
    };
}

// ============================================
// WEEKLY TIME-SERIES
// ============================================

/**
 * Calculate weekly load series from completed sessions
 * 
 * @param sessions - Array of WorkoutSession (any status)
 * @param weeksBack - Number of weeks to include (default: 8)
 * @returns Array of weekly data, sorted by date ascending
 */
export function getWeeklyLoadSeries(
    sessions: WorkoutSession[],
    weeksBack: number = 8
): WeeklyLoadData[] {
    const completedSessions = sessions.filter(s => s.status === 'completed' && s.completedAt);

    // Calculate week boundaries
    const now = new Date();
    const startWeek = getWeekStart(now);
    startWeek.setDate(startWeek.getDate() - (weeksBack - 1) * 7);

    // Initialize weeks
    const weeks = new Map<string, WeeklyLoadData>();
    for (let i = 0; i < weeksBack; i++) {
        const weekDate = new Date(startWeek);
        weekDate.setDate(weekDate.getDate() + i * 7);
        const weekKey = weekDate.toISOString().split('T')[0];

        weeks.set(weekKey, {
            weekStart: weekKey,
            totalVolume: 0,
            avgIntensity: null,
            avgFatigue: null,
            completedSessions: 0,
            totalSets: 0,
        });
    }

    // Group sessions by week
    for (const session of completedSessions) {
        const sessionDate = new Date(session.completedAt!);
        const weekStart = getWeekStart(sessionDate);
        const weekKey = weekStart.toISOString().split('T')[0];

        const weekData = weeks.get(weekKey);
        if (!weekData) continue;

        const sessionMetrics = getSessionIntensityFatigue(session);

        weekData.completedSessions++;
        weekData.totalVolume += sessionMetrics.totalVolume;
        weekData.totalSets += sessionMetrics.completedSets;

        // Accumulate for averaging
        if (sessionMetrics.avgIntensity > 0) {
            weekData.avgIntensity = weekData.avgIntensity === null
                ? sessionMetrics.avgIntensity
                : (weekData.avgIntensity * (weekData.completedSessions - 1) + sessionMetrics.avgIntensity) / weekData.completedSessions;
        }
        if (sessionMetrics.avgFatigue > 0) {
            weekData.avgFatigue = weekData.avgFatigue === null
                ? sessionMetrics.avgFatigue
                : (weekData.avgFatigue * (weekData.completedSessions - 1) + sessionMetrics.avgFatigue) / weekData.completedSessions;
        }
    }

    return Array.from(weeks.values()).sort((a, b) => a.weekStart.localeCompare(b.weekStart));
}

/**
 * Calculate weekly adherence (planned vs completed)
 */
export function getWeeklyAdherenceSeries(
    plannedSessions: Array<{ scheduledDate?: string }>,
    workoutSessions: WorkoutSession[],
    weeksBack: number = 8
): WeeklyAdherenceData[] {
    const completedSessions = workoutSessions.filter(s => s.status === 'completed');

    // Calculate week boundaries
    const now = new Date();
    const startWeek = getWeekStart(now);
    startWeek.setDate(startWeek.getDate() - (weeksBack - 1) * 7);

    // Initialize weeks
    const weeks = new Map<string, WeeklyAdherenceData>();
    for (let i = 0; i < weeksBack; i++) {
        const weekDate = new Date(startWeek);
        weekDate.setDate(weekDate.getDate() + i * 7);
        const weekKey = weekDate.toISOString().split('T')[0];

        weeks.set(weekKey, {
            weekStart: weekKey,
            planned: 0,
            completed: 0,
            adherenceRate: 0,
        });
    }

    // Count planned sessions by week
    for (const session of plannedSessions) {
        if (!session.scheduledDate) continue;

        const sessionDate = new Date(session.scheduledDate);
        const weekStart = getWeekStart(sessionDate);
        const weekKey = weekStart.toISOString().split('T')[0];

        const weekData = weeks.get(weekKey);
        if (weekData) {
            weekData.planned++;
        }
    }

    // Count completed sessions by week
    for (const session of completedSessions) {
        const sessionDate = session.completedAt
            ? new Date(session.completedAt)
            : session.scheduledDate
                ? new Date(session.scheduledDate)
                : null;

        if (!sessionDate) continue;

        const weekStart = getWeekStart(sessionDate);
        const weekKey = weekStart.toISOString().split('T')[0];

        const weekData = weeks.get(weekKey);
        if (weekData) {
            weekData.completed++;
        }
    }

    // Calculate adherence rates
    for (const week of weeks.values()) {
        if (week.planned > 0) {
            week.adherenceRate = Math.round((week.completed / week.planned) * 100);
        } else if (week.completed > 0) {
            week.adherenceRate = 100;  // Completed extra sessions
        }
    }

    return Array.from(weeks.values()).sort((a, b) => a.weekStart.localeCompare(b.weekStart));
}

// ============================================
// UTILITY EXPORTS
// ============================================

/**
 * Format fatigue value for display
 */
export function formatFatigue(fatigue: number): string {
    if (fatigue < 5) return 'Low';
    if (fatigue < 10) return 'Moderate';
    if (fatigue < 15) return 'High';
    return 'Very High';
}

/**
 * Get fatigue color class
 */
export function getFatigueColor(fatigue: number): string {
    if (fatigue < 5) return 'text-green-400';
    if (fatigue < 10) return 'text-yellow-400';
    if (fatigue < 15) return 'text-orange-400';
    return 'text-red-400';
}

// ============================================
// ANALYTICS HELPERS (PHASE 6 LT5)
// ============================================

/**
 * Weekly volume entry for simple analytics charts
 */
export interface WeeklyVolumePoint {
    weekStart: string;  // 'YYYY-MM-DD'
    volume: number;
}

/**
 * Top exercise by volume
 */
export interface TopExerciseData {
    exerciseId: string;
    volume: number;
    sets: number;
}

/**
 * Get weekly volume series for charts
 * 
 * Simplified version of getWeeklyLoadSeries that returns just volume
 * 
 * PHASE 6: Created for useAnalyticsData hook (LT5)
 */
export function getWeeklyVolumeSeries(
    sessions: WorkoutSession[],
    weeksBack: number = 8
): WeeklyVolumePoint[] {
    const loadSeries = getWeeklyLoadSeries(sessions, weeksBack);
    return loadSeries.map(week => ({
        weekStart: week.weekStart,
        volume: week.totalVolume,
    }));
}

/**
 * Get top exercises by volume
 * 
 * PHASE 6: Created for useAnalyticsData hook (LT5)
 * 
 * @param sessions - Array of completed sessions
 * @param limit - Maximum number of exercises to return
 * @returns Array of top exercises sorted by volume descending
 */
export function getTopExercisesByVolume(
    sessions: WorkoutSession[],
    limit: number = 5
): TopExerciseData[] {
    const volumes = new Map<string, { volume: number; sets: number }>();

    for (const session of sessions) {
        if (session.status !== 'completed') continue;

        for (const exercise of session.exercises) {
            if (!volumes.has(exercise.exerciseId)) {
                volumes.set(exercise.exerciseId, { volume: 0, sets: 0 });
            }

            const data = volumes.get(exercise.exerciseId)!;
            for (const set of exercise.sets) {
                if (set.isCompleted) {
                    data.volume += (set.actualWeight || 0) * (set.actualReps || 0);
                    data.sets++;
                }
            }
        }
    }

    return Array.from(volumes.entries())
        .map(([exerciseId, data]) => ({
            exerciseId,
            volume: data.volume,
            sets: data.sets,
        }))
        .sort((a, b) => b.volume - a.volume)
        .slice(0, limit);
}
