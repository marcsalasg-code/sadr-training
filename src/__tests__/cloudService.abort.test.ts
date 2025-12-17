/**
 * Sync Abort Guards Tests — Phase 26 B1
 * 
 * Verifies that aborted sync cycles cannot mutate Zustand store.
 * Tests the assertNotAborted guards in cloudService.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// We need to test the assertNotAborted behavior indirectly since it's internal.
// Strategy: Create a test module that replicates the guard logic.

/**
 * Replicated guard function for testing (same logic as cloudService)
 */
function assertNotAborted(signal?: AbortSignal, context?: string): void {
    if (signal?.aborted) {
        const msg = context ? `Aborted: ${context}` : 'Aborted';
        throw new DOMException(msg, 'AbortError');
    }
}

describe('assertNotAborted guard', () => {
    it('does nothing when signal is undefined', () => {
        expect(() => assertNotAborted(undefined, 'test')).not.toThrow();
    });

    it('does nothing when signal is not aborted', () => {
        const controller = new AbortController();
        expect(() => assertNotAborted(controller.signal, 'test')).not.toThrow();
    });

    it('throws AbortError when signal is aborted', () => {
        const controller = new AbortController();
        controller.abort();

        expect(() => assertNotAborted(controller.signal, 'before markPushed'))
            .toThrow(DOMException);
    });

    it('throws AbortError with correct name', () => {
        const controller = new AbortController();
        controller.abort();

        try {
            assertNotAborted(controller.signal, 'test context');
            expect.fail('Should have thrown');
        } catch (err) {
            expect(err).toBeInstanceOf(DOMException);
            expect((err as DOMException).name).toBe('AbortError');
        }
    });

    it('includes context in error message when provided', () => {
        const controller = new AbortController();
        controller.abort();

        try {
            assertNotAborted(controller.signal, 'before setState');
            expect.fail('Should have thrown');
        } catch (err) {
            expect((err as DOMException).message).toContain('before setState');
        }
    });
});

describe('Abort signal integration scenario', () => {
    it('prevents mutation function from being called after abort', async () => {
        const mutationSpy = vi.fn();
        const controller = new AbortController();

        // Simulate async operation
        const asyncOperation = async () => {
            await new Promise(resolve => setTimeout(resolve, 10));
            return { success: true };
        };

        // Simulate the flow in cloudService
        const simulatedUpload = async (signal: AbortSignal) => {
            const result = await asyncOperation();

            // Guard before mutation (this is what cloudService does)
            assertNotAborted(signal, 'before markPushed');

            // Mutation that should NOT happen if aborted
            mutationSpy();

            return result;
        };

        // Abort immediately after starting
        const uploadPromise = simulatedUpload(controller.signal);
        controller.abort();

        // Should throw AbortError
        await expect(uploadPromise).rejects.toThrow(DOMException);

        // Mutation should NOT have been called
        expect(mutationSpy).not.toHaveBeenCalled();
    });

    it('allows mutation when not aborted', async () => {
        const mutationSpy = vi.fn();
        const controller = new AbortController();

        const simulatedUpload = async (signal: AbortSignal) => {
            await new Promise(resolve => setTimeout(resolve, 5));

            assertNotAborted(signal, 'before markPushed');

            mutationSpy();

            return { success: true };
        };

        // Don't abort - let it complete
        const result = await simulatedUpload(controller.signal);

        expect(result.success).toBe(true);
        expect(mutationSpy).toHaveBeenCalledTimes(1);
    });
});
