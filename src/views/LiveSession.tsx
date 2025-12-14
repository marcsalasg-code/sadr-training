/**
 * LiveSession - Vista de sesión en vivo
 * 
 * REFACTORED: Container component using extracted section components
 * Original: 539 lines → Now: ~350 lines
 * 
 * PHASE 1: Added state-based rendering:
 * - 'planned' → SessionNotStarted (pre-session view)
 * - 'in_progress' → Full workout UI (default)
 * - 'completed' → SessionCompletedSummary (post-session view)
 */

import { useMemo } from 'react';
import { Modal } from '../components/ui';
import {
    AuraPanel,
    AuraButton,
    AuraBadge,
    AuraEmptyState,
} from '../components/ui/aura';
import {
    SetRow,
    AddExerciseModal,
    FatiguePrompt,
    LiveSessionHeader,
    LiveSessionStats,
    ExerciseTabs,
    SessionNotStarted,
    SessionCompletedSummary,
    SessionTimeline,
} from '../components/session';
import { OneRMHint } from '../components/common/OneRMHint';
import { LoadSuggestion } from '../components/common/LoadSuggestion';
import { useTrainingStore, useSettings, useExercises } from '../store/store';
import { useLiveSession } from '../hooks';
import { useParams, useNavigate } from 'react-router-dom';

export function LiveSession() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { addExercise, getAthlete } = useTrainingStore();
    const exercises = useExercises();
    const settings = useSettings();

    const {
        session,
        activeExercise,
        exerciseInfo,
        liveStats,
        exerciseHistory,
        isMultiAthlete,
        sessionAthletes,
        activeAthleteId,
        setActiveAthleteId,
        activeExerciseIndex,
        setActiveExerciseIndex,
        showFatiguePrompt,
        showAddExerciseModal,
        setShowAddExerciseModal,
        showFinishModal,
        setShowFinishModal,
        showRemoveExerciseModal,
        setShowRemoveExerciseModal,
        showCancelModal,
        setShowCancelModal,
        showExitModal,
        setShowExitModal,
        restTimer,
        handleCompleteSet,
        handleAddSet,
        handleRemoveSet,
        handleUncompleteSet,
        handleAddExercise,
        handleRemoveExercise,
        handleStartSession,
        handleFinishSession,
        handleCancelSession,
        handleExitClick,
        handleFatigueConfirm,
        handleFatigueSkip,
        getExercise,
    } = useLiveSession(id);

    // Create exercises map for sub-components
    const exercisesMap = useMemo(() => {
        const map = new Map<string, (typeof exercises)[0]>();
        exercises.forEach(ex => map.set(ex.id, ex));
        return map;
    }, [exercises]);

    if (!session) {
        return (
            <div className="p-8 max-w-6xl mx-auto">
                <AuraPanel>
                    <AuraEmptyState
                        icon="❌"
                        title="Session not found"
                        description="The session you're looking for doesn't exist."
                        action={{ label: 'Back to Sessions', onClick: () => navigate('/sessions') }}
                    />
                </AuraPanel>
            </div>
        );
    }

    const athlete = getAthlete(session.athleteId);

    // ============================================
    // PHASE 1: State-based rendering
    // ============================================

    // Planned or reserved session → Show pre-session view
    if (session.status === 'planned' || session.status === 'reserved') {
        return (
            <SessionNotStarted
                session={session}
                athlete={athlete}
                exercisesMap={exercisesMap}
                onStart={handleStartSession}
                onEdit={() => navigate(`/planning?tab=sessions&sessionId=${session.id}&mode=edit`)}
                onBack={() => navigate('/sessions')}
            />
        );
    }

    // Completed session → Show summary view
    if (session.status === 'completed') {
        return (
            <SessionCompletedSummary
                session={session}
                athlete={athlete}
                exercisesMap={exercisesMap}
                onBackToDashboard={() => navigate('/')}
                onViewCalendar={() => navigate('/calendar')}
            />
        );
    }

    // ============================================
    // In-progress session → Full workout UI
    // ============================================

    // Handler for timeline navigation
    const handleTimelineSelect = (exerciseId: string, index: number) => {
        setActiveExerciseIndex(index);
    };

    return (
        <div className="p-8 space-y-6 max-w-6xl mx-auto">
            {/* Header */}
            <LiveSessionHeader
                sessionName={session.name}
                sessionStatus={session.status}
                isMultiAthlete={isMultiAthlete}
                sessionAthletes={sessionAthletes}
                activeAthleteId={activeAthleteId}
                onAthleteChange={setActiveAthleteId}
                onExit={handleExitClick}
                onCancel={() => setShowCancelModal(true)}
                onFinish={() => setShowFinishModal(true)}
            />

            {/* Pre-Session Fatigue Prompt */}
            {showFatiguePrompt && (
                <FatiguePrompt
                    onConfirm={handleFatigueConfirm}
                    onSkip={handleFatigueSkip}
                />
            )}

            {/* Stats Bar */}
            <LiveSessionStats
                stats={liveStats}
                exerciseCount={session.exercises.length}
                restTimer={restTimer}
            />

            {/* PHASE 1 + 2: Session Timeline - Visual exercise navigation with block grouping */}
            <AuraPanel
                header={
                    <span className="text-sm text-white font-medium">📋 Session Progress</span>
                }
            >
                <SessionTimeline
                    exercises={session.exercises}
                    activeExerciseId={activeExercise?.id}
                    onSelectExercise={handleTimelineSelect}
                    exercisesMap={exercisesMap}
                    structure={session.structure}
                />
            </AuraPanel>

            {/* Exercise Tabs (legacy navigation - kept for compatibility) */}
            <ExerciseTabs
                exercises={session.exercises}
                activeExerciseIndex={activeExerciseIndex}
                onSelectExercise={setActiveExerciseIndex}
                onAddExercise={() => setShowAddExerciseModal(true)}
                getExerciseInfo={getExercise}
            />

            {/* Active Exercise Panel */}
            {activeExercise ? (
                <AuraPanel
                    header={
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                {/* Navigation */}
                                <button
                                    onClick={() => setActiveExerciseIndex(Math.max(0, activeExerciseIndex - 1))}
                                    disabled={activeExerciseIndex === 0}
                                    className={`p-1.5 rounded transition-colors ${activeExerciseIndex === 0
                                        ? 'text-gray-600 cursor-not-allowed'
                                        : 'text-gray-400 hover:text-white hover:bg-[var(--color-bg-elevated)]'
                                        }`}
                                >
                                    ◀
                                </button>
                                <div>
                                    <span className="text-lg text-white font-medium">
                                        {exerciseInfo?.name || 'Exercise'}
                                    </span>
                                    <span className="text-xs text-gray-500 ml-2">
                                        {activeExerciseIndex + 1}/{session.exercises.length}
                                    </span>
                                    {exerciseInfo?.muscleGroup && (
                                        <div className="flex gap-2 mt-1">
                                            <AuraBadge size="sm" variant="muted">{exerciseInfo.muscleGroup}</AuraBadge>
                                            {exerciseInfo.pattern && exerciseInfo.pattern !== 'other' && (
                                                <AuraBadge size="sm" variant="muted">{exerciseInfo.pattern}</AuraBadge>
                                            )}
                                        </div>
                                    )}
                                </div>
                                <button
                                    onClick={() => setActiveExerciseIndex(Math.min(session.exercises.length - 1, activeExerciseIndex + 1))}
                                    disabled={activeExerciseIndex >= session.exercises.length - 1}
                                    className={`p-1.5 rounded transition-colors ${activeExerciseIndex >= session.exercises.length - 1
                                        ? 'text-gray-600 cursor-not-allowed'
                                        : 'text-gray-400 hover:text-white hover:bg-[var(--color-bg-elevated)]'
                                        }`}
                                >
                                    ▶
                                </button>
                            </div>
                            <div className="flex items-center gap-2">
                                {/* 1RM Display */}
                                {athlete && settings.show1RMHints !== false && (
                                    <>
                                        <OneRMHint
                                            exerciseId={activeExercise.exerciseId}
                                            athlete={athlete}
                                            compact={false}
                                        />
                                        <LoadSuggestion
                                            exerciseId={activeExercise.exerciseId}
                                            athlete={athlete}
                                            targetReps={activeExercise.sets[0]?.targetReps || 5}
                                            targetRPE={8}
                                            show={activeExercise.strengthFocus}
                                        />
                                    </>
                                )}

                                {/* Strength Focus */}
                                <button
                                    onClick={() => {
                                        const updatedExercises = [...session.exercises];
                                        updatedExercises[activeExerciseIndex] = {
                                            ...updatedExercises[activeExerciseIndex],
                                            strengthFocus: !activeExercise.strengthFocus,
                                        };
                                        const { updateSession } = useTrainingStore.getState();
                                        updateSession(session.id, { exercises: updatedExercises });
                                    }}
                                    className={`px-2 py-1 rounded text-xs font-medium transition-all ${activeExercise.strengthFocus
                                        ? 'bg-[var(--color-accent-gold)] text-black'
                                        : 'bg-[var(--color-bg-elevated)] text-gray-400 hover:text-white'
                                        }`}
                                >
                                    💪 {activeExercise.strengthFocus ? 'Fuerza' : ''}
                                </button>

                                <AuraButton variant="ghost" size="sm" onClick={() => handleAddSet(activeExerciseIndex)}>
                                    + Set
                                </AuraButton>
                                {session.exercises.length > 1 && (
                                    <button
                                        onClick={() => setShowRemoveExerciseModal(true)}
                                        className="p-2 rounded text-gray-500 hover:text-red-400 hover:bg-red-400/10 transition-colors"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                    </button>
                                )}
                            </div>
                        </div>
                    }
                >
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
                                exerciseName={exerciseInfo?.name || 'Exercise'}
                                athleteId={session.athleteId}
                                previousSets={activeExercise.sets.slice(0, setIndex).filter(s => s.isCompleted)}
                                exerciseHistory={exerciseHistory}
                            />
                        ))}
                    </div>
                </AuraPanel>
            ) : (
                <AuraPanel>
                    <AuraEmptyState
                        icon="🏋️"
                        title="No exercises"
                        description="Add exercises to this session to begin."
                        action={{ label: 'Add Exercise', onClick: () => setShowAddExerciseModal(true) }}
                    />
                </AuraPanel>
            )}

            {/* Modals */}
            <AddExerciseModal
                isOpen={showAddExerciseModal}
                onClose={() => setShowAddExerciseModal(false)}
                exercises={exercises}
                session={session}
                onAddExercise={handleAddExercise}
                onCreateExercise={addExercise}
                getExercise={getExercise}
            />

            <Modal
                isOpen={showFinishModal}
                onClose={() => setShowFinishModal(false)}
                title="Finish Session"
                size="sm"
                footer={
                    <>
                        <AuraButton variant="ghost" onClick={() => setShowFinishModal(false)}>Continue</AuraButton>
                        <AuraButton variant="gold" onClick={handleFinishSession}>Finish</AuraButton>
                    </>
                }
            >
                <FinishModalContent stats={liveStats} />
            </Modal>

            <Modal
                isOpen={showRemoveExerciseModal}
                onClose={() => setShowRemoveExerciseModal(false)}
                title="Remove Exercise"
                size="sm"
                footer={
                    <>
                        <AuraButton variant="ghost" onClick={() => setShowRemoveExerciseModal(false)}>Cancel</AuraButton>
                        <AuraButton variant="secondary" className="!bg-red-600 hover:!bg-red-700 !border-red-600" onClick={() => handleRemoveExercise(activeExerciseIndex)}>Remove</AuraButton>
                    </>
                }
            >
                <p className="text-gray-400">Remove <strong className="text-white">{exerciseInfo?.name || 'this exercise'}</strong>?</p>
                <p className="text-sm text-gray-600 mt-2">All sets for this exercise will be deleted.</p>
            </Modal>

            <Modal
                isOpen={showCancelModal}
                onClose={() => setShowCancelModal(false)}
                title="Cancel Session"
                size="sm"
                footer={
                    <>
                        <AuraButton variant="ghost" onClick={() => setShowCancelModal(false)}>Go Back</AuraButton>
                        <AuraButton variant="secondary" className="!bg-red-600 hover:!bg-red-700 !border-red-600" onClick={handleCancelSession}>Yes, Cancel</AuraButton>
                    </>
                }
            >
                <p className="text-gray-400">Cancel session <strong className="text-white">"{session.name}"</strong>?</p>
                <p className="text-sm text-gray-600 mt-2">The session will be marked as cancelled.</p>
            </Modal>

            <Modal
                isOpen={showExitModal}
                onClose={() => setShowExitModal(false)}
                title="Exit Session"
                size="sm"
                footer={
                    <>
                        <AuraButton variant="ghost" onClick={() => setShowExitModal(false)}>Keep Training</AuraButton>
                        <AuraButton onClick={() => navigate('/sessions')}>Exit</AuraButton>
                    </>
                }
            >
                <p className="text-gray-400">You have <strong className="text-white">{liveStats.completedSets} sets</strong> completed.</p>
                <p className="text-sm text-gray-600 mt-2">The session will remain "in progress". You can return later.</p>
            </Modal>
        </div>
    );
}

// Helper component for finish modal content
function FinishModalContent({ stats }: { stats: { completedSets: number; totalVolume: number } }) {
    return (
        <div className="space-y-4">
            <p className="text-gray-400">Finish this session?</p>
            <div className="grid grid-cols-2 gap-4 p-4 rounded-lg bg-[#0F0F0F] border border-[#2A2A2A]">
                <div className="text-center">
                    <p className="text-xl font-mono text-[var(--color-accent-gold)]">{stats.completedSets}</p>
                    <p className="text-[10px] text-gray-500 uppercase">Sets</p>
                </div>
                <div className="text-center">
                    <p className="text-xl font-mono text-[var(--color-accent-gold)]">{stats.totalVolume.toLocaleString()} kg</p>
                    <p className="text-[10px] text-gray-500 uppercase">Volume</p>
                </div>
            </div>
        </div>
    );
}
