/**
 * Athletes Slice - Zustand slice for athlete management
 */

import type { StateCreator } from 'zustand';
import type { Athlete, UUID } from '../types/types';

// ============================================
// HELPERS
// ============================================

const generateId = (): UUID => crypto.randomUUID();
const now = (): string => new Date().toISOString();

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
        return athlete;
    },

    updateAthlete: (id, updates) => {
        set((state) => ({
            athletes: state.athletes.map((a) =>
                a.id === id ? { ...a, ...updates, updatedAt: now() } : a
            ),
        }));
    },

    deleteAthlete: (id) => {
        set((state) => ({
            athletes: state.athletes.filter((a) => a.id !== id),
        }));
    },

    getAthlete: (id) => get().athletes.find((a) => a.id === id),
});
