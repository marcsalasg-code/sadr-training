/**
 * AI Provider Interface
 * Abstracción para diferentes providers de IA (Mock, Remote)
 */

import type { MuscleGroup, ExerciseCategory, BlockType, DifficultyLevel } from '../types/types';

export interface AIRequest {
    type: 'generation' | 'prediction' | 'analysis' | 'suggestion' | 'session_generation' | 'weekly_plan';
    prompt: string;
    context?: Record<string, unknown>;
    options?: {
        temperature?: number;
        maxTokens?: number;
    };
}

// ============================================
// SESSION GENERATION TYPES
// ============================================

/**
 * Configuration for structured session generation
 * Note: 'nivel' uses Spanish for AI prompt compatibility
 * but internally maps to DifficultyLevel
 */
export interface SessionGenerationConfig {
    disciplina_global: string;
    duracion_total_min: number;
    /** Spanish level for AI prompts - use mapDifficultyToNivel() */
    nivel: 'principiante' | 'intermedio' | 'avanzado';
    restricciones?: string;
    bloques: {
        tipo: BlockType;
        tiempo_min: number;
    }[];
}

/**
 * Exercise in catalog format for AI prompt
 * Note: 'nivel' uses Spanish for AI prompt compatibility
 */
export interface CatalogExercise {
    id: string;
    nombre: string;
    bloques_permitidos: BlockType[];
    /** Spanish level for AI prompts - use mapDifficultyToNivel() */
    nivel: 'principiante' | 'intermedio' | 'avanzado';
    material: string[];
    tags: string[];
}

/**
 * Generated session from AI
 * Note: 'nivel' uses Spanish for AI prompt compatibility
 * Use mapNivelToDifficulty() to convert to DifficultyLevel
 */
export interface GeneratedSession {
    id: string;
    disciplina_global: string;
    duracion_total_min: number;
    /** Spanish level from AI - use mapNivelToDifficulty() to convert */
    nivel: 'principiante' | 'intermedio' | 'avanzado';
    bloques: {
        tipo: BlockType;
        tiempo_min: number;
        ejercicios: {
            id: string;
            series: number | null;
            reps: number | string | null;
            duracion_seg: number | null;
            notas?: string;
        }[];
    }[];
}

/**
 * Session generation response from AI
 */
export interface SessionGenerationResponse {
    propuestas: GeneratedSession[];
}

export interface AIResponse<T = unknown> {
    success: boolean;
    data?: T;
    error?: string;
    usage?: {
        promptTokens: number;
        completionTokens: number;
    };
    cached?: boolean;
}

export interface IAIProvider {
    readonly name: string;
    readonly isAvailable: boolean;

    initialize(): Promise<void>;
    complete<T>(request: AIRequest): Promise<AIResponse<T>>;
    testConnection(): Promise<boolean>;
}

// Tipos específicos para generación de templates
export interface GeneratedTemplate {
    name: string;
    description: string;
    exercises: {
        name: string;
        sets: number;
        reps: number;
        restSeconds: number;
        notes?: string;
    }[];
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    estimatedDuration: number;
    tags: string[];
}

// Tipos específicos para predicción de carga
export interface LoadPrediction {
    suggestedWeight: number;
    suggestedReps: number;
    confidence: number; // 0-1
    reasoning: string;
    basedOn: {
        previousSets: number;
        trend: 'increasing' | 'stable' | 'decreasing';
    };
}

// Tipos para logs de IA
export type AIQualityFlag = 'ok' | 'incomplete' | 'suspect';

export interface AILogEntry {
    id: string;
    timestamp: string;
    type: 'request' | 'response' | 'error' | 'fallback';
    provider: string;
    requestType: AIRequest['type'];
    duration?: number;
    tokenUsage?: number;
    success: boolean;
    details?: string;
    /** Quality assessment of the response */
    qualityFlag?: AIQualityFlag;
}

// Tipos para feedback de respuestas IA
export interface AIFeedback {
    id: string;
    logId: string;
    timestamp: string;
    rating: 'positive' | 'negative';
    category?: 'accurate' | 'not_useful' | 'imprecise' | 'other';
    comment?: string;
}

// Tipos para sugerencias de ejercicios
export interface ExerciseSuggestion {
    name: string;
    muscleGroup: MuscleGroup;
    category: ExerciseCategory;
    reasoning?: string;
}

// Tipos para análisis de sesiones/rendimiento
export interface AnalysisInsight {
    type: 'positive' | 'warning' | 'info';
    title: string;
    description: string;
}

export interface AnalysisResult {
    summary: string;
    insights: AnalysisInsight[];
    recommendations: string[];
    metrics?: {
        volumeTrend?: 'increasing' | 'stable' | 'decreasing';
        intensityTrend?: 'increasing' | 'stable' | 'decreasing';
        consistencyScore?: number;
    };
}

/**
 * Assess quality of AI response based on completeness and content
 */
export function assessQuality(data: unknown, type: AIRequest['type']): AIQualityFlag {
    if (!data || typeof data !== 'object') return 'suspect';

    const obj = data as Record<string, unknown>;

    switch (type) {
        case 'generation':
            // Check for required fields
            if (!obj.name || !obj.exercises || !Array.isArray(obj.exercises)) return 'incomplete';
            if ((obj.exercises as unknown[]).length === 0) return 'incomplete';
            if (typeof obj.name === 'string' && obj.name.length < 3) return 'suspect';
            break;

        case 'prediction':
            if (obj.suggestedWeight === undefined || obj.suggestedReps === undefined) return 'incomplete';
            if (typeof obj.confidence === 'number' && obj.confidence < 0.3) return 'suspect';
            break;

        case 'suggestion':
            if (!Array.isArray(data) || data.length === 0) return 'incomplete';
            break;

        case 'analysis':
            if (!obj.summary || typeof obj.summary !== 'string') return 'incomplete';
            if (obj.summary.length < 20) return 'suspect';
            break;
    }

    return 'ok';
}

