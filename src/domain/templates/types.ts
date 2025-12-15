/**
 * Domain Layer - Templates
 * 
 * Pure types and business logic for template domain.
 * No React/Zustand dependencies.
 */

import type { TrainingType, SessionGoal } from '../sessions/types';

// ============================================
// TYPES
// ============================================

export interface TemplateExercise {
    id: string;
    exerciseId: string;
    order: number;
    sets: number;
    targetReps?: number;
    targetRPE?: number;
    restSeconds?: number;
    notes?: string;
}

export interface TemplateBlock {
    id: string;
    name: string;
    type: 'warmup' | 'main' | 'accessory' | 'cooldown';
    order: number;
    exercises: TemplateExercise[];
}

export interface Template {
    id: string;
    name: string;
    description?: string;
    exercises: TemplateExercise[];
    blocks?: TemplateBlock[];
    estimatedDuration?: number; // minutes
    difficulty?: 'beginner' | 'intermediate' | 'advanced';
    tags?: string[];
    isActive: boolean;
    usageCount?: number;
    createdAt: string;
    updatedAt: string;

    // Phase 17B: Training taxonomy for inheritance
    trainingType?: TrainingType;
    sessionGoal?: SessionGoal;
}

// ============================================
// CALCULATIONS (Pure Functions)
// ============================================

/**
 * Calculate total sets in template
 */
export function calculateTemplateTotalSets(template: Template): number {
    return template.exercises.reduce((sum, ex) => sum + ex.sets, 0);
}

/**
 * Calculate total exercises in template
 */
export function getTemplateExerciseCount(template: Template): number {
    return template.exercises.length;
}

/**
 * Estimate template duration based on exercises and sets
 */
export function estimateTemplateDuration(template: Template): number {
    const totalSets = calculateTemplateTotalSets(template);
    const avgRestPerSet = 90; // seconds
    const avgSetDuration = 30; // seconds
    const transitionTime = template.exercises.length * 60; // 1 min per exercise transition

    return Math.round((totalSets * (avgSetDuration + avgRestPerSet) + transitionTime) / 60);
}

/**
 * Sort templates by usage
 */
export function sortTemplatesByUsage(templates: Template[]): Template[] {
    return [...templates].sort((a, b) => (b.usageCount || 0) - (a.usageCount || 0));
}

/**
 * Filter active templates
 */
export function getActiveTemplates(templates: Template[]): Template[] {
    return templates.filter(t => t.isActive);
}

/**
 * Search templates by name
 */
export function searchTemplates(templates: Template[], query: string): Template[] {
    if (!query.trim()) return templates;
    const lower = query.toLowerCase();
    return templates.filter(
        t => t.name.toLowerCase().includes(lower) ||
            t.description?.toLowerCase().includes(lower)
    );
}

/**
 * Clone template for new session
 * Phase 17B: Also copies trainingType and sessionGoal
 */
export function cloneTemplateForSession(
    template: Template,
    sessionId: string
): {
    exercises: Array<{
        id: string;
        exerciseId: string;
        exerciseName: string;
        order: number;
        sets: Array<{
            id: string;
            setNumber: number;
            targetReps?: number;
            isCompleted: boolean;
        }>;
    }>;
    trainingType?: TrainingType;
    sessionGoal?: SessionGoal;
} {
    return {
        exercises: template.exercises.map((ex, idx) => ({
            id: `${sessionId}-ex-${idx}`,
            exerciseId: ex.exerciseId,
            exerciseName: '', // To be filled by caller
            order: ex.order,
            sets: Array.from({ length: ex.sets }, (_, setIdx) => ({
                id: `${sessionId}-ex-${idx}-set-${setIdx}`,
                setNumber: setIdx + 1,
                targetReps: ex.targetReps,
                isCompleted: false,
            })),
        })),
        trainingType: template.trainingType,
        sessionGoal: template.sessionGoal,
    };
}
