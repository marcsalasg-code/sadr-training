/**
 * AI Store Slice
 * Estado global de IA para Zustand
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { AIEngine, type ProviderType } from './AIEngine';
import type { AILogEntry } from './types';

interface AISettings {
    // Configuración general
    isEnabled: boolean;
    provider: ProviderType;
    mode: 'mock' | 'live' | 'hybrid'; // hybrid = try live, fallback to mock

    // API remota
    apiUrl: string;
    apiKey: string;
    model: string;

    // Comportamiento
    autoSuggestions: boolean;
    showInlineHints: boolean;
    aggressiveness: 'minimal' | 'balanced' | 'proactive';

    // Features específicas
    templateGeneration: boolean;
    loadPrediction: boolean;
    exerciseSuggestions: boolean;
}

// Stats tracking for AI calls
interface AIStats {
    callsByType: Record<string, number>;
    errorsByType: Record<string, number>;
    validationErrors: number;
    retryCount: number;
    avgResponseTime: Record<string, number>;
    totalCalls: number;
    totalErrors: number;
}

// Quota tracking for API usage
interface AIQuotaInfo {
    dailyLimit: number;        // Límite estimado (ej: 60 para free tier)
    usedToday: number;         // Llamadas hoy
    lastResetDate: string;     // Fecha último reset (YYYY-MM-DD)
    isQuotaExhausted: boolean; // Flag de cuota agotada
}

interface AIState {
    settings: AISettings;
    logs: AILogEntry[];
    stats: AIStats;
    isInitialized: boolean;

    // Acciones de configuración
    updateSettings: (updates: Partial<AISettings>) => void;
    toggleFeature: (feature: keyof Pick<AISettings, 'templateGeneration' | 'loadPrediction' | 'exerciseSuggestions' | 'autoSuggestions' | 'showInlineHints'>) => void;
    setProvider: (provider: ProviderType) => void;
    setMode: (mode: 'mock' | 'live' | 'hybrid') => void;
    setEnabled: (enabled: boolean) => void;

    // Logs
    addLog: (log: AILogEntry) => void;
    clearLogs: () => void;

    // Stats
    recordCall: (type: string, success: boolean, responseTimeMs: number, wasRetry?: boolean, validationError?: boolean) => void;
    resetStats: () => void;

    // Quota
    quota: AIQuotaInfo;
    incrementQuotaUsage: () => void;
    resetDailyQuota: () => void;
    setQuotaExhausted: (exhausted: boolean) => void;

    // Inicialización
    initialize: () => Promise<void>;
}

const defaultSettings: AISettings = {
    isEnabled: true,
    provider: import.meta.env.VITE_OPENAI_API_KEY ? 'remote' : 'mock',
    mode: import.meta.env.VITE_OPENAI_API_KEY ? 'live' : 'mock',
    // Gemini API endpoint (OpenAI-compatible format recommended)
    apiUrl: import.meta.env.VITE_AI_API_URL || 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions',
    apiKey: import.meta.env.VITE_OPENAI_API_KEY || '',
    model: import.meta.env.VITE_AI_MODEL || 'gemini-2.0-flash-exp',
    autoSuggestions: true,
    showInlineHints: true,
    aggressiveness: 'balanced',
    templateGeneration: true,
    loadPrediction: true,
    exerciseSuggestions: true,
};

const defaultStats: AIStats = {
    callsByType: {},
    errorsByType: {},
    validationErrors: 0,
    retryCount: 0,
    avgResponseTime: {},
    totalCalls: 0,
    totalErrors: 0,
};

const defaultQuota: AIQuotaInfo = {
    dailyLimit: 60,      // Gemini free tier ~60 req/min
    usedToday: 0,
    lastResetDate: new Date().toISOString().split('T')[0],
    isQuotaExhausted: false,
};

export const useAIStore = create<AIState>()(
    persist(
        (set, get) => ({
            settings: defaultSettings,
            logs: [],
            stats: defaultStats,
            quota: defaultQuota,
            isInitialized: false,

            updateSettings: (updates) => {
                set((state) => ({
                    settings: { ...state.settings, ...updates },
                }));

                // Sincronizar con AIEngine
                const newSettings = { ...get().settings, ...updates };

                if (updates.isEnabled !== undefined) {
                    AIEngine.setEnabled(updates.isEnabled);
                }
                if (updates.provider !== undefined) {
                    AIEngine.setProvider(updates.provider);
                }
                if (updates.apiKey !== undefined || updates.apiUrl !== undefined || updates.model !== undefined) {
                    AIEngine.configureRemote({
                        apiUrl: newSettings.apiUrl,
                        apiKey: newSettings.apiKey,
                        model: newSettings.model,
                    });
                }
            },

            toggleFeature: (feature) => {
                set((state) => ({
                    settings: {
                        ...state.settings,
                        [feature]: !state.settings[feature],
                    },
                }));
            },

            setProvider: (provider) => {
                set((state) => ({
                    settings: { ...state.settings, provider },
                }));
                AIEngine.setProvider(provider);
            },

            setEnabled: (enabled) => {
                set((state) => ({
                    settings: { ...state.settings, isEnabled: enabled },
                }));
                AIEngine.setEnabled(enabled);
            },

            setMode: (mode) => {
                set((state) => ({
                    settings: { ...state.settings, mode },
                }));
                // Sync provider based on mode
                if (mode === 'mock') {
                    AIEngine.setProvider('mock');
                } else {
                    AIEngine.setProvider('remote');
                }
            },

            recordCall: (type, success, responseTimeMs, wasRetry = false, validationError = false) => {
                set((state) => {
                    const stats = { ...state.stats };

                    // Update call counts
                    stats.callsByType[type] = (stats.callsByType[type] || 0) + 1;
                    stats.totalCalls++;

                    // Update errors if failed
                    if (!success) {
                        stats.errorsByType[type] = (stats.errorsByType[type] || 0) + 1;
                        stats.totalErrors++;
                    }

                    // Track validation errors
                    if (validationError) {
                        stats.validationErrors++;
                    }

                    // Track retries
                    if (wasRetry) {
                        stats.retryCount++;
                    }

                    // Update average response time
                    const prevAvg = stats.avgResponseTime[type] || 0;
                    const prevCount = (stats.callsByType[type] || 1) - 1;
                    stats.avgResponseTime[type] = prevCount > 0
                        ? Math.round((prevAvg * prevCount + responseTimeMs) / (prevCount + 1))
                        : responseTimeMs;

                    return { stats };
                });
            },

            resetStats: () => {
                set({ stats: defaultStats });
            },

            // Quota methods
            incrementQuotaUsage: () => {
                set((state) => {
                    const today = new Date().toISOString().split('T')[0];
                    // Reset if new day
                    if (state.quota.lastResetDate !== today) {
                        return {
                            quota: {
                                ...state.quota,
                                usedToday: 1,
                                lastResetDate: today,
                                isQuotaExhausted: false,
                            }
                        };
                    }
                    return {
                        quota: {
                            ...state.quota,
                            usedToday: state.quota.usedToday + 1,
                        }
                    };
                });
            },

            resetDailyQuota: () => {
                set((state) => ({
                    quota: {
                        ...state.quota,
                        usedToday: 0,
                        lastResetDate: new Date().toISOString().split('T')[0],
                        isQuotaExhausted: false,
                    }
                }));
            },

            setQuotaExhausted: (exhausted: boolean) => {
                set((state) => ({
                    quota: {
                        ...state.quota,
                        isQuotaExhausted: exhausted,
                    }
                }));
            },

            addLog: (log) => {
                set((state) => ({
                    logs: [...state.logs.slice(-99), log],
                }));
            },

            clearLogs: () => {
                set({ logs: [] });
                AIEngine.clearLogs();
            },

            initialize: async () => {
                const { settings } = get();

                await AIEngine.initialize();
                AIEngine.setEnabled(settings.isEnabled);
                AIEngine.setProvider(settings.provider);

                if (settings.apiKey) {
                    AIEngine.configureRemote({
                        apiUrl: settings.apiUrl,
                        apiKey: settings.apiKey,
                        model: settings.model,
                    });
                }

                // Suscribirse a logs
                AIEngine.onLog((log) => {
                    get().addLog(log);
                });

                set({ isInitialized: true });
                console.log('[AIStore] Initialized with settings:', settings.provider, settings.isEnabled ? 'enabled' : 'disabled');
            },
        }),
        {
            name: 'ai-store',
            storage: createJSONStorage(() => localStorage),
            partialize: (state) => ({
                settings: state.settings,
                // No persistir logs
            }),
        }
    )
);

// Selectores para uso optimizado
export const useAISettings = () => useAIStore((state) => state.settings);
export const useAILogs = () => useAIStore((state) => state.logs);
export const useAIEnabled = () => useAIStore((state) => state.settings.isEnabled);
export const useAIStats = () => useAIStore((state) => state.stats);
export const useAIMode = () => useAIStore((state) => state.settings.mode);
export const useAIQuota = () => useAIStore((state) => state.quota);

