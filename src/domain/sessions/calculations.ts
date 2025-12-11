/**
 * Domain Layer - Sessions / Calculations
 * 
 * Pure calculation functions for sessions.
 * Separated from types.ts for clean architecture.
 * 
 * PHASE 6: Moved from types.ts (LT3)
 */

import type { SetEntry, ExerciseEntry, WorkoutSession, SessionStatus } from './types';

// ============================================
// SET CALCULATIONS
// ============================================

/**
 * Calculate volume for a single set
 */
export function calculateSetVolume(set: SetEntry): number {
    return (set.actualWeight || 0) * (set.actualReps || 0);
}

// ============================================
// EXERCISE CALCULATIONS
// ============================================

/**
 * Calculate total volume for an exercise
 */
export function calculateExerciseVolume(exercise: ExerciseEntry): number {
    return exercise.sets
        .filter(s => s.isCompleted)
        .reduce((sum, set) => sum + calculateSetVolume(set), 0);
}

// ============================================
// SESSION CALCULATIONS
// ============================================

/**
 * Calculate session totals
 */
export function calculateSessionTotals(session: WorkoutSession): {
    totalVolume: number;
    totalSets: number;
    totalReps: number;
    completedExercises: number;
} {
    let totalVolume = 0;
    let totalSets = 0;
    let totalReps = 0;
    let completedExercises = 0;

    for (const exercise of session.exercises) {
        const completedSets = exercise.sets.filter(s => s.isCompleted);
        if (completedSets.length > 0) {
            completedExercises++;
        }
        for (const set of completedSets) {
            totalVolume += calculateSetVolume(set);
            totalSets++;
            totalReps += set.actualReps || 0;
        }
    }

    return { totalVolume, totalSets, totalReps, completedExercises };
}

/**
 * Check if session can be completed
 */
export function canCompleteSession(session: WorkoutSession): { valid: boolean; reason?: string } {
    if (session.exercises.length === 0) {
        return { valid: false, reason: 'Session has no exercises' };
    }

    const hasCompletedSets = session.exercises.some(
        ex => ex.sets.some(s => s.isCompleted)
    );

    if (!hasCompletedSets) {
        return { valid: false, reason: 'No sets completed' };
    }

    return { valid: true };
}

/**
 * Calculate session duration in minutes
 */
export function calculateSessionDuration(startedAt: string, completedAt: string): number {
    const start = new Date(startedAt).getTime();
    const end = new Date(completedAt).getTime();
    return Math.round((end - start) / 60000);
}

/**
 * Get session progress percentage
 */
export function getSessionProgress(session: WorkoutSession): number {
    const totalSets = session.exercises.reduce((sum, ex) => sum + ex.sets.length, 0);
    if (totalSets === 0) return 0;

    const completedSets = session.exercises.reduce(
        (sum, ex) => sum + ex.sets.filter(s => s.isCompleted).length,
        0
    );

    return Math.round((completedSets / totalSets) * 100);
}

// ============================================
// SESSION FILTERS
// ============================================

/**
 * Filter sessions by status
 */
export function filterSessionsByStatus(
    sessions: WorkoutSession[],
    status: SessionStatus
): WorkoutSession[] {
    return sessions.filter(s => s.status === status);
}

/**
 * Filter sessions by athlete
 */
export function filterSessionsByAthlete(
    sessions: WorkoutSession[],
    athleteId: string
): WorkoutSession[] {
    return sessions.filter(s => s.athleteId === athleteId);
}

/**
 * Filter sessions by date range
 */
export function filterSessionsByDateRange(
    sessions: WorkoutSession[],
    fromDate: Date,
    toDate: Date = new Date()
): WorkoutSession[] {
    return sessions.filter(s => {
        const sessionDate = s.completedAt ? new Date(s.completedAt) : new Date(s.createdAt);
        return sessionDate >= fromDate && sessionDate <= toDate;
    });
}

/**
 * Get completed sessions only
 */
export function getCompletedSessions(sessions: WorkoutSession[]): WorkoutSession[] {
    return filterSessionsByStatus(sessions, 'completed');
}

/**
 * Sort sessions by date (newest first)
 */
export function sortSessionsByDate(
    sessions: WorkoutSession[],
    ascending = false
): WorkoutSession[] {
    return [...sessions].sort((a, b) => {
        const dateA = new Date(a.completedAt || a.createdAt).getTime();
        const dateB = new Date(b.completedAt || b.createdAt).getTime();
        return ascending ? dateA - dateB : dateB - dateA;
    });
}
