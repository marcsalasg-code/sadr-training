/**
 * oneRMReference.ts - Utilidades para resolución de 1RM con ejercicios ancla
 * 
 * Este módulo resuelve el 1RM de un ejercicio:
 * 1. Si el ejercicio es ancla y el atleta tiene 1RM → usar ese
 * 2. Si no es ancla, buscar referencia configurada → usar 1RM del ancla
 * 3. Si no hay referencia específica, usar groupDefaults por bodyRegion
 * 4. Si no hay nada → null (sin referencia)
 * 
 * IMPORTANTE: Las referencias solo sugieren, nunca crean 1RM automáticamente.
 */

import type {
    Exercise,
    Athlete,
    OneRMAnchorConfig,
    BodyRegion,
    OneRMRecord
} from '../types/types';

// ============================================
// TIPOS PARA CONTEXTO DE REFERENCIA
// ============================================

export interface OneRMReferenceResult {
    oneRM: number;
    source: 'own' | 'reference';
    sourceExerciseId?: string;
    sourceExerciseName?: string;
}

export interface OneRMContextInfo {
    hasReference: boolean;
    referenceType: 'own' | 'direct_map' | 'group_default' | 'none';
    oneRM?: number;
    sourceExercise?: {
        id: string;
        name: string;
    };
    displayText: string;
    shortText: string;
}

// ============================================
// FUNCIONES PRINCIPALES
// ============================================

/**
 * Obtener lista de ejercicios que son ancla de 1RM
 */
export function getOneRMAnchorExercises(
    exercises: Exercise[],
    config?: OneRMAnchorConfig
): Exercise[] {
    // Filtrar por isPrimaryOneRM en el ejercicio
    const byFlag = exercises.filter(e => e.isPrimaryOneRM);

    // También incluir los que están en anchorExerciseIds del config
    if (config?.anchorExerciseIds) {
        const configIds = new Set(config.anchorExerciseIds);
        const additional = exercises.filter(e => configIds.has(e.id) && !e.isPrimaryOneRM);
        return [...byFlag, ...additional];
    }

    return byFlag;
}

/**
 * Verificar si un ejercicio es ancla de 1RM
 */
export function isAnchorExercise(
    exercise: Exercise,
    config?: OneRMAnchorConfig
): boolean {
    if (exercise.isPrimaryOneRM) return true;
    if (config?.anchorExerciseIds?.includes(exercise.id)) return true;
    return false;
}

/**
 * Resolver el 1RM de un ejercicio para un atleta
 * Devuelve el 1RM propio o de referencia según configuración
 */
export function resolveOneRMReference(
    exerciseId: string,
    exercises: Exercise[],
    athlete: Athlete,
    config?: OneRMAnchorConfig
): OneRMReferenceResult | null {
    const exercise = exercises.find(e => e.id === exerciseId);
    if (!exercise) return null;

    const oneRMRecords = athlete.oneRMRecords || {};

    // 1. Si el ejercicio tiene 1RM propio → usar ese
    const ownRecord = oneRMRecords[exerciseId];
    if (ownRecord?.currentOneRM) {
        return {
            oneRM: ownRecord.currentOneRM,
            source: 'own',
        };
    }

    // 2. Si es ancla pero no tiene 1RM → no hay referencia
    if (isAnchorExercise(exercise, config)) {
        return null;
    }

    // 3. Buscar referencia directa en el mapa
    if (config?.referenceMap?.[exerciseId]) {
        const referenceIds = config.referenceMap[exerciseId];
        for (const refId of referenceIds) {
            const refRecord = oneRMRecords[refId];
            if (refRecord?.currentOneRM) {
                const refExercise = exercises.find(e => e.id === refId);
                return {
                    oneRM: refRecord.currentOneRM,
                    source: 'reference',
                    sourceExerciseId: refId,
                    sourceExerciseName: refExercise?.name,
                };
            }
        }
    }

    // 4. Buscar por bodyRegion en groupDefaults
    if (exercise.bodyRegion && config?.groupDefaults?.[exercise.bodyRegion]) {
        const regionAnchors = config.groupDefaults[exercise.bodyRegion];
        for (const anchorId of regionAnchors) {
            const anchorRecord = oneRMRecords[anchorId];
            if (anchorRecord?.currentOneRM) {
                const anchorExercise = exercises.find(e => e.id === anchorId);
                return {
                    oneRM: anchorRecord.currentOneRM,
                    source: 'reference',
                    sourceExerciseId: anchorId,
                    sourceExerciseName: anchorExercise?.name,
                };
            }
        }
    }

    // 5. No hay referencia disponible
    return null;
}

/**
 * Obtener contexto visual para mostrar en UI
 */
export function getOneRMReferenceContext(
    exerciseId: string,
    exercises: Exercise[],
    athlete: Athlete,
    config?: OneRMAnchorConfig
): OneRMContextInfo {
    const exercise = exercises.find(e => e.id === exerciseId);

    if (!exercise) {
        return {
            hasReference: false,
            referenceType: 'none',
            displayText: '',
            shortText: '',
        };
    }

    const oneRMRecords = athlete.oneRMRecords || {};

    // 1. 1RM propio
    const ownRecord = oneRMRecords[exerciseId];
    if (ownRecord?.currentOneRM) {
        return {
            hasReference: true,
            referenceType: 'own',
            oneRM: ownRecord.currentOneRM,
            displayText: `1RM: ${ownRecord.currentOneRM}kg`,
            shortText: `${ownRecord.currentOneRM}kg`,
        };
    }

    // 2. Referencia directa
    if (config?.referenceMap?.[exerciseId]) {
        const referenceIds = config.referenceMap[exerciseId];
        for (const refId of referenceIds) {
            const refRecord = oneRMRecords[refId];
            if (refRecord?.currentOneRM) {
                const refExercise = exercises.find(e => e.id === refId);
                return {
                    hasReference: true,
                    referenceType: 'direct_map',
                    oneRM: refRecord.currentOneRM,
                    sourceExercise: refExercise ? { id: refId, name: refExercise.name } : undefined,
                    displayText: `Ref: ${refExercise?.name || 'Ancla'} ${refRecord.currentOneRM}kg`,
                    shortText: `↗${refRecord.currentOneRM}kg`,
                };
            }
        }
    }

    // 3. Default por bodyRegion
    if (exercise.bodyRegion && config?.groupDefaults?.[exercise.bodyRegion]) {
        const regionAnchors = config.groupDefaults[exercise.bodyRegion];
        for (const anchorId of regionAnchors) {
            const anchorRecord = oneRMRecords[anchorId];
            if (anchorRecord?.currentOneRM) {
                const anchorExercise = exercises.find(e => e.id === anchorId);
                return {
                    hasReference: true,
                    referenceType: 'group_default',
                    oneRM: anchorRecord.currentOneRM,
                    sourceExercise: anchorExercise ? { id: anchorId, name: anchorExercise.name } : undefined,
                    displayText: `Ref (${exercise.bodyRegion}): ${anchorExercise?.name || 'Ancla'} ${anchorRecord.currentOneRM}kg`,
                    shortText: `↗${anchorRecord.currentOneRM}kg`,
                };
            }
        }
    }

    // 4. Sin referencia
    return {
        hasReference: false,
        referenceType: 'none',
        displayText: '',
        shortText: '',
    };
}

/**
 * Calcular carga relativa para un % de 1RM
 */
export function calculateRelativeLoad(
    oneRM: number,
    percentage: number
): number {
    if (oneRM <= 0 || percentage <= 0) return 0;
    const load = oneRM * (percentage / 100);
    // Redondear a 2.5kg más cercano
    return Math.round(load / 2.5) * 2.5;
}

/**
 * Obtener texto de sugerencia de carga para un rango de reps
 */
export function getLoadSuggestionText(
    oneRM: number,
    targetReps: number,
    isReference: boolean = false
): string {
    if (oneRM <= 0 || targetReps <= 0) return '';

    // Porcentajes aproximados por reps (tabla estándar)
    const repPercentages: Record<number, number> = {
        1: 100, 2: 95, 3: 93, 4: 90, 5: 87,
        6: 85, 7: 83, 8: 80, 9: 77, 10: 75,
        12: 70, 15: 65, 20: 60,
    };

    // Encontrar el % más cercano
    let percentage = 70; // default
    const sortedReps = Object.keys(repPercentages).map(Number).sort((a, b) => a - b);
    for (const reps of sortedReps) {
        if (targetReps <= reps) {
            percentage = repPercentages[reps];
            break;
        }
    }

    const suggestedLoad = calculateRelativeLoad(oneRM, percentage);
    const prefix = isReference ? '≈' : '';

    return `${prefix}${percentage}% → ${suggestedLoad}kg`;
}

/**
 * Crear configuración por defecto para OneRMAnchorConfig
 */
export function createDefaultAnchorConfig(): OneRMAnchorConfig {
    return {
        anchorExerciseIds: [],
        referenceMap: {},
        groupDefaults: {
            upper: [],
            lower: [],
            full: [],
            core: [],
        },
    };
}

export default {
    getOneRMAnchorExercises,
    isAnchorExercise,
    resolveOneRMReference,
    getOneRMReferenceContext,
    calculateRelativeLoad,
    getLoadSuggestionText,
    createDefaultAnchorConfig,
};
