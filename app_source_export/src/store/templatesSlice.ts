/**
 * Templates Slice - Zustand slice for workout template management
 */

import type { StateCreator } from 'zustand';
import type { WorkoutTemplate, UUID } from '../types/types';

// ============================================
// HELPERS
// ============================================

const generateId = (): UUID => crypto.randomUUID();
const now = (): string => new Date().toISOString();

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
        return template;
    },

    updateTemplate: (id, updates) => {
        set((state) => ({
            templates: state.templates.map((t) =>
                t.id === id ? { ...t, ...updates, updatedAt: now() } : t
            ),
        }));
    },

    deleteTemplate: (id) => {
        set((state) => ({
            templates: state.templates.filter((t) => t.id !== id),
        }));
    },

    getTemplate: (id) => get().templates.find((t) => t.id === id),
});
