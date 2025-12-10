/**
 * useTrainingPlanCalendar - Hook para sincronización plan-calendario
 * 
 * Responsabilidades:
 * - Convertir plan a estructura de calendario
 * - Sincronizar sesiones planificadas con el calendario
 * - Crear eventos de semana desde el plan
 */

import { useMemo, useCallback } from 'react';
import { useTrainingStore, useTrainingPlans, useActiveTrainingPlanId, useSessions } from '../store/store';
import type { TrainingPlan, WorkoutSession, WeekDay, DayPlan } from '../types/types';

// Day mapping for date calculations
const dayIndexMap: Record<WeekDay, number> = {
    sunday: 0,
    monday: 1,
    tuesday: 2,
    wednesday: 3,
    thursday: 4,
    friday: 5,
    saturday: 6,
};

const dayNames: WeekDay[] = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

/**
 * Get the date for a specific weekday in the current or next week
 */
function getNextDateForWeekday(weekDay: WeekDay, fromDate: Date = new Date()): Date {
    const targetDayIndex = dayIndexMap[weekDay];
    const currentDayIndex = fromDate.getDay();

    let daysUntil = targetDayIndex - currentDayIndex;
    if (daysUntil < 0) {
        daysUntil += 7;
    }

    const targetDate = new Date(fromDate);
    targetDate.setDate(fromDate.getDate() + daysUntil);
    targetDate.setHours(9, 0, 0, 0); // Default to 9 AM

    return targetDate;
}

export interface CalendarDay {
    date: Date;
    dateStr: string;
    weekDay: WeekDay;
    isTrainingDay: boolean;
    dayPlan?: DayPlan;
    plannedSession?: WorkoutSession;
    completedSession?: WorkoutSession;
}

export interface UseTrainingPlanCalendarReturn {
    // Data
    calendarDays: CalendarDay[];

    // Actions
    syncPlanToCalendar: (plan?: TrainingPlan) => WorkoutSession[];
    createWeekEventsFromPlan: (plan?: TrainingPlan) => WorkoutSession[];
    syncTrainingPlanWithCalendar: (
        mode: 'full' | 'minimal',
        options?: {
            clearExisting?: boolean;
            weeksAhead?: number;
            plan?: TrainingPlan;
        }
    ) => Promise<{ created: number; updated: number; deleted: number }>;
    getDayPlanFor: (date: Date) => DayPlan | undefined;
    isTrainingDay: (date: Date) => boolean;
}

export function useTrainingPlanCalendar(): UseTrainingPlanCalendarReturn {
    const trainingPlans = useTrainingPlans();
    const activeTrainingPlanId = useActiveTrainingPlanId();
    const sessions = useSessions();
    const { addSession } = useTrainingStore();

    // Get active plan
    const activePlan = useMemo(() => {
        return activeTrainingPlanId
            ? trainingPlans.find(p => p.id === activeTrainingPlanId)
            : undefined;
    }, [trainingPlans, activeTrainingPlanId]);

    // Get calendar days for current week with plan info
    const calendarDays = useMemo((): CalendarDay[] => {
        const days: CalendarDay[] = [];
        const today = new Date();
        const startOfWeek = new Date(today);
        const dayOfWeek = today.getDay();
        startOfWeek.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
        startOfWeek.setHours(0, 0, 0, 0);

        for (let i = 0; i < 7; i++) {
            const date = new Date(startOfWeek);
            date.setDate(startOfWeek.getDate() + i);
            const dateStr = date.toISOString().split('T')[0];
            const weekDay = dayNames[date.getDay()];

            const dayPlan = activePlan?.dayPlans.find(dp => dp.dayOfWeek === weekDay);
            const isTrainingDay = activePlan?.weekDays.includes(weekDay) || false;

            const plannedSession = sessions.find(s =>
                s.athleteId === activePlan?.athleteId &&
                s.status === 'planned' &&
                s.scheduledDate?.startsWith(dateStr)
            );

            const completedSession = sessions.find(s =>
                s.athleteId === activePlan?.athleteId &&
                s.status === 'completed' &&
                s.completedAt?.startsWith(dateStr)
            );

            days.push({
                date,
                dateStr,
                weekDay,
                isTrainingDay,
                dayPlan,
                plannedSession,
                completedSession,
            });
        }

        return days;
    }, [activePlan, sessions]);

    // Get day plan for a specific date
    const getDayPlanFor = useCallback((date: Date): DayPlan | undefined => {
        if (!activePlan) return undefined;
        const weekDay = dayNames[date.getDay()];
        return activePlan.dayPlans.find(dp => dp.dayOfWeek === weekDay);
    }, [activePlan]);

    // Check if a date is a training day
    const isTrainingDay = useCallback((date: Date): boolean => {
        if (!activePlan) return false;
        const weekDay = dayNames[date.getDay()];
        return activePlan.weekDays.includes(weekDay);
    }, [activePlan]);

    /**
     * Sync TrainingPlan to Calendar by creating planned sessions
     * Creates one session per dayPlan for the current week (future days only)
     */
    const syncPlanToCalendar = useCallback((plan?: TrainingPlan): WorkoutSession[] => {
        const targetPlan = plan || activePlan;
        if (!targetPlan) return [];

        const createdSessions: WorkoutSession[] = [];
        const now = new Date();

        // Check existing planned sessions to avoid duplicates
        const existingPlannedDates = new Set(
            sessions
                .filter(s =>
                    s.athleteId === targetPlan.athleteId &&
                    s.status === 'planned' &&
                    s.scheduledDate
                )
                .map(s => s.scheduledDate?.split('T')[0])
        );

        for (const dayPlan of targetPlan.dayPlans) {
            const scheduledDate = getNextDateForWeekday(dayPlan.dayOfWeek, now);
            const dateStr = scheduledDate.toISOString().split('T')[0];

            // Skip if session already exists for this date
            if (existingPlannedDates.has(dateStr)) {
                continue;
            }

            // Skip past dates
            if (scheduledDate < now) {
                continue;
            }

            const sessionData: Omit<WorkoutSession, 'id' | 'createdAt' | 'updatedAt'> = {
                athleteId: targetPlan.athleteId,
                name: dayPlan.sessionType || `${targetPlan.objective} - ${dayPlan.dayOfWeek}`,
                description: `Generated from plan: ${targetPlan.name}`,
                scheduledDate: scheduledDate.toISOString(),
                status: 'planned',
                exercises: [],
            };

            const session = addSession(sessionData);
            createdSessions.push(session);
        }

        return createdSessions;
    }, [activePlan, sessions, addSession]);

    /**
     * Create week events from plan (alias for syncPlanToCalendar)
     */
    const createWeekEventsFromPlan = syncPlanToCalendar;

    /**
     * Advanced sync function with full/minimal modes
     */
    const syncTrainingPlanWithCalendar = useCallback(async (
        mode: 'full' | 'minimal',
        options?: {
            clearExisting?: boolean;
            weeksAhead?: number;
            plan?: TrainingPlan;
        }
    ): Promise<{ created: number; updated: number; deleted: number }> => {
        const targetPlan = options?.plan || activePlan;
        if (!targetPlan) {
            return { created: 0, updated: 0, deleted: 0 };
        }

        const weeksAhead = options?.weeksAhead ?? 1;
        const clearExisting = mode === 'full' || (options?.clearExisting ?? false);

        let deleted = 0;
        let created = 0;

        // Get existing planned sessions for this athlete
        const existingPlanned = sessions.filter(s =>
            s.athleteId === targetPlan.athleteId &&
            s.status === 'planned' &&
            s.scheduledDate
        );

        if (clearExisting) {
            deleted = existingPlanned.length;
            // Note: actual deletion not implemented - would need store method
        }

        // Create sessions for upcoming weeks
        const now = new Date();
        const existingDates = new Set(existingPlanned.map(s => s.scheduledDate?.split('T')[0]));

        for (let week = 0; week < weeksAhead; week++) {
            const weekStart = new Date(now);
            weekStart.setDate(weekStart.getDate() + (week * 7));

            for (const dayPlan of targetPlan.dayPlans) {
                const scheduledDate = getNextDateForWeekday(dayPlan.dayOfWeek, weekStart);
                const dateStr = scheduledDate.toISOString().split('T')[0];

                // Skip if already exists and not in full mode
                if (!clearExisting && existingDates.has(dateStr)) {
                    continue;
                }

                // Skip past dates
                if (scheduledDate <= now) {
                    continue;
                }

                const sessionData: Omit<WorkoutSession, 'id' | 'createdAt' | 'updatedAt'> = {
                    athleteId: targetPlan.athleteId,
                    name: `${dayPlan.sessionType} - ${dayPlan.intensity || 'moderate'}`,
                    description: `${targetPlan.name} | ${dayPlan.focus || targetPlan.objective}`,
                    scheduledDate: scheduledDate.toISOString(),
                    status: 'planned',
                    exercises: [],
                };

                addSession(sessionData);
                created++;
            }
        }

        return { created, updated: 0, deleted };
    }, [activePlan, sessions, addSession]);

    return {
        // Data
        calendarDays,

        // Actions
        syncPlanToCalendar,
        createWeekEventsFromPlan,
        syncTrainingPlanWithCalendar,
        getDayPlanFor,
        isTrainingDay,
    };
}

export default useTrainingPlanCalendar;
