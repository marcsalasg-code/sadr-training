/**
 * useTrainingPlan - Facade hook for Training Plan management
 * 
 * REFACTORED: This hook now composes the specialized hooks:
 * - useActiveTrainingPlan: Plan CRUD and status
 * - useTrainingAdherence: Adherence calculations and recommendations
 * - useTrainingPlanCalendar: Calendar sync and scheduling
 * 
 * For new code, consider using the specialized hooks directly.
 * This facade maintains backward compatibility with existing components.
 */

import { useCallback } from 'react';
import { useAthletes, useSessions, useTemplates, useExercises, useTrainingStore } from '../store/store';
import { aiOrchestrator } from '../ai/AIOrchestrator';
import type { TrainingPlan, WeekDay, TrainingObjective, DifficultyLevel, PlanMetadata } from '../types/types';

// Import specialized hooks
import { useActiveTrainingPlan } from './useActiveTrainingPlan';
import { useTrainingAdherence } from './useTrainingAdherence';
import { useTrainingPlanCalendar } from './useTrainingPlanCalendar';

/**
 * Main hook for Training Plan management (Facade Pattern)
 * Composes useActiveTrainingPlan, useTrainingAdherence, and useTrainingPlanCalendar
 */
export function useTrainingPlan() {
    const athletes = useAthletes();
    const sessions = useSessions();
    const templates = useTemplates();
    const exercises = useExercises();
    const {
        addTrainingPlan,
        setActiveTrainingPlan,
        getActiveTrainingPlan,
    } = useTrainingStore();

    // Compose specialized hooks
    const {
        trainingPlans,
        activePlan,
        activeTrainingPlanId,
        todayPlan,
        isTodayTrainingDay,
        createPlan,
        updatePlan,
        deletePlan,
        setActivePlan,
        updatePlanMetadata,
    } = useActiveTrainingPlan();

    const {
        weeklyAdherence,
        getAIRecommendations,
    } = useTrainingAdherence();

    const {
        syncPlanToCalendar,
        createWeekEventsFromPlan,
        syncTrainingPlanWithCalendar,
    } = useTrainingPlanCalendar();

    // Generate AI plan using AIOrchestrator
    const generatePlanWithAI = useCallback(async (config: {
        athleteId: string;
        weekDays: WeekDay[];
        objective: TrainingObjective;
        name?: string;
        syncToCalendar?: boolean;
        targetLevel?: DifficultyLevel;
    }): Promise<TrainingPlan> => {
        const athlete = athletes.find(a => a.id === config.athleteId);
        if (!athlete) throw new Error('Athlete not found');

        // Get athlete's recent history (last 4 weeks)
        const fourWeeksAgo = new Date();
        fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);

        const recentHistory = sessions.filter(s =>
            s.athleteId === config.athleteId &&
            s.status === 'completed' &&
            s.completedAt &&
            new Date(s.completedAt) >= fourWeeksAgo
        );

        // Calculate adherence from recent history
        const expectedSessions = config.weekDays.length * 4; // 4 weeks
        const adherenceHistory = expectedSessions > 0
            ? Math.round((recentHistory.length / expectedSessions) * 100)
            : 80; // Default if no history

        // Use AIOrchestrator for plan generation with validation
        const result = aiOrchestrator.generateWeeklyPlan({
            athlete,
            availability: config.weekDays,
            objective: config.objective,
            targetLevel: config.targetLevel || (athlete.experienceLevel as DifficultyLevel) || 'intermediate',
            history: recentHistory,
            adherenceHistory,
            templates,
            exercises,
        });

        if (!result.success || !result.data) {
            throw new Error(result.error || 'Failed to generate plan');
        }

        const newPlan: Omit<TrainingPlan, 'id' | 'createdAt' | 'updatedAt'> = {
            athleteId: config.athleteId,
            name: config.name || `${config.objective} Plan (AI)`,
            weekDays: config.weekDays,
            objective: config.objective,
            weeklyVolume: (result.data.metadata as { recommendedVolume?: number }).recommendedVolume || 0,
            sessionsPerWeek: config.weekDays.length,
            dayPlans: result.data.dayPlans,
            isActive: true,
            metadata: result.data.metadata as PlanMetadata,
            aiRecommendations: result.data.notes,
        };

        const plan = addTrainingPlan(newPlan);
        setActiveTrainingPlan(plan.id);

        // Auto-sync to calendar if requested
        if (config.syncToCalendar !== false) {
            syncPlanToCalendar(plan);
        }

        return plan;
    }, [athletes, sessions, templates, exercises, addTrainingPlan, setActiveTrainingPlan, syncPlanToCalendar]);

    return {
        // Data (from useActiveTrainingPlan)
        trainingPlans,
        activePlan,
        activeTrainingPlanId,
        todayPlan,
        isTodayTrainingDay,

        // Data (from useTrainingAdherence)
        weeklyAdherence,

        // Actions (from useActiveTrainingPlan)
        createPlan,
        updatePlan,
        deletePlan,
        setActivePlan,

        // Actions (AI generation - local)
        generatePlanWithAI,

        // Actions (from useTrainingPlanCalendar)
        syncPlanToCalendar,
        createWeekEventsFromPlan,
        syncTrainingPlanWithCalendar,

        // Actions (from useActiveTrainingPlan)
        updatePlanMetadata,

        // Actions (from useTrainingAdherence)
        getAIRecommendations,

        // Utils
        getActiveTrainingPlan,
    };
}

export type UseTrainingPlanReturn = ReturnType<typeof useTrainingPlan>;
