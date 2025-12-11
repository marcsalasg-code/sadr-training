/**
 * useTrainingAdherence - Hook para adherencia al plan de entrenamiento
 * 
 * PHASE 4 REFACTORED: Now delegates business logic to domain/plans/adherence
 * 
 * Responsabilidades (orquestador):
 * - Lee plan activo y sesiones del store
 * - Llama a funciones de dominio para cálculos
 * - Devuelve datos listos para UI
 */

import { useMemo, useCallback } from 'react';
import { useTrainingPlans, useActiveTrainingPlanId, useSessions } from '../store/store';
import {
    calculateWeeklyAdherence,
    getAdherenceLevel,
    isOnTrack,
    generateAdherenceRecommendations,
    DEFAULT_WEEKLY_ADHERENCE,
    type WeeklyAdherence,
    type AdherenceLevel,
    type AdherencePlanInput,
} from '../domain/plans';
import type { TrainingPlan } from '../types/types';

// ============================================
// TYPES
// ============================================

export interface UseTrainingAdherenceReturn {
    // Data
    weeklyAdherence: WeeklyAdherence;
    isOnTrack: boolean;
    adherenceLevel: AdherenceLevel;

    // Actions
    getAIRecommendations: () => string[];
    calculateAdherenceForPlan: (plan: TrainingPlan) => WeeklyAdherence;
}

// ============================================
// HOOK
// ============================================

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

    // Convert TrainingPlan to AdherencePlanInput for domain functions
    const toAdherencePlanInput = useCallback((plan: TrainingPlan): AdherencePlanInput => ({
        athleteId: plan.athleteId,
        sessionsPerWeek: plan.sessionsPerWeek,
        weeklyVolume: plan.weeklyVolume,
        metadata: plan.metadata,
    }), []);

    // Calculate adherence for a given plan using domain function
    const calculateAdherenceForPlan = useCallback((plan: TrainingPlan): WeeklyAdherence => {
        return calculateWeeklyAdherence(toAdherencePlanInput(plan), sessions);
    }, [sessions, toAdherencePlanInput]);

    // Calculate weekly adherence for active plan
    const weeklyAdherence = useMemo((): WeeklyAdherence => {
        if (!activePlan) return DEFAULT_WEEKLY_ADHERENCE;
        return calculateAdherenceForPlan(activePlan);
    }, [activePlan, calculateAdherenceForPlan]);

    // Determine if on track (using domain function)
    const onTrack = useMemo(() => isOnTrack(weeklyAdherence), [weeklyAdherence]);

    // Determine adherence level (using domain function)
    const adherenceLevel = useMemo(() => getAdherenceLevel(weeklyAdherence), [weeklyAdherence]);

    // Get AI recommendations (using domain function)
    const getAIRecommendations = useCallback((): string[] => {
        if (!activePlan) return [];
        return generateAdherenceRecommendations(
            toAdherencePlanInput(activePlan),
            weeklyAdherence
        );
    }, [activePlan, weeklyAdherence, toAdherencePlanInput]);

    return {
        weeklyAdherence,
        isOnTrack: onTrack,
        adherenceLevel,
        getAIRecommendations,
        calculateAdherenceForPlan,
    };
}

export default useTrainingAdherence;
