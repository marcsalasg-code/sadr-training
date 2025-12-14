export { useRestTimer, formatTime } from './useRestTimer';
export { useTrainingPlan, type UseTrainingPlanReturn } from './useTrainingPlan';
export { useLiveSession, type UseLiveSessionReturn, type LiveStats, type ExerciseHistoryEntry } from './useLiveSession';
export { useAthleteStats, type AthleteDetailStats } from './useAthleteStats';
export { useCalendarView, type UseCalendarViewReturn } from './useCalendarView';
export { useDashboardData, type UseDashboardDataReturn, type DashboardStats } from './useDashboardData';
export { useAnalyticsData, type UseAnalyticsDataReturn, type AnalyticsMetrics } from './useAnalyticsData';
export { useSessionMetrics, useMultiSessionMetrics, type ExecutedSet, type SessionStats } from './useSessionMetrics';
export { useSessionBuilder, type UseSessionBuilderReturn, type SessionBuilderOptions } from './useSessionBuilder';
export { useSetRow, type UseSetRowOptions, type UseSetRowReturn } from './useSetRow';
export { useExercisePicker, type UseExercisePickerOptions, type UseExercisePickerReturn } from './useExercisePicker';
export { useOneRMAnchorManager, type UseOneRMAnchorManagerReturn, ONE_RM_GROUPS, BODY_REGIONS, type AnchorManagerTab } from './useOneRMAnchorManager';
export { useWeeklySchedule, type UseWeeklyScheduleReturn, type WeekDay, type SessionSummary } from './useWeeklySchedule';
export { useNavigation, type NavItemRuntime, type NavGroupRuntime } from './useNavigation';

// Phase 15C: Role-based visibility hooks
export { useCurrentUser, useIsCoach, useIsAthlete, useAthleteId, useIsAuthenticated } from './useCurrentUser';
export { useVisibleSessions, useMyActiveSession, useMyUpcomingSessions, useMyCompletedSessionsCount } from './useVisibleSessions';
export { useVisibleAthletes, useMyProfile } from './useVisibleAthletes';

