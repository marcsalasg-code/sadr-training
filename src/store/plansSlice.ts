/**
 * Plans Slice - Zustand slice for training plan management
 * 
 * Phase 22B.1: Instrumented with dirty tracking (markLocalMutation)
 */

import type { StateCreator } from 'zustand';
import type { TrainingPlan, UUID } from '../types/types';

// ============================================
// HELPERS
// ============================================

const generateId = (): UUID => crypto.randomUUID();
const now = (): string => new Date().toISOString();

// Helper to safely call markLocalMutation from combined store
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const markDirty = (get: () => any) => {
    const store = get();
    if (typeof store.markLocalMutation === 'function') {
        store.markLocalMutation();
    }
};

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
        markDirty(get); // Phase 22B.1: Track local mutation
        return plan;
    },

    updateTrainingPlan: (id, updates) => {
        set((state) => ({
            trainingPlans: state.trainingPlans.map((p) =>
                p.id === id ? { ...p, ...updates, updatedAt: now() } : p
            ),
        }));
        markDirty(get); // Phase 22B.1: Track local mutation
    },

    deleteTrainingPlan: (id) => {
        set((state) => ({
            trainingPlans: state.trainingPlans.filter((p) => p.id !== id),
            activeTrainingPlanId: state.activeTrainingPlanId === id ? null : state.activeTrainingPlanId,
        }));
        markDirty(get); // Phase 22B.1: Track local mutation
    },

    getTrainingPlan: (id) => get().trainingPlans.find((p) => p.id === id),

    setActiveTrainingPlan: (id) => {
        set({ activeTrainingPlanId: id });
        markDirty(get); // Phase 22B.1: Track local mutation (activeTrainingPlanId is persisted)
    },

    getActiveTrainingPlan: () => {
        const state = get();
        return state.activeTrainingPlanId
            ? state.trainingPlans.find((p) => p.id === state.activeTrainingPlanId)
            : undefined;
    },
});

