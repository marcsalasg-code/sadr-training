/**
 * TRAINING MONITOR - Core Types
 * Modelos y entidades fundamentales de la aplicación
 */

import type { SessionStructure } from '../core/sessions/sessionStructure.model';

// ============================================
// IDENTIFICADORES
// ============================================

export type UUID = string;

// ============================================
// ATLETAS
// ============================================

export interface Athlete {
    id: UUID;
    name: string;
    email?: string;
    phone?: string;
    birthDate?: string;
    gender?: 'male' | 'female' | 'other';
    avatarUrl?: string;
    notes?: string;
    goals?: string;
    injuries?: string;
    createdAt: string;
    updatedAt: string;
    isActive: boolean;

    // Physical Data (FASE A)
    heightCm?: number;
    currentWeightKg?: number;
    experienceLevel?: ExperienceLevel;
    weightHistory?: WeightEntry[];
    personalRecords?: Record<string, PersonalRecord>;
    customFields?: Record<string, string | number | boolean>;

    // 1RM System (Sistema 1RM)
    oneRMRecords?: Record<string, OneRMRecord>;
}

/**
 * Experience level for training prescription
 */
export type ExperienceLevel = 'novice' | 'beginner' | 'intermediate' | 'advanced' | 'elite';

/**
 * Weight entry for historical tracking
 */
export interface WeightEntry {
    date: string;
    weightKg: number;
    notes?: string;
}

/**
 * Personal Record for an exercise
 */
export interface PersonalRecord {
    exerciseId: string;
    weight: number;
    reps: number;
    estimated1RM: number;
    date: string;
    sessionId?: string;
}

// ============================================
// 1RM SYSTEM (Sistema de 1RM)
// ============================================

/**
 * Source of 1RM value
 */
export type OneRMSource = 'manual' | 'estimated' | 'ai_suggested';

/**
 * History entry for 1RM tracking
 */
export interface OneRMHistoryEntry {
    date: string;
    value: number;
    source: OneRMSource;
    sessionId?: string;
}

/**
 * 1RM Record for an exercise - controlled by user
 * El usuario SIEMPRE tiene control sobre el 1RM
 */
export interface OneRMRecord {
    exerciseId: string;
    currentOneRM: number;
    source: OneRMSource;
    lastUpdate: string;
    history?: OneRMHistoryEntry[];
    strengthFocusSessions?: number; // Cuantas sesiones con enfoque fuerza
}

// ============================================
// EJERCICIOS
// ============================================

export type MuscleGroup =
    | 'chest' | 'back' | 'shoulders' | 'biceps' | 'triceps'
    | 'forearms' | 'core' | 'quads' | 'hamstrings' | 'glutes'
    | 'calves' | 'full_body' | 'cardio';

export type ExerciseCategory =
    | 'strength' | 'hypertrophy' | 'power' | 'endurance'
    | 'mobility' | 'cardio' | 'warmup' | 'cooldown';

// Body region for 1RM reference system
export type BodyRegion = 'upper' | 'lower' | 'full' | 'core';

export interface Exercise {
    id: UUID;
    name: string;
    description?: string;
    muscleGroups: MuscleGroup[];
    category: ExerciseCategory;
    equipment?: string;
    videoUrl?: string;
    imageUrl?: string;
    instructions?: string;
    isCustom: boolean;
    createdAt: string;

    // Bodyweight exercises (1RM System)
    isBodyweight?: boolean;        // Dominadas, fondos, etc.
    allowsLoadedWeight?: boolean;  // Permite añadir lastre

    // 1RM Anchor System
    isPrimaryOneRM?: boolean;      // Es ejercicio ancla de 1RM (ej: squat, bench, deadlift)
    bodyRegion?: BodyRegion;       // Tren superior/inferior para referencias
    oneRMGroupId?: string;         // Grupo lógico: 'squat_pattern', 'horizontal_push', etc.
}

/**
 * Configuración de ejercicios ancla y mapeos de referencia 1RM
 */
export interface OneRMAnchorConfig {
    // Lista de IDs de ejercicios marcados como ancla
    anchorExerciseIds: string[];

    // Mapeo directo: exerciseId (no ancla) → [referenceAnchorIds ordenados por prioridad]
    referenceMap: Record<string, string[]>;

    // Defaults por bodyRegion: cuando no hay mapeo específico
    // bodyRegion → [anchorIds por defecto para esa región]
    groupDefaults: Record<BodyRegion, string[]>;
}

// ============================================
// SERIES Y ENTRADAS
// ============================================

export type SetType = 'warmup' | 'working' | 'dropset' | 'failure' | 'rest_pause' | 'emom' | 'amrap' | 'tabata' | 'tempo' | 'isometric';

/**
 * Interval training configuration (EMOM/AMRAP/Tabata)
 */
export type IntervalType = 'emom' | 'amrap' | 'tabata' | 'custom_interval';

export interface IntervalConfig {
    type: IntervalType;
    workSeconds: number;
    restSeconds?: number;
    totalMinutes?: number;
    roundsTarget?: number;
    roundsCompleted?: number;
    extraReps?: number; // For AMRAP: reps in incomplete round
    tempo?: string; // For tempo training: "3-1-2-0"
    holdSeconds?: number; // For isometrics
}

/**
 * BlockType - Tipos de bloque para sesiones estructuradas
 * Usado en flujo de generación IA con 4 bloques
 */
export type BlockType =
    | 'movilidad_calentamiento'
    | 'fuerza'
    | 'tecnica_especifica'
    | 'emom_hiit';

export interface SetEntry {
    id: UUID;
    setNumber: number;
    type: SetType;
    targetReps?: number;
    actualReps?: number;
    targetWeight?: number;
    actualWeight?: number;
    rpe?: number; // Rate of Perceived Exertion (1-10)
    rir?: number; // Reps in Reserve (0-5)
    restSeconds?: number;
    notes?: string;
    completedAt?: string;
    isCompleted: boolean;

    // Interval training (FASE B)
    intervalConfig?: IntervalConfig;

    // Intensity system (default 7 if not set)
    intensity?: number; // 1-10, alias visual de RPE

    // Session Structure - blockId reference
    blockId?: string; // Reference to SessionBlockConfig.id
}

export interface ExerciseEntry {
    id: UUID;
    exerciseId: UUID;
    exercise?: Exercise; // Populated from store
    sets: SetEntry[];
    notes?: string;
    order: number;
    /** Block type for structured sessions (optional for backward compat) */
    blockType?: BlockType;
    /** Order within block for structured sessions */
    orderWithinBlock?: number;
    /** Duration in seconds for timed exercises */
    durationSeconds?: number;

    // 1RM System
    strengthFocus?: boolean; // Flag "enfoque fuerza" para activar recomendaciones

    // Session Structure - blockId reference
    blockId?: string; // Reference to SessionBlockConfig.id
}

// ============================================
// SESIONES DE ENTRENAMIENTO
// ============================================

export type SessionStatus = 'planned' | 'in_progress' | 'completed' | 'cancelled';

/**
 * Datos de sesión por atleta (multi-atleta)
 * Permite que cada atleta tenga sus propios sets, métricas y notas
 */
export interface AthleteSessionData {
    athleteId: UUID;
    exercises: ExerciseEntry[];   // Sets propios del atleta
    totalVolume?: number;
    totalSets?: number;
    totalReps?: number;
    notes?: string;
    rating?: number;              // Rating individual del atleta
}

export interface WorkoutSession {
    id: UUID;
    athleteId: UUID;              // Atleta principal (legacy/single-athlete)
    templateId?: UUID;
    name: string;
    description?: string;
    scheduledDate?: string;
    startedAt?: string;
    completedAt?: string;
    status: SessionStatus;
    exercises: ExerciseEntry[];   // Sets legacy (single-athlete mode)
    notes?: string;
    rating?: number; // 1-5 stars
    totalVolume?: number; // kg lifted
    totalSets?: number;
    totalReps?: number;
    durationMinutes?: number;
    createdAt: string;
    updatedAt: string;

    // === INTENSIDAD / FATIGA (Sistema de Monitorización) ===
    preSessionFatigue?: number | null;   // 1-10, fatiga percibida ANTES de entrenar
    avgIntensity?: number | null;        // 1-10, intensidad media de las series completadas

    // === MULTI-ATLETA (Sprint 4) ===
    athleteData?: AthleteSessionData[];  // Datos por atleta (si multi-atleta)
    isMultiAthlete?: boolean;            // Flag explícito para modo multi-atleta

    // === ORIGEN DE LA SESIÓN (Coach UX) ===
    /** 
     * Tracks where the session originated from:
     * - 'plan': Created from a training plan
     * - 'manual': Created manually by the coach
     * - 'ai_suggestion': Created from an AI recommendation
     */
    origin?: SessionOrigin;

    // === SESSION STRUCTURE (Unified System) ===
    /**
     * Internal structure of the session (blocks, types, etc.)
     * Shared between templates and sessions
     */
    structure?: SessionStructure;
}

/**
 * Session origin type for tracking how sessions were created
 */
export type SessionOrigin = 'plan' | 'manual' | 'ai_suggestion';


// ============================================
// PLANTILLAS
// ============================================

export interface TemplateExercise {
    id: UUID;
    exerciseId: UUID;
    exercise?: Exercise;
    defaultSets: number;
    defaultReps?: number;
    defaultWeight?: number;
    restSeconds?: number;
    notes?: string;
    order: number;
    // FASE 3: Smart Templates
    isVariableSlot?: boolean;       // IA puede reemplazar este ejercicio
    variableCategory?: MuscleGroup; // Categoría para selección de IA
}

// ============================================
// NIVEL DE DIFICULTAD UNIFICADO
// ============================================

/**
 * Unified difficulty level type
 * Used across templates, AI generation, and user-facing UIs
 */
export type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced';

/**
 * Mapper: Spanish AI level to DifficultyLevel
 */
export function mapNivelToDifficulty(nivel: string): DifficultyLevel {
    const map: Record<string, DifficultyLevel> = {
        principiante: 'beginner',
        intermedio: 'intermediate',
        avanzado: 'advanced',
    };
    return map[nivel] || 'intermediate';
}

/**
 * Mapper: DifficultyLevel to Spanish for AI prompts
 */
export function mapDifficultyToNivel(difficulty: DifficultyLevel): string {
    const map: Record<DifficultyLevel, string> = {
        beginner: 'principiante',
        intermediate: 'intermedio',
        advanced: 'avanzado',
    };
    return map[difficulty];
}

export interface WorkoutTemplate {
    id: UUID;
    name: string;
    description?: string;
    category?: string;
    exercises: TemplateExercise[];
    estimatedDuration?: number; // minutes
    difficulty?: DifficultyLevel;
    tags?: string[];
    createdAt: string;
    updatedAt: string;
    isArchived: boolean;

    // === SESSION STRUCTURE (Unified System) ===
    /**
     * Internal structure of the template (blocks, types, etc.)
     * Copied to sessions created from this template
     */
    structure?: SessionStructure;
}

// ============================================
// CONFIGURACIÓN
// ============================================

export interface Settings {
    // General
    language: 'es' | 'en';
    theme: 'dark' | 'light';

    // Entrenamiento
    defaultRestSeconds: number;
    weightIncrement: number; // kg, para incrementos rápidos
    barbellWeight: number; // kg
    showRPE: boolean;
    showRIR: boolean;
    autoStartRest: boolean;
    vibrateOnRestEnd: boolean;

    // UI
    compactMode: boolean;
    showWarmupSets: boolean;
    defaultView: 'dashboard' | 'calendar' | 'athletes';
    show1RMHints?: boolean;  // Mostrar ayudas de 1RM/referencia en sesiones

    // Datos
    exportFormat: 'json' | 'csv';
    autoBackup: boolean;
    backupFrequency: 'daily' | 'weekly' | 'monthly';
}

// ============================================
// ANALYTICS
// ============================================

export interface DailyStats {
    date: string;
    totalSessions: number;
    totalVolume: number;
    totalSets: number;
    totalReps: number;
    totalDuration: number;
    athletesTrainedIds: UUID[];
}

export interface AthleteStats {
    athleteId: UUID;
    totalSessions: number;
    totalVolume: number;
    lastSessionDate?: string;
    averageSessionDuration: number;
    favoriteExercises: { exerciseId: UUID; count: number }[];
    progressByExercise: {
        exerciseId: UUID;
        initialMax: number;
        currentMax: number;
        percentChange: number;
    }[];
}

// ============================================
// INTERNAL LAB
// ============================================

export type LabEntryType = 'feedback' | 'bug' | 'feature' | 'metric' | 'note';

export interface LabEntry {
    id: UUID;
    type: LabEntryType;
    title: string;
    description?: string;
    priority?: 'low' | 'medium' | 'high';
    status?: 'open' | 'in_progress' | 'resolved';
    metadata?: Record<string, unknown>;
    createdAt: string;
    resolvedAt?: string;
}

export interface UsageEvent {
    id: UUID;
    event: string;
    context?: string;
    timestamp: string;
    data?: Record<string, unknown>;
}

// ============================================
// CALENDARIO
// ============================================

export interface CalendarEvent {
    id: UUID;
    sessionId?: UUID;
    athleteId?: UUID;
    title: string;
    date: string;
    type: 'session' | 'rest' | 'note';
    color?: string;
}

// ============================================
// TRAINING PLAN - Plan de entrenamiento semanal
// ============================================

export type WeekDay = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

export type TrainingObjective =
    | 'strength'
    | 'hypertrophy'
    | 'endurance'
    | 'recomposition'
    | 'technique'
    | 'performance'
    | 'general_fitness';

/**
 * SessionType - Tipo de sesión para un día de entrenamiento
 * Usado por IA para generar contenido apropiado
 */
export type SessionType =
    | 'strength'      // Fuerza máxima
    | 'technique'     // Énfasis técnico
    | 'mobility'      // Movilidad/recuperación
    | 'mixed'         // Combinación
    | 'power'         // Potencia/explosividad
    | 'endurance'     // Resistencia
    | 'recovery'      // Recuperación activa
    | 'upper'         // Tren superior
    | 'lower'         // Tren inferior
    | 'full_body'     // Cuerpo completo
    | 'push'          // Empuje
    | 'pull';         // Tirón

/**
 * Intensity level for training day
 */
export type DayIntensity = 'light' | 'moderate' | 'heavy';

/**
 * DayPlan - Plan para un día específico de la semana
 * Ampliado para soportar IA y recomendaciones
 */
export interface DayPlan {
    dayOfWeek: WeekDay;
    sessionType: SessionType;
    suggestedTemplateId?: UUID;
    estimatedVolume: number; // kg
    estimatedDuration: number; // minutes
    focus?: string; // Additional focus note
    intensity: DayIntensity;
    expectedBlocks?: BlockType[];
    aiNotes?: string; // Notas generadas por IA
}

/**
 * PlanMetadata - Metadatos del plan para IA y análisis
 */
export interface PlanMetadata {
    targetLevel: DifficultyLevel;
    currentMicrocycle: 1 | 2 | 3 | 4; // Semana del ciclo
    weeklyAvailability: number; // Horas disponibles
    recommendedLoad: 'deload' | 'normal' | 'overreach';
    historicalAdherence: number; // % promedio
    lastAIUpdate?: string;
    fatigueScore?: number; // 0-100, estimado
}

/**
 * TrainingPlan - Plan de entrenamiento semanal
 * Entidad central que conecta Dashboard, Analytics, Schedule, IA
 * Ahora actúa como "cerebro" del sistema
 */
export interface TrainingPlan {
    id: UUID;
    athleteId: UUID;
    name: string;
    weekDays: WeekDay[];
    objective: TrainingObjective;
    weeklyVolume: number; // Target weekly volume in kg
    sessionsPerWeek: number;
    dayPlans: DayPlan[];
    notes?: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
    // FASE 3: Campos inteligentes
    metadata?: PlanMetadata;
    aiRecommendations?: string[];
    suggestedTemplateIds?: UUID[]; // Templates recomendados globalmente
}

/**
 * WeeklyAdherence - Adherencia semanal calculada
 * Ampliado para incluir métricas de desviación
 */
export interface WeeklyAdherence {
    planned: number;
    completed: number;
    percentage: number;
    volumeTarget: number;
    volumeActual: number;
    volumeDeviation: number; // % desviación del target
    weeklyScore?: number; // 0-100, score combinado
}

