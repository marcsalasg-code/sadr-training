/**
 * Cloud Service - Manual Upload/Pull to Supabase
 * 
 * Phase 22A: Manual sync operations for cross-device data transfer.
 * Supabase is the source of truth; Zustand is the local cache.
 */

import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { useTrainingStore } from '../../store/store';
import { syncFlightRecorder } from '../../core/observability/syncFlightRecorder';
import type { Athlete } from '../../domain/athletes/types';
import type { WorkoutSession } from '../../domain/sessions/types';
import type { Exercise } from '../../domain/exercises/types';
import type { WorkoutTemplate } from '../../types/types';

// ============================================
// TYPES (Phase 27: Options with runId for tracing)
// ============================================

export interface CloudServiceOptions {
    signal?: AbortSignal;
    runId?: string;
}

// ============================================
// ABORT SIGNAL HELPER (Phase 25 P0.1)
// ============================================

/**
 * Throws AbortError if signal is aborted.
 * Call this BEFORE any state mutation to prevent stale cycle from applying changes.
 */
function assertNotAborted(signal?: AbortSignal, context?: string): void {
    if (signal?.aborted) {
        const msg = context ? `Aborted: ${context}` : 'Aborted';
        throw new DOMException(msg, 'AbortError');
    }
}

/**
 * Phase 27: Record error to flight recorder with context.
 */
function recordError(
    runId: string | undefined,
    phase: 'PUSH' | 'CHECK' | 'PULL' | 'OTHER',
    source: 'network' | 'auth' | 'data' | 'unknown',
    message: string
): void {
    syncFlightRecorder.record({
        runId: runId?.slice(0, 8) || 'service',
        phase,
        event: 'ERROR',
        source,
        details: message.slice(0, 100),
    });
}

// ============================================
// TYPES
// ============================================

interface CloudUploadResult {
    success: boolean;
    counts: {
        athletes: number;
        sessions: number;
        templates: number;
        exercises: number;
    };
    error?: string;
}

interface CloudPullResult {
    success: boolean;
    counts: {
        athletes: number;
        sessions: number;
        templates: number;
        exercises: number;
    };
    error?: string;
}

// ============================================
// HELPER: Get current user ID
// ============================================

async function getCoachId(): Promise<string | null> {
    const { data: { user } } = await supabase.auth.getUser();
    return user?.id ?? null;
}

// ============================================
// Phase 22C: Check Cloud Updates (Lightweight)
// Returns max updated_at from server without downloading data
// ============================================

export interface CloudUpdatesCheckResult {
    success: boolean;
    /** Max updated_at across all critical tables (server timestamp) */
    maxRemoteUpdatedAt: string | null;
    /** Per-table latest timestamps for debugging */
    perTable?: Record<string, string | null>;
    error?: string;
}

/**
 * Check for cloud updates by querying only updated_at timestamps.
 * This is a lightweight check that doesn't download the full data JSONB.
 * 
 * @param options - Optional signal and runId for tracing
 * @returns The maximum updated_at across critical tables (athletes, sessions, templates)
 */
export async function checkCloudUpdates(options?: CloudServiceOptions): Promise<CloudUpdatesCheckResult> {
    const { signal, runId } = options || {};
    // Guard: Skip if Supabase not configured
    if (!isSupabaseConfigured()) {
        return { success: false, maxRemoteUpdatedAt: null, error: 'Cloud no configurado' };
    }

    const coachId = await getCoachId();
    if (!coachId) {
        return { success: false, maxRemoteUpdatedAt: null, error: 'No authenticated user' };
    }

    const criticalTables = ['athletes', 'sessions', 'templates'] as const;
    const perTable: Record<string, string | null> = {};

    try {
        // Query each critical table for its latest updated_at
        const results = await Promise.all(
            criticalTables.map(async (table) => {
                const { data, error } = await supabase
                    .from(table)
                    .select('updated_at')
                    .is('deleted_at', null)
                    .order('updated_at', { ascending: false })
                    .limit(1);

                if (error) {
                    throw new Error(`${table}: ${error.message}`);
                }

                const latestTimestamp = data?.[0]?.updated_at ?? null;
                perTable[table] = latestTimestamp;
                return latestTimestamp;
            })
        );

        // Find the maximum timestamp across all tables
        const validTimestamps = results.filter((t): t is string => t !== null);

        let maxRemoteUpdatedAt: string | null = null;
        if (validTimestamps.length > 0) {
            maxRemoteUpdatedAt = validTimestamps.reduce((max, current) => {
                return new Date(current) > new Date(max) ? current : max;
            });
        }

        return {
            success: true,
            maxRemoteUpdatedAt,
            perTable,
        };

    } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        recordError(runId, 'CHECK', 'network', message);
        return {
            success: false,
            maxRemoteUpdatedAt: null,
            error: message,
        };
    }
}

// ============================================
// UPLOAD: Local -> Cloud
// ============================================

export async function cloudUploadAllFromStore(options?: CloudServiceOptions): Promise<CloudUploadResult> {
    const { signal, runId } = options || {};

    // Guard: Skip if Supabase not configured
    if (!isSupabaseConfigured()) {
        return { success: false, counts: { athletes: 0, sessions: 0, templates: 0, exercises: 0 }, error: 'Cloud no configurado' };
    }

    const coachId = await getCoachId();
    if (!coachId) {
        return { success: false, counts: { athletes: 0, sessions: 0, templates: 0, exercises: 0 }, error: 'No authenticated user' };
    }

    const state = useTrainingStore.getState();
    const counts = { athletes: 0, sessions: 0, templates: 0, exercises: 0 };

    try {
        // Upload Athletes
        if (state.athletes.length > 0) {
            const athleteRows = state.athletes.map((a: Athlete) => ({
                id: a.id,
                coach_id: coachId,
                pin: a.pin || null,
                name: a.name,
                data: { ...a, id: undefined, name: undefined, pin: undefined }, // Store rest in data
                updated_at: a.updatedAt || new Date().toISOString(),
            }));

            const { error } = await supabase
                .from('athletes')
                .upsert(athleteRows, { onConflict: 'id' });

            if (error) throw new Error(`Athletes: ${error.message}`);
            counts.athletes = athleteRows.length;
        }

        // Upload Sessions
        if (state.sessions.length > 0) {
            const sessionRows = state.sessions.map((s: WorkoutSession) => ({
                id: s.id,
                coach_id: coachId,
                athlete_id: s.athleteId || null,
                status: s.status,
                date: s.scheduledDate || null,
                data: { ...s, id: undefined, athleteId: undefined, status: undefined, scheduledDate: undefined },
                updated_at: s.updatedAt || new Date().toISOString(),
            }));

            const { error } = await supabase
                .from('sessions')
                .upsert(sessionRows, { onConflict: 'id' });

            if (error) throw new Error(`Sessions: ${error.message}`);
            counts.sessions = sessionRows.length;
        }

        // Upload Templates
        if (state.templates.length > 0) {
            const templateRows = state.templates.map((t: WorkoutTemplate) => ({
                id: t.id,
                coach_id: coachId,
                data: t,
                updated_at: t.updatedAt || new Date().toISOString(),
            }));

            const { error } = await supabase
                .from('templates')
                .upsert(templateRows, { onConflict: 'id' });

            if (error) throw new Error(`Templates: ${error.message}`);
            counts.templates = templateRows.length;
        }

        // Upload Exercises
        if (state.exercises.length > 0) {
            const exerciseRows = state.exercises.map((e: Exercise) => ({
                id: e.id,
                coach_id: coachId,
                data: e,
                updated_at: e.updatedAt || new Date().toISOString(),
            }));

            const { error } = await supabase
                .from('exercises')
                .upsert(exerciseRows, { onConflict: 'id' });

            if (error) throw new Error(`Exercises: ${error.message}`);
            counts.exercises = exerciseRows.length;
        }

        // Phase 25 P0.1: Check abort before mutating state
        assertNotAborted(signal, 'before markPushed');

        // Mark pushed in sync state
        useTrainingStore.getState().markPushed();

        return { success: true, counts };

    } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        recordError(runId, 'PUSH', 'network', message);
        useTrainingStore.getState().setSyncStatus('error', message);
        return { success: false, counts, error: message };
    }
}

// ============================================
// PULL: Cloud -> Local (Non-destructive)
// Phase 22B.2: Atomic snapshot with per-table error handling
// ============================================

interface TableFetchResult<T> {
    table: string;
    success: boolean;
    data: T[];
    error?: string;
    critical: boolean;
}

async function fetchTable<T>(
    tableName: string,
    critical: boolean
): Promise<TableFetchResult<T>> {
    try {
        const { data, error } = await supabase
            .from(tableName)
            .select('*')
            .is('deleted_at', null);

        if (error) {
            return { table: tableName, success: false, data: [], error: error.message, critical };
        }

        return { table: tableName, success: true, data: data || [], critical };
    } catch (err) {
        return {
            table: tableName,
            success: false,
            data: [],
            error: err instanceof Error ? err.message : 'Unknown error',
            critical,
        };
    }
}

export async function cloudPullAllToStore(options: { force?: boolean; signal?: AbortSignal; runId?: string } = {}): Promise<CloudPullResult> {
    const { force = false, signal, runId } = options;
    const coachId = await getCoachId();
    if (!coachId) {
        return { success: false, counts: { athletes: 0, sessions: 0, templates: 0, exercises: 0 }, error: 'No authenticated user' };
    }

    const counts = { athletes: 0, sessions: 0, templates: 0, exercises: 0 };
    const store = useTrainingStore.getState();

    // Phase 25 P0.1: Check abort before hydration
    assertNotAborted(signal, 'before beginHydration');

    // Phase 22B.2: Begin hydration to prevent dirty tracking
    store.beginHydration('cloud');

    try {
        // Fetch all tables in parallel using Promise.all
        const [athletesResult, sessionsResult, templatesResult, exercisesResult] = await Promise.all([
            fetchTable<{ id: string; name: string; pin: string | null; data: Record<string, unknown>; updated_at: string }>('athletes', true),
            fetchTable<{ id: string; athlete_id: string | null; status: string; date: string | null; data: Record<string, unknown>; updated_at: string }>('sessions', true),
            fetchTable<{ id: string; data: Record<string, unknown>; updated_at: string }>('templates', true),
            fetchTable<{ id: string; data: Record<string, unknown>; updated_at: string }>('exercises', false),
        ]);

        // Check for critical table failures
        const criticalResults = [athletesResult, sessionsResult, templatesResult];
        const criticalFailures = criticalResults.filter(r => !r.success);

        if (criticalFailures.length > 0) {
            const errorMessages = criticalFailures.map(r => `${r.table}: ${r.error}`).join('; ');
            console.error('[CloudService] Critical table fetch failed:', errorMessages);
            store.endHydration();
            store.setSyncStatus('error', `Error fetching: ${errorMessages}`);
            return { success: false, counts, error: errorMessages };
        }

        // Phase 22B.2: Check for suspiciously empty cloud response
        const cloudTotalRows = athletesResult.data.length + sessionsResult.data.length + templatesResult.data.length;
        const localHasData = store.athletes.length > 0 || store.sessions.length > 0 || store.templates.length > 0;

        if (cloudTotalRows === 0 && localHasData && !force) {
            console.warn('[CloudService] Empty cloud detected with local data present. Aborting to protect local data.');
            store.endHydration();
            return {
                success: false,
                counts,
                error: 'El cloud está vacío pero tienes datos locales. Usa "forzar" para sobrescribir.',
            };
        }

        // Transform data
        const athletes: Athlete[] = athletesResult.data.map((row) => ({
            ...row.data,
            id: row.id,
            name: row.name,
            pin: row.pin,
            updatedAt: row.updated_at,
        } as Athlete));
        counts.athletes = athletes.length;

        const sessions: WorkoutSession[] = sessionsResult.data.map((row) => ({
            ...row.data,
            id: row.id,
            athleteId: row.athlete_id,
            status: row.status,
            scheduledDate: row.date,
            updatedAt: row.updated_at,
        } as WorkoutSession));
        counts.sessions = sessions.length;

        const templates: WorkoutTemplate[] = templatesResult.data.map((row) => ({
            ...row.data,
            id: row.id,
            updatedAt: row.updated_at,
        } as WorkoutTemplate));
        counts.templates = templates.length;

        const exercises: Exercise[] = exercisesResult.success
            ? exercisesResult.data.map((row) => ({
                ...row.data,
                id: row.id,
                updatedAt: row.updated_at,
            } as Exercise))
            : store.exercises; // Keep existing exercises if fetch failed (non-critical)
        counts.exercises = exercisesResult.success ? exercises.length : 0;

        // Phase 25 P0.1: Check abort before major state mutation
        assertNotAborted(signal, 'before setState');

        // Hydrate Zustand store with atomic snapshot
        useTrainingStore.setState({
            athletes,
            sessions,
            templates,
            exercises,
        }, false);

        // Phase 22C: Compute max updated_at from pulled data for server-timestamp baseline
        const allTimestamps: string[] = [
            ...athletesResult.data.map(r => r.updated_at),
            ...sessionsResult.data.map(r => r.updated_at),
            ...templatesResult.data.map(r => r.updated_at),
        ].filter((t): t is string => !!t);

        let maxRemoteTimestamp: string | undefined;
        if (allTimestamps.length > 0) {
            maxRemoteTimestamp = allTimestamps.reduce((max, cur) =>
                new Date(cur) > new Date(max) ? cur : max
            );
        }

        // Phase 25 P0.1: Check abort before markPulled
        assertNotAborted(signal, 'before markPulled');

        // Mark pulled in sync state with server timestamp baseline
        store.markPulled(maxRemoteTimestamp);

        return { success: true, counts };

    } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        recordError(runId, 'PULL', 'network', message);
        store.setSyncStatus('error', message);
        return { success: false, counts, error: message };
    } finally {
        // Phase 22B.2: Always end hydration
        useTrainingStore.getState().endHydration();
    }
}

// ============================================
// SAFE PULL: Checks for unpushed changes first
// ============================================

export interface SafePullOptions {
    /** Force pull even if there are unpushed local changes */
    force?: boolean;
    /** AbortSignal to cancel operation */
    signal?: AbortSignal;
    /** Phase 27: RunId for tracing */
    runId?: string;
}

export interface SafePullResult extends CloudPullResult {
    /** True if pull was blocked due to unpushed changes */
    blocked?: boolean;
}

/**
 * Safe version of pull that checks for unpushed local changes.
 * - If no unpushed changes: performs pull normally
 * - If unpushed changes exist and force=false: blocks and returns blocked=true
 * - If unpushed changes exist and force=true: performs pull (destructive)
 */
export async function cloudPullAllToStoreSafe(options: SafePullOptions = {}): Promise<SafePullResult> {
    const { force = false, signal, runId } = options;
    const store = useTrainingStore.getState();

    // Check for unpushed local changes
    const hasUnpushed = store.hasUnpushedChanges();

    // If store is empty, there's nothing to lose, so allow pull
    const isStoreEmpty = store.athletes.length === 0 && store.sessions.length === 0;

    if (hasUnpushed && !isStoreEmpty && !force) {
        return {
            success: false,
            blocked: true,
            counts: { athletes: 0, sessions: 0, templates: 0, exercises: 0 },
            error: 'Tienes cambios locales sin subir. Sube primero o fuerza la descarga.',
        };
    }

    // Set syncing status
    store.setSyncStatus('syncing');

    // Perform the actual pull (pass force, signal, and runId for tracing)
    const result = await cloudPullAllToStore({ force, signal, runId });

    return { ...result, blocked: false };
}

// ============================================
// HELPERS
// ============================================

/**
 * Check if the local store is empty (no critical data)
 * 
 * Phase 22B.1: More robust check - athletes, sessions, AND templates
 * A device is considered "empty" if it has no primary entities at all.
 */
export function isStoreEmpty(): boolean {
    const state = useTrainingStore.getState();
    return (
        state.athletes.length === 0 &&
        state.sessions.length === 0 &&
        state.templates.length === 0
    );
}

// ============================================
// AUTH STATE HELPERS
// ============================================

export async function getCloudSession() {
    // Guard: Skip if Supabase not configured
    if (!isSupabaseConfigured()) {
        return null;
    }

    const { data: { session } } = await supabase.auth.getSession();
    return session;
}

export async function cloudLogout() {
    // Guard: Skip if Supabase not configured
    if (!isSupabaseConfigured()) {
        return;
    }

    await supabase.auth.signOut();
}

// ============================================
// DEBUG HELPERS (for console verification)
// ============================================

/**
 * Debug function to check dirty tracking state.
 * Use in console: import { __debugDirtyTrackingCheck } from './services/cloud/cloudService'; __debugDirtyTrackingCheck()
 * 
 * Or directly in console after import:
 * - window.__debugDirtyTracking = () => { const s = window.__TRAINING_STORE?.getState(); return { lastLocalMutationAt: s?.lastLocalMutationAt, lastCloudPushAt: s?.lastCloudPushAt, hasUnpushedChanges: s?.hasUnpushedChanges?.() }; }
 */
export function __debugDirtyTrackingCheck() {
    const s = useTrainingStore.getState();
    return {
        lastLocalMutationAt: s.lastLocalMutationAt,
        lastCloudPushAt: s.lastCloudPushAt,
        lastCloudPullAt: s.lastCloudPullAt,
        hasUnpushedChanges: s.hasUnpushedChanges?.() ?? null,
        syncStatus: s.status,
        storeEmpty: isStoreEmpty(),
        counts: {
            athletes: s.athletes.length,
            sessions: s.sessions.length,
            templates: s.templates.length,
        },
    };
}
