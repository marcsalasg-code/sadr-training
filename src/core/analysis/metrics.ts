/**
 * Metrics Engine - Motor de cálculo de métricas de entrenamiento
 * 
 * SINGLE SOURCE OF TRUTH para todas las métricas de la aplicación.
 * Este módulo unifica:
 * - Cálculos a nivel de SET (top set, e1RM, volumen por bloque)
 * - Cálculos a nivel de SESIÓN (filtros, duración, intensidad)
 * - Clasificaciones para contexto del coach
 * 
 * Los componentes y vistas deben usar estas funciones en lugar de cálculos ad-hoc.
 */

import type { OneRMMethod, VolumeDisplay } from '../config/trainingConfig.model';
import type { WorkoutSession, Athlete } from '../../types/types';
import {
    getWeekRange,
    getMonthRange,
    isWithinDateRange,
    formatDateKey,
    type DateRange,
} from '../../utils/dateHelpers';

// ============================================
// TYPES
// ============================================

/**
 * Executed set - datos de una serie completada
 */
export interface ExecutedSet {
    id: string;
    exerciseId: string;
    blockId?: string;           // Referencia al bloque de SessionStructure
    actualReps: number;
    actualLoadKg: number;
    actualRPE?: number;         // 1-10
    isWarmup?: boolean;         // Para separar calentamientos
}

/**
 * Options for volume calculation
 */
export interface VolumeOptions {
    excludeWarmup?: boolean;
    display?: VolumeDisplay;
}

/**
 * Options for RPE calculation
 */
export interface RPEOptions {
    excludeWarmup?: boolean;
}

// ============================================
// TOP SET
// ============================================

/**
 * Compute top set load (highest weight used in session)
 * Returns null if no valid sets
 */
export function computeTopSetLoadKg(executedSets: ExecutedSet[]): number | null {
    if (executedSets.length === 0) return null;

    // Filter warmups optionally
    const workingSets = executedSets.filter(s => !s.isWarmup);
    if (workingSets.length === 0) return null;

    return Math.max(...workingSets.map(s => s.actualLoadKg));
}

/**
 * Get the top set (highest weight * reps combination)
 */
export function computeTopSet(executedSets: ExecutedSet[]): ExecutedSet | null {
    if (executedSets.length === 0) return null;

    const workingSets = executedSets.filter(s => !s.isWarmup && s.actualLoadKg > 0);
    if (workingSets.length === 0) return null;

    // Find set with highest load, then highest reps at that load
    return workingSets.reduce((best, current) => {
        if (current.actualLoadKg > best.actualLoadKg) return current;
        if (current.actualLoadKg === best.actualLoadKg && current.actualReps > best.actualReps) {
            return current;
        }
        return best;
    });
}

// ============================================
// 1RM ESTIMATION
// ============================================

/**
 * Compute estimated 1RM using specified method
 * 
 * @param loadKg - Weight lifted
 * @param reps - Reps performed
 * @param method - 'brzycki' or 'epley'
 * @returns Estimated 1RM
 */
export function computeEstimated1RM(
    loadKg: number,
    reps: number,
    method: OneRMMethod = 'brzycki'
): number {
    if (loadKg <= 0 || reps <= 0) return 0;
    if (reps === 1) return loadKg;

    // Cap at 12 reps for accuracy
    const effectiveReps = Math.min(reps, 12);

    if (method === 'epley') {
        // Epley formula: weight * (1 + reps/30)
        return Math.round(loadKg * (1 + effectiveReps / 30));
    }

    // Brzycki formula: weight / (1.0278 - 0.0278 * reps)
    const denominator = 1.0278 - (0.0278 * effectiveReps);
    if (denominator <= 0) return loadKg; // Safety check

    return Math.round(loadKg / denominator);
}

/**
 * Compute e1RM from a set
 */
export function computeSetE1RM(set: ExecutedSet, method: OneRMMethod = 'brzycki'): number {
    return computeEstimated1RM(set.actualLoadKg, set.actualReps, method);
}

/**
 * Find best e1RM from a list of sets
 */
export function computeBestE1RM(
    executedSets: ExecutedSet[],
    method: OneRMMethod = 'brzycki'
): number | null {
    const workingSets = executedSets.filter(s => !s.isWarmup && s.actualLoadKg > 0);
    if (workingSets.length === 0) return null;

    const e1rms = workingSets.map(s => computeSetE1RM(s, method));
    return Math.max(...e1rms);
}

// ============================================
// VOLUME
// ============================================

/**
 * Compute session volume in kg
 * Volume = sum(load * reps) for all working sets
 * 
 * @param executedSets - Array of completed sets
 * @param options - Calculation options
 * @returns Total volume in kg
 */
export function computeSessionVolumeKg(
    executedSets: ExecutedSet[],
    options: VolumeOptions = {}
): number {
    const { excludeWarmup = true } = options;

    const sets = excludeWarmup
        ? executedSets.filter(s => !s.isWarmup)
        : executedSets;

    return sets.reduce((total, set) => {
        return total + (set.actualLoadKg * set.actualReps);
    }, 0);
}

/**
 * Compute volume by exercise
 */
export function computeVolumeByExercise(
    executedSets: ExecutedSet[],
    options: VolumeOptions = {}
): Record<string, number> {
    const { excludeWarmup = true } = options;

    const sets = excludeWarmup
        ? executedSets.filter(s => !s.isWarmup)
        : executedSets;

    const result: Record<string, number> = {};

    for (const set of sets) {
        const volume = set.actualLoadKg * set.actualReps;
        result[set.exerciseId] = (result[set.exerciseId] || 0) + volume;
    }

    return result;
}

/**
 * Compute volume by block
 */
export function computeVolumeByBlock(
    executedSets: ExecutedSet[],
    options: VolumeOptions = {}
): Record<string, number> {
    const { excludeWarmup = true } = options;

    const sets = excludeWarmup
        ? executedSets.filter(s => !s.isWarmup)
        : executedSets;

    const result: Record<string, number> = {};

    for (const set of sets) {
        const blockId = set.blockId || 'main';
        const volume = set.actualLoadKg * set.actualReps;
        result[blockId] = (result[blockId] || 0) + volume;
    }

    return result;
}

// ============================================
// RPE
// ============================================

/**
 * Compute average RPE from sets
 * Returns null if no valid RPE data
 */
export function computeAverageRPE(
    executedSets: ExecutedSet[],
    options: RPEOptions = {}
): number | null {
    const { excludeWarmup = true } = options;

    const sets = excludeWarmup
        ? executedSets.filter(s => !s.isWarmup)
        : executedSets;

    const setsWithRPE = sets.filter(s => s.actualRPE != null);
    if (setsWithRPE.length === 0) return null;

    const sum = setsWithRPE.reduce((total, s) => total + (s.actualRPE || 0), 0);
    return Math.round((sum / setsWithRPE.length) * 10) / 10;
}

/**
 * Compute max RPE from sets
 */
export function computeMaxRPE(
    executedSets: ExecutedSet[],
    options: RPEOptions = {}
): number | null {
    const { excludeWarmup = true } = options;

    const sets = excludeWarmup
        ? executedSets.filter(s => !s.isWarmup)
        : executedSets;

    const setsWithRPE = sets.filter(s => s.actualRPE != null);
    if (setsWithRPE.length === 0) return null;

    return Math.max(...setsWithRPE.map(s => s.actualRPE!));
}

// ============================================
// TONNAGE
// ============================================

/**
 * Format volume for display based on config
 */
export function formatVolume(volumeKg: number, display: VolumeDisplay = 'kg_total'): string {
    if (display === 'tonnage') {
        const tons = volumeKg / 1000;
        return `${tons.toFixed(2)}t`;
    }

    if (volumeKg >= 1000) {
        return `${(volumeKg / 1000).toFixed(1)}K kg`;
    }

    return `${Math.round(volumeKg)} kg`;
}

// ============================================
// SESSION STATS
// ============================================

/**
 * Comprehensive session statistics
 */
export interface SessionStats {
    totalVolume: number;
    totalSets: number;
    totalReps: number;
    topSetLoad: number | null;
    bestE1RM: number | null;
    avgRPE: number | null;
    maxRPE: number | null;
    volumeByExercise: Record<string, number>;
    volumeByBlock: Record<string, number>;
}

/**
 * Compute all session statistics
 */
export function computeSessionStats(
    executedSets: ExecutedSet[],
    method: OneRMMethod = 'brzycki'
): SessionStats {
    const workingSets = executedSets.filter(s => !s.isWarmup);

    return {
        totalVolume: computeSessionVolumeKg(executedSets),
        totalSets: workingSets.length,
        totalReps: workingSets.reduce((sum, s) => sum + s.actualReps, 0),
        topSetLoad: computeTopSetLoadKg(executedSets),
        bestE1RM: computeBestE1RM(executedSets, method),
        avgRPE: computeAverageRPE(executedSets),
        maxRPE: computeMaxRPE(executedSets),
        volumeByExercise: computeVolumeByExercise(executedSets),
        volumeByBlock: computeVolumeByBlock(executedSets),
    };
}

// ============================================
// SESSION-LEVEL TYPES
// ============================================

// Re-export DateRange for convenience
export type { DateRange };

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
// BASIC SESSION CALCULATIONS
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
// COMPREHENSIVE SESSION METRICS
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
// METRIC CLASSIFICATION (Coach Context)
// ============================================

/**
 * Classification levels for metrics
 * Used to provide context to coaches about whether values are normal, high, or low
 */
export type VolumeLevel = 'low' | 'medium' | 'high';
export type ChangeLevel = 'stable' | 'moderate_increase' | 'big_increase' | 'decrease';
export type RiskLevel = 'none' | 'low' | 'medium' | 'high';

/**
 * Experience level type for classification thresholds
 */
export type ExperienceLevelSimple = 'beginner' | 'intermediate' | 'advanced';

/**
 * Volume thresholds by experience level (in kg per week)
 * Based on typical training volumes for strength/hypertrophy programs
 */
const VOLUME_THRESHOLDS: Record<ExperienceLevelSimple, { low: number; high: number }> = {
    beginner: { low: 5000, high: 12000 },
    intermediate: { low: 10000, high: 25000 },
    advanced: { low: 20000, high: 45000 },
};

/**
 * Frequency thresholds by experience level (sessions per week)
 */
const FREQUENCY_THRESHOLDS: Record<ExperienceLevelSimple, { low: number; high: number }> = {
    beginner: { low: 2, high: 4 },
    intermediate: { low: 3, high: 5 },
    advanced: { low: 4, high: 6 },
};

/**
 * Classify weekly volume based on experience level
 * Returns whether the volume is low, medium, or high for the athlete's level
 * 
 * @param volume - Weekly volume in kg
 * @param level - Athlete's experience level
 * @returns VolumeLevel classification
 */
export function classifyWeeklyVolume(
    volume: number,
    level: ExperienceLevelSimple = 'intermediate'
): VolumeLevel {
    const thresholds = VOLUME_THRESHOLDS[level];
    if (volume < thresholds.low) return 'low';
    if (volume > thresholds.high) return 'high';
    return 'medium';
}

/**
 * Classify training frequency based on experience level
 * Returns whether the frequency is low, medium, or high for the athlete's level
 * 
 * @param sessionsPerWeek - Number of sessions per week
 * @param level - Athlete's experience level
 * @returns VolumeLevel classification
 */
export function classifyFrequency(
    sessionsPerWeek: number,
    level: ExperienceLevelSimple = 'intermediate'
): VolumeLevel {
    const thresholds = FREQUENCY_THRESHOLDS[level];
    if (sessionsPerWeek < thresholds.low) return 'low';
    if (sessionsPerWeek > thresholds.high) return 'high';
    return 'medium';
}

/**
 * Classify volume change between periods
 * Detects if volume is stable, increasing moderately, increasing significantly, or decreasing
 * 
 * Thresholds:
 * - decrease: < -10%
 * - stable: -10% to +10%
 * - moderate_increase: +10% to +30%
 * - big_increase: > +30%
 * 
 * @param current - Current period volume
 * @param previous - Previous period volume
 * @returns ChangeLevel classification
 */
export function classifyVolumeChange(
    current: number,
    previous: number
): ChangeLevel {
    if (previous === 0) return 'stable';
    const changePercent = ((current - previous) / previous) * 100;

    if (changePercent < -10) return 'decrease';
    if (changePercent > 30) return 'big_increase';
    if (changePercent > 10) return 'moderate_increase';
    return 'stable';
}

/**
 * Calculate volume change percentage
 * 
 * @param current - Current period volume
 * @param previous - Previous period volume
 * @returns Percentage change (can be negative)
 */
export function calculateVolumeChangePercent(
    current: number,
    previous: number
): number {
    if (previous === 0) return 0;
    return Math.round(((current - previous) / previous) * 100);
}

/**
 * Classify adherence level based on percentage
 * 
 * @param adherencePercent - Adherence percentage (0-100)
 * @returns Risk level (inverse of adherence - high risk if low adherence)
 */
export function classifyAdherenceRisk(adherencePercent: number): RiskLevel {
    if (adherencePercent >= 80) return 'none';
    if (adherencePercent >= 60) return 'low';
    if (adherencePercent >= 40) return 'medium';
    return 'high';
}

/**
 * Get display label for volume level
 */
export function getVolumeLevelLabel(level: VolumeLevel): string {
    const labels: Record<VolumeLevel, string> = {
        low: '🟡 Bajo',
        medium: '🟢 Medio',
        high: '🔴 Alto',
    };
    return labels[level];
}

/**
 * Get display label for change level
 */
export function getChangeLevelLabel(level: ChangeLevel): string {
    const labels: Record<ChangeLevel, string> = {
        stable: '➡️ Estable',
        moderate_increase: '📈 Aumento moderado',
        big_increase: '⚠️ Aumento significativo',
        decrease: '📉 Reducción',
    };
    return labels[level];
}

/**
 * Get display label for risk level
 */
export function getRiskLevelLabel(level: RiskLevel): string {
    const labels: Record<RiskLevel, string> = {
        none: '✅ Sin riesgo',
        low: '🟢 Riesgo bajo',
        medium: '🟡 Riesgo medio',
        high: '🔴 Riesgo alto',
    };
    return labels[level];
}

// ============================================
// LEGACY COMPATIBILITY
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

