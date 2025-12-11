/**
 * Training Config Model - Configuración editable de categorías y análisis
 * 
 * Esta capa permite personalizar etiquetas, orden y visibilidad
 * de patterns y muscle groups sin cambiar los IDs internos.
 */

import type { MovementPattern, MuscleGroup } from '../exercises/exercise.model';

// ============================================
// PATTERN CONFIG
// ============================================

/**
 * Configuration for a movement pattern
 */
export interface PatternConfig {
    id: MovementPattern;        // ID interno fijo (squat, hinge, etc.)
    label: string;              // Etiqueta visible configurable
    enabled: boolean;           // Visible en filtros y selectores
    order: number;              // Orden en listas (0 = primero)
    icon?: string;              // Emoji o icono
}

// ============================================
// MUSCLE GROUP CONFIG
// ============================================

/**
 * Configuration for a muscle group
 */
export interface MuscleGroupConfig {
    id: MuscleGroup;            // ID interno fijo
    label: string;              // Etiqueta visible configurable
    enabled: boolean;           // Visible en filtros
    order: number;              // Orden en listas
    icon?: string;              // Emoji o icono
}

// ============================================
// ANALYSIS CONFIG
// ============================================

/**
 * 1RM calculation method
 */
export type OneRMMethod = 'brzycki' | 'epley';

/**
 * Volume display format
 */
export type VolumeDisplay = 'kg_total' | 'tonnage';

/**
 * Analysis configuration
 */
export interface AnalysisConfig {
    defaultRMMethod: OneRMMethod;       // Método por defecto para 1RM
    showVolumeAs: VolumeDisplay;        // Cómo mostrar volumen
}

// ============================================
// TRAINING CONFIG (Root)
// ============================================

/**
 * TrainingConfig - Configuración global de training
 * 
 * Controla:
 * - Etiquetas visibles de patterns y muscle groups
 * - Qué categorías están activas/visibles
 * - Orden de categorías en listas
 * - Configuración de métricas y análisis
 */
export interface TrainingConfig {
    patterns: PatternConfig[];
    muscleGroups: MuscleGroupConfig[];
    analysis: AnalysisConfig;
}

// ============================================
// DEFAULTS
// ============================================

/**
 * Default pattern configurations
 */
export const DEFAULT_PATTERNS: PatternConfig[] = [
    { id: 'squat', label: 'Sentadilla', enabled: true, order: 0, icon: '🦵' },
    { id: 'hinge', label: 'Bisagra', enabled: true, order: 1, icon: '🍑' },
    { id: 'push', label: 'Empuje', enabled: true, order: 2, icon: '💪' },
    { id: 'pull', label: 'Tirón', enabled: true, order: 3, icon: '🏋️' },
    { id: 'core', label: 'Core', enabled: true, order: 4, icon: '🧘' },
    { id: 'carry', label: 'Acarreo', enabled: true, order: 5, icon: '🚶' },
    { id: 'other', label: 'Otros', enabled: true, order: 6, icon: '➕' },
];

/**
 * Default muscle group configurations
 */
export const DEFAULT_MUSCLE_GROUPS: MuscleGroupConfig[] = [
    { id: 'legs', label: 'Piernas', enabled: true, order: 0, icon: '🦵' },
    { id: 'chest', label: 'Pecho', enabled: true, order: 1, icon: '💪' },
    { id: 'back', label: 'Espalda', enabled: true, order: 2, icon: '🔙' },
    { id: 'shoulders', label: 'Hombros', enabled: true, order: 3, icon: '🎯' },
    { id: 'arms', label: 'Brazos', enabled: true, order: 4, icon: '💪' },
    { id: 'full', label: 'Full Body', enabled: true, order: 5, icon: '🏃' },
    { id: 'other', label: 'Otros', enabled: true, order: 6, icon: '➕' },
];

/**
 * Default analysis configuration
 */
export const DEFAULT_ANALYSIS_CONFIG: AnalysisConfig = {
    defaultRMMethod: 'brzycki',
    showVolumeAs: 'kg_total',
};

/**
 * Default complete training config
 */
export const DEFAULT_TRAINING_CONFIG: TrainingConfig = {
    patterns: DEFAULT_PATTERNS,
    muscleGroups: DEFAULT_MUSCLE_GROUPS,
    analysis: DEFAULT_ANALYSIS_CONFIG,
};

// ============================================
// HELPERS
// ============================================

/**
 * Get enabled patterns sorted by order
 */
export function getEnabledPatterns(config: TrainingConfig): PatternConfig[] {
    return config.patterns
        .filter(p => p.enabled)
        .sort((a, b) => a.order - b.order);
}

/**
 * Get enabled muscle groups sorted by order
 */
export function getEnabledMuscleGroups(config: TrainingConfig): MuscleGroupConfig[] {
    return config.muscleGroups
        .filter(m => m.enabled)
        .sort((a, b) => a.order - b.order);
}

/**
 * Get pattern label by ID
 */
export function getPatternLabel(config: TrainingConfig, patternId: MovementPattern): string {
    return config.patterns.find(p => p.id === patternId)?.label || patternId;
}

/**
 * Get muscle group label by ID
 */
export function getMuscleGroupLabel(config: TrainingConfig, muscleGroupId: MuscleGroup): string {
    return config.muscleGroups.find(m => m.id === muscleGroupId)?.label || muscleGroupId;
}
