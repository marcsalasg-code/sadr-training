/**
 * Session Structure Migration - Migración de sesiones/plantillas sin estructura
 * 
 * Este módulo normaliza sesiones y plantillas existentes que carezcan de:
 * - structure: SessionStructure
 * - blockId en sus sets
 * 
 * Ejecuta migración automática para backwards compatibility.
 */

import type { WorkoutSession, WorkoutTemplate, ExerciseEntry, SetEntry } from '../../types/types';
import type { SessionStructure, SessionBlockConfig } from './sessionStructure.model';

// ============================================
// MIGRATION CONSTANTS
// ============================================

/**
 * Default block ID for migrated sets
 */
export const DEFAULT_BLOCK_ID = 'main';

/**
 * Create default structure for sessions/templates that don't have one
 */
export function createDefaultMigrationStructure(entityId: string): SessionStructure {
    return {
        id: `structure-${entityId}`,
        name: 'Default',
        blocks: [
            {
                id: DEFAULT_BLOCK_ID,
                title: 'Principal',
                type: 'linear',
                order: 0,
                notes: '',
                tags: [],
            },
        ],
    };
}

// ============================================
// SESSION MIGRATION
// ============================================

/**
 * Check if a session needs structure migration
 */
export function sessionNeedsMigration(session: WorkoutSession): boolean {
    return !session.structure || session.structure.blocks.length === 0;
}

/**
 * Check if exercises need blockId migration
 */
export function exercisesNeedBlockIdMigration(exercises: ExerciseEntry[]): boolean {
    return exercises.some(e => !e.blockId);
}

/**
 * Migrate a session to have structure and blockIds
 */
export function migrateSession(session: WorkoutSession): WorkoutSession {
    // Add structure if missing
    const structure = session.structure && session.structure.blocks.length > 0
        ? session.structure
        : createDefaultMigrationStructure(session.id);

    // Get the first block ID for migration
    const defaultBlockId = structure.blocks[0]?.id || DEFAULT_BLOCK_ID;

    // Migrate exercises and sets to have blockId
    const migratedExercises = session.exercises.map(exercise =>
        migrateExerciseEntry(exercise, defaultBlockId)
    );

    return {
        ...session,
        structure,
        exercises: migratedExercises,
    };
}

/**
 * Migrate an exercise entry to have blockId
 */
export function migrateExerciseEntry(entry: ExerciseEntry, defaultBlockId: string): ExerciseEntry {
    // If already has blockId, keep it
    if (entry.blockId) {
        return {
            ...entry,
            sets: migrateSets(entry.sets, entry.blockId),
        };
    }

    return {
        ...entry,
        blockId: defaultBlockId,
        sets: migrateSets(entry.sets, defaultBlockId),
    };
}

/**
 * Migrate sets to have blockId
 */
export function migrateSets(sets: SetEntry[], blockId: string): SetEntry[] {
    return sets.map(set => ({
        ...set,
        blockId: set.blockId || blockId,
    }));
}

// ============================================
// TEMPLATE MIGRATION
// ============================================

/**
 * Check if a template needs structure migration
 */
export function templateNeedsMigration(template: WorkoutTemplate): boolean {
    return !template.structure || template.structure.blocks.length === 0;
}

/**
 * Migrate a template to have structure
 */
export function migrateTemplate(template: WorkoutTemplate): WorkoutTemplate {
    if (!templateNeedsMigration(template)) {
        return template;
    }

    return {
        ...template,
        structure: createDefaultMigrationStructure(template.id),
    };
}

// ============================================
// BATCH MIGRATION
// ============================================

/**
 * Migrate all sessions in a batch
 */
export function migrateSessions(sessions: WorkoutSession[]): WorkoutSession[] {
    return sessions.map(session => {
        if (sessionNeedsMigration(session) || exercisesNeedBlockIdMigration(session.exercises)) {
            return migrateSession(session);
        }
        return session;
    });
}

/**
 * Migrate all templates in a batch
 */
export function migrateTemplates(templates: WorkoutTemplate[]): WorkoutTemplate[] {
    return templates.map(template => {
        if (templateNeedsMigration(template)) {
            return migrateTemplate(template);
        }
        return template;
    });
}

/**
 * Get migration stats
 */
export interface MigrationStats {
    sessionsTotal: number;
    sessionsNeedingMigration: number;
    templatesTotal: number;
    templatesNeedingMigration: number;
}

export function getSessionStructureMigrationStats(
    sessions: WorkoutSession[],
    templates: WorkoutTemplate[]
): MigrationStats {
    return {
        sessionsTotal: sessions.length,
        sessionsNeedingMigration: sessions.filter(s =>
            sessionNeedsMigration(s) || exercisesNeedBlockIdMigration(s.exercises)
        ).length,
        templatesTotal: templates.length,
        templatesNeedingMigration: templates.filter(templateNeedsMigration).length,
    };
}
