/**
 * Weekly Plan Engine - Motor IA para generación de planes semanales
 * 
 * Genera estructura semanal inteligente basada en:
 * - Disponibilidad del atleta
 * - Historial de sesiones
 * - Adherencia previa
 * - Catálogo de ejercicios y templates
 */

import type {
    Athlete,
    WorkoutSession,
    WorkoutTemplate,
    Exercise,
    TrainingObjective,
    WeekDay,
    DayPlan,
    SessionType,
    DayIntensity,
    DifficultyLevel,
    PlanMetadata,
} from '../../types/types';

// ============================================
// INPUT/OUTPUT TYPES
// ============================================

export interface WeeklyPlanInput {
    athlete: Athlete;
    availability: WeekDay[];
    objective: TrainingObjective;
    targetLevel: DifficultyLevel;
    history: WorkoutSession[];      // últimas 4 semanas
    adherenceHistory: number;       // % promedio histórico
    templates: WorkoutTemplate[];
    exercises: Exercise[];          // catálogo validado
    currentMicrocycle?: 1 | 2 | 3 | 4;
    coachNotes?: string;
}

export interface DayRecommendation {
    dayOfWeek: WeekDay;
    sessionType: SessionType;
    intensity: DayIntensity;
    suggestedTemplateId?: string;
    estimatedVolume: number;
    estimatedDuration: number;
    focus: string;
    reasoning: string;
}

export interface WeeklyPlanOutput {
    weekStructure: DayRecommendation[];
    microcycleType: 'accumulation' | 'intensification' | 'deload' | 'realization';
    recommendedVolume: number;
    notes: string[];
    metadata: Partial<PlanMetadata>;
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Determine microcycle type based on cycle position and adherence
 */
function determineMicrocycleType(
    microcycle: 1 | 2 | 3 | 4,
    adherence: number
): 'accumulation' | 'intensification' | 'deload' | 'realization' {
    // Low adherence → suggest deload
    if (adherence < 60) return 'deload';

    switch (microcycle) {
        case 1: return 'accumulation';
        case 2: return 'intensification';
        case 3: return 'accumulation';
        case 4: return 'deload';
        default: return 'accumulation';
    }
}

/**
 * Calculate suggested intensity for a day based on position in week
 */
function suggestDayIntensity(
    dayIndex: number,
    totalDays: number,
    microcycleType: string
): DayIntensity {
    if (microcycleType === 'deload') return 'light';

    // Distribute intensity across the week
    const position = dayIndex / totalDays;

    if (position < 0.3) return 'heavy';         // First third: heavy
    if (position < 0.7) return 'moderate';       // Middle: moderate
    return 'light';                              // End: light/recovery
}

/**
 * Suggest session type based on objective and day pattern
 */
function suggestSessionType(
    objective: TrainingObjective,
    dayIndex: number,
    totalDays: number
): SessionType {
    // Pattern based on training days per week
    if (totalDays <= 2) {
        return 'full_body';
    }

    if (totalDays === 3) {
        // Classic 3-day split
        const pattern: SessionType[] = ['push', 'pull', 'lower'];
        return pattern[dayIndex % 3];
    }

    if (totalDays === 4) {
        // Upper/Lower split
        const pattern: SessionType[] = ['upper', 'lower', 'upper', 'lower'];
        return pattern[dayIndex % 4];
    }

    if (totalDays >= 5) {
        // PPL or body part split
        const pattern: SessionType[] = ['push', 'pull', 'lower', 'push', 'pull', 'recovery'];
        return pattern[dayIndex % 6];
    }

    return 'mixed';
}

/**
 * Estimate session volume based on type and intensity
 */
function estimateVolume(
    sessionType: SessionType,
    intensity: DayIntensity,
    targetLevel: DifficultyLevel
): number {
    // Base volumes by type (in kg)
    const baseVolumes: Record<SessionType, number> = {
        strength: 8000,
        technique: 4000,
        mobility: 2000,
        mixed: 6000,
        power: 6000,
        endurance: 7000,
        recovery: 3000,
        upper: 6000,
        lower: 10000,
        full_body: 12000,
        push: 5000,
        pull: 5000,
    };

    // Intensity multipliers
    const intensityMult: Record<DayIntensity, number> = {
        light: 0.6,
        moderate: 0.85,
        heavy: 1.0,
    };

    // Level multipliers
    const levelMult: Record<DifficultyLevel, number> = {
        beginner: 0.6,
        intermediate: 0.85,
        advanced: 1.0,
    };

    const base = baseVolumes[sessionType] || 6000;
    return Math.round(base * intensityMult[intensity] * levelMult[targetLevel]);
}

/**
 * Estimate session duration based on type
 */
function estimateDuration(
    sessionType: SessionType,
    intensity: DayIntensity
): number {
    const baseDurations: Record<SessionType, number> = {
        strength: 75,
        technique: 60,
        mobility: 45,
        mixed: 60,
        power: 60,
        endurance: 75,
        recovery: 40,
        upper: 60,
        lower: 70,
        full_body: 90,
        push: 50,
        pull: 50,
    };

    const mult = intensity === 'heavy' ? 1.1 : intensity === 'light' ? 0.8 : 1.0;
    return Math.round((baseDurations[sessionType] || 60) * mult);
}

/**
 * Find best matching template for a session type
 */
function findMatchingTemplate(
    sessionType: SessionType,
    templates: WorkoutTemplate[]
): WorkoutTemplate | undefined {
    // Simple matching by category or name keywords
    return templates.find(t =>
        t.category?.toLowerCase().includes(sessionType) ||
        t.name.toLowerCase().includes(sessionType)
    );
}

// ============================================
// MAIN ENGINE FUNCTION
// ============================================

/**
 * Generate a weekly training plan structure
 * 
 * This function creates an intelligent week structure based on
 * athlete data, history, and training objectives.
 * 
 * @param input - WeeklyPlanInput with all context
 * @returns WeeklyPlanOutput with recommendations
 */
export function generateWeeklyPlan(input: WeeklyPlanInput): WeeklyPlanOutput {
    const {
        availability,
        objective,
        targetLevel,
        adherenceHistory,
        templates,
        currentMicrocycle = 1,
    } = input;

    // Determine microcycle type
    const microcycleType = determineMicrocycleType(currentMicrocycle, adherenceHistory);

    // Generate day recommendations
    const weekStructure: DayRecommendation[] = availability.map((day, index) => {
        const sessionType = suggestSessionType(objective, index, availability.length);
        const intensity = suggestDayIntensity(index, availability.length, microcycleType);
        const volume = estimateVolume(sessionType, intensity, targetLevel);
        const duration = estimateDuration(sessionType, intensity);
        const matchingTemplate = findMatchingTemplate(sessionType, templates);

        return {
            dayOfWeek: day,
            sessionType,
            intensity,
            suggestedTemplateId: matchingTemplate?.id,
            estimatedVolume: volume,
            estimatedDuration: duration,
            focus: `${sessionType.charAt(0).toUpperCase() + sessionType.slice(1)} - ${intensity} intensity`,
            reasoning: `Based on ${objective} objective, day ${index + 1} of ${availability.length}`,
        };
    });

    // Calculate total recommended volume
    const recommendedVolume = weekStructure.reduce((sum, day) => sum + day.estimatedVolume, 0);

    // Generate notes based on analysis
    const notes: string[] = [];

    if (adherenceHistory < 70) {
        notes.push('⚠️ Low adherence detected. Consider reducing training days or volume.');
    }

    if (microcycleType === 'deload') {
        notes.push('📉 Deload week recommended. Focus on recovery and technique.');
    }

    if (availability.length >= 5) {
        notes.push('💪 High training frequency. Ensure adequate recovery between sessions.');
    }

    // Build metadata
    const metadata: Partial<PlanMetadata> = {
        targetLevel,
        currentMicrocycle,
        recommendedLoad: microcycleType === 'deload' ? 'deload' :
            microcycleType === 'intensification' ? 'overreach' : 'normal',
        historicalAdherence: adherenceHistory,
        lastAIUpdate: new Date().toISOString(),
    };

    return {
        weekStructure,
        microcycleType,
        recommendedVolume,
        notes,
        metadata,
    };
}

/**
 * Convert WeeklyPlanOutput to DayPlan array for TrainingPlan
 */
export function convertToDayPlans(output: WeeklyPlanOutput): DayPlan[] {
    return output.weekStructure.map(rec => ({
        dayOfWeek: rec.dayOfWeek,
        sessionType: rec.sessionType,
        suggestedTemplateId: rec.suggestedTemplateId,
        estimatedVolume: rec.estimatedVolume,
        estimatedDuration: rec.estimatedDuration,
        focus: rec.focus,
        intensity: rec.intensity,
        aiNotes: rec.reasoning,
    }));
}
