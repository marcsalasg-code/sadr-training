/**
 * Sessions Slice - Zustand slice for workout session management
 */

import type { StateCreator } from 'zustand';
import type { WorkoutSession, UUID } from '../types/types';

// ============================================
// HELPERS
// ============================================

const generateId = (): UUID => crypto.randomUUID();
const now = (): string => new Date().toISOString();

// ============================================
// SLICE INTERFACE
// ============================================

export interface SessionsSlice {
    sessions: WorkoutSession[];
    activeSessionId: UUID | null;
    addSession: (session: Omit<WorkoutSession, 'id' | 'createdAt' | 'updatedAt'>) => WorkoutSession;
    updateSession: (id: UUID, updates: Partial<WorkoutSession>) => void;
    deleteSession: (id: UUID) => void;
    getSession: (id: UUID) => WorkoutSession | undefined;
    getSessionsByAthlete: (athleteId: UUID) => WorkoutSession[];
    getSessionsByDate: (date: string) => WorkoutSession[];
    setActiveSession: (id: UUID | null) => void;
}

// ============================================
// SLICE CREATOR
// ============================================

export const createSessionsSlice: StateCreator<
    SessionsSlice,
    [],
    [],
    SessionsSlice
> = (set, get) => ({
    sessions: [],
    activeSessionId: null,

    addSession: (sessionData) => {
        const session: WorkoutSession = {
            ...sessionData,
            id: generateId(),
            createdAt: now(),
            updatedAt: now(),
        };
        set((state) => ({ sessions: [...state.sessions, session] }));
        return session;
    },

    updateSession: (id, updates) => {
        set((state) => ({
            sessions: state.sessions.map((s) =>
                s.id === id ? { ...s, ...updates, updatedAt: now() } : s
            ),
        }));
    },

    deleteSession: (id) => {
        set((state) => ({
            sessions: state.sessions.filter((s) => s.id !== id),
        }));
    },

    getSession: (id) => get().sessions.find((s) => s.id === id),

    getSessionsByAthlete: (athleteId) =>
        get().sessions.filter((s) => s.athleteId === athleteId),

    getSessionsByDate: (date) =>
        get().sessions.filter((s) => s.scheduledDate?.startsWith(date)),

    setActiveSession: (id) => {
        set({ activeSessionId: id });
    },
});
