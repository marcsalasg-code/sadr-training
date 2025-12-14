/**
 * useNavigation - Navigation state hook
 * 
 * Phase 13: Computes navigation tree with active states using custom matchers.
 * Injects Live Session dynamically when a session is in_progress (Option A).
 */

import { useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { useSessions, useTrainingStore } from '../store/store';
import { NAV_GROUPS, createLiveSessionItem, type NavItemConfig } from '../config';

// =============================================================================
// TYPES
// =============================================================================

export interface NavItemRuntime extends NavItemConfig {
    isActive: boolean;
}

export interface NavGroupRuntime {
    title: string;
    items: NavItemRuntime[];
}

// =============================================================================
// HOOK
// =============================================================================

export function useNavigation(): NavGroupRuntime[] {
    const location = useLocation();
    const sessions = useSessions();
    // Phase 15: Use currentUser.role instead of roleMode for real auth
    const currentUser = useTrainingStore((state) => state.currentUser);
    const role = currentUser?.role || 'coach'; // Default to coach if not logged in

    // Parse search params from location
    const searchParams = useMemo(
        () => new URLSearchParams(location.search),
        [location.search]
    );

    // Find active live session (status === 'in_progress')
    const activeLiveSession = useMemo(
        () => sessions.find((s) => s.status === 'in_progress'),
        [sessions]
    );

    // Build navigation tree with computed isActive states
    const navGroups = useMemo(() => {
        // Start with base groups, computing isActive for each item
        const baseGroups: NavGroupRuntime[] = NAV_GROUPS.map((group) => ({
            title: group.title,
            items: group.items.map((item) => ({
                ...item,
                isActive: item.matcher(location.pathname, searchParams),
            })),
        }));

        // Filter groups based on role
        const filteredGroups = baseGroups.filter((group) => {
            // Athlete mode: hide coach-only groups
            if (role === 'athlete') {
                // Hide Sistema (Dev Lab, Settings advanced)
                if (group.title === 'Sistema') return false;
                // Hide Planificación (sessions, templates, exercises, calendar)
                if (group.title === 'Planificación') return false;
                // Hide Gestión (athletes list)
                if (group.title === 'Gestión') return false;
            }
            return true;
        });

        // Inject Live Session (Option A: only if in_progress exists)
        if (activeLiveSession) {
            const liveItem = createLiveSessionItem(activeLiveSession.id);
            const liveItemRuntime: NavItemRuntime = {
                ...liveItem,
                isActive: liveItem.matcher(location.pathname, searchParams),
            };

            // Find "Día a día" group and insert after Dashboard
            const dayGroup = filteredGroups.find((g) => g.title === 'Día a día');
            if (dayGroup) {
                // Insert at position 1 (after Dashboard at position 0)
                dayGroup.items.splice(1, 0, liveItemRuntime);
            }
        }

        return filteredGroups;
    }, [location.pathname, searchParams, sessions, activeLiveSession, role]);

    return navGroups;
}
