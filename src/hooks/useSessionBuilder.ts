/**
 * useSessionBuilder - Unified hook for creating training sessions
 * 
 * Consolidates session creation logic from multiple sources:
 * - From templates
 * - Manual creation
 * - Repeat last session
 * - Includes pre-save validation
 * 
 * PHASE 6: Uses domain/sessions/mappers for session creation (LT4)
 */

import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTrainingStore, useSessions } from '../store/store';
import { validateSession, canCompleteSession } from '../utils/sessionValidation';
// PHASE 6: Use domain mappers for session creation (LT4)
import { createScheduledSessionFromTemplate } from '../domain/sessions/mappers';
import type { WorkoutSession, WorkoutTemplate, ExerciseEntry, SetEntry } from '../types/types';

// ============================================
// TYPES
// ============================================

export interface SessionBuilderOptions {
    navigateAfterCreate?: boolean;
    navigateTo?: 'live' | 'sessions';
}

export interface UseSessionBuilderReturn {
    createSessionFromTemplate: (template: WorkoutTemplate, athleteId: string, options?: SessionBuilderOptions) => WorkoutSession;
    createManualSession: (name: string, athleteId: string, options?: SessionBuilderOptions) => WorkoutSession;
    repeatLastSession: (athleteId: string, options?: SessionBuilderOptions) => WorkoutSession | null;
    getLastSession: (athleteId: string) => WorkoutSession | null;
    validateSessionData: typeof validateSession;
    canComplete: typeof canCompleteSession;
}

// ============================================
// HOOK
// ============================================

export function useSessionBuilder(): UseSessionBuilderReturn {
    const navigate = useNavigate();
    const addSession = useTrainingStore((s) => s.addSession);
    const sessions = useSessions();

    /**
     * Get the most recent completed session for an athlete
     */
    const getLastSession = useCallback((athleteId: string): WorkoutSession | null => {
        const athleteSessions = sessions
            .filter(s => s.athleteId === athleteId && s.status === 'completed')
            .sort((a, b) => new Date(b.completedAt || b.updatedAt).getTime() - new Date(a.completedAt || a.updatedAt).getTime());

        return athleteSessions[0] || null;
    }, [sessions]);

    /**
     * Create a session from a template - using domain mapper (PHASE 6 LT4)
     */
    const createSessionFromTemplate = useCallback((
        template: WorkoutTemplate,
        athleteId: string,
        options: SessionBuilderOptions = { navigateAfterCreate: true, navigateTo: 'live' }
    ): WorkoutSession => {
        // Use domain mapper to create structured session from template
        const sessionFromMapper = createScheduledSessionFromTemplate(template, {
            scheduledDate: new Date().toISOString().split('T')[0],
            athleteId,
            name: `${template.name} - ${new Date().toLocaleDateString('es-ES')}`,
        });

        // Validate before save (log warnings, but don't block)
        const validation = validateSession(sessionFromMapper);
        if (validation.warnings.length > 0) {
            console.debug('[SessionBuilder] Warnings:', validation.warnings);
        }

        const session = addSession(sessionFromMapper);

        // Navigate if requested (Phase 28B: use library instead of /sessions)
        if (options.navigateAfterCreate) {
            const path = options.navigateTo === 'live'
                ? `/sessions/live/${session.id}`
                : '/library?tab=templates';
            navigate(path);
        }

        return session;
    }, [addSession, navigate]);

    /**
     * Create an empty manual session
     */
    const createManualSession = useCallback((
        name: string,
        athleteId: string,
        options: SessionBuilderOptions = { navigateAfterCreate: true, navigateTo: 'live' }
    ): WorkoutSession => {
        const sessionData: Omit<WorkoutSession, 'id' | 'createdAt' | 'updatedAt'> = {
            name: name || `Sesión - ${new Date().toLocaleDateString('es-ES')}`,
            athleteId,
            status: 'planned',
            exercises: [],
        };

        const session = addSession(sessionData);

        // Phase 28B: use library instead of /sessions
        if (options.navigateAfterCreate) {
            const path = options.navigateTo === 'live'
                ? `/sessions/live/${session.id}`
                : '/library?tab=templates';
            navigate(path);
        }

        return session;
    }, [addSession, navigate]);

    /**
     * Repeat the last completed session for an athlete
     * Creates a new session with same exercises/sets structure, but reset completion status
     */
    const repeatLastSession = useCallback((
        athleteId: string,
        options: SessionBuilderOptions = { navigateAfterCreate: true, navigateTo: 'live' }
    ): WorkoutSession | null => {
        const lastSession = getLastSession(athleteId);

        if (!lastSession || lastSession.exercises.length === 0) {
            console.warn('[SessionBuilder] No previous session to repeat for athlete:', athleteId);
            return null;
        }

        // Clone exercises with reset sets
        const exercises: ExerciseEntry[] = lastSession.exercises.map((ex, index) => ({
            id: crypto.randomUUID(),
            exerciseId: ex.exerciseId,
            order: index,
            sets: ex.sets.map((set, setIdx) => ({
                id: crypto.randomUUID(),
                setNumber: setIdx + 1,
                type: set.type,
                // Use actual values as new targets
                targetReps: set.actualReps || set.targetReps,
                targetWeight: set.actualWeight || set.targetWeight,
                restSeconds: set.restSeconds,
                isCompleted: false,
                // Reset actual values
                actualReps: undefined,
                actualWeight: undefined,
                rpe: undefined,
                rir: undefined,
            })),
        }));

        // Build session name
        const baseName = lastSession.name.replace(/ - \d{1,2}\/\d{1,2}\/\d{4}$/, '');
        const sessionData: Omit<WorkoutSession, 'id' | 'createdAt' | 'updatedAt'> = {
            name: `${baseName} - ${new Date().toLocaleDateString('es-ES')}`,
            athleteId,
            templateId: lastSession.templateId,
            status: 'planned',
            exercises,
            durationMinutes: lastSession.durationMinutes,
            structure: lastSession.structure,
        };

        const session = addSession(sessionData);

        // Phase 28B: use library instead of /sessions
        if (options.navigateAfterCreate) {
            const path = options.navigateTo === 'live'
                ? `/sessions/live/${session.id}`
                : '/library?tab=templates';
            navigate(path);
        }

        console.log('[SessionBuilder] Repeated session from:', lastSession.name);
        return session;
    }, [addSession, navigate, getLastSession]);

    return {
        createSessionFromTemplate,
        createManualSession,
        repeatLastSession,
        getLastSession,
        validateSessionData: validateSession,
        canComplete: canCompleteSession,
    };
}

// ============================================
// HELPERS
// ============================================

interface SetDefaults {
    targetReps?: number;
    targetWeight?: number;
    restSeconds?: number;
}

function buildSetsFromTemplate(count: number, defaults: SetDefaults): SetEntry[] {
    return Array.from({ length: count }, (_, i) => ({
        id: crypto.randomUUID(),
        setNumber: i + 1,
        type: 'working' as const,
        targetReps: defaults.targetReps,
        targetWeight: defaults.targetWeight,
        restSeconds: defaults.restSeconds,
        isCompleted: false,
    }));
}

