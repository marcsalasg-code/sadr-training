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
import { isTrainingDay, getDayPlanFor } from '../utils';
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

    // Day expansion (agenda)
    expandedDate: Date | null;
    setExpandedDate: (date: Date | null) => void;
    handleDayClick: (date: Date) => void;

    // Modal state
    selectedDate: Date | null;
    showCreateForm: boolean;
    newSessionName: string;
    newSessionAthleteId: string;
    newSessionTemplateId: string;
    setNewSessionName: (name: string) => void;
    setNewSessionAthleteId: (id: string) => void;
    setNewSessionTemplateId: (id: string) => void;

    // Handlers
    handleOpenCreateModal: (date: Date, hour?: number) => void;
    handleCloseModal: () => void;
    handleCreateSession: () => void;
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
    const { addSession, getAthlete } = useTrainingStore();
    const { activePlan, weeklyAdherence } = useTrainingPlan();

    // Calendar navigation state
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedAthleteId, setSelectedAthleteId] = useState<string>('all');

    // Modal state
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [newSessionName, setNewSessionName] = useState('');
    const [newSessionAthleteId, setNewSessionAthleteId] = useState('');
    const [newSessionTemplateId, setNewSessionTemplateId] = useState('');

    // Day expansion state
    const [expandedDate, setExpandedDate] = useState<Date | null>(null);

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    // Filter sessions by athlete
    const filteredSessions = useMemo(() => {
        if (selectedAthleteId === 'all') return sessions;
        return sessions.filter(s => s.athleteId === selectedAthleteId);
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

    // Group sessions by date
    const sessionsByDate = useMemo(() => {
        const map: Record<string, WorkoutSession[]> = {};
        filteredSessions.forEach(s => {
            const dateStr = (s.scheduledDate || s.completedAt || s.createdAt).split('T')[0];
            if (!map[dateStr]) map[dateStr] = [];
            map[dateStr].push(s);
        });
        return map;
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

    // Day click handler
    const handleDayClick = useCallback((date: Date) => {
        if (expandedDate && expandedDate.getTime() === date.getTime()) {
            setExpandedDate(null);
        } else {
            setExpandedDate(date);
        }
    }, [expandedDate]);

    // Modal handlers
    const handleOpenCreateModal = useCallback((date: Date, _hour?: number) => {
        setSelectedDate(date);
        setShowCreateForm(true);
        setNewSessionName('');
        setNewSessionAthleteId(selectedAthleteId !== 'all' ? selectedAthleteId : '');
        setNewSessionTemplateId('');
    }, [selectedAthleteId]);

    const handleCloseModal = useCallback(() => {
        setSelectedDate(null);
        setShowCreateForm(false);
    }, []);

    // Create session handler
    const handleCreateSession = useCallback(() => {
        if (!newSessionName.trim() || !newSessionAthleteId || !selectedDate) return;

        const selectedTemplate = templates.find(t => t.id === newSessionTemplateId);

        addSession({
            name: newSessionName.trim(),
            athleteId: newSessionAthleteId,
            templateId: newSessionTemplateId || undefined,
            scheduledDate: formatDateKey(selectedDate),
            status: 'planned',
            exercises: selectedTemplate?.exercises.map((ex, idx) => ({
                id: crypto.randomUUID(),
                exerciseId: ex.exerciseId,
                order: idx,
                sets: Array.from({ length: ex.defaultSets }, (_, i) => ({
                    id: crypto.randomUUID(),
                    setNumber: i + 1,
                    type: 'working' as const,
                    targetReps: ex.defaultReps,
                    targetWeight: ex.defaultWeight,
                    restSeconds: ex.restSeconds,
                    isCompleted: false,
                })),
            })) || [],
        });

        setShowCreateForm(false);
        setNewSessionName('');
        setNewSessionAthleteId('');
        setNewSessionTemplateId('');
    }, [newSessionName, newSessionAthleteId, newSessionTemplateId, selectedDate, templates, addSession, formatDateKey]);

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

    // Training plan helpers
    const isTrainingDayForDate = useCallback((date: Date) => isTrainingDay(date, activePlan), [activePlan]);
    const getDayPlanForDate = useCallback((date: Date) => getDayPlanFor(date, activePlan), [activePlan]);

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

        // Day expansion
        expandedDate,
        setExpandedDate,
        handleDayClick,

        // Modal state
        selectedDate,
        showCreateForm,
        newSessionName,
        newSessionAthleteId,
        newSessionTemplateId,
        setNewSessionName,
        setNewSessionAthleteId,
        setNewSessionTemplateId,

        // Handlers
        handleOpenCreateModal,
        handleCloseModal,
        handleCreateSession,
        getSessionAction,

        // Training plan context
        activePlan,
        weeklyAdherence,
        isTrainingDayForDate,
        getDayPlanForDate,

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
