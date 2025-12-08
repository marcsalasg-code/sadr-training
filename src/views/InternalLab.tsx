/**
 * InternalLab - Consola interna de desarrollo y configuración
 */

import { useState, useMemo, useEffect } from 'react';
import { PageContainer } from '../components/layout';
import { Card, Button, Input, Tabs, Badge } from '../components/ui';
import { useTrainingStore, useSettings } from '../store/store';
import { useAIStore, useAISettings, useAILogs, useAITest, type ProviderType } from '../ai';
import type { LabEntry } from '../types/types';


export function InternalLab() {
    const { updateSettings, sessions, athletes, exercises, templates, clearAllData, exportData } = useTrainingStore();
    const currentSettings = useSettings();

    // AI State
    const aiSettings = useAISettings();
    const aiLogs = useAILogs();
    const { updateSettings: updateAISettings, clearLogs, initialize: initAI, setProvider, setEnabled: setAIEnabled } = useAIStore();
    const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');

    // AI Test hook
    const { runTest: runAITest, isRunning: isAITestRunning, result: aiTestResult, clearResult: clearAITestResult } = useAITest();


    // Inicializar AI al montar
    useEffect(() => {
        initAI();
    }, [initAI]);

    const [feedbackText, setFeedbackText] = useState('');
    const [feedbackType, setFeedbackType] = useState<'bug' | 'feature' | 'note'>('note');
    const [labEntries, setLabEntries] = useState<LabEntry[]>(() => {
        const stored = localStorage.getItem('sadr-lab-entries');
        return stored ? JSON.parse(stored) : [];
    });

    // Stats del sistema
    const systemStats = useMemo(() => ({
        athletes: athletes.length,
        sessions: sessions.length,
        exercises: exercises.length,
        templates: templates.length,
        completedSessions: sessions.filter(s => s.status === 'completed').length,
        totalVolume: sessions.reduce((sum, s) => sum + (s.totalVolume || 0), 0),
        storageSize: new Blob([JSON.stringify(exportData())]).size,
    }), [athletes, sessions, exercises, templates, exportData]);

    // Guardar feedback
    const handleSubmitFeedback = () => {
        if (!feedbackText.trim()) return;
        const entry: LabEntry = {
            id: crypto.randomUUID(),
            type: feedbackType,
            title: feedbackText.trim(),
            createdAt: new Date().toISOString(),
            status: 'open',
        };
        const updated = [entry, ...labEntries];
        setLabEntries(updated);
        localStorage.setItem('sadr-lab-entries', JSON.stringify(updated));
        setFeedbackText('');
    };

    const handleToggleResolved = (id: string) => {
        const updated = labEntries.map(e =>
            e.id === id
                ? { ...e, status: e.status === 'resolved' ? 'open' as const : 'resolved' as const, resolvedAt: e.status !== 'resolved' ? new Date().toISOString() : undefined }
                : e
        );
        setLabEntries(updated);
        localStorage.setItem('sadr-lab-entries', JSON.stringify(updated));
    };

    const handleDeleteEntry = (id: string) => {
        const updated = labEntries.filter(e => e.id !== id);
        setLabEntries(updated);
        localStorage.setItem('sadr-lab-entries', JSON.stringify(updated));
    };

    // Test AI Connection
    const handleTestConnection = async () => {
        setTestStatus('testing');
        try {
            const { AIEngine } = await import('../ai');
            const result = await AIEngine.testConnection();
            setTestStatus(result ? 'success' : 'error');
            setTimeout(() => setTestStatus('idle'), 3000);
        } catch {
            setTestStatus('error');
            setTimeout(() => setTestStatus('idle'), 3000);
        }
    };

    const tabs = [
        {
            id: 'ai',
            label: 'IA Engine',
            icon: '🤖',
            content: (
                <div className="space-y-6">
                    {/* Estado General */}
                    <Card>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold">Motor de IA</h3>
                            <Badge variant={aiSettings.isEnabled ? 'success' : 'default'}>
                                {aiSettings.isEnabled ? '● Activo' : '○ Inactivo'}
                            </Badge>
                        </div>

                        <div className="space-y-4">
                            {/* Toggle principal */}
                            <label className="flex items-center justify-between p-3 rounded-lg bg-[var(--color-bg-tertiary)]">
                                <div>
                                    <span className="font-medium">Habilitar IA</span>
                                    <p className="text-xs text-[var(--color-text-muted)]">Activa todas las funciones de inteligencia artificial</p>
                                </div>
                                <input
                                    type="checkbox"
                                    checked={aiSettings.isEnabled}
                                    onChange={(e) => setAIEnabled(e.target.checked)}
                                    className="toggle scale-125"
                                />
                            </label>

                            {/* Selector de Provider */}
                            <div className="p-3 rounded-lg bg-[var(--color-bg-tertiary)]">
                                <label className="block mb-2 font-medium">Provider</label>
                                <div className="flex gap-2">
                                    {(['mock', 'remote'] as ProviderType[]).map(p => (
                                        <button
                                            key={p}
                                            onClick={() => setProvider(p)}
                                            className={`flex-1 py-2 px-4 rounded-lg text-sm transition-colors ${aiSettings.provider === p
                                                ? 'bg-[var(--color-accent-gold)] text-black font-medium'
                                                : 'bg-[var(--color-bg-elevated)] hover:bg-[var(--color-bg-elevated)]/80'
                                                }`}
                                        >
                                            {p === 'mock' ? '🔧 Mock (Local)' : '☁️ Remoto (API)'}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </Card>

                    {/* Configuración Remota */}
                    {aiSettings.provider === 'remote' && (
                        <Card>
                            <h3 className="text-lg font-semibold mb-4">Configuración API Remota</h3>
                            <div className="space-y-4">
                                <Input
                                    label="URL del API"
                                    value={aiSettings.apiUrl}
                                    onChange={(e) => updateAISettings({ apiUrl: e.target.value })}
                                    placeholder="https://api.openai.com/v1/chat/completions"
                                />
                                <Input
                                    label="API Key"
                                    type="password"
                                    value={aiSettings.apiKey}
                                    onChange={(e) => updateAISettings({ apiKey: e.target.value })}
                                    placeholder="sk-..."
                                />
                                <Input
                                    label="Modelo"
                                    value={aiSettings.model}
                                    onChange={(e) => updateAISettings({ model: e.target.value })}
                                    placeholder="gpt-4o-mini"
                                />
                                <Button
                                    onClick={handleTestConnection}
                                    disabled={testStatus === 'testing' || !aiSettings.apiKey}
                                    className={testStatus === 'success' ? 'bg-green-600' : testStatus === 'error' ? 'bg-red-600' : ''}
                                >
                                    {testStatus === 'testing' ? '⏳ Probando...' :
                                        testStatus === 'success' ? '✓ Conexión OK' :
                                            testStatus === 'error' ? '✗ Error' : 'Probar Conexión'}
                                </Button>
                            </div>
                        </Card>
                    )}

                    {/* Features IA */}
                    <Card>
                        <h3 className="text-lg font-semibold mb-4">Funciones IA</h3>
                        <div className="space-y-3">
                            <label className="flex items-center justify-between p-3 rounded-lg bg-[var(--color-bg-tertiary)]">
                                <div>
                                    <span className="font-medium">📋 Generador de Plantillas</span>
                                    <p className="text-xs text-[var(--color-text-muted)]">Crear plantillas desde descripción natural</p>
                                </div>
                                <input
                                    type="checkbox"
                                    checked={aiSettings.templateGeneration}
                                    onChange={() => updateAISettings({ templateGeneration: !aiSettings.templateGeneration })}
                                    className="toggle"
                                />
                            </label>
                            <label className="flex items-center justify-between p-3 rounded-lg bg-[var(--color-bg-tertiary)]">
                                <div>
                                    <span className="font-medium">📊 Predicción de Carga</span>
                                    <p className="text-xs text-[var(--color-text-muted)]">Sugerencias de peso y repeticiones</p>
                                </div>
                                <input
                                    type="checkbox"
                                    checked={aiSettings.loadPrediction}
                                    onChange={() => updateAISettings({ loadPrediction: !aiSettings.loadPrediction })}
                                    className="toggle"
                                />
                            </label>
                            <label className="flex items-center justify-between p-3 rounded-lg bg-[var(--color-bg-tertiary)]">
                                <div>
                                    <span className="font-medium">💡 Sugerencias Automáticas</span>
                                    <p className="text-xs text-[var(--color-text-muted)]">Mostrar sugerencias proactivamente</p>
                                </div>
                                <input
                                    type="checkbox"
                                    checked={aiSettings.autoSuggestions}
                                    onChange={() => updateAISettings({ autoSuggestions: !aiSettings.autoSuggestions })}
                                    className="toggle"
                                />
                            </label>
                        </div>
                    </Card>

                    {/* Logs */}
                    <Card>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold">Logs IA ({aiLogs.length})</h3>
                            <Button variant="ghost" size="sm" onClick={clearLogs}>Limpiar</Button>
                        </div>
                        {aiLogs.length === 0 ? (
                            <p className="text-center text-[var(--color-text-muted)] py-4">Sin logs de IA</p>
                        ) : (
                            <div className="space-y-2 max-h-48 overflow-y-auto">
                                {aiLogs.slice(-20).reverse().map(log => (
                                    <div key={log.id} className={`p-2 rounded text-xs ${log.success ? 'bg-green-900/20' : 'bg-red-900/20'}`}>
                                        <div className="flex justify-between">
                                            <span className="font-mono">{log.requestType}</span>
                                            <span className="text-[var(--color-text-muted)]">
                                                {new Date(log.timestamp).toLocaleTimeString()}
                                            </span>
                                        </div>
                                        {log.details && <p className="text-[var(--color-text-muted)] mt-1">{log.details}</p>}
                                    </div>
                                ))}
                            </div>
                        )}
                    </Card>

                    {/* Test IA (Mock) */}
                    <Card>
                        <h3 className="text-lg font-semibold mb-4">🧪 Test IA (Mock)</h3>
                        <p className="text-sm text-[var(--color-text-muted)] mb-4">
                            Prueba el flujo completo: Botón → AIEngine → MockProvider → Respuesta
                        </p>

                        <div className="flex gap-2 mb-4">
                            <Button
                                onClick={runAITest}
                                disabled={isAITestRunning || !aiSettings.isEnabled}
                            >
                                {isAITestRunning ? '⏳ Ejecutando...' : '🧪 Test IA (Mock)'}
                            </Button>
                            {aiTestResult && (
                                <Button variant="ghost" size="sm" onClick={clearAITestResult}>
                                    Limpiar
                                </Button>
                            )}
                        </div>

                        {!aiSettings.isEnabled && (
                            <div className="p-3 rounded-lg bg-yellow-900/20 border border-yellow-500/30 text-yellow-400 text-sm mb-4">
                                ⚠️ La IA está desactivada. Actívala arriba para probar.
                            </div>
                        )}

                        {aiTestResult && (
                            <div className={`p-4 rounded-lg border ${aiTestResult.success
                                    ? 'bg-green-900/20 border-green-500/30'
                                    : 'bg-red-900/20 border-red-500/30'
                                }`}>
                                <div className="flex items-center justify-between mb-2">
                                    <span className={`font-bold ${aiTestResult.success ? 'text-green-400' : 'text-red-400'}`}>
                                        {aiTestResult.success ? '✅ IA mock OK' : '❌ Error'}
                                    </span>
                                    <span className="text-xs text-[var(--color-text-muted)]">
                                        {aiTestResult.duration}ms | Provider: {aiTestResult.provider || 'unknown'}
                                    </span>
                                </div>

                                {aiTestResult.success && aiTestResult.data ? (
                                    <div className="mt-2">
                                        <p className="text-xs text-[var(--color-text-muted)] mb-1">Respuesta (JSON):</p>
                                        <pre className="text-xs bg-[var(--color-bg-primary)] p-2 rounded overflow-x-auto max-h-40 overflow-y-auto">
                                            {JSON.stringify(aiTestResult.data, null, 2)}
                                        </pre>
                                    </div>
                                ) : aiTestResult.error ? (
                                    <p className="text-sm text-red-300 mt-2">{aiTestResult.error}</p>
                                ) : null}
                            </div>
                        )}
                    </Card>
                </div>
            ),
        },
        {
            id: 'params',
            label: 'Parámetros',
            icon: '⚙️',
            content: (
                <div className="space-y-6">
                    <Card>
                        <h3 className="text-lg font-semibold mb-4">Parámetros de Entrenamiento</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <Input
                                label="Descanso por defecto (seg)"
                                type="number"
                                value={currentSettings.defaultRestSeconds}
                                onChange={(e) => updateSettings({ defaultRestSeconds: Number(e.target.value) })}
                            />
                            <Input
                                label="Incremento de peso (kg)"
                                type="number"
                                step="0.5"
                                value={currentSettings.weightIncrement}
                                onChange={(e) => updateSettings({ weightIncrement: Number(e.target.value) })}
                            />
                            <Input
                                label="Peso barra (kg)"
                                type="number"
                                value={currentSettings.barbellWeight}
                                onChange={(e) => updateSettings({ barbellWeight: Number(e.target.value) })}
                            />
                        </div>
                    </Card>

                    <Card>
                        <h3 className="text-lg font-semibold mb-4">Opciones UI</h3>
                        <div className="space-y-4">
                            <label className="flex items-center justify-between">
                                <span>Auto-iniciar cronómetro de descanso</span>
                                <input
                                    type="checkbox"
                                    checked={currentSettings.autoStartRest}
                                    onChange={(e) => updateSettings({ autoStartRest: e.target.checked })}
                                    className="toggle"
                                />
                            </label>
                            <label className="flex items-center justify-between">
                                <span>Vibración al terminar descanso</span>
                                <input
                                    type="checkbox"
                                    checked={currentSettings.vibrateOnRestEnd}
                                    onChange={(e) => updateSettings({ vibrateOnRestEnd: e.target.checked })}
                                    className="toggle"
                                />
                            </label>
                            <label className="flex items-center justify-between">
                                <span>Modo compacto</span>
                                <input
                                    type="checkbox"
                                    checked={currentSettings.compactMode}
                                    onChange={(e) => updateSettings({ compactMode: e.target.checked })}
                                    className="toggle"
                                />
                            </label>
                            <label className="flex items-center justify-between">
                                <span>Mostrar RPE</span>
                                <input
                                    type="checkbox"
                                    checked={currentSettings.showRPE}
                                    onChange={(e) => updateSettings({ showRPE: e.target.checked })}
                                    className="toggle"
                                />
                            </label>
                        </div>
                    </Card>
                </div>
            ),
        },
        {
            id: 'feedback',
            label: 'Feedback',
            icon: '📝',
            content: (
                <div className="space-y-4">
                    <Card>
                        <h3 className="text-lg font-semibold mb-4">Registrar Feedback</h3>
                        <div className="space-y-4">
                            <div className="flex gap-2">
                                {(['bug', 'feature', 'note'] as const).map(type => (
                                    <button
                                        key={type}
                                        onClick={() => setFeedbackType(type)}
                                        className={`px-3 py-1 rounded-lg text-sm ${feedbackType === type
                                            ? 'bg-[var(--color-accent-gold)] text-black'
                                            : 'bg-[var(--color-bg-tertiary)]'}`}
                                    >
                                        {type === 'bug' ? '🐛 Bug' : type === 'feature' ? '✨ Feature' : '📝 Nota'}
                                    </button>
                                ))}
                            </div>
                            <textarea
                                value={feedbackText}
                                onChange={(e) => setFeedbackText(e.target.value)}
                                placeholder="Describe el bug, feature o nota..."
                                rows={3}
                                className="input resize-none"
                            />
                            <Button onClick={handleSubmitFeedback} disabled={!feedbackText.trim()}>
                                Guardar
                            </Button>
                        </div>
                    </Card>

                    <Card>
                        <h3 className="text-lg font-semibold mb-4">Historial ({labEntries.length})</h3>
                        {labEntries.length === 0 ? (
                            <p className="text-center text-[var(--color-text-muted)] py-4">Sin entradas</p>
                        ) : (
                            <div className="space-y-2 max-h-96 overflow-y-auto">
                                {labEntries.map(entry => (
                                    <div key={entry.id} className={`p-3 rounded-lg ${entry.status === 'resolved' ? 'opacity-50' : ''} bg-[var(--color-bg-tertiary)]`}>
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <Badge size="sm" variant={entry.type === 'bug' ? 'error' : entry.type === 'feature' ? 'success' : 'default'}>
                                                        {entry.type === 'bug' ? '🐛' : entry.type === 'feature' ? '✨' : '📝'} {entry.type}
                                                    </Badge>
                                                    <span className="text-xs text-[var(--color-text-muted)]">
                                                        {new Date(entry.createdAt).toLocaleDateString('es-ES')}
                                                    </span>
                                                </div>
                                                <p className="text-sm">{entry.title}</p>
                                            </div>
                                            <div className="flex gap-1">
                                                <button onClick={() => handleToggleResolved(entry.id)} className="p-1 hover:text-green-400">
                                                    {entry.status === 'resolved' ? '↩️' : '✓'}
                                                </button>
                                                <button onClick={() => handleDeleteEntry(entry.id)} className="p-1 hover:text-red-400">
                                                    🗑️
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </Card>
                </div>
            ),
        },
        {
            id: 'system',
            label: 'Sistema',
            icon: '🔧',
            content: (
                <div className="space-y-6">
                    <Card>
                        <h3 className="text-lg font-semibold mb-4">Estado del Sistema</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="text-center p-4 rounded-lg bg-[var(--color-bg-tertiary)]">
                                <p className="text-2xl font-bold text-[var(--color-accent-beige)]">{systemStats.athletes}</p>
                                <p className="text-xs text-[var(--color-text-muted)]">Atletas</p>
                            </div>
                            <div className="text-center p-4 rounded-lg bg-[var(--color-bg-tertiary)]">
                                <p className="text-2xl font-bold text-[var(--color-accent-beige)]">{systemStats.sessions}</p>
                                <p className="text-xs text-[var(--color-text-muted)]">Sesiones</p>
                            </div>
                            <div className="text-center p-4 rounded-lg bg-[var(--color-bg-tertiary)]">
                                <p className="text-2xl font-bold text-[var(--color-accent-beige)]">{systemStats.exercises}</p>
                                <p className="text-xs text-[var(--color-text-muted)]">Ejercicios</p>
                            </div>
                            <div className="text-center p-4 rounded-lg bg-[var(--color-bg-tertiary)]">
                                <p className="text-2xl font-bold text-[var(--color-accent-beige)]">{systemStats.templates}</p>
                                <p className="text-xs text-[var(--color-text-muted)]">Plantillas</p>
                            </div>
                        </div>
                    </Card>

                    <Card>
                        <h3 className="text-lg font-semibold mb-4">Almacenamiento</h3>
                        <div className="space-y-2">
                            <div className="flex justify-between">
                                <span>Tamaño de datos</span>
                                <span className="text-[var(--color-accent-beige)]">{(systemStats.storageSize / 1024).toFixed(1)} KB</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Volumen total</span>
                                <span className="text-[var(--color-accent-beige)]">{(systemStats.totalVolume / 1000).toFixed(0)}k kg</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Sesiones completadas</span>
                                <span className="text-[var(--color-accent-beige)]">{systemStats.completedSessions}</span>
                            </div>
                        </div>
                    </Card>

                    <Card className="border-red-500/30">
                        <h3 className="text-lg font-semibold mb-4 text-red-400">⚠️ Zona Peligrosa</h3>
                        <p className="text-sm text-[var(--color-text-muted)] mb-4">Estas acciones son irreversibles.</p>
                        <Button
                            className="bg-red-600 hover:bg-red-500"
                            onClick={() => {
                                if (confirm('¿Eliminar TODOS los datos?')) {
                                    clearAllData();
                                    localStorage.removeItem('sadr-lab-entries');
                                    setLabEntries([]);
                                }
                            }}
                        >
                            Borrar Todo
                        </Button>
                    </Card>
                </div>
            ),
        },
    ];

    return (
        <PageContainer title="Internal Lab" subtitle="Consola de desarrollo">
            <Tabs tabs={tabs} />
        </PageContainer>
    );
}
