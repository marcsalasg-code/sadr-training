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
    AuraBadge,
} from '../components/ui/aura';
import { useSettings, useTrainingStore } from '../store/store';
import { AIEnginePanel, SystemStatsPanel, FeedbackPanel, SimulatorPanel, CategoryManager } from '../components/lab';
import { OneRMAnchorManager } from '../components/common/OneRMAnchorManager';

export function SettingsView() {
    const settings = useSettings();
    const { updateSettings, resetSettings, exportData, importData, clearAllData } = useTrainingStore();

    const [showResetModal, setShowResetModal] = useState(false);
    const [showClearDataModal, setShowClearDataModal] = useState(false);
    const [showImportConfirmModal, setShowImportConfirmModal] = useState(false);
    const [pendingImportFile, setPendingImportFile] = useState<File | null>(null);
    const [importError, setImportError] = useState<string | null>(null);
    const [importSuccess, setImportSuccess] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'training' | 'categories' | 'interface' | 'data' | 'advanced'>('training');
    const [advancedSubTab, setAdvancedSubTab] = useState<'experimental' | 'ai' | 'anchors' | 'categories' | 'feedback' | 'simulator' | 'system'>('experimental');

    // TrainingConfig
    const trainingConfig = useTrainingStore((s) => s.trainingConfig);
    const _updatePatternLabel = useTrainingStore((s) => s.updatePatternLabel);
    const togglePattern = useTrainingStore((s) => s.togglePattern);
    const _updateMuscleGroupLabel = useTrainingStore((s) => s.updateMuscleGroupLabel);
    const toggleMuscleGroup = useTrainingStore((s) => s.toggleMuscleGroup);
    const updateAnalysisSettings = useTrainingStore((s) => s.updateAnalysisSettings);

    // Role mode (EXPERIMENTAL - Iteration 1)
    const roleMode = useTrainingStore((s) => s.roleMode);
    const setRoleMode = useTrainingStore((s) => s.setRoleMode);

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
        { id: 'categories', label: 'Categorías', icon: '🏷️' },
        { id: 'interface', label: 'Interface', icon: '🎨' },
        { id: 'data', label: 'Data', icon: '💾' },
        { id: 'advanced', label: 'Avanzado', icon: '🔬' },
    ] as const;

    const advancedTabs = [
        { id: 'experimental', label: 'Experimental', icon: '🧪' },
        { id: 'ai', label: 'AI Engine', icon: '🤖' },
        { id: 'anchors', label: '1RM Anchors', icon: '🏋️' },
        { id: 'categories', label: 'Categories', icon: '📁' },
        { id: 'feedback', label: 'Feedback', icon: '📝' },
        { id: 'simulator', label: 'Simulator', icon: '🎲' },
        { id: 'system', label: 'System', icon: '🔧' },
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

            {/* Categories Tab - TrainingConfig */}
            {activeTab === 'categories' && (
                <div className="space-y-6">
                    <AuraPanel header={<span className="text-white font-medium">Patrones de Movimiento</span>}>
                        <p className="text-sm text-gray-500 mb-4">
                            Configura las categorías principales. Los cambios afectan a filtros y selectores.
                        </p>
                        <div className="space-y-2">
                            {[...trainingConfig.patterns].sort((a, b) => a.order - b.order).map((pattern) => (
                                <div
                                    key={pattern.id}
                                    className={`flex items-center justify-between p-3 rounded-lg ${pattern.enabled ? 'bg-[#141414]' : 'bg-[#0A0A0A] opacity-60'}`}
                                >
                                    <div className="flex items-center gap-3">
                                        <span className="text-lg">{pattern.icon}</span>
                                        <span className="text-white">{pattern.label}</span>
                                        <AuraBadge variant="muted">{pattern.id}</AuraBadge>
                                    </div>
                                    <button
                                        onClick={() => togglePattern(pattern.id, !pattern.enabled)}
                                        className={`w-10 h-5 rounded-full transition-colors relative ${pattern.enabled ? 'bg-[var(--color-accent-gold)]' : 'bg-[#333]'}`}
                                    >
                                        <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${pattern.enabled ? 'left-5' : 'left-0.5'}`} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </AuraPanel>

                    <AuraPanel header={<span className="text-white font-medium">Grupos Musculares</span>}>
                        <div className="space-y-2">
                            {[...trainingConfig.muscleGroups].sort((a, b) => a.order - b.order).map((group) => (
                                <div
                                    key={group.id}
                                    className={`flex items-center justify-between p-3 rounded-lg ${group.enabled ? 'bg-[#141414]' : 'bg-[#0A0A0A] opacity-60'}`}
                                >
                                    <div className="flex items-center gap-3">
                                        <span className="text-lg">{group.icon}</span>
                                        <span className="text-white">{group.label}</span>
                                        <AuraBadge variant="muted">{group.id}</AuraBadge>
                                    </div>
                                    <button
                                        onClick={() => toggleMuscleGroup(group.id, !group.enabled)}
                                        className={`w-10 h-5 rounded-full transition-colors relative ${group.enabled ? 'bg-purple-600' : 'bg-[#333]'}`}
                                    >
                                        <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${group.enabled ? 'left-5' : 'left-0.5'}`} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </AuraPanel>

                    <AuraPanel header={<span className="text-white font-medium">Análisis y Métricas</span>}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm text-gray-400 mb-2">Método 1RM</label>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => updateAnalysisSettings({ defaultRMMethod: 'brzycki' })}
                                        className={`flex-1 p-2 rounded-lg text-sm ${trainingConfig.analysis.defaultRMMethod === 'brzycki' ? 'bg-[var(--color-accent-gold)] text-black font-bold' : 'bg-[#1A1A1A] text-gray-400'}`}
                                    >
                                        Brzycki
                                    </button>
                                    <button
                                        onClick={() => updateAnalysisSettings({ defaultRMMethod: 'epley' })}
                                        className={`flex-1 p-2 rounded-lg text-sm ${trainingConfig.analysis.defaultRMMethod === 'epley' ? 'bg-[var(--color-accent-gold)] text-black font-bold' : 'bg-[#1A1A1A] text-gray-400'}`}
                                    >
                                        Epley
                                    </button>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm text-gray-400 mb-2">Volumen</label>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => updateAnalysisSettings({ showVolumeAs: 'kg_total' })}
                                        className={`flex-1 p-2 rounded-lg text-sm ${trainingConfig.analysis.showVolumeAs === 'kg_total' ? 'bg-[var(--color-accent-gold)] text-black font-bold' : 'bg-[#1A1A1A] text-gray-400'}`}
                                    >
                                        Kg Total
                                    </button>
                                    <button
                                        onClick={() => updateAnalysisSettings({ showVolumeAs: 'tonnage' })}
                                        className={`flex-1 p-2 rounded-lg text-sm ${trainingConfig.analysis.showVolumeAs === 'tonnage' ? 'bg-[var(--color-accent-gold)] text-black font-bold' : 'bg-[#1A1A1A] text-gray-400'}`}
                                    >
                                        Tonelaje
                                    </button>
                                </div>
                            </div>
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

            {/* Advanced Tab (Lab) */}
            {activeTab === 'advanced' && (
                <div className="space-y-6">
                    <AuraPanel header={<span className="text-white font-medium">🔬 Development Console</span>}>
                        <p className="text-sm text-gray-500 mb-4">
                            Advanced tools for development and debugging.
                        </p>

                        {/* Sub-tabs */}
                        <div className="flex gap-2 flex-wrap mb-4">
                            {advancedTabs.map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setAdvancedSubTab(tab.id)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${advancedSubTab === tab.id
                                        ? 'bg-purple-600 text-white'
                                        : 'bg-[#1A1A1A] text-gray-400 hover:bg-[#222]'
                                        }`}
                                >
                                    {tab.icon} {tab.label}
                                </button>
                            ))}
                        </div>
                    </AuraPanel>

                    {/* Advanced Tab Content */}
                    {advancedSubTab === 'experimental' && (
                        <AuraPanel header={<span className="text-white font-medium">🧪 Experimental Features</span>}>
                            <p className="text-sm text-gray-500 mb-4">
                                Features in testing phase. May change or be removed in future versions.
                            </p>

                            {/* Role Mode Selector */}
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm text-gray-400 mb-2">Role Mode</label>
                                    <p className="text-xs text-gray-600 mb-3">
                                        Changes sidebar visibility based on role. No route guards in Iteration 1.
                                    </p>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => setRoleMode('coach')}
                                            className={`flex-1 p-3 rounded-lg text-sm font-medium transition-all ${roleMode === 'coach'
                                                ? 'bg-[var(--color-accent-gold)] text-black'
                                                : 'bg-[#1A1A1A] text-gray-400 hover:bg-[#222]'
                                                }`}
                                        >
                                            🏋️ Coach
                                        </button>
                                        <button
                                            onClick={() => setRoleMode('athlete')}
                                            className={`flex-1 p-3 rounded-lg text-sm font-medium transition-all ${roleMode === 'athlete'
                                                ? 'bg-blue-600 text-white'
                                                : 'bg-[#1A1A1A] text-gray-400 hover:bg-[#222]'
                                                }`}
                                        >
                                            🏃 Athlete
                                        </button>
                                        <button
                                            onClick={() => setRoleMode('admin')}
                                            className={`flex-1 p-3 rounded-lg text-sm font-medium transition-all ${roleMode === 'admin'
                                                ? 'bg-purple-600 text-white'
                                                : 'bg-[#1A1A1A] text-gray-400 hover:bg-[#222]'
                                                }`}
                                        >
                                            🔧 Admin
                                        </button>
                                    </div>
                                    <p className="text-xs text-gray-600 mt-2">
                                        Current: <AuraBadge variant={roleMode === 'coach' ? 'gold' : 'muted'}>{roleMode}</AuraBadge>
                                    </p>
                                </div>
                            </div>
                        </AuraPanel>
                    )}
                    {advancedSubTab === 'ai' && <AIEnginePanel />}
                    {advancedSubTab === 'anchors' && <OneRMAnchorManager />}
                    {advancedSubTab === 'categories' && <CategoryManager />}
                    {advancedSubTab === 'feedback' && <FeedbackPanel />}
                    {advancedSubTab === 'simulator' && <SimulatorPanel />}
                    {advancedSubTab === 'system' && <SystemStatsPanel />}
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
