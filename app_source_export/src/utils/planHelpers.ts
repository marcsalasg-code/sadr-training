/**
 * Plan Helpers - Utilidades para Training Plan
 * Conexiones entre Calendar, Dashboard y Plan
 */

import type { TrainingPlan, DayPlan, WeekDay } from '../types/types';

/**
 * Get day name from Date
 */
export function getDayName(date: Date): WeekDay {
    const days: WeekDay[] = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    return days[date.getDay()];
}

/**
 * Check if a date is a training day based on the plan
 */
export function isTrainingDay(date: Date, plan: TrainingPlan | undefined): boolean {
    if (!plan) return false;
    const dayName = getDayName(date);
    return plan.weekDays.includes(dayName);
}

/**
 * Get the DayPlan for a specific date
 */
export function getDayPlanFor(date: Date, plan: TrainingPlan | undefined): DayPlan | undefined {
    if (!plan) return undefined;
    const dayName = getDayName(date);
    return plan.dayPlans.find(dp => dp.dayOfWeek === dayName);
}

/**
 * Check if today is a training day
 */
export function isTodayTrainingDay(plan: TrainingPlan | undefined): boolean {
    return isTrainingDay(new Date(), plan);
}

/**
 * Get days remaining in the week for training
 */
export function getRemainingTrainingDays(plan: TrainingPlan | undefined): number {
    if (!plan) return 0;

    const today = new Date();
    const todayIndex = today.getDay();
    const dayMapping: Record<WeekDay, number> = {
        sunday: 0, monday: 1, tuesday: 2, wednesday: 3,
        thursday: 4, friday: 5, saturday: 6
    };

    return plan.weekDays.filter(day => dayMapping[day] >= todayIndex).length;
}

/**
 * Format adherence as percentage string
 */
export function formatAdherence(completed: number, planned: number): string {
    if (planned === 0) return '0%';
    return `${Math.round((completed / planned) * 100)}%`;
}

/**
 * Get intensity color class
 */
export function getIntensityColor(intensity?: 'light' | 'moderate' | 'heavy'): string {
    switch (intensity) {
        case 'light': return 'text-green-400';
        case 'heavy': return 'text-red-400';
        default: return 'text-yellow-400';
    }
}
