/**
 * Sync Flight Recorder — Phase 26 Observability
 * 
 * Minimal in-memory logging for sync diagnostics.
 * - Circular buffer (max 100 entries)
 * - Persists to localStorage only on ERROR/WATCHDOG
 * - No PII (no athlete names, no session content)
 */

// ============================================
// TYPES
// ============================================

export type SyncPhase = 'PUSH' | 'CHECK' | 'PULL' | 'OTHER';
export type SyncEvent = 'START' | 'SUCCESS' | 'ERROR' | 'ABORT' | 'WATCHDOG';
export type SyncSource = 'watchdog' | 'abort' | 'network' | 'auth' | 'data' | 'unknown';

export interface SyncLogEntry {
    ts: number;
    runId: string;
    phase: SyncPhase;
    event: SyncEvent;
    source?: SyncSource;
    details?: string;
    durationMs?: number;
}

// ============================================
// CONSTANTS
// ============================================

const MAX_BUFFER_SIZE = 100;
const STORAGE_KEY = 'sadr_sync_flight_recorder';

// ============================================
// FLIGHT RECORDER SINGLETON
// ============================================

class SyncFlightRecorder {
    private buffer: SyncLogEntry[] = [];

    constructor() {
        // Attempt to restore from localStorage on init (for post-crash analysis)
        this.restoreFromStorage();
    }

    /**
     * Record a sync event
     */
    record(entry: Omit<SyncLogEntry, 'ts'>): void {
        const fullEntry: SyncLogEntry = {
            ...entry,
            ts: Date.now(),
        };

        this.buffer.push(fullEntry);

        // Circular buffer: remove oldest if over limit
        if (this.buffer.length > MAX_BUFFER_SIZE) {
            this.buffer.shift();
        }

        // Persist on error events (for post-crash diagnosis)
        if (entry.event === 'ERROR' || entry.event === 'WATCHDOG') {
            this.persistToStorage();
        }
    }

    /**
     * Get all recorded entries
     */
    getAll(): SyncLogEntry[] {
        return [...this.buffer];
    }

    /**
     * Get entries since a specific timestamp
     */
    getSince(sinceTs: number): SyncLogEntry[] {
        return this.buffer.filter(e => e.ts >= sinceTs);
    }

    /**
     * Clear all entries
     */
    clear(): void {
        this.buffer = [];
        try {
            localStorage.removeItem(STORAGE_KEY);
        } catch {
            // localStorage not available
        }
    }

    /**
     * Export as JSON string (for clipboard copy)
     */
    exportJson(): string {
        return JSON.stringify(this.buffer, null, 2);
    }

    /**
     * Get buffer size
     */
    get size(): number {
        return this.buffer.length;
    }

    // ============================================
    // PRIVATE METHODS
    // ============================================

    private persistToStorage(): void {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(this.buffer));
        } catch {
            // localStorage not available or quota exceeded
        }
    }

    private restoreFromStorage(): void {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                const parsed = JSON.parse(stored);
                if (Array.isArray(parsed)) {
                    this.buffer = parsed.slice(-MAX_BUFFER_SIZE);
                }
            }
        } catch {
            // Ignore parse errors
        }
    }
}

// ============================================
// SINGLETON EXPORT
// ============================================

export const syncFlightRecorder = new SyncFlightRecorder();

// ============================================
// DEV EXPOSURE (window.__SADR_SYNC_LOGS__)
// ============================================

if (typeof window !== 'undefined' && import.meta.env?.DEV) {
    (window as unknown as Record<string, unknown>).__SADR_SYNC_LOGS__ = () => syncFlightRecorder.getAll();
    (window as unknown as Record<string, unknown>).__SADR_SYNC_EXPORT__ = () => syncFlightRecorder.exportJson();
}
