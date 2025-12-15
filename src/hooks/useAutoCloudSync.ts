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

// Backoff: Don't retry for 30 seconds after an error
const ERROR_BACKOFF_MS = 30_000;
// Auto-sync interval: 90 seconds (balanced between freshness and server load)
const AUTO_SYNC_INTERVAL_MS = 90 * 1000;

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
    // Track if sync cycle is in progress
    const isSyncingRef = useRef<boolean>(false);

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

        // Guard: Not already syncing
        if (syncStatus === 'syncing' || isSyncingRef.current) {
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

        isSyncingRef.current = true;

        try {
            const hasDirtyLocal = hasUnpushedChanges();

            // ----------------------------------------
            // STEP 1: Push (if local has unpushed changes)
            // ----------------------------------------
            let didPush = false;
            if (hasDirtyLocal) {
                setSyncStatus('syncing');
                console.log('[AutoCloudSync] Pushing local changes...');

                const pushResult = await cloudUploadAllFromStore();

                if (pushResult.success) {
                    console.log('[AutoCloudSync] Push complete:', pushResult.counts);
                    markPushed();
                    didPush = true;
                } else {
                    console.warn('[AutoCloudSync] Push failed:', pushResult.error);
                    setSyncStatus('error', pushResult.error);
                    lastErrorTimeRef.current = Date.now();
                    return; // Don't continue cycle on push failure
                }
            }

            // ----------------------------------------
            // STEP 2: Check remote for updates
            // ----------------------------------------
            const checkResult = await checkCloudUpdates();

            if (!checkResult.success) {
                console.warn('[AutoCloudSync] Check failed:', checkResult.error);
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
                console.log('[AutoCloudSync] Post-push: updating baseline to', maxRemoteUpdatedAt);
                useTrainingStore.getState().markPulled(maxRemoteUpdatedAt);
                setRemoteChangesPending(false);
                setSyncStatus('idle');
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
                console.log('[AutoCloudSync] Remote newer but local dirty → marking conflict');
                setRemoteChangesPending(true);
                setSyncStatus('idle');
            } else {
                // Safe to auto-pull: local is clean, remote is newer
                console.log('[AutoCloudSync] Remote newer, local clean → auto-pulling...');
                setSyncStatus('syncing');

                const pullResult = await cloudPullAllToStoreSafe({ force: false });

                if (pullResult.success) {
                    console.log('[AutoCloudSync] Auto-pull complete:', pullResult.counts);
                    // markPulled is called inside cloudPullAllToStoreSafe with server timestamp
                    setRemoteChangesPending(false);
                } else if (pullResult.blocked) {
                    // Shouldn't happen since we checked `stillDirty`, but handle gracefully
                    console.log('[AutoCloudSync] Pull blocked (race condition) → marking conflict');
                    setRemoteChangesPending(true);
                    setSyncStatus('idle');
                } else {
                    console.warn('[AutoCloudSync] Pull failed:', pullResult.error);
                    setSyncStatus('error', pullResult.error);
                    lastErrorTimeRef.current = Date.now();
                }
            }

        } catch (err) {
            console.error('[AutoCloudSync] Cycle error:', err);
            setSyncStatus('error', err instanceof Error ? err.message : 'Unknown error');
            lastErrorTimeRef.current = Date.now();
        } finally {
            isSyncingRef.current = false;
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
