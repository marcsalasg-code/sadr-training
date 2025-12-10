/**
 * oneRMEngine.ts - Motor IA para recomendaciones de 1RM
 * 
 * Este engine analiza el rendimiento del atleta y sugiere ajustes de 1RM.
 * IMPORTANTE: NUNCA aplica cambios directamente. Solo genera sugerencias
 * que el usuario debe confirmar explícitamente.
 */

import type { SetEntry, ExerciseEntry, OneRMRecord, WorkoutSession } from '../../types/types';
import {
    estimateOneRM,
    getEffectiveLoad,
    getRecommendedIncrement,
    getSetIntensity,
    calculateAverageIntensity
} from '../../utils/oneRMCalculator';

// ============================================
// TYPES
// ============================================

export type OneRMAction = 'keep' | 'increase' | 'decrease' | 'set_initial';

export interface OneRMRecommendation {
    exerciseId: string;
    exerciseName?: string;
    suggestedOneRM: number;
    currentOneRM?: number;
    changePercent: number;
    changeAbsolute: number;
    action: OneRMAction;
    rationale: string;
    confidence: number; // 0-1
    basedOnSets: number;
    averageIntensity: number;
}

export interface OneRMAnalysisInput {
    exerciseId: string;
    exerciseName?: string;
    currentRecord?: OneRMRecord;
    recentSets: SetEntry[];
    strengthFocusSessions: number;
    athleteWeightKg?: number;
    isBodyweight?: boolean;
    athleteGoal?: string;
}

// ============================================
// ANALYSIS ENGINE
// ============================================

/**
 * Analyze sets and generate 1RM recommendation
 * 
 * Rules:
 * - If no current 1RM: can suggest initial value, but marked as 'set_initial'
 * - If 1RM exists + ≥1 strength session: can suggest increment
 * - Increment = max(2.5kg, 2.5% of current)
 * - High intensity (8-10) + failures → keep or decrease
 * - Moderate intensity (6-7) + solid execution → can increase
 */
export function analyzeOneRMProgression(input: OneRMAnalysisInput): OneRMRecommendation {
    const {
        exerciseId,
        exerciseName,
        currentRecord,
        recentSets,
        strengthFocusSessions,
        athleteWeightKg,
        isBodyweight,
    } = input;

    // Filter to completed sets only
    const completedSets = recentSets.filter(s => s.isCompleted && s.actualReps && s.actualWeight);

    // Calculate estimated 1RMs from each set
    const estimations = completedSets.map(set => {
        const effectiveLoad = getEffectiveLoad(
            set.actualWeight || 0,
            isBodyweight || false,
            athleteWeightKg
        );
        return {
            estimated: estimateOneRM(effectiveLoad, set.actualReps || 0),
            intensity: getSetIntensity(set),
            reps: set.actualReps || 0,
            weight: effectiveLoad,
        };
    }).filter(e => e.estimated > 0);

    if (estimations.length === 0) {
        return createNoDataRecommendation(exerciseId, exerciseName, currentRecord?.currentOneRM);
    }

    // Calculate best estimated 1RM from recent sets
    const bestEstimation = Math.max(...estimations.map(e => e.estimated));
    const avgIntensity = calculateAverageIntensity(completedSets);
    const currentOneRM = currentRecord?.currentOneRM;

    // Case 1: No current 1RM - suggest initial value
    if (!currentOneRM) {
        return {
            exerciseId,
            exerciseName,
            suggestedOneRM: bestEstimation,
            currentOneRM: undefined,
            changePercent: 0,
            changeAbsolute: 0,
            action: 'set_initial',
            rationale: `Basado en ${estimations.length} series recientes. Estimación más alta: ${bestEstimation}kg. Confirma para establecer como tu 1RM inicial.`,
            confidence: estimations.length >= 3 ? 0.8 : 0.6,
            basedOnSets: estimations.length,
            averageIntensity: avgIntensity,
        };
    }

    // Case 2: Has 1RM but no strength focus sessions yet
    if (strengthFocusSessions < 1) {
        return {
            exerciseId,
            exerciseName,
            suggestedOneRM: currentOneRM,
            currentOneRM,
            changePercent: 0,
            changeAbsolute: 0,
            action: 'keep',
            rationale: `Mantener 1RM actual. Necesitas al menos 1 sesión con "enfoque fuerza" para recibir recomendaciones de progresión.`,
            confidence: 0.5,
            basedOnSets: estimations.length,
            averageIntensity: avgIntensity,
        };
    }

    // Case 3: Analyze for progression
    const increment = getRecommendedIncrement(currentOneRM);
    const percentChange = (bestEstimation - currentOneRM) / currentOneRM * 100;

    // High intensity (8-10) with low reps might indicate near-max effort
    const highIntensitySets = estimations.filter(e => e.intensity >= 8);
    const lowIntensitySets = estimations.filter(e => e.intensity <= 6);

    // Decision logic
    if (bestEstimation > currentOneRM * 1.05) {
        // Estimation significantly higher - potential PR
        const newOneRM = currentOneRM + increment;
        return {
            exerciseId,
            exerciseName,
            suggestedOneRM: newOneRM,
            currentOneRM,
            changePercent: (increment / currentOneRM) * 100,
            changeAbsolute: increment,
            action: 'increase',
            rationale: `Tu rendimiento reciente (${bestEstimation}kg estimado) supera tu 1RM actual. Intensidad media: ${avgIntensity.toFixed(1)}/10. Recomendamos subir +${increment}kg.`,
            confidence: avgIntensity >= 7 ? 0.85 : 0.7,
            basedOnSets: estimations.length,
            averageIntensity: avgIntensity,
        };
    } else if (avgIntensity >= 9 && bestEstimation < currentOneRM * 0.95) {
        // Very high intensity but underperforming - might need to decrease
        const decrease = Math.round(currentOneRM * 0.05 / 2.5) * 2.5;
        return {
            exerciseId,
            exerciseName,
            suggestedOneRM: currentOneRM - decrease,
            currentOneRM,
            changePercent: -(decrease / currentOneRM) * 100,
            changeAbsolute: -decrease,
            action: 'decrease',
            rationale: `Intensidad muy alta (${avgIntensity.toFixed(1)}/10) pero rendimiento por debajo del esperado. Considera bajar -${decrease}kg para mejorar calidad de entrenamiento.`,
            confidence: 0.6,
            basedOnSets: estimations.length,
            averageIntensity: avgIntensity,
        };
    } else {
        // Keep current
        return {
            exerciseId,
            exerciseName,
            suggestedOneRM: currentOneRM,
            currentOneRM,
            changePercent: 0,
            changeAbsolute: 0,
            action: 'keep',
            rationale: `Rendimiento consistente con tu 1RM actual. ${avgIntensity < 7 ? 'Considera aumentar intensidad en próximas sesiones.' : 'Sigue así.'}`,
            confidence: 0.75,
            basedOnSets: estimations.length,
            averageIntensity: avgIntensity,
        };
    }
}

/**
 * Create recommendation when there's no data
 */
function createNoDataRecommendation(
    exerciseId: string,
    exerciseName?: string,
    currentOneRM?: number
): OneRMRecommendation {
    return {
        exerciseId,
        exerciseName,
        suggestedOneRM: currentOneRM || 0,
        currentOneRM,
        changePercent: 0,
        changeAbsolute: 0,
        action: 'keep',
        rationale: 'No hay suficientes datos recientes para generar una recomendación. Completa más series con peso registrado.',
        confidence: 0,
        basedOnSets: 0,
        averageIntensity: 0,
    };
}

/**
 * Analyze all exercises in a session for 1RM recommendations
 */
export function analyzeSessionForOneRM(
    session: WorkoutSession,
    oneRMRecords: Record<string, OneRMRecord>,
    athleteWeightKg?: number
): OneRMRecommendation[] {
    const recommendations: OneRMRecommendation[] = [];

    for (const exerciseEntry of session.exercises) {
        // Only analyze exercises marked with strength focus
        if (!exerciseEntry.strengthFocus) continue;

        const record = oneRMRecords[exerciseEntry.exerciseId];
        const recommendation = analyzeOneRMProgression({
            exerciseId: exerciseEntry.exerciseId,
            exerciseName: exerciseEntry.exercise?.name,
            currentRecord: record,
            recentSets: exerciseEntry.sets,
            strengthFocusSessions: record?.strengthFocusSessions || 0,
            athleteWeightKg,
            isBodyweight: exerciseEntry.exercise?.isBodyweight,
        });

        // Only include if there's a meaningful recommendation
        if (recommendation.action !== 'keep' || recommendation.basedOnSets > 0) {
            recommendations.push(recommendation);
        }
    }

    return recommendations;
}

export default {
    analyzeOneRMProgression,
    analyzeSessionForOneRM,
};
