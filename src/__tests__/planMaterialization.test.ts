/**
 * Plan Materialization Tests — Phase 26 B3
 * 
 * Verifies that Plan→Calendar sessions include exercises when template exists.
 * Tests the materializeExercisesFromTemplate function.
 */

import { describe, it, expect } from 'vitest';
import { materializeExercisesFromTemplate } from '../domain/sessions/mappers';
import type { WorkoutTemplate, TemplateExercise } from '../types/types';

// Mock template factory
function createMockTemplate(exerciseCount: number): WorkoutTemplate {
    const exercises: TemplateExercise[] = Array.from({ length: exerciseCount }, (_, i) => ({
        id: `template-exercise-${i}`,
        exerciseId: `exercise-${i}`,
        order: i,
        defaultSets: 3,
        defaultReps: 10,
        defaultWeight: 50 + i * 10,
        restSeconds: 90,
    }));

    return {
        id: 'template-123',
        name: 'Test Template',
        description: 'A test template',
        exercises,
        isArchived: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    };
}

describe('materializeExercisesFromTemplate', () => {
    it('creates exercises from template', () => {
        const template = createMockTemplate(3);

        const exercises = materializeExercisesFromTemplate(template);

        expect(exercises).toHaveLength(3);
        expect(exercises[0].exerciseId).toBe('exercise-0');
        expect(exercises[1].exerciseId).toBe('exercise-1');
        expect(exercises[2].exerciseId).toBe('exercise-2');
    });

    it('creates sets for each exercise based on template defaults', () => {
        const template = createMockTemplate(1);
        template.exercises[0].defaultSets = 5;
        template.exercises[0].defaultReps = 8;
        template.exercises[0].defaultWeight = 100;

        const exercises = materializeExercisesFromTemplate(template);

        expect(exercises[0].sets).toHaveLength(5);
        expect(exercises[0].sets[0].targetReps).toBe(8);
        expect(exercises[0].sets[0].targetWeight).toBe(100);
    });

    it('generates unique IDs for exercises and sets', () => {
        const template = createMockTemplate(2);

        const exercises = materializeExercisesFromTemplate(template);

        // Exercise IDs should be unique
        expect(exercises[0].id).not.toBe(exercises[1].id);

        // Set IDs should be unique
        const allSetIds = exercises.flatMap(e => e.sets.map(s => s.id));
        const uniqueSetIds = new Set(allSetIds);
        expect(uniqueSetIds.size).toBe(allSetIds.length);
    });

    it('preserves exercise order', () => {
        const template = createMockTemplate(5);

        const exercises = materializeExercisesFromTemplate(template);

        expect(exercises[0].order).toBe(0);
        expect(exercises[1].order).toBe(1);
        expect(exercises[2].order).toBe(2);
        expect(exercises[3].order).toBe(3);
        expect(exercises[4].order).toBe(4);
    });

    it('copies restSeconds from template', () => {
        const template = createMockTemplate(1);
        template.exercises[0].restSeconds = 120;

        const exercises = materializeExercisesFromTemplate(template);

        expect(exercises[0].restSeconds).toBe(120);
        expect(exercises[0].sets[0].restSeconds).toBe(120);
    });

    it('handles empty template (no exercises)', () => {
        const template: WorkoutTemplate = {
            id: 'empty-template',
            name: 'Empty Template',
            exercises: [],
            isArchived: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };

        const exercises = materializeExercisesFromTemplate(template);

        expect(exercises).toHaveLength(0);
    });

    it('defaults to 3 sets if defaultSets not specified', () => {
        const template = createMockTemplate(1);
        // @ts-expect-error - intentionally testing undefined case
        delete template.exercises[0].defaultSets;

        const exercises = materializeExercisesFromTemplate(template);

        expect(exercises[0].sets).toHaveLength(3);
    });

    it('sets isCompleted to false for all sets', () => {
        const template = createMockTemplate(2);

        const exercises = materializeExercisesFromTemplate(template);

        for (const exercise of exercises) {
            for (const set of exercise.sets) {
                expect(set.isCompleted).toBe(false);
            }
        }
    });
});
