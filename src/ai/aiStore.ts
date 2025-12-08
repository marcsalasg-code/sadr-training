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

interface AIState {
    settings: AISettings;
    logs: AILogEntry[];
    isInitialized: boolean;

    // Acciones de configuración
    updateSettings: (updates: Partial<AISettings>) => void;
    toggleFeature: (feature: keyof Pick<AISettings, 'templateGeneration' | 'loadPrediction' | 'exerciseSuggestions' | 'autoSuggestions' | 'showInlineHints'>) => void;
    setProvider: (provider: ProviderType) => void;
    setEnabled: (enabled: boolean) => void;

    // Logs
    addLog: (log: AILogEntry) => void;
    clearLogs: () => void;

    // Inicialización
    initialize: () => Promise<void>;
}

const defaultSettings: AISettings = {
    isEnabled: true,
    provider: import.meta.env.VITE_OPENAI_API_KEY ? 'remote' : 'mock',
    apiUrl: import.meta.env.VITE_AI_API_URL || 'https://api.openai.com/v1/chat/completions',
    apiKey: import.meta.env.VITE_OPENAI_API_KEY || '',
    model: import.meta.env.VITE_AI_MODEL || 'gpt-4o-mini',
    autoSuggestions: true,
    showInlineHints: true,
    aggressiveness: 'balanced',
    templateGeneration: true,
    loadPrediction: true,
    exerciseSuggestions: true,
};

export const useAIStore = create<AIState>()(
    persist(
        (set, get) => ({
            settings: defaultSettings,
            logs: [],
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
