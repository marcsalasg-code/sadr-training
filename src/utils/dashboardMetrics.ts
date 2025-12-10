/**
 * Dashboard Metrics - Re-exports from centralized metrics module
 * 
 * @deprecated This file is maintained for backward compatibility.
 * Import directly from '../utils/metrics' or '../utils/dateHelpers' instead.
 * 
 * All functions are now consolidated in:
 * - src/utils/metrics.ts (session metrics, calculations)
 * - src/utils/dateHelpers.ts (date utilities)
 */

// Re-export all metric functions from the centralized module
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
} from './metrics';

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
