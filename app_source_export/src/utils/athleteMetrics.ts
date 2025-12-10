/**
 * athleteMetrics.ts - Funciones de cálculo para datos del atleta
 * Incluye: 1RM estimation, IMC, y utilidades de PRs
 */

import type { SetEntry, PersonalRecord } from '../types/types';
import { calculateWeightForReps } from './oneRMCalculator';

// ============================================
// 1RM CALCULATION (Epley Formula)
// ============================================

/**
 * Calculate estimated 1RM using Epley formula
 * Only reliable for reps <= 10
 */
export function calculateEstimated1RM(weight: number, reps: number): number {
    if (reps <= 0 || weight <= 0) return 0;
    if (reps === 1) return weight;
    if (reps > 10) return weight; // Not reliable beyond 10 reps

    // Epley formula: 1RM = Weight × (1 + Reps / 30)
    return Math.round(weight * (1 + reps / 30));
}

// Note: calculateWeightForReps moved to oneRMCalculator.ts (more complete version)

/**
 * Calculate percentage of 1RM
 */
export function calculate1RMPercentage(weight: number, oneRM: number): number {
    if (oneRM <= 0) return 0;
    return Math.round((weight / oneRM) * 100);
}

// ============================================
// PR DETECTION
// ============================================

/**
 * Check if a set is a new Personal Record
 */
export function isPotentialPR(
    set: SetEntry,
    currentPR: PersonalRecord | undefined
): boolean {
    if (!set.actualWeight || !set.actualReps) return false;
    if (set.actualReps > 10) return false; // Not reliable

    const estimated1RM = calculateEstimated1RM(set.actualWeight, set.actualReps);

    if (!currentPR) return true;
    return estimated1RM > currentPR.estimated1RM;
}

/**
 * Create a PersonalRecord from a completed set
 */
export function createPRFromSet(
    set: SetEntry,
    exerciseId: string,
    sessionId?: string
): PersonalRecord | null {
    if (!set.actualWeight || !set.actualReps) return null;
    if (!set.isCompleted) return null;

    return {
        exerciseId,
        weight: set.actualWeight,
        reps: set.actualReps,
        estimated1RM: calculateEstimated1RM(set.actualWeight, set.actualReps),
        date: set.completedAt || new Date().toISOString(),
        sessionId,
    };
}

// ============================================
// BODY METRICS
// ============================================

/**
 * Calculate BMI (Body Mass Index)
 */
export function calculateBMI(weightKg: number, heightCm: number): number {
    if (weightKg <= 0 || heightCm <= 0) return 0;
    const heightM = heightCm / 100;
    return Math.round((weightKg / (heightM * heightM)) * 10) / 10;
}

/**
 * Get BMI category
 */
export function getBMICategory(bmi: number): string {
    if (bmi < 18.5) return 'Bajo peso';
    if (bmi < 25) return 'Normal';
    if (bmi < 30) return 'Sobrepeso';
    return 'Obesidad';
}

/**
 * Calculate ideal weight range (for athletes, adjusted)
 */
export function getIdealWeightRange(heightCm: number, gender: 'male' | 'female' | 'other' = 'male'): { min: number; max: number } {
    const heightM = heightCm / 100;
    // Athletic BMI range: 22-27 for men, 20-25 for women
    const minBMI = gender === 'female' ? 20 : 22;
    const maxBMI = gender === 'female' ? 25 : 27;

    return {
        min: Math.round(minBMI * heightM * heightM),
        max: Math.round(maxBMI * heightM * heightM),
    };
}

// ============================================
// EXPERIENCE LEVEL HELPERS
// ============================================

export const experienceLevelLabels: Record<string, string> = {
    novice: 'Principiante (0-6 meses)',
    beginner: 'Inicial (6-12 meses)',
    intermediate: 'Intermedio (1-3 años)',
    advanced: 'Avanzado (3-5 años)',
    elite: 'Elite (5+ años)',
};

export const experienceLevelMultipliers: Record<string, number> = {
    novice: 0.6,
    beginner: 0.7,
    intermediate: 0.8,
    advanced: 0.9,
    elite: 1.0,
};

/**
 * Get recommended starting weight based on experience level and 1RM
 */
export function getRecommendedWeight(
    oneRM: number,
    experienceLevel: string,
    targetReps: number
): number {
    const multiplier = experienceLevelMultipliers[experienceLevel] || 0.8;
    const baseWeight = calculateWeightForReps(oneRM, targetReps);
    return Math.round(baseWeight * multiplier / 2.5) * 2.5; // Round to nearest 2.5kg
}
