/**
 * TRAINING MONITOR - Zustand Store
 * Estado global de la aplicación con slices bien definidas
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type {
    Athlete,
    Exercise,
    WorkoutSession,
    WorkoutTemplate,
    Settings,
    LabEntry,
    UsageEvent,
    UUID,
} from '../types/types';

// ============================================
// HELPERS
// ============================================

const generateId = (): UUID => crypto.randomUUID();

const now = (): string => new Date().toISOString();

// ============================================
// DEFAULT VALUES
// ============================================

const defaultSettings: Settings = {
    language: 'es',
    theme: 'dark',
    defaultRestSeconds: 90,
    weightIncrement: 2.5,
    barbellWeight: 20,
    showRPE: true,
    showRIR: false,
    autoStartRest: true,
    vibrateOnRestEnd: true,
    compactMode: false,
    showWarmupSets: true,
    defaultView: 'dashboard',
    exportFormat: 'json',
    autoBackup: true,
    backupFrequency: 'weekly',
};

// ============================================
// STORE INTERFACE
// ============================================

interface TrainingStore {
    // === ATHLETES ===
    athletes: Athlete[];
    addAthlete: (athlete: Omit<Athlete, 'id' | 'createdAt' | 'updatedAt'>) => Athlete;
    updateAthlete: (id: UUID, updates: Partial<Athlete>) => void;
    deleteAthlete: (id: UUID) => void;
    getAthlete: (id: UUID) => Athlete | undefined;

    // === EXERCISES ===
    exercises: Exercise[];
    addExercise: (exercise: Omit<Exercise, 'id' | 'createdAt'>) => Exercise;
    updateExercise: (id: UUID, updates: Partial<Exercise>) => void;
    deleteExercise: (id: UUID) => void;
    getExercise: (id: UUID) => Exercise | undefined;

    // === SESSIONS ===
    sessions: WorkoutSession[];
    addSession: (session: Omit<WorkoutSession, 'id' | 'createdAt' | 'updatedAt'>) => WorkoutSession;
    updateSession: (id: UUID, updates: Partial<WorkoutSession>) => void;
    deleteSession: (id: UUID) => void;
    getSession: (id: UUID) => WorkoutSession | undefined;
    getSessionsByAthlete: (athleteId: UUID) => WorkoutSession[];
    getSessionsByDate: (date: string) => WorkoutSession[];

    // === TEMPLATES ===
    templates: WorkoutTemplate[];
    addTemplate: (template: Omit<WorkoutTemplate, 'id' | 'createdAt' | 'updatedAt'>) => WorkoutTemplate;
    updateTemplate: (id: UUID, updates: Partial<WorkoutTemplate>) => void;
    deleteTemplate: (id: UUID) => void;
    getTemplate: (id: UUID) => WorkoutTemplate | undefined;

    // === SETTINGS ===
    settings: Settings;
    updateSettings: (updates: Partial<Settings>) => void;
    resetSettings: () => void;

    // === INTERNAL LAB ===
    labEntries: LabEntry[];
    usageEvents: UsageEvent[];
    addLabEntry: (entry: Omit<LabEntry, 'id' | 'createdAt'>) => LabEntry;
    updateLabEntry: (id: UUID, updates: Partial<LabEntry>) => void;
    deleteLabEntry: (id: UUID) => void;
    logUsageEvent: (event: string, context?: string, data?: Record<string, unknown>) => void;
    clearUsageEvents: () => void;

    // === ACTIVE SESSION ===
    activeSessionId: UUID | null;
    setActiveSession: (id: UUID | null) => void;

    // === DATA MANAGEMENT ===
    exportData: () => string;
    importData: (jsonData: string) => boolean;
    clearAllData: () => void;
}

// ============================================
// STORE IMPLEMENTATION
// ============================================

export const useTrainingStore = create<TrainingStore>()(
    persist(
        (set, get) => ({
            // === ATHLETES ===
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

            // === EXERCISES ===
            exercises: [],

            addExercise: (exerciseData) => {
                const exercise: Exercise = {
                    ...exerciseData,
                    id: generateId(),
                    createdAt: now(),
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

            // === SESSIONS ===
            sessions: [],

            addSession: (sessionData) => {
                const session: WorkoutSession = {
                    ...sessionData,
                    id: generateId(),
                    createdAt: now(),
                    updatedAt: now(),
                };
                set((state) => ({ sessions: [...state.sessions, session] }));
                return session;
            },

            updateSession: (id, updates) => {
                set((state) => ({
                    sessions: state.sessions.map((s) =>
                        s.id === id ? { ...s, ...updates, updatedAt: now() } : s
                    ),
                }));
            },

            deleteSession: (id) => {
                set((state) => ({
                    sessions: state.sessions.filter((s) => s.id !== id),
                }));
            },

            getSession: (id) => get().sessions.find((s) => s.id === id),

            getSessionsByAthlete: (athleteId) =>
                get().sessions.filter((s) => s.athleteId === athleteId),

            getSessionsByDate: (date) =>
                get().sessions.filter((s) => s.scheduledDate?.startsWith(date)),

            // === TEMPLATES ===
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

            // === SETTINGS ===
            settings: defaultSettings,

            updateSettings: (updates) => {
                set((state) => ({
                    settings: { ...state.settings, ...updates },
                }));
            },

            resetSettings: () => {
                set({ settings: defaultSettings });
            },

            // === INTERNAL LAB ===
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

            // === ACTIVE SESSION ===
            activeSessionId: null,

            setActiveSession: (id) => {
                set({ activeSessionId: id });
            },

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
                    version: '1.0.0',
                    exportedAt: now(),
                    athletes: state.athletes,
                    exercises: state.exercises,
                    sessions: state.sessions,
                    templates: state.templates,
                    settings: state.settings,
                    labEntries: state.labEntries,
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
                // Note: usageEvents not persisted to save space
            }),
        }
    )
);

// ============================================
// SELECTOR HOOKS (para optimizar re-renders)
// ============================================

export const useAthletes = () => useTrainingStore((state) => state.athletes);
export const useExercises = () => useTrainingStore((state) => state.exercises);
export const useSessions = () => useTrainingStore((state) => state.sessions);
export const useTemplates = () => useTrainingStore((state) => state.templates);
export const useSettings = () => useTrainingStore((state) => state.settings);
export const useLabEntries = () => useTrainingStore((state) => state.labEntries);
export const useActiveSessionId = () => useTrainingStore((state) => state.activeSessionId);
