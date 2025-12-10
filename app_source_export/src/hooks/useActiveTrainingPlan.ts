/**
 * useActiveTrainingPlan - Hook para acceder y gestionar el plan de entrenamiento activo
 * 
 * Responsabilidades:
 * - Obtener el plan activo del store
 * - Activar/desactivar planes
 * - Acceso básico al plan
 */

import { useMemo, useCallback } from 'react';
import { useTrainingStore, useTrainingPlans, useActiveTrainingPlanId } from '../store/store';
import type { TrainingPlan, DayPlan, WeekDay, PlanMetadata } from '../types/types';

// Day names for date calculations
const dayNames: WeekDay[] = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

export interface UseActiveTrainingPlanReturn {
    // Data
    trainingPlans: TrainingPlan[];
    activePlan: TrainingPlan | undefined;
    activeTrainingPlanId: string | null;
    todayPlan: DayPlan | undefined;
    isTodayTrainingDay: boolean;
    hasActivePlan: boolean;

    // Actions
    setActivePlan: (id: string | null) => void;
    createPlan: (planData: Omit<TrainingPlan, 'id' | 'createdAt' | 'updatedAt'>) => TrainingPlan;
    updatePlan: (id: string, updates: Partial<TrainingPlan>) => void;
    deletePlan: (id: string) => void;
    updatePlanMetadata: (planId: string, metadata: Partial<PlanMetadata>) => void;
}

export function useActiveTrainingPlan(): UseActiveTrainingPlanReturn {
    const trainingPlans = useTrainingPlans();
    const activeTrainingPlanId = useActiveTrainingPlanId();
    const {
        addTrainingPlan,
        updateTrainingPlan,
        deleteTrainingPlan,
        setActiveTrainingPlan,
    } = useTrainingStore();

    // Get active plan
    const activePlan = useMemo(() => {
        return activeTrainingPlanId
            ? trainingPlans.find(p => p.id === activeTrainingPlanId)
            : undefined;
    }, [trainingPlans, activeTrainingPlanId]);

    // Check if has active plan
    const hasActivePlan = useMemo(() => !!activePlan, [activePlan]);

    // Get today's planned session type
    const todayPlan = useMemo((): DayPlan | undefined => {
        if (!activePlan) return undefined;
        const today = dayNames[new Date().getDay()];
        return activePlan.dayPlans.find(dp => dp.dayOfWeek === today);
    }, [activePlan]);

    // Check if today is a training day
    const isTodayTrainingDay = useMemo(() => {
        if (!activePlan) return false;
        const today = dayNames[new Date().getDay()];
        return activePlan.weekDays.includes(today);
    }, [activePlan]);

    // Create a plan manually
    const createPlan = useCallback((planData: Omit<TrainingPlan, 'id' | 'createdAt' | 'updatedAt'>) => {
        return addTrainingPlan(planData);
    }, [addTrainingPlan]);

    // Update plan metadata
    const updatePlanMetadata = useCallback((
        planId: string,
        metadata: Partial<PlanMetadata>
    ) => {
        const plan = trainingPlans.find(p => p.id === planId);
        if (!plan) return;

        updateTrainingPlan(planId, {
            metadata: {
                ...plan.metadata,
                ...metadata,
                lastAIUpdate: new Date().toISOString(),
            } as PlanMetadata,
        });
    }, [trainingPlans, updateTrainingPlan]);

    return {
        // Data
        trainingPlans,
        activePlan,
        activeTrainingPlanId,
        todayPlan,
        isTodayTrainingDay,
        hasActivePlan,

        // Actions
        setActivePlan: setActiveTrainingPlan,
        createPlan,
        updatePlan: updateTrainingPlan,
        deletePlan: deleteTrainingPlan,
        updatePlanMetadata,
    };
}

export default useActiveTrainingPlan;
