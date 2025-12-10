/**
 * Exercise Migration - Migración de ejercicios existentes al nuevo modelo
 * 
 * Este módulo normaliza ejercicios existentes que carezcan de:
 * - pattern: MovementPattern
 * - muscleGroup: MuscleGroup
 * - tags: string[]
 * 
 * Ejecuta inferencia basada en nombre y campos legacy.
 */

import type { Exercise } from '../../types/types';
import type { MovementPattern, MuscleGroup } from './exercise.model';
import { inferPatternFromName, inferMuscleGroupFromName } from './exercise.model';

// ============================================
// MIGRATION INTERFACE
// ============================================

/**
 * Extended exercise with new fields
 */
export interface MigratedExercise extends Exercise {
    pattern: MovementPattern;
    muscleGroup: MuscleGroup;
    tags: string[];
    updatedAt: string;
}

// ============================================
// MIGRATION FUNCTIONS
// ============================================

/**
 * Migrate a single exercise to the new model
 * 
 * @param exercise - Original exercise (may lack pattern/muscleGroup)
 * @returns Migrated exercise with all required fields
 */
export function migrateExercise(exercise: Exercise): MigratedExercise {
    // Check if already migrated
    const existing = exercise as Partial<MigratedExercise>;

    // Infer pattern if missing
    let pattern: MovementPattern;
    if (existing.pattern) {
        pattern = existing.pattern;
    } else {
        pattern = inferPatternFromName(exercise.name);
    }

    // Infer muscleGroup if missing
    let muscleGroup: MuscleGroup;
    if (existing.muscleGroup) {
        muscleGroup = existing.muscleGroup;
    } else if (Array.isArray(exercise.muscleGroups) && exercise.muscleGroups.length > 0) {
        // Migrate from legacy muscleGroups array
        muscleGroup = migrateLegacyMuscleGroup(exercise.muscleGroups[0]);
    } else {
        muscleGroup = inferMuscleGroupFromName(exercise.name);
    }

    // Build tags from legacy data
    const tags: string[] = existing.tags || [];

    // Add equipment as tag if present
    if (exercise.equipment && !tags.includes(exercise.equipment.toLowerCase())) {
        tags.push(exercise.equipment.toLowerCase());
    }

    // Add category as tag (for backwards compat)
    if (exercise.category && !tags.includes(exercise.category)) {
        tags.push(exercise.category);
    }

    // Add legacy muscleGroups as tags
    if (Array.isArray(exercise.muscleGroups)) {
        for (const mg of exercise.muscleGroups) {
            if (!tags.includes(mg)) {
                tags.push(mg);
            }
        }
    }

    return {
        ...exercise,
        pattern,
        muscleGroup,
        tags,
        updatedAt: existing.updatedAt || new Date().toISOString(),
    };
}

/**
 * Migrate legacy muscleGroups value to new MuscleGroup
 */
function migrateLegacyMuscleGroup(legacy: string): MuscleGroup {
    const legacyMap: Record<string, MuscleGroup> = {
        chest: 'chest',
        back: 'back',
        shoulders: 'shoulders',
        biceps: 'arms',
        triceps: 'arms',
        forearms: 'arms',
        quads: 'legs',
        hamstrings: 'legs',
        glutes: 'legs',
        calves: 'legs',
        core: 'other',
        full_body: 'full',
        cardio: 'other',
    };

    return legacyMap[legacy] || 'other';
}

/**
 * Migrate entire exercise catalog
 * 
 * @param exercises - Array of exercises to migrate
 * @returns Array of migrated exercises
 */
export function migrateExerciseCatalog(exercises: Exercise[]): MigratedExercise[] {
    return exercises.map(migrateExercise);
}

/**
 * Check if an exercise needs migration
 * 
 * @param exercise - Exercise to check
 * @returns true if migration is needed
 */
export function needsMigration(exercise: Exercise): boolean {
    const ex = exercise as Partial<MigratedExercise>;
    return !ex.pattern || !ex.muscleGroup || !Array.isArray(ex.tags);
}

/**
 * Get migration stats for a catalog
 */
export function getMigrationStats(exercises: Exercise[]): {
    total: number;
    needsMigration: number;
    alreadyMigrated: number;
} {
    const needsMigrationCount = exercises.filter(needsMigration).length;
    return {
        total: exercises.length,
        needsMigration: needsMigrationCount,
        alreadyMigrated: exercises.length - needsMigrationCount,
    };
}
