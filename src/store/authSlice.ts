/**
 * Auth Slice - Zustand slice for authentication
 * 
 * Phase 15A: Local PIN-based authentication with role separation.
 * - Coach: Uses hardcoded PIN (default "0000")
 * - Athlete: Uses PIN stored in athlete.pin field
 */

import type { StateCreator } from 'zustand';

// ============================================
// TYPES
// ============================================

export type AuthRole = 'coach' | 'athlete';

export interface CurrentUser {
    id: string;
    role: AuthRole;
    athleteId?: string; // Only set if role === 'athlete'
    name: string;
}

export interface AuthSlice {
    // State
    currentUser: CurrentUser | null;
    isAuthenticated: boolean;
    coachPin: string; // Configurable coach PIN

    // Actions
    login: (pin: string, athletes: Array<{ id: string; name: string; pin?: string }>) => boolean;
    logout: () => void;
    setCoachPin: (pin: string) => void;

    // Quick login for development
    devLoginAsCoach: () => void;
    devLoginAsAthlete: (athleteId: string, athleteName: string) => void;
}

// ============================================
// CONSTANTS
// ============================================

const DEFAULT_COACH_PIN = '0000';
const COACH_USER: CurrentUser = {
    id: 'coach-1',
    role: 'coach',
    name: 'Coach',
};

// ============================================
// SLICE CREATOR
// ============================================

export const createAuthSlice: StateCreator<
    AuthSlice,
    [],
    [],
    AuthSlice
> = (set, get) => ({
    currentUser: null,
    isAuthenticated: false,
    coachPin: DEFAULT_COACH_PIN,

    login: (pin, athletes) => {
        const { coachPin } = get();

        // Check coach PIN first
        if (pin === coachPin) {
            set({
                currentUser: COACH_USER,
                isAuthenticated: true,
            });
            return true;
        }

        // Check athlete PINs
        const matchingAthlete = athletes.find(a => a.pin === pin && a.pin !== undefined && a.pin !== '');
        if (matchingAthlete) {
            set({
                currentUser: {
                    id: `athlete-${matchingAthlete.id}`,
                    role: 'athlete',
                    athleteId: matchingAthlete.id,
                    name: matchingAthlete.name,
                },
                isAuthenticated: true,
            });
            return true;
        }

        return false;
    },

    logout: () => {
        set({
            currentUser: null,
            isAuthenticated: false,
        });
    },

    setCoachPin: (pin) => {
        if (pin.length >= 4) {
            set({ coachPin: pin });
        }
    },

    // Development helpers
    devLoginAsCoach: () => {
        set({
            currentUser: COACH_USER,
            isAuthenticated: true,
        });
    },

    devLoginAsAthlete: (athleteId, athleteName) => {
        set({
            currentUser: {
                id: `athlete-${athleteId}`,
                role: 'athlete',
                athleteId,
                name: athleteName,
            },
            isAuthenticated: true,
        });
    },
});
