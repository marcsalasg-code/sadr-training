/**
 * Metrics - Re-exports from centralized metrics module
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
    type VolumeLevel,
    type ChangeLevel,
    type RiskLevel,
    type ExperienceLevelSimple,

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

    // Classification functions
    classifyWeeklyVolume,
    classifyFrequency,
    classifyVolumeChange,
    calculateVolumeChangePercent,
    classifyAdherenceRisk,

    // Labels
    getVolumeLevelLabel,
    getChangeLevelLabel,
    getRiskLevelLabel,

    // Legacy compatibility (deprecated)
    getCurrentWeekRange,
    getCurrentMonthRange,
    getWeekSessions,
    getMonthSessions,
    getCompletedSessions,
} from '../core/analysis/metrics';

