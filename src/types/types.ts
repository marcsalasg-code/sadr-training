/**
 * TRAINING MONITOR - Core Types
 * Modelos y entidades fundamentales de la aplicación
 */

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
}

// ============================================
// SERIES Y ENTRADAS
// ============================================

export type SetType = 'warmup' | 'working' | 'dropset' | 'failure' | 'rest_pause';

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
}

export interface ExerciseEntry {
    id: UUID;
    exerciseId: UUID;
    exercise?: Exercise; // Populated from store
    sets: SetEntry[];
    notes?: string;
    order: number;
}

// ============================================
// SESIONES DE ENTRENAMIENTO
// ============================================

export type SessionStatus = 'planned' | 'in_progress' | 'completed' | 'cancelled';

export interface WorkoutSession {
    id: UUID;
    athleteId: UUID;
    templateId?: UUID;
    name: string;
    description?: string;
    scheduledDate?: string;
    startedAt?: string;
    completedAt?: string;
    status: SessionStatus;
    exercises: ExerciseEntry[];
    notes?: string;
    rating?: number; // 1-5 stars
    totalVolume?: number; // kg lifted
    totalSets?: number;
    totalReps?: number;
    durationMinutes?: number;
    createdAt: string;
    updatedAt: string;
}

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
}

export interface WorkoutTemplate {
    id: UUID;
    name: string;
    description?: string;
    category?: string;
    exercises: TemplateExercise[];
    estimatedDuration?: number; // minutes
    difficulty?: 'beginner' | 'intermediate' | 'advanced';
    tags?: string[];
    createdAt: string;
    updatedAt: string;
    isArchived: boolean;
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
