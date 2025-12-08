/**
 * AI Provider Interface
 * Abstracción para diferentes providers de IA (Mock, Remote)
 */

import type { MuscleGroup, ExerciseCategory } from '../types/types';

export interface AIRequest {
    type: 'generation' | 'prediction' | 'analysis' | 'suggestion';
    prompt: string;
    context?: Record<string, unknown>;
    options?: {
        temperature?: number;
        maxTokens?: number;
    };
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
export interface AILogEntry {
    id: string;
    timestamp: string;
    type: 'request' | 'response' | 'error';
    provider: string;
    requestType: AIRequest['type'];
    duration?: number;
    tokenUsage?: number;
    success: boolean;
    details?: string;
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
