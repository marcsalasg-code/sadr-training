/**
 * oneRMCalculator.ts - Utilidades para cálculo de 1RM
 * 
 * Fórmulas estándar (Epley, Brzycki) + utilidades para bodyweight,
 * carga efectiva, e incrementos recomendados.
 * 
 * IMPORTANTE: Estas funciones SOLO estiman, NUNCA fijan valores.
 * El usuario siempre tiene control sobre su 1RM.
 */

import type { SetEntry, Exercise, OneRMRecord, OneRMHistoryEntry, OneRMSource } from '../types/types';

// ============================================
// FÓRMULAS DE ESTIMACIÓN 1RM
// ============================================

/**
 * Estimate 1RM using Epley formula
 * 1RM = weight × (1 + reps/30)
 * Accurate for 1-10 reps
 */
export function estimateOneRM_Epley(weight: number, reps: number): number {
    if (reps <= 0 || weight <= 0) return 0;
    if (reps === 1) return weight;
    if (reps > 10) return weight; // Not reliable beyond 10 reps

    return Math.round(weight * (1 + reps / 30));
}

/**
 * Estimate 1RM using Brzycki formula
 * 1RM = weight × 36 / (37 - reps)
 * Slightly more conservative than Epley
 */
export function estimateOneRM_Brzycki(weight: number, reps: number): number {
    if (reps <= 0 || weight <= 0) return 0;
    if (reps === 1) return weight;
    if (reps >= 37) return weight; // Formula breaks at 37 reps
    if (reps > 10) return weight; // Not reliable beyond 10 reps

    return Math.round(weight * 36 / (37 - reps));
}

/**
 * Estimate 1RM using Lombardi formula
 * 1RM = weight × reps^0.10
 * More accurate for higher reps
 */
export function estimateOneRM_Lombardi(weight: number, reps: number): number {
    if (reps <= 0 || weight <= 0) return 0;
    if (reps === 1) return weight;
    if (reps > 10) return weight; // Not reliable beyond 10 reps

    return Math.round(weight * Math.pow(reps, 0.10));
}

/**
 * Estimate 1RM using the more conservative of Epley and Brzycki
 * This is the recommended function to use for suggestions
 */
export function estimateOneRM(weight: number, reps: number): number {
    if (reps <= 0 || weight <= 0) return 0;
    if (reps === 1) return weight;
    if (reps > 10) return weight;

    const epley = estimateOneRM_Epley(weight, reps);
    const brzycki = estimateOneRM_Brzycki(weight, reps);

    // Return the more conservative (lower) estimate
    return Math.min(epley, brzycki);
}

/**
 * Estimate 1RM using all three formulas (Epley, Brzycki, Lombardi)
 * Returns the average for a more balanced estimate
 */
export function estimateOneRM_Average(weight: number, reps: number): {
    epley: number;
    brzycki: number;
    lombardi: number;
    average: number;
} {
    if (reps <= 0 || weight <= 0) {
        return { epley: 0, brzycki: 0, lombardi: 0, average: 0 };
    }

    const epley = estimateOneRM_Epley(weight, reps);
    const brzycki = estimateOneRM_Brzycki(weight, reps);
    const lombardi = estimateOneRM_Lombardi(weight, reps);
    const average = Math.round((epley + brzycki + lombardi) / 3);

    return { epley, brzycki, lombardi, average };
}

// ============================================
// CARGA EFECTIVA (BODYWEIGHT + LASTRE)
// ============================================

/**
 * Calculate effective load for an exercise
 * - For bodyweight exercises: bodyweight + added weight (lastre)
 * - For regular exercises: just the weight
 * 
 * @param weightKg - Weight on bar/machine, or added weight for bodyweight exercises
 * @param isBodyweight - Whether this is a bodyweight exercise
 * @param athleteWeightKg - Athlete's bodyweight (required for bodyweight exercises)
 */
export function getEffectiveLoad(
    weightKg: number,
    isBodyweight: boolean,
    athleteWeightKg?: number
): number {
    if (!isBodyweight) {
        return weightKg;
    }

    // For bodyweight exercises, effective load = bodyweight + added weight
    const bodyweight = athleteWeightKg || 70; // Default if not provided
    return bodyweight + (weightKg || 0);
}

/**
 * Estimate 1RM from a set, handling bodyweight exercises
 */
export function estimateOneRMFromSet(
    set: SetEntry,
    exercise?: Exercise,
    athleteWeightKg?: number
): number {
    const weight = set.actualWeight || set.targetWeight || 0;
    const reps = set.actualReps || set.targetReps || 0;

    if (reps <= 0) return 0;

    const effectiveLoad = getEffectiveLoad(
        weight,
        exercise?.isBodyweight || false,
        athleteWeightKg
    );

    return estimateOneRM(effectiveLoad, reps);
}

// ============================================
// INCREMENTOS RECOMENDADOS
// ============================================

/**
 * Calculate recommended increment for 1RM progression
 * Rule: max(2.5kg, 2.5% of current 1RM)
 */
export function getRecommendedIncrement(currentOneRM: number): number {
    if (currentOneRM <= 0) return 2.5;

    const percentBased = currentOneRM * 0.025;
    return Math.max(2.5, Math.round(percentBased * 2) / 2); // Round to nearest 0.5kg
}

/**
 * Calculate weight for a target rep range based on 1RM
 * Uses reverse Epley formula
 */
export function calculateWeightForReps(
    oneRM: number,
    targetReps: number,
    intensityPercent: number = 100
): number {
    if (oneRM <= 0 || targetReps <= 0) return 0;
    if (targetReps === 1) return Math.round(oneRM * (intensityPercent / 100));

    // Reverse Epley: Weight = 1RM / (1 + reps/30)
    const baseWeight = oneRM / (1 + targetReps / 30);
    const adjustedWeight = baseWeight * (intensityPercent / 100);

    // Round to nearest 2.5kg for practical use
    return Math.round(adjustedWeight / 2.5) * 2.5;
}

// ============================================
// INTENSITY HELPERS
// ============================================

/**
 * Get intensity from a set, defaulting to 7 if not set
 */
export function getSetIntensity(set: SetEntry): number {
    return set.intensity ?? set.rpe ?? 7;
}

/**
 * Calculate average intensity from sets
 */
export function calculateAverageIntensity(sets: SetEntry[]): number {
    if (sets.length === 0) return 7;

    const completedSets = sets.filter(s => s.isCompleted);
    if (completedSets.length === 0) return 7;

    const sum = completedSets.reduce((acc, set) => acc + getSetIntensity(set), 0);
    return Math.round(sum / completedSets.length * 10) / 10;
}

// ============================================
// 1RM RECORD HELPERS
// ============================================

/**
 * Create a new 1RM record
 */
export function createOneRMRecord(
    exerciseId: string,
    oneRM: number,
    source: OneRMSource,
    sessionId?: string
): OneRMRecord {
    const now = new Date().toISOString();

    return {
        exerciseId,
        currentOneRM: oneRM,
        source,
        lastUpdate: now,
        history: [{
            date: now,
            value: oneRM,
            source,
            sessionId,
        }],
        strengthFocusSessions: source !== 'manual' ? 0 : undefined,
    };
}

/**
 * Update an existing 1RM record (adding to history)
 */
export function updateOneRMRecord(
    record: OneRMRecord,
    newOneRM: number,
    source: OneRMSource,
    sessionId?: string
): OneRMRecord {
    const now = new Date().toISOString();
    const historyEntry: OneRMHistoryEntry = {
        date: now,
        value: newOneRM,
        source,
        sessionId,
    };

    return {
        ...record,
        currentOneRM: newOneRM,
        source,
        lastUpdate: now,
        history: [...(record.history || []), historyEntry],
    };
}

/**
 * Check if 1RM recommendations should be active for this exercise
 * Requires: existing 1RM + at least 1 strength focus session
 */
export function canRecommendOneRM(record: OneRMRecord | undefined): boolean {
    if (!record) return false;
    return (record.strengthFocusSessions || 0) >= 1;
}

/**
 * Increment strength focus session count
 */
export function incrementStrengthFocusSessions(record: OneRMRecord): OneRMRecord {
    return {
        ...record,
        strengthFocusSessions: (record.strengthFocusSessions || 0) + 1,
    };
}
