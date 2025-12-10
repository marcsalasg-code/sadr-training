/**
 * Date Helpers - Centralized date utility functions
 * 
 * This is the SINGLE SOURCE OF TRUTH for all date operations in the app.
 * All other modules should import from here.
 */

// ============================================
// TYPES
// ============================================

export interface DateRange {
    start: Date;
    end: Date;
}

// ============================================
// WEEK HELPERS
// ============================================

/**
 * Get the start of the week (Monday at 00:00:00)
 * Uses Monday as first day of week (ISO standard)
 */
export function getWeekStart(date: Date = new Date()): Date {
    const result = new Date(date);
    const dayOfWeek = result.getDay();
    // Adjust: Sunday (0) becomes 6, Monday (1) becomes 0, etc.
    const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    result.setDate(result.getDate() - diff);
    result.setHours(0, 0, 0, 0);
    return result;
}

/**
 * Get the end of the week (Sunday at 23:59:59.999)
 */
export function getWeekEnd(date: Date = new Date()): Date {
    const weekStart = getWeekStart(date);
    const result = new Date(weekStart);
    result.setDate(weekStart.getDate() + 6);
    result.setHours(23, 59, 59, 999);
    return result;
}

/**
 * Get the full week range (Monday to Sunday)
 */
export function getWeekRange(date: Date = new Date()): DateRange {
    return {
        start: getWeekStart(date),
        end: getWeekEnd(date),
    };
}

/**
 * Check if a date falls within a specific week
 */
export function isWithinWeek(date: Date, weekStart: Date): boolean {
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);
    return date >= weekStart && date <= weekEnd;
}

/**
 * Get the week range N weeks back from now
 */
export function getWeekRangeNWeeksAgo(weeksAgo: number): DateRange {
    const now = new Date();
    const targetDate = new Date(now);
    targetDate.setDate(now.getDate() - weeksAgo * 7);
    return getWeekRange(targetDate);
}

// ============================================
// MONTH HELPERS
// ============================================

/**
 * Get the start of the month (1st at 00:00:00)
 */
export function getMonthStart(date: Date = new Date()): Date {
    const result = new Date(date.getFullYear(), date.getMonth(), 1);
    result.setHours(0, 0, 0, 0);
    return result;
}

/**
 * Get the end of the month (last day at 23:59:59.999)
 */
export function getMonthEnd(date: Date = new Date()): Date {
    const result = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    result.setHours(23, 59, 59, 999);
    return result;
}

/**
 * Get the full month range
 */
export function getMonthRange(date: Date = new Date()): DateRange {
    return {
        start: getMonthStart(date),
        end: getMonthEnd(date),
    };
}

// ============================================
// DATE RANGE HELPERS
// ============================================

/**
 * Check if a date is within a date range (inclusive)
 */
export function isWithinDateRange(date: Date, range: DateRange): boolean {
    return date >= range.start && date <= range.end;
}

/**
 * Get date range for the last N days
 */
export function getLastNDaysRange(days: number): DateRange {
    const end = new Date();
    end.setHours(23, 59, 59, 999);

    const start = new Date();
    start.setDate(start.getDate() - days + 1);
    start.setHours(0, 0, 0, 0);

    return { start, end };
}

// ============================================
// FORMATTING HELPERS
// ============================================

/**
 * Format date as ISO date string (YYYY-MM-DD)
 */
export function formatDateKey(date: Date): string {
    return date.toISOString().split('T')[0];
}

/**
 * Format date for display (locale-aware)
 */
export function formatDateDisplay(date: Date, locale = 'es-ES'): string {
    return date.toLocaleDateString(locale, {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    });
}

/**
 * Format date as short weekday (Lun, Mar, etc.)
 */
export function formatWeekday(date: Date, locale = 'es-ES'): string {
    return date.toLocaleDateString(locale, { weekday: 'short' });
}

// ============================================
// COMPARISON HELPERS
// ============================================

/**
 * Check if two dates are the same day
 */
export function isSameDay(date1: Date, date2: Date): boolean {
    return (
        date1.getFullYear() === date2.getFullYear() &&
        date1.getMonth() === date2.getMonth() &&
        date1.getDate() === date2.getDate()
    );
}

/**
 * Check if a date is today
 */
export function isToday(date: Date): boolean {
    return isSameDay(date, new Date());
}

/**
 * Get the number of days between two dates
 */
export function getDaysBetween(date1: Date, date2: Date): number {
    const oneDay = 24 * 60 * 60 * 1000;
    return Math.round(Math.abs((date1.getTime() - date2.getTime()) / oneDay));
}
