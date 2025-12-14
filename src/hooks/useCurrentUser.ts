/**
 * useCurrentUser - Current user context hook
 * 
 * Phase 15C: Provides current user and helper selectors for role-based logic.
 */

import { useTrainingStore } from '../store/store';

/**
 * Get the current authenticated user
 */
export function useCurrentUser() {
    return useTrainingStore((s) => s.currentUser);
}

/**
 * Check if current user is a coach
 */
export function useIsCoach(): boolean {
    const currentUser = useCurrentUser();
    return currentUser?.role === 'coach';
}

/**
 * Check if current user is an athlete
 */
export function useIsAthlete(): boolean {
    const currentUser = useCurrentUser();
    return currentUser?.role === 'athlete';
}

/**
 * Get the current athlete's ID (only for athlete role)
 */
export function useAthleteId(): string | null {
    const currentUser = useCurrentUser();
    return currentUser?.athleteId ?? null;
}

/**
 * Check if authenticated
 */
export function useIsAuthenticated(): boolean {
    return useTrainingStore((s) => s.isAuthenticated);
}
