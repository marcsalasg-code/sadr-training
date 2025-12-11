/**
 * Template Helpers - Utilidades para Templates inteligentes
 * Recomendaciones y matching con Training Plan
 */

import type { WorkoutTemplate, DayPlan, DifficultyLevel, DayIntensity } from '../types/types';

/**
 * Map intensity to difficulty level
 */
export function mapIntensityToDifficulty(intensity?: DayIntensity): DifficultyLevel {
    switch (intensity) {
        case 'light': return 'beginner';
        case 'heavy': return 'advanced';
        default: return 'intermediate';
    }
}

/**
 * Calculate match score between template and day plan
 */
export function calculateMatchScore(template: WorkoutTemplate, dayPlan: DayPlan): number {
    let score = 0;

    // Category match (highest priority)
    if (template.category?.toLowerCase() === dayPlan.sessionType) {
        score += 10;
    }

    // Tag match
    if (template.tags?.some(tag => tag.toLowerCase() === dayPlan.sessionType)) {
        score += 5;
    }

    // Difficulty/intensity match
    const expectedDifficulty = mapIntensityToDifficulty(dayPlan.intensity);
    if (template.difficulty === expectedDifficulty) {
        score += 3;
    }

    // Focus match
    if (dayPlan.focus && template.description?.toLowerCase().includes(dayPlan.focus.toLowerCase())) {
        score += 2;
    }

    return score;
}

/**
 * Get recommended templates based on today's plan
 */
export function getRecommendedTemplates(
    templates: WorkoutTemplate[],
    todayPlan: DayPlan | undefined,
    limit = 3
): WorkoutTemplate[] {
    if (!templates.length) return [];
    if (!todayPlan) return templates.slice(0, limit);

    const scored = templates.map(t => ({
        template: t,
        score: calculateMatchScore(t, todayPlan)
    }));

    return scored
        .sort((a, b) => b.score - a.score)
        .slice(0, limit)
        .map(s => s.template);
}

/**
 * Check if template matches today's session type
 */
export function templateMatchesToday(template: WorkoutTemplate, todayPlan: DayPlan | undefined): boolean {
    if (!todayPlan) return false;

    return (
        template.category?.toLowerCase() === todayPlan.sessionType ||
        template.tags?.some(t => t.toLowerCase() === todayPlan.sessionType) ||
        false
    );
}

/**
 * Get template badge text based on plan match
 */
export function getTemplateBadge(template: WorkoutTemplate, todayPlan: DayPlan | undefined): string | null {
    if (!todayPlan) return null;

    const score = calculateMatchScore(template, todayPlan);
    if (score >= 10) return 'Perfect for today';
    if (score >= 5) return 'Matches plan';
    return null;
}
