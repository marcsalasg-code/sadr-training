/**
 * useLiveSession - Hook for live training session management
 * 
 * PHASE 4 REFACTORED: Delegates session mutations to domain/sessions/workout
 * 
 * Responsibilities (orchestrator):
 * - Session state management
 * - Set/exercise handlers (via domain functions)
 * - 1RM auto-deduction
 * - Multi-athlete support
 * - Live statistics calculation
 */

import { useState, useMemo, useCallback } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { useTrainingStore, useSettings, useExercises, useSessions, useAthletes } from '../store/store';
import { useRestTimer } from './useRestTimer';
import { useLiveSessionModals } from './useLiveSessionModals';
import { useLiveSessionSetHandlers } from './useLiveSessionSetHandlers';
import { isMultiAthleteSession, getSessionAthleteIds } from '../utils/multiAthleteSession';
import { canCompleteSession, sanitizeSession } from '../utils/sessionValidation';
import { shouldAutoDeduceOneRM, autoDeduceOneRM, updateOneRepMax } from '../ai/performance/performanceEngine';
import { analyzeSessionForOneRM } from '../ai/engines/oneRMEngine';
import { computeSessionAvgIntensity } from '../core/analysis/metrics';
import { calculateSessionTotals, getSessionProgress } from '../domain/sessions';
// PHASE 4: Import workout domain functions
import {
    completeSet as domainCompleteSet,
    uncompleteSet as domainUncompleteSet,
    addSet as domainAddSet,
    removeSet as domainRemoveSet,
    addExerciseToSession as domainAddExercise,
    removeExerciseFromSession as domainRemoveExercise,
    startSession as domainStartSession,
    cancelSession as domainCancelSession,
    getExerciseAtIndex,
    getSetAtIndices,
} from '../domain/sessions';
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
    handleStartSession: () => void;
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

    // Phase 28B: Contextual return path
    const [searchParams] = useSearchParams();
    const location = useLocation();
    const getReturnPath = useCallback(() => {
        // Priority 1: returnPath from URL
        const urlReturnPath = searchParams.get('returnPath');
        if (urlReturnPath) return decodeURIComponent(urlReturnPath);
        // Priority 2: location.state.from
        const stateFrom = (location.state as { from?: string })?.from;
        if (stateFrom) return stateFrom;
        // Priority 3: Athlete calendar if we have athleteId
        if (session?.athleteId) return `/athletes/${session.athleteId}/calendar`;
        // Fallback: Library
        return '/library?tab=templates';
    }, [searchParams, location.state, session?.athleteId]);

    // ============================================
    // STATE
    // ============================================

    const [activeExerciseIndex, setActiveExerciseIndex] = useState(0);
    const [showFatiguePrompt, setShowFatiguePrompt] = useState<boolean>(() => {
        return session?.status === 'in_progress' && session?.preSessionFatigue == null;
    });
    const [sessionStartTime] = useState(() => session?.startedAt ? new Date(session.startedAt) : new Date());

    // Modal states (extracted to sub-hook)
    const modals = useLiveSessionModals();

    // Set handlers (extracted to sub-hook)
    const setHandlers = useLiveSessionSetHandlers({
        session,
        updateSession,
        settings,
        restTimer,
    });

    // Multi-athlete
    const [activeAthleteId, setActiveAthleteId] = useState<string>(() => session?.athleteId || '');
    const isMultiAthlete = session ? isMultiAthleteSession(session) : false;
    const sessionAthleteIds = session ? getSessionAthleteIds(session) : [];
    const sessionAthletes = allAthletes.filter(a => sessionAthleteIds.includes(a.id));

    // ============================================
    // EFFECTS
    // ============================================

    // PHASE 1: Removed auto-start - now requires explicit handleStartSession call
    // Session stays in 'planned' until user clicks "Start Session"

    // ============================================
    // COMPUTED VALUES
    // ============================================

    const liveStats = useMemo((): LiveStats => {
        if (!session) return { totalSets: 0, completedSets: 0, totalVolume: 0, progressPercent: 0 };

        // Use domain layer functions for calculations
        // Type assertion needed due to slight type differences between types/types.ts and domain/sessions/types.ts
        const totals = calculateSessionTotals(session as Parameters<typeof calculateSessionTotals>[0]);
        const totalSets = session.exercises.reduce((sum, ex) => sum + ex.sets.length, 0);
        const progressPercent = getSessionProgress(session as Parameters<typeof getSessionProgress>[0]);

        return {
            totalSets,
            completedSets: totals.totalSets,
            totalVolume: totals.totalVolume,
            progressPercent,
        };
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

    // PHASE 4: Exercise handlers use domain functions
    const handleAddExercise = useCallback((exerciseId: string) => {
        if (!session) return;

        const updates = domainAddExercise(session, exerciseId, {
            restSeconds: settings.defaultRestSeconds,
        });
        updateSession(session.id, updates);
        modals.setShowAddExerciseModal(false);
        // Navigate to the new exercise (last one)
        setActiveExerciseIndex(session.exercises.length);
    }, [session, updateSession, settings, modals]);

    // PHASE 4: Use domain function for removing exercises
    const handleRemoveExercise = useCallback((exerciseIndex: number) => {
        if (!session) return;

        const exercise = getExerciseAtIndex(session, exerciseIndex);
        if (!exercise) return;

        const updates = domainRemoveExercise(session, exercise.id);
        updateSession(session.id, updates);

        // Adjust active index
        if (exerciseIndex <= activeExerciseIndex && activeExerciseIndex > 0) {
            setActiveExerciseIndex(prev => prev - 1);
        } else if ((updates.exercises?.length || 0) === 0) {
            setActiveExerciseIndex(0);
        }
        modals.setShowRemoveExerciseModal(false);
    }, [session, updateSession, activeExerciseIndex, modals]);

    const handleFinishSession = useCallback(() => {
        if (!session) return;

        // Validate session can be completed
        const { canComplete, reason } = canCompleteSession(session);
        if (!canComplete) {
            console.warn('[Session Validation] Cannot complete session:', reason);
            // Note: UI could show warning here, but we allow completion with warning
        }

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
        // Phase 28B: Navigate to contextual return path
        navigate(getReturnPath());
    }, [session, sessionStartTime, liveStats, getAthlete, getExercise, updateAthlete, updateSession, navigate, getReturnPath]);

    const handleCancelSession = useCallback(() => {
        if (!session) return;
        updateSession(session.id, { status: 'cancelled' });
        // Phase 28B: Navigate to contextual return path
        navigate(getReturnPath());
    }, [session, updateSession, navigate, getReturnPath]);

    const handleExitClick = useCallback(() => {
        if (session?.status === 'in_progress' && liveStats.completedSets > 0) {
            modals.setShowExitModal(true);
        } else {
            // Phase 28B: Navigate to contextual return path
            navigate(getReturnPath());
        }
    }, [session, liveStats.completedSets, navigate, modals, getReturnPath]);

    const handleFatigueConfirm = useCallback((value: number) => {
        if (!session) return;
        updateSession(session.id, { preSessionFatigue: value });
        setShowFatiguePrompt(false);
    }, [session, updateSession]);

    const handleFatigueSkip = useCallback(() => {
        setShowFatiguePrompt(false);
    }, []);

    // PHASE 4/12B: Use domain function for starting session with hard guards
    const handleStartSession = useCallback(() => {
        if (!session || session.status !== 'planned') return;

        // PHASE 12B: Hard guard - never start session without exercises
        if (session.exercises.length === 0) return;

        const updates = domainStartSession(session);
        updateSession(session.id, updates);
        // Show fatigue prompt after starting
        setShowFatiguePrompt(true);
    }, [session, updateSession]);

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

        // Modals (from sub-hook)
        ...modals,

        // Rest timer
        restTimer,

        // Handlers (set operations from sub-hook)
        handleCompleteSet: setHandlers.handleCompleteSet,
        handleAddSet: setHandlers.handleAddSet,
        handleRemoveSet: setHandlers.handleRemoveSet,
        handleUncompleteSet: setHandlers.handleUncompleteSet,
        // Exercise handlers (local)
        handleAddExercise,
        handleRemoveExercise,
        // Session handlers (local)
        handleStartSession,
        handleFinishSession,
        handleCancelSession,
        handleExitClick,
        handleFatigueConfirm,
        handleFatigueSkip,

        // Utilities
        getExercise,
    };
}
