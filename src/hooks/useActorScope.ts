/**
 * useActorScope - Centralized Actor Scope Hook
 * 
 * Phase 18: Provides a single source of truth for "who is the active actor".
 * - Coach: actorAthleteId is null (can select any athlete)
 * - Athlete: actorAthleteId is forced to currentUser.athleteId
 * 
 * This hook should be used by all views/hooks that need to scope data by athlete.
 */

import { useMemo } from 'react';
import { useCurrentUser } from './useCurrentUser';

type Role = 'coach' | 'athlete';

export interface ActorScope {
    /** Current user role */
    role: Role;
    /** True if current user is an athlete */
    isAthlete: boolean;
    /** True if current user is a coach */
    isCoach: boolean;
    /** 
     * The athlete ID for scoping data:
     * - If athlete: their athleteId (forced)
     * - If coach: null (can select any or 'all')
     */
    actorAthleteId: string | null;
}

/**
 * Get the actor scope based on current user role.
 * Use this to determine data filtering and UI visibility.
 */
export function useActorScope(): ActorScope {
    const currentUser = useCurrentUser();

    return useMemo(() => {
        const role: Role = (currentUser?.role as Role) ?? 'coach';
        const isAthlete = role === 'athlete';
        const isCoach = role === 'coach';

        // If athlete, force actorAthleteId to their ID
        const actorAthleteId = isAthlete ? (currentUser?.athleteId ?? null) : null;

        return { role, isAthlete, isCoach, actorAthleteId };
    }, [currentUser]);
}

export default useActorScope;
