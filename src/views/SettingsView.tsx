/**
 * SettingsView - Vista de configuración de la aplicación
 * Permite ajustar preferencias de entrenamiento, UI y datos
 */

import { useState } from 'react';
import { PageContainer } from '../components/layout';
import { Card, Button, Input, Select, Toggle, Tabs, ConfirmModal } from '../components/ui';
import { useSettings, useTrainingStore } from '../store/store';

export function SettingsView() {
    const settings = useSettings();
    const { updateSettings, resetSettings, exportData, importData, clearAllData } = useTrainingStore();

    const [showResetModal, setShowResetModal] = useState(false);
    const [showClearDataModal, setShowClearDataModal] = useState(false);
    const [importError, setImportError] = useState<string | null>(null);

    // Handlers para settings
    const handleSettingChange = <K extends keyof typeof settings>(
        key: K,
        value: typeof settings[K]
    ) => {
        updateSettings({ [key]: value });
    };

    // Export data
    const handleExport = () => {
        const data = exportData();
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `training-monitor-backup-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
    };

    // Import data
    const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const content = event.target?.result as string;
            const success = importData(content);
            if (!success) {
                setImportError('Error al importar los datos. Verifica que el archivo sea válido.');
            } else {
                setImportError(null);
            }
        };
        reader.readAsText(file);
        e.target.value = ''; // Reset input
    };

    const tabs = [
        {
            id: 'training',
            label: 'Entrenamiento',
            icon: '🏋️',
            content: (
                <div className="space-y-6">
                    <Card>
                        <h3 className="text-lg font-semibold mb-4">Parámetros de Entrenamiento</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Input
                                label="Descanso por defecto (segundos)"
                                type="number"
                                value={settings.defaultRestSeconds}
                                onChange={(e) => handleSettingChange('defaultRestSeconds', Number(e.target.value))}
                                min={0}
                                max={600}
                            />
                            <Input
                                label="Incremento de peso (kg)"
                                type="number"
                                step={0.5}
                                value={settings.weightIncrement}
                                onChange={(e) => handleSettingChange('weightIncrement', Number(e.target.value))}
                                min={0.5}
                                max={10}
                                hint="Para incrementos rápidos durante sesiones"
                            />
                            <Input
                                label="Peso de la barra (kg)"
                                type="number"
                                value={settings.barbellWeight}
                                onChange={(e) => handleSettingChange('barbellWeight', Number(e.target.value))}
                                min={0}
                                max={30}
                            />
                        </div>
                    </Card>

                    <Card>
                        <h3 className="text-lg font-semibold mb-4">Métricas de Intensidad</h3>
                        <div className="space-y-4">
                            <Toggle
                                label="Mostrar RPE"
                                description="Rate of Perceived Exertion (1-10)"
                                checked={settings.showRPE}
                                onChange={(checked) => handleSettingChange('showRPE', checked)}
                            />
                            <Toggle
                                label="Mostrar RIR"
                                description="Reps in Reserve (0-5)"
                                checked={settings.showRIR}
                                onChange={(checked) => handleSettingChange('showRIR', checked)}
                            />
                            <Toggle
                                label="Mostrar series de calentamiento"
                                description="Incluir warmup sets en las sesiones"
                                checked={settings.showWarmupSets}
                                onChange={(checked) => handleSettingChange('showWarmupSets', checked)}
                            />
                        </div>
                    </Card>

                    <Card>
                        <h3 className="text-lg font-semibold mb-4">Cronómetro de Descanso</h3>
                        <div className="space-y-4">
                            <Toggle
                                label="Iniciar descanso automáticamente"
                                description="Comenzar el cronómetro al completar una serie"
                                checked={settings.autoStartRest}
                                onChange={(checked) => handleSettingChange('autoStartRest', checked)}
                            />
                            <Toggle
                                label="Vibrar al terminar descanso"
                                description="Notificación háptica cuando termine el descanso"
                                checked={settings.vibrateOnRestEnd}
                                onChange={(checked) => handleSettingChange('vibrateOnRestEnd', checked)}
                            />
                        </div>
                    </Card>
                </div>
            ),
        },
        {
            id: 'interface',
            label: 'Interfaz',
            icon: '🎨',
            content: (
                <div className="space-y-6">
                    <Card>
                        <h3 className="text-lg font-semibold mb-4">Preferencias de Visualización</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Select
                                label="Idioma"
                                value={settings.language}
                                onChange={(e) => handleSettingChange('language', e.target.value as 'es' | 'en')}
                                options={[
                                    { value: 'es', label: 'Español' },
                                    { value: 'en', label: 'English' },
                                ]}
                            />
                            <Select
                                label="Vista por defecto"
                                value={settings.defaultView}
                                onChange={(e) => handleSettingChange('defaultView', e.target.value as 'dashboard' | 'calendar' | 'athletes')}
                                options={[
                                    { value: 'dashboard', label: 'Dashboard' },
                                    { value: 'calendar', label: 'Calendario' },
                                    { value: 'athletes', label: 'Atletas' },
                                ]}
                            />
                        </div>
                    </Card>

                    <Card>
                        <h3 className="text-lg font-semibold mb-4">Modo de Visualización</h3>
                        <div className="space-y-4">
                            <Toggle
                                label="Modo compacto"
                                description="Reduce el espaciado para mostrar más información"
                                checked={settings.compactMode}
                                onChange={(checked) => handleSettingChange('compactMode', checked)}
                            />
                        </div>
                    </Card>

                    <Card>
                        <h3 className="text-lg font-semibold mb-4">Tema</h3>
                        <p className="text-sm text-[var(--color-text-muted)] mb-4">
                            Actualmente solo está disponible el tema oscuro premium.
                        </p>
                        <div className="flex gap-3">
                            <div className="w-24 h-16 rounded-lg bg-[var(--color-bg-primary)] border-2 border-[var(--color-accent-gold)] flex items-center justify-center">
                                <span className="text-xs text-[var(--color-accent-gold)]">Oscuro</span>
                            </div>
                            <div className="w-24 h-16 rounded-lg bg-gray-200 opacity-50 flex items-center justify-center cursor-not-allowed">
                                <span className="text-xs text-gray-500">Claro</span>
                            </div>
                        </div>
                    </Card>
                </div>
            ),
        },
        {
            id: 'data',
            label: 'Datos',
            icon: '💾',
            content: (
                <div className="space-y-6">
                    <Card>
                        <h3 className="text-lg font-semibold mb-4">Exportar / Importar</h3>
                        <p className="text-sm text-[var(--color-text-muted)] mb-4">
                            Exporta tus datos para hacer backup o importa datos desde un archivo previo.
                        </p>
                        <div className="flex flex-wrap gap-3">
                            <Button onClick={handleExport}>
                                📥 Exportar Datos
                            </Button>
                            <label className="btn btn-secondary cursor-pointer">
                                📤 Importar Datos
                                <input
                                    type="file"
                                    accept=".json"
                                    onChange={handleImport}
                                    className="sr-only"
                                />
                            </label>
                        </div>
                        {importError && (
                            <p className="mt-3 text-sm text-red-400">{importError}</p>
                        )}
                    </Card>

                    <Card>
                        <h3 className="text-lg font-semibold mb-4">Backup Automático</h3>
                        <div className="space-y-4">
                            <Toggle
                                label="Activar backup automático"
                                description="Guarda una copia de seguridad periódicamente"
                                checked={settings.autoBackup}
                                onChange={(checked) => handleSettingChange('autoBackup', checked)}
                            />
                            {settings.autoBackup && (
                                <Select
                                    label="Frecuencia de backup"
                                    value={settings.backupFrequency}
                                    onChange={(e) => handleSettingChange('backupFrequency', e.target.value as 'daily' | 'weekly' | 'monthly')}
                                    options={[
                                        { value: 'daily', label: 'Diario' },
                                        { value: 'weekly', label: 'Semanal' },
                                        { value: 'monthly', label: 'Mensual' },
                                    ]}
                                />
                            )}
                        </div>
                    </Card>

                    <Card>
                        <h3 className="text-lg font-semibold mb-4">Formato de Exportación</h3>
                        <Select
                            label="Formato"
                            value={settings.exportFormat}
                            onChange={(e) => handleSettingChange('exportFormat', e.target.value as 'json' | 'csv')}
                            options={[
                                { value: 'json', label: 'JSON (recomendado)' },
                                { value: 'csv', label: 'CSV' },
                            ]}
                        />
                    </Card>

                    <Card className="border-red-500/30">
                        <h3 className="text-lg font-semibold mb-4 text-red-400">Zona de Peligro</h3>
                        <p className="text-sm text-[var(--color-text-muted)] mb-4">
                            Estas acciones son irreversibles. Asegúrate de tener un backup antes de continuar.
                        </p>
                        <div className="flex flex-wrap gap-3">
                            <Button
                                variant="secondary"
                                onClick={() => setShowResetModal(true)}
                            >
                                🔄 Restablecer Configuración
                            </Button>
                            <Button
                                variant="secondary"
                                className="border-red-500/50 text-red-400 hover:bg-red-500/10"
                                onClick={() => setShowClearDataModal(true)}
                            >
                                🗑️ Borrar Todos los Datos
                            </Button>
                        </div>
                    </Card>
                </div>
            ),
        },
    ];

    return (
        <PageContainer
            title="Ajustes"
            subtitle="Configura la aplicación según tus preferencias"
        >
            <Tabs tabs={tabs} defaultTab="training" />

            {/* Modal: Reset Settings */}
            <ConfirmModal
                isOpen={showResetModal}
                onClose={() => setShowResetModal(false)}
                onConfirm={() => resetSettings()}
                title="Restablecer Configuración"
                message="¿Estás seguro de que quieres restablecer toda la configuración a los valores por defecto? Esta acción no afecta a tus datos (atletas, sesiones, etc.)."
                confirmText="Restablecer"
            />

            {/* Modal: Clear All Data */}
            <ConfirmModal
                isOpen={showClearDataModal}
                onClose={() => setShowClearDataModal(false)}
                onConfirm={() => clearAllData()}
                title="Borrar Todos los Datos"
                message="⚠️ Esta acción eliminará TODOS tus datos: atletas, sesiones, plantillas, ejercicios y configuración. Esta acción es IRREVERSIBLE."
                confirmText="Sí, borrar todo"
                isDestructive
            />
        </PageContainer>
    );
}
