/**
 * LiveSession - Vista de sesión en vivo
 * Registro de series en tiempo real con cronómetro de descanso
 * Rediseñado con UI Aura
 * 
 * REFACTORED: Usa useLiveSession hook para toda la lógica de negocio
 */

import { Modal } from '../components/ui';
import {
    AuraGrid,
    AuraPanel,
    AuraCard,
    AuraButton,
    AuraBadge,
    AuraEmptyState,
} from '../components/ui/aura';
import { SetRow, AddExerciseModal, FatiguePrompt } from '../components/session';
import { OneRMHint } from '../components/common/OneRMHint';
import { LoadSuggestion } from '../components/common/LoadSuggestion';
import { useTrainingStore, useSettings, useExercises } from '../store/store';
import { useLiveSession, formatTime } from '../hooks';
import { useParams, useNavigate } from 'react-router-dom';

export function LiveSession() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { addExercise, getAthlete } = useTrainingStore();
    const exercises = useExercises();
    const settings = useSettings();

    // Use the hook for all session logic
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
        handleFinishSession,
        handleCancelSession,
        handleExitClick,
        handleFatigueConfirm,
        handleFatigueSkip,
        getExercise,
    } = useLiveSession(id);

    // Early return if session not found
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

    return (
        <div className="p-8 space-y-6 max-w-6xl mx-auto">
            {/* Header */}
            <header className="flex justify-between items-start">
                <div>
                    <div className="flex items-center gap-3 mb-1">
                        {session.status === 'in_progress' && (
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-[var(--color-accent-gold)] animate-pulse" />
                                <span className="text-[10px] font-bold text-[var(--color-accent-gold)] uppercase tracking-widest">
                                    Live Session
                                </span>
                            </div>
                        )}
                        {isMultiAthlete && (
                            <AuraBadge variant="muted" size="sm">Multi-Athlete</AuraBadge>
                        )}
                    </div>
                    <h1 className="text-2xl text-white font-semibold tracking-tight">{session.name}</h1>

                    {/* Multi-Athlete Selector */}
                    {isMultiAthlete && sessionAthletes.length > 1 && (
                        <div className="flex gap-2 mt-2">
                            {sessionAthletes.map(athlete => (
                                <button
                                    key={athlete.id}
                                    onClick={() => setActiveAthleteId(athlete.id)}
                                    className={`px-3 py-1 rounded-full text-sm font-medium transition-all ${activeAthleteId === athlete.id
                                        ? 'bg-[var(--color-accent-gold)] text-black'
                                        : 'bg-[#1A1A1A] text-gray-400 hover:text-white hover:bg-[#2A2A2A]'
                                        }`}
                                >
                                    {athlete.name}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    <AuraButton variant="ghost" onClick={handleExitClick}>
                        ← Exit
                    </AuraButton>
                    {session.status === 'in_progress' && (
                        <AuraButton
                            variant="ghost"
                            className="!text-red-400 hover:!bg-red-400/10"
                            onClick={() => setShowCancelModal(true)}
                        >
                            Cancel
                        </AuraButton>
                    )}
                    <AuraButton variant="gold" onClick={() => setShowFinishModal(true)}>
                        Finish ✓
                    </AuraButton>
                </div>
            </header>

            {/* Pre-Session Fatigue Prompt */}
            {showFatiguePrompt && (
                <FatiguePrompt
                    onConfirm={handleFatigueConfirm}
                    onSkip={handleFatigueSkip}
                />
            )}

            {/* Stats Bar */}
            <AuraGrid cols={4} gap="md">
                {/* Sets Progress */}
                <AuraCard className="relative overflow-hidden">
                    <div className="relative z-10">
                        <span className="text-[10px] text-gray-500 uppercase tracking-widest">Sets</span>
                        <div className="flex items-baseline gap-2 mt-1">
                            <span className="text-2xl font-mono text-white">{liveStats.completedSets}</span>
                            <span className="text-sm text-gray-500">/ {liveStats.totalSets}</span>
                        </div>
                    </div>
                    {/* Progress bar */}
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#222]">
                        <div
                            className="h-full bg-[var(--color-accent-gold)] transition-all"
                            style={{ width: `${liveStats.progressPercent}%` }}
                        />
                    </div>
                </AuraCard>

                {/* Volume */}
                <AuraCard>
                    <span className="text-[10px] text-gray-500 uppercase tracking-widest">Volume</span>
                    <div className="mt-1">
                        <span className="text-2xl font-mono text-white">
                            {liveStats.totalVolume >= 1000
                                ? `${(liveStats.totalVolume / 1000).toFixed(1)}k`
                                : liveStats.totalVolume}
                        </span>
                        <span className="text-sm text-gray-500 ml-1">kg</span>
                    </div>
                </AuraCard>

                {/* Exercises */}
                <AuraCard>
                    <span className="text-[10px] text-gray-500 uppercase tracking-widest">Exercises</span>
                    <div className="mt-1">
                        <span className="text-2xl font-mono text-white">{session.exercises.length}</span>
                    </div>
                </AuraCard>

                {/* Rest Timer */}
                <AuraCard
                    className={`transition-all ${restTimer.isRunning
                        ? 'border-[var(--color-accent-gold)] shadow-[0_0_20px_rgba(212,194,154,0.15)]'
                        : ''
                        } ${restTimer.isFinished ? '!border-green-500 !bg-green-500/5' : ''}`}
                >
                    <span className="text-[10px] text-gray-500 uppercase tracking-widest">
                        {restTimer.isFinished ? 'Ready!' : restTimer.isRunning ? 'Rest' : 'Timer'}
                    </span>
                    <div className="flex items-center justify-center gap-3 mt-1">
                        {/* Minus button */}
                        <button
                            onClick={() => restTimer.setDuration(Math.max(0, restTimer.seconds - 15))}
                            className="w-8 h-8 rounded-full bg-[#1A1A1A] text-white hover:bg-[#2A2A2A] flex items-center justify-center text-lg font-bold transition-colors"
                            title="-15s"
                        >
                            −
                        </button>

                        {/* Timer display (clickable to start/pause) */}
                        <button
                            onClick={() => restTimer.isRunning ? restTimer.pause() : restTimer.start()}
                            className={`text-2xl font-mono cursor-pointer hover:opacity-80 transition-opacity ${restTimer.isFinished
                                ? 'text-green-400'
                                : restTimer.isRunning
                                    ? 'text-[var(--color-accent-gold)]'
                                    : 'text-gray-500'
                                }`}
                            title="Click to start/pause"
                        >
                            {formatTime(restTimer.seconds)}
                        </button>

                        {/* Plus button */}
                        <button
                            onClick={() => restTimer.setDuration(restTimer.seconds + 15)}
                            className="w-8 h-8 rounded-full bg-[#1A1A1A] text-white hover:bg-[#2A2A2A] flex items-center justify-center text-lg font-bold transition-colors"
                            title="+15s"
                        >
                            +
                        </button>
                    </div>
                </AuraCard>
            </AuraGrid>

            {/* Exercise Tabs */}
            {session.exercises.length > 0 && (
                <div className="flex gap-2 overflow-x-auto pb-2">
                    {session.exercises.map((ex, index) => {
                        const exInfo = getExercise(ex.exerciseId);
                        const completedSets = ex.sets.filter(s => s.isCompleted).length;
                        const isComplete = completedSets === ex.sets.length;
                        const isActive = activeExerciseIndex === index;

                        return (
                            <button
                                key={ex.id}
                                onClick={() => setActiveExerciseIndex(index)}
                                className={`
                                    flex-shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-all
                                    ${isActive
                                        ? 'bg-[var(--color-accent-gold)] text-black'
                                        : isComplete
                                            ? 'bg-green-500/10 text-green-400 border border-green-500/30'
                                            : 'bg-[#1A1A1A] text-gray-400 border border-[#2A2A2A] hover:border-[#333]'
                                    }
                                `}
                            >
                                {exInfo?.name || `Exercise ${index + 1}`}
                                <span className="ml-2 text-xs opacity-70">{completedSets}/{ex.sets.length}</span>
                            </button>
                        );
                    })}
                    <button
                        onClick={() => setShowAddExerciseModal(true)}
                        className="flex-shrink-0 px-4 py-2 rounded-lg text-sm font-medium bg-transparent text-gray-600 border border-dashed border-[#333] hover:border-[var(--color-accent-gold)] hover:text-[var(--color-accent-gold)] transition-colors"
                    >
                        + Add
                    </button>
                </div>
            )}

            {/* Active Exercise Panel */}
            {activeExercise ? (
                <AuraPanel
                    header={
                        <div className="flex items-center justify-between">
                            <div>
                                <span className="text-lg text-white font-medium">
                                    {exerciseInfo?.name || 'Exercise'}
                                </span>
                                {exerciseInfo?.muscleGroups && (
                                    <div className="flex gap-2 mt-1">
                                        {exerciseInfo.muscleGroups.map(mg => (
                                            <AuraBadge key={mg} size="sm" variant="muted">{mg}</AuraBadge>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <div className="flex items-center gap-2">
                                {/* 1RM Display with Reference Support */}
                                {(() => {
                                    const athlete = session ? getAthlete(session.athleteId) : null;
                                    if (!athlete) return null;
                                    if (settings.show1RMHints === false) return null;

                                    return (
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
                                    );
                                })()}

                                {/* Strength Focus Toggle */}
                                <button
                                    onClick={() => {
                                        const updatedExercises = [...session.exercises];
                                        updatedExercises[activeExerciseIndex] = {
                                            ...updatedExercises[activeExerciseIndex],
                                            strengthFocus: !activeExercise.strengthFocus,
                                        };
                                        // Note: Using store directly for this UI-specific toggle
                                        const { updateSession } = useTrainingStore.getState();
                                        updateSession(session.id, { exercises: updatedExercises });
                                    }}
                                    className={`px-2 py-1 rounded text-xs font-medium transition-all ${activeExercise.strengthFocus
                                        ? 'bg-[var(--color-accent-gold)] text-black'
                                        : 'bg-[var(--color-bg-elevated)] text-gray-400 hover:text-white'
                                        }`}
                                    title={activeExercise.strengthFocus ? 'Enfoque fuerza activo' : 'Activar enfoque fuerza'}
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
                        action={{
                            label: 'Add Exercise',
                            onClick: () => setShowAddExerciseModal(true),
                        }}
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
                        <AuraButton variant="ghost" onClick={() => setShowFinishModal(false)}>
                            Continue
                        </AuraButton>
                        <AuraButton variant="gold" onClick={handleFinishSession}>
                            Finish
                        </AuraButton>
                    </>
                }
            >
                <div className="space-y-4">
                    <p className="text-gray-400">Finish this session?</p>
                    <div className="grid grid-cols-2 gap-4 p-4 rounded-lg bg-[#0F0F0F] border border-[#2A2A2A]">
                        <div className="text-center">
                            <p className="text-xl font-mono text-[var(--color-accent-gold)]">{liveStats.completedSets}</p>
                            <p className="text-[10px] text-gray-500 uppercase">Sets</p>
                        </div>
                        <div className="text-center">
                            <p className="text-xl font-mono text-[var(--color-accent-gold)]">{liveStats.totalVolume.toLocaleString()} kg</p>
                            <p className="text-[10px] text-gray-500 uppercase">Volume</p>
                        </div>
                    </div>
                </div>
            </Modal>

            <Modal
                isOpen={showRemoveExerciseModal}
                onClose={() => setShowRemoveExerciseModal(false)}
                title="Remove Exercise"
                size="sm"
                footer={
                    <>
                        <AuraButton variant="ghost" onClick={() => setShowRemoveExerciseModal(false)}>
                            Cancel
                        </AuraButton>
                        <AuraButton
                            variant="secondary"
                            className="!bg-red-600 hover:!bg-red-700 !border-red-600"
                            onClick={() => handleRemoveExercise(activeExerciseIndex)}
                        >
                            Remove
                        </AuraButton>
                    </>
                }
            >
                <p className="text-gray-400">
                    Remove <strong className="text-white">{exerciseInfo?.name || 'this exercise'}</strong>?
                </p>
                <p className="text-sm text-gray-600 mt-2">All sets for this exercise will be deleted.</p>
            </Modal>

            <Modal
                isOpen={showCancelModal}
                onClose={() => setShowCancelModal(false)}
                title="Cancel Session"
                size="sm"
                footer={
                    <>
                        <AuraButton variant="ghost" onClick={() => setShowCancelModal(false)}>
                            Go Back
                        </AuraButton>
                        <AuraButton
                            variant="secondary"
                            className="!bg-red-600 hover:!bg-red-700 !border-red-600"
                            onClick={handleCancelSession}
                        >
                            Yes, Cancel
                        </AuraButton>
                    </>
                }
            >
                <p className="text-gray-400">
                    Cancel session <strong className="text-white">"{session.name}"</strong>?
                </p>
                <p className="text-sm text-gray-600 mt-2">The session will be marked as cancelled.</p>
            </Modal>

            <Modal
                isOpen={showExitModal}
                onClose={() => setShowExitModal(false)}
                title="Exit Session"
                size="sm"
                footer={
                    <>
                        <AuraButton variant="ghost" onClick={() => setShowExitModal(false)}>
                            Keep Training
                        </AuraButton>
                        <AuraButton onClick={() => navigate('/sessions')}>
                            Exit
                        </AuraButton>
                    </>
                }
            >
                <p className="text-gray-400">
                    You have <strong className="text-white">{liveStats.completedSets} sets</strong> completed.
                </p>
                <p className="text-sm text-gray-600 mt-2">
                    The session will remain "in progress". You can return later.
                </p>
            </Modal>
        </div>
    );
}
