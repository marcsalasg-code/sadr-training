/**
 * Session Mappers - Domain Layer
 * 
 * Pure transformation functions for session lifecycle:
 * - Template → Scheduled Session
 * - Scheduled Session → In-Progress Session
 * - Update session structure
 * 
 * PHASE 2: Consolidate Template → Plan → Session flow
 */

import type {
    WorkoutSession,
    WorkoutTemplate,
    ExerciseEntry,
    SetEntry,
    TemplateExercise,
    UUID,
} from '../../types/types';

// ============================================
// TYPE ALIASES (Clarifying existing types)
// ============================================

/**
 * ScheduledSession - A session planned for a specific date
 * 
 * This is a WorkoutSession with status='planned'.
 * It may be created from a template or manually.
 * 
 * Flow: Template → ScheduledSession → WorkoutSession (in_progress/completed)
 */
export type ScheduledSession = WorkoutSession & {
    status: 'planned';
    scheduledDate: string;
};

/**
 * ExecutedSession - A session that has been started or completed
 */
export type ExecutedSession = WorkoutSession & {
    status: 'in_progress' | 'completed';
};

// ============================================
// ID GENERATION
// ============================================

const generateId = (): UUID => crypto.randomUUID();

// ============================================
// TEMPLATE → SCHEDULED SESSION
// ============================================

export interface CreateScheduledSessionOptions {
    /** Date for the session in YYYY-MM-DD format */
    scheduledDate: string;
    /** Optional athlete ID (can be set later) */
    athleteId?: string;
    /** Optional session name override */
    name?: string;
}

/**
 * Create a scheduled (planned) session from a template
 * 
 * This is used when:
 * - Coach assigns a template to a date in calendar
 * - Coach creates a session from "New from Template"
 * 
 * @param template - The workout template to clone
 * @param options - Scheduling options (date, athlete, name)
 * @returns A new WorkoutSession with status='planned'
 */
export function createScheduledSessionFromTemplate(
    template: WorkoutTemplate,
    options: CreateScheduledSessionOptions
): WorkoutSession {
    const sessionId = generateId();
    const now = new Date().toISOString();

    // Determine default blockId from template structure if present
    const defaultBlockId = template.structure?.blocks?.[0]?.id;

    // Clone template exercises to session exercises
    const exercises: ExerciseEntry[] = template.exercises.map((templateEx, exIdx) => {
        const exerciseEntryId = generateId();

        // Create sets based on template defaults
        const sets: SetEntry[] = Array.from(
            { length: templateEx.defaultSets || 3 },
            (_, setIdx) => ({
                id: generateId(),
                setNumber: setIdx + 1,
                type: 'working' as const,
                targetReps: templateEx.defaultReps,
                targetWeight: templateEx.defaultWeight,
                restSeconds: templateEx.restSeconds, // FIX: Map restSeconds from template
                isCompleted: false,
                blockId: defaultBlockId, // Inherit blockId from template structure
            })
        );

        return {
            id: exerciseEntryId,
            exerciseId: templateEx.exerciseId,
            order: templateEx.order ?? exIdx,
            sets,
            notes: templateEx.notes,
            restSeconds: templateEx.restSeconds, // FIX: Map restSeconds at exercise level
            blockId: defaultBlockId, // Copy block reference from template structure
        };
    });

    return {
        id: sessionId,
        athleteId: options.athleteId || '',
        templateId: template.id,
        name: options.name || template.name,
        description: template.description,
        scheduledDate: options.scheduledDate,
        status: 'planned',
        exercises,
        structure: template.structure, // Copy block structure from template
        notes: '',
        createdAt: now,
        updatedAt: now,
    };
}

/**
 * Phase 23 P0.2: Create a snapshot session from a template
 * 
 * This creates a "frozen" copy of the template's exercises that can be
 * stored in PlannedSession.snapshot to prevent retroactive changes.
 * 
 * @param template - The workout template to snapshot
 * @param athleteId - Optional athlete ID for the snapshot
 * @returns A WorkoutSession with status='planned' suitable for snapshot storage
 */
export function createSnapshotFromTemplate(
    template: WorkoutTemplate,
    athleteId = ''
): WorkoutSession {
    const sessionId = generateId();
    const now = new Date().toISOString();
    const exercises = materializeExercisesFromTemplate(template);

    return {
        id: sessionId,
        athleteId,
        templateId: template.id,
        name: template.name,
        description: template.description,
        status: 'planned',
        exercises,
        structure: template.structure,
        notes: '',
        createdAt: now,
        updatedAt: now,
    };
}

// ============================================
// BLOCK ID RESOLUTION (Phase 16C)
// ============================================

interface ResolveBlockIdParams {
    template: WorkoutTemplate;
    templateExercise: TemplateExercise;
    exerciseIndex: number;
    defaultBlockId?: string;
}

/**
 * Resolve block ID for a template exercise
 * 
 * PHASE 16C: Supports explicit mapping via templateExercise.blockId
 * Priority:
 * 1. Explicit blockId on templateExercise (if valid in structure)
 * 2. Proportional distribution based on exercise index
 * 3. undefined if no structure
 */
function resolveBlockIdForTemplateExercise({
    template,
    templateExercise,
    exerciseIndex,
    defaultBlockId,
}: ResolveBlockIdParams): string | undefined {
    // If override provided, use it
    if (defaultBlockId) return defaultBlockId;

    const blocks = template.structure?.blocks || [];
    if (blocks.length === 0) return undefined;

    // Phase 16C: Check for explicit blockId on template exercise (defensive runtime check)
    const explicitBlockId = 'blockId' in templateExercise
        ? (templateExercise as Record<string, unknown>).blockId as string | undefined
        : undefined;

    if (explicitBlockId && blocks.some(b => b.id === explicitBlockId)) {
        return explicitBlockId;
    }

    // Fallback: proportional distribution
    if (blocks.length === 1) return blocks[0].id;

    const exercisesPerBlock = Math.ceil(template.exercises.length / blocks.length);
    const blockIndex = Math.min(
        Math.floor(exerciseIndex / exercisesPerBlock),
        blocks.length - 1
    );
    return blocks[blockIndex]?.id;
}

// ============================================
// EXERCISE MATERIALIZATION (Reusable helper)
// ============================================

/**
 * Materialize exercises from a template
 * 
 * PHASE 16A: Single source of truth for template → exercises conversion.
 * PHASE 16B: Proper block distribution based on template structure.
 * PHASE 16C: Explicit blockId mapping support + consistency enforcement.
 * Used by all entrypoints (TemplatesView, SessionBuilder, ApplyTemplate).
 * 
 * @param template - The workout template
 * @param defaultBlockId - Optional block ID to override all exercises/sets
 * @returns Array of ExerciseEntry ready for a session
 */
export function materializeExercisesFromTemplate(
    template: WorkoutTemplate,
    defaultBlockId?: string
): ExerciseEntry[] {
    return template.exercises.map((templateEx, exIdx) => {
        const exerciseEntryId = generateId();
        const blockId = resolveBlockIdForTemplateExercise({
            template,
            templateExercise: templateEx,
            exerciseIndex: exIdx,
            defaultBlockId,
        });

        const sets: SetEntry[] = Array.from(
            { length: templateEx.defaultSets || 3 },
            (_, setIdx) => ({
                id: generateId(),
                setNumber: setIdx + 1,
                type: 'working' as const,
                targetReps: templateEx.defaultReps,
                targetWeight: templateEx.defaultWeight,
                restSeconds: templateEx.restSeconds,
                isCompleted: false,
                blockId,
            })
        );

        return {
            id: exerciseEntryId,
            exerciseId: templateEx.exerciseId,
            order: templateEx.order ?? exIdx,
            sets,
            notes: templateEx.notes,
            restSeconds: templateEx.restSeconds,
            blockId,
        };
    });
}

// ============================================
// SESSION PATCH (Phase 16C)
// ============================================

/**
 * Materialize a session patch from a template
 * 
 * PHASE 16C: Single function to get all template data for session update.
 * Prevents divergence by centralizing what gets applied from template.
 * 
 * @param template - The workout template
 * @returns Patch object with exercises, structure, and templateId
 */
export function materializeSessionPatchFromTemplate(template: WorkoutTemplate): {
    exercises: ExerciseEntry[];
    structure: WorkoutTemplate['structure'];
    templateId: string;
} {
    return {
        exercises: materializeExercisesFromTemplate(template),
        structure: template.structure,
        templateId: template.id,
    };
}

// ============================================
// SCHEDULED SESSION → IN-PROGRESS
// ============================================

/**
 * Start a scheduled session (transition to in_progress)
 * 
 * This is called when the coach/athlete clicks "Start Session"
 * Updates status and sets startedAt timestamp
 * 
 * @param session - The scheduled session to start
 * @returns Updated session with status='in_progress'
 */
export function startScheduledSession(session: WorkoutSession): WorkoutSession {
    if (session.status !== 'planned') {
        console.warn(`Cannot start session with status '${session.status}'`);
        return session;
    }

    return {
        ...session,
        status: 'in_progress',
        startedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    };
}

// ============================================
// SESSION STRUCTURE UPDATES
// ============================================

export interface SessionStructureUpdate {
    /** Reorder exercises */
    reorderExercises?: Array<{ exerciseId: string; newOrder: number }>;
    /** Add exercise at position */
    addExercise?: { exerciseId: string; atIndex: number; sets: number };
    /** Remove exercise */
    removeExercise?: { exerciseId: string };
    /** Update exercise sets */
    updateExerciseSets?: { exerciseId: string; sets: number };
}

/**
 * Update the structure of a scheduled session
 * 
 * This is used when:
 * - Coach edits a planned session in the calendar
 * - Coach modifies session structure in SessionBuilder
 * 
 * Note: This does NOT modify the original template.
 * 
 * @param session - The session to update
 * @param updates - Structure changes to apply
 * @returns Updated session with new structure
 */
export function updateSessionStructure(
    session: WorkoutSession,
    updates: SessionStructureUpdate
): WorkoutSession {
    let exercises = [...session.exercises];

    // Handle reordering
    if (updates.reorderExercises) {
        for (const reorder of updates.reorderExercises) {
            const exercise = exercises.find(e => e.id === reorder.exerciseId);
            if (exercise) {
                exercise.order = reorder.newOrder;
            }
        }
        // Sort by new order
        exercises.sort((a, b) => a.order - b.order);
    }

    // Handle removal
    if (updates.removeExercise) {
        exercises = exercises.filter(e => e.id !== updates.removeExercise!.exerciseId);
        // Reindex orders
        exercises.forEach((e, idx) => { e.order = idx; });
    }

    // Handle adding
    if (updates.addExercise) {
        const newExercise: ExerciseEntry = {
            id: generateId(),
            exerciseId: updates.addExercise.exerciseId,
            order: updates.addExercise.atIndex,
            sets: Array.from({ length: updates.addExercise.sets }, (_, idx) => ({
                id: generateId(),
                setNumber: idx + 1,
                type: 'working' as const,
                isCompleted: false,
            })),
        };
        exercises.splice(updates.addExercise.atIndex, 0, newExercise);
        // Reindex orders
        exercises.forEach((e, idx) => { e.order = idx; });
    }

    // Handle set count update
    if (updates.updateExerciseSets) {
        const exercise = exercises.find(e => e.id === updates.updateExerciseSets!.exerciseId);
        if (exercise) {
            const currentSets = exercise.sets.length;
            const targetSets = updates.updateExerciseSets.sets;

            if (targetSets > currentSets) {
                // Add sets
                for (let i = currentSets; i < targetSets; i++) {
                    exercise.sets.push({
                        id: generateId(),
                        setNumber: i + 1,
                        type: 'working',
                        isCompleted: false,
                    });
                }
            } else if (targetSets < currentSets) {
                // Remove sets (from end, only if not completed)
                exercise.sets = exercise.sets.slice(0, targetSets);
            }
        }
    }

    return {
        ...session,
        exercises,
        updatedAt: new Date().toISOString(),
    };
}

// ============================================
// COMPLETE SESSION
// ============================================

/**
 * Complete a session (transition to completed)
 * 
 * Calculates final stats and sets completedAt
 * 
 * @param session - The in-progress session to complete
 * @returns Updated session with status='completed' and stats
 */
export function completeSession(session: WorkoutSession): WorkoutSession {
    if (session.status !== 'in_progress') {
        console.warn(`Cannot complete session with status '${session.status}'`);
        return session;
    }

    // Calculate totals
    let totalVolume = 0;
    let totalSets = 0;
    let totalReps = 0;

    for (const exercise of session.exercises) {
        for (const set of exercise.sets) {
            if (set.isCompleted) {
                totalSets++;
                totalReps += set.actualReps || 0;
                totalVolume += (set.actualWeight || 0) * (set.actualReps || 0);
            }
        }
    }

    // Calculate duration
    const startedAt = session.startedAt ? new Date(session.startedAt) : new Date();
    const completedAt = new Date();
    const durationMinutes = Math.round((completedAt.getTime() - startedAt.getTime()) / 60000);

    return {
        ...session,
        status: 'completed',
        completedAt: completedAt.toISOString(),
        totalVolume,
        totalSets,
        totalReps,
        durationMinutes,
        updatedAt: completedAt.toISOString(),
    };
}

// ============================================
// UTILITIES
// ============================================

/**
 * Check if session is editable (structure can be changed)
 */
export function isSessionEditable(session: WorkoutSession): boolean {
    return session.status === 'planned';
}

/**
 * Check if session can be started
 */
export function canStartSession(session: WorkoutSession): boolean {
    return session.status === 'planned' && session.exercises.length > 0;
}

/**
 * Get session phase for UI display
 */
export function getSessionPhase(session: WorkoutSession): 'scheduled' | 'active' | 'finished' {
    switch (session.status) {
        case 'planned':
            return 'scheduled';
        case 'in_progress':
            return 'active';
        case 'completed':
        case 'cancelled':
            return 'finished';
        default:
            return 'scheduled';
    }
}
