/**
 * Lab Slice - Zustand slice for internal lab and usage tracking
 */

import type { StateCreator } from 'zustand';
import type { LabEntry, UsageEvent, UUID } from '../types/types';

// ============================================
// HELPERS
// ============================================

const generateId = (): UUID => crypto.randomUUID();
const now = (): string => new Date().toISOString();

// ============================================
// SLICE INTERFACE
// ============================================

export interface LabSlice {
    labEntries: LabEntry[];
    usageEvents: UsageEvent[];
    addLabEntry: (entry: Omit<LabEntry, 'id' | 'createdAt'>) => LabEntry;
    updateLabEntry: (id: UUID, updates: Partial<LabEntry>) => void;
    deleteLabEntry: (id: UUID) => void;
    logUsageEvent: (event: string, context?: string, data?: Record<string, unknown>) => void;
    clearUsageEvents: () => void;
}

// ============================================
// SLICE CREATOR
// ============================================

export const createLabSlice: StateCreator<
    LabSlice,
    [],
    [],
    LabSlice
> = (set) => ({
    labEntries: [],
    usageEvents: [],

    addLabEntry: (entryData) => {
        const entry: LabEntry = {
            ...entryData,
            id: generateId(),
            createdAt: now(),
        };
        set((state) => ({ labEntries: [...state.labEntries, entry] }));
        return entry;
    },

    updateLabEntry: (id, updates) => {
        set((state) => ({
            labEntries: state.labEntries.map((e) =>
                e.id === id ? { ...e, ...updates } : e
            ),
        }));
    },

    deleteLabEntry: (id) => {
        set((state) => ({
            labEntries: state.labEntries.filter((e) => e.id !== id),
        }));
    },

    logUsageEvent: (event, context, data) => {
        const usageEvent: UsageEvent = {
            id: generateId(),
            event,
            context,
            data,
            timestamp: now(),
        };
        set((state) => ({
            usageEvents: [...state.usageEvents.slice(-999), usageEvent], // Keep last 1000
        }));
    },

    clearUsageEvents: () => {
        set({ usageEvents: [] });
    },
});
