/**
 * Plans Slice - Zustand slice for training plan management
 */

import type { StateCreator } from 'zustand';
import type { TrainingPlan, UUID } from '../types/types';

// ============================================
// HELPERS
// ============================================

const generateId = (): UUID => crypto.randomUUID();
const now = (): string => new Date().toISOString();

// ============================================
// SLICE INTERFACE
// ============================================

export interface PlansSlice {
    trainingPlans: TrainingPlan[];
    activeTrainingPlanId: UUID | null;
    addTrainingPlan: (plan: Omit<TrainingPlan, 'id' | 'createdAt' | 'updatedAt'>) => TrainingPlan;
    updateTrainingPlan: (id: UUID, updates: Partial<TrainingPlan>) => void;
    deleteTrainingPlan: (id: UUID) => void;
    getTrainingPlan: (id: UUID) => TrainingPlan | undefined;
    setActiveTrainingPlan: (id: UUID | null) => void;
    getActiveTrainingPlan: () => TrainingPlan | undefined;
}

// ============================================
// SLICE CREATOR
// ============================================

export const createPlansSlice: StateCreator<
    PlansSlice,
    [],
    [],
    PlansSlice
> = (set, get) => ({
    trainingPlans: [],
    activeTrainingPlanId: null,

    addTrainingPlan: (planData) => {
        const plan: TrainingPlan = {
            ...planData,
            id: generateId(),
            createdAt: now(),
            updatedAt: now(),
        };
        set((state) => ({ trainingPlans: [...state.trainingPlans, plan] }));
        return plan;
    },

    updateTrainingPlan: (id, updates) => {
        set((state) => ({
            trainingPlans: state.trainingPlans.map((p) =>
                p.id === id ? { ...p, ...updates, updatedAt: now() } : p
            ),
        }));
    },

    deleteTrainingPlan: (id) => {
        set((state) => ({
            trainingPlans: state.trainingPlans.filter((p) => p.id !== id),
            activeTrainingPlanId: state.activeTrainingPlanId === id ? null : state.activeTrainingPlanId,
        }));
    },

    getTrainingPlan: (id) => get().trainingPlans.find((p) => p.id === id),

    setActiveTrainingPlan: (id) => {
        set({ activeTrainingPlanId: id });
    },

    getActiveTrainingPlan: () => {
        const state = get();
        return state.activeTrainingPlanId
            ? state.trainingPlans.find((p) => p.id === state.activeTrainingPlanId)
            : undefined;
    },
});
