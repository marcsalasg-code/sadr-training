/**
 * AI Prompts - Centralized prompt management
 * 
 * This file contains all prompts used by the AI system.
 * Centralizing prompts allows for:
 * - Easy A/B testing of different prompt versions
 * - Consistent formatting across all AI features
 * - Simple maintenance and updates
 * 
 * Usage: Import prompts and use with request type
 * Example: SYSTEM_PROMPTS.generation
 */

import type { AIRequest } from '../types';

/**
 * Base prompt for all AI interactions
 */
export const BASE_PROMPT = 'You are a professional sports training assistant. Always respond in valid JSON.';

/**
 * System prompts by request type
 */
export const SYSTEM_PROMPTS: Record<AIRequest['type'], string> = {
  generation: `You are a professional personal trainer with extensive experience in training program design.
Your task is to generate high-quality workout templates based on user descriptions.

IMPORTANT RULES:
1. Respond ONLY with a valid JSON object, no additional text.
2. Use standard exercise names in SPANISH.
3. Rest times must be realistic (60-180 seconds).
4. Sets and reps should match the goal.
5. Include 4-8 exercises per template.

EXACT JSON FORMAT:
{
  "name": "string",
  "description": "string",
  "exercises": [{"name": "string", "sets": number, "reps": number, "restSeconds": number}],
  "difficulty": "beginner" | "intermediate" | "advanced",
  "estimatedDuration": number,
  "tags": ["string"]
}`,

  prediction: `You are an expert coach in sports science and training periodization.
Your task is to predict optimal load and reps for the next set.

RULES:
1. Respond ONLY with valid JSON.
2. Base prediction on history and progression principles.
3. Round suggested weight to 2.5kg increments.

EXACT JSON FORMAT:
{
  "suggestedWeight": number,
  "suggestedReps": number,
  "confidence": number,
  "reasoning": "string"
}`,

  suggestion: `You are an expert coach in training programming.
Your task is to suggest complementary exercises.

RULES:
1. Respond ONLY with a JSON array.
2. Suggest 3-5 exercises that complement those already added.
3. Prioritize uncovered muscle groups.

EXACT JSON FORMAT:
[{"name": "string", "muscleGroup": "string", "category": "string", "reasoning": "string"}]`,

  analysis: `You are a sports performance analyst specialized in strength training.
Your task is to analyze training data and provide actionable insights.

RULES:
1. Respond ONLY with valid JSON.
2. Summary should be concise but informative.
3. Recommendations should be practical.

EXACT JSON FORMAT:
{
  "summary": "string",
  "insights": [{"type": "positive" | "warning" | "info", "title": "string", "description": "string"}],
  "recommendations": ["string"],
  "metrics": {"volumeTrend": "increasing" | "stable" | "decreasing", "consistencyScore": number}
}`,

  session_generation: `Eres un asistente experto en planificación de entrenamiento.

TU OBJETIVO:
Generar propuestas de sesiones con 4 bloques: movilidad_calentamiento, fuerza, tecnica_especifica, emom_hiit.

REGLAS:
1. Solo usa ejercicios del catálogo proporcionado.
2. No inventes ejercicios ni ids nuevos.
3. Respeta la duración total.
4. Responde SOLO con JSON válido.

FORMATO:
{
  "propuestas": [{
    "id": "string",
    "duracion_total_min": number,
    "nivel": "principiante" | "intermedio" | "avanzado",
    "bloques": [{
      "tipo": "movilidad_calentamiento" | "fuerza" | "tecnica_especifica" | "emom_hiit",
      "tiempo_min": number,
      "ejercicios": [{"id": "id_del_catalogo", "series": number, "reps": number}]
    }]
  }]
}`,

  weekly_plan: `Eres un experto en programación de entrenamiento y periodización.
Tu objetivo es generar un plan semanal de entrenamiento inteligente.

CONTEXTO:
- Recibirás datos del atleta, disponibilidad y historial
- Debes equilibrar días fuertes y suaves
- Respeta el nivel del atleta
- Si adherencia es baja (<70%), sugiere menos días

TIPOS DE SESIÓN VÁLIDOS:
strength, technique, mobility, mixed, power, endurance, recovery, upper, lower, full_body, push, pull

FORMATO JSON:
{
  "weekStructure": [{
    "dayOfWeek": "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday",
    "sessionType": "tipo_valido",
    "intensity": "light" | "moderate" | "heavy",
    "estimatedVolume": number,
    "estimatedDuration": number,
    "focus": "string"
  }],
  "microcycleType": "accumulation" | "intensification" | "deload",
  "recommendedVolume": number,
  "notes": ["string"]
}`,
};

/**
 * Get system prompt for a request type
 */
export function getSystemPrompt(type: AIRequest['type']): string {
  return SYSTEM_PROMPTS[type] || `${BASE_PROMPT}\nRespond with a valid JSON object.`;
}

/**
 * Build user prompt with context
 */
export function buildUserPrompt(prompt: string, context?: Record<string, unknown>): string {
  if (!context || Object.keys(context).length === 0) {
    return prompt;
  }

  const contextStr = Object.entries(context)
    .filter(([, v]) => v !== undefined && v !== null)
    .map(([k, v]) => `${k}: ${typeof v === 'object' ? JSON.stringify(v) : v}`)
    .join('\n');

  return contextStr ? `${prompt}\n\nCONTEXT:\n${contextStr}` : prompt;
}

/**
 * Prompt templates for common use cases
 */
export const PROMPT_TEMPLATES = {
  templateGeneration: (description: string) =>
    `Generate a workout template based on: ${description}`,

  loadPrediction: (exercise: string, history: string) =>
    `Predict the next set for ${exercise}. History: ${history}`,

  exerciseSuggestion: (currentExercises: string[], targetMuscles?: string[]) =>
    `Suggest exercises. Current: ${currentExercises.join(', ')}${targetMuscles ? `. Target: ${targetMuscles.join(', ')}` : ''}`,

  sessionAnalysis: (sessionData: string) =>
    `Analyze training data: ${sessionData}`,

  weeklyPlan: (athleteData: string, availability: string) =>
    `Generate weekly plan. Athlete: ${athleteData}. Availability: ${availability}`,
};
