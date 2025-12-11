/**
 * TRAINING MONITOR - Core Types
 * 
 * PHASE 6: This file now RE-EXPORTS from domain/* modules.
 * Domain modules are the single source of truth.
 * This file exists for backwards compatibility.
 * 
 * New code should import directly from domain/* when possible.
 */

// ============================================
// RE-EXPORTS FROM DOMAIN MODULES
// ============================================

// Athletes
export type {
    UUID,
    Athlete,
    AthleteStats,
    AthleteProgress,
    ExperienceLevel,
    WeightEntry,
    PersonalRecord,
    OneRMSource,
    OneRMHistoryEntry,
    OneRMRecord,
} from '../domain/athletes/types';

export {
    calculateAthleteStats,
    getAthleteActivityStatus,
    filterAthletesByActivity,
    searchAthletes,
} from '../domain/athletes/types';

// Sessions
export type {
    SetType,
    IntervalType,
    IntervalConfig,
    BlockType,
    SetEntry,
    ExerciseEntry,
    SessionBlock,
    SessionStatus,
    SessionOrigin,
    AthleteSessionData,
    WorkoutSession,
} from '../domain/sessions/types';

export {
    calculateSetVolume,
    calculateExerciseVolume,
    calculateSessionTotals,
    canCompleteSession,
    calculateSessionDuration,
    getSessionProgress,
    filterSessionsByStatus,
    filterSessionsByAthlete,
    filterSessionsByDateRange,
    getCompletedSessions,
    sortSessionsByDate,
} from '../domain/sessions/calculations';

// Plans
export type {
    WeekDay,
    TrainingObjective,
    SessionType,
    DayIntensity,
    DayPlan,
    PlanMetadata,
    PlannedSession,
    WeekPlan,
    TrainingPlan,
    WeeklyAdherence,
    PlanAdherence,
    DifficultyLevel,
} from '../domain/plans/types';

export {
    calculatePlanProgress,
    calculateAdherence,
    getCurrentPlanWeek,
    isPlanCurrentlyActive,
    getSessionsForDay,
    calculateWeeklyDistribution,
    isDeloadWeek,
    generateWeekDates,
} from '../domain/plans/types';

// Templates
export type {
    Template,
    TemplateBlock,
    TemplateExercise as DomainTemplateExercise,
} from '../domain/templates/types';

// Exercises  
export type {
    Exercise,
    ExerciseHistory,
    MovementPattern,
    MuscleGroup,
    BodyRegion,
} from '../domain/exercises/types';

export {
    calculateE1RM,
    calculateEpley1RM,
    calculateRelativeIntensity,
    suggestWeightFromPercentage,
    filterExercisesByPattern,
    filterExercisesByMuscleGroup,
    searchExercises,
    getAnchorExercises,
    groupExercisesByPattern,
    getExerciseDisplayInfo,
} from '../domain/exercises/types';

// ============================================
// TYPES UNIQUE TO THIS FILE
// (Not duplicated in domain/*)
// ============================================

import type { SessionStructure } from '../core/sessions/sessionStructure.model';
export type { SessionStructure };

/**
 * @deprecated - Usar MuscleGroup de domain/exercises/types
 * Solo para migración de datos legacy
 */
export type LegacyMuscleGroup =
    | 'chest' | 'back' | 'shoulders' | 'biceps' | 'triceps'
    | 'forearms' | 'core' | 'quads' | 'hamstrings' | 'glutes'
    | 'calves' | 'full_body' | 'cardio';

/**
 * @deprecated - Usar pattern de Exercise
 * Solo para categorización legacy
 */
export type ExerciseCategory =
    | 'strength' | 'hypertrophy' | 'power' | 'endurance'
    | 'mobility' | 'cardio' | 'warmup' | 'cooldown';

// ============================================
// 1RM ANCHOR CONFIG (unique here)
// ============================================

export interface OneRMAnchorConfig {
    anchorExerciseIds: string[];
    referenceMap: Record<string, string[]>;
    groupDefaults: Record<BodyRegion, string[]>;
}

// ============================================
// TEMPLATE EXERCISE (extended version)
// ============================================

import type { Exercise } from '../domain/exercises/types';

export interface TemplateExercise {
    id: string;
    exerciseId: string;
    exercise?: Exercise;
    defaultSets: number;
    defaultReps?: number;
    defaultWeight?: number;
    restSeconds?: number;
    notes?: string;
    order: number;
    isVariableSlot?: boolean;
    variableCategory?: MuscleGroup;
}

// ============================================
// WORKOUT TEMPLATE
// ============================================

export interface WorkoutTemplate {
    id: string;
    name: string;
    description?: string;
    category?: string;
    exercises: TemplateExercise[];
    estimatedDuration?: number;
    difficulty?: DifficultyLevel;
    tags?: string[];
    createdAt: string;
    updatedAt: string;
    isArchived: boolean;
    structure?: SessionStructure;
}

// ============================================
// SETTINGS
// ============================================

export interface Settings {
    language: 'es' | 'en';
    theme: 'dark' | 'light';
    defaultRestSeconds: number;
    weightIncrement: number;
    barbellWeight: number;
    showRPE: boolean;
    showRIR: boolean;
    autoStartRest: boolean;
    vibrateOnRestEnd: boolean;
    compactMode: boolean;
    showWarmupSets: boolean;
    defaultView: 'dashboard' | 'calendar' | 'athletes';
    show1RMHints?: boolean;
    exportFormat: 'json' | 'csv';
    autoBackup: boolean;
    backupFrequency: 'daily' | 'weekly' | 'monthly';
}

// ============================================
// ANALYTICS (unique here)
// ============================================

export interface DailyStats {
    date: string;
    totalSessions: number;
    totalVolume: number;
    totalSets: number;
    totalReps: number;
    totalDuration: number;
    athletesTrainedIds: string[];
}

// ============================================
// INTERNAL LAB
// ============================================

export type LabEntryType = 'feedback' | 'bug' | 'feature' | 'metric' | 'note';

export interface LabEntry {
    id: string;
    type: LabEntryType;
    title: string;
    description?: string;
    priority?: 'low' | 'medium' | 'high';
    status?: 'open' | 'in_progress' | 'resolved';
    metadata?: Record<string, unknown>;
    createdAt: string;
    resolvedAt?: string;
}

export interface UsageEvent {
    id: string;
    event: string;
    context?: string;
    timestamp: string;
    data?: Record<string, unknown>;
}

// ============================================
// CALENDAR
// ============================================

export interface CalendarEvent {
    id: string;
    sessionId?: string;
    athleteId?: string;
    title: string;
    date: string;
    type: 'session' | 'rest' | 'note';
    color?: string;
}

// ============================================
// UTILITY FUNCTIONS (unique here)
// ============================================

/**
 * Mapper: Spanish AI level to DifficultyLevel
 */
export function mapNivelToDifficulty(nivel: string): DifficultyLevel {
    const map: Record<string, DifficultyLevel> = {
        principiante: 'beginner',
        intermedio: 'intermediate',
        avanzado: 'advanced',
    };
    return map[nivel] || 'intermediate';
}

/**
 * Mapper: DifficultyLevel to Spanish for AI prompts
 */
export function mapDifficultyToNivel(difficulty: DifficultyLevel): string {
    const map: Record<DifficultyLevel, string> = {
        beginner: 'principiante',
        intermediate: 'intermedio',
        advanced: 'avanzado',
    };
    return map[difficulty];
}
