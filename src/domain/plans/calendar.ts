/**
 * Domain Layer - Plans / Calendar
 * 
 * Pure functions for calendar and week-day calculations.
 * No React/Zustand dependencies.
 * 
 * PHASE 4: Extracted from useWeeklySchedule and useTrainingPlanCalendar hooks
 */

import type { WorkoutSession, TrainingPlan, DayPlan } from '../../types/types';
import { formatDateKey } from '../../utils/dateHelpers';

// ============================================
// TYPES
// ============================================

/**
 * Information about a single week day
 */
export interface WeekDayInfo {
    date: string;           // YYYY-MM-DD
    dateObj: Date;
    dayName: string;        // "Mon", "Tue", etc.
    dayNumber: number;      // 1-31
    dayOfWeek: number;      // 0-6 (Sun=0)
    isToday: boolean;
    isPast: boolean;
}

/**
 * Calendar month day
 */
export interface CalendarMonthDay {
    date: Date | null;
    dateKey: string | null;
    dayNumber: number | null;
    isCurrentMonth: boolean;
    isToday: boolean;
    isPast: boolean;
    dayOfWeek: number;
}

/**
 * Week range
 */
export interface WeekRange {
    start: Date;
    end: Date;
    label: string;
}

// ============================================
// CONSTANTS
// ============================================

export const DAY_NAMES_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
export const DAY_NAMES_FULL = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
export const MONTH_NAMES_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
export const MONTH_NAMES_FULL = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
];

// ============================================
// WEEK FUNCTIONS
// ============================================

/**
 * Get the start of the week (Monday) for a given date
 */
export function getWeekStartMonday(date: Date = new Date()): Date {
    const d = new Date(date);
    const day = d.getDay();
    // Get Monday (day 1) - if Sunday (0), go back 6 days
    const diff = day === 0 ? -6 : 1 - day;
    d.setDate(d.getDate() + diff);
    d.setHours(0, 0, 0, 0);
    return d;
}

/**
 * Get the end of the week (Sunday) for a given week start
 */
export function getWeekEnd(weekStart: Date): Date {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + 6);
    d.setHours(23, 59, 59, 999);
    return d;
}

/**
 * Get current week range with formatted label
 */
export function getCurrentWeekRange(fromDate: Date = new Date()): WeekRange {
    const start = getWeekStartMonday(fromDate);
    const end = getWeekEnd(start);

    const startMonth = MONTH_NAMES_SHORT[start.getMonth()];
    const endMonth = MONTH_NAMES_SHORT[end.getMonth()];
    const year = end.getFullYear();

    let label: string;
    if (startMonth === endMonth) {
        label = `${startMonth} ${start.getDate()} - ${end.getDate()}, ${year}`;
    } else {
        label = `${startMonth} ${start.getDate()} - ${endMonth} ${end.getDate()}, ${year}`;
    }

    return { start, end, label };
}

/**
 * Build array of week days (Mon-Sun)
 */
export function buildWeekDays(fromDate: Date = new Date()): WeekDayInfo[] {
    const weekStart = getWeekStartMonday(fromDate);
    const today = new Date();
    const todayKey = formatDateKey(today);
    const days: WeekDayInfo[] = [];

    for (let i = 0; i < 7; i++) {
        const date = new Date(weekStart);
        date.setDate(weekStart.getDate() + i);
        const dateKey = formatDateKey(date);

        days.push({
            date: dateKey,
            dateObj: date,
            dayName: DAY_NAMES_SHORT[date.getDay()],
            dayNumber: date.getDate(),
            dayOfWeek: date.getDay(),
            isToday: dateKey === todayKey,
            isPast: date < today && dateKey !== todayKey,
        });
    }

    return days;
}

// ============================================
// CALENDAR MONTH FUNCTIONS
// ============================================

/**
 * Build calendar month grid (includes padding days from prev/next month)
 * Returns 42 days (6 weeks) for consistent grid layout
 */
export function buildCalendarMonth(year: number, month: number): CalendarMonthDay[] {
    const today = new Date();
    const todayKey = formatDateKey(today);

    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);

    // Get day of week for first day (0=Sun, adjust for Mon start)
    let startDay = firstDayOfMonth.getDay();
    // Convert to Monday-start (Mon=0, Sun=6)
    startDay = startDay === 0 ? 6 : startDay - 1;

    const days: CalendarMonthDay[] = [];

    // Add padding days from previous month
    for (let i = 0; i < startDay; i++) {
        days.push({
            date: null,
            dateKey: null,
            dayNumber: null,
            isCurrentMonth: false,
            isToday: false,
            isPast: true,
            dayOfWeek: i,
        });
    }

    // Add days of current month
    for (let day = 1; day <= lastDayOfMonth.getDate(); day++) {
        const date = new Date(year, month, day);
        const dateKey = formatDateKey(date);
        const dayOfWeek = (startDay + day - 1) % 7;

        days.push({
            date,
            dateKey,
            dayNumber: day,
            isCurrentMonth: true,
            isToday: dateKey === todayKey,
            isPast: date < today && dateKey !== todayKey,
            dayOfWeek,
        });
    }

    // Add padding days for next month to fill 42 cells (6 rows × 7 days)
    const remainingDays = 42 - days.length;
    for (let i = 0; i < remainingDays; i++) {
        const dayOfWeek = (days.length) % 7;
        days.push({
            date: null,
            dateKey: null,
            dayNumber: null,
            isCurrentMonth: false,
            isToday: false,
            isPast: false,
            dayOfWeek,
        });
    }

    return days;
}

// ============================================
// TRAINING DAY FUNCTIONS
// ============================================

/**
 * Check if a date is a training day based on plan
 * Checks if any plan has a session scheduled for this day of week
 */
export function isTrainingDay(
    plans: TrainingPlan[],
    date: Date
): boolean {
    const dayNames: Array<'sunday' | 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday'> =
        ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayName = dayNames[date.getDay()];

    return plans.some(plan =>
        plan.dayPlans?.some(dp => dp.dayOfWeek === dayName)
    );
}

/**
 * Get day plan for a specific date
 */
export function getDayPlanForDate(
    plans: TrainingPlan[],
    date: Date
): DayPlan | undefined {
    const dayNames: Array<'sunday' | 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday'> =
        ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayName = dayNames[date.getDay()];

    for (const plan of plans) {
        const dayPlan = plan.dayPlans?.find(dp => dp.dayOfWeek === dayName);
        if (dayPlan) return dayPlan;
    }
    return undefined;
}

// ============================================
// SESSION FILTERING BY DATE
// ============================================

/**
 * Get sessions for a specific date
 */
export function getSessionsForDate(
    sessions: WorkoutSession[],
    dateKey: string
): WorkoutSession[] {
    return sessions.filter(s =>
        s.scheduledDate?.startsWith(dateKey) ||
        s.completedAt?.startsWith(dateKey)
    );
}

/**
 * Group sessions by date key
 */
export function groupSessionsByDate(
    sessions: WorkoutSession[]
): Map<string, WorkoutSession[]> {
    const map = new Map<string, WorkoutSession[]>();

    for (const session of sessions) {
        const dateKey = session.scheduledDate?.split('T')[0] ||
            session.completedAt?.split('T')[0] ||
            session.createdAt.split('T')[0];

        if (!map.has(dateKey)) {
            map.set(dateKey, []);
        }
        map.get(dateKey)!.push(session);
    }

    return map;
}
