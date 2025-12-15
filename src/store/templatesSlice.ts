/**
 * Templates Slice - Zustand slice for workout template management
 * 
 * Phase 22B.1: Instrumented with dirty tracking (markLocalMutation)
 */

import type { StateCreator } from 'zustand';
import type { WorkoutTemplate, UUID } from '../types/types';

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

export interface TemplatesSlice {
    templates: WorkoutTemplate[];
    addTemplate: (template: Omit<WorkoutTemplate, 'id' | 'createdAt' | 'updatedAt'>) => WorkoutTemplate;
    updateTemplate: (id: UUID, updates: Partial<WorkoutTemplate>) => void;
    deleteTemplate: (id: UUID) => void;
    getTemplate: (id: UUID) => WorkoutTemplate | undefined;
}

// ============================================
// SLICE CREATOR
// ============================================

export const createTemplatesSlice: StateCreator<
    TemplatesSlice,
    [],
    [],
    TemplatesSlice
> = (set, get) => ({
    templates: [],

    addTemplate: (templateData) => {
        const template: WorkoutTemplate = {
            ...templateData,
            id: generateId(),
            createdAt: now(),
            updatedAt: now(),
        };
        set((state) => ({ templates: [...state.templates, template] }));
        markDirty(get); // Phase 22B.1: Track local mutation
        return template;
    },

    updateTemplate: (id, updates) => {
        set((state) => ({
            templates: state.templates.map((t) =>
                t.id === id ? { ...t, ...updates, updatedAt: now() } : t
            ),
        }));
        markDirty(get); // Phase 22B.1: Track local mutation
    },

    deleteTemplate: (id) => {
        set((state) => ({
            templates: state.templates.filter((t) => t.id !== id),
        }));
        markDirty(get); // Phase 22B.1: Track local mutation
    },

    getTemplate: (id) => get().templates.find((t) => t.id === id),
});

