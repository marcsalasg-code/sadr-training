/**
 * useLiveSession - Hook for live training session management
 * 
 * Extracts all business logic from LiveSession.tsx for:
 * - Session state management
 * - Set/exercise handlers
 * - 1RM auto-deduction
 * - Multi-athlete support
 * - Live statistics calculation
 * - Post-session 1RM recommendations (Phase 6)
 */

import { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTrainingStore, useSettings, useExercises, useSessions, useAthletes } from '../store/store';
import { useRestTimer } from './useRestTimer';
import { isMultiAthleteSession, getSessionAthleteIds } from '../utils/multiAthleteSession';
import { shouldAutoDeduceOneRM, autoDeduceOneRM, updateOneRepMax } from '../ai/performance/performanceEngine';
import { analyzeSessionForOneRM } from '../ai/engines/oneRMEngine';
import { computeSessionAvgIntensity } from '../utils/metrics';
import type { SetEntry, ExerciseEntry, WorkoutSession, Exercise, Athlete } from '../types/types';

// ============================================
// TYPES
// ============================================

export interface LiveStats {
    totalSets: number;
    completedSets: number;
    totalVolume: number;
    progressPercent: number;
}

export interface ExerciseHistoryEntry {
    weight: number;
    reps: number;
    date: string;
}

export interface UseLiveSessionReturn {
    // Session data
    session: WorkoutSession | undefined;
    activeExercise: ExerciseEntry | undefined;
    exerciseInfo: Exercise | undefined;
    liveStats: LiveStats;
    exerciseHistory: ExerciseHistoryEntry[];
    sessionStartTime: Date;

    // Multi-athlete
    isMultiAthlete: boolean;
    sessionAthletes: Athlete[];
    activeAthleteId: string;
    setActiveAthleteId: (id: string) => void;

    // UI state
    activeExerciseIndex: number;
    setActiveExerciseIndex: (index: number) => void;
    showFatiguePrompt: boolean;

    // Modals
    showAddExerciseModal: boolean;
    setShowAddExerciseModal: (show: boolean) => void;
    showFinishModal: boolean;
    setShowFinishModal: (show: boolean) => void;
    showRemoveExerciseModal: boolean;
    setShowRemoveExerciseModal: (show: boolean) => void;
    showCancelModal: boolean;
    setShowCancelModal: (show: boolean) => void;
    showExitModal: boolean;
    setShowExitModal: (show: boolean) => void;

    // Rest timer
    restTimer: ReturnType<typeof useRestTimer>;

    // Handlers
    handleCompleteSet: (exerciseIndex: number, setIndex: number, data: Partial<SetEntry>) => void;
    handleAddSet: (exerciseIndex: number) => void;
    handleRemoveSet: (exerciseIndex: number, setIndex: number) => void;
    handleUncompleteSet: (exerciseIndex: number, setIndex: number) => void;
    handleAddExercise: (exerciseId: string) => void;
    handleRemoveExercise: (exerciseIndex: number) => void;
    handleFinishSession: () => void;
    handleCancelSession: () => void;
    handleExitClick: () => void;
    handleFatigueConfirm: (value: number) => void;
    handleFatigueSkip: () => void;

    // Utilities
    getExercise: (id: string) => Exercise | undefined;
}

// ============================================
// HOOK IMPLEMENTATION
// ============================================

export function useLiveSession(sessionId: string | undefined): UseLiveSessionReturn {
    const navigate = useNavigate();
    const { getSession, updateSession, getExercise, getAthlete, updateAthlete } = useTrainingStore();
    const allExercises = useExercises();
    const allSessions = useSessions();
    const allAthletes = useAthletes();
    const settings = useSettings();

    const session = getSession(sessionId || '');
    const restTimer = useRestTimer(settings.defaultRestSeconds);

    // ============================================
    // STATE
    // ============================================

    const [activeExerciseIndex, setActiveExerciseIndex] = useState(0);
    const [showAddExerciseModal, setShowAddExerciseModal] = useState(false);
    const [showFinishModal, setShowFinishModal] = useState(false);
    const [showRemoveExerciseModal, setShowRemoveExerciseModal] = useState(false);
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [showExitModal, setShowExitModal] = useState(false);
    const [showFatiguePrompt, setShowFatiguePrompt] = useState<boolean>(() => {
        return session?.status === 'in_progress' && session?.preSessionFatigue == null;
    });
    const [sessionStartTime] = useState(() => session?.startedAt ? new Date(session.startedAt) : new Date());

    // Multi-athlete
    const [activeAthleteId, setActiveAthleteId] = useState<string>(() => session?.athleteId || '');
    const isMultiAthlete = session ? isMultiAthleteSession(session) : false;
    const sessionAthleteIds = session ? getSessionAthleteIds(session) : [];
    const sessionAthletes = allAthletes.filter(a => sessionAthleteIds.includes(a.id));

    // ============================================
    // EFFECTS
    // ============================================

    // Auto-start session if planned
    useEffect(() => {
        if (session && session.status === 'planned') {
            updateSession(session.id, {
                status: 'in_progress',
                startedAt: new Date().toISOString(),
            });
        }
    }, [session, updateSession]);

    // ============================================
    // COMPUTED VALUES
    // ============================================

    const liveStats = useMemo((): LiveStats => {
        if (!session) return { totalSets: 0, completedSets: 0, totalVolume: 0, progressPercent: 0 };

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

        const progressPercent = totalSets > 0 ? Math.round((completedSets / totalSets) * 100) : 0;

        return { totalSets, completedSets, totalVolume, progressPercent };
    }, [session]);

    const activeExercise = session?.exercises[activeExerciseIndex];
    const exerciseInfo = activeExercise ? getExercise(activeExercise.exerciseId) : undefined;

    const exerciseHistory = useMemo((): ExerciseHistoryEntry[] => {
        if (!session || !activeExercise) return [];

        const history: ExerciseHistoryEntry[] = [];
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
        return history.slice(-10);
    }, [session, activeExercise, allSessions]);

    // ============================================
    // HANDLERS
    // ============================================

    const handleCompleteSet = useCallback((exerciseIndex: number, setIndex: number, data: Partial<SetEntry>) => {
        if (!session) return;

        const updatedExercises = [...session.exercises];
        const set = updatedExercises[exerciseIndex].sets[setIndex];
        updatedExercises[exerciseIndex].sets[setIndex] = {
            ...set,
            ...data,
            isCompleted: true,
            completedAt: new Date().toISOString(),
        };
        updateSession(session.id, { exercises: updatedExercises });

        if (settings.autoStartRest) {
            restTimer.start(set.restSeconds || settings.defaultRestSeconds);
        }
    }, [session, updateSession, settings, restTimer]);

    const handleAddSet = useCallback((exerciseIndex: number) => {
        if (!session) return;

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
    }, [session, updateSession, settings]);

    const handleRemoveSet = useCallback((exerciseIndex: number, setIndex: number) => {
        if (!session) return;

        const updatedExercises = [...session.exercises];
        const exercise = updatedExercises[exerciseIndex];
        if (exercise.sets.length <= 1) return;
        exercise.sets = exercise.sets
            .filter((_, i) => i !== setIndex)
            .map((set, i) => ({ ...set, setNumber: i + 1 }));
        updateSession(session.id, { exercises: updatedExercises });
    }, [session, updateSession]);

    const handleUncompleteSet = useCallback((exerciseIndex: number, setIndex: number) => {
        if (!session) return;

        const updatedExercises = [...session.exercises];
        updatedExercises[exerciseIndex].sets[setIndex] = {
            ...updatedExercises[exerciseIndex].sets[setIndex],
            isCompleted: false,
            completedAt: undefined,
            actualWeight: undefined,
            actualReps: undefined,
        };
        updateSession(session.id, { exercises: updatedExercises });
    }, [session, updateSession]);

    const handleAddExercise = useCallback((exerciseId: string) => {
        if (!session) return;

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
        updateSession(session.id, { exercises: [...session.exercises, newExercise] });
        setShowAddExerciseModal(false);
        setActiveExerciseIndex(session.exercises.length);
    }, [session, updateSession, settings]);

    const handleRemoveExercise = useCallback((exerciseIndex: number) => {
        if (!session) return;

        const updatedExercises = session.exercises
            .filter((_, i) => i !== exerciseIndex)
            .map((ex, i) => ({ ...ex, order: i }));
        updateSession(session.id, { exercises: updatedExercises });

        if (exerciseIndex <= activeExerciseIndex && activeExerciseIndex > 0) {
            setActiveExerciseIndex(prev => prev - 1);
        } else if (updatedExercises.length === 0) {
            setActiveExerciseIndex(0);
        }
        setShowRemoveExerciseModal(false);
    }, [session, updateSession, activeExerciseIndex]);

    const handleFinishSession = useCallback(() => {
        if (!session) return;

        const endTime = new Date();
        const durationMinutes = Math.round((endTime.getTime() - sessionStartTime.getTime()) / 60000);

        // Auto-register 1RM for exercises that meet criteria
        const athlete = getAthlete(session.athleteId);
        if (athlete) {
            let updatedAthlete = athlete;
            session.exercises.forEach(ex => {
                const exercise = getExercise(ex.exerciseId);
                if (shouldAutoDeduceOneRM(ex.exerciseId, ex.sets, updatedAthlete)) {
                    const estimated1RM = autoDeduceOneRM(
                        ex.exerciseId,
                        ex.sets,
                        exercise,
                        athlete.currentWeightKg
                    );
                    if (estimated1RM && estimated1RM > 0) {
                        updatedAthlete = updateOneRepMax(
                            ex.exerciseId,
                            updatedAthlete,
                            estimated1RM,
                            'estimated',
                            session.id
                        );
                        console.log(`[1RM Auto] ${exercise?.name}: ${estimated1RM}kg estimated`);
                    }
                }
            });
            if (updatedAthlete !== athlete) {
                updateAthlete(athlete.id, { oneRMRecords: updatedAthlete.oneRMRecords });
            }

            // PHASE 6: Generate AI recommendations for 1RM progression
            const oneRMRecommendations = analyzeSessionForOneRM(
                session,
                updatedAthlete.oneRMRecords || {},
                updatedAthlete.currentWeightKg
            );

            // Log recommendations (could be shown to user later)
            if (oneRMRecommendations.length > 0) {
                console.log('[AI 1RM Recommendations]', oneRMRecommendations.map(r => ({
                    exercise: r.exerciseName,
                    action: r.action,
                    current: r.currentOneRM,
                    suggested: r.suggestedOneRM,
                    rationale: r.rationale,
                })));
            }
        }

        // Calculate average intensity
        const avgIntensity = computeSessionAvgIntensity(session);

        updateSession(session.id, {
            status: 'completed',
            completedAt: endTime.toISOString(),
            durationMinutes,
            totalVolume: liveStats.totalVolume,
            totalSets: liveStats.completedSets,
            totalReps: session.exercises.reduce((sum, ex) =>
                sum + ex.sets.reduce((s, set) => s + (set.actualReps || 0), 0), 0
            ),
            avgIntensity,
        });
        navigate('/sessions');
    }, [session, sessionStartTime, liveStats, getAthlete, getExercise, updateAthlete, updateSession, navigate]);

    const handleCancelSession = useCallback(() => {
        if (!session) return;
        updateSession(session.id, { status: 'cancelled' });
        navigate('/sessions');
    }, [session, updateSession, navigate]);

    const handleExitClick = useCallback(() => {
        if (session?.status === 'in_progress' && liveStats.completedSets > 0) {
            setShowExitModal(true);
        } else {
            navigate('/sessions');
        }
    }, [session, liveStats.completedSets, navigate]);

    const handleFatigueConfirm = useCallback((value: number) => {
        if (!session) return;
        updateSession(session.id, { preSessionFatigue: value });
        setShowFatiguePrompt(false);
    }, [session, updateSession]);

    const handleFatigueSkip = useCallback(() => {
        setShowFatiguePrompt(false);
    }, []);

    // ============================================
    // RETURN
    // ============================================

    return {
        // Session data
        session,
        activeExercise,
        exerciseInfo,
        liveStats,
        exerciseHistory,
        sessionStartTime,

        // Multi-athlete
        isMultiAthlete,
        sessionAthletes,
        activeAthleteId,
        setActiveAthleteId,

        // UI state
        activeExerciseIndex,
        setActiveExerciseIndex,
        showFatiguePrompt,

        // Modals
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

        // Rest timer
        restTimer,

        // Handlers
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

        // Utilities
        getExercise,
    };
}
