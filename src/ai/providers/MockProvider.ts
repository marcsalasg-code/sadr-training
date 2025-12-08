/**
 * Mock AI Provider
 * Simula respuestas de IA para desarrollo y testing
 */

import type { IAIProvider, AIRequest, AIResponse, GeneratedTemplate, LoadPrediction, ExerciseSuggestion } from '../types';
import type { MuscleGroup, ExerciseCategory } from '../../types/types';


// Delay simulado para parecer más realista
const simulateDelay = (ms: number = 800) =>
    new Promise(resolve => setTimeout(resolve, ms + Math.random() * 400));

export class MockProvider implements IAIProvider {
    readonly name = 'mock';
    readonly isAvailable = true;

    async initialize(): Promise<void> {
        console.log('[MockProvider] Initialized');
    }

    async complete<T>(request: AIRequest): Promise<AIResponse<T>> {
        await simulateDelay();

        try {
            let data: unknown;

            switch (request.type) {
                case 'generation':
                    data = this.generateTemplate(request);
                    break;
                case 'prediction':
                    data = this.predictLoad(request);
                    break;
                case 'analysis':
                    data = { summary: 'Mock analysis result', insights: [] };
                    break;
                case 'suggestion':
                    data = this.suggestExercises(request);
                    break;
                default:
                    throw new Error(`Unknown request type: ${request.type}`);
            }

            return {
                success: true,
                data: data as T,
                usage: {
                    promptTokens: Math.floor(request.prompt.length / 4),
                    completionTokens: Math.floor(Math.random() * 500 + 100),
                },
                cached: false,
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    }

    async testConnection(): Promise<boolean> {
        await simulateDelay(200);
        return true;
    }

    private generateTemplate(request: AIRequest): GeneratedTemplate {
        const prompt = request.prompt.toLowerCase();

        // Detectar tipo de entrenamiento del prompt
        const isUpperBody = prompt.includes('upper') || prompt.includes('pecho') || prompt.includes('espalda') || prompt.includes('brazos');
        const isLowerBody = prompt.includes('lower') || prompt.includes('pierna') || prompt.includes('glúteo');
        const isFullBody = prompt.includes('full') || prompt.includes('completo') || prompt.includes('cuerpo');
        const isStrength = prompt.includes('fuerza') || prompt.includes('strength');
        const isHypertrophy = prompt.includes('hipertrofia') || prompt.includes('volumen');

        // Generar ejercicios según contexto
        let exercises: GeneratedTemplate['exercises'] = [];

        if (isUpperBody || isFullBody) {
            exercises.push(
                { name: 'Press de Banca', sets: 4, reps: 8, restSeconds: 120, notes: 'Controlar la bajada' },
                { name: 'Remo con Barra', sets: 4, reps: 10, restSeconds: 90 },
                { name: 'Press Militar', sets: 3, reps: 10, restSeconds: 90 },
            );
        }

        if (isLowerBody || isFullBody) {
            exercises.push(
                { name: 'Sentadilla', sets: 4, reps: 8, restSeconds: 150, notes: 'Profundidad completa' },
                { name: 'Peso Muerto Rumano', sets: 3, reps: 10, restSeconds: 120 },
                { name: 'Prensa de Piernas', sets: 3, reps: 12, restSeconds: 90 },
            );
        }

        if (exercises.length === 0) {
            // Default: full body básico
            exercises = [
                { name: 'Sentadilla', sets: 3, reps: 10, restSeconds: 90 },
                { name: 'Press de Banca', sets: 3, reps: 10, restSeconds: 90 },
                { name: 'Remo con Barra', sets: 3, reps: 10, restSeconds: 90 },
                { name: 'Press Militar', sets: 3, reps: 10, restSeconds: 60 },
            ];
        }

        // Ajustar según objetivo
        if (isStrength) {
            exercises = exercises.map((e: GeneratedTemplate['exercises'][0]) => ({ ...e, sets: e.sets + 1, reps: Math.max(5, e.reps - 3), restSeconds: e.restSeconds + 30 }));
        } else if (isHypertrophy) {
            exercises = exercises.map((e: GeneratedTemplate['exercises'][0]) => ({ ...e, reps: e.reps + 2, restSeconds: Math.max(60, e.restSeconds - 30) }));
        }

        return {
            name: this.extractTemplateName(request.prompt),
            description: this.generateDescription(isUpperBody, isLowerBody, isFullBody, isStrength, isHypertrophy),
            exercises,
            difficulty: isStrength ? 'advanced' : 'intermediate',
            estimatedDuration: exercises.length * 10 + 15,
            tags: this.extractTags(prompt),
        };
    }

    private predictLoad(request: AIRequest): LoadPrediction {
        const context = request.context || {};
        const previousWeight = (context.previousWeight as number) || 0;
        const previousReps = (context.previousReps as number) || 0;
        const targetReps = (context.targetReps as number) || 10;

        // Lógica simple de progresión
        let suggestedWeight = previousWeight;
        let trend: LoadPrediction['basedOn']['trend'] = 'stable';

        if (previousReps >= targetReps + 2) {
            // Subir peso si supera objetivo
            suggestedWeight = previousWeight * 1.025; // +2.5%
            trend = 'increasing';
        } else if (previousReps < targetReps - 2) {
            // Bajar peso si no llega
            suggestedWeight = previousWeight * 0.95;
            trend = 'decreasing';
        }

        // Redondear a 2.5kg
        suggestedWeight = Math.round(suggestedWeight / 2.5) * 2.5;

        return {
            suggestedWeight: Math.max(0, suggestedWeight),
            suggestedReps: targetReps,
            confidence: previousWeight > 0 ? 0.75 : 0.3,
            reasoning: previousWeight > 0
                ? `Basado en ${previousWeight}kg x ${previousReps} reps anteriores`
                : 'Sin datos previos, sugerencia inicial',
            basedOn: {
                previousSets: (context.previousSets as number) || 0,
                trend,
            },
        };
    }

    private extractTemplateName(prompt: string): string {
        // Intentar extraer nombre del prompt
        const words = prompt.split(' ').slice(0, 4);
        return words.map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
    }

    private extractTags(prompt: string): string[] {
        const tags: string[] = [];
        if (prompt.includes('fuerza') || prompt.includes('strength')) tags.push('fuerza');
        if (prompt.includes('hipertrofia') || prompt.includes('volumen')) tags.push('hipertrofia');
        if (prompt.includes('upper') || prompt.includes('pecho')) tags.push('upper-body');
        if (prompt.includes('lower') || prompt.includes('pierna')) tags.push('lower-body');
        if (prompt.includes('full') || prompt.includes('completo')) tags.push('full-body');
        if (tags.length === 0) tags.push('general');
        return tags;
    }

    private generateDescription(
        isUpperBody: boolean,
        isLowerBody: boolean,
        isFullBody: boolean,
        isStrength: boolean,
        isHypertrophy: boolean
    ): string {
        // Determinar zona corporal
        let bodyPart = 'cuerpo completo';
        if (isUpperBody && !isLowerBody && !isFullBody) bodyPart = 'tren superior';
        else if (isLowerBody && !isUpperBody && !isFullBody) bodyPart = 'tren inferior';
        else if (isFullBody) bodyPart = 'cuerpo completo';

        // Determinar objetivo
        let goal = 'equilibrado';
        if (isStrength) goal = 'fuerza';
        else if (isHypertrophy) goal = 'hipertrofia';

        // Construir descripción
        if (isStrength || isHypertrophy) {
            return `Rutina de ${goal} enfocada en ${bodyPart}. Diseñada para maximizar el rendimiento con ejercicios compuestos y accesorios.`;
        }

        return `Entrenamiento ${goal} para ${bodyPart}. Incluye ejercicios variados para un desarrollo muscular completo.`;
    }

    private suggestExercises(request: AIRequest): ExerciseSuggestion[] {
        const context = request.context || {};
        const currentExercises = (context.currentExercises as string[]) || [];
        const prompt = request.prompt.toLowerCase();

        // Banco de ejercicios para sugerir
        const exercisePool: ExerciseSuggestion[] = [
            { name: 'Press de Banca', muscleGroup: 'chest' as MuscleGroup, category: 'strength' as ExerciseCategory, reasoning: 'Ejercicio fundamental para pecho' },
            { name: 'Sentadilla', muscleGroup: 'quads' as MuscleGroup, category: 'strength' as ExerciseCategory, reasoning: 'Base del entrenamiento de piernas' },
            { name: 'Peso Muerto', muscleGroup: 'back' as MuscleGroup, category: 'strength' as ExerciseCategory, reasoning: 'Ejercicio compuesto para espalda y piernas' },
            { name: 'Press Militar', muscleGroup: 'shoulders' as MuscleGroup, category: 'strength' as ExerciseCategory, reasoning: 'Desarrollo de hombros' },
            { name: 'Remo con Barra', muscleGroup: 'back' as MuscleGroup, category: 'hypertrophy' as ExerciseCategory, reasoning: 'Espalda y dorsales' },
            { name: 'Dominadas', muscleGroup: 'back' as MuscleGroup, category: 'strength' as ExerciseCategory, reasoning: 'Ejercicio de tracción fundamental' },
            { name: 'Curl de Bíceps', muscleGroup: 'biceps' as MuscleGroup, category: 'hypertrophy' as ExerciseCategory, reasoning: 'Aislamiento de bíceps' },
            { name: 'Extensión de Tríceps', muscleGroup: 'triceps' as MuscleGroup, category: 'hypertrophy' as ExerciseCategory, reasoning: 'Aislamiento de tríceps' },
            { name: 'Prensa de Piernas', muscleGroup: 'quads' as MuscleGroup, category: 'hypertrophy' as ExerciseCategory, reasoning: 'Volumen para cuádriceps' },
            { name: 'Elevaciones Laterales', muscleGroup: 'shoulders' as MuscleGroup, category: 'hypertrophy' as ExerciseCategory, reasoning: 'Aislamiento de deltoides laterales' },
            { name: 'Zancadas', muscleGroup: 'glutes' as MuscleGroup, category: 'strength' as ExerciseCategory, reasoning: 'Unilateral para glúteos y piernas' },
            { name: 'Hip Thrust', muscleGroup: 'glutes' as MuscleGroup, category: 'hypertrophy' as ExerciseCategory, reasoning: 'Mejor ejercicio para glúteos' },
            { name: 'Plancha', muscleGroup: 'core' as MuscleGroup, category: 'endurance' as ExerciseCategory, reasoning: 'Estabilidad de core' },
            { name: 'Aperturas con Mancuernas', muscleGroup: 'chest' as MuscleGroup, category: 'hypertrophy' as ExerciseCategory, reasoning: 'Aislamiento de pecho' },
        ];

        // Filtrar ejercicios que ya están en la sesión
        const currentLower = currentExercises.map(e => e.toLowerCase());
        let available = exercisePool.filter(e =>
            !currentLower.some(curr => curr.includes(e.name.toLowerCase()) || e.name.toLowerCase().includes(curr))
        );

        // Si el prompt menciona algún grupo muscular, priorizar esos
        const muscleKeywords: Record<string, MuscleGroup[]> = {
            'pecho': ['chest'],
            'espalda': ['back'],
            'pierna': ['quads', 'hamstrings', 'glutes', 'calves'],
            'hombro': ['shoulders'],
            'brazo': ['biceps', 'triceps'],
            'core': ['core'],
            'glúteo': ['glutes'],
        };

        for (const [keyword, groups] of Object.entries(muscleKeywords)) {
            if (prompt.includes(keyword)) {
                const prioritized = available.filter(e => groups.includes(e.muscleGroup));
                if (prioritized.length > 0) {
                    available = [...prioritized, ...available.filter(e => !groups.includes(e.muscleGroup))];
                }
            }
        }

        // Devolver 3-5 sugerencias
        return available.slice(0, Math.min(5, Math.max(3, available.length)));
    }
}
