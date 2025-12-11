/**
 * Analytics Engine - Motor IA para análisis y métricas inteligentes
 * 
 * Calcula:
 * - Weekly Score combinado
 * - Desviación de volumen planificado vs real
 * - Frecuencia por patrón de movimiento
 * - Tendencias y recomendaciones
 */

import type {
    WorkoutSession,
    TrainingPlan,
    WeeklyAdherence,
    Exercise,
} from '../../types/types';

// ============================================
// TYPES
// ============================================

export interface MovementPattern {
    pattern: 'push' | 'pull' | 'hinge' | 'squat' | 'carry' | 'core' | 'other';
    count: number;
    volume: number;
    percentage: number;
}

export interface WeeklyAnalytics {
    weeklyScore: number;
    volumeDeviation: number;
    movementPatterns: MovementPattern[];
    trends: AnalyticsTrend[];
    recommendations: string[];
}

export interface AnalyticsTrend {
    metric: 'volume' | 'sessions' | 'adherence' | 'duration';
    direction: 'up' | 'down' | 'stable';
    percentChange: number;
    description: string;
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Classify exercise into movement pattern
 */
function classifyMovementPattern(exercise: Exercise): MovementPattern['pattern'] {
    const name = exercise.name.toLowerCase();
    const muscles = (exercise.muscleGroups || []).map(m => m.toLowerCase());

    // Push patterns
    if (name.includes('press') || name.includes('push') ||
        muscles.some(m => m.includes('chest') || m.includes('shoulder') || m.includes('tricep'))) {
        return 'push';
    }

    // Pull patterns
    if (name.includes('row') || name.includes('pull') || name.includes('curl') ||
        muscles.some(m => m.includes('back') || m.includes('bicep'))) {
        return 'pull';
    }

    // Hinge patterns
    if (name.includes('deadlift') || name.includes('rdl') || name.includes('hip thrust') ||
        muscles.some(m => m.includes('hamstring') || m.includes('glute'))) {
        return 'hinge';
    }

    // Squat patterns
    if (name.includes('squat') || name.includes('lunge') ||
        muscles.some(m => m.includes('quad'))) {
        return 'squat';
    }

    // Core
    if (muscles.some(m => m.includes('core') || m.includes('abs'))) {
        return 'core';
    }

    // Carry
    if (name.includes('carry') || name.includes('walk')) {
        return 'carry';
    }

    return 'other';
}

/**
 * Calculate volume deviation percentage
 */
function calculateVolumeDeviation(actual: number, target: number): number {
    if (target === 0) return 0;
    return Math.round(((actual - target) / target) * 100);
}

// ============================================
// MAIN ENGINE FUNCTIONS
// ============================================

/**
 * Calculate comprehensive weekly analytics
 */
export function calculateWeeklyAnalytics(
    sessions: WorkoutSession[],
    plan: TrainingPlan | undefined,
    adherence: WeeklyAdherence,
    exercises: Exercise[]
): WeeklyAnalytics {
    // Calculate movement pattern distribution
    const patternCounts: Record<MovementPattern['pattern'], { count: number; volume: number }> = {
        push: { count: 0, volume: 0 },
        pull: { count: 0, volume: 0 },
        hinge: { count: 0, volume: 0 },
        squat: { count: 0, volume: 0 },
        carry: { count: 0, volume: 0 },
        core: { count: 0, volume: 0 },
        other: { count: 0, volume: 0 },
    };

    let totalExercises = 0;

    sessions.forEach(session => {
        session.exercises.forEach(entry => {
            const exercise = exercises.find(e => e.id === entry.exerciseId);
            if (!exercise) return;

            const pattern = classifyMovementPattern(exercise);
            patternCounts[pattern].count++;
            totalExercises++;

            // Calculate volume for this exercise
            const exVolume = entry.sets.reduce((sum, set) => {
                if (set.isCompleted && set.actualWeight && set.actualReps) {
                    return sum + (set.actualWeight * set.actualReps);
                }
                return sum;
            }, 0);
            patternCounts[pattern].volume += exVolume;
        });
    });

    // Convert to array with percentages
    const movementPatterns: MovementPattern[] = Object.entries(patternCounts)
        .map(([pattern, data]) => ({
            pattern: pattern as MovementPattern['pattern'],
            count: data.count,
            volume: data.volume,
            percentage: totalExercises > 0 ? Math.round((data.count / totalExercises) * 100) : 0,
        }))
        .filter(p => p.count > 0)
        .sort((a, b) => b.count - a.count);

    // Generate trends
    const trends: AnalyticsTrend[] = [];

    if (adherence.volumeDeviation !== 0) {
        trends.push({
            metric: 'volume',
            direction: adherence.volumeDeviation > 0 ? 'up' : 'down',
            percentChange: Math.abs(adherence.volumeDeviation),
            description: adherence.volumeDeviation > 0
                ? `Volume ${adherence.volumeDeviation}% above target`
                : `Volume ${Math.abs(adherence.volumeDeviation)}% below target`,
        });
    }

    if (adherence.percentage < 80) {
        trends.push({
            metric: 'adherence',
            direction: 'down',
            percentChange: 100 - adherence.percentage,
            description: `Adherence at ${adherence.percentage}% this week`,
        });
    }

    // Generate recommendations
    const recommendations: string[] = [];

    // Check for pattern imbalances
    const pushPull = movementPatterns.find(p => p.pattern === 'push');
    const pullPattern = movementPatterns.find(p => p.pattern === 'pull');

    if (pushPull && pullPattern) {
        const ratio = pushPull.count / pullPattern.count;
        if (ratio > 1.5) {
            recommendations.push('Consider adding more pulling exercises for balance.');
        } else if (ratio < 0.67) {
            recommendations.push('Consider adding more pushing exercises for balance.');
        }
    }

    if (adherence.percentage < 70) {
        recommendations.push('Low adherence this week. Consider reducing training frequency.');
    }

    if (Math.abs(adherence.volumeDeviation) > 20) {
        if (adherence.volumeDeviation > 0) {
            recommendations.push('Volume significantly above target. Monitor recovery.');
        } else {
            recommendations.push('Volume below target. Consider increasing intensity or session count.');
        }
    }

    return {
        weeklyScore: adherence.weeklyScore || 0,
        volumeDeviation: adherence.volumeDeviation,
        movementPatterns,
        trends,
        recommendations,
    };
}

/**
 * Compare current week to previous week
 */
export function compareWeeks(
    currentWeekSessions: WorkoutSession[],
    previousWeekSessions: WorkoutSession[]
): AnalyticsTrend[] {
    const trends: AnalyticsTrend[] = [];

    // Session count comparison
    const currentCount = currentWeekSessions.length;
    const previousCount = previousWeekSessions.length;

    if (previousCount > 0) {
        const sessionChange = Math.round(((currentCount - previousCount) / previousCount) * 100);
        if (sessionChange !== 0) {
            trends.push({
                metric: 'sessions',
                direction: sessionChange > 0 ? 'up' : 'down',
                percentChange: Math.abs(sessionChange),
                description: `${Math.abs(sessionChange)}% ${sessionChange > 0 ? 'more' : 'fewer'} sessions than last week`,
            });
        }
    }

    // Volume comparison
    const currentVolume = currentWeekSessions.reduce((sum, s) => sum + (s.totalVolume || 0), 0);
    const previousVolume = previousWeekSessions.reduce((sum, s) => sum + (s.totalVolume || 0), 0);

    if (previousVolume > 0) {
        const volumeChange = Math.round(((currentVolume - previousVolume) / previousVolume) * 100);
        if (Math.abs(volumeChange) >= 5) {
            trends.push({
                metric: 'volume',
                direction: volumeChange > 0 ? 'up' : 'down',
                percentChange: Math.abs(volumeChange),
                description: `Volume ${volumeChange > 0 ? 'increased' : 'decreased'} by ${Math.abs(volumeChange)}%`,
            });
        }
    }

    return trends;
}
