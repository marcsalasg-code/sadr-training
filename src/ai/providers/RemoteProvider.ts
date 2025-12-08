/**
 * Remote AI Provider
 * Provider genérico para APIs remotas (OpenAI, Anthropic, etc.)
 */

import type { IAIProvider, AIRequest, AIResponse } from '../types';


export interface RemoteProviderConfig {
    apiUrl: string;
    apiKey: string;
    model?: string;
    headers?: Record<string, string>;
}

export class RemoteProvider implements IAIProvider {
    readonly name = 'remote';
    private config: RemoteProviderConfig | null = null;

    get isAvailable(): boolean {
        return this.config !== null && !!this.config.apiKey;
    }

    async initialize(config?: RemoteProviderConfig): Promise<void> {
        if (config) {
            this.config = config;
        }
        console.log('[RemoteProvider] Initialized', this.isAvailable ? 'with config' : 'without config');
    }

    setConfig(config: RemoteProviderConfig): void {
        this.config = config;
    }

    async complete<T>(request: AIRequest): Promise<AIResponse<T>> {
        if (!this.config || !this.isAvailable) {
            return {
                success: false,
                error: 'RemoteProvider not configured. Please set API key.',
            };
        }

        // Timeout de 30 segundos para evitar hang infinito
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000);

        try {
            const systemPrompt = this.getSystemPrompt(request.type);

            const response = await fetch(this.config.apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.config.apiKey}`,
                    ...this.config.headers,
                },
                body: JSON.stringify({
                    model: this.config.model || 'gpt-4o-mini',
                    messages: [
                        { role: 'system', content: systemPrompt },
                        { role: 'user', content: this.buildUserPrompt(request) },
                    ],
                    temperature: request.options?.temperature ?? 0.7,
                    max_tokens: request.options?.maxTokens ?? 2000,
                    response_format: { type: 'json_object' },
                }),
                signal: controller.signal,
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`API Error ${response.status}: ${errorText}`);
            }

            const result = await response.json();
            const content = result.choices?.[0]?.message?.content;

            if (!content) {
                throw new Error('Empty response from API');
            }

            const parsedData = JSON.parse(content) as T;

            return {
                success: true,
                data: parsedData,
                usage: {
                    promptTokens: result.usage?.prompt_tokens ?? 0,
                    completionTokens: result.usage?.completion_tokens ?? 0,
                },
                cached: false,
            };
        } catch (error) {
            clearTimeout(timeoutId);

            // Manejar timeout específicamente
            if (error instanceof Error && error.name === 'AbortError') {
                return {
                    success: false,
                    error: 'La solicitud tardó demasiado. Por favor, inténtalo de nuevo.',
                };
            }

            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    }

    async testConnection(): Promise<boolean> {
        if (!this.config || !this.isAvailable) {
            return false;
        }

        try {
            const response = await this.complete({
                type: 'analysis',
                prompt: 'Responde solo con: {"status": "ok"}',
            });
            return response.success;
        } catch {
            return false;
        }
    }

    private getSystemPrompt(type: AIRequest['type']): string {
        const basePrompt = 'Eres un asistente de entrenamiento deportivo profesional. Responde siempre en JSON válido.';

        switch (type) {
            case 'generation':
                return `Eres un entrenador personal profesional con amplia experiencia en diseño de programas de entrenamiento.
Tu tarea es generar plantillas de entrenamiento de alta calidad basadas en la descripción del usuario.

REGLAS IMPORTANTES:
1. Responde ÚNICAMENTE con un objeto JSON válido, sin texto adicional.
2. Usa nombres de ejercicios estándar en ESPAÑOL (ej: "Press de Banca", "Sentadilla", "Peso Muerto", "Dominadas", "Remo con Barra", "Press Militar", "Curl de Bíceps", "Extensión de Tríceps", "Zancadas", "Hip Thrust", "Elevaciones Laterales", "Aperturas", "Fondos", "Plancha", "Prensa de Piernas", "Curl Femoral", "Extensión de Cuádriceps", etc.).
3. Los tiempos de descanso deben ser realistas:
   - Ejercicios compuestos pesados (Sentadilla, Peso Muerto, Press de Banca): 120-180 segundos
   - Ejercicios compuestos moderados: 90-120 segundos
   - Ejercicios de aislamiento: 60-90 segundos
4. El número de series y repeticiones debe ser coherente con el objetivo:
   - Fuerza: 4-6 series, 3-6 reps, descansos largos
   - Hipertrofia: 3-4 series, 8-12 reps, descansos moderados
   - Resistencia: 2-3 series, 15-20 reps, descansos cortos
5. La dificultad debe reflejar la complejidad técnica y el volumen total.
6. Incluye entre 4 y 8 ejercicios por plantilla.

FORMATO JSON EXACTO (respeta los tipos de datos):
{
  "name": "string - Nombre descriptivo de la plantilla",
  "description": "string - Descripción breve del objetivo y enfoque",
  "exercises": [
    {
      "name": "string - Nombre estándar del ejercicio en español",
      "sets": number - Número de series (1-6),
      "reps": number - Número de repeticiones (3-20),
      "restSeconds": number - Segundos de descanso (30-180),
      "notes": "string opcional - Indicaciones técnicas breves"
    }
  ],
  "difficulty": "beginner" | "intermediate" | "advanced",
  "estimatedDuration": number - Duración estimada en minutos (20-90),
  "tags": ["string"] - Etiquetas descriptivas (máximo 4)
}

Genera la plantilla basándote en la descripción del usuario.`;

            case 'prediction':
                return `Eres un entrenador experto en ciencias del deporte y periodización del entrenamiento.
Tu tarea es predecir la carga y repeticiones óptimas para la siguiente serie de un ejercicio.

REGLAS:
1. Responde ÚNICAMENTE con JSON válido.
2. Basa tu predicción en el historial proporcionado y principios de progresión.
3. Si el atleta superó las reps objetivo con facilidad (RPE bajo), sugiere aumentar peso.
4. Si el atleta no alcanzó las reps objetivo o RPE fue muy alto, sugiere mantener o reducir.
5. Redondea el peso sugerido a incrementos de 2.5kg.
6. La confianza (0-1) debe reflejar la cantidad y calidad de datos disponibles.

FORMATO JSON EXACTO:
{
  "suggestedWeight": number - Peso sugerido en kg (redondeado a 2.5),
  "suggestedReps": number - Repeticiones sugeridas (3-20),
  "confidence": number - Confianza en la predicción (0.0-1.0),
  "reasoning": "string - Explicación breve de la lógica usada",
  "basedOn": {
    "previousSets": number - Número de series previas analizadas,
    "trend": "increasing" | "stable" | "decreasing"
  }
}`;

            case 'suggestion':
                return `Eres un entrenador experto en programación de entrenamientos.
Tu tarea es sugerir ejercicios complementarios para una sesión de entrenamiento.

REGLAS:
1. Responde ÚNICAMENTE con un array JSON de ejercicios.
2. Sugiere ejercicios que complementen los ya añadidos (sinergia, equilibrio muscular).
3. Evita sugerir ejercicios que ya están en la sesión.
4. Prioriza ejercicios que trabajen grupos musculares no cubiertos.
5. Incluye variedad entre compuestos y aislamiento.
6. Devuelve entre 3 y 5 sugerencias.

GRUPOS MUSCULARES VÁLIDOS: chest, back, shoulders, biceps, triceps, quads, hamstrings, glutes, calves, core, full_body

CATEGORÍAS VÁLIDAS: strength, hypertrophy, endurance, power, mobility

FORMATO JSON EXACTO (array):
[
  {
    "name": "string - Nombre del ejercicio en español",
    "muscleGroup": "string - Grupo muscular principal",
    "category": "string - Categoría del ejercicio",
    "reasoning": "string - Por qué se sugiere este ejercicio"
  }
]`;

            case 'analysis':
                return `Eres un analista de rendimiento deportivo especializado en entrenamiento de fuerza.
Tu tarea es analizar datos de entrenamiento y proporcionar insights accionables.

REGLAS:
1. Responde ÚNICAMENTE con JSON válido.
2. El resumen debe ser conciso pero informativo.
3. Los insights deben ser específicos y basados en los datos proporcionados.
4. Las recomendaciones deben ser prácticas y aplicables.
5. Identifica patrones, progresiones y áreas de mejora.

FORMATO JSON EXACTO:
{
  "summary": "string - Resumen general del análisis (1-2 frases)",
  "insights": [
    {
      "type": "positive" | "warning" | "info",
      "title": "string - Título breve del insight",
      "description": "string - Descripción detallada"
    }
  ],
  "recommendations": [
    "string - Recomendación accionable"
  ],
  "metrics": {
    "volumeTrend": "increasing" | "stable" | "decreasing",
    "intensityTrend": "increasing" | "stable" | "decreasing",
    "consistencyScore": number - Puntuación de consistencia (0-100)
  }
}`;

            default:
                return `${basePrompt}
Responde siempre con un objeto JSON válido que contenga los datos solicitados.`;
        }
    }

    /**
     * Construye el prompt de usuario incluyendo el contexto si existe
     */
    private buildUserPrompt(request: AIRequest): string {
        let prompt = request.prompt;

        // Añadir contexto si existe
        if (request.context && Object.keys(request.context).length > 0) {
            const contextStr = Object.entries(request.context)
                .filter(([, v]) => v !== undefined && v !== null)
                .map(([k, v]) => `${k}: ${typeof v === 'object' ? JSON.stringify(v) : v}`)
                .join('\n');

            if (contextStr) {
                prompt = `${prompt}\n\nCONTEXTO ADICIONAL:\n${contextStr}`;
            }
        }

        return prompt;
    }
}
