/**
 * Template Engine - Motor IA para sugerencia y personalización de templates
 * 
 * Funciones:
 * - Sugerir template según día del plan
 * - Rellenar slots variables con ejercicios del catálogo
 * - Adaptar template según nivel del atleta
 */

import type {
    WorkoutTemplate,
    TemplateExercise,
    Exercise,
    DayPlan,
    MuscleGroup,
    UUID,
} from '../../types/types';

// ============================================
// INPUT/OUTPUT TYPES
// ============================================

export interface TemplateSuggestionInput {
    dayPlan: DayPlan;
    templates: WorkoutTemplate[];
    preferredTemplateIds?: UUID[];
}

export interface SlotFillingInput {
    template: WorkoutTemplate;
    catalog: Exercise[];
    avoidExerciseIds?: UUID[];
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Calculate relevance score for a template given a day plan
 */
function calculateTemplateRelevance(
    template: WorkoutTemplate,
    dayPlan: DayPlan
): number {
    let score = 0;

    const sessionType = dayPlan.sessionType.toLowerCase();
    const intensity = dayPlan.intensity;

    // Name match
    if (template.name.toLowerCase().includes(sessionType)) {
        score += 30;
    }

    // Category match
    if (template.category?.toLowerCase().includes(sessionType)) {
        score += 25;
    }

    // Tag match
    if (template.tags?.some(t => t.toLowerCase().includes(sessionType))) {
        score += 20;
    }

    // Difficulty alignment
    const difficultyMatch =
        (intensity === 'light' && template.difficulty === 'beginner') ||
        (intensity === 'moderate' && template.difficulty === 'intermediate') ||
        (intensity === 'heavy' && template.difficulty === 'advanced');

    if (difficultyMatch) {
        score += 15;
    }

    // Duration alignment
    if (template.estimatedDuration) {
        const durationDiff = Math.abs(template.estimatedDuration - dayPlan.estimatedDuration);
        if (durationDiff <= 15) score += 10;
        else if (durationDiff <= 30) score += 5;
    }

    return score;
}

/**
 * Find exercises matching a muscle group from catalog
 */
function findExercisesForMuscleGroup(
    catalog: Exercise[],
    muscleGroup: MuscleGroup,
    avoidIds: Set<UUID>
): Exercise[] {
    return catalog.filter(ex =>
        ex.muscleGroups.includes(muscleGroup) &&
        !avoidIds.has(ex.id)
    );
}

// ============================================
// MAIN ENGINE FUNCTIONS
// ============================================

/**
 * Suggest the best matching template for a day plan
 * 
 * @returns Template ID or null if no good match
 */
export function suggestTemplate(input: TemplateSuggestionInput): UUID | null {
    const { dayPlan, templates, preferredTemplateIds } = input;

    if (templates.length === 0) return null;

    // Score all templates
    const scored = templates.map(template => ({
        template,
        score: calculateTemplateRelevance(template, dayPlan),
        isPreferred: preferredTemplateIds?.includes(template.id) ?? false,
    }));

    // Sort by score (preferred templates get bonus)
    scored.sort((a, b) => {
        const aScore = a.score + (a.isPreferred ? 20 : 0);
        const bScore = b.score + (b.isPreferred ? 20 : 0);
        return bScore - aScore;
    });

    // Return best match if score is reasonable
    const best = scored[0];
    if (best && best.score >= 25) {
        return best.template.id;
    }

    return null;
}

/**
 * Fill variable slots in a template with exercises from catalog
 * 
 * Variable slots are TemplateExercise items with isVariableSlot=true
 * The engine selects appropriate exercises based on the muscle group
 */
export function fillVariableSlots(input: SlotFillingInput): TemplateExercise[] {
    const { template, catalog, avoidExerciseIds = [] } = input;

    const avoidIds = new Set(avoidExerciseIds);
    const usedIds = new Set<UUID>();

    return template.exercises.map(templateEx => {
        // Check if this is a variable slot (future feature)
        // For now, we just return exercise as-is with verification
        // that it exists in catalog

        const existsInCatalog = catalog.some(ex => ex.id === templateEx.exerciseId);

        if (!existsInCatalog && catalog.length > 0) {
            // Find a replacement from catalog
            const replacement = catalog.find(ex =>
                !usedIds.has(ex.id) && !avoidIds.has(ex.id)
            );

            if (replacement) {
                usedIds.add(replacement.id);
                return {
                    ...templateEx,
                    exerciseId: replacement.id,
                    exercise: replacement,
                };
            }
        }

        usedIds.add(templateEx.exerciseId);
        return templateEx;
    });
}

/**
 * Adapt template for a specific difficulty level
 * 
 * Adjusts sets, reps, and rest times based on target level
 */
export function adaptTemplateForLevel(
    template: WorkoutTemplate,
    targetLevel: 'beginner' | 'intermediate' | 'advanced'
): WorkoutTemplate {
    const levelMultipliers = {
        beginner: { sets: 0.6, reps: 1.2, rest: 1.3 },
        intermediate: { sets: 0.85, reps: 1.0, rest: 1.0 },
        advanced: { sets: 1.0, reps: 0.8, rest: 0.7 },
    };

    const mult = levelMultipliers[targetLevel];

    return {
        ...template,
        exercises: template.exercises.map(ex => ({
            ...ex,
            defaultSets: Math.max(1, Math.round(ex.defaultSets * mult.sets)),
            defaultReps: ex.defaultReps
                ? Math.max(1, Math.round(ex.defaultReps * mult.reps))
                : undefined,
            restSeconds: ex.restSeconds
                ? Math.round(ex.restSeconds * mult.rest)
                : undefined,
        })),
        difficulty: targetLevel,
    };
}
