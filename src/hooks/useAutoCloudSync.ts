/**
 * useAutoCloudSync - Bidirectional cloud sync for coaches
 * 
 * Phase 22B.2: Light auto-sync for coach users only.
 * Phase 22B.2.1: Added isHydrating guard to prevent sync during pull.
 * Phase 22C: Bidirectional sync with server-timestamp comparisons.
 * Phase 22C.1: Fix redundant pull after push by updating baseline.
 * 
 * Cycle:
 * 1. Push: If local has unpushed changes → upload
 * 2. Check: Query server for latest updated_at (lightweight)
 * 3. (If pushed) Update baseline to maxRemoteUpdatedAt → return early
 * 4. Pull: If server is newer AND local is clean → auto-pull
 *    If server is newer AND local is dirty → mark conflict (remoteChangesPending)
 * 
 * Triggers:
 * - Window focus
 * - Tab visibility change (back to visible)
 * - Interval (90 seconds)
 */

import { useEffect, useRef, useCallback } from 'react';
import { useTrainingStore } from '../store/store';
import { isSupabaseConfigured } from '../lib/supabase';
import {
    getCloudSession,
    cloudUploadAllFromStore,
    checkCloudUpdates,
    cloudPullAllToStoreSafe,
} from '../services/cloud/cloudService';
import { syncFlightRecorder, type SyncPhase, type SyncEvent } from '../core/observability/syncFlightRecorder';

// Backoff: Don't retry for 30 seconds after an error
const ERROR_BACKOFF_MS = 30_000;
// Auto-sync interval: 90 seconds (balanced between freshness and server load)
const AUTO_SYNC_INTERVAL_MS = 90 * 1000;
// Phase 26: Watchdog timeout - aborts sync if it hangs (tuned from 30s to 45s)
const WATCHDOG_TIMEOUT_MS = 45 * 1000;

// Phase 24: Dev-only logging helper + Phase 26: Flight Recorder
const isDev = import.meta.env.DEV;
function syncLog(runId: string, phase: string, message: string, data?: unknown) {
    if (isDev) {
        const prefix = `[Sync:${runId.slice(0, 8)}]`;
        if (data !== undefined) {
            console.log(`${prefix} [${phase}] ${message}`, data);
        } else {
            console.log(`${prefix} [${phase}] ${message}`);
        }
    }
}

// Phase 26: Record to flight recorder (always, not just DEV)
function recordSync(
    runId: string,
    phase: SyncPhase,
    event: SyncEvent,
    details?: string,
    durationMs?: number
): void {
    syncFlightRecorder.record({
        runId: runId.slice(0, 8),
        phase,
        event,
        details,
        durationMs,
    });
}

/**
 * Hook that automatically syncs local changes to cloud for coach users.
 * Mount this in AppShell or the protected app root.
 */
export function useAutoCloudSync(): void {
    const currentUser = useTrainingStore((s) => s.currentUser);
    const hasUnpushedChanges = useTrainingStore((s) => s.hasUnpushedChanges);
    const syncStatus = useTrainingStore((s) => s.status);
    const isHydrating = useTrainingStore((s) => s.isHydrating);
    const lastCloudPullAt = useTrainingStore((s) => s.lastCloudPullAt);
    const markPushed = useTrainingStore((s) => s.markPushed);
    const setSyncStatus = useTrainingStore((s) => s.setSyncStatus);
    const setRemoteChangesPending = useTrainingStore((s) => s.setRemoteChangesPending);

    // Track last error time for backoff
    const lastErrorTimeRef = useRef<number>(0);
    // Phase 24: AbortController for cancelling previous sync cycles
    const abortControllerRef = useRef<AbortController | null>(null);

    /**
     * Main sync cycle: Push → Check → Pull (if safe)
     */
    const runSyncCycle = useCallback(async () => {
        // ========================================
        // GUARDS (at start of tick)
        // ========================================

        // Guard: Skip if Supabase not configured (env vars missing)
        if (!isSupabaseConfigured()) {
            return;
        }

        // Guard: Only for coach users
        if (currentUser?.role !== 'coach') {
            return;
        }

        // Guard: Not already syncing (Phase P1.1: Global lock via syncSlice.status)
        if (syncStatus === 'syncing') {
            return;
        }

        // Guard: Must be online
        if (!navigator.onLine) {
            return;
        }

        // Guard: Not during hydration (pull in progress)
        if (isHydrating) {
            return;
        }

        // Guard: Backoff after error
        const now = Date.now();
        if (now - lastErrorTimeRef.current < ERROR_BACKOFF_MS) {
            return;
        }

        // Guard: Must have cloud session
        let hasSession = false;
        try {
            const session = await getCloudSession();
            hasSession = !!session;
        } catch {
            // Can't get session, skip
        }
        if (!hasSession) return;

        // ========================================
        // SYNC CYCLE
        // ========================================

        // Phase 24: Cancel any previous in-flight sync cycle
        if (abortControllerRef.current) {
            syncLog('--', 'ABORT', 'Cancelling previous sync cycle');
            abortControllerRef.current.abort();
        }
        abortControllerRef.current = new AbortController();
        const signal = abortControllerRef.current.signal;
        const syncRunId = crypto.randomUUID();

        // Phase P1.1: Set global lock BEFORE any async work
        setSyncStatus('syncing');
        syncLog(syncRunId, 'START', 'Sync cycle started');
        recordSync(syncRunId, 'OTHER', 'START');
        const cycleStartTime = performance.now();

        // Phase 25 P0.2: Start watchdog timer (Phase 26: tuned to 45s)
        const watchdogTimer = setTimeout(() => {
            syncLog(syncRunId, 'WATCHDOG', 'Timeout after 45s - aborting');
            recordSync(syncRunId, 'OTHER', 'WATCHDOG', 'timeout', performance.now() - cycleStartTime);
            abortControllerRef.current?.abort();
            // Set error status (non-blocking, recoverable)
            setSyncStatus('error', 'Sync timeout - network may be slow');
        }, WATCHDOG_TIMEOUT_MS);

        try {
            const hasDirtyLocal = hasUnpushedChanges();

            // ----------------------------------------
            // STEP 1: Push (if local has unpushed changes)
            // ----------------------------------------
            let didPush = false;
            if (hasDirtyLocal) {
                syncLog(syncRunId, 'PUSH', 'Pushing local changes...');

                const pushResult = await cloudUploadAllFromStore({ signal, runId: syncRunId });

                // Phase 24: Check if aborted after async operation
                if (signal.aborted) {
                    syncLog(syncRunId, 'ABORT', 'Aborted after push');
                    recordSync(syncRunId, 'PUSH', 'ABORT', 'aborted-post-push');
                    return;
                }

                if (pushResult.success) {
                    syncLog(syncRunId, 'PUSH', 'Push complete', pushResult.counts);
                    recordSync(syncRunId, 'PUSH', 'SUCCESS', `count:${Object.values(pushResult.counts).reduce((a, b) => a + b, 0)}`);
                    markPushed();
                    didPush = true;
                } else {
                    syncLog(syncRunId, 'ERROR', 'Push failed', pushResult.error);
                    recordSync(syncRunId, 'PUSH', 'ERROR', pushResult.error);
                    setSyncStatus('error', pushResult.error);
                    lastErrorTimeRef.current = Date.now();
                    return; // Don't continue cycle on push failure
                }
            }

            // ----------------------------------------
            // STEP 2: Check remote for updates
            // ----------------------------------------
            syncLog(syncRunId, 'CHECK', 'Checking remote for updates...');
            const checkResult = await checkCloudUpdates({ signal, runId: syncRunId });

            // Phase 24: Check if aborted after async operation
            if (signal.aborted) {
                syncLog(syncRunId, 'ABORT', 'Aborted after check');
                return;
            }

            if (!checkResult.success) {
                syncLog(syncRunId, 'WARN', 'Check failed', checkResult.error);
                // Non-critical, don't set error status
                setSyncStatus('idle');
                return;
            }

            const { maxRemoteUpdatedAt } = checkResult;

            // If cloud is empty (no data), nothing to pull
            if (!maxRemoteUpdatedAt) {
                setSyncStatus('idle');
                return;
            }

            // ----------------------------------------
            // Phase 22C.1 FIX: After push, update baseline to avoid redundant pull
            // ----------------------------------------
            if (didPush) {
                // We just pushed, so update lastCloudPullAt to server timestamp
                // This prevents the "remote is newer" comparison from triggering a pull
                syncLog(syncRunId, 'BASELINE', 'Post-push baseline update', maxRemoteUpdatedAt);
                useTrainingStore.getState().markPulled(maxRemoteUpdatedAt);
                setRemoteChangesPending(false);
                setSyncStatus('idle');
                syncLog(syncRunId, 'END', 'Cycle complete (push path)');
                return; // End cycle after push + baseline update
            }

            // ----------------------------------------
            // STEP 3: Compare timestamps (server-based)
            // ----------------------------------------
            const isRemoteNewer = (() => {
                if (!lastCloudPullAt) return true; // Never pulled = remote is newer

                try {
                    const remoteTime = new Date(maxRemoteUpdatedAt).getTime();
                    const pullTime = new Date(lastCloudPullAt).getTime();

                    if (isNaN(remoteTime) || isNaN(pullTime)) {
                        console.warn('[AutoCloudSync] Invalid timestamp comparison');
                        return false; // Don't pull on invalid timestamps
                    }

                    // Add small tolerance (2 seconds) for clock skew
                    return remoteTime > (pullTime + 2000);
                } catch {
                    return false;
                }
            })();

            if (!isRemoteNewer) {
                // Already up to date
                setSyncStatus('idle');
                setRemoteChangesPending(false);
                return;
            }

            // ----------------------------------------
            // STEP 4: Auto-pull or mark conflict
            // ----------------------------------------
            const stillDirty = hasUnpushedChanges();

            if (stillDirty) {
                // Conflict: Remote is newer but local has unpushed changes
                // This shouldn't normally happen since we pushed in Step 1,
                // but could occur if push failed or new changes came in during cycle
                syncLog(syncRunId, 'CONFLICT', 'Remote newer but local dirty');
                setRemoteChangesPending(true);
                setSyncStatus('idle');
            } else {
                // Safe to auto-pull: local is clean, remote is newer
                syncLog(syncRunId, 'PULL', 'Remote newer, local clean → auto-pulling');
                setSyncStatus('syncing');

                const pullResult = await cloudPullAllToStoreSafe({ force: false, signal, runId: syncRunId });

                // Phase 24: Check if aborted after async operation
                if (signal.aborted) {
                    syncLog(syncRunId, 'ABORT', 'Aborted after pull');
                    recordSync(syncRunId, 'PULL', 'ABORT', 'aborted-post-pull');
                    return;
                }

                if (pullResult.success) {
                    syncLog(syncRunId, 'PULL', 'Auto-pull complete', pullResult.counts);
                    recordSync(syncRunId, 'PULL', 'SUCCESS', `count:${Object.values(pullResult.counts).reduce((a, b) => a + b, 0)}`, performance.now() - cycleStartTime);
                    // markPulled is called inside cloudPullAllToStoreSafe with server timestamp
                    setRemoteChangesPending(false);
                    syncLog(syncRunId, 'END', 'Cycle complete (pull path)');
                } else if (pullResult.blocked) {
                    // Shouldn't happen since we checked `stillDirty`, but handle gracefully
                    syncLog(syncRunId, 'BLOCKED', 'Pull blocked (race condition)');
                    setRemoteChangesPending(true);
                    setSyncStatus('idle');
                } else {
                    syncLog(syncRunId, 'ERROR', 'Pull failed', pullResult.error);
                    recordSync(syncRunId, 'PULL', 'ERROR', pullResult.error);
                    setSyncStatus('error', pullResult.error);
                    lastErrorTimeRef.current = Date.now();
                }
            }

        } catch (err) {
            // Phase 24: Handle abort gracefully (don't show as error)
            if (err instanceof Error && err.name === 'AbortError') {
                syncLog('--', 'ABORT', 'Sync cycle aborted');
                recordSync(syncRunId, 'OTHER', 'ABORT', 'catch-abort');
                return;
            }
            console.error('[AutoCloudSync] Cycle error:', err);
            recordSync(syncRunId, 'OTHER', 'ERROR', err instanceof Error ? err.message : 'unknown');
            setSyncStatus('error', err instanceof Error ? err.message : 'Unknown error');
            lastErrorTimeRef.current = Date.now();
        } finally {
            // Phase 25 P0.2: Always clear watchdog
            clearTimeout(watchdogTimer);

            // Phase P1.1: Release global lock in finally (only if still 'syncing')
            // This prevents overwriting error status set during the cycle
            const currentStatus = useTrainingStore.getState().status;
            if (currentStatus === 'syncing') {
                setSyncStatus('idle');
            }
        }
    }, [
        currentUser?.role,
        hasUnpushedChanges,
        syncStatus,
        isHydrating,
        lastCloudPullAt,
        markPushed,
        setSyncStatus,
        setRemoteChangesPending,
    ]);

    // Trigger: Window focus
    useEffect(() => {
        const handleFocus = () => {
            runSyncCycle();
        };

        window.addEventListener('focus', handleFocus);
        return () => window.removeEventListener('focus', handleFocus);
    }, [runSyncCycle]);

    // Trigger: Visibility change (back to visible)
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                runSyncCycle();
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, [runSyncCycle]);

    // Trigger: Interval (90 seconds)
    useEffect(() => {
        const interval = setInterval(() => {
            runSyncCycle();
        }, AUTO_SYNC_INTERVAL_MS);

        return () => clearInterval(interval);
    }, [runSyncCycle]);
}

export default useAutoCloudSync;
