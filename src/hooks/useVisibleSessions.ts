/**
 * useVisibleSessions - Role-filtered sessions hook
 * 
 * Phase 15C: Returns sessions visible to the current user.
 * - Coach: All sessions
 * - Athlete: Only their sessions
 */

import { useMemo } from 'react';
import { useSessions } from '../store/store';
import { useCurrentUser } from './useCurrentUser';

/**
 * Get sessions visible to the current user
 */
export function useVisibleSessions() {
    const currentUser = useCurrentUser();
    const allSessions = useSessions();

    return useMemo(() => {
        // Not authenticated or no user - return empty for safety
        if (!currentUser) return [];

        // Coach sees all sessions
        if (currentUser.role === 'coach') {
            return allSessions;
        }

        // Athlete sees only their sessions
        if (currentUser.role === 'athlete' && currentUser.athleteId) {
            return allSessions.filter(s => s.athleteId === currentUser.athleteId);
        }

        // Fallback: empty (safety)
        return [];
    }, [currentUser, allSessions]);
}

/**
 * Get the athlete's active (in_progress) session
 */
export function useMyActiveSession() {
    const sessions = useVisibleSessions();
    return useMemo(
        () => sessions.find(s => s.status === 'in_progress'),
        [sessions]
    );
}

/**
 * Get the athlete's upcoming sessions (planned/reserved, sorted by date)
 */
export function useMyUpcomingSessions(limit?: number) {
    const sessions = useVisibleSessions();

    return useMemo(() => {
        const now = new Date();
        const upcoming = sessions
            .filter(s =>
                (s.status === 'planned' || s.status === 'reserved') &&
                s.scheduledDate &&
                new Date(s.scheduledDate) >= now
            )
            .sort((a, b) =>
                new Date(a.scheduledDate!).getTime() - new Date(b.scheduledDate!).getTime()
            );

        return limit ? upcoming.slice(0, limit) : upcoming;
    }, [sessions, limit]);
}

/**
 * Get the athlete's completed sessions count
 */
export function useMyCompletedSessionsCount() {
    const sessions = useVisibleSessions();
    return useMemo(
        () => sessions.filter(s => s.status === 'completed').length,
        [sessions]
    );
}

/**
 * Get the athlete's recent completed sessions (for history display)
 * Phase 19C: For AthleteHome history section
 */
export function useMyRecentCompletedSessions(limit = 5) {
    const sessions = useVisibleSessions();

    return useMemo(() => {
        return sessions
            .filter(s => s.status === 'completed')
            .sort((a, b) => {
                const dateA = a.completedAt || a.scheduledDate || '';
                const dateB = b.completedAt || b.scheduledDate || '';
                return new Date(dateB).getTime() - new Date(dateA).getTime();
            })
            .slice(0, limit);
    }, [sessions, limit]);
}
