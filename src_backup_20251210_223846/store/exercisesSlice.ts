/**
 * Exercises Slice - Zustand slice for exercise catalog management
 */

import type { StateCreator } from 'zustand';
import type { Exercise, UUID, OneRMAnchorConfig, BodyRegion } from '../types/types';

// ============================================
// HELPERS
// ============================================

const generateId = (): UUID => crypto.randomUUID();
const now = (): string => new Date().toISOString();

// ============================================
// SLICE INTERFACE
// ============================================

export interface ExercisesSlice {
    exercises: Exercise[];
    exerciseCategories: { id: string; name: string; icon?: string }[];
    anchorConfig: OneRMAnchorConfig;

    // Exercise CRUD
    addExercise: (exercise: Omit<Exercise, 'id' | 'createdAt'>) => Exercise;
    updateExercise: (id: UUID, updates: Partial<Exercise>) => void;
    deleteExercise: (id: UUID) => void;
    getExercise: (id: UUID) => Exercise | undefined;

    // Categories
    addCategory: (name: string, icon?: string) => void;
    updateCategory: (id: string, updates: { name?: string; icon?: string }) => void;
    deleteCategory: (id: string) => void;

    // Anchor Config
    updateAnchorConfig: (updates: Partial<OneRMAnchorConfig>) => void;
    setAnchorExercise: (exerciseId: UUID, isAnchor: boolean) => void;
    setExerciseReference: (exerciseId: UUID, referenceIds: string[]) => void;
}

// ============================================
// DEFAULT VALUES
// ============================================

const defaultCategories = [
    { id: 'strength', name: 'Fuerza', icon: '💪' },
    { id: 'hypertrophy', name: 'Hipertrofia', icon: '🏋️' },
    { id: 'power', name: 'Potencia', icon: '⚡' },
    { id: 'endurance', name: 'Resistencia', icon: '🏃' },
    { id: 'mobility', name: 'Movilidad', icon: '🧘' },
    { id: 'cardio', name: 'Cardio', icon: '❤️' },
    { id: 'warmup', name: 'Calentamiento', icon: '🔥' },
    { id: 'cooldown', name: 'Enfriamiento', icon: '❄️' },
];

const defaultAnchorConfig: OneRMAnchorConfig = {
    anchorExerciseIds: [],
    referenceMap: {},
    groupDefaults: {
        upper: [],
        lower: [],
        full: [],
        core: [],
    } as Record<BodyRegion, string[]>,
};

// ============================================
// SLICE CREATOR
// ============================================

export const createExercisesSlice: StateCreator<
    ExercisesSlice,
    [],
    [],
    ExercisesSlice
> = (set, get) => ({
    exercises: [],
    exerciseCategories: defaultCategories,
    anchorConfig: defaultAnchorConfig,

    addExercise: (exerciseData) => {
        const timestamp = now();
        const exercise: Exercise = {
            ...exerciseData,
            id: generateId(),
            createdAt: timestamp,
            updatedAt: timestamp,
            // Asegurar valores por defecto para campos requeridos
            pattern: exerciseData.pattern || 'other',
            muscleGroup: exerciseData.muscleGroup || 'other',
            tags: exerciseData.tags || [],
        };
        set((state) => ({ exercises: [...state.exercises, exercise] }));
        return exercise;
    },

    updateExercise: (id, updates) => {
        set((state) => ({
            exercises: state.exercises.map((e) =>
                e.id === id ? { ...e, ...updates } : e
            ),
        }));
    },

    deleteExercise: (id) => {
        set((state) => ({
            exercises: state.exercises.filter((e) => e.id !== id),
        }));
    },

    getExercise: (id) => get().exercises.find((e) => e.id === id),

    // Categories
    addCategory: (name, icon) => {
        const id = generateId();
        set((state) => ({
            exerciseCategories: [...state.exerciseCategories, { id, name, icon }],
        }));
    },

    updateCategory: (id, updates) => {
        set((state) => ({
            exerciseCategories: state.exerciseCategories.map((cat) =>
                cat.id === id ? { ...cat, ...updates } : cat
            ),
        }));
    },

    deleteCategory: (id) => {
        set((state) => ({
            exerciseCategories: state.exerciseCategories.filter((cat) => cat.id !== id),
        }));
    },

    // Anchor Config
    updateAnchorConfig: (updates) => {
        set((state) => ({
            anchorConfig: { ...state.anchorConfig, ...updates },
        }));
    },

    setAnchorExercise: (exerciseId, isAnchor) => {
        set((state) => {
            const current = state.anchorConfig.anchorExerciseIds || [];
            const newIds = isAnchor
                ? [...current.filter(id => id !== exerciseId), exerciseId]
                : current.filter(id => id !== exerciseId);
            return {
                anchorConfig: {
                    ...state.anchorConfig,
                    anchorExerciseIds: newIds,
                },
            };
        });
    },

    setExerciseReference: (exerciseId, referenceIds) => {
        set((state) => ({
            anchorConfig: {
                ...state.anchorConfig,
                referenceMap: {
                    ...state.anchorConfig.referenceMap,
                    [exerciseId]: referenceIds,
                },
            },
        }));
    },
});
