/**
 * Config Slice - Zustand slice for training configuration
 * 
 * Gestiona la configuración editable de:
 * - Movement patterns (etiquetas, orden, visibilidad)
 * - Muscle groups (etiquetas, orden, visibilidad)
 * - Analysis settings (1RM method, volume display)
 * - Role mode (EXPERIMENTAL - Iteration 1)
 */

import type { StateCreator } from 'zustand';
import type { MovementPattern, MuscleGroup } from '../core/exercises/exercise.model';
import type {
    TrainingConfig,
    PatternConfig,
    MuscleGroupConfig,
    AnalysisConfig,
} from '../core/config/trainingConfig.model';
import {
    DEFAULT_TRAINING_CONFIG,
    getEnabledPatterns,
    getEnabledMuscleGroups,
} from '../core/config/trainingConfig.model';

// ============================================
// ROLE MODE TYPE (EXPERIMENTAL)
// ============================================

export type RoleMode = 'coach' | 'athlete' | 'admin';

// ============================================
// SLICE INTERFACE
// ============================================

export interface ConfigSlice {
    // State
    trainingConfig: TrainingConfig;
    roleMode: RoleMode; // EXPERIMENTAL - Iteration 1

    // Pattern actions
    updatePatternLabel: (patternId: MovementPattern, label: string) => void;
    togglePattern: (patternId: MovementPattern, enabled: boolean) => void;
    reorderPattern: (patternId: MovementPattern, newOrder: number) => void;
    updatePatternIcon: (patternId: MovementPattern, icon: string) => void;

    // Muscle group actions
    updateMuscleGroupLabel: (groupId: MuscleGroup, label: string) => void;
    toggleMuscleGroup: (groupId: MuscleGroup, enabled: boolean) => void;
    reorderMuscleGroup: (groupId: MuscleGroup, newOrder: number) => void;
    updateMuscleGroupIcon: (groupId: MuscleGroup, icon: string) => void;

    // Analysis actions
    updateAnalysisSettings: (updates: Partial<AnalysisConfig>) => void;

    // Role mode actions (EXPERIMENTAL)
    setRoleMode: (mode: RoleMode) => void;

    // Getters (memoization-friendly)
    getEnabledPatterns: () => PatternConfig[];
    getEnabledMuscleGroups: () => MuscleGroupConfig[];
    getPatternLabel: (patternId: MovementPattern) => string;
    getMuscleGroupLabel: (groupId: MuscleGroup) => string;

    // Reset
    resetToDefaults: () => void;
}

// ============================================
// SLICE CREATOR
// ============================================

export const createConfigSlice: StateCreator<
    ConfigSlice,
    [],
    [],
    ConfigSlice
> = (set, get) => ({
    trainingConfig: DEFAULT_TRAINING_CONFIG,
    roleMode: 'coach', // Default role mode

    // === Pattern Actions ===
    updatePatternLabel: (patternId, label) => {
        set((state) => ({
            trainingConfig: {
                ...state.trainingConfig,
                patterns: state.trainingConfig.patterns.map((p) =>
                    p.id === patternId ? { ...p, label } : p
                ),
            },
        }));
    },

    togglePattern: (patternId, enabled) => {
        set((state) => ({
            trainingConfig: {
                ...state.trainingConfig,
                patterns: state.trainingConfig.patterns.map((p) =>
                    p.id === patternId ? { ...p, enabled } : p
                ),
            },
        }));
    },

    reorderPattern: (patternId, newOrder) => {
        set((state) => {
            const patterns = [...state.trainingConfig.patterns];
            const currentIndex = patterns.findIndex((p) => p.id === patternId);
            if (currentIndex === -1) return state;

            // Update orders
            const updated = patterns.map((p) => {
                if (p.id === patternId) return { ...p, order: newOrder };
                if (p.order >= newOrder && p.order < patterns[currentIndex].order) {
                    return { ...p, order: p.order + 1 };
                }
                if (p.order <= newOrder && p.order > patterns[currentIndex].order) {
                    return { ...p, order: p.order - 1 };
                }
                return p;
            });

            return {
                trainingConfig: {
                    ...state.trainingConfig,
                    patterns: updated,
                },
            };
        });
    },

    updatePatternIcon: (patternId, icon) => {
        set((state) => ({
            trainingConfig: {
                ...state.trainingConfig,
                patterns: state.trainingConfig.patterns.map((p) =>
                    p.id === patternId ? { ...p, icon } : p
                ),
            },
        }));
    },

    // === Muscle Group Actions ===
    updateMuscleGroupLabel: (groupId, label) => {
        set((state) => ({
            trainingConfig: {
                ...state.trainingConfig,
                muscleGroups: state.trainingConfig.muscleGroups.map((m) =>
                    m.id === groupId ? { ...m, label } : m
                ),
            },
        }));
    },

    toggleMuscleGroup: (groupId, enabled) => {
        set((state) => ({
            trainingConfig: {
                ...state.trainingConfig,
                muscleGroups: state.trainingConfig.muscleGroups.map((m) =>
                    m.id === groupId ? { ...m, enabled } : m
                ),
            },
        }));
    },

    reorderMuscleGroup: (groupId, newOrder) => {
        set((state) => {
            const groups = [...state.trainingConfig.muscleGroups];
            const currentIndex = groups.findIndex((m) => m.id === groupId);
            if (currentIndex === -1) return state;

            const updated = groups.map((m) => {
                if (m.id === groupId) return { ...m, order: newOrder };
                if (m.order >= newOrder && m.order < groups[currentIndex].order) {
                    return { ...m, order: m.order + 1 };
                }
                if (m.order <= newOrder && m.order > groups[currentIndex].order) {
                    return { ...m, order: m.order - 1 };
                }
                return m;
            });

            return {
                trainingConfig: {
                    ...state.trainingConfig,
                    muscleGroups: updated,
                },
            };
        });
    },

    updateMuscleGroupIcon: (groupId, icon) => {
        set((state) => ({
            trainingConfig: {
                ...state.trainingConfig,
                muscleGroups: state.trainingConfig.muscleGroups.map((m) =>
                    m.id === groupId ? { ...m, icon } : m
                ),
            },
        }));
    },

    // === Analysis Actions ===
    updateAnalysisSettings: (updates) => {
        set((state) => ({
            trainingConfig: {
                ...state.trainingConfig,
                analysis: {
                    ...state.trainingConfig.analysis,
                    ...updates,
                },
            },
        }));
    },

    // === Role Mode Actions (EXPERIMENTAL) ===
    setRoleMode: (mode) => {
        set({ roleMode: mode });
    },

    // === Getters (use these to avoid creating new refs) ===
    getEnabledPatterns: () => getEnabledPatterns(get().trainingConfig),
    getEnabledMuscleGroups: () => getEnabledMuscleGroups(get().trainingConfig),

    getPatternLabel: (patternId) => {
        const config = get().trainingConfig;
        return config.patterns.find((p) => p.id === patternId)?.label || patternId;
    },

    getMuscleGroupLabel: (groupId) => {
        const config = get().trainingConfig;
        return config.muscleGroups.find((m) => m.id === groupId)?.label || groupId;
    },

    // === Reset ===
    resetToDefaults: () => {
        set({ trainingConfig: DEFAULT_TRAINING_CONFIG, roleMode: 'coach' });
    },
});
