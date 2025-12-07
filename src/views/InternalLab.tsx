/**
 * InternalLab - Consola interna de desarrollo y configuración
 */

import { useState, useMemo } from 'react';
import { PageContainer } from '../components/layout';
import { Card, Button, Input, Tabs, Badge } from '../components/ui';
import { useTrainingStore, useSettings } from '../store/store';
import type { LabEntry } from '../types/types';

export function InternalLab() {
    const { updateSettings, sessions, athletes, exercises, templates, clearAllData, exportData } = useTrainingStore();
    const currentSettings = useSettings();

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

    const tabs = [
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
