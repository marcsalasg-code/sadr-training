/**
 * useCalendarView - Hook para gestión del calendario mensual
 * 
 * Extrae la lógica de negocio de CalendarView.tsx:
 * - Navegación de mes
 * - Generación de días del calendario
 * - Agrupación de sesiones por fecha
 * - Estado de modales y formularios
 * - Handlers de creación de sesiones
 */

import { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTrainingStore, useSessions, useAthletes, useTemplates } from '../store/store';
import { useTrainingPlan } from './useTrainingPlan';
import { filterSessionsByAthlete } from '../domain/sessions';
// PHASE 6: Use domain calendar functions (LT2)
import {
    isTrainingDay,
    getDayPlanForDate,
    groupSessionsByDate,
} from '../domain/plans/calendar';
import type { WorkoutSession, TrainingPlan, DayPlan, Athlete } from '../types/types';

// ============================================
// TYPES
// ============================================

export interface CalendarDay {
    date: Date | null;
    isCurrentMonth: boolean;
}

export interface UseCalendarViewReturn {
    // Navigation
    currentDate: Date;
    year: number;
    month: number;
    prevMonth: () => void;
    nextMonth: () => void;
    monthNames: string[];
    weekDays: string[];
    dayNames: string[];

    // Calendar data
    calendarDays: CalendarDay[];
    sessionsByDate: Record<string, WorkoutSession[]>;
    filteredSessions: WorkoutSession[];

    // Filtering
    selectedAthleteId: string;
    setSelectedAthleteId: (id: string) => void;
    athleteOptions: { value: string; label: string }[];
    athleteOptionsForCreate: { value: string; label: string }[];
    templateOptions: { value: string; label: string }[];

    // Day click handler
    handleDayClick: (date: Date) => void;

    // Modal state
    selectedDate: Date | null;
    setSelectedDate: (date: Date | null) => void;

    // Handlers
    handleCloseModal: () => void;
    getSessionAction: (session: WorkoutSession) => { label: string; onClick: () => void };

    // Training plan context
    activePlan: TrainingPlan | undefined;
    weeklyAdherence: { completed: number; planned: number; percentage: number };
    isTrainingDayForDate: (date: Date) => boolean;
    getDayPlanForDate: (date: Date) => DayPlan | undefined;

    // Utilities
    isToday: (date: Date) => boolean;
    formatDateKey: (date: Date) => string;
    formatModalDate: (date: Date) => string;
    selectedDaySessions: WorkoutSession[];
    sessionTypeIcons: Record<string, string>;
    statusConfig: Record<string, { label: string; variant: 'default' | 'gold' | 'success' | 'error' }>;
    getAthlete: (id: string) => Athlete | undefined;
}

// ============================================
// CONSTANTS
// ============================================

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const WEEK_DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const SESSION_TYPE_ICONS: Record<string, string> = {
    strength: '💪',
    technique: '🎯',
    mobility: '🧘',
    mixed: '🔀',
    power: '⚡',
    endurance: '🏃',
    recovery: '💤',
    upper: '💪',
    lower: '🦵',
    full_body: '🏋️',
    push: '⬆️',
    pull: '⬇️',
};

const STATUS_CONFIG: Record<string, { label: string; variant: 'default' | 'gold' | 'success' | 'error' }> = {
    reserved: { label: 'Reservada', variant: 'default' },
    planned: { label: 'Planned', variant: 'default' },
    in_progress: { label: 'In Progress', variant: 'gold' },
    completed: { label: 'Completed', variant: 'success' },
    cancelled: { label: 'Cancelled', variant: 'error' },
};

// ============================================
// HOOK IMPLEMENTATION
// ============================================

export function useCalendarView(): UseCalendarViewReturn {
    const navigate = useNavigate();
    const sessions = useSessions();
    const athletes = useAthletes();
    const templates = useTemplates();
    const { getAthlete } = useTrainingStore();
    const { activePlan, weeklyAdherence } = useTrainingPlan();

    // Calendar navigation state
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedAthleteId, setSelectedAthleteId] = useState<string>('all');

    // Modal state - Phase 12D: unified for DayAgendaPanel
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    // Filter sessions by athlete - using domain layer
    const filteredSessions = useMemo(() => {
        if (selectedAthleteId === 'all') return sessions;
        return filterSessionsByAthlete(
            sessions as Parameters<typeof filterSessionsByAthlete>[0],
            selectedAthleteId
        ) as WorkoutSession[];
    }, [sessions, selectedAthleteId]);

    // Generate calendar days (Monday = first day)
    const calendarDays = useMemo((): CalendarDay[] => {
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startWeekday = (firstDay.getDay() + 6) % 7;

        const days: CalendarDay[] = [];

        const prevMonthLastDay = new Date(year, month, 0).getDate();
        for (let i = startWeekday - 1; i >= 0; i--) {
            days.push({ date: new Date(year, month - 1, prevMonthLastDay - i), isCurrentMonth: false });
        }
        for (let i = 1; i <= daysInMonth; i++) {
            days.push({ date: new Date(year, month, i), isCurrentMonth: true });
        }
        const remaining = 42 - days.length;
        for (let i = 1; i <= remaining; i++) {
            days.push({ date: new Date(year, month + 1, i), isCurrentMonth: false });
        }
        return days;
    }, [year, month]);

    // Group sessions by date - using domain function (PHASE 6 LT2)
    const sessionsByDate = useMemo(() => {
        const mapResult = groupSessionsByDate(filteredSessions as Parameters<typeof groupSessionsByDate>[0]);
        // Convert Map to Record for backwards compatibility
        const record: Record<string, WorkoutSession[]> = {};
        mapResult.forEach((sessions, key) => {
            record[key] = sessions as WorkoutSession[];
        });
        return record;
    }, [filteredSessions]);

    // Navigation handlers
    const prevMonth = useCallback(() => setCurrentDate(new Date(year, month - 1, 1)), [year, month]);
    const nextMonth = useCallback(() => setCurrentDate(new Date(year, month + 1, 1)), [year, month]);

    // Utility functions
    const today = new Date();
    const isToday = useCallback((date: Date) =>
        date.getDate() === today.getDate() &&
        date.getMonth() === today.getMonth() &&
        date.getFullYear() === today.getFullYear()
        , []);

    const formatDateKey = useCallback((date: Date) => date.toISOString().split('T')[0], []);

    const formatModalDate = useCallback((date: Date): string => {
        const dayName = DAY_NAMES[date.getDay()];
        const day = date.getDate();
        const monthName = MONTH_NAMES[date.getMonth()];
        return `${dayName}, ${monthName} ${day}`;
    }, []);

    // Select options
    const athleteOptions = useMemo(() => [
        { value: 'all', label: 'All Athletes' },
        ...athletes.map(a => ({ value: a.id, label: a.name }))
    ], [athletes]);

    const athleteOptionsForCreate = useMemo(() => [
        { value: '', label: 'Select athlete...' },
        ...athletes.map(a => ({ value: a.id, label: a.name }))
    ], [athletes]);

    const templateOptions = useMemo(() => [
        { value: '', label: 'No template' },
        ...templates.map(t => ({ value: t.id, label: t.name }))
    ], [templates]);

    // Phase 12D: Day click handler - opens DayAgendaPanel modal directly
    const handleDayClick = useCallback((date: Date) => {
        // Toggle: if same date clicked, close; otherwise open
        if (selectedDate && selectedDate.getTime() === date.getTime()) {
            setSelectedDate(null);
        } else {
            setSelectedDate(date);
        }
    }, [selectedDate]);

    // Modal handlers - Phase 12C/12D: simplified
    const handleCloseModal = useCallback(() => {
        setSelectedDate(null);
    }, []);

    // Phase 12C: handleCreateSession removed - session creation now happens directly in CalendarView modal

    // Session action handler
    const getSessionAction = useCallback((session: WorkoutSession): { label: string; onClick: () => void } => {
        switch (session.status) {
            case 'planned':
                return { label: 'Start', onClick: () => navigate(`/sessions/live/${session.id}`) };
            case 'in_progress':
                return { label: 'Continue', onClick: () => navigate(`/sessions/live/${session.id}`) };
            case 'completed':
            case 'cancelled':
            default:
                return { label: 'View', onClick: () => navigate(`/sessions/live/${session.id}`) };
        }
    }, [navigate]);

    // Training plan helpers - using domain functions (PHASE 6 LT2)
    const isTrainingDayForDate = useCallback((date: Date) => {
        return activePlan ? isTrainingDay([activePlan], date) : false;
    }, [activePlan]);
    const getDayPlanForDateCallback = useCallback((date: Date) => {
        return activePlan ? getDayPlanForDate([activePlan], date) : undefined;
    }, [activePlan]);

    // Selected day sessions
    const selectedDaySessions = useMemo(() =>
        selectedDate ? (sessionsByDate[formatDateKey(selectedDate)] || []) : []
        , [selectedDate, sessionsByDate, formatDateKey]);

    return {
        // Navigation
        currentDate,
        year,
        month,
        prevMonth,
        nextMonth,
        monthNames: MONTH_NAMES,
        weekDays: WEEK_DAYS,
        dayNames: DAY_NAMES,

        // Calendar data
        calendarDays,
        sessionsByDate,
        filteredSessions,

        // Filtering
        selectedAthleteId,
        setSelectedAthleteId,
        athleteOptions,
        athleteOptionsForCreate,
        templateOptions,

        // Day click
        handleDayClick,

        // Modal state
        selectedDate,
        setSelectedDate,

        // Handlers
        handleCloseModal,
        getSessionAction,

        // Training plan context
        activePlan,
        weeklyAdherence,
        isTrainingDayForDate,
        getDayPlanForDate: getDayPlanForDateCallback,

        // Utilities
        isToday,
        formatDateKey,
        formatModalDate,
        selectedDaySessions,
        sessionTypeIcons: SESSION_TYPE_ICONS,
        statusConfig: STATUS_CONFIG,
        getAthlete,
    };
}

export default useCalendarView;
