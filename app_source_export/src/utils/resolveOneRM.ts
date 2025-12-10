/**
 * resolveOneRM.ts - Resolución de 1RM según Sprint 1
 * 
 * Función principal: resolveOneRM(exercise, athlete, rules)
 * 
 * Orden de resolución:
 * 1. Si exercise es ancla y athlete tiene 1RM → usar ese
 * 2. Si hay regla en rules.priority → buscar en ese orden
 * 3. Si fallbackToRegion → buscar ancla de misma región
 * 4. Si fallbackToGroup → buscar ancla del mismo grupo
 * 5. Si nada → null
 */

import type { Exercise, Athlete } from '../types/types';

// ============================================
// TIPOS DE REGLAS
// ============================================

/**
 * Regla de referencia para un ejercicio específico
 */
export interface OneRMReferenceRule {
    /** Lista ordenada de exercise IDs a buscar como referencia */
    priority: string[];
    /** Si true, busca anclas de la misma bodyRegion */
    fallbackToRegion?: boolean;
    /** Si true, busca anclas del mismo oneRMGroupId */
    fallbackToGroup?: boolean;
}

/**
 * Mapa de reglas: exerciseId → regla de referencia
 */
export type OneRMReferenceRules = Record<string, OneRMReferenceRule>;

/**
 * Resultado de la resolución de 1RM
 */
export interface ResolveOneRMResult {
    /** Valor del 1RM resuelto */
    value: number;
    /** Tipo de fuente */
    source: 'own' | 'priority' | 'region' | 'group';
    /** ID del ejercicio de origen (si es referencia) */
    sourceExerciseId?: string;
}

// ============================================
// FUNCIÓN PRINCIPAL
// ============================================

/**
 * Resuelve el 1RM de un ejercicio para un atleta dado
 * 
 * @param exercise - Ejercicio a resolver
 * @param athlete - Atleta con datos de 1RM
 * @param rules - Reglas de referencia configuradas
 * @param allExercises - Lista de todos los ejercicios (para buscar anclas)
 * @returns Resultado con valor y fuente, o null si no hay datos
 */
export function resolveOneRM(
    exercise: Exercise,
    athlete: Athlete,
    rules: OneRMReferenceRules,
    allExercises: Exercise[]
): ResolveOneRMResult | null {
    // Obtener el mapa de 1RM del atleta
    // Soporta tanto oneRM simple como oneRMRecords complejo
    const oneRMMap = getAthleteOneRMMap(athlete);

    // 1. Si el ejercicio tiene 1RM propio → usar ese
    const ownValue = oneRMMap[exercise.id];
    if (ownValue !== undefined && ownValue > 0) {
        return {
            value: ownValue,
            source: 'own',
        };
    }

    // 2. Si hay regla específica para este ejercicio → buscar en priority
    const rule = rules[exercise.id];
    if (rule?.priority?.length) {
        for (const refId of rule.priority) {
            const refValue = oneRMMap[refId];
            if (refValue !== undefined && refValue > 0) {
                return {
                    value: refValue,
                    source: 'priority',
                    sourceExerciseId: refId,
                };
            }
        }
    }

    // 3. fallbackToRegion: buscar ancla de misma región
    if (rule?.fallbackToRegion && exercise.bodyRegion) {
        const regionAnchor = findAnchorByRegion(
            exercise.bodyRegion,
            allExercises,
            oneRMMap,
            exercise.id
        );
        if (regionAnchor) {
            return {
                value: regionAnchor.value,
                source: 'region',
                sourceExerciseId: regionAnchor.exerciseId,
            };
        }
    }

    // 4. fallbackToGroup: buscar ancla del mismo grupo
    if (rule?.fallbackToGroup && exercise.oneRMGroupId) {
        const groupAnchor = findAnchorByGroup(
            exercise.oneRMGroupId,
            allExercises,
            oneRMMap,
            exercise.id
        );
        if (groupAnchor) {
            return {
                value: groupAnchor.value,
                source: 'group',
                sourceExerciseId: groupAnchor.exerciseId,
            };
        }
    }

    // 5. Sin datos
    return null;
}

// ============================================
// HELPERS
// ============================================

/**
 * Extrae el mapa de 1RM del atleta (soporta ambos formatos)
 */
function getAthleteOneRMMap(athlete: Athlete): Record<string, number> {
    const result: Record<string, number> = {};

    // Formato nuevo: oneRMRecords
    if (athlete.oneRMRecords) {
        for (const [exId, record] of Object.entries(athlete.oneRMRecords)) {
            if (record.currentOneRM) {
                result[exId] = record.currentOneRM;
            }
        }
    }

    // Formato simple: oneRM (si existiera)
    // @ts-expect-error - Soporta formato legacy
    if (athlete.oneRM) {
        // @ts-expect-error
        Object.assign(result, athlete.oneRM);
    }

    return result;
}

/**
 * Busca un ejercicio ancla de la misma región con 1RM
 */
function findAnchorByRegion(
    region: string,
    allExercises: Exercise[],
    oneRMMap: Record<string, number>,
    excludeId: string
): { exerciseId: string; value: number } | null {
    for (const ex of allExercises) {
        if (
            ex.id !== excludeId &&
            ex.isPrimaryOneRM &&
            ex.bodyRegion === region &&
            oneRMMap[ex.id] > 0
        ) {
            return { exerciseId: ex.id, value: oneRMMap[ex.id] };
        }
    }
    return null;
}

/**
 * Busca un ejercicio ancla del mismo grupo con 1RM
 */
function findAnchorByGroup(
    groupId: string,
    allExercises: Exercise[],
    oneRMMap: Record<string, number>,
    excludeId: string
): { exerciseId: string; value: number } | null {
    for (const ex of allExercises) {
        if (
            ex.id !== excludeId &&
            ex.isPrimaryOneRM &&
            ex.oneRMGroupId === groupId &&
            oneRMMap[ex.id] > 0
        ) {
            return { exerciseId: ex.id, value: oneRMMap[ex.id] };
        }
    }
    return null;
}

/**
 * Crea reglas vacías (helper para inicialización)
 */
export function createEmptyRules(): OneRMReferenceRules {
    return {};
}

/**
 * Añade o actualiza una regla
 */
export function setRule(
    rules: OneRMReferenceRules,
    exerciseId: string,
    rule: OneRMReferenceRule
): OneRMReferenceRules {
    return {
        ...rules,
        [exerciseId]: rule,
    };
}

export default {
    resolveOneRM,
    createEmptyRules,
    setRule,
};
