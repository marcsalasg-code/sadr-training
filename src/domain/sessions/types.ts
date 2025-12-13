/**
 * Domain Layer - Sessions
 * 
 * Canonical session types - single source of truth.
 * Session Types
 * 
 * Canonical type definitions for workout sessions.
 * This is the SINGLE SOURCE OF TRUTH for session-related types.
 */

import type { UUID } from '../shared';

// Re-export UUID for backward compatibility
export type { UUID };

import type { SessionStructure } from '../../core/sessions/sessionStructure.model';

// ============================================
// SET TYPES
// ============================================

export type SetType = 'warmup' | 'working' | 'dropset' | 'failure' | 'rest_pause' | 'emom' | 'amrap' | 'tabata' | 'tempo' | 'isometric';

export type IntervalType = 'emom' | 'amrap' | 'tabata' | 'custom_interval';

export interface IntervalConfig {
    type: IntervalType;
    workSeconds: number;
    restSeconds?: number;
    totalMinutes?: number;
    roundsTarget?: number;
    roundsCompleted?: number;
    extraReps?: number;
    tempo?: string;
    holdSeconds?: number;
}

export type BlockType =
    | 'movilidad_calentamiento'
    | 'fuerza'
    | 'tecnica_especifica'
    | 'emom_hiit';

// ============================================
// SET ENTRY
// ============================================

export interface SetEntry {
    id: UUID;
    setNumber: number;
    type: SetType;
    targetReps?: number;
    actualReps?: number;
    targetWeight?: number;
    actualWeight?: number;
    rpe?: number;
    rir?: number;
    restSeconds?: number;
    notes?: string;
    completedAt?: string;
    isCompleted: boolean;
    intervalConfig?: IntervalConfig;
    intensity?: number;
    blockId?: string;
}

// ============================================
// EXERCISE ENTRY
// ============================================

export interface ExerciseEntry {
    id: UUID;
    exerciseId: UUID;
    exerciseName?: string;
    sets: SetEntry[];
    notes?: string;
    order: number;
    blockType?: BlockType;
    orderWithinBlock?: number;
    durationSeconds?: number;
    strengthFocus?: boolean;
    blockId?: string;
    restSeconds?: number;
}

// ============================================
// SESSION BLOCK (for structured sessions)
// ============================================

export interface SessionBlock {
    id: string;
    name: string;
    type: 'warmup' | 'main' | 'accessory' | 'cooldown';
    order: number;
    exerciseIds: string[];
}

// ============================================
// SESSION STATUS & ORIGIN
// ============================================

export type SessionStatus = 'reserved' | 'planned' | 'in_progress' | 'completed' | 'cancelled';
export type SessionOrigin = 'plan' | 'manual' | 'ai_suggestion';

// ============================================
// MULTI-ATHLETE DATA
// ============================================

export interface AthleteSessionData {
    athleteId: UUID;
    exercises: ExerciseEntry[];
    totalVolume?: number;
    totalSets?: number;
    totalReps?: number;
    notes?: string;
    rating?: number;
}

// ============================================
// WORKOUT SESSION
// ============================================

export interface WorkoutSession {
    id: UUID;
    athleteId: UUID;
    templateId?: UUID;
    name: string;
    description?: string;
    scheduledDate?: string;
    startedAt?: string;
    completedAt?: string;
    status: SessionStatus;
    exercises: ExerciseEntry[];
    notes?: string;
    rating?: number;
    totalVolume?: number;
    totalSets?: number;
    totalReps?: number;
    durationMinutes?: number;
    createdAt: string;
    updatedAt: string;

    // Intensity/Fatigue monitoring
    preSessionFatigue?: number | null;
    avgIntensity?: number | null;

    // Multi-athlete
    athleteData?: AthleteSessionData[];
    isMultiAthlete?: boolean;

    // Origin tracking
    origin?: SessionOrigin;

    // Session structure
    structure?: SessionStructure;
}

// Re-export SessionStructure for convenience
export type { SessionStructure };
