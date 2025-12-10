/**
 * performanceEngine.ts - Motor de Rendimiento Centralizado
 * 
 * API unificada para:
 * - Gestión de 1RM por atleta/ejercicio
 * - Estimaciones (Epley, Brzycki, Lombardi)
 * - Progresión inteligente
 * - Mapeo de ejercicios a anclas de referencia
 * 
 * NOTA: Las fórmulas base están en oneRMCalculator.ts. Este engine
 * las orquesta para casos de uso más complejos.
 */

import type { SetEntry, Exercise, OneRMRecord, Athlete, OneRMSource } from '../../types/types';
import {
    estimateOneRM,
    estimateOneRM_Epley,
    estimateOneRM_Brzycki,
    estimateOneRM_Lombardi,
    estimateOneRM_Average,
    getEffectiveLoad,
    calculateWeightForReps,
    getRecommendedIncrement,
    createOneRMRecord,
    updateOneRMRecord,
    getSetIntensity,
} from '../../utils/oneRMCalculator';

// ============================================
// TIPOS
// ============================================

export interface ProgressionStrategy {
    type: 'fixed' | 'percentage';
    value: number; // 2.5 for fixed (kg), 0.025 for percentage (2.5%)
}

export interface LoadSuggestion {
    weight: number;
    reps: number;
    rpeTarget: number;
    basedOn: 'direct' | 'reference' | 'estimated';
    referenceExerciseId?: string;
    confidence: number; // 0-1
}

export interface PerformanceContext {
    athlete: Athlete;
    exercises: Exercise[];
    anchorConfig?: import('../../types/types').OneRMAnchorConfig;
}

// ============================================
// 1RM ESTIMATION FROM SETS
// ============================================

/**
 * Estimate 1RM using all three formulas and return the average
 * Uses functions from oneRMCalculator.ts
 */
export function estimate1RMFromSets(
    sets: SetEntry[],
    exercise?: Exercise,
    athleteWeightKg?: number
): {
    epley: number;
    brzycki: number;
    lombardi: number;
    average: number;
    bestSet: SetEntry | null;
} {
    if (sets.length === 0) {
        return { epley: 0, brzycki: 0, lombardi: 0, average: 0, bestSet: null };
    }

    // Find best set (highest estimated 1RM)
    let bestEstimate = 0;
    let bestSet: SetEntry | null = null;

    sets.forEach(set => {
        if (!set.isCompleted) return;

        const weight = set.actualWeight || set.targetWeight || 0;
        const reps = set.actualReps || set.targetReps || 0;
        if (reps <= 0 || reps > 10) return;

        const effectiveLoad = getEffectiveLoad(
            weight,
            exercise?.isBodyweight || false,
            athleteWeightKg
        );

        const estimate = estimateOneRM(effectiveLoad, reps);
        if (estimate > bestEstimate) {
            bestEstimate = estimate;
            bestSet = set;
        }
    });

    if (!bestSet) {
        return { epley: 0, brzycki: 0, lombardi: 0, average: 0, bestSet: null };
    }

    // TypeScript needs explicit cast after null check
    const foundSet = bestSet as SetEntry;
    const weight = foundSet.actualWeight || foundSet.targetWeight || 0;
    const reps = foundSet.actualReps || foundSet.targetReps || 0;
    const effectiveLoad = getEffectiveLoad(
        weight,
        exercise?.isBodyweight || false,
        athleteWeightKg
    );

    // Use the unified average function from oneRMCalculator
    const estimates = estimateOneRM_Average(effectiveLoad, reps);

    return {
        ...estimates,
        bestSet: foundSet,
    };
}

// ============================================
// GET / UPDATE 1RM
// ============================================

/**
 * Get 1RM for an exercise and athlete
 * Returns undefined if no 1RM exists
 */
export function getOneRepMax(
    exerciseId: string,
    athlete: Athlete
): number | undefined {
    const record = athlete.oneRMRecords?.[exerciseId];
    return record?.currentOneRM;
}

/**
 * Update 1RM for an exercise and athlete
 * Returns updated athlete object (immutable)
 */
export function updateOneRepMax(
    exerciseId: string,
    athlete: Athlete,
    value: number,
    source: OneRMSource = 'manual',
    sessionId?: string
): Athlete {
    const existingRecords = athlete.oneRMRecords || {};
    const existing = existingRecords[exerciseId];

    let updatedRecord: OneRMRecord;

    if (existing) {
        // Update existing
        updatedRecord = updateOneRMRecord(existing, value, source, sessionId);
    } else {
        // Create new
        updatedRecord = createOneRMRecord(exerciseId, value, source, sessionId);
    }

    return {
        ...athlete,
        oneRMRecords: {
            ...existingRecords,
            [exerciseId]: updatedRecord,
        },
    };
}

// ============================================
// PROGRESSION & SUGGESTIONS
// ============================================

/**
 * Suggest next load based on progression strategy
 */
export function suggestNextLoad(
    lastWeight: number,
    strategy: ProgressionStrategy | '2.5kg' | '2.5%' = '2.5kg'
): number {
    const normalizedStrategy: ProgressionStrategy =
        strategy === '2.5kg'
            ? { type: 'fixed', value: 2.5 }
            : strategy === '2.5%'
                ? { type: 'percentage', value: 0.025 }
                : strategy;

    if (normalizedStrategy.type === 'fixed') {
        return Math.round((lastWeight + normalizedStrategy.value) * 2) / 2;
    } else {
        const increment = Math.max(2.5, lastWeight * normalizedStrategy.value);
        return Math.round((lastWeight + increment) * 2) / 2;
    }
}

/**
 * Get reference 1RM for an exercise (using anchor system)
 * For exercises that map to an anchor (e.g., pushups → bench press)
 */
export function getReferenceRM(
    exerciseId: string,
    context: PerformanceContext
): {
    referenceExerciseId: string;
    referenceOneRM: number;
    ratio: number;
} | null {
    const { athlete, exercises, anchorConfig } = context;

    // Check direct reference map (priority list)
    const priorityList = anchorConfig?.referenceMap?.[exerciseId];
    if (priorityList && priorityList.length > 0) {
        // Try each reference in priority order
        for (const refExerciseId of priorityList) {
            const refOneRM = getOneRepMax(refExerciseId, athlete);
            if (refOneRM) {
                return {
                    referenceExerciseId: refExerciseId,
                    referenceOneRM: refOneRM,
                    ratio: 0.7, // Default ratio
                };
            }
        }
    }

    // Fallback: use groupDefaults by bodyRegion
    const exercise = exercises.find(e => e.id === exerciseId);
    if (exercise?.bodyRegion && anchorConfig?.groupDefaults?.[exercise.bodyRegion]) {
        const regionDefaults = anchorConfig.groupDefaults[exercise.bodyRegion];
        for (const refExerciseId of regionDefaults) {
            const refOneRM = getOneRepMax(refExerciseId, athlete);
            if (refOneRM) {
                return {
                    referenceExerciseId: refExerciseId,
                    referenceOneRM: refOneRM,
                    ratio: 0.6, // Slightly lower confidence for region-based
                };
            }
        }
    }

    return null;
}

/**
 * Generate full load suggestion for a set
 */
export function generateLoadSuggestion(
    exerciseId: string,
    targetReps: number,
    targetRPE: number,
    context: PerformanceContext
): LoadSuggestion | null {
    const { athlete, exercises } = context;

    // Try direct 1RM first
    const directOneRM = getOneRepMax(exerciseId, athlete);
    if (directOneRM) {
        const weight = calculateWeightForReps(directOneRM, targetReps, (10 - targetRPE) * 10 + 50);
        return {
            weight,
            reps: targetReps,
            rpeTarget: targetRPE,
            basedOn: 'direct',
            confidence: 0.9,
        };
    }

    // Try reference 1RM
    const reference = getReferenceRM(exerciseId, context);
    if (reference) {
        const exercise = exercises.find(e => e.id === exerciseId);
        const adjustedOneRM = reference.referenceOneRM * reference.ratio;

        // Adjust for bodyweight exercises
        let effectiveOneRM = adjustedOneRM;
        if (exercise?.isBodyweight && athlete.currentWeightKg) {
            effectiveOneRM = adjustedOneRM - athlete.currentWeightKg;
            if (effectiveOneRM < 0) effectiveOneRM = 0;
        }

        const weight = calculateWeightForReps(effectiveOneRM, targetReps, (10 - targetRPE) * 10 + 50);
        return {
            weight: Math.max(0, weight),
            reps: targetReps,
            rpeTarget: targetRPE,
            basedOn: 'reference',
            referenceExerciseId: reference.referenceExerciseId,
            confidence: 0.6,
        };
    }

    return null;
}

// ============================================
// HISTORY & TRENDS
// ============================================

/**
 * Get 1RM history for an exercise
 */
export function getOneRMHistory(
    exerciseId: string,
    athlete: Athlete
): { date: string; value: number; source: OneRMSource }[] {
    const record = athlete.oneRMRecords?.[exerciseId];
    return record?.history?.map((h: import('../../types/types').OneRMHistoryEntry) => ({
        date: h.date,
        value: h.value,
        source: h.source,
    })) || [];
}

/**
 * Calculate 1RM trend (positive = increasing strength)
 */
export function getOneRMTrend(
    exerciseId: string,
    athlete: Athlete
): number {
    const history = getOneRMHistory(exerciseId, athlete);
    if (history.length < 2) return 0;

    // Simple: compare last vs first
    const oldest = history[0].value;
    const newest = history[history.length - 1].value;

    return ((newest - oldest) / oldest) * 100; // Percentage change
}

// ============================================
// AUTO-DEDUCTION
// ============================================

/**
 * Check if we should auto-deduce 1RM after a strength session
 * Requires: no existing 1RM + at least 1 set with weight + reps ≤ 10
 */
export function shouldAutoDeduceOneRM(
    exerciseId: string,
    sets: SetEntry[],
    athlete: Athlete
): boolean {
    // Already has 1RM? Skip
    if (getOneRepMax(exerciseId, athlete)) return false;

    // Need at least one completed set with valid weight/reps
    return sets.some(set =>
        set.isCompleted &&
        (set.actualWeight || set.targetWeight || 0) > 0 &&
        (set.actualReps || set.targetReps || 0) > 0 &&
        (set.actualReps || set.targetReps || 0) <= 10
    );
}

/**
 * Auto-deduce 1RM from session sets
 * Returns the estimated value or null if cannot deduce
 */
export function autoDeduceOneRM(
    _exerciseId: string, // kept for API consistency
    sets: SetEntry[],
    exercise?: Exercise,
    athleteWeightKg?: number
): number | null {
    const result = estimate1RMFromSets(sets, exercise, athleteWeightKg);
    return result.average > 0 ? result.average : null;
}

// ============================================
// INTENSITY ANALYSIS
// ============================================

/**
 * Calculate weekly intensity trend
 */
export function getWeeklyIntensityTrend(
    sessions: { date: string; averageIntensity: number }[]
): { week: string; average: number }[] {
    const byWeek = new Map<string, number[]>();

    sessions.forEach(s => {
        const date = new Date(s.date);
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        const weekKey = weekStart.toISOString().split('T')[0];

        if (!byWeek.has(weekKey)) byWeek.set(weekKey, []);
        byWeek.get(weekKey)!.push(s.averageIntensity);
    });

    return Array.from(byWeek.entries()).map(([week, intensities]) => ({
        week,
        average: Math.round(intensities.reduce((a, b) => a + b, 0) / intensities.length * 10) / 10,
    }));
}

// ============================================
// OVERTRAINING DETECTION (Sprint 7)
// ============================================

export interface OvertrainingIndicator {
    level: 'low' | 'moderate' | 'high' | 'critical';
    score: number; // 0-100
    factors: string[];
    recommendation: string;
}

/**
 * Detect overtraining based on volume, intensity, and frequency
 * @param weeklyVolumes - Array of weekly volumes (last 4+ weeks)
 * @param recentIntensity - Average intensity of last week (1-10)
 * @param sessionsPerWeek - Number of sessions in last week
 * @param averageIntensity - Average intensity baseline
 */
export function detectOvertraining(
    weeklyVolumes: number[],
    recentIntensity: number = 7,
    sessionsPerWeek: number = 3,
    averageIntensity: number = 7
): OvertrainingIndicator {
    const factors: string[] = [];
    let score = 0;

    // Factor 1: Volume spike (recent week vs average)
    if (weeklyVolumes.length >= 2) {
        const recentVolume = weeklyVolumes[weeklyVolumes.length - 1];
        const avgVolume = weeklyVolumes.slice(0, -1).reduce((a, b) => a + b, 0) / (weeklyVolumes.length - 1);

        if (avgVolume > 0) {
            const volumeRatio = recentVolume / avgVolume;
            if (volumeRatio > 1.5) {
                score += 30;
                factors.push(`Volume spike: ${Math.round((volumeRatio - 1) * 100)}% above average`);
            } else if (volumeRatio > 1.25) {
                score += 15;
                factors.push(`Volume increase: ${Math.round((volumeRatio - 1) * 100)}% above average`);
            }
        }
    }

    // Factor 2: High intensity
    if (recentIntensity > 8.5) {
        score += 25;
        factors.push(`High intensity: ${recentIntensity}/10`);
    } else if (recentIntensity > 7.5) {
        score += 10;
        factors.push(`Elevated intensity: ${recentIntensity}/10`);
    }

    // Factor 3: High frequency
    if (sessionsPerWeek > 6) {
        score += 25;
        factors.push(`Very high frequency: ${sessionsPerWeek} sessions/week`);
    } else if (sessionsPerWeek > 5) {
        score += 15;
        factors.push(`High frequency: ${sessionsPerWeek} sessions/week`);
    }

    // Factor 4: Intensity above personal baseline
    if (recentIntensity > averageIntensity + 1.5) {
        score += 20;
        factors.push(`Intensity above baseline: +${(recentIntensity - averageIntensity).toFixed(1)}`);
    }

    // Determine level
    let level: OvertrainingIndicator['level'];
    let recommendation: string;

    if (score >= 70) {
        level = 'critical';
        recommendation = 'Consider a deload week. Reduce volume by 40-50% and intensity.';
    } else if (score >= 50) {
        level = 'high';
        recommendation = 'Monitor recovery closely. Consider reducing volume next week.';
    } else if (score >= 30) {
        level = 'moderate';
        recommendation = 'Ensure adequate sleep and nutrition. Normal training can continue.';
    } else {
        level = 'low';
        recommendation = 'Training load appears sustainable.';
    }

    return { level, score, factors, recommendation };
}

// ============================================
// LOAD WARNINGS (Sprint 6)
// ============================================

export interface LoadWarning {
    exerciseId: string;
    exerciseName?: string;
    proposedWeight: number;
    currentOneRM: number;
    percentageOfRM: number;
    severity: 'info' | 'warning' | 'danger';
    message: string;
}

/**
 * Default thresholds for load warnings
 */
export const DEFAULT_LOAD_THRESHOLDS = {
    info: 85,        // Above 85% of 1RM
    warning: 95,     // Above 95% of 1RM
    danger: 105,     // Above 100% of 1RM (attempting more than max)
};

/**
 * Check if a proposed load is excessive
 */
export function checkLoadWarning(
    exerciseId: string,
    proposedWeight: number,
    athlete: Athlete,
    thresholds = DEFAULT_LOAD_THRESHOLDS
): LoadWarning | null {
    const oneRM = getOneRepMax(exerciseId, athlete);
    if (!oneRM || proposedWeight <= 0) return null;

    const percentageOfRM = (proposedWeight / oneRM) * 100;

    if (percentageOfRM >= thresholds.danger) {
        return {
            exerciseId,
            proposedWeight,
            currentOneRM: oneRM,
            percentageOfRM: Math.round(percentageOfRM),
            severity: 'danger',
            message: `Weight exceeds 1RM (${Math.round(percentageOfRM)}% of ${oneRM}kg)`,
        };
    }

    if (percentageOfRM >= thresholds.warning) {
        return {
            exerciseId,
            proposedWeight,
            currentOneRM: oneRM,
            percentageOfRM: Math.round(percentageOfRM),
            severity: 'warning',
            message: `Weight is very high (${Math.round(percentageOfRM)}% of ${oneRM}kg 1RM)`,
        };
    }

    if (percentageOfRM >= thresholds.info) {
        return {
            exerciseId,
            proposedWeight,
            currentOneRM: oneRM,
            percentageOfRM: Math.round(percentageOfRM),
            severity: 'info',
            message: `High intensity (${Math.round(percentageOfRM)}% of 1RM)`,
        };
    }

    return null;
}

/**
 * Check multiple exercises for load warnings
 */
export function getLoadWarnings(
    exercises: { exerciseId: string; weight: number }[],
    athlete: Athlete,
    thresholds = DEFAULT_LOAD_THRESHOLDS
): LoadWarning[] {
    return exercises
        .map(ex => checkLoadWarning(ex.exerciseId, ex.weight, athlete, thresholds))
        .filter((w): w is LoadWarning => w !== null);
}

// ============================================
// EXPORTS (re-export utils)
// ============================================

export {
    estimateOneRM,
    estimateOneRM_Epley,
    estimateOneRM_Brzycki,
    getEffectiveLoad,
    calculateWeightForReps,
    getRecommendedIncrement,
    getSetIntensity,
};
