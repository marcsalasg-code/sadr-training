/**
 * AIOrchestrator - Unified entry point for AI engine calls
 * 
 * ARCHITECTURE NOTES:
 * This is a minimal viable orchestrator that:
 * 1. Provides a single entry point for AI engine calls
 * 2. Validates inputs before passing to engines
 * 3. Handles errors gracefully with fallbacks
 * 4. Prepares the codebase for future AI enhancements
 * 
 * In future phases, this will:
 * - Coordinate multiple engine calls
 * - Implement caching for frequent predictions
 * - Add retry logic and rate limiting
 * - Support remote AI provider calls
 */

import {
    validateSessionEngineInput,
    validateWeeklyPlanEngineInput,
    validateAnalyticsEngineInput,
    validatePerformanceEngineInput,
    safeValidate,
    SessionEngineInputSchema,
    WeeklyPlanEngineInputSchema,
    type SessionEngineInput,
    type WeeklyPlanEngineInput,
    type AnalyticsEngineInput,
} from './validation/inputSchemas';

import { generateWeeklyPlan, convertToDayPlans } from './engines/weeklyPlanEngine';
import { calculateWeeklyAnalytics, compareWeeks } from './engines/analyticsEngine';
import { generateLoadSuggestion, detectOvertraining, type OvertrainingIndicator } from './performance/performanceEngine';

import type {
    Athlete,
    Exercise,
    WorkoutSession,
    WorkoutTemplate,
    DayPlan,
    WeeklyAdherence,
    TrainingPlan,
} from '../types/types';

// ============================================
// TYPES
// ============================================

export interface OrchestratorResult<T> {
    success: boolean;
    data?: T;
    error?: string;
    validationPassed: boolean;
}

export interface WeeklyPlanResult {
    weekStructure: ReturnType<typeof generateWeeklyPlan>['weekStructure'];
    dayPlans: DayPlan[];
    metadata: ReturnType<typeof generateWeeklyPlan>['metadata'];
    notes: string[];
}

export interface AnalyticsResult {
    weeklyScore: number;
    volumeDeviation: number;
    trends: ReturnType<typeof calculateWeeklyAnalytics>['trends'];
    recommendations: string[];
}

export interface PerformanceCheckResult {
    overtraining: OvertrainingIndicator | null;
    loadSuggestion: ReturnType<typeof generateLoadSuggestion> | null;
}

// ============================================
// ORCHESTRATOR CLASS
// ============================================

class AIOrchestrator {
    private static instance: AIOrchestrator;

    private constructor() {
        // Private constructor for singleton
    }

    public static getInstance(): AIOrchestrator {
        if (!AIOrchestrator.instance) {
            AIOrchestrator.instance = new AIOrchestrator();
        }
        return AIOrchestrator.instance;
    }

    // ============================================
    // WEEKLY PLAN GENERATION
    // ============================================

    /**
     * Generate a weekly training plan with validation
     */
    public generateWeeklyPlan(input: {
        athlete: Athlete;
        availability: WeeklyPlanEngineInput['availability'];
        objective: WeeklyPlanEngineInput['objective'];
        targetLevel: WeeklyPlanEngineInput['targetLevel'];
        history?: WorkoutSession[];
        adherenceHistory?: number;
        templates?: WorkoutTemplate[];
        exercises?: Exercise[];
        currentMicrocycle?: 1 | 2 | 3 | 4;
        coachNotes?: string;
    }): OrchestratorResult<WeeklyPlanResult> {
        try {
            // Validate input
            const validatedInput = validateWeeklyPlanEngineInput(input);

            // Call engine - cast to WeeklyPlanInput as validated input may have stricter types
            const planOutput = generateWeeklyPlan(validatedInput as any);
            const dayPlans = convertToDayPlans(planOutput);

            return {
                success: true,
                validationPassed: true,
                data: {
                    weekStructure: planOutput.weekStructure,
                    dayPlans,
                    metadata: planOutput.metadata,
                    notes: planOutput.notes,
                },
            };
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            console.error('[AIOrchestrator] generateWeeklyPlan failed:', message);

            return {
                success: false,
                validationPassed: false,
                error: message,
            };
        }
    }

    // ============================================
    // ANALYTICS CALCULATION
    // ============================================

    /**
     * Calculate weekly analytics with validation
     */
    public analyzePerformance(input: {
        sessions: WorkoutSession[];
        plan?: TrainingPlan;
        adherence?: WeeklyAdherence;
        exercises?: Exercise[];
    }): OrchestratorResult<AnalyticsResult> {
        try {
            // Validate input (soft validation for analytics)
            const validatedInput = safeValidate(
                // Using a relaxed schema for analytics
                WeeklyPlanEngineInputSchema.pick({}).passthrough(),
                input,
                'AnalyticsEngine'
            );

            // Analytics engine is more forgiving with inputs
            const analytics = calculateWeeklyAnalytics(
                input.sessions,
                input.plan,
                input.adherence || {
                    completedSessions: 0,
                    plannedSessions: 0,
                    completionRate: 0,
                    planned: 0,
                    completed: 0,
                    percentage: 0,
                    volumeTarget: 0,
                    volumeActual: 0,
                    volumeDeviation: 0,
                } as any,
                input.exercises || []
            );

            return {
                success: true,
                validationPassed: true,
                data: {
                    weeklyScore: analytics.weeklyScore,
                    volumeDeviation: analytics.volumeDeviation,
                    trends: analytics.trends,
                    recommendations: analytics.recommendations,
                },
            };
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            console.error('[AIOrchestrator] analyzePerformance failed:', message);

            return {
                success: false,
                validationPassed: false,
                error: message,
            };
        }
    }

    // ============================================
    // PERFORMANCE CHECK (Overtraining + Load)
    // ============================================

    /**
     * Check performance metrics with validation
     */
    public checkPerformance(input: {
        weeklyVolumes: number[];
        recentIntensity: number[];
        sessionsPerWeek: number;
        averageIntensity: number;
        exerciseId?: string;
        targetReps?: number;
        targetRPE?: number;
        athlete?: Athlete;
        exercises?: Exercise[];
    }): OrchestratorResult<PerformanceCheckResult> {
        try {
            // Detect overtraining - calculate average from intensity array
            const avgRecentIntensity = input.recentIntensity.length > 0
                ? input.recentIntensity.reduce((a, b) => a + b, 0) / input.recentIntensity.length
                : 7;
            const overtraining = detectOvertraining(
                input.weeklyVolumes,
                avgRecentIntensity,
                input.sessionsPerWeek,
                input.averageIntensity
            );

            // Generate load suggestion if context provided
            let loadSuggestion = null;
            if (input.exerciseId && input.targetReps && input.targetRPE && input.athlete) {
                const anchorConfig = undefined; // Can be passed from store
                loadSuggestion = generateLoadSuggestion(
                    input.exerciseId,
                    input.targetReps,
                    input.targetRPE,
                    {
                        athlete: input.athlete,
                        exercises: input.exercises || [],
                        anchorConfig,
                    }
                );
            }

            return {
                success: true,
                validationPassed: true,
                data: {
                    overtraining,
                    loadSuggestion,
                },
            };
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            console.error('[AIOrchestrator] checkPerformance failed:', message);

            return {
                success: false,
                validationPassed: false,
                error: message,
            };
        }
    }

    // ============================================
    // WEEK COMPARISON
    // ============================================

    /**
     * Compare two weeks of training
     */
    public compareWeeks(
        currentWeekSessions: WorkoutSession[],
        previousWeekSessions: WorkoutSession[]
    ): OrchestratorResult<ReturnType<typeof compareWeeks>> {
        try {
            const comparison = compareWeeks(currentWeekSessions, previousWeekSessions);

            return {
                success: true,
                validationPassed: true,
                data: comparison,
            };
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            console.error('[AIOrchestrator] compareWeeks failed:', message);

            return {
                success: false,
                validationPassed: false,
                error: message,
            };
        }
    }
}

// ============================================
// EXPORTS
// ============================================

// Singleton instance
export const aiOrchestrator = AIOrchestrator.getInstance();

// Direct export for destructuring usage
export const {
    generateWeeklyPlan: orchestrateWeeklyPlan,
    analyzePerformance: orchestrateAnalytics,
    checkPerformance: orchestratePerformanceCheck,
    compareWeeks: orchestrateWeekComparison,
} = aiOrchestrator;
