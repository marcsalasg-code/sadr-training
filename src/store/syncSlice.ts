/**
 * Sync Slice - Tracks synchronization state
 * 
 * Phase 22B: Minimal sync state for safe pull operations.
 * Phase 22B.2: Added hydration guards to prevent false dirty states.
 * Phase 22C: Added remoteChangesPending for conflict-aware sync.
 * Tracks when data was last pulled/pushed and if local mutations exist.
 */

import type { StateCreator } from 'zustand';

// ============================================
// TYPES
// ============================================

export type SyncStatus = 'idle' | 'syncing' | 'error';
export type HydrationSource = 'cloud' | 'rehydrate' | null;

export interface SyncState {
    /** ISO timestamp of last successful cloud pull */
    lastCloudPullAt: string | null;
    /** ISO timestamp of last successful cloud push */
    lastCloudPushAt: string | null;
    /** ISO timestamp of last local mutation (add/update/delete) */
    lastLocalMutationAt: string | null;
    /** Current sync operation status */
    status: SyncStatus;
    /** Last error message if status is 'error' */
    lastError: string | null;
    /** Phase 22B.2: True during hydration (cloud pull or rehydrate) - NOT persisted */
    isHydrating: boolean;
    /** Phase 22B.2: Source of current hydration - NOT persisted */
    hydrationSource: HydrationSource;
    /** Phase 22C: True if cloud has newer changes but local is dirty - NOT persisted */
    remoteChangesPending: boolean;
}

export interface SyncActions {
    /** Mark that a local mutation occurred (call after add/update/delete) */
    markLocalMutation: () => void;
    /** Set sync status (idle, syncing, error) */
    setSyncStatus: (status: SyncStatus, error?: string | null) => void;
    /** Mark successful pull from cloud (optionally with server timestamp as baseline) */
    markPulled: (remoteTimestamp?: string) => void;
    /** Mark successful push to cloud */
    markPushed: () => void;
    /** Check if there are unpushed local changes */
    hasUnpushedChanges: () => boolean;
    /** Phase 22B.2: Begin hydration (suspends dirty tracking) */
    beginHydration: (source: 'cloud' | 'rehydrate') => void;
    /** Phase 22B.2: End hydration (resumes dirty tracking) */
    endHydration: () => void;
    /** Phase 22B.2: Check if dirty tracking should be skipped */
    shouldSkipDirtyTracking: () => boolean;
    /** Phase 22C: Set remote changes pending flag */
    setRemoteChangesPending: (pending: boolean) => void;
}

export type SyncSlice = SyncState & SyncActions;

// ============================================
// INITIAL STATE
// ============================================

const initialSyncState: SyncState = {
    lastCloudPullAt: null,
    lastCloudPushAt: null,
    lastLocalMutationAt: null,
    status: 'idle',
    lastError: null,
    isHydrating: false,
    hydrationSource: null,
    remoteChangesPending: false,
};

// ============================================
// SLICE CREATOR
// ============================================

export const createSyncSlice: StateCreator<SyncSlice, [], [], SyncSlice> = (set, get, _api) => ({
    ...initialSyncState,

    markLocalMutation: () => {
        // Phase 22B.2: Skip if hydrating (cloud pull or rehydrate)
        if (get().isHydrating) {
            return;
        }
        set({
            lastLocalMutationAt: new Date().toISOString(),
        });
    },

    setSyncStatus: (status, error = null) => {
        set({
            status,
            lastError: error,
        });
    },

    // Phase 22C: markPulled now accepts optional server timestamp as baseline
    markPulled: (remoteTimestamp?: string) => {
        set({
            // Use server timestamp if provided, otherwise fallback to local time
            lastCloudPullAt: remoteTimestamp || new Date().toISOString(),
            status: 'idle',
            lastError: null,
            // Clear remote pending flag on successful pull
            remoteChangesPending: false,
        });
    },

    markPushed: () => {
        set({
            lastCloudPushAt: new Date().toISOString(),
            status: 'idle',
            lastError: null,
        });
    },

    hasUnpushedChanges: () => {
        const { lastLocalMutationAt, lastCloudPushAt } = get();

        // No local mutations ever = no unpushed changes
        if (!lastLocalMutationAt) return false;

        // Local mutation exists but never pushed = unpushed changes
        if (!lastCloudPushAt) return true;

        // Compare timestamps (with safety for invalid dates)
        try {
            const localTime = new Date(lastLocalMutationAt).getTime();
            const pushTime = new Date(lastCloudPushAt).getTime();

            // Guard against NaN from invalid dates
            if (isNaN(localTime) || isNaN(pushTime)) {
                console.warn('[SyncSlice] Invalid timestamp detected, assuming unpushed changes');
                return true;
            }

            return localTime > pushTime;
        } catch {
            // If parsing fails, assume there are unpushed changes (safer)
            return true;
        }
    },

    // Phase 22B.2: Hydration control
    beginHydration: (source) => {
        set({
            isHydrating: true,
            hydrationSource: source,
        });
    },

    endHydration: () => {
        set({
            isHydrating: false,
            hydrationSource: null,
        });
    },

    shouldSkipDirtyTracking: () => {
        return get().isHydrating;
    },

    // Phase 22C: Remote changes pending control
    setRemoteChangesPending: (pending) => {
        set({ remoteChangesPending: pending });
    },
});
