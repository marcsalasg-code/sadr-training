/**
 * AI Response Schemas - Zod validation for AI responses
 * 
 * This file contains Zod schemas for validating AI responses.
 * Each schema matches the expected JSON format from the corresponding prompt.
 * 
 * Usage:
 * - Import the schema for the response type
 * - Use schema.safeParse(data) to validate
 * - Handle validation errors gracefully
 * 
 * Benefits:
 * - Type-safe validation at runtime
 * - Clear error messages when AI returns incorrect format
 * - Automatic TypeScript type inference
 */

import { z } from 'zod';

/**
 * Template Generation Response Schema
 * Validates the output of template generation prompts
 * 
 * @example
 * const result = GenerationResponseSchema.safeParse(aiResponse);
 * if (result.success) {
 *   const template = result.data; // Fully typed
 * } else {
 *   console.error(result.error.format());
 * }
 */
export const GenerationResponseSchema = z.object({
    name: z.string().min(1, 'Template name is required'),
    description: z.string().optional(),
    exercises: z.array(z.object({
        name: z.string().min(1, 'Exercise name is required'),
        sets: z.number().int().min(1).max(10),
        reps: z.number().int().min(1).max(100),
        restSeconds: z.number().int().min(0).max(600).optional(),
        notes: z.string().optional(),
    })).min(1, 'At least one exercise is required'),
    difficulty: z.enum(['beginner', 'intermediate', 'advanced']),
    estimatedDuration: z.number().int().min(1).max(180).optional(),
    tags: z.array(z.string()).max(10).optional(),
});

export type GenerationResponse = z.infer<typeof GenerationResponseSchema>;

/**
 * Load Prediction Response Schema
 * Validates weight and rep predictions
 */
export const PredictionResponseSchema = z.object({
    suggestedWeight: z.number().min(0).max(1000),
    suggestedReps: z.number().int().min(1).max(100),
    confidence: z.number().min(0).max(1),
    reasoning: z.string().optional(),
    basedOn: z.object({
        previousSets: z.number().int().min(0),
        trend: z.enum(['increasing', 'stable', 'decreasing']),
    }).optional(),
});

export type PredictionResponse = z.infer<typeof PredictionResponseSchema>;

/**
 * Exercise Suggestion Response Schema
 * Validates exercise suggestion arrays
 */
export const SuggestionResponseSchema = z.array(z.object({
    name: z.string().min(1),
    muscleGroup: z.string().min(1),
    category: z.string().optional(),
    reasoning: z.string().optional(),
})).min(1).max(10);

export type SuggestionResponse = z.infer<typeof SuggestionResponseSchema>;

/**
 * Analysis Response Schema
 * Validates training analysis results
 */
export const AnalysisResponseSchema = z.object({
    summary: z.string().min(1),
    insights: z.array(z.object({
        type: z.enum(['positive', 'warning', 'info']),
        title: z.string().min(1),
        description: z.string().min(1),
    })).optional(),
    recommendations: z.array(z.string()).optional(),
    metrics: z.object({
        volumeTrend: z.enum(['increasing', 'stable', 'decreasing']).optional(),
        intensityTrend: z.enum(['increasing', 'stable', 'decreasing']).optional(),
        consistencyScore: z.number().min(0).max(100).optional(),
    }).optional(),
});

export type AnalysisResponse = z.infer<typeof AnalysisResponseSchema>;

/**
 * Validate AI response for generation type
 * Returns parsed data if valid, null if invalid
 */
export function validateGeneration(data: unknown): GenerationResponse | null {
    const result = GenerationResponseSchema.safeParse(data);
    if (result.success) return result.data;
    console.error('[AI Validation] Invalid generation response:', result.error);
    return null;
}

/**
 * Validate AI response for prediction type
 */
export function validatePrediction(data: unknown): PredictionResponse | null {
    const result = PredictionResponseSchema.safeParse(data);
    if (result.success) return result.data;
    console.error('[AI Validation] Invalid prediction response:', result.error);
    return null;
}

/**
 * Validate AI response for suggestion type
 */
export function validateSuggestion(data: unknown): SuggestionResponse | null {
    const result = SuggestionResponseSchema.safeParse(data);
    if (result.success) return result.data;
    console.error('[AI Validation] Invalid suggestion response:', result.error);
    return null;
}

/**
 * Validate AI response for analysis type
 */
export function validateAnalysis(data: unknown): AnalysisResponse | null {
    const result = AnalysisResponseSchema.safeParse(data);
    if (result.success) return result.data;
    console.error('[AI Validation] Invalid analysis response:', result.error);
    return null;
}

/**
 * Validate AI response by type
 * Simplified version without complex generics
 */
export function validateAIResponse(
    type: 'generation' | 'prediction' | 'suggestion' | 'analysis',
    data: unknown
): GenerationResponse | PredictionResponse | SuggestionResponse | AnalysisResponse | null {
    switch (type) {
        case 'generation': return validateGeneration(data);
        case 'prediction': return validatePrediction(data);
        case 'suggestion': return validateSuggestion(data);
        case 'analysis': return validateAnalysis(data);
        default: return null;
    }
}

/**
 * Get human-readable validation errors from Zod error
 * Compatible with Zod v4 which uses 'issues' instead of 'errors'
 */
export function getValidationErrors(error: z.ZodError<unknown>): string[] {
    // Zod v4 uses 'issues' array
    const issues = 'issues' in error ? error.issues : [];
    return issues.map((issue: z.ZodIssue) =>
        `${issue.path.join('.')}: ${issue.message}`
    );
}
