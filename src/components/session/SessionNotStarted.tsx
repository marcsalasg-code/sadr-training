/**
 * SessionNotStarted - Pre-session view before starting workout
 *
 * Shows session preview with exercise list and "Start Session" button.
 * Displayed when session.status === 'planned' or 'reserved'
 */

import { useNavigate } from 'react-router-dom';

import {
    AuraPanel,
    AuraButton,
    AuraBadge,
    AuraSection,
    AuraGrid,
} from '../ui/aura';
import type { WorkoutSession, Exercise, Athlete } from '../../types/types';

// ============================================
// TYPES
// ============================================

interface SessionNotStartedProps {
    session: WorkoutSession;
    athlete?: Athlete;
    exercisesMap: Map<string, Exercise>;
    onStart: () => void;
    onEdit: () => void;
    onBack: () => void;
}

// ============================================
// COMPONENT
// ============================================

export function SessionNotStarted({
    session,
    athlete,
    exercisesMap,
    onStart,
    onEdit,
    onBack,
}: SessionNotStartedProps) {
    const navigate = useNavigate();

    // Status display
    const isReserved = session.status === 'reserved';
    const hasExercises = session.exercises.length > 0;
    const statusLabel = isReserved ? 'Reservada' : 'Planificada';

    // PHASE 12B: Strict start guard
    // Only planned sessions WITH exercises can be started
    const canStart = session.status === 'planned' && hasExercises;

    // Calculate totals
    const totalExercises = session.exercises.length;
    const totalSets = session.exercises.reduce((sum, ex) => sum + ex.sets.length, 0);
    const estimatedDuration = Math.round(totalSets * 2.5); // ~2.5 min per set

    // Navigate to edit mode in Planning
    const handleEditInPlanning = () => {
        navigate(`/planning?tab=sessions&sessionId=${session.id}&mode=edit`);
    };

    return (
        <div className="p-8 space-y-6 max-w-4xl mx-auto">
            {/* Header */}
            <AuraPanel variant="accent" corners>
                <div className="flex items-start justify-between">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <AuraBadge variant={isReserved ? 'default' : 'default'}>
                                {isReserved ? '📌' : '📋'} {statusLabel}
                            </AuraBadge>
                            {session.origin === 'plan' && (
                                <AuraBadge variant="gold">From Plan</AuraBadge>
                            )}
                            {session.origin === 'ai_suggestion' && (
                                <AuraBadge variant="default">AI Generated</AuraBadge>
                            )}
                        </div>
                        <h1 className="text-2xl font-bold text-white mb-1">
                            {session.name}
                        </h1>
                        {athlete && (
                            <p className="text-sm text-gray-400">
                                Athlete: {athlete.name}
                            </p>
                        )}
                        {session.scheduledDate && (
                            <p className="text-xs text-gray-500 mt-1 font-mono">
                                Scheduled: {new Date(session.scheduledDate).toLocaleDateString()}
                            </p>
                        )}
                    </div>
                    <div className="flex gap-2">
                        <AuraButton variant="ghost" onClick={onBack}>
                            ← Volver
                        </AuraButton>
                        <AuraButton variant="secondary" onClick={handleEditInPlanning}>
                            ✏️ Editar sesión
                        </AuraButton>
                    </div>
                </div>
            </AuraPanel>

            {/* Quick Stats */}
            <AuraGrid cols={3} gap="md">
                <AuraPanel className="text-center py-4">
                    <p className="text-2xl font-mono text-white">{totalExercises}</p>
                    <p className="text-xs text-gray-500">Exercises</p>
                </AuraPanel>
                <AuraPanel className="text-center py-4">
                    <p className="text-2xl font-mono text-white">{totalSets}</p>
                    <p className="text-xs text-gray-500">Total Sets</p>
                </AuraPanel>
                <AuraPanel className="text-center py-4">
                    <p className="text-2xl font-mono text-white">~{estimatedDuration}</p>
                    <p className="text-xs text-gray-500">Est. Minutes</p>
                </AuraPanel>
            </AuraGrid>

            {/* Exercise Preview */}
            <AuraSection
                title="Exercises"
                subtitle="Preview of today's workout"
            >
                <div className="space-y-2">
                    {session.exercises.map((ex, idx) => {
                        const exercise = exercisesMap.get(ex.exerciseId);
                        const completedSets = ex.sets.filter(s => s.isCompleted).length;
                        const totalExSets = ex.sets.length;

                        return (
                            <div
                                key={ex.id}
                                className="flex items-center justify-between p-3 bg-[#141414] rounded-lg border border-[#2A2A2A]"
                            >
                                <div className="flex items-center gap-3">
                                    <span className="text-xs font-mono text-gray-500 w-6">
                                        {idx + 1}.
                                    </span>
                                    <div>
                                        <p className="text-white font-medium">
                                            {exercise?.name || 'Unknown Exercise'}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            {totalExSets} sets
                                            {ex.sets[0]?.targetReps && ` × ${ex.sets[0].targetReps} reps`}
                                            {ex.sets[0]?.targetWeight && ` @ ${ex.sets[0].targetWeight} kg`}
                                        </p>
                                    </div>
                                </div>
                                {exercise?.muscleGroup && (
                                    <AuraBadge variant="default" size="sm">
                                        {exercise.muscleGroup}
                                    </AuraBadge>
                                )}
                            </div>
                        );
                    })}
                </div>

                {session.exercises.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                        <p>No exercises added yet.</p>
                        <AuraButton variant="secondary" onClick={onEdit} className="mt-3">
                            Add Exercises
                        </AuraButton>
                    </div>
                )}
            </AuraSection>

            {/* Session Notes */}
            {session.notes && (
                <AuraPanel
                    header={<span className="text-sm text-white">📝 Notes</span>}
                >
                    <p className="text-sm text-gray-300">{session.notes}</p>
                </AuraPanel>
            )}

            {/* PHASE 12B: Contextual guidance messages */}
            {isReserved && (
                <div className="p-4 rounded-lg bg-purple-900/20 border border-purple-500/30 text-purple-300 text-sm">
                    📌 Este slot está <strong>reservado</strong>. Añade ejercicios para planificar la sesión antes de iniciar.
                </div>
            )}
            {!isReserved && !hasExercises && (
                <div className="p-4 rounded-lg bg-amber-900/20 border border-amber-600/30 text-amber-300 text-sm">
                    ⚠️ Esta sesión no tiene ejercicios. Prepárala antes de iniciar.
                </div>
            )}

            {/* PHASE 12B: Primary CTA - conditional based on canStart */}
            <div className="sticky bottom-4 pt-4">
                {canStart ? (
                    <AuraButton
                        variant="gold"
                        size="lg"
                        fullWidth
                        onClick={onStart}
                    >
                        ▶ Start Session
                    </AuraButton>
                ) : (
                    <AuraButton
                        variant="gold"
                        size="lg"
                        fullWidth
                        onClick={handleEditInPlanning}
                    >
                        ✏️ Preparar sesión
                    </AuraButton>
                )}
            </div>
        </div>
    );
}

export default SessionNotStarted;
