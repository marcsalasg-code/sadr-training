/**
 * Athlete Types
 * 
 * Canonical type definitions for athletes and related data.
 * All athlete-related types should be defined here.
 */

import type { UUID } from '../shared';

// Re-export UUID for backward compatibility
export type { UUID };

// ============================================
// EXPERIENCE & RECORDS
// ============================================

export type ExperienceLevel = 'novice' | 'beginner' | 'intermediate' | 'advanced' | 'elite';

export interface WeightEntry {
    date: string;
    weightKg: number;
    notes?: string;
}

export interface PersonalRecord {
    exerciseId: string;
    weight: number;
    reps: number;
    estimated1RM: number;
    date: string;
    sessionId?: string;
}

// ============================================
// 1RM SYSTEM
// ============================================

export type OneRMSource = 'manual' | 'estimated' | 'ai_suggested';

export interface OneRMHistoryEntry {
    date: string;
    value: number;
    source: OneRMSource;
    sessionId?: string;
}

export interface OneRMRecord {
    exerciseId: string;
    currentOneRM: number;
    source: OneRMSource;
    lastUpdate: string;
    history?: OneRMHistoryEntry[];
    strengthFocusSessions?: number;
}

// ============================================
// ATHLETE TYPE
// ============================================

export interface Athlete {
    id: UUID;
    name: string;
    email?: string;
    phone?: string;
    birthDate?: string;
    gender?: 'male' | 'female' | 'other';
    avatarUrl?: string;
    notes?: string;
    goals?: string;
    injuries?: string;
    createdAt: string;
    updatedAt: string;
    isActive: boolean;

    // Physical Data
    heightCm?: number;
    currentWeightKg?: number;
    experienceLevel?: ExperienceLevel;
    weightHistory?: WeightEntry[];
    personalRecords?: Record<string, PersonalRecord>;
    customFields?: Record<string, string | number | boolean>;

    // 1RM System
    oneRMRecords?: Record<string, OneRMRecord>;
}

// ============================================
// STATS TYPES
// ============================================

export interface AthleteStats {
    athleteId?: UUID;
    totalSessions: number;
    completedSessions?: number;
    totalVolume: number;
    totalSets?: number;
    avgSessionDuration?: number;
    lastSessionDate: string | null;
    averageSessionDuration?: number;
    weeklyFrequency?: number;
    favoriteExercises?: { exerciseId: UUID; count: number }[];
    progressByExercise?: {
        exerciseId: UUID;
        initialMax: number;
        currentMax: number;
        percentChange: number;
    }[];
}

export interface AthleteProgress {
    volumeTrend: 'up' | 'down' | 'stable';
    frequencyTrend: 'up' | 'down' | 'stable';
    strengthTrends: Record<string, 'up' | 'down' | 'stable'>;
}

// ============================================
// PURE FUNCTIONS
// ============================================

/**
 * Calculate athlete stats from sessions
 */
export function calculateAthleteStats(
    sessions: Array<{
        athleteId: string;
        status: string;
        totalVolume?: number;
        totalSets?: number;
        duration?: number;
        completedAt?: string;
    }>,
    athleteId: string
): AthleteStats {
    const athleteSessions = sessions.filter(s => s.athleteId === athleteId);
    const completed = athleteSessions.filter(s => s.status === 'completed');

    const totalVolume = completed.reduce((sum, s) => sum + (s.totalVolume || 0), 0);
    const totalSets = completed.reduce((sum, s) => sum + (s.totalSets || 0), 0);
    const totalDuration = completed.reduce((sum, s) => sum + (s.duration || 0), 0);

    const sortedByDate = completed
        .filter(s => s.completedAt)
        .sort((a, b) => new Date(b.completedAt!).getTime() - new Date(a.completedAt!).getTime());

    // Calculate weekly frequency (last 4 weeks)
    const fourWeeksAgo = new Date();
    fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);
    const recentSessions = completed.filter(
        s => s.completedAt && new Date(s.completedAt) >= fourWeeksAgo
    );
    const weeklyFrequency = recentSessions.length / 4;

    return {
        athleteId,
        totalSessions: athleteSessions.length,
        completedSessions: completed.length,
        totalVolume,
        totalSets,
        avgSessionDuration: completed.length > 0 ? totalDuration / completed.length : 0,
        lastSessionDate: sortedByDate[0]?.completedAt || null,
        weeklyFrequency: Math.round(weeklyFrequency * 10) / 10,
    };
}

/**
 * Determine athlete activity status
 */
export function getAthleteActivityStatus(lastSessionDate: string | null): 'active' | 'inactive' | 'new' {
    if (!lastSessionDate) return 'new';

    const daysSinceLastSession = Math.floor(
        (Date.now() - new Date(lastSessionDate).getTime()) / (1000 * 60 * 60 * 24)
    );

    return daysSinceLastSession <= 14 ? 'active' : 'inactive';
}

/**
 * Filter athletes by activity status
 */
export function filterAthletesByActivity(
    athletes: Athlete[],
    status: 'all' | 'active' | 'inactive'
): Athlete[] {
    if (status === 'all') return athletes;
    return athletes.filter(a => a.isActive === (status === 'active'));
}

/**
 * Search athletes by name/email
 */
export function searchAthletes(athletes: Athlete[], query: string): Athlete[] {
    if (!query.trim()) return athletes;
    const lower = query.toLowerCase();
    return athletes.filter(
        a => a.name.toLowerCase().includes(lower) ||
            a.email?.toLowerCase().includes(lower)
    );
}
