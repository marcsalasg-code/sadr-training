/**
 * Athletes Slice - Zustand slice for athlete management
 * 
 * Phase 22B.1: Instrumented with dirty tracking (markLocalMutation)
 */

import type { StateCreator } from 'zustand';
import type { Athlete, UUID } from '../types/types';

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

export interface AthletesSlice {
    athletes: Athlete[];
    addAthlete: (athlete: Omit<Athlete, 'id' | 'createdAt' | 'updatedAt'>) => Athlete;
    updateAthlete: (id: UUID, updates: Partial<Athlete>) => void;
    deleteAthlete: (id: UUID) => void;
    getAthlete: (id: UUID) => Athlete | undefined;
}

// ============================================
// SLICE CREATOR
// ============================================

export const createAthletesSlice: StateCreator<
    AthletesSlice,
    [],
    [],
    AthletesSlice
> = (set, get) => ({
    athletes: [],

    addAthlete: (athleteData) => {
        const athlete: Athlete = {
            ...athleteData,
            id: generateId(),
            createdAt: now(),
            updatedAt: now(),
        };
        set((state) => ({ athletes: [...state.athletes, athlete] }));
        markDirty(get); // Phase 22B.1: Track local mutation
        return athlete;
    },

    updateAthlete: (id, updates) => {
        set((state) => ({
            athletes: state.athletes.map((a) =>
                a.id === id ? { ...a, ...updates, updatedAt: now() } : a
            ),
        }));
        markDirty(get); // Phase 22B.1: Track local mutation
    },

    deleteAthlete: (id) => {
        set((state) => ({
            athletes: state.athletes.filter((a) => a.id !== id),
        }));
        markDirty(get); // Phase 22B.1: Track local mutation
    },

    getAthlete: (id) => get().athletes.find((a) => a.id === id),
});

