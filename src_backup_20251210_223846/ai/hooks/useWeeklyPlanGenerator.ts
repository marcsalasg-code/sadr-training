/**
 * useWeeklyPlanGenerator - Hook para generación de planes semanales con IA
 * 
 * REFACTORED: Now uses AIOrchestrator for centralized validation and engine calls.
 * Provides React state management for AI generation flow.
 */

import { useState, useCallback } from 'react';
import { aiOrchestrator, type WeeklyPlanResult as OrchestratorPlanResult } from '../AIOrchestrator';
import type { DayPlan, TrainingPlan, Athlete, WeekDay, TrainingObjective, DifficultyLevel } from '../../types/types';
import { useSessions, useTemplates, useExercises } from '../../store/store';

// ============================================
// TYPES
// ============================================

/** Simplified input for the hook (fetches context automatically) */
export interface GeneratePlanOptions {
    athlete: Athlete;
    availability: WeekDay[];
    objective: TrainingObjective;
    targetLevel: DifficultyLevel;
    currentMicrocycle?: 1 | 2 | 3 | 4;
    coachNotes?: string;
}

export interface WeeklyPlanResult {
    dayPlans: DayPlan[];
    output: OrchestratorPlanResult;
}

// ============================================
// HOOK
// ============================================

export function useWeeklyPlanGenerator() {
    const sessions = useSessions();
    const templates = useTemplates();
    const exercises = useExercises();

    const [isGenerating, setIsGenerating] = useState(false);
    const [result, setResult] = useState<WeeklyPlanResult | null>(null);
    const [error, setError] = useState<string | null>(null);

    /**
     * Generate a weekly training plan via AIOrchestrator
     */
    const generatePlan = useCallback(async (options: GeneratePlanOptions): Promise<WeeklyPlanResult | null> => {
        setIsGenerating(true);
        setError(null);
        setResult(null);

        try {
            // Get athlete's recent history (last 4 weeks)
            const fourWeeksAgo = new Date();
            fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);

            const recentHistory = sessions.filter(s =>
                s.athleteId === options.athlete.id &&
                s.status === 'completed' &&
                s.completedAt &&
                new Date(s.completedAt) >= fourWeeksAgo
            );

            // Calculate adherence from recent history
            const expectedSessions = options.availability.length * 4; // 4 weeks
            const adherenceHistory = expectedSessions > 0
                ? Math.round((recentHistory.length / expectedSessions) * 100)
                : 80; // Default if no history

            // Call AIOrchestrator (handles validation internally)
            const orchestratorResult = aiOrchestrator.generateWeeklyPlan({
                athlete: options.athlete,
                availability: options.availability,
                objective: options.objective,
                targetLevel: options.targetLevel,
                history: recentHistory,
                adherenceHistory,
                templates,
                exercises,
                currentMicrocycle: options.currentMicrocycle,
                coachNotes: options.coachNotes,
            });

            if (!orchestratorResult.success || !orchestratorResult.data) {
                throw new Error(orchestratorResult.error || 'Failed to generate plan');
            }

            const planResult: WeeklyPlanResult = {
                dayPlans: orchestratorResult.data.dayPlans,
                output: orchestratorResult.data,
            };

            setResult(planResult);
            return planResult;

        } catch (err) {
            const message = err instanceof Error ? err.message : 'Error generating plan';
            setError(message);
            console.error('[useWeeklyPlanGenerator] Error:', err);
            return null;
        } finally {
            setIsGenerating(false);
        }
    }, [sessions, templates, exercises]);

    /**
     * Create a full TrainingPlan object from options
     */
    const createTrainingPlan = useCallback(async (
        options: GeneratePlanOptions,
        planName: string
    ): Promise<Partial<TrainingPlan> | null> => {
        const planResult = await generatePlan(options);

        if (!planResult) return null;

        return {
            athleteId: options.athlete.id,
            name: planName,
            weekDays: options.availability,
            objective: options.objective,
            weeklyVolume: planResult.dayPlans.reduce((sum, d) => sum + (d.estimatedVolume || 0), 0),
            sessionsPerWeek: options.availability.length,
            dayPlans: planResult.dayPlans,
            isActive: true,
            metadata: {
                targetLevel: options.targetLevel,
                currentMicrocycle: options.currentMicrocycle || 1,
                weeklyAvailability: options.availability.length * 1.5, // Hours estimate
                recommendedLoad: planResult.output.metadata.recommendedLoad || 'normal',
                historicalAdherence: planResult.output.metadata.historicalAdherence || 80,
                lastAIUpdate: new Date().toISOString(),
            },
            aiRecommendations: planResult.output.notes,
        };
    }, [generatePlan]);

    /**
     * Clear the current result
     */
    const clearResult = useCallback(() => {
        setResult(null);
        setError(null);
    }, []);

    return {
        // State
        isGenerating,
        result,
        error,

        // Actions
        generatePlan,
        createTrainingPlan,
        clearResult,
    };
}

export default useWeeklyPlanGenerator;
