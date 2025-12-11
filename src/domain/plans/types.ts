/**
 * Plan Types
 * 
 * Canonical type definitions for training plans.
 */

import type { UUID } from '../shared';

// Re-export UUID for backward compatibility
export type { UUID };

// ============================================
// WEEK DAY & SESSION TYPES
// ============================================

export type WeekDay = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

export type TrainingObjective =
    | 'strength'
    | 'hypertrophy'
    | 'endurance'
    | 'recomposition'
    | 'technique'
    | 'performance'
    | 'general_fitness';

export type SessionType =
    | 'strength'
    | 'technique'
    | 'mobility'
    | 'mixed'
    | 'power'
    | 'endurance'
    | 'recovery'
    | 'upper'
    | 'lower'
    | 'full_body'
    | 'push'
    | 'pull';

export type DayIntensity = 'light' | 'moderate' | 'heavy';

export type BlockType =
    | 'movilidad_calentamiento'
    | 'fuerza'
    | 'tecnica_especifica'
    | 'emom_hiit';

export type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced';

// ============================================
// DAY PLAN
// ============================================

export interface DayPlan {
    dayOfWeek: WeekDay;
    sessionType: SessionType;
    suggestedTemplateId?: UUID;
    estimatedVolume: number;
    estimatedDuration: number;
    focus?: string;
    intensity: DayIntensity;
    expectedBlocks?: BlockType[];
    aiNotes?: string;
}

// ============================================
// PLAN METADATA
// ============================================

export interface PlanMetadata {
    targetLevel: DifficultyLevel;
    currentMicrocycle: 1 | 2 | 3 | 4;
    weeklyAvailability: number;
    recommendedLoad: 'deload' | 'normal' | 'overreach';
    historicalAdherence: number;
    lastAIUpdate?: string;
    fatigueScore?: number;
}

// ============================================
// LEGACY TYPES (for backwards compat)
// ============================================

export interface PlannedSession {
    id: string;
    name: string;
    dayOfWeek: number; // 0-6, Sunday = 0
    templateId?: string;
    focus?: string;
    estimatedDuration?: number;
}

export interface WeekPlan {
    weekNumber: number;
    startDate: string;
    endDate: string;
    sessions: PlannedSession[];
    notes?: string;
    isDeload?: boolean;
}

// ============================================
// TRAINING PLAN
// ============================================

export interface TrainingPlan {
    id: UUID;
    athleteId: UUID;
    name: string;
    description?: string;

    // Schedule
    weekDays: WeekDay[];
    sessionsPerWeek: number;
    dayPlans: DayPlan[];

    // Goals
    objective: TrainingObjective;
    weeklyVolume: number;

    // Legacy week-based structure
    durationWeeks?: number;
    startDate?: string;
    endDate?: string;
    weeks?: WeekPlan[];
    weeklyFrequency?: number;
    goals?: string[];

    // State
    notes?: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;

    // AI/Intelligent features
    metadata?: PlanMetadata;
    aiRecommendations?: string[];
    suggestedTemplateIds?: UUID[];
}

// ============================================
// ADHERENCE
// ============================================

export interface WeeklyAdherence {
    planned: number;
    completed: number;
    percentage: number;
    volumeTarget: number;
    volumeActual: number;
    volumeDeviation: number;
    weeklyScore?: number;
}

export interface PlanAdherence {
    plannedSessions: number;
    completedSessions: number;
    adherenceRate: number;
    currentWeek: number;
    streakDays: number;
}

// ============================================
// PURE FUNCTIONS
// ============================================

/**
 * Calculate plan progress
 */
export function calculatePlanProgress(plan: TrainingPlan): {
    weeksCompleted: number;
    totalWeeks: number;
    progressPercent: number;
} {
    if (!plan.startDate || !plan.durationWeeks) {
        return { weeksCompleted: 0, totalWeeks: 0, progressPercent: 0 };
    }

    const start = new Date(plan.startDate);
    const now = new Date();
    const daysPassed = Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    const weeksCompleted = Math.floor(daysPassed / 7);

    return {
        weeksCompleted: Math.min(weeksCompleted, plan.durationWeeks),
        totalWeeks: plan.durationWeeks,
        progressPercent: Math.round((weeksCompleted / plan.durationWeeks) * 100),
    };
}

/**
 * Calculate adherence rate
 */
export function calculateAdherence(
    plannedCount: number,
    completedCount: number
): number {
    if (plannedCount === 0) return 100;
    return Math.round((completedCount / plannedCount) * 100);
}

/**
 * Get current week of plan
 */
export function getCurrentPlanWeek(plan: TrainingPlan): number {
    if (!plan.startDate) return 1;

    const start = new Date(plan.startDate);
    const now = new Date();
    const daysPassed = Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    return Math.floor(daysPassed / 7) + 1;
}

/**
 * Check if plan is active (within date range)
 */
export function isPlanCurrentlyActive(plan: TrainingPlan): boolean {
    if (!plan.startDate || !plan.endDate) return plan.isActive;

    const now = new Date();
    const start = new Date(plan.startDate);
    const end = new Date(plan.endDate);
    return now >= start && now <= end && plan.isActive;
}

/**
 * Get sessions for a specific day
 */
export function getSessionsForDay(
    plan: TrainingPlan,
    date: Date
): PlannedSession[] {
    const weekNumber = getCurrentPlanWeek(plan);
    const week = plan.weeks?.find(w => w.weekNumber === weekNumber);
    if (!week) return [];

    const dayOfWeek = date.getDay();
    return week.sessions.filter(s => s.dayOfWeek === dayOfWeek);
}

/**
 * Calculate weekly volume distribution
 */
export function calculateWeeklyDistribution(
    sessions: PlannedSession[]
): Record<number, number> {
    const distribution: Record<number, number> = {
        0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0
    };

    for (const session of sessions) {
        distribution[session.dayOfWeek]++;
    }

    return distribution;
}

/**
 * Check if week is deload
 */
export function isDeloadWeek(weekNumber: number, deloadEvery = 4): boolean {
    return weekNumber > 0 && weekNumber % deloadEvery === 0;
}

/**
 * Generate week dates
 */
export function generateWeekDates(startDate: string, weekNumber: number): {
    startDate: string;
    endDate: string;
} {
    const start = new Date(startDate);
    start.setDate(start.getDate() + (weekNumber - 1) * 7);

    const end = new Date(start);
    end.setDate(end.getDate() + 6);

    return {
        startDate: start.toISOString().split('T')[0],
        endDate: end.toISOString().split('T')[0],
    };
}
