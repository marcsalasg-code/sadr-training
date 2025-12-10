/**
 * useTrainingAdherence - Hook para calcular adherencia al plan de entrenamiento
 * 
 * Responsabilidades:
 * - Calcular adherencia semanal (completado vs planificado)
 * - Calcular desviación de volumen
 * - Generar score semanal
 * - Proveer recomendaciones basadas en adherencia
 */

import { useMemo, useCallback } from 'react';
import { useTrainingPlans, useActiveTrainingPlanId, useSessions } from '../store/store';
import type { WeeklyAdherence, TrainingPlan } from '../types/types';
import { getWeekRange } from '../utils/dateHelpers';

export interface UseTrainingAdherenceReturn {
    // Data
    weeklyAdherence: WeeklyAdherence;
    isOnTrack: boolean;
    adherenceLevel: 'excellent' | 'good' | 'warning' | 'poor';

    // Actions
    getAIRecommendations: () => string[];
    calculateAdherenceForPlan: (plan: TrainingPlan) => WeeklyAdherence;
}

export function useTrainingAdherence(): UseTrainingAdherenceReturn {
    const trainingPlans = useTrainingPlans();
    const activeTrainingPlanId = useActiveTrainingPlanId();
    const sessions = useSessions();

    // Get active plan
    const activePlan = useMemo(() => {
        return activeTrainingPlanId
            ? trainingPlans.find(p => p.id === activeTrainingPlanId)
            : undefined;
    }, [trainingPlans, activeTrainingPlanId]);

    // Calculate adherence for a given plan
    const calculateAdherenceForPlan = useCallback((plan: TrainingPlan): WeeklyAdherence => {
        const { start, end } = getWeekRange();

        // Sessions completed this week for the athlete
        const weekSessions = sessions.filter(s => {
            if (s.athleteId !== plan.athleteId) return false;
            if (s.status !== 'completed') return false;
            if (!s.completedAt) return false;
            const completedDate = new Date(s.completedAt);
            return completedDate >= start && completedDate <= end;
        });

        const completed = weekSessions.length;
        const planned = plan.sessionsPerWeek;
        const percentage = planned > 0 ? Math.round((completed / planned) * 100) : 0;
        const volumeActual = weekSessions.reduce((sum, s) => sum + (s.totalVolume || 0), 0);
        const volumeTarget = plan.weeklyVolume;

        // Calculate deviation (negative = under target, positive = over target)
        const volumeDeviation = volumeTarget > 0
            ? Math.round(((volumeActual - volumeTarget) / volumeTarget) * 100)
            : 0;

        // Calculate weekly score (0-100)
        // Score = (adherence % * 0.6) + (volume accuracy * 0.4)
        const volumeAccuracy = volumeTarget > 0
            ? Math.max(0, 100 - Math.abs(volumeDeviation))
            : 100;
        const weeklyScore = Math.round(
            (Math.min(percentage, 100) * 0.6) + (volumeAccuracy * 0.4)
        );

        return {
            planned,
            completed,
            percentage: Math.min(percentage, 100),
            volumeTarget,
            volumeActual,
            volumeDeviation,
            weeklyScore,
        };
    }, [sessions]);

    // Calculate weekly adherence for active plan
    const weeklyAdherence = useMemo((): WeeklyAdherence => {
        if (!activePlan) {
            return {
                planned: 0,
                completed: 0,
                percentage: 0,
                volumeTarget: 0,
                volumeActual: 0,
                volumeDeviation: 0,
                weeklyScore: 0,
            };
        }

        return calculateAdherenceForPlan(activePlan);
    }, [activePlan, calculateAdherenceForPlan]);

    // Determine if on track
    const isOnTrack = useMemo(() => {
        return (weeklyAdherence.weeklyScore ?? 0) >= 70;
    }, [weeklyAdherence]);

    // Determine adherence level
    const adherenceLevel = useMemo((): 'excellent' | 'good' | 'warning' | 'poor' => {
        const score = weeklyAdherence.weeklyScore ?? 0;
        if (score >= 90) return 'excellent';
        if (score >= 70) return 'good';
        if (score >= 50) return 'warning';
        return 'poor';
    }, [weeklyAdherence]);

    // Get AI recommendations based on current adherence
    const getAIRecommendations = useCallback((): string[] => {
        if (!activePlan) return [];

        const recommendations: string[] = [];

        // Check adherence
        if (weeklyAdherence.percentage < 70) {
            recommendations.push('📉 Low adherence this week. Consider reducing training days.');
        }

        // Check volume deviation
        if (weeklyAdherence.volumeDeviation < -20) {
            recommendations.push('⚠️ Volume significantly below target. Increase intensity or add sets.');
        } else if (weeklyAdherence.volumeDeviation > 20) {
            recommendations.push('💪 Volume above target. Monitor recovery and fatigue.');
        }

        // Check microcycle
        if (activePlan.metadata?.currentMicrocycle === 4) {
            recommendations.push('🔄 End of microcycle. Consider a deload week.');
        }

        return recommendations.length > 0 ? recommendations : ['✅ Training on track!'];
    }, [activePlan, weeklyAdherence]);

    return {
        // Data
        weeklyAdherence,
        isOnTrack,
        adherenceLevel,

        // Actions
        getAIRecommendations,
        calculateAdherenceForPlan,
    };
}

export default useTrainingAdherence;
