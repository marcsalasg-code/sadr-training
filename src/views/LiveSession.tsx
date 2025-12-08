/**
 * LiveSession - Vista de sesión en vivo
 * Registro de series en tiempo real con cronómetro de descanso
 * Incluye sugerencias de carga IA
 */

import { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PageContainer } from '../components/layout';
import { Card, Button, Badge, Modal, EmptyState } from '../components/ui';
import { SetRow, AddExerciseModal } from '../components/session';
import { useTrainingStore, useSettings, useExercises, useSessions } from '../store/store';
import { useRestTimer, formatTime } from '../hooks';
import type { SetEntry, ExerciseEntry } from '../types/types';

export function LiveSession() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { getSession, updateSession, getExercise, addExercise } = useTrainingStore();
    const exercises = useExercises();
    const allSessions = useSessions();
    const settings = useSettings();

    const session = getSession(id || '');
    const restTimer = useRestTimer(settings.defaultRestSeconds);

    const [activeExerciseIndex, setActiveExerciseIndex] = useState(0);
    const [showAddExerciseModal, setShowAddExerciseModal] = useState(false);
    const [showFinishModal, setShowFinishModal] = useState(false);
    const [showRemoveExerciseModal, setShowRemoveExerciseModal] = useState(false);
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [showExitModal, setShowExitModal] = useState(false);
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

    // Historial del ejercicio actual para predicciones IA
    const exerciseHistory = useMemo(() => {
        if (!session) return [];
        const activeExercise = session.exercises[activeExerciseIndex];
        if (!activeExercise) return [];

        // Buscar sets completados anteriormente para este ejercicio
        const history: Array<{ weight: number; reps: number; date: string }> = [];

        allSessions
            .filter(s => s.id !== session.id && s.athleteId === session.athleteId && s.status === 'completed')
            .forEach(s => {
                s.exercises.forEach(ex => {
                    if (ex.exerciseId === activeExercise.exerciseId) {
                        ex.sets.filter(set => set.isCompleted).forEach(set => {
                            history.push({
                                weight: set.actualWeight || 0,
                                reps: set.actualReps || 0,
                                date: s.completedAt || s.createdAt,
                            });
                        });
                    }
                });
            });

        return history.slice(-10); // Últimos 10 sets
    }, [session, activeExerciseIndex, allSessions]);

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

    // Eliminar serie de un ejercicio
    const handleRemoveSet = (exerciseIndex: number, setIndex: number) => {
        const updatedExercises = [...session.exercises];
        const exercise = updatedExercises[exerciseIndex];

        // No permitir eliminar la última serie
        if (exercise.sets.length <= 1) return;

        // Filtrar la serie y renumerar
        exercise.sets = exercise.sets
            .filter((_, i) => i !== setIndex)
            .map((set, i) => ({ ...set, setNumber: i + 1 }));

        updateSession(session.id, { exercises: updatedExercises });
    };

    // Desmarcar serie completada (undo)
    const handleUncompleteSet = (exerciseIndex: number, setIndex: number) => {
        const updatedExercises = [...session.exercises];
        updatedExercises[exerciseIndex].sets[setIndex] = {
            ...updatedExercises[exerciseIndex].sets[setIndex],
            isCompleted: false,
            completedAt: undefined,
            actualWeight: undefined,
            actualReps: undefined,
        };
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

    // Eliminar ejercicio de la sesión
    const handleRemoveExercise = (exerciseIndex: number) => {
        const updatedExercises = session.exercises
            .filter((_, i) => i !== exerciseIndex)
            .map((ex, i) => ({ ...ex, order: i }));

        updateSession(session.id, { exercises: updatedExercises });

        // Ajustar índice activo
        if (exerciseIndex <= activeExerciseIndex && activeExerciseIndex > 0) {
            setActiveExerciseIndex(prev => prev - 1);
        } else if (updatedExercises.length === 0) {
            setActiveExerciseIndex(0);
        }

        setShowRemoveExerciseModal(false);
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

    // Cancelar sesión
    const handleCancelSession = () => {
        updateSession(session.id, { status: 'cancelled' });
        navigate('/sessions');
    };

    // Salir con confirmación
    const handleExitClick = () => {
        if (session.status === 'in_progress' && liveStats.completedSets > 0) {
            setShowExitModal(true);
        } else {
            navigate('/sessions');
        }
    };

    return (
        <PageContainer
            title={session.name}
            subtitle={session.status === 'in_progress' ? '🔴 En curso' : 'Sesión'}
            actions={
                <div className="flex items-center gap-3">
                    <Button variant="ghost" onClick={handleExitClick}>
                        ← Salir
                    </Button>
                    {session.status === 'in_progress' && (
                        <Button
                            variant="ghost"
                            className="text-red-400 hover:bg-red-400/10"
                            onClick={() => setShowCancelModal(true)}
                        >
                            ✕ Cancelar
                        </Button>
                    )}
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
                        <div className="flex items-center gap-2">
                            <Button variant="ghost" size="sm" onClick={() => handleAddSet(activeExerciseIndex)}>
                                + Serie
                            </Button>
                            {session.exercises.length > 1 && (
                                <button
                                    onClick={() => setShowRemoveExerciseModal(true)}
                                    className="p-2 rounded-lg text-[var(--color-text-muted)] hover:text-red-400 hover:bg-red-400/10 transition-colors"
                                    title="Quitar ejercicio de la sesión"
                                >
                                    🗑️
                                </button>
                            )}
                        </div>
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
                                onRemove={() => handleRemoveSet(activeExerciseIndex, setIndex)}
                                onUncomplete={() => handleUncompleteSet(activeExerciseIndex, setIndex)}
                                canRemove={activeExercise.sets.length > 1}
                                exerciseId={activeExercise.exerciseId}
                                exerciseName={exerciseInfo?.name || 'Ejercicio'}
                                athleteId={session.athleteId}
                                previousSets={activeExercise.sets.slice(0, setIndex).filter(s => s.isCompleted)}
                                exerciseHistory={exerciseHistory}
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
            <AddExerciseModal
                isOpen={showAddExerciseModal}
                onClose={() => setShowAddExerciseModal(false)}
                exercises={exercises}
                session={session}
                onAddExercise={handleAddExercise}
                onCreateExercise={addExercise}
                getExercise={getExercise}
            />

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

            {/* Modal: Remove Exercise Confirmation */}
            <Modal
                isOpen={showRemoveExerciseModal}
                onClose={() => setShowRemoveExerciseModal(false)}
                title="Quitar Ejercicio"
                size="sm"
                footer={
                    <>
                        <Button variant="ghost" onClick={() => setShowRemoveExerciseModal(false)}>
                            Cancelar
                        </Button>
                        <Button
                            className="bg-red-600 hover:bg-red-700"
                            onClick={() => handleRemoveExercise(activeExerciseIndex)}
                        >
                            Quitar
                        </Button>
                    </>
                }
            >
                <p className="text-[var(--color-text-secondary)]">
                    ¿Quitar el ejercicio <strong>{exerciseInfo?.name || 'seleccionado'}</strong> de esta sesión?
                </p>
                <p className="text-sm text-[var(--color-text-muted)] mt-2">
                    Se eliminarán todas las series de este ejercicio.
                </p>
            </Modal>

            {/* Modal: Cancel Session Confirmation */}
            <Modal
                isOpen={showCancelModal}
                onClose={() => setShowCancelModal(false)}
                title="Cancelar Sesión"
                size="sm"
                footer={
                    <>
                        <Button variant="ghost" onClick={() => setShowCancelModal(false)}>
                            Volver
                        </Button>
                        <Button
                            className="bg-red-600 hover:bg-red-700"
                            onClick={handleCancelSession}
                        >
                            Sí, cancelar sesión
                        </Button>
                    </>
                }
            >
                <p className="text-[var(--color-text-secondary)]">
                    ¿Cancelar la sesión <strong>"{session.name}"</strong>?
                </p>
                <p className="text-sm text-[var(--color-text-muted)] mt-2">
                    La sesión se marcará como cancelada. Podrás verla en el historial pero no contará para estadísticas.
                </p>
            </Modal>

            {/* Modal: Exit Confirmation */}
            <Modal
                isOpen={showExitModal}
                onClose={() => setShowExitModal(false)}
                title="Salir de la Sesión"
                size="sm"
                footer={
                    <>
                        <Button variant="ghost" onClick={() => setShowExitModal(false)}>
                            Continuar entrenando
                        </Button>
                        <Button onClick={() => navigate('/sessions')}>
                            Salir sin finalizar
                        </Button>
                    </>
                }
            >
                <p className="text-[var(--color-text-secondary)]">
                    Tienes <strong>{liveStats.completedSets} series</strong> completadas sin finalizar.
                </p>
                <p className="text-sm text-[var(--color-text-muted)] mt-2">
                    Si sales, la sesión permanecerá en estado "en curso". Puedes volver a entrar después.
                </p>
            </Modal>
        </PageContainer>
    );
}
