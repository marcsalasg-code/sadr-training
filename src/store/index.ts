/**
 * Store Module - Central exports
 * 
 * This file provides a clean public API for the store module.
 * Import from here instead of directly from store.ts or individual slices.
 */

// Main store hook and types
export { useTrainingStore, type TrainingStore } from './store';

// Slice types (for advanced usage)
export type { AthletesSlice } from './athletesSlice';
export type { SessionsSlice } from './sessionsSlice';
export type { TemplatesSlice } from './templatesSlice';
export type { ExercisesSlice } from './exercisesSlice';
export type { PlansSlice } from './plansSlice';
export type { SettingsSlice } from './settingsSlice';
export type { LabSlice } from './labSlice';

// Default settings
export { defaultSettings } from './settingsSlice';

// Basic selector hooks (from store.ts - backward compatible)
export {
    useAthletes,
    useExercises,
    useSessions,
    useTemplates,
    useSettings,
    useLabEntries,
    useActiveSessionId,
    useTrainingPlans,
    useActiveTrainingPlanId,
    useCompletedSessions,
    usePlannedSessions,
    useInProgressSessions,
    useActiveAthletes,
    useSessionsByAthlete,
    useTemplateUsageStats,
    useWeeklySessionCount,
    useAnchorConfig,
    useExerciseCategories,
} from './store';

// Advanced computed selectors (from selectors.ts)
export {
    useWeeklyStats,
    useAthleteStats,
    useWeekSessions,
    useActiveAthletesCount,
    useMostUsedTemplate,
    useWeeklyCompletionRate,
    useActivePlanWithMeta,
    useHasActiveSession,
    useActiveSession,
} from './selectors';
