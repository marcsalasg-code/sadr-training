/**
 * Dashboard Metrics - Re-exports from centralized metrics module
 * 
 * @deprecated This file is maintained for backward compatibility.
 * Import directly from '../core/analysis/metrics' instead.
 * 
 * All functions are now consolidated in:
 * - src/core/analysis/metrics.ts (SINGLE SOURCE OF TRUTH)
 */

// Re-export all metric functions from the centralized core module
export {
    // Types
    type SessionMetrics,
    type WeeklyStats,
    type AthleteStats,
    type DateRange,

    // Session filters
    filterCompletedSessions,
    filterSessionsByDateRange,
    filterWeekSessions,
    filterMonthSessions,
    filterSessionsByAthlete,

    // Basic calculations
    calculateTotalVolume,
    calculateTotalDuration,
    calculateAvgDuration,
    calculateWeeklyVolume,
    countWeekSessions,
    countMonthSessions,

    // Comprehensive stats
    calculateMetrics,
    calculateWeeklyStats,
    calculateAthleteStats,
    getWeekMetrics,
    getMonthMetrics,
    getWeeklyVolumeData,

    // Intensity/Fatigue
    computeSessionAvgIntensity,
    getAthleteIntensityFatigueSeries,
    getWeeklyIntensityFatigue,

    // Completion rate
    calculateCompletionRate,

    // Athletes
    countActiveAthletes,

    // Templates
    getTemplateUsage,
    getMostUsedTemplateId,
} from '../core/analysis/metrics';

// Re-export date helpers for backward compatibility
export {
    getWeekStart,
    getWeekEnd,
    getWeekRange,
    getMonthStart,
    getMonthEnd,
    getMonthRange,
    formatDateKey,
    isToday,
    isSameDay,
} from './dateHelpers';

