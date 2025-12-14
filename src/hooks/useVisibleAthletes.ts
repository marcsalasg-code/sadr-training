/**
 * useVisibleAthletes - Role-filtered athletes hook
 * 
 * Phase 15C: Returns athletes visible to the current user.
 * - Coach: All athletes
 * - Athlete: Only themselves
 */

import { useMemo } from 'react';
import { useAthletes } from '../store/store';
import { useCurrentUser } from './useCurrentUser';

/**
 * Get athletes visible to the current user
 */
export function useVisibleAthletes() {
    const currentUser = useCurrentUser();
    const allAthletes = useAthletes();

    return useMemo(() => {
        // Not authenticated - return empty
        if (!currentUser) return [];

        // Coach sees all athletes
        if (currentUser.role === 'coach') {
            return allAthletes;
        }

        // Athlete sees only themselves
        if (currentUser.role === 'athlete' && currentUser.athleteId) {
            const self = allAthletes.find(a => a.id === currentUser.athleteId);
            return self ? [self] : [];
        }

        return [];
    }, [currentUser, allAthletes]);
}

/**
 * Get the current athlete's profile (for athlete role)
 */
export function useMyProfile() {
    const currentUser = useCurrentUser();
    const allAthletes = useAthletes();

    return useMemo(() => {
        if (!currentUser?.athleteId) return null;
        return allAthletes.find(a => a.id === currentUser.athleteId) ?? null;
    }, [currentUser?.athleteId, allAthletes]);
}
