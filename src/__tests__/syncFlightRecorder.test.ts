/**
 * Sync Flight Recorder Tests — Phase 26
 * 
 * Verifies circular buffer behavior, persistence, and export.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { syncFlightRecorder } from '../core/observability/syncFlightRecorder';

describe('syncFlightRecorder', () => {
    beforeEach(() => {
        syncFlightRecorder.clear();
    });

    it('records entries and retrieves them', () => {
        syncFlightRecorder.record({
            runId: 'test123',
            phase: 'PUSH',
            event: 'START',
        });

        const entries = syncFlightRecorder.getAll();
        expect(entries).toHaveLength(1);
        expect(entries[0].runId).toBe('test123');
        expect(entries[0].phase).toBe('PUSH');
        expect(entries[0].event).toBe('START');
        expect(entries[0].ts).toBeDefined();
    });

    it('maintains circular buffer limit (100 entries)', () => {
        // Record 120 entries
        for (let i = 0; i < 120; i++) {
            syncFlightRecorder.record({
                runId: `run-${i}`,
                phase: 'PUSH',
                event: 'SUCCESS',
            });
        }

        // Should keep only last 100
        expect(syncFlightRecorder.size).toBe(100);

        // First entry should be run-20 (oldest kept)
        const entries = syncFlightRecorder.getAll();
        expect(entries[0].runId).toBe('run-20');
        expect(entries[99].runId).toBe('run-119');
    });

    it('exports valid JSON', () => {
        syncFlightRecorder.record({
            runId: 'export-test',
            phase: 'PULL',
            event: 'ERROR',
            details: 'Network timeout',
        });

        const json = syncFlightRecorder.exportJson();
        const parsed = JSON.parse(json);

        expect(parsed).toHaveLength(1);
        expect(parsed[0].details).toBe('Network timeout');
    });

    it('clears all entries', () => {
        syncFlightRecorder.record({
            runId: 'clear-test',
            phase: 'CHECK',
            event: 'SUCCESS',
        });

        expect(syncFlightRecorder.size).toBe(1);

        syncFlightRecorder.clear();

        expect(syncFlightRecorder.size).toBe(0);
        expect(syncFlightRecorder.getAll()).toHaveLength(0);
    });

    it('filters entries since a timestamp', () => {
        const now = Date.now();

        syncFlightRecorder.record({
            runId: 'old',
            phase: 'PUSH',
            event: 'SUCCESS',
        });

        // Wait a bit (simulated by directly accessing buffer would be better, but this works)
        const futureTs = now + 1000;

        const recentEntries = syncFlightRecorder.getSince(futureTs);
        expect(recentEntries).toHaveLength(0);

        const allEntries = syncFlightRecorder.getSince(now - 1000);
        expect(allEntries).toHaveLength(1);
    });
});
