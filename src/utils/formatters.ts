/**
 * Date Formatters - Utilidades centralizadas de formateo
 * Elimina duplicación en vistas
 */

/**
 * Format date with Spanish locale
 */
export function formatDate(
    dateStr?: string | Date,
    options?: Intl.DateTimeFormatOptions
): string {
    if (!dateStr) return '-';
    const date = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;

    return date.toLocaleDateString('es-ES', options || {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
    });
}

/**
 * Format date for display (short)
 */
export function formatDateShort(dateStr?: string): string {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('es-ES', {
        day: '2-digit',
        month: 'short'
    });
}

/**
 * Format date with time
 */
export function formatDateTime(dateStr?: string): string {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('es-ES', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
    });
}

/**
 * Format time from seconds (MM:SS)
 */
export function formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Format duration in minutes to human readable
 */
export function formatDuration(minutes: number): string {
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const remainingMins = minutes % 60;
    return remainingMins > 0 ? `${hours}h ${remainingMins}m` : `${hours}h`;
}

/**
 * Format volume (kg) to readable format
 */
export function formatVolume(kg: number): string {
    if (kg >= 1000000) return `${(kg / 1000000).toFixed(1)}M`;
    if (kg >= 1000) return `${(kg / 1000).toFixed(1)}K`;
    return `${kg}`;
}

/**
 * Format percentage
 */
export function formatPercentage(value: number, decimals = 0): string {
    return `${value.toFixed(decimals)}%`;
}

/**
 * Get relative time string (today, yesterday, etc)
 */
export function getRelativeTimeString(dateStr: string): string {
    const date = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const diffDays = Math.floor((today.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return formatDateShort(dateStr);
}

// ============================================
// WEIGHT & REPS FORMATTERS (Sprint 6.3)
// ============================================

/**
 * Format weight with unit
 */
export function formatWeight(kg: number, showUnit = true): string {
    if (kg <= 0) return '-';
    const rounded = Math.round(kg * 10) / 10;
    return showUnit ? `${rounded} kg` : `${rounded}`;
}

/**
 * Format reps count
 */
export function formatReps(reps: number): string {
    if (reps <= 0) return '-';
    return `${reps}`;
}

/**
 * Format set summary (weight x reps)
 */
export function formatSetSummary(weight: number, reps: number): string {
    if (weight <= 0 && reps <= 0) return '-';
    return `${formatWeight(weight, false)} × ${reps}`;
}

/**
 * Format RPE value
 */
export function formatRPE(rpe: number): string {
    if (rpe <= 0 || rpe > 10) return '-';
    return `RPE ${rpe}`;
}

/**
 * Format intensity percentage
 */
export function formatIntensity(percentage: number): string {
    return `${Math.round(percentage)}%`;
}
