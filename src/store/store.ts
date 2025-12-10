/**
 * TRAINING MONITOR - Zustand Store
 * Estado global de la aplicación - Refactored to use domain slices
 * 
 * ARCHITECTURE:
 * - Each domain has its own slice file (athletesSlice, sessionsSlice, etc.)
 * - This file combines all slices into a single store with persist middleware
 * - All existing exports are maintained for backward compatibility
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// Import slice creators and interfaces
import { createAthletesSlice, type AthletesSlice } from './athletesSlice';
import { createSessionsSlice, type SessionsSlice } from './sessionsSlice';
import { createTemplatesSlice, type TemplatesSlice } from './templatesSlice';
import { createExercisesSlice, type ExercisesSlice } from './exercisesSlice';
import { createPlansSlice, type PlansSlice } from './plansSlice';
import { createSettingsSlice, defaultSettings, type SettingsSlice } from './settingsSlice';
import { createLabSlice, type LabSlice } from './labSlice';
import { createConfigSlice, type ConfigSlice } from './configSlice';

// ============================================
// HELPERS
// ============================================

const now = (): string => new Date().toISOString();

// ============================================
// COMBINED STORE INTERFACE
// ============================================

/**
 * Data Management slice - handles import/export/clear
 */
interface DataManagementSlice {
    exportData: () => string;
    importData: (jsonData: string) => boolean;
    clearAllData: () => void;
}

/**
 * Combined store type - all slices merged
 */
export type TrainingStore =
    & AthletesSlice
    & SessionsSlice
    & TemplatesSlice
    & ExercisesSlice
    & PlansSlice
    & SettingsSlice
    & LabSlice
    & ConfigSlice
    & DataManagementSlice;

// ============================================
// STORE IMPLEMENTATION
// ============================================

export const useTrainingStore = create<TrainingStore>()(
    persist(
        (set, get, api) => ({
            // Combine all slices
            ...createAthletesSlice(set, get, api),
            ...createSessionsSlice(set, get, api),
            ...createTemplatesSlice(set, get, api),
            ...createExercisesSlice(set, get, api),
            ...createPlansSlice(set, get, api),
            ...createSettingsSlice(set, get, api),
            ...createLabSlice(set, get, api),
            ...createConfigSlice(set, get, api),

            // === DATA MANAGEMENT ===
            exportData: () => {
                const state = get();

                // Obtener aiSettings del aiStore (sin apiKey por seguridad)
                let aiSettings: Record<string, unknown> | undefined;
                try {
                    const aiStoreData = localStorage.getItem('ai-settings-storage');
                    if (aiStoreData) {
                        const parsed = JSON.parse(aiStoreData);
                        if (parsed?.state) {
                            // Excluir apiKey por seguridad
                            const { apiKey, ...safeAiSettings } = parsed.state;
                            aiSettings = safeAiSettings;
                        }
                    }
                } catch {
                    // Si falla, simplemente no incluir aiSettings
                }

                const exportObj = {
                    // Schema metadata
                    _meta: {
                        app: 'SADR Training OS',
                        schemaVersion: '1.2.0', // Updated for slice architecture
                        exportedAt: now(),
                        dataProfile: {
                            athletes: state.athletes.length,
                            exercises: state.exercises.length,
                            sessions: state.sessions.length,
                            templates: state.templates.length,
                        },
                    },
                    // Legacy version for backward compatibility
                    version: '1.2.0',
                    exportedAt: now(),
                    // Data
                    athletes: state.athletes,
                    exercises: state.exercises,
                    sessions: state.sessions,
                    templates: state.templates,
                    settings: state.settings,
                    labEntries: state.labEntries,
                    trainingPlans: state.trainingPlans,
                    activeTrainingPlanId: state.activeTrainingPlanId,
                    anchorConfig: state.anchorConfig,
                    exerciseCategories: state.exerciseCategories,
                    aiSettings,
                };
                return JSON.stringify(exportObj, null, 2);
            },

            importData: (jsonData) => {
                try {
                    const data = JSON.parse(jsonData);

                    // === VALIDACIÓN COMPLETA ANTES DE ESCRIBIR ===

                    // 1. Verificar versión
                    if (!data.version) {
                        console.error('[Import] Missing version field');
                        return false;
                    }

                    // 2. Verificar que las propiedades principales existan y sean arrays
                    const requiredArrays = ['athletes', 'exercises', 'sessions', 'templates'];
                    for (const key of requiredArrays) {
                        if (data[key] !== undefined && !Array.isArray(data[key])) {
                            console.error(`[Import] Invalid ${key}: expected array`);
                            return false;
                        }
                    }

                    // 3. Verificar settings si existe
                    if (data.settings !== undefined && typeof data.settings !== 'object') {
                        console.error('[Import] Invalid settings: expected object');
                        return false;
                    }

                    // 4. Verificar labEntries si existe
                    if (data.labEntries !== undefined && !Array.isArray(data.labEntries)) {
                        console.error('[Import] Invalid labEntries: expected array');
                        return false;
                    }

                    // === VALIDACIÓN PASADA: AHORA ESCRIBIR ===

                    set({
                        athletes: data.athletes || [],
                        exercises: data.exercises || [],
                        sessions: data.sessions || [],
                        templates: data.templates || [],
                        settings: { ...defaultSettings, ...data.settings },
                        labEntries: data.labEntries || [],
                        trainingPlans: data.trainingPlans || [],
                        activeTrainingPlanId: data.activeTrainingPlanId || null,
                        anchorConfig: data.anchorConfig || get().anchorConfig,
                        exerciseCategories: data.exerciseCategories || get().exerciseCategories,
                    });

                    // Importar aiSettings si existen (sin sobrescribir apiKey actual)
                    if (data.aiSettings && typeof data.aiSettings === 'object') {
                        try {
                            const currentAiStore = localStorage.getItem('ai-settings-storage');
                            const currentParsed = currentAiStore ? JSON.parse(currentAiStore) : { state: {} };
                            const currentApiKey = currentParsed?.state?.apiKey;

                            // Merge aiSettings preservando apiKey actual
                            const newAiState = {
                                ...currentParsed.state,
                                ...data.aiSettings,
                                apiKey: currentApiKey, // Preservar apiKey actual
                            };

                            localStorage.setItem('ai-settings-storage', JSON.stringify({
                                ...currentParsed,
                                state: newAiState,
                            }));
                        } catch (e) {
                            console.warn('[Import] Failed to import aiSettings:', e);
                            // No fallar el import completo por esto
                        }
                    }

                    return true;
                } catch (e) {
                    console.error('[Import] Parse error:', e);
                    return false;
                }
            },

            clearAllData: () => {
                set({
                    athletes: [],
                    exercises: [],
                    sessions: [],
                    templates: [],
                    settings: defaultSettings,
                    labEntries: [],
                    usageEvents: [],
                    activeSessionId: null,
                    trainingPlans: [],
                    activeTrainingPlanId: null,
                });
            },
        }),
        {
            name: 'training-monitor-storage',
            storage: createJSONStorage(() => localStorage),
            partialize: (state) => ({
                athletes: state.athletes,
                exercises: state.exercises,
                sessions: state.sessions,
                templates: state.templates,
                settings: state.settings,
                labEntries: state.labEntries,
                trainingPlans: state.trainingPlans,
                activeTrainingPlanId: state.activeTrainingPlanId,
                anchorConfig: state.anchorConfig,
                exerciseCategories: state.exerciseCategories,
                // Note: usageEvents not persisted to save space
            }),
        }
    )
);

// ============================================
// SELECTOR HOOKS (para optimizar re-renders)
// Maintained for backward compatibility
// ============================================

export const useAthletes = () => useTrainingStore((state) => state.athletes);
export const useExercises = () => useTrainingStore((state) => state.exercises);
export const useSessions = () => useTrainingStore((state) => state.sessions);
export const useTemplates = () => useTrainingStore((state) => state.templates);
export const useSettings = () => useTrainingStore((state) => state.settings);
export const useLabEntries = () => useTrainingStore((state) => state.labEntries);
export const useActiveSessionId = () => useTrainingStore((state) => state.activeSessionId);
export const useTrainingPlans = () => useTrainingStore((state) => state.trainingPlans);
export const useActiveTrainingPlanId = () => useTrainingStore((state) => state.activeTrainingPlanId);

// ============================================
// GRANULAR SELECTORS (performance optimized)
// ============================================

/** Sessions filtered by status - avoids re-renders when other sessions change */
export const useCompletedSessions = () => useTrainingStore((state) =>
    state.sessions.filter(s => s.status === 'completed')
);

export const usePlannedSessions = () => useTrainingStore((state) =>
    state.sessions.filter(s => s.status === 'planned')
);

export const useInProgressSessions = () => useTrainingStore((state) =>
    state.sessions.filter(s => s.status === 'in_progress')
);

/** Active athletes only */
export const useActiveAthletes = () => useTrainingStore((state) =>
    state.athletes.filter(a => a.isActive)
);

/** Sessions for specific athlete - use with useMemo for ID */
export const useSessionsByAthlete = (athleteId: string) => useTrainingStore((state) =>
    state.sessions.filter(s => s.athleteId === athleteId)
);

/** Template usage stats for analytics */
export const useTemplateUsageStats = () => useTrainingStore((state) => {
    const usage: Record<string, number> = {};
    state.sessions.forEach(s => {
        if (s.templateId) {
            usage[s.templateId] = (usage[s.templateId] || 0) + 1;
        }
    });
    return usage;
});

/** Weekly session count for dashboard */
export const useWeeklySessionCount = () => useTrainingStore((state) => {
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());
    weekStart.setHours(0, 0, 0, 0);

    return state.sessions.filter(s =>
        s.status === 'completed' &&
        s.completedAt &&
        new Date(s.completedAt) >= weekStart
    ).length;
});

/** 1RM Anchor Config */
export const useAnchorConfig = () => useTrainingStore((state) => state.anchorConfig);

/** Exercise Categories */
export const useExerciseCategories = () => useTrainingStore((state) => state.exerciseCategories);
