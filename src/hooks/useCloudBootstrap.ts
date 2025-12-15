/**
 * useCloudBootstrap - Auto-pull on app start when store is empty
 * 
 * Phase 22B: Automatically downloads cloud data when:
 * 1. Supabase is configured
 * 2. User has an active cloud session
 * 3. Local store is empty (no athletes)
 * 
 * This fixes the "iPhone empty store" problem where users see no data
 * after login because localStorage is isolated per device.
 */

import { useEffect, useRef, useState } from 'react';
import { isSupabaseConfigured } from '../lib/supabase';
import {
    getCloudSession,
    cloudPullAllToStoreSafe,
    isStoreEmpty,
} from '../services/cloud/cloudService';
import { useTrainingStore } from '../store/store';

export type BootstrapStatus = 'idle' | 'checking' | 'syncing' | 'done' | 'no-session' | 'error';

export interface CloudBootstrapState {
    status: BootstrapStatus;
    error: string | null;
}

/**
 * Hook that automatically pulls cloud data when the app starts
 * and the local store is empty.
 * 
 * Mount this in your app root (App.tsx or AppShell).
 */
export function useCloudBootstrap(): CloudBootstrapState {
    const [status, setStatus] = useState<BootstrapStatus>('idle');
    const [error, setError] = useState<string | null>(null);
    const hasRunRef = useRef(false);

    // Watch athletes to detect if store is empty
    const athleteCount = useTrainingStore((s) => s.athletes.length);

    useEffect(() => {
        // Only run once per mount
        if (hasRunRef.current) return;

        // Skip if Supabase not configured
        if (!isSupabaseConfigured()) {
            setStatus('idle');
            return;
        }

        // Skip if store already has data
        if (!isStoreEmpty()) {
            setStatus('done');
            return;
        }

        // Start the bootstrap process
        hasRunRef.current = true;
        setStatus('checking');

        async function bootstrap() {
            try {
                // Check for cloud session
                const session = await getCloudSession();

                if (!session) {
                    setStatus('no-session');
                    return;
                }

                // Has session + empty store = auto-pull
                console.log('[CloudBootstrap] Empty store detected, auto-pulling from cloud...');
                setStatus('syncing');

                const result = await cloudPullAllToStoreSafe({ force: true });

                if (result.success) {
                    console.log('[CloudBootstrap] Auto-pull complete:', result.counts);
                    setStatus('done');
                } else {
                    setError(result.error || 'Unknown error');
                    setStatus('error');
                }
            } catch (err) {
                console.error('[CloudBootstrap] Error:', err);
                setError(err instanceof Error ? err.message : 'Bootstrap error');
                setStatus('error');
            }
        }

        bootstrap();
    }, [athleteCount]); // Re-check if athlete count changes from 0

    return { status, error };
}

export default useCloudBootstrap;
