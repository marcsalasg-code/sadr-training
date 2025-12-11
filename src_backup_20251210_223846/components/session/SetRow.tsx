/**
 * SetRow - Componente de fila de serie con soporte para IA
 * Incluye inputs de peso/reps, RPE/RIR/notes, y predicción de carga IA
 */

import { useState, useEffect, memo } from 'react';
import { Button } from '../ui';
import { useLoadPrediction, useAIEnabled } from '../../ai';
import type { SetEntry } from '../../types/types';

export interface SetRowProps {
    set: SetEntry;
    setIndex: number;
    weightIncrement: number;
    onComplete: (data: Partial<SetEntry>) => void;
    onRemove: () => void;
    onUncomplete: () => void;
    canRemove: boolean;
    exerciseId: string;
    exerciseName: string;
    athleteId: string;
    previousSets: SetEntry[];
    exerciseHistory: Array<{ weight: number; reps: number; date: string }>;
}

export function SetRow({
    set,
    setIndex,
    weightIncrement,
    onComplete,
    onRemove,
    onUncomplete,
    canRemove,
    exerciseId,
    exerciseName,
    athleteId,
    previousSets,
    exerciseHistory,
}: SetRowProps) {
    // Estados de inputs
    const [weight, setWeight] = useState(set.actualWeight || set.targetWeight || 0);
    const [reps, setReps] = useState(set.actualReps || set.targetReps || 0);
    const [rpe, setRpe] = useState<number | undefined>(set.rpe);
    const [rir, setRir] = useState<number | undefined>(set.rir);
    const [intensity, setIntensity] = useState<number>(set.intensity ?? set.rpe ?? 7);
    const [notes, setNotes] = useState<string>(set.notes || '');
    const [showExtras, setShowExtras] = useState(false);
    const [showCompletedNotes, setShowCompletedNotes] = useState(false);

    // AI Prediction hook
    const aiEnabled = useAIEnabled();
    const { predict, prediction, isPredicting, isEnabled: predictionEnabled } = useLoadPrediction();
    const [showPrediction, setShowPrediction] = useState(false);

    // Construir contexto de predicción (con RPE/RIR para mejor predicción futura)
    const getPredictionContext = () => {
        const lastCompleted = previousSets[previousSets.length - 1];
        return {
            exerciseId,
            exerciseName,
            athleteId,
            previousWeight: lastCompleted?.actualWeight || exerciseHistory[exerciseHistory.length - 1]?.weight,
            previousReps: lastCompleted?.actualReps || exerciseHistory[exerciseHistory.length - 1]?.reps,
            targetReps: set.targetReps,
            previousSets: previousSets.length,
            recentHistory: exerciseHistory,
            // Datos de esfuerzo para mejor predicción
            lastRpe: lastCompleted?.rpe,
            lastRir: lastCompleted?.rir,
        };
    };

    // Solicitar predicción manualmente
    const requestPrediction = () => {
        if (predictionEnabled && aiEnabled && !isPredicting) {
            predict(getPredictionContext());
        }
    };

    // Solicitar predicción automáticamente al montar (solo si hay contexto útil)
    useEffect(() => {
        if (!set.isCompleted && predictionEnabled && aiEnabled && (setIndex === 0 || previousSets.length > 0)) {
            predict(getPredictionContext());
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [setIndex, previousSets.length, predictionEnabled, aiEnabled]);

    // Aplicar sugerencia IA
    const applySuggestion = () => {
        if (prediction) {
            setWeight(prediction.suggestedWeight);
            setReps(prediction.suggestedReps);
            setShowPrediction(false);
        }
    };

    // Generar texto resumen de RPE/RIR para el toggle
    const getExtrasToggleText = (): string => {
        if (rpe && rir !== undefined) return `RPE ${rpe} | RIR ${rir}`;
        if (rpe) return `RPE ${rpe}`;
        if (rir !== undefined) return `RIR ${rir}`;
        if (notes) return '📝';
        return 'RPE/RIR';
    };

    // Handler para completar serie
    const handleComplete = () => {
        onComplete({
            actualWeight: weight,
            actualReps: reps,
            rpe: rpe ?? intensity, // Use intensity if rpe not set
            rir,
            intensity, // Always save intensity
            notes: notes.trim() || undefined,
        });
    };

    // === RENDER: Serie completada ===
    if (set.isCompleted) {
        const hasRpeRir = set.rpe !== undefined || set.rir !== undefined;
        const hasNotes = !!set.notes;

        return (
            <div className="space-y-1">
                <div className="flex items-center gap-4 p-3 rounded-lg bg-green-500/10 border border-green-500/30">
                    {/* Check icon */}
                    <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-white text-sm font-bold">
                        ✓
                    </div>

                    {/* Peso y reps */}
                    <div className="flex-1 flex items-center gap-4">
                        <span className="text-lg font-bold text-green-400">{set.actualWeight} kg</span>
                        <span className="text-lg font-bold text-green-400">{set.actualReps} reps</span>

                        {/* RPE/RIR badges */}
                        {hasRpeRir && (
                            <div className="flex items-center gap-2">
                                {set.rpe !== undefined && (
                                    <span className="px-2 py-0.5 rounded text-xs bg-[var(--color-bg-elevated)] text-[var(--color-text-secondary)]">
                                        RPE {set.rpe}
                                    </span>
                                )}
                                {set.rir !== undefined && (
                                    <span className="px-2 py-0.5 rounded text-xs bg-[var(--color-bg-elevated)] text-[var(--color-text-secondary)]">
                                        RIR {set.rir}
                                    </span>
                                )}
                            </div>
                        )}

                        {/* Notes indicator (icono discreto) */}
                        {hasNotes && (
                            <button
                                onClick={() => setShowCompletedNotes(!showCompletedNotes)}
                                className="px-2 py-0.5 rounded text-xs bg-[var(--color-bg-elevated)] text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] transition-colors"
                                title={showCompletedNotes ? 'Ocultar nota' : 'Ver nota'}
                            >
                                📝
                            </button>
                        )}
                    </div>

                    {/* Botón Undo */}
                    <button
                        onClick={onUncomplete}
                        className="w-8 h-8 rounded-full bg-[var(--color-bg-elevated)] text-[var(--color-text-muted)] hover:text-yellow-400 hover:bg-yellow-400/10 transition-colors flex items-center justify-center"
                        title="Deshacer"
                    >
                        ↩️
                    </button>
                </div>

                {/* Notas expandidas (discreto, colapsable) */}
                {showCompletedNotes && set.notes && (
                    <div className="ml-12 px-3 py-2 rounded-lg bg-[var(--color-bg-tertiary)] text-xs text-[var(--color-text-muted)] italic">
                        {set.notes}
                    </div>
                )}
            </div>
        );
    }

    // === RENDER: Serie pendiente ===
    return (
        <div className="space-y-2">
            <div className="flex items-center gap-4 p-3 rounded-lg bg-[var(--color-bg-tertiary)]">
                {/* Set number */}
                <div className="w-8 h-8 rounded-full bg-[var(--color-bg-elevated)] flex items-center justify-center text-sm font-bold text-[var(--color-text-muted)]">
                    {setIndex + 1}
                </div>

                {/* Weight input with +/- buttons */}
                <div className="flex items-center gap-1">
                    <button
                        onClick={() => setWeight(w => Math.max(0, w - weightIncrement))}
                        className="w-8 h-8 rounded bg-[var(--color-bg-elevated)] text-[var(--color-text-muted)] hover:text-white"
                    >
                        −
                    </button>
                    <input
                        type="number"
                        value={weight}
                        onChange={(e) => setWeight(Number(e.target.value))}
                        className="w-20 text-center p-2 rounded bg-[var(--color-bg-secondary)] border border-[var(--color-border-default)] text-[var(--color-accent-beige)] font-bold"
                    />
                    <button
                        onClick={() => setWeight(w => w + weightIncrement)}
                        className="w-8 h-8 rounded bg-[var(--color-bg-elevated)] text-[var(--color-text-muted)] hover:text-white"
                    >
                        +
                    </button>
                    <span className="text-xs text-[var(--color-text-muted)] ml-1">kg</span>
                </div>

                {/* Reps input */}
                <div className="flex items-center gap-1">
                    <button
                        onClick={() => setReps(r => Math.max(0, r - 1))}
                        className="w-8 h-8 rounded bg-[var(--color-bg-elevated)] text-[var(--color-text-muted)] hover:text-white"
                    >
                        −
                    </button>
                    <input
                        type="number"
                        value={reps}
                        onChange={(e) => setReps(Number(e.target.value))}
                        className="w-16 text-center p-2 rounded bg-[var(--color-bg-secondary)] border border-[var(--color-border-default)] text-[var(--color-accent-beige)] font-bold"
                    />
                    <button
                        onClick={() => setReps(r => r + 1)}
                        className="w-8 h-8 rounded bg-[var(--color-bg-elevated)] text-[var(--color-text-muted)] hover:text-white"
                    >
                        +
                    </button>
                    <span className="text-xs text-[var(--color-text-muted)] ml-1">reps</span>
                </div>

                {/* Intensity quick selector (1-10, default 7) */}
                <div className="flex items-center gap-1" title="Intensidad 1-10">
                    <button
                        onClick={() => setIntensity(i => Math.max(1, i - 1))}
                        className="w-6 h-6 rounded bg-[var(--color-bg-elevated)] text-[var(--color-text-muted)] hover:text-white text-xs"
                    >
                        −
                    </button>
                    <div
                        className={`px-2 py-1 rounded text-xs font-mono min-w-[28px] text-center ${intensity >= 9 ? 'bg-red-500/20 text-red-400' :
                            intensity >= 7 ? 'bg-[var(--color-accent-gold)]/20 text-[var(--color-accent-gold)]' :
                                intensity >= 5 ? 'bg-green-500/20 text-green-400' :
                                    'bg-[var(--color-bg-elevated)] text-[var(--color-text-muted)]'
                            }`}
                    >
                        {intensity}
                    </div>
                    <button
                        onClick={() => setIntensity(i => Math.min(10, i + 1))}
                        className="w-6 h-6 rounded bg-[var(--color-bg-elevated)] text-[var(--color-text-muted)] hover:text-white text-xs"
                    >
                        +
                    </button>
                </div>

                {/* AI Suggestion Chip - Visible automatically */}
                {predictionEnabled && aiEnabled && (
                    <>
                        {isPredicting && (
                            <div className="flex items-center gap-1 px-2 py-1 rounded text-xs bg-[var(--color-accent-gold)]/10 text-[var(--color-accent-gold)] animate-pulse">
                                <span>⏳</span>
                                <span>IA analizando...</span>
                            </div>
                        )}
                        {!isPredicting && prediction && (
                            <div className="flex items-center gap-1 px-2 py-1 rounded text-xs bg-[var(--color-accent-gold)]/20 border border-[var(--color-accent-gold)]/30">
                                <span className="text-[var(--color-accent-gold)]">💡</span>
                                <span className="text-[var(--color-accent-gold)] font-medium">
                                    {prediction.suggestedWeight}×{prediction.suggestedReps}
                                </span>
                                <button
                                    onClick={applySuggestion}
                                    className="ml-1 px-1.5 py-0.5 rounded bg-[var(--color-accent-gold)] text-black text-[10px] font-medium hover:opacity-90 transition-opacity"
                                >
                                    Aplicar
                                </button>
                                <button
                                    onClick={() => setShowPrediction(!showPrediction)}
                                    className="text-[var(--color-text-muted)] hover:text-[var(--color-accent-gold)] text-[10px]"
                                    title="Ver detalles"
                                >
                                    {showPrediction ? '▲' : '▼'}
                                </button>
                            </div>
                        )}
                        {!isPredicting && !prediction && (
                            <button
                                onClick={requestPrediction}
                                className="px-2 py-1 rounded text-xs bg-[var(--color-bg-elevated)] text-[var(--color-text-muted)] hover:text-[var(--color-accent-gold)] transition-colors"
                                title="Solicitar sugerencia IA"
                            >
                                💡
                            </button>
                        )}
                    </>
                )}

                {/* RPE/RIR/Notes toggle - UX mejorada */}
                <button
                    onClick={() => setShowExtras(!showExtras)}
                    className={`px-2 py-1 rounded text-xs transition-colors ${showExtras || rpe || rir !== undefined || notes
                        ? 'bg-[var(--color-bg-elevated)] text-[var(--color-accent-beige)]'
                        : 'bg-[var(--color-bg-elevated)] text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]'
                        }`}
                    title="RPE, RIR y notas"
                >
                    {getExtrasToggleText()}
                </button>

                {/* Complete button */}
                <Button size="sm" onClick={handleComplete}>
                    ✓
                </Button>

                {/* Delete set button */}
                {canRemove && (
                    <button
                        onClick={onRemove}
                        className="w-8 h-8 rounded-full text-[var(--color-text-muted)] hover:text-red-400 hover:bg-red-400/10 transition-colors flex items-center justify-center"
                        title="Eliminar serie"
                    >
                        🗑️
                    </button>
                )}
            </div>

            {/* RPE/RIR/Notes Panel */}
            {showExtras && (
                <div className="ml-12 p-3 rounded-lg bg-[var(--color-bg-tertiary)] border border-[var(--color-border-default)] space-y-3">
                    {/* RPE y RIR en la misma fila */}
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <label className="text-xs text-[var(--color-text-muted)]">RPE:</label>
                            <select
                                value={rpe || ''}
                                onChange={(e) => setRpe(e.target.value ? Number(e.target.value) : undefined)}
                                className="px-2 py-1 rounded bg-[var(--color-bg-secondary)] border border-[var(--color-border-default)] text-sm"
                            >
                                <option value="">-</option>
                                {[6, 6.5, 7, 7.5, 8, 8.5, 9, 9.5, 10].map(v => (
                                    <option key={v} value={v}>{v}</option>
                                ))}
                            </select>
                        </div>
                        <div className="flex items-center gap-2">
                            <label className="text-xs text-[var(--color-text-muted)]">RIR:</label>
                            <select
                                value={rir ?? ''}
                                onChange={(e) => setRir(e.target.value !== '' ? Number(e.target.value) : undefined)}
                                className="px-2 py-1 rounded bg-[var(--color-bg-secondary)] border border-[var(--color-border-default)] text-sm"
                            >
                                <option value="">-</option>
                                {[0, 1, 2, 3, 4, 5].map(v => (
                                    <option key={v} value={v}>{v}</option>
                                ))}
                            </select>
                        </div>
                        <span className="text-xs text-[var(--color-text-muted)] italic">
                            {rpe && `Esfuerzo: ${rpe >= 9 ? 'Muy alto' : rpe >= 8 ? 'Alto' : 'Moderado'}`}
                        </span>
                    </div>

                    {/* Notes textarea */}
                    <div className="space-y-1">
                        <label className="text-xs text-[var(--color-text-muted)]">Notas:</label>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Notas de la serie (opcional)..."
                            rows={2}
                            className="w-full px-3 py-2 rounded bg-[var(--color-bg-secondary)] border border-[var(--color-border-default)] text-sm resize-none placeholder:text-[var(--color-text-muted)]"
                        />
                    </div>
                </div>
            )}

            {/* AI Prediction Panel */}
            {showPrediction && prediction && (
                <div className="ml-12 p-3 rounded-lg bg-[var(--color-accent-gold)]/10 border border-[var(--color-accent-gold)]/30">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-[var(--color-accent-gold)]">🤖 Sugerencia IA</span>
                        <span className="text-xs text-[var(--color-text-muted)]">
                            Confianza: {Math.round(prediction.confidence * 100)}%
                        </span>
                    </div>
                    <div className="flex items-center gap-4 mb-2">
                        <span className="text-lg font-bold">{prediction.suggestedWeight} kg × {prediction.suggestedReps} reps</span>
                        <button
                            onClick={applySuggestion}
                            className="px-3 py-1 rounded bg-[var(--color-accent-gold)] text-black text-sm font-medium hover:opacity-90"
                        >
                            Aplicar
                        </button>
                    </div>
                    <p className="text-xs text-[var(--color-text-muted)]">{prediction.reasoning}</p>
                </div>
            )}
        </div>
    );
}

// Memoize component to prevent unnecessary re-renders (Sprint 6.3)
export default memo(SetRow);
