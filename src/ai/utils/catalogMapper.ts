/**
 * Catalog Mapper - Mapea Exercise[] al formato que espera el prompt de session_generation
 * 
 * REFACTORED: Uses new Exercise model (pattern, muscleGroup) instead of legacy fields
 */

import type { Exercise, BlockType } from '../../types/types';
import type { MovementPattern, MuscleGroup } from '../../core/exercises/exercise.model';
import type { CatalogExercise } from '../types';

/**
 * Mapea array de ejercicios al formato del catálogo para el prompt IA
 */
export function mapCatalogForPrompt(exercises: Exercise[]): CatalogExercise[] {
    return exercises.map(ex => ({
        id: ex.id,
        nombre: ex.name,
        bloques_permitidos: inferBlocksPermitidos(ex),
        nivel: inferNivel(ex),
        material: ex.equipment ? [ex.equipment] : ['peso_corporal'],
        tags: buildTags(ex),
    }));
}

/**
 * Infiere qué bloques puede ocupar un ejercicio según pattern y muscleGroup
 */
function inferBlocksPermitidos(ex: Exercise): BlockType[] {
    const blocks: BlockType[] = [];
    const pattern = ex.pattern || 'other';
    const muscleGroup = ex.muscleGroup || 'other';

    // Movilidad/Calentamiento - core patterns and "other" often include mobility
    if (pattern === 'core' || pattern === 'other' || muscleGroup === 'other') {
        blocks.push('movilidad_calentamiento');
    }

    // Fuerza - main compound patterns
    if (['squat', 'hinge', 'push', 'pull', 'carry'].includes(pattern)) {
        blocks.push('fuerza');
    }

    // Técnica específica (la mayoría de ejercicios pueden usarse con enfoque técnico)
    if (['squat', 'hinge', 'push', 'pull', 'core'].includes(pattern)) {
        blocks.push('tecnica_especifica');
    }

    // EMOM/HIIT - full body and carry exercises work well
    if (muscleGroup === 'full' || pattern === 'carry' || pattern === 'other') {
        blocks.push('emom_hiit');
    }

    // Si no encaja en ningún bloque, permitir en fuerza y técnica
    if (blocks.length === 0) {
        blocks.push('fuerza', 'tecnica_especifica');
    }

    return blocks;
}

/**
 * Infiere nivel del ejercicio basado en pattern y tags
 */
function inferNivel(ex: Exercise): 'principiante' | 'intermedio' | 'avanzado' {
    const pattern = ex.pattern || 'other';
    const tags = ex.tags || [];

    // Check tags for explicit level hints
    if (tags.includes('advanced') || tags.includes('power')) {
        return 'avanzado';
    }
    if (tags.includes('beginner') || tags.includes('mobility') || tags.includes('warmup')) {
        return 'principiante';
    }

    // Infer from pattern
    switch (pattern) {
        case 'core':
        case 'other':
            return 'principiante';
        case 'carry':
            return 'intermedio';
        case 'squat':
        case 'hinge':
        case 'push':
        case 'pull':
            return 'intermedio';
        default:
            return 'intermedio';
    }
}

/**
 * Construye array de tags a partir de pattern, muscleGroup y tags existentes
 */
function buildTags(ex: Exercise): string[] {
    const tags: string[] = [...(ex.tags || [])];

    // Add pattern as tag
    if (ex.pattern && ex.pattern !== 'other' && !tags.includes(ex.pattern)) {
        tags.push(ex.pattern);
    }

    // Add muscleGroup as tag
    if (ex.muscleGroup && ex.muscleGroup !== 'other' && !tags.includes(ex.muscleGroup)) {
        tags.push(ex.muscleGroup);
    }

    // Add derived tags based on pattern
    const patternTags: Record<MovementPattern, string[]> = {
        squat: ['piernas', 'dominante_rodilla'],
        hinge: ['piernas', 'dominante_cadera'],
        push: ['empuje', 'tren_superior'],
        pull: ['traccion', 'tren_superior'],
        core: ['estabilidad', 'core'],
        carry: ['funcional', 'core'],
        other: [],
    };

    const derivedTags = patternTags[ex.pattern as MovementPattern] || [];
    for (const t of derivedTags) {
        if (!tags.includes(t)) {
            tags.push(t);
        }
    }

    // Add derived tags based on muscleGroup
    const muscleGroupTags: Record<MuscleGroup, string[]> = {
        legs: ['piernas', 'tren_inferior'],
        chest: ['pecho', 'empuje'],
        back: ['espalda', 'traccion'],
        shoulders: ['hombros', 'empuje'],
        arms: ['brazos'],
        full: ['full_body', 'compuesto'],
        other: [],
    };

    const mgTags = muscleGroupTags[ex.muscleGroup as MuscleGroup] || [];
    for (const t of mgTags) {
        if (!tags.includes(t)) {
            tags.push(t);
        }
    }

    // Legacy support: if category exists, add it as tag
    if ((ex as Exercise & { category?: string }).category) {
        const category = (ex as Exercise & { category?: string }).category!;
        if (!tags.includes(category)) {
            tags.push(category);
        }
    }

    return [...new Set(tags)]; // Eliminar duplicados
}

