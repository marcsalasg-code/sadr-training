/**
 * Metrics - Centralized metrics calculation utilities
 * 
 * This is the SINGLE SOURCE OF TRUTH for all session metrics in the app.
 * All views and selectors should import from here.
 * 
 * Uses dateHelpers.ts for all date operations.
 */

import type { WorkoutSession, Athlete } from '../types/types';
import {
    getWeekRange,
    getMonthRange,
    isWithinDateRange,
    formatDateKey,
    type DateRange,
} from './dateHelpers';

// ============================================
// TYPES
// ============================================

export interface SessionMetrics {
    totalSessions: number;
    totalVolume: number;
    totalSets: number;
    totalReps: number;
    totalDuration: number;
    avgVolume: number;
    avgDuration: number;
    avgSets: number;
}

export interface WeeklyStats {
    weekVolume: number;
    weekSessions: number;
    monthSessions: number;
    totalVolume: number;
    totalSessions: number;
    avgDuration: number;
    avgVolumePerSession: number;
    totalSets: number;
    totalReps: number;
}

export interface AthleteStats extends WeeklyStats {
    athleteId: string;
}

// Re-export DateRange for convenience
export type { DateRange };

// ============================================
// SESSION FILTERS
// ============================================

/**
 * Filter sessions by completed status
 */
export function filterCompletedSessions(sessions: WorkoutSession[]): WorkoutSession[] {
    return sessions.filter(s => s.status === 'completed');
}

/**
 * Filter sessions by date range
 */
export function filterSessionsByDateRange(
    sessions: WorkoutSession[],
    range: DateRange
): WorkoutSession[] {
    return sessions.filter(s => {
        if (s.status !== 'completed') return false;
        if (!s.completedAt) return false;
        const date = new Date(s.completedAt);
        return isWithinDateRange(date, range);
    });
}

/**
 * Filter sessions for the current week
 */
export function filterWeekSessions(sessions: WorkoutSession[]): WorkoutSession[] {
    return filterSessionsByDateRange(sessions, getWeekRange());
}

/**
 * Filter sessions for the current month
 */
export function filterMonthSessions(sessions: WorkoutSession[]): WorkoutSession[] {
    return filterSessionsByDateRange(sessions, getMonthRange());
}

/**
 * Filter sessions by athlete ID
 */
export function filterSessionsByAthlete(
    sessions: WorkoutSession[],
    athleteId: string
): WorkoutSession[] {
    return sessions.filter(s => s.athleteId === athleteId);
}

// ============================================
// BASIC CALCULATIONS
// ============================================

/**
 * Calculate total volume from sessions
 */
export function calculateTotalVolume(sessions: WorkoutSession[]): number {
    return sessions.reduce((sum, s) => sum + (s.totalVolume || 0), 0);
}

/**
 * Calculate total duration from sessions (in minutes)
 */
export function calculateTotalDuration(sessions: WorkoutSession[]): number {
    return sessions.reduce((sum, s) => sum + (s.durationMinutes || 0), 0);
}

/**
 * Calculate average session duration
 */
export function calculateAvgDuration(sessions: WorkoutSession[]): number {
    const completed = filterCompletedSessions(sessions);
    if (completed.length === 0) return 0;
    return Math.round(calculateTotalDuration(completed) / completed.length);
}

/**
 * Calculate weekly volume
 */
export function calculateWeeklyVolume(sessions: WorkoutSession[]): number {
    return calculateTotalVolume(filterWeekSessions(sessions));
}

/**
 * Count completed sessions in the week
 */
export function countWeekSessions(sessions: WorkoutSession[]): number {
    return filterWeekSessions(sessions).length;
}

/**
 * Count completed sessions in the month
 */
export function countMonthSessions(sessions: WorkoutSession[]): number {
    return filterMonthSessions(sessions).length;
}

// ============================================
// COMPREHENSIVE METRICS
// ============================================

/**
 * Calculate comprehensive metrics from sessions
 * This is THE source of truth for all metrics calculations
 */
export function calculateMetrics(sessions: WorkoutSession[]): SessionMetrics {
    const completed = filterCompletedSessions(sessions);
    const count = completed.length;

    if (count === 0) {
        return {
            totalSessions: 0,
            totalVolume: 0,
            totalSets: 0,
            totalReps: 0,
            totalDuration: 0,
            avgVolume: 0,
            avgDuration: 0,
            avgSets: 0,
        };
    }

    const totalVolume = calculateTotalVolume(completed);
    const totalSets = completed.reduce((sum, s) => sum + (s.totalSets || 0), 0);
    const totalReps = completed.reduce((sum, s) => sum + (s.totalReps || 0), 0);
    const totalDuration = calculateTotalDuration(completed);

    return {
        totalSessions: count,
        totalVolume,
        totalSets,
        totalReps,
        totalDuration,
        avgVolume: Math.round(totalVolume / count),
        avgDuration: Math.round(totalDuration / count),
        avgSets: Math.round(totalSets / count),
    };
}

/**
 * Calculate comprehensive weekly stats
 * This replaces duplicate useMemo logic in Dashboard, AthleteDetail, AnalyticsView
 */
export function calculateWeeklyStats(sessions: WorkoutSession[]): WeeklyStats {
    const completedSessions = filterCompletedSessions(sessions);
    const weekSessions = filterWeekSessions(sessions);
    const monthSessions = filterMonthSessions(sessions);

    const totalVolume = calculateTotalVolume(completedSessions);
    const weekVolume = calculateTotalVolume(weekSessions);
    const totalDuration = calculateTotalDuration(completedSessions);
    const totalSets = completedSessions.reduce((sum, s) => sum + (s.totalSets || 0), 0);
    const totalReps = completedSessions.reduce((sum, s) => sum + (s.totalReps || 0), 0);

    return {
        weekVolume,
        weekSessions: weekSessions.length,
        monthSessions: monthSessions.length,
        totalVolume,
        totalSessions: completedSessions.length,
        avgDuration: completedSessions.length > 0
            ? Math.round(totalDuration / completedSessions.length)
            : 0,
        avgVolumePerSession: completedSessions.length > 0
            ? Math.round(totalVolume / completedSessions.length)
            : 0,
        totalSets,
        totalReps,
    };
}

/**
 * Calculate stats for a specific athlete
 */
export function calculateAthleteStats(
    sessions: WorkoutSession[],
    athleteId: string
): AthleteStats {
    const athleteSessions = filterSessionsByAthlete(sessions, athleteId);
    const weeklyStats = calculateWeeklyStats(athleteSessions);

    return {
        ...weeklyStats,
        athleteId,
    };
}

// ============================================
// WEEK METRICS (convenience wrappers)
// ============================================

/**
 * Calculate week metrics
 */
export function getWeekMetrics(sessions: WorkoutSession[]): SessionMetrics {
    return calculateMetrics(filterWeekSessions(sessions));
}

/**
 * Calculate month metrics
 */
export function getMonthMetrics(sessions: WorkoutSession[]): SessionMetrics {
    return calculateMetrics(filterMonthSessions(sessions));
}

// ============================================
// VOLUME DATA FOR CHARTS
// ============================================

/**
 * Calculate weekly volume data for charts
 */
export function getWeeklyVolumeData(
    sessions: WorkoutSession[],
    weeksBack = 8
): Array<{ weekStart: string; volume: number; sessions: number }> {
    const now = new Date();
    const weeks: Array<{ weekStart: string; volume: number; sessions: number }> = [];

    for (let i = weeksBack - 1; i >= 0; i--) {
        const targetDate = new Date(now);
        targetDate.setDate(now.getDate() - i * 7);
        const range = getWeekRange(targetDate);

        const weekSessions = filterSessionsByDateRange(sessions, range);
        const volume = calculateTotalVolume(weekSessions);

        weeks.push({
            weekStart: formatDateKey(range.start),
            volume,
            sessions: weekSessions.length,
        });
    }

    return weeks;
}

// ============================================
// INTENSITY / FATIGUE CALCULATIONS
// ============================================

/**
 * Calculate average intensity of a session from completed sets
 * Uses set.intensity if available, otherwise falls back to set.rpe
 * Range: 1-10
 */
export function computeSessionAvgIntensity(session: WorkoutSession): number | null {
    if (!session.exercises || !session.exercises.length) return null;

    const completedSets = session.exercises
        .flatMap(ex => ex.sets || [])
        .filter(set => set.isCompleted && typeof (set.intensity ?? set.rpe) === 'number');

    if (!completedSets.length) return null;

    const sum = completedSets.reduce((acc, set) => {
        const value = (set.intensity ?? set.rpe) as number;
        return acc + value;
    }, 0);

    const avg = sum / completedSets.length;
    return Number.isFinite(avg) ? Math.round(avg * 10) / 10 : null;
}

/**
 * Get intensity/fatigue time series for an athlete
 * Returns array of { date, preSessionFatigue, avgIntensity } ordered by date
 */
export function getAthleteIntensityFatigueSeries(
    sessions: WorkoutSession[],
    athleteId: string
): Array<{ date: string; preSessionFatigue: number | null; avgIntensity: number | null }> {
    return sessions
        .filter(s => s.athleteId === athleteId && s.status === 'completed')
        .sort((a, b) => (a.completedAt || '').localeCompare(b.completedAt || ''))
        .map(s => ({
            date: s.completedAt || s.scheduledDate || '',
            preSessionFatigue: typeof s.preSessionFatigue === 'number' ? s.preSessionFatigue : null,
            avgIntensity: typeof s.avgIntensity === 'number' ? s.avgIntensity : null,
        }));
}

/**
 * Calculate weekly average intensity and fatigue
 * Returns { avgIntensity, avgFatigue, count } for sessions in current week
 */
export function getWeeklyIntensityFatigue(
    sessions: WorkoutSession[]
): { avgIntensity: number | null; avgFatigue: number | null; count: number } {
    const weekSessions = filterWeekSessions(sessions);

    if (weekSessions.length === 0) {
        return { avgIntensity: null, avgFatigue: null, count: 0 };
    }

    // Calculate average intensity
    const intensityValues = weekSessions
        .filter(s => typeof s.avgIntensity === 'number')
        .map(s => s.avgIntensity as number);

    const avgIntensity = intensityValues.length > 0
        ? Math.round((intensityValues.reduce((a, b) => a + b, 0) / intensityValues.length) * 10) / 10
        : null;

    // Calculate average fatigue
    const fatigueValues = weekSessions
        .filter(s => typeof s.preSessionFatigue === 'number')
        .map(s => s.preSessionFatigue as number);

    const avgFatigue = fatigueValues.length > 0
        ? Math.round((fatigueValues.reduce((a, b) => a + b, 0) / fatigueValues.length) * 10) / 10
        : null;

    return { avgIntensity, avgFatigue, count: weekSessions.length };
}

// ============================================
// COMPLETION RATE
// ============================================

/**
 * Calculate completion rate for planned sessions
 */
export function calculateCompletionRate(
    completedCount: number,
    plannedCount: number
): number {
    const total = completedCount + plannedCount;
    if (total === 0) return completedCount > 0 ? 100 : 0;
    return Math.round((completedCount / total) * 100);
}

// ============================================
// ACTIVE ATHLETES
// ============================================

/**
 * Count active athletes (those with isActive = true)
 */
export function countActiveAthletes(athletes: Athlete[]): number {
    return athletes.filter(a => a.isActive).length;
}

// ============================================
// TEMPLATE USAGE
// ============================================

/**
 * Get template usage counts from sessions
 */
export function getTemplateUsage(sessions: WorkoutSession[]): Record<string, number> {
    const usage: Record<string, number> = {};
    sessions.forEach(s => {
        if (s.templateId) {
            usage[s.templateId] = (usage[s.templateId] || 0) + 1;
        }
    });
    return usage;
}

/**
 * Get the most used template ID
 */
export function getMostUsedTemplateId(sessions: WorkoutSession[]): string | null {
    const usage = getTemplateUsage(sessions);
    const entries = Object.entries(usage);
    if (entries.length === 0) return null;
    return entries.sort((a, b) => b[1] - a[1])[0][0];
}

// ============================================
// LEGACY COMPATIBILITY (deprecated, use above functions)
// ============================================

/** @deprecated Use getWeekRange() from dateHelpers instead */
export function getCurrentWeekRange() {
    return getWeekRange();
}

/** @deprecated Use getMonthRange() from dateHelpers instead */
export function getCurrentMonthRange() {
    return getMonthRange();
}

/** @deprecated Use filterWeekSessions instead */
export function getWeekSessions(sessions: WorkoutSession[]): WorkoutSession[] {
    return filterWeekSessions(sessions);
}

/** @deprecated Use filterMonthSessions instead */
export function getMonthSessions(sessions: WorkoutSession[]): WorkoutSession[] {
    return filterMonthSessions(sessions);
}

/** @deprecated Use filterCompletedSessions instead */
export function getCompletedSessions(sessions: WorkoutSession[]): WorkoutSession[] {
    return filterCompletedSessions(sessions);
}
