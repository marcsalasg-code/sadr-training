/**
 * OneRMSection.tsx - Sección de gestión de 1RM para AthleteDetail
 * 
 * Muestra 1RM por ejercicio con:
 * - Valor editable (control del usuario)
 * - Botón "Estimar desde historial"
 * - Botón "Ver recomendación IA"
 * - Indicador de source (manual/estimated/ai)
 * 
 * IMPORTANTE: El usuario SIEMPRE tiene control. 
 * Los botones solo sugieren, nunca auto-aplican.
 */

import { useState, useMemo } from 'react';
import { AuraPanel, AuraBadge, AuraButton, AuraDivider } from '../ui/aura';
import { Input } from '../ui';
import {
    estimateOneRM,
    createOneRMRecord,
    updateOneRMRecord,
} from '../../utils';
import { analyzeOneRMProgression } from '../../ai/engines/oneRMEngine';
import type { Athlete, Exercise, WorkoutSession } from '../../types/types';

interface OneRMSectionProps {
    athlete: Athlete;
    exercises: Exercise[];
    sessions: WorkoutSession[];
    onUpdateAthlete: (id: string, updates: Partial<Athlete>) => void;
}

export function OneRMSection({
    athlete,
    exercises,
    sessions,
    onUpdateAthlete
}: OneRMSectionProps) {
    const [editingExerciseId, setEditingExerciseId] = useState<string | null>(null);
    const [editValue, setEditValue] = useState<string>('');
    const [showRecommendation, setShowRecommendation] = useState<string | null>(null);

    const oneRMRecords = athlete.oneRMRecords || {};

    // Get exercises that have been trained by this athlete
    const trainedExercises = useMemo(() => {
        const exerciseIds = new Set<string>();
        sessions
            .filter(s => s.athleteId === athlete.id && s.status === 'completed')
            .forEach(session => {
                session.exercises.forEach(entry => {
                    if (entry.sets.some(s => s.isCompleted && s.actualWeight && s.actualReps)) {
                        exerciseIds.add(entry.exerciseId);
                    }
                });
            });
        return exercises.filter(ex => exerciseIds.has(ex.id));
    }, [sessions, exercises, athlete.id]);

    // Get recent sets for an exercise
    const getRecentSets = (exerciseId: string) => {
        const allSets: any[] = [];
        sessions
            .filter(s => s.athleteId === athlete.id && s.status === 'completed')
            .sort((a, b) => new Date(b.completedAt || '').getTime() - new Date(a.completedAt || '').getTime())
            .slice(0, 5) // Last 5 sessions
            .forEach(session => {
                const entry = session.exercises.find(e => e.exerciseId === exerciseId);
                if (entry) {
                    allSets.push(...entry.sets.filter(s => s.isCompleted));
                }
            });
        return allSets;
    };

    // Estimate 1RM from history
    const estimateFromHistory = (exerciseId: string) => {
        const recentSets = getRecentSets(exerciseId);
        if (recentSets.length === 0) return null;

        // Find best set (highest estimated 1RM)
        let best = 0;
        recentSets.forEach(set => {
            if (set.actualWeight && set.actualReps && set.actualReps <= 10) {
                const estimated = estimateOneRM(set.actualWeight, set.actualReps);
                if (estimated > best) best = estimated;
            }
        });
        return best > 0 ? best : null;
    };

    // Get AI recommendation for an exercise
    const getRecommendation = (exerciseId: string) => {
        const record = oneRMRecords[exerciseId];
        const recentSets = getRecentSets(exerciseId);
        const exercise = exercises.find(e => e.id === exerciseId);

        return analyzeOneRMProgression({
            exerciseId,
            exerciseName: exercise?.name,
            currentRecord: record,
            recentSets,
            strengthFocusSessions: record?.strengthFocusSessions || 0,
            athleteWeightKg: athlete.currentWeightKg,
            isBodyweight: exercise?.isBodyweight,
        });
    };

    // Save 1RM value
    const saveOneRM = (exerciseId: string, value: number, source: 'manual' | 'estimated' | 'ai_suggested') => {
        const currentRecord = oneRMRecords[exerciseId];
        const newRecord = currentRecord
            ? updateOneRMRecord(currentRecord, value, source)
            : createOneRMRecord(exerciseId, value, source);

        onUpdateAthlete(athlete.id, {
            oneRMRecords: {
                ...oneRMRecords,
                [exerciseId]: newRecord,
            },
        });

        setEditingExerciseId(null);
        setShowRecommendation(null);
    };

    // Start editing
    const startEditing = (exerciseId: string, currentValue?: number) => {
        setEditingExerciseId(exerciseId);
        setEditValue(currentValue?.toString() || '');
    };

    // Get source badge variant
    const getSourceVariant = (source?: string): 'gold' | 'default' | 'success' => {
        switch (source) {
            case 'manual': return 'gold';
            case 'ai_suggested': return 'success';
            default: return 'default';
        }
    };

    const getSourceLabel = (source?: string): string => {
        switch (source) {
            case 'manual': return 'Manual';
            case 'estimated': return 'Estimado';
            case 'ai_suggested': return 'IA';
            default: return '';
        }
    };

    return (
        <AuraPanel
            header={
                <div className="flex items-center justify-between w-full">
                    <span className="text-white text-sm font-medium">🏋️ 1RM por Ejercicio</span>
                    <span className="text-xs text-gray-500">
                        {Object.keys(oneRMRecords).length} registrados
                    </span>
                </div>
            }
        >
            {trainedExercises.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">
                    No hay ejercicios entrenados aún. Completa algunas sesiones para gestionar tus 1RM.
                </p>
            ) : (
                <div className="space-y-3">
                    {trainedExercises.map(exercise => {
                        const record = oneRMRecords[exercise.id];
                        const isEditing = editingExerciseId === exercise.id;
                        const recommendation = showRecommendation === exercise.id
                            ? getRecommendation(exercise.id)
                            : null;

                        return (
                            <div key={exercise.id}>
                                <div className="flex items-center justify-between p-3 rounded-lg bg-[#141414] group">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm text-white font-medium">
                                                {exercise.name}
                                            </span>
                                            {exercise.isBodyweight && (
                                                <AuraBadge variant="muted" size="sm">BW</AuraBadge>
                                            )}
                                            {record?.source && (
                                                <AuraBadge variant={getSourceVariant(record.source)} size="sm">
                                                    {getSourceLabel(record.source)}
                                                </AuraBadge>
                                            )}
                                        </div>
                                        {record?.lastUpdate && (
                                            <p className="text-xs text-gray-500 mt-0.5">
                                                Actualizado: {new Date(record.lastUpdate).toLocaleDateString()}
                                            </p>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-2">
                                        {isEditing ? (
                                            <>
                                                <Input
                                                    type="number"
                                                    value={editValue}
                                                    onChange={(e) => setEditValue(e.target.value)}
                                                    className="w-20 text-center"
                                                    autoFocus
                                                />
                                                <span className="text-xs text-gray-500">kg</span>
                                                <AuraButton
                                                    size="sm"
                                                    variant="gold"
                                                    onClick={() => {
                                                        const val = parseFloat(editValue);
                                                        if (val > 0) saveOneRM(exercise.id, val, 'manual');
                                                    }}
                                                >
                                                    ✓
                                                </AuraButton>
                                                <AuraButton
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => setEditingExerciseId(null)}
                                                >
                                                    ✕
                                                </AuraButton>
                                            </>
                                        ) : (
                                            <>
                                                <span
                                                    className="text-lg font-mono text-[var(--color-accent-gold)] cursor-pointer hover:underline"
                                                    onClick={() => startEditing(exercise.id, record?.currentOneRM)}
                                                    title="Clic para editar"
                                                >
                                                    {record?.currentOneRM || '-'} kg
                                                </span>

                                                {/* Quick actions */}
                                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button
                                                        onClick={() => {
                                                            const estimated = estimateFromHistory(exercise.id);
                                                            if (estimated) {
                                                                if (confirm(`Estimación: ${estimated}kg\n\n¿Usar como tu 1RM?`)) {
                                                                    saveOneRM(exercise.id, estimated, 'estimated');
                                                                }
                                                            } else {
                                                                alert('No hay suficientes datos para estimar.');
                                                            }
                                                        }}
                                                        className="p-1 rounded text-xs hover:bg-[var(--color-bg-elevated)] text-gray-400 hover:text-white"
                                                        title="Estimar desde historial"
                                                    >
                                                        📊
                                                    </button>
                                                    <button
                                                        onClick={() => setShowRecommendation(
                                                            showRecommendation === exercise.id ? null : exercise.id
                                                        )}
                                                        className="p-1 rounded text-xs hover:bg-[var(--color-bg-elevated)] text-gray-400 hover:text-[var(--color-accent-gold)]"
                                                        title="Ver recomendación IA"
                                                    >
                                                        🤖
                                                    </button>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>

                                {/* AI Recommendation panel */}
                                {recommendation && (
                                    <div className="mt-2 p-3 rounded-lg bg-[var(--color-accent-gold)]/10 border border-[var(--color-accent-gold)]/30">
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <p className="text-xs text-[var(--color-accent-gold)] font-medium mb-1">
                                                    Recomendación IA
                                                </p>
                                                <p className="text-sm text-white">
                                                    {recommendation.action === 'set_initial' && (
                                                        <>Establecer 1RM inicial: <strong>{recommendation.suggestedOneRM}kg</strong></>
                                                    )}
                                                    {recommendation.action === 'increase' && (
                                                        <>Subir de {recommendation.currentOneRM}kg a <strong>{recommendation.suggestedOneRM}kg</strong> (+{recommendation.changeAbsolute}kg)</>
                                                    )}
                                                    {recommendation.action === 'decrease' && (
                                                        <>Bajar de {recommendation.currentOneRM}kg a <strong>{recommendation.suggestedOneRM}kg</strong> ({recommendation.changeAbsolute}kg)</>
                                                    )}
                                                    {recommendation.action === 'keep' && (
                                                        <>Mantener en <strong>{recommendation.currentOneRM || recommendation.suggestedOneRM}kg</strong></>
                                                    )}
                                                </p>
                                                <p className="text-xs text-gray-400 mt-1">
                                                    {recommendation.rationale}
                                                </p>
                                            </div>
                                            {recommendation.action !== 'keep' && (
                                                <AuraButton
                                                    size="sm"
                                                    variant="gold"
                                                    onClick={() => saveOneRM(
                                                        exercise.id,
                                                        recommendation.suggestedOneRM,
                                                        'ai_suggested'
                                                    )}
                                                >
                                                    Aplicar
                                                </AuraButton>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            <AuraDivider className="my-4" />
            <p className="text-xs text-gray-500 text-center">
                💡 El 1RM siempre lo controlas tú. Las sugerencias requieren tu confirmación.
            </p>
        </AuraPanel>
    );
}

export default OneRMSection;
