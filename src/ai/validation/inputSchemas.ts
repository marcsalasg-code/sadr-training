/**
 * AI Input Validation Schemas - Zod validation for engine inputs
 * 
 * This file contains Zod schemas for validating INPUT data to AI engines.
 * Each schema ensures that engines receive properly formatted data.
 * 
 * Usage:
 * - Import the validation function for the engine
 * - Call it before passing data to the engine
 * - Handle validation errors gracefully with fallbacks
 */

import { z } from 'zod';
import type { Athlete, Exercise, WorkoutSession, WorkoutTemplate, DifficultyLevel } from '../../types/types';

// ============================================
// BASE SCHEMAS (reusable building blocks)
// ============================================

const UUIDSchema = z.string().uuid().or(z.string().min(1)); // Allow both UUID and simple IDs

const AthleteSchema = z.object({
    id: UUIDSchema,
    name: z.string().min(1),
    experienceLevel: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
    currentWeightKg: z.number().positive().optional(),
    oneRMRecords: z.record(z.string(), z.any()).optional(),
}).passthrough(); // Allow additional fields

const ExerciseSchema = z.object({
    id: UUIDSchema,
    name: z.string().min(1),
    muscleGroups: z.array(z.string()).optional(),
    category: z.string().optional(),
}).passthrough();

const SessionSchema = z.object({
    id: UUIDSchema,
    athleteId: UUIDSchema,
    status: z.enum(['reserved', 'planned', 'in_progress', 'completed', 'cancelled']),
    exercises: z.array(z.any()),
}).passthrough();

const SetEntrySchema = z.object({
    id: UUIDSchema,
    setNumber: z.number().int().positive(),
    isCompleted: z.boolean().optional(),
    actualWeight: z.number().optional(),
    actualReps: z.number().int().optional(),
    rpe: z.number().min(1).max(10).optional(),
    intensity: z.number().min(0).max(100).optional(),
}).passthrough();

// ============================================
// SESSION ENGINE INPUT
// ============================================

export const SessionEngineInputSchema = z.object({
    dayPlan: z.object({
        sessionType: z.string(),
        intensity: z.string().optional(),
        focus: z.string().optional(),
    }).passthrough().optional(),
    catalog: z.array(ExerciseSchema).min(1, 'Exercise catalog cannot be empty'),
    athlete: AthleteSchema,
    recentSessions: z.array(SessionSchema).optional(),
    targetLevel: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
});

export type SessionEngineInput = z.infer<typeof SessionEngineInputSchema>;

/**
 * Validate input for SessionEngine
 * Returns cleaned input or throws descriptive error
 */
export function validateSessionEngineInput(input: unknown): SessionEngineInput {
    const result = SessionEngineInputSchema.safeParse(input);
    if (result.success) return result.data;

    console.error('[AI Input Validation] SessionEngine input invalid:', result.error.format());
    throw new Error(`SessionEngine input validation failed: ${result.error.issues.map(i => i.message).join(', ')}`);
}

// ============================================
// WEEKLY PLAN ENGINE INPUT
// ============================================

export const WeeklyPlanEngineInputSchema = z.object({
    athlete: AthleteSchema,
    availability: z.array(z.enum(['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'])).min(1),
    objective: z.enum(['strength', 'hypertrophy', 'endurance', 'weight_loss', 'general_fitness', 'power', 'recomposition', 'technique', 'performance']),
    targetLevel: z.enum(['beginner', 'intermediate', 'advanced']),
    history: z.array(SessionSchema).optional().default([]),
    adherenceHistory: z.number().min(0).max(100).optional().default(0),
    templates: z.array(z.any()).optional().default([]),
    exercises: z.array(ExerciseSchema).optional().default([]),
    currentMicrocycle: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)]).optional(),
    coachNotes: z.string().optional(),
});

export type WeeklyPlanEngineInput = z.infer<typeof WeeklyPlanEngineInputSchema>;

/**
 * Validate input for WeeklyPlanEngine
 */
export function validateWeeklyPlanEngineInput(input: unknown): WeeklyPlanEngineInput {
    const result = WeeklyPlanEngineInputSchema.safeParse(input);
    if (result.success) return result.data;

    console.error('[AI Input Validation] WeeklyPlanEngine input invalid:', result.error.format());
    throw new Error(`WeeklyPlanEngine input validation failed: ${result.error.issues.map(i => i.message).join(', ')}`);
}

// ============================================
// ANALYTICS ENGINE INPUT
// ============================================

export const AnalyticsEngineInputSchema = z.object({
    sessions: z.array(SessionSchema),
    plan: z.any().optional(), // TrainingPlan is complex, allow passthrough
    adherence: z.object({
        completedSessions: z.number().int().min(0),
        plannedSessions: z.number().int().min(0),
        completionRate: z.number().min(0).max(100),
    }).passthrough().optional(),
    exercises: z.array(ExerciseSchema).optional().default([]),
});

export type AnalyticsEngineInput = z.infer<typeof AnalyticsEngineInputSchema>;

/**
 * Validate input for AnalyticsEngine
 */
export function validateAnalyticsEngineInput(input: unknown): AnalyticsEngineInput {
    const result = AnalyticsEngineInputSchema.safeParse(input);
    if (result.success) return result.data;

    console.error('[AI Input Validation] AnalyticsEngine input invalid:', result.error.format());
    throw new Error(`AnalyticsEngine input validation failed: ${result.error.issues.map(i => i.message).join(', ')}`);
}

// ============================================
// PERFORMANCE ENGINE INPUT
// ============================================

export const PerformanceEngineInputSchema = z.object({
    exerciseId: UUIDSchema,
    athlete: AthleteSchema,
    sets: z.array(SetEntrySchema).optional(),
    exercise: ExerciseSchema.optional(),
    targetReps: z.number().int().positive().optional(),
    targetRPE: z.number().min(1).max(10).optional(),
});

export type PerformanceEngineInput = z.infer<typeof PerformanceEngineInputSchema>;

/**
 * Validate input for PerformanceEngine functions
 */
export function validatePerformanceEngineInput(input: unknown): PerformanceEngineInput {
    const result = PerformanceEngineInputSchema.safeParse(input);
    if (result.success) return result.data;

    console.error('[AI Input Validation] PerformanceEngine input invalid:', result.error.format());
    throw new Error(`PerformanceEngine input validation failed: ${result.error.issues.map(i => i.message).join(', ')}`);
}

// ============================================
// ONE RM ENGINE INPUT
// ============================================

export const OneRMEngineInputSchema = z.object({
    exerciseId: UUIDSchema,
    athlete: AthleteSchema,
    sets: z.array(SetEntrySchema),
    exercise: ExerciseSchema.optional(),
    athleteWeightKg: z.number().positive().optional(),
});

export type OneRMEngineInput = z.infer<typeof OneRMEngineInputSchema>;

/**
 * Validate input for OneRMEngine functions
 */
export function validateOneRMEngineInput(input: unknown): OneRMEngineInput {
    const result = OneRMEngineInputSchema.safeParse(input);
    if (result.success) return result.data;

    console.error('[AI Input Validation] OneRMEngine input invalid:', result.error.format());
    throw new Error(`OneRMEngine input validation failed: ${result.error.issues.map(i => i.message).join(', ')}`);
}

// ============================================
// GENERIC SAFE VALIDATION (returns null instead of throwing)
// ============================================

/**
 * Safe validation that returns null on failure instead of throwing
 */
export function safeValidate<T>(
    schema: z.ZodSchema<T>,
    data: unknown,
    engineName: string
): T | null {
    const result = schema.safeParse(data);
    if (result.success) return result.data;

    console.warn(`[AI Input Validation] ${engineName} received invalid input, using fallback`);
    return null;
}
