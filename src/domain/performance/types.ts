/**
 * Domain Layer - Performance
 * 
 * Pure types and business logic for performance analysis.
 * Extracted from performanceEngine.ts and metrics.ts
 * No React/Zustand dependencies.
 */

// ============================================
// TYPES
// ============================================

export type LoadClassification = 'light' | 'moderate' | 'heavy' | 'max';
export type VolumeTrend = 'increasing' | 'decreasing' | 'stable' | 'erratic';
export type FatigueLevel = 'fresh' | 'normal' | 'accumulated' | 'high';

export interface PerformanceMetrics {
    totalVolume: number;
    avgIntensity: number;
    avgRPE: number;
    workingSets: number;
    topSetLoad: number;
    bestE1RM: number | null;
}

export interface WeeklyMetrics {
    weekStart: string;
    totalVolume: number;
    sessionCount: number;
    avgIntensity: number;
    avgRPE: number | null;
    fatigueScore: number;
}

export interface ProgressionSuggestion {
    type: 'weight' | 'reps' | 'sets' | 'deload';
    currentValue: number;
    suggestedValue: number;
    reason: string;
    confidence: number;
}

export interface RecoveryStatus {
    muscleGroup: string;
    lastTrainedDate: string;
    hoursSinceTraining: number;
    readinessScore: number; // 0-100
    recommendation: 'ready' | 'caution' | 'rest';
}

// ============================================
// CALCULATIONS (Pure Functions)
// ============================================

/**
 * Classify load based on percentage of 1RM
 */
export function classifyLoad(percentageOf1RM: number): LoadClassification {
    if (percentageOf1RM < 60) return 'light';
    if (percentageOf1RM < 75) return 'moderate';
    if (percentageOf1RM < 90) return 'heavy';
    return 'max';
}

/**
 * Calculate volume load (weight × reps × sets)
 */
export function calculateVolumeLoad(
    weight: number,
    reps: number,
    sets: number
): number {
    return weight * reps * sets;
}

/**
 * Calculate average intensity from sets
 */
export function calculateAverageIntensity(
    sets: Array<{ weight: number; oneRM?: number }>
): number {
    const validSets = sets.filter(s => s.oneRM && s.oneRM > 0);
    if (validSets.length === 0) return 0;

    const totalIntensity = validSets.reduce(
        (sum, s) => sum + (s.weight / s.oneRM!) * 100,
        0
    );

    return Math.round(totalIntensity / validSets.length);
}

/**
 * Calculate fatigue score based on RPE and volume
 */
export function calculateFatigueScore(
    avgRPE: number,
    volumeVsAverage: number // 1.0 = average, 1.2 = 20% above
): number {
    // Base fatigue from RPE (RPE 10 = 100%)
    const rpeFatigue = (avgRPE / 10) * 60;

    // Volume contribution
    const volumeFatigue = Math.max(0, (volumeVsAverage - 1) * 40);

    return Math.min(100, Math.round(rpeFatigue + volumeFatigue));
}

/**
 * Determine fatigue level from score
 */
export function getFatigueLevel(fatigueScore: number): FatigueLevel {
    if (fatigueScore < 30) return 'fresh';
    if (fatigueScore < 50) return 'normal';
    if (fatigueScore < 70) return 'accumulated';
    return 'high';
}

/**
 * Calculate volume trend from weekly data
 */
export function calculateVolumeTrend(weeklyVolumes: number[]): VolumeTrend {
    if (weeklyVolumes.length < 2) return 'stable';

    const recent = weeklyVolumes.slice(-3);
    let increasing = 0;
    let decreasing = 0;

    for (let i = 1; i < recent.length; i++) {
        const change = (recent[i] - recent[i - 1]) / recent[i - 1];
        if (change > 0.05) increasing++;
        else if (change < -0.05) decreasing++;
    }

    if (increasing > decreasing) return 'increasing';
    if (decreasing > increasing) return 'decreasing';
    if (increasing === decreasing && increasing > 0) return 'erratic';
    return 'stable';
}

/**
 * Suggest progression based on performance
 */
export function suggestProgression(
    currentWeight: number,
    lastReps: number,
    targetReps: number,
    lastRPE: number
): ProgressionSuggestion {
    // If exceeded target reps at low RPE, suggest weight increase
    if (lastReps >= targetReps && lastRPE < 8) {
        const increase = currentWeight < 50 ? 2.5 : 5;
        return {
            type: 'weight',
            currentValue: currentWeight,
            suggestedValue: currentWeight + increase,
            reason: `Completed ${lastReps} reps at RPE ${lastRPE}, room for progression`,
            confidence: 0.8,
        };
    }

    // If met target but RPE was high, suggest reps increase
    if (lastReps >= targetReps && lastRPE >= 9) {
        return {
            type: 'reps',
            currentValue: targetReps,
            suggestedValue: targetReps + 1,
            reason: `Build capacity at current weight before increasing`,
            confidence: 0.7,
        };
    }

    // If didn't meet target, suggest deload or same
    if (lastReps < targetReps - 2) {
        return {
            type: 'deload',
            currentValue: currentWeight,
            suggestedValue: currentWeight * 0.9,
            reason: `Performance dropped, consider backing off`,
            confidence: 0.6,
        };
    }

    return {
        type: 'weight',
        currentValue: currentWeight,
        suggestedValue: currentWeight,
        reason: 'Maintain current load',
        confidence: 0.5,
    };
}

/**
 * Calculate recovery readiness
 */
export function calculateRecoveryReadiness(
    hoursSinceTraining: number,
    trainingIntensity: number, // 1-10
    sleepQuality?: number // 1-10
): number {
    // Base recovery rate: ~24-48 hours for full recovery
    const baseRecovery = Math.min(100, (hoursSinceTraining / 48) * 100);

    // Adjust for intensity (higher intensity = slower recovery)
    const intensityFactor = 1 - (trainingIntensity - 5) * 0.05;

    // Adjust for sleep if provided
    const sleepFactor = sleepQuality ? (sleepQuality / 10) : 1;

    return Math.round(Math.min(100, baseRecovery * intensityFactor * sleepFactor));
}

/**
 * Get week start date (Monday)
 */
export function getWeekStart(date: Date = new Date()): Date {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    d.setDate(diff);
    d.setHours(0, 0, 0, 0);
    return d;
}

/**
 * Group sessions by week
 */
export function groupByWeek<T extends { completedAt?: string }>(
    items: T[]
): Map<string, T[]> {
    const groups = new Map<string, T[]>();

    for (const item of items) {
        if (!item.completedAt) continue;

        const weekStart = getWeekStart(new Date(item.completedAt));
        const weekKey = weekStart.toISOString().split('T')[0];

        if (!groups.has(weekKey)) {
            groups.set(weekKey, []);
        }
        groups.get(weekKey)!.push(item);
    }

    return groups;
}
