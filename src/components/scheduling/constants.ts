/**
 * Scheduling Constants
 * 
 * Shared constants and helpers for session scheduling.
 */

// ============================================
// HOUR SLOTS
// ============================================

export interface HourSlot {
    time: string; // HH:MM
    label: string; // "06:00"
}

/**
 * Generate hour slots from 06:00 to 22:00
 */
export const HOUR_SLOTS: HourSlot[] = Array.from({ length: 17 }, (_, i) => {
    const hour = 6 + i; // 06:00 to 22:00
    const time = `${hour.toString().padStart(2, '0')}:00`;
    return { time, label: time };
});

// ============================================
// DATE/TIME HELPERS
// ============================================

/**
 * Converts a date (YYYY-MM-DD) and time (HH:MM) to an ISO scheduled date string.
 * @param date - Date string in YYYY-MM-DD format
 * @param time - Time string in HH:MM format
 * @returns ISO string like "2025-12-13T09:00:00.000Z"
 */
export function toScheduledDate(date: string, time: string): string {
    return `${date}T${time}:00.000Z`;
}

/**
 * Parses an ISO scheduled date string to date and time parts.
 * Returns safe defaults if input is undefined or invalid.
 * @param iso - ISO date string
 * @returns Object with date (YYYY-MM-DD) and time (HH:MM)
 */
export function fromScheduledDate(iso?: string): { date: string; time: string } {
    if (!iso) {
        const today = new Date();
        return {
            date: today.toISOString().split('T')[0],
            time: '09:00',
        };
    }

    try {
        const [datePart, timePart] = iso.split('T');
        const time = timePart ? timePart.substring(0, 5) : '09:00';
        return { date: datePart, time };
    } catch {
        const today = new Date();
        return {
            date: today.toISOString().split('T')[0],
            time: '09:00',
        };
    }
}

/**
 * Format a date for display (Spanish locale)
 */
export function formatDisplayDate(dateStr: string): string {
    const date = new Date(dateStr + 'T00:00:00');
    const options: Intl.DateTimeFormatOptions = {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    };
    return date.toLocaleDateString('es-ES', options);
}
