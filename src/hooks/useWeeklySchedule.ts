/**
 * useWeeklySchedule - Hook for weekly schedule view in Dashboard
 * 
 * Provides the current week (Mon-Sun) with session data for each day.
 * Used by WeeklyScheduleWidget to show coach's weekly overview.
 * 
 * PHASE 6: Refactored to use domain/plans/calendar functions (LT2)
 */

import { useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSessions, useAthletes, useTrainingPlans, useTrainingStore } from '../store/store';
import { formatDateKey } from '../utils/dateHelpers';
import type { WorkoutSession } from '../types/types';
// PHASE 6: Use domain calendar functions instead of local helpers
import {
    getWeekStartMonday,
    getWeekEnd,
    getCurrentWeekRange,
    isTrainingDay,
    DAY_NAMES_SHORT,
} from '../domain/plans/calendar';

// ============================================
// TYPES
// ============================================

export interface SessionSummary {
    id: string;
    name: string;
    athleteId: string;
    athleteName: string;
    status: WorkoutSession['status'];
}

export interface WeekDay {
    date: string;           // YYYY-MM-DD
    dateObj: Date;
    dayName: string;        // "Mon", "Tue", etc.
    dayNumber: number;      // 1-31
    isToday: boolean;
    isPast: boolean;
    isTrainingDay: boolean;
    sessions: SessionSummary[];
}

export interface UseWeeklyScheduleReturn {
    weekDays: WeekDay[];
    currentWeekLabel: string;
    gotoFullCalendar: () => void;
    createSessionForDate: (date: string) => void;
    startSession: (sessionId: string) => void;
    getAthleteName: (athleteId: string) => string;
}

// ============================================
// HOOK IMPLEMENTATION
// ============================================

export function useWeeklySchedule(): UseWeeklyScheduleReturn {
    const navigate = useNavigate();
    const sessions = useSessions();
    const trainingPlans = useTrainingPlans();
    const { getAthlete } = useTrainingStore();

    const today = new Date();
    const todayKey = formatDateKey(today);

    // Get athlete name helper
    const getAthleteName = useCallback((athleteId: string): string => {
        const athlete = getAthlete(athleteId);
        return athlete?.name || 'Unknown';
    }, [getAthlete]);

    // Build week days array (Mon-Sun) - using domain calendar functions
    const weekDays = useMemo((): WeekDay[] => {
        const weekStart = getWeekStartMonday(today);
        const days: WeekDay[] = [];

        for (let i = 0; i < 7; i++) {
            const date = new Date(weekStart);
            date.setDate(weekStart.getDate() + i);
            const dateKey = formatDateKey(date);

            // Get sessions for this day
            const daySessions = sessions.filter(s =>
                s.scheduledDate?.startsWith(dateKey) ||
                s.completedAt?.startsWith(dateKey)
            );

            // Use domain function for training day check
            const isTraining = isTrainingDay(trainingPlans, date);

            // Map sessions to summaries
            const sessionSummaries: SessionSummary[] = daySessions.map(s => ({
                id: s.id,
                name: s.name,
                athleteId: s.athleteId,
                athleteName: getAthleteName(s.athleteId),
                status: s.status,
            }));

            days.push({
                date: dateKey,
                dateObj: date,
                dayName: DAY_NAMES_SHORT[date.getDay()],
                dayNumber: date.getDate(),
                isToday: dateKey === todayKey,
                isPast: date < today && dateKey !== todayKey,
                isTrainingDay: isTraining,
                sessions: sessionSummaries,
            });
        }

        return days;
    }, [sessions, trainingPlans, today, todayKey, getAthleteName]);

    // Current week label - using domain function
    const currentWeekLabel = useMemo(() => {
        const weekRange = getCurrentWeekRange(today);
        return weekRange.label;
    }, [today]);

    // Navigate to full calendar
    const gotoFullCalendar = useCallback(() => {
        navigate('/calendar');
    }, [navigate]);

    // Create session for a specific date
    const createSessionForDate = useCallback((date: string) => {
        navigate(`/sessions?date=${date}`);
    }, [navigate]);

    // Start/continue a session
    const startSession = useCallback((sessionId: string) => {
        navigate(`/sessions/live/${sessionId}`);
    }, [navigate]);

    return {
        weekDays,
        currentWeekLabel,
        gotoFullCalendar,
        createSessionForDate,
        startSession,
        getAthleteName,
    };
}

export default useWeeklySchedule;
