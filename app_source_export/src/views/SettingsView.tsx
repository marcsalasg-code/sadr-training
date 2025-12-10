/**
 * SettingsView - Vista de configuración de la aplicación
 * Permite ajustar preferencias de entrenamiento, UI y datos
 * Rediseñado con UI Aura
 */

import { useState } from 'react';
import { Input, Select, Toggle, ConfirmModal } from '../components/ui';
import {
    AuraSection,
    AuraPanel,
    AuraButton,
} from '../components/ui/aura';
import { useSettings, useTrainingStore } from '../store/store';

export function SettingsView() {
    const settings = useSettings();
    const { updateSettings, resetSettings, exportData, importData, clearAllData } = useTrainingStore();

    const [showResetModal, setShowResetModal] = useState(false);
    const [showClearDataModal, setShowClearDataModal] = useState(false);
    const [showImportConfirmModal, setShowImportConfirmModal] = useState(false);
    const [pendingImportFile, setPendingImportFile] = useState<File | null>(null);
    const [importError, setImportError] = useState<string | null>(null);
    const [importSuccess, setImportSuccess] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'training' | 'interface' | 'data'>('training');

    const handleSettingChange = <K extends keyof typeof settings>(
        key: K,
        value: typeof settings[K]
    ) => {
        updateSettings({ [key]: value });
    };

    const handleExport = () => {
        const data = exportData();
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `sadr-backup-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleImportSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setPendingImportFile(file);
        setShowImportConfirmModal(true);
        e.target.value = '';
    };

    const handleImportConfirm = () => {
        if (!pendingImportFile) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            const content = event.target?.result as string;
            const success = importData(content);
            if (!success) {
                setImportError('Import failed. Check file format.');
                setImportSuccess(null);
            } else {
                setImportError(null);
                setImportSuccess('✓ Data imported successfully');
                setTimeout(() => setImportSuccess(null), 5000);
            }
        };
        reader.readAsText(pendingImportFile);
        setPendingImportFile(null);
        setShowImportConfirmModal(false);
    };

    const handleImportCancel = () => {
        setPendingImportFile(null);
        setShowImportConfirmModal(false);
    };

    const tabs = [
        { id: 'training', label: 'Training', icon: '🏋️' },
        { id: 'interface', label: 'Interface', icon: '🎨' },
        { id: 'data', label: 'Data', icon: '💾' },
    ] as const;

    return (
        <div className="p-8 space-y-6 max-w-4xl mx-auto">
            <AuraSection
                title="Settings"
                subtitle="Configure the app to your preferences"
            />

            {/* Tabs */}
            <div className="flex gap-2 border-b border-[#2A2A2A] pb-2">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`px-4 py-2 rounded-t-lg text-sm font-medium transition-colors ${activeTab === tab.id
                            ? 'bg-[var(--color-accent-gold)] text-black'
                            : 'text-gray-500 hover:text-white hover:bg-[#1A1A1A]'
                            }`}
                    >
                        {tab.icon} {tab.label}
                    </button>
                ))}
            </div>

            {/* Training Tab */}
            {activeTab === 'training' && (
                <div className="space-y-6">
                    <AuraPanel header={<span className="text-white font-medium">Training Parameters</span>}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Input
                                label="Default Rest (seconds)"
                                type="number"
                                value={settings.defaultRestSeconds}
                                onChange={(e) => handleSettingChange('defaultRestSeconds', Number(e.target.value))}
                                min={0}
                                max={600}
                            />
                            <Input
                                label="Weight Increment (kg)"
                                type="number"
                                step={0.5}
                                value={settings.weightIncrement}
                                onChange={(e) => handleSettingChange('weightIncrement', Number(e.target.value))}
                                min={0.5}
                                max={10}
                            />
                            <Input
                                label="Barbell Weight (kg)"
                                type="number"
                                value={settings.barbellWeight}
                                onChange={(e) => handleSettingChange('barbellWeight', Number(e.target.value))}
                                min={0}
                                max={30}
                            />
                        </div>
                    </AuraPanel>

                    <AuraPanel header={<span className="text-white font-medium">Intensity Metrics</span>}>
                        <div className="space-y-4">
                            <Toggle
                                label="Show RPE"
                                description="Rate of Perceived Exertion (1-10)"
                                checked={settings.showRPE}
                                onChange={(checked) => handleSettingChange('showRPE', checked)}
                            />
                            <Toggle
                                label="Show RIR"
                                description="Reps in Reserve (0-5)"
                                checked={settings.showRIR}
                                onChange={(checked) => handleSettingChange('showRIR', checked)}
                            />
                            <Toggle
                                label="Show Warmup Sets"
                                description="Include warmup sets in sessions"
                                checked={settings.showWarmupSets}
                                onChange={(checked) => handleSettingChange('showWarmupSets', checked)}
                            />
                            <Toggle
                                label="Show 1RM Hints"
                                description="Display 1RM reference and load suggestions in sessions"
                                checked={settings.show1RMHints ?? true}
                                onChange={(checked) => handleSettingChange('show1RMHints', checked)}
                            />
                        </div>
                    </AuraPanel>

                    <AuraPanel header={<span className="text-white font-medium">Rest Timer</span>}>
                        <div className="space-y-4">
                            <Toggle
                                label="Auto-start rest timer"
                                description="Start timer when completing a set"
                                checked={settings.autoStartRest}
                                onChange={(checked) => handleSettingChange('autoStartRest', checked)}
                            />
                            <Toggle
                                label="Vibrate on rest end"
                                description="Haptic notification when rest ends"
                                checked={settings.vibrateOnRestEnd}
                                onChange={(checked) => handleSettingChange('vibrateOnRestEnd', checked)}
                            />
                        </div>
                    </AuraPanel>
                </div>
            )}

            {/* Interface Tab */}
            {activeTab === 'interface' && (
                <div className="space-y-6">
                    <AuraPanel header={<span className="text-white font-medium">Display Preferences</span>}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Select
                                label="Language"
                                value={settings.language}
                                onChange={(e) => handleSettingChange('language', e.target.value as 'es' | 'en')}
                                options={[
                                    { value: 'es', label: 'Español' },
                                    { value: 'en', label: 'English' },
                                ]}
                            />
                            <Select
                                label="Default View"
                                value={settings.defaultView}
                                onChange={(e) => handleSettingChange('defaultView', e.target.value as 'dashboard' | 'calendar' | 'athletes')}
                                options={[
                                    { value: 'dashboard', label: 'Dashboard' },
                                    { value: 'calendar', label: 'Calendar' },
                                    { value: 'athletes', label: 'Athletes' },
                                ]}
                            />
                        </div>
                    </AuraPanel>

                    <AuraPanel header={<span className="text-white font-medium">View Mode</span>}>
                        <Toggle
                            label="Compact mode"
                            description="Reduce spacing to show more information"
                            checked={settings.compactMode}
                            onChange={(checked) => handleSettingChange('compactMode', checked)}
                        />
                    </AuraPanel>

                    <AuraPanel header={<span className="text-white font-medium">Theme</span>}>
                        <p className="text-sm text-gray-500 mb-4">
                            Currently only the premium dark theme is available.
                        </p>
                        <div className="flex gap-3">
                            <div className="w-24 h-16 rounded-lg bg-[#0A0A0A] border-2 border-[var(--color-accent-gold)] flex items-center justify-center">
                                <span className="text-xs text-[var(--color-accent-gold)]">Dark</span>
                            </div>
                            <div className="w-24 h-16 rounded-lg bg-gray-200 opacity-40 flex items-center justify-center cursor-not-allowed">
                                <span className="text-xs text-gray-500">Light</span>
                            </div>
                        </div>
                    </AuraPanel>
                </div>
            )}

            {/* Data Tab */}
            {activeTab === 'data' && (
                <div className="space-y-6">
                    <AuraPanel header={<span className="text-white font-medium">Export / Import</span>}>
                        <p className="text-sm text-gray-500 mb-4">
                            Export your data for backup or import from a previous file.
                        </p>
                        <div className="flex flex-wrap gap-3">
                            <AuraButton onClick={handleExport}>
                                📥 Export Data
                            </AuraButton>
                            <label className="inline-block">
                                <AuraButton variant="secondary">
                                    <span>📤 Import Data</span>
                                </AuraButton>
                                <input
                                    type="file"
                                    accept=".json"
                                    onChange={handleImportSelect}
                                    className="sr-only"
                                />
                            </label>
                        </div>
                        {importSuccess && (
                            <p className="mt-3 text-sm text-green-400">{importSuccess}</p>
                        )}
                        {importError && (
                            <p className="mt-3 text-sm text-red-400">{importError}</p>
                        )}
                    </AuraPanel>

                    <AuraPanel header={<span className="text-white font-medium">Auto Backup</span>}>
                        <div className="space-y-4">
                            <Toggle
                                label="Enable auto backup"
                                description="Periodically save a backup"
                                checked={settings.autoBackup}
                                onChange={(checked) => handleSettingChange('autoBackup', checked)}
                            />
                            {settings.autoBackup && (
                                <Select
                                    label="Backup Frequency"
                                    value={settings.backupFrequency}
                                    onChange={(e) => handleSettingChange('backupFrequency', e.target.value as 'daily' | 'weekly' | 'monthly')}
                                    options={[
                                        { value: 'daily', label: 'Daily' },
                                        { value: 'weekly', label: 'Weekly' },
                                        { value: 'monthly', label: 'Monthly' },
                                    ]}
                                />
                            )}
                        </div>
                    </AuraPanel>

                    <AuraPanel header={<span className="text-white font-medium">Export Format</span>}>
                        <Select
                            label="Format"
                            value={settings.exportFormat}
                            onChange={(e) => handleSettingChange('exportFormat', e.target.value as 'json' | 'csv')}
                            options={[
                                { value: 'json', label: 'JSON (recommended)' },
                                { value: 'csv', label: 'CSV' },
                            ]}
                        />
                    </AuraPanel>

                    <AuraPanel variant="accent" header={<span className="text-red-400 font-medium">⚠️ Danger Zone</span>}>
                        <p className="text-sm text-gray-500 mb-4">
                            These actions are irreversible. Make sure you have a backup.
                        </p>
                        <div className="flex flex-wrap gap-3">
                            <AuraButton variant="secondary" onClick={() => setShowResetModal(true)}>
                                🔄 Reset Settings
                            </AuraButton>
                            <AuraButton
                                variant="secondary"
                                className="!border-red-500/50 !text-red-400 hover:!bg-red-500/10"
                                onClick={() => setShowClearDataModal(true)}
                            >
                                🗑️ Clear All Data
                            </AuraButton>
                        </div>
                    </AuraPanel>
                </div>
            )}

            {/* Modals */}
            <ConfirmModal
                isOpen={showResetModal}
                onClose={() => setShowResetModal(false)}
                onConfirm={() => resetSettings()}
                title="Reset Settings"
                message="Reset all settings to default values? This doesn't affect your data (athletes, sessions, etc.)."
                confirmText="Reset"
            />

            <ConfirmModal
                isOpen={showClearDataModal}
                onClose={() => setShowClearDataModal(false)}
                onConfirm={() => clearAllData()}
                title="Clear All Data"
                message="⚠️ This will delete ALL your data: athletes, sessions, templates, exercises, and settings. This action is IRREVERSIBLE."
                confirmText="Yes, clear all"
                isDestructive
            />

            <ConfirmModal
                isOpen={showImportConfirmModal}
                onClose={handleImportCancel}
                onConfirm={handleImportConfirm}
                title="Import Data"
                message="⚠️ This will replace ALL current data with the selected file. Continue?"
                confirmText="Yes, import"
                isDestructive
            />
        </div>
    );
}
