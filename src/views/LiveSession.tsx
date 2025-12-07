/**
 * LiveSession - Vista de sesión en vivo
 * Registro de series en tiempo real con cronómetro de descanso
 */

import { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PageContainer } from '../components/layout';
import { Card, Button, Badge, EmptyState, Modal } from '../components/ui';
import { useTrainingStore, useSettings, useExercises } from '../store/store';
import { useRestTimer, formatTime } from '../hooks';
import type { SetEntry, ExerciseEntry } from '../types/types';

export function LiveSession() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { getSession, updateSession, getExercise } = useTrainingStore();
    const exercises = useExercises();
    const settings = useSettings();

    const session = getSession(id || '');
    const restTimer = useRestTimer(settings.defaultRestSeconds);

    const [activeExerciseIndex, setActiveExerciseIndex] = useState(0);
    const [showAddExerciseModal, setShowAddExerciseModal] = useState(false);
    const [showFinishModal, setShowFinishModal] = useState(false);
    const [sessionStartTime] = useState(() => session?.startedAt ? new Date(session.startedAt) : new Date());

    // Iniciar sesión si no está iniciada
    useEffect(() => {
        if (session && session.status === 'planned') {
            updateSession(session.id, {
                status: 'in_progress',
                startedAt: new Date().toISOString(),
            });
        }
    }, [session, updateSession]);

    // Calcular estadísticas en tiempo real
    const liveStats = useMemo(() => {
        if (!session) return { totalSets: 0, completedSets: 0, totalVolume: 0 };

        let totalSets = 0;
        let completedSets = 0;
        let totalVolume = 0;

        session.exercises.forEach(ex => {
            ex.sets.forEach(set => {
                totalSets++;
                if (set.isCompleted) {
                    completedSets++;
                    totalVolume += (set.actualWeight || 0) * (set.actualReps || 0);
                }
            });
        });

        return { totalSets, completedSets, totalVolume };
    }, [session]);

    if (!session) {
        return (
            <PageContainer title="Sesión no encontrada" subtitle="">
                <Card>
                    <EmptyState
                        icon="❌"
                        title="Sesión no encontrada"
                        description="La sesión que buscas no existe."
                        action={{ label: 'Volver a Sesiones', onClick: () => navigate('/sessions') }}
                    />
                </Card>
            </PageContainer>
        );
    }

    // Ejercicio activo
    const activeExercise = session.exercises[activeExerciseIndex];
    const exerciseInfo = activeExercise ? getExercise(activeExercise.exerciseId) : null;

    // Completar una serie
    const handleCompleteSet = (exerciseIndex: number, setIndex: number, data: Partial<SetEntry>) => {
        const updatedExercises = [...session.exercises];
        const set = updatedExercises[exerciseIndex].sets[setIndex];

        updatedExercises[exerciseIndex].sets[setIndex] = {
            ...set,
            ...data,
            isCompleted: true,
            completedAt: new Date().toISOString(),
        };

        updateSession(session.id, { exercises: updatedExercises });

        // Auto-start rest timer si está habilitado
        if (settings.autoStartRest) {
            restTimer.start(set.restSeconds || settings.defaultRestSeconds);
        }
    };

    // Añadir serie a un ejercicio
    const handleAddSet = (exerciseIndex: number) => {
        const updatedExercises = [...session.exercises];
        const exercise = updatedExercises[exerciseIndex];
        const lastSet = exercise.sets[exercise.sets.length - 1];

        const newSet: SetEntry = {
            id: crypto.randomUUID(),
            setNumber: exercise.sets.length + 1,
            type: 'working',
            targetReps: lastSet?.targetReps || 10,
            targetWeight: lastSet?.actualWeight || lastSet?.targetWeight || 0,
            restSeconds: settings.defaultRestSeconds,
            isCompleted: false,
        };

        updatedExercises[exerciseIndex].sets.push(newSet);
        updateSession(session.id, { exercises: updatedExercises });
    };

    // Añadir ejercicio
    const handleAddExercise = (exerciseId: string) => {
        const newExercise: ExerciseEntry = {
            id: crypto.randomUUID(),
            exerciseId,
            order: session.exercises.length,
            sets: [{
                id: crypto.randomUUID(),
                setNumber: 1,
                type: 'working',
                targetReps: 10,
                restSeconds: settings.defaultRestSeconds,
                isCompleted: false,
            }],
        };

        updateSession(session.id, {
            exercises: [...session.exercises, newExercise],
        });
        setShowAddExerciseModal(false);
        setActiveExerciseIndex(session.exercises.length);
    };

    // Finalizar sesión
    const handleFinishSession = () => {
        const endTime = new Date();
        const durationMinutes = Math.round((endTime.getTime() - sessionStartTime.getTime()) / 60000);

        updateSession(session.id, {
            status: 'completed',
            completedAt: endTime.toISOString(),
            durationMinutes,
            totalVolume: liveStats.totalVolume,
            totalSets: liveStats.completedSets,
            totalReps: session.exercises.reduce((sum, ex) =>
                sum + ex.sets.reduce((s, set) => s + (set.actualReps || 0), 0), 0
            ),
        });

        navigate('/sessions');
    };

    return (
        <PageContainer
            title={session.name}
            subtitle={session.status === 'in_progress' ? '🔴 En curso' : 'Sesión'}
            actions={
                <div className="flex items-center gap-3">
                    <Button variant="ghost" onClick={() => navigate('/sessions')}>
                        ← Salir
                    </Button>
                    <Button onClick={() => setShowFinishModal(true)}>
                        ✓ Finalizar
                    </Button>
                </div>
            }
        >
            {/* Stats Bar */}
            <div className="grid grid-cols-4 gap-4 mb-6">
                <Card className="text-center py-3">
                    <p className="text-2xl font-bold text-[var(--color-accent-beige)]">
                        {liveStats.completedSets}/{liveStats.totalSets}
                    </p>
                    <p className="text-xs text-[var(--color-text-muted)]">Series</p>
                </Card>
                <Card className="text-center py-3">
                    <p className="text-2xl font-bold text-[var(--color-accent-beige)]">
                        {liveStats.totalVolume.toLocaleString()}
                    </p>
                    <p className="text-xs text-[var(--color-text-muted)]">Kg Total</p>
                </Card>
                <Card className="text-center py-3">
                    <p className="text-2xl font-bold text-[var(--color-accent-beige)]">
                        {session.exercises.length}
                    </p>
                    <p className="text-xs text-[var(--color-text-muted)]">Ejercicios</p>
                </Card>
                {/* Rest Timer */}
                <Card
                    className={`text-center py-3 cursor-pointer transition-all ${restTimer.isRunning ? 'border-[var(--color-accent-gold)] shadow-[var(--shadow-glow-gold)]' : ''
                        } ${restTimer.isFinished ? 'border-green-500 bg-green-500/10' : ''}`}
                    onClick={() => restTimer.isRunning ? restTimer.pause() : restTimer.start()}
                >
                    <p className={`text-2xl font-bold font-mono ${restTimer.isFinished ? 'text-green-400' :
                        restTimer.isRunning ? 'text-[var(--color-accent-gold)]' : 'text-[var(--color-text-secondary)]'
                        }`}>
                        {formatTime(restTimer.seconds)}
                    </p>
                    <p className="text-xs text-[var(--color-text-muted)]">
                        {restTimer.isFinished ? '¡Listo!' : restTimer.isRunning ? 'Descanso' : 'Tap para iniciar'}
                    </p>
                </Card>
            </div>

            {/* Exercise Tabs */}
            {session.exercises.length > 0 && (
                <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
                    {session.exercises.map((ex, index) => {
                        const exInfo = getExercise(ex.exerciseId);
                        const completedSets = ex.sets.filter(s => s.isCompleted).length;
                        const isComplete = completedSets === ex.sets.length;

                        return (
                            <button
                                key={ex.id}
                                onClick={() => setActiveExerciseIndex(index)}
                                className={`flex-shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeExerciseIndex === index
                                    ? 'bg-[var(--color-accent-gold)] text-black'
                                    : isComplete
                                        ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                                        : 'bg-[var(--color-bg-elevated)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)]'
                                    }`}
                            >
                                {exInfo?.name || `Ejercicio ${index + 1}`}
                                <span className="ml-2 text-xs opacity-70">
                                    {completedSets}/{ex.sets.length}
                                </span>
                            </button>
                        );
                    })}
                    <button
                        onClick={() => setShowAddExerciseModal(true)}
                        className="flex-shrink-0 px-4 py-2 rounded-lg text-sm font-medium bg-[var(--color-bg-elevated)] text-[var(--color-text-muted)] hover:text-[var(--color-accent-gold)] border border-dashed border-[var(--color-border-default)]"
                    >
                        + Añadir
                    </button>
                </div>
            )}

            {/* Active Exercise */}
            {activeExercise ? (
                <Card>
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h3 className="text-xl font-bold">{exerciseInfo?.name || 'Ejercicio'}</h3>
                            {exerciseInfo?.muscleGroups && (
                                <div className="flex gap-2 mt-1">
                                    {exerciseInfo.muscleGroups.map(mg => (
                                        <Badge key={mg} size="sm">{mg}</Badge>
                                    ))}
                                </div>
                            )}
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => handleAddSet(activeExerciseIndex)}>
                            + Serie
                        </Button>
                    </div>

                    {/* Sets Table */}
                    <div className="space-y-2">
                        {activeExercise.sets.map((set, setIndex) => (
                            <SetRow
                                key={set.id}
                                set={set}
                                setIndex={setIndex}
                                weightIncrement={settings.weightIncrement}
                                onComplete={(data) => handleCompleteSet(activeExerciseIndex, setIndex, data)}
                            />
                        ))}
                    </div>
                </Card>
            ) : (
                <Card>
                    <EmptyState
                        icon="🏋️"
                        title="Sin ejercicios"
                        description="Añade ejercicios a esta sesión para comenzar."
                        action={{
                            label: 'Añadir Ejercicio',
                            onClick: () => setShowAddExerciseModal(true),
                        }}
                    />
                </Card>
            )}

            {/* Modal: Add Exercise */}
            <Modal
                isOpen={showAddExerciseModal}
                onClose={() => setShowAddExerciseModal(false)}
                title="Añadir Ejercicio"
                size="md"
            >
                {exercises.length === 0 ? (
                    <EmptyState
                        icon="📋"
                        title="Sin ejercicios"
                        description="No hay ejercicios en la base de datos. Ve a configuración para añadir algunos."
                    />
                ) : (
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                        {exercises.map(ex => (
                            <button
                                key={ex.id}
                                onClick={() => handleAddExercise(ex.id)}
                                className="w-full text-left p-3 rounded-lg bg-[var(--color-bg-tertiary)] hover:bg-[var(--color-bg-elevated)] transition-colors"
                            >
                                <p className="font-medium">{ex.name}</p>
                                <p className="text-sm text-[var(--color-text-muted)]">
                                    {ex.muscleGroups.join(', ')}
                                </p>
                            </button>
                        ))}
                    </div>
                )}
            </Modal>

            {/* Modal: Finish Session */}
            <Modal
                isOpen={showFinishModal}
                onClose={() => setShowFinishModal(false)}
                title="Finalizar Sesión"
                size="sm"
                footer={
                    <>
                        <Button variant="ghost" onClick={() => setShowFinishModal(false)}>
                            Continuar
                        </Button>
                        <Button onClick={handleFinishSession}>
                            Finalizar
                        </Button>
                    </>
                }
            >
                <div className="space-y-4">
                    <p className="text-[var(--color-text-secondary)]">
                        ¿Finalizar la sesión?
                    </p>
                    <div className="grid grid-cols-2 gap-4 p-4 rounded-lg bg-[var(--color-bg-tertiary)]">
                        <div className="text-center">
                            <p className="text-xl font-bold text-[var(--color-accent-beige)]">
                                {liveStats.completedSets}
                            </p>
                            <p className="text-xs text-[var(--color-text-muted)]">Series</p>
                        </div>
                        <div className="text-center">
                            <p className="text-xl font-bold text-[var(--color-accent-beige)]">
                                {liveStats.totalVolume.toLocaleString()} kg
                            </p>
                            <p className="text-xs text-[var(--color-text-muted)]">Volumen</p>
                        </div>
                    </div>
                </div>
            </Modal>
        </PageContainer>
    );
}

// Componente: Set Row
interface SetRowProps {
    set: SetEntry;
    setIndex: number;
    weightIncrement: number;
    onComplete: (data: Partial<SetEntry>) => void;
}

function SetRow({ set, setIndex, weightIncrement, onComplete }: SetRowProps) {
    const [weight, setWeight] = useState(set.actualWeight || set.targetWeight || 0);
    const [reps, setReps] = useState(set.actualReps || set.targetReps || 0);

    if (set.isCompleted) {
        return (
            <div className="flex items-center gap-4 p-3 rounded-lg bg-green-500/10 border border-green-500/30">
                <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-white text-sm font-bold">
                    ✓
                </div>
                <div className="flex-1 grid grid-cols-2 gap-4">
                    <div>
                        <span className="text-lg font-bold text-green-400">{set.actualWeight} kg</span>
                    </div>
                    <div>
                        <span className="text-lg font-bold text-green-400">{set.actualReps} reps</span>
                    </div>
                </div>
            </div>
        );
    }

    return (
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

            {/* Complete button */}
            <Button
                size="sm"
                onClick={() => onComplete({ actualWeight: weight, actualReps: reps })}
            >
                ✓
            </Button>
        </div>
    );
}
