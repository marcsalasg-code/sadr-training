/**
 * Settings Slice - Zustand slice for app settings management
 */

import type { StateCreator } from 'zustand';
import type { Settings } from '../types/types';

// ============================================
// DEFAULT VALUES
// ============================================

export const defaultSettings: Settings = {
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
// SLICE INTERFACE
// ============================================

export interface SettingsSlice {
    settings: Settings;
    updateSettings: (updates: Partial<Settings>) => void;
    resetSettings: () => void;
}

// ============================================
// SLICE CREATOR
// ============================================

export const createSettingsSlice: StateCreator<
    SettingsSlice,
    [],
    [],
    SettingsSlice
> = (set) => ({
    settings: defaultSettings,

    updateSettings: (updates) => {
        set((state) => ({
            settings: { ...state.settings, ...updates },
        }));
    },

    resetSettings: () => {
        set({ settings: defaultSettings });
    },
});
