/**
 * Metrics Engine - Motor de cálculo de métricas de entrenamiento
 * 
 * Todas las funciones de cálculo de métricas centralizadas aquí.
 * Los componentes y vistas deben usar estas funciones en lugar de cálculos ad-hoc.
 */

import type { OneRMMethod, VolumeDisplay } from '../config/trainingConfig.model';

// ============================================
// TYPES
// ============================================

/**
 * Executed set - datos de una serie completada
 */
export interface ExecutedSet {
    id: string;
    exerciseId: string;
    blockId?: string;           // Referencia al bloque de SessionStructure
    actualReps: number;
    actualLoadKg: number;
    actualRPE?: number;         // 1-10
    isWarmup?: boolean;         // Para separar calentamientos
}

/**
 * Options for volume calculation
 */
export interface VolumeOptions {
    excludeWarmup?: boolean;
    display?: VolumeDisplay;
}

/**
 * Options for RPE calculation
 */
export interface RPEOptions {
    excludeWarmup?: boolean;
}

// ============================================
// TOP SET
// ============================================

/**
 * Compute top set load (highest weight used in session)
 * Returns null if no valid sets
 */
export function computeTopSetLoadKg(executedSets: ExecutedSet[]): number | null {
    if (executedSets.length === 0) return null;

    // Filter warmups optionally
    const workingSets = executedSets.filter(s => !s.isWarmup);
    if (workingSets.length === 0) return null;

    return Math.max(...workingSets.map(s => s.actualLoadKg));
}

/**
 * Get the top set (highest weight * reps combination)
 */
export function computeTopSet(executedSets: ExecutedSet[]): ExecutedSet | null {
    if (executedSets.length === 0) return null;

    const workingSets = executedSets.filter(s => !s.isWarmup && s.actualLoadKg > 0);
    if (workingSets.length === 0) return null;

    // Find set with highest load, then highest reps at that load
    return workingSets.reduce((best, current) => {
        if (current.actualLoadKg > best.actualLoadKg) return current;
        if (current.actualLoadKg === best.actualLoadKg && current.actualReps > best.actualReps) {
            return current;
        }
        return best;
    });
}

// ============================================
// 1RM ESTIMATION
// ============================================

/**
 * Compute estimated 1RM using specified method
 * 
 * @param loadKg - Weight lifted
 * @param reps - Reps performed
 * @param method - 'brzycki' or 'epley'
 * @returns Estimated 1RM
 */
export function computeEstimated1RM(
    loadKg: number,
    reps: number,
    method: OneRMMethod = 'brzycki'
): number {
    if (loadKg <= 0 || reps <= 0) return 0;
    if (reps === 1) return loadKg;

    // Cap at 12 reps for accuracy
    const effectiveReps = Math.min(reps, 12);

    if (method === 'epley') {
        // Epley formula: weight * (1 + reps/30)
        return Math.round(loadKg * (1 + effectiveReps / 30));
    }

    // Brzycki formula: weight / (1.0278 - 0.0278 * reps)
    const denominator = 1.0278 - (0.0278 * effectiveReps);
    if (denominator <= 0) return loadKg; // Safety check

    return Math.round(loadKg / denominator);
}

/**
 * Compute e1RM from a set
 */
export function computeSetE1RM(set: ExecutedSet, method: OneRMMethod = 'brzycki'): number {
    return computeEstimated1RM(set.actualLoadKg, set.actualReps, method);
}

/**
 * Find best e1RM from a list of sets
 */
export function computeBestE1RM(
    executedSets: ExecutedSet[],
    method: OneRMMethod = 'brzycki'
): number | null {
    const workingSets = executedSets.filter(s => !s.isWarmup && s.actualLoadKg > 0);
    if (workingSets.length === 0) return null;

    const e1rms = workingSets.map(s => computeSetE1RM(s, method));
    return Math.max(...e1rms);
}

// ============================================
// VOLUME
// ============================================

/**
 * Compute session volume in kg
 * Volume = sum(load * reps) for all working sets
 * 
 * @param executedSets - Array of completed sets
 * @param options - Calculation options
 * @returns Total volume in kg
 */
export function computeSessionVolumeKg(
    executedSets: ExecutedSet[],
    options: VolumeOptions = {}
): number {
    const { excludeWarmup = true } = options;

    const sets = excludeWarmup
        ? executedSets.filter(s => !s.isWarmup)
        : executedSets;

    return sets.reduce((total, set) => {
        return total + (set.actualLoadKg * set.actualReps);
    }, 0);
}

/**
 * Compute volume by exercise
 */
export function computeVolumeByExercise(
    executedSets: ExecutedSet[],
    options: VolumeOptions = {}
): Record<string, number> {
    const { excludeWarmup = true } = options;

    const sets = excludeWarmup
        ? executedSets.filter(s => !s.isWarmup)
        : executedSets;

    const result: Record<string, number> = {};

    for (const set of sets) {
        const volume = set.actualLoadKg * set.actualReps;
        result[set.exerciseId] = (result[set.exerciseId] || 0) + volume;
    }

    return result;
}

/**
 * Compute volume by block
 */
export function computeVolumeByBlock(
    executedSets: ExecutedSet[],
    options: VolumeOptions = {}
): Record<string, number> {
    const { excludeWarmup = true } = options;

    const sets = excludeWarmup
        ? executedSets.filter(s => !s.isWarmup)
        : executedSets;

    const result: Record<string, number> = {};

    for (const set of sets) {
        const blockId = set.blockId || 'main';
        const volume = set.actualLoadKg * set.actualReps;
        result[blockId] = (result[blockId] || 0) + volume;
    }

    return result;
}

// ============================================
// RPE
// ============================================

/**
 * Compute average RPE from sets
 * Returns null if no valid RPE data
 */
export function computeAverageRPE(
    executedSets: ExecutedSet[],
    options: RPEOptions = {}
): number | null {
    const { excludeWarmup = true } = options;

    const sets = excludeWarmup
        ? executedSets.filter(s => !s.isWarmup)
        : executedSets;

    const setsWithRPE = sets.filter(s => s.actualRPE != null);
    if (setsWithRPE.length === 0) return null;

    const sum = setsWithRPE.reduce((total, s) => total + (s.actualRPE || 0), 0);
    return Math.round((sum / setsWithRPE.length) * 10) / 10;
}

/**
 * Compute max RPE from sets
 */
export function computeMaxRPE(
    executedSets: ExecutedSet[],
    options: RPEOptions = {}
): number | null {
    const { excludeWarmup = true } = options;

    const sets = excludeWarmup
        ? executedSets.filter(s => !s.isWarmup)
        : executedSets;

    const setsWithRPE = sets.filter(s => s.actualRPE != null);
    if (setsWithRPE.length === 0) return null;

    return Math.max(...setsWithRPE.map(s => s.actualRPE!));
}

// ============================================
// TONNAGE
// ============================================

/**
 * Format volume for display based on config
 */
export function formatVolume(volumeKg: number, display: VolumeDisplay = 'kg_total'): string {
    if (display === 'tonnage') {
        const tons = volumeKg / 1000;
        return `${tons.toFixed(2)}t`;
    }

    if (volumeKg >= 1000) {
        return `${(volumeKg / 1000).toFixed(1)}K kg`;
    }

    return `${Math.round(volumeKg)} kg`;
}

// ============================================
// SESSION STATS
// ============================================

/**
 * Comprehensive session statistics
 */
export interface SessionStats {
    totalVolume: number;
    totalSets: number;
    totalReps: number;
    topSetLoad: number | null;
    bestE1RM: number | null;
    avgRPE: number | null;
    maxRPE: number | null;
    volumeByExercise: Record<string, number>;
    volumeByBlock: Record<string, number>;
}

/**
 * Compute all session statistics
 */
export function computeSessionStats(
    executedSets: ExecutedSet[],
    method: OneRMMethod = 'brzycki'
): SessionStats {
    const workingSets = executedSets.filter(s => !s.isWarmup);

    return {
        totalVolume: computeSessionVolumeKg(executedSets),
        totalSets: workingSets.length,
        totalReps: workingSets.reduce((sum, s) => sum + s.actualReps, 0),
        topSetLoad: computeTopSetLoadKg(executedSets),
        bestE1RM: computeBestE1RM(executedSets, method),
        avgRPE: computeAverageRPE(executedSets),
        maxRPE: computeMaxRPE(executedSets),
        volumeByExercise: computeVolumeByExercise(executedSets),
        volumeByBlock: computeVolumeByBlock(executedSets),
    };
}
