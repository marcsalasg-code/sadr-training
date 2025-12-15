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
// TRAINING TYPE & SESSION GOAL (Phase 17A)
// ============================================

/**
 * TrainingType - Modality/style of training (session-level)
 * Describes the overall approach or discipline.
 */
export type TrainingType =
    | 'strength'        // Powerlifting / Strongman style
    | 'hypertrophy'     // Bodybuilding / muscle growth focus
    | 'power'           // Olympic lifting / explosive
    | 'calisthenics'    // Bodyweight training
    | 'functional'      // Functional fitness / CrossFit-style
    | 'conditioning'    // Metabolic / HIIT
    | 'mobility'        // Recovery / flexibility
    | 'hybrid'          // Mixed approaches
    | 'other';          // Uncategorized

/**
 * SessionGoal - Intent of today's session
 * Describes the specific objective for this workout.
 */
export type SessionGoal =
    | 'heavy_load'      // High intensity (>85% 1RM)
    | 'volume'          // Volume accumulation
    | 'technique'       // Skill / technique focus
    | 'recovery'        // Active recovery / deload
    | 'assessment';     // PR testing / 1RM assessment

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

    // Phase 17A: Training taxonomy
    trainingType?: TrainingType;
    sessionGoal?: SessionGoal;
}

// Re-export SessionStructure for convenience
export type { SessionStructure };
