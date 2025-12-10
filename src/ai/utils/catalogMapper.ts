/**
 * Catalog Mapper - Mapea Exercise[] al formato que espera el prompt de session_generation
 */

import type { Exercise, BlockType, ExerciseCategory } from '../../types/types';
import type { CatalogExercise } from '../types';

/**
 * Mapea array de ejercicios al formato del catálogo para el prompt IA
 */
export function mapCatalogForPrompt(exercises: Exercise[]): CatalogExercise[] {
    return exercises.map(ex => ({
        id: ex.id,
        nombre: ex.name,
        bloques_permitidos: inferBlocksPermitidos(ex),
        nivel: inferNivel(ex.category),
        material: ex.equipment ? [ex.equipment] : ['peso_corporal'],
        tags: buildTags(ex),
    }));
}

/**
 * Infiere qué bloques puede ocupar un ejercicio según su categoría y grupos musculares
 */
function inferBlocksPermitidos(ex: Exercise): BlockType[] {
    const blocks: BlockType[] = [];
    const category = ex.category;
    const muscleGroups = ex.muscleGroups || [];

    // Movilidad/Calentamiento
    if (
        ['mobility', 'warmup', 'cooldown'].includes(category) ||
        muscleGroups.includes('cardio')
    ) {
        blocks.push('movilidad_calentamiento');
    }

    // Fuerza
    if (['strength', 'hypertrophy', 'power'].includes(category)) {
        blocks.push('fuerza');
    }

    // Técnica específica (la mayoría de ejercicios pueden usarse con enfoque técnico)
    if (['mobility', 'strength', 'hypertrophy'].includes(category)) {
        blocks.push('tecnica_especifica');
    }

    // EMOM/HIIT
    if (
        ['endurance', 'cardio', 'power'].includes(category) ||
        muscleGroups.includes('full_body')
    ) {
        blocks.push('emom_hiit');
    }

    // Si no encaja en ningún bloque, permitir en fuerza y técnica
    if (blocks.length === 0) {
        blocks.push('fuerza', 'tecnica_especifica');
    }

    return blocks;
}

/**
 * Infiere nivel del ejercicio basado en categoría
 * (simplificación - en el futuro el Exercise podría tener campo level)
 */
function inferNivel(category: ExerciseCategory): 'principiante' | 'intermedio' | 'avanzado' {
    switch (category) {
        case 'warmup':
        case 'cooldown':
        case 'mobility':
            return 'principiante';
        case 'power':
            return 'avanzado';
        default:
            return 'intermedio';
    }
}

/**
 * Construye array de tags a partir de muscleGroups y category
 */
function buildTags(ex: Exercise): string[] {
    const tags: string[] = [...ex.muscleGroups];

    // Añadir category como tag
    if (ex.category) {
        tags.push(ex.category);
    }

    // Añadir tags derivados
    if (ex.muscleGroups.includes('chest') || ex.muscleGroups.includes('shoulders') || ex.muscleGroups.includes('triceps')) {
        tags.push('empuje');
    }
    if (ex.muscleGroups.includes('back') || ex.muscleGroups.includes('biceps')) {
        tags.push('traccion');
    }
    if (ex.muscleGroups.includes('quads') || ex.muscleGroups.includes('hamstrings') || ex.muscleGroups.includes('glutes')) {
        tags.push('piernas');
    }
    if (ex.muscleGroups.includes('core')) {
        tags.push('estabilidad');
    }

    return [...new Set(tags)]; // Eliminar duplicados
}
