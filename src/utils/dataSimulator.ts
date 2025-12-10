/**
 * dataSimulator.ts - Simulador de Datos para Testing
 * 
 * Sprint 8: Genera datos realistas para probar el sistema completo:
 * - 2 meses de datos
 * - 2-4 atletas
 * - 20+ sesiones por atleta
 * - Progresión natural de 1RM
 * - Intensidad registrada
 */

import type {
    Athlete,
    Exercise,
    WorkoutSession,
    ExerciseEntry,
    SetEntry,
    OneRMRecord,
    WorkoutTemplate,
} from '../types/types';
// Using native crypto.randomUUID() instead of uuid package

// ============================================
// CONFIGURATION
// ============================================

export interface SimulationConfig {
    athleteCount: number;        // 2-4 athletes
    sessionsPerWeek: number;     // 3-5 sessions per week
    weeksToSimulate: number;     // 8 weeks (2 months)
    startDate: Date;
    exercisePool: Exercise[];
    templates?: WorkoutTemplate[];
}

export interface SimulationResult {
    athletes: Athlete[];
    sessions: WorkoutSession[];
    logs: string[];
}

// ============================================
// HELPER FUNCTIONS
// ============================================

const generateId = () => crypto.randomUUID();

const randomBetween = (min: number, max: number) =>
    Math.floor(Math.random() * (max - min + 1)) + min;

const pickRandom = <T>(arr: readonly T[]): T => arr[Math.floor(Math.random() * arr.length)];

const addDays = (date: Date, days: number): Date => {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
};

// ============================================
// ATHLETE GENERATION
// ============================================

const ATHLETE_NAMES = ['Alex', 'Jordan', 'Casey', 'Morgan', 'Taylor', 'Riley', 'Quinn', 'Avery'];
const EXPERIENCE_LEVELS = ['beginner', 'intermediate', 'advanced'] as const;

export function generateAthletes(count: number): Athlete[] {
    return Array.from({ length: count }, (_, i) => {
        const name = ATHLETE_NAMES[i] || `Athlete ${i + 1}`;
        const level = EXPERIENCE_LEVELS[Math.min(i, EXPERIENCE_LEVELS.length - 1)];
        const now = new Date().toISOString();

        return {
            id: generateId(),
            name,
            createdAt: now,
            updatedAt: now,
            isActive: true,
            birthDate: `${1990 + randomBetween(0, 15)}-${String(randomBetween(1, 12)).padStart(2, '0')}-${String(randomBetween(1, 28)).padStart(2, '0')}`,
            heightCm: randomBetween(160, 190),
            currentWeightKg: randomBetween(60, 95),
            experienceLevel: level,
            oneRMRecords: {},
        };
    });
}

// ============================================
// 1RM PROGRESSION
// ============================================

/**
 * Generate initial 1RM values for an athlete based on experience
 */
export function generateInitialOneRMs(
    athlete: Athlete,
    anchorExercises: Exercise[]
): Record<string, OneRMRecord> {
    const records: Record<string, OneRMRecord> = {};

    const multiplier =
        athlete.experienceLevel === 'advanced' ? 1.3 :
            athlete.experienceLevel === 'intermediate' ? 1.0 : 0.7;

    const baseWeights: Record<string, number> = {
        'bench_press': 60 * multiplier,
        'squat': 80 * multiplier,
        'deadlift': 100 * multiplier,
        'overhead_press': 40 * multiplier,
        'barbell_row': 50 * multiplier,
    };

    anchorExercises.forEach(ex => {
        const baseName = ex.name.toLowerCase().replace(/ /g, '_');
        const baseWeight = baseWeights[baseName] || 40 * multiplier;
        const startDate = new Date();
        startDate.setMonth(startDate.getMonth() - 2);

        records[ex.id] = {
            exerciseId: ex.id,
            currentOneRM: Math.round(baseWeight),
            source: 'manual',
            lastUpdate: startDate.toISOString(),
            history: [{
                date: startDate.toISOString(),
                value: Math.round(baseWeight),
                source: 'manual',
            }],
        };
    });

    return records;
}

/**
 * Progress 1RM over time (2-4% per month for intermediates)
 */
export function progressOneRM(
    record: OneRMRecord,
    weekNumber: number,
    experienceLevel: string = 'intermediate'
): OneRMRecord {
    // Progress every 2-3 weeks
    if (weekNumber % 3 !== 0) return record;

    const progressRate =
        experienceLevel === 'beginner' ? 0.02 :
            experienceLevel === 'intermediate' ? 0.015 : 0.008;

    const newValue = Math.round(record.currentOneRM * (1 + progressRate));
    const now = new Date();
    now.setDate(now.getDate() - (8 - weekNumber) * 7);

    return {
        ...record,
        currentOneRM: newValue,
        lastUpdate: now.toISOString(),
        history: [...(record.history || []), {
            date: now.toISOString(),
            value: newValue,
            source: 'estimated',
        }],
    };
}

// ============================================
// SESSION GENERATION
// ============================================

const SESSION_TYPES = ['upper', 'lower', 'full', 'push', 'pull', 'legs'] as const;

export function generateSession(
    athlete: Athlete,
    date: Date,
    exercisePool: Exercise[],
    weekNumber: number
): WorkoutSession {
    const sessionType = pickRandom(SESSION_TYPES);
    const exerciseCount = randomBetween(4, 7);
    const selectedExercises = exercisePool
        .sort(() => Math.random() - 0.5)
        .slice(0, exerciseCount);

    const exercises: ExerciseEntry[] = selectedExercises.map((ex, i) => {
        const oneRM = athlete.oneRMRecords?.[ex.id]?.currentOneRM;
        const setCount = randomBetween(3, 5);
        const targetReps = randomBetween(5, 12);

        // Calculate weight based on 1RM if available
        const baseWeight = oneRM
            ? Math.round((oneRM * (100 - targetReps * 2.5) / 100) / 2.5) * 2.5
            : randomBetween(20, 60);

        const sets: SetEntry[] = Array.from({ length: setCount }, (_, j) => ({
            id: generateId(),
            setNumber: j + 1,
            type: 'working' as const,
            targetReps,
            actualReps: targetReps + randomBetween(-2, 2),
            targetWeight: baseWeight,
            actualWeight: baseWeight,
            intensity: randomBetween(6, 9),
            isCompleted: true,
            completedAt: new Date(date.getTime() + (i * 10 + j * 2) * 60000).toISOString(),
        }));

        return {
            id: generateId(),
            exerciseId: ex.id,
            order: i,
            sets,
            notes: Math.random() > 0.7 ? 'Felt good today' : undefined,
        };
    });

    const totalVolume = exercises.reduce((sum, e) =>
        sum + e.sets.reduce((s, set) =>
            s + (set.actualWeight || 0) * (set.actualReps || 0), 0
        ), 0
    );

    const totalSets = exercises.reduce((sum, e) => sum + e.sets.length, 0);
    const totalReps = exercises.reduce((sum, e) =>
        sum + e.sets.reduce((s, set) => s + (set.actualReps || 0), 0), 0
    );

    const startTime = new Date(date);
    startTime.setHours(randomBetween(7, 19), randomBetween(0, 59));
    const duration = randomBetween(45, 90);

    const completedAt = new Date(startTime.getTime() + duration * 60000).toISOString();

    return {
        id: generateId(),
        name: `${String(sessionType).charAt(0).toUpperCase() + String(sessionType).slice(1)} - Week ${weekNumber}`,
        athleteId: athlete.id,
        createdAt: startTime.toISOString(),
        updatedAt: completedAt,
        startedAt: startTime.toISOString(),
        completedAt,
        status: 'completed',
        exercises,
        totalVolume,
        totalSets,
        totalReps,
        durationMinutes: duration,
    };
}

// ============================================
// MAIN SIMULATION
// ============================================

export function runSimulation(config: SimulationConfig): SimulationResult {
    const logs: string[] = [];
    logs.push(`Starting simulation: ${config.athleteCount} athletes, ${config.weeksToSimulate} weeks`);

    // Generate athletes
    const athletes = generateAthletes(config.athleteCount);
    logs.push(`Generated ${athletes.length} athletes`);

    // Identify anchor exercises (for 1RM tracking)
    const anchorExercises = config.exercisePool.filter(e =>
        e.isPrimaryOneRM ||
        ['squat', 'bench', 'deadlift', 'press'].some(k => e.name.toLowerCase().includes(k))
    ).slice(0, 5);
    logs.push(`Identified ${anchorExercises.length} anchor exercises for 1RM tracking`);

    // Initialize 1RM for each athlete
    athletes.forEach(athlete => {
        athlete.oneRMRecords = generateInitialOneRMs(athlete, anchorExercises);
    });

    // Generate sessions
    const sessions: WorkoutSession[] = [];
    const trainingDays = [1, 3, 5]; // Mon, Wed, Fri

    for (let week = 0; week < config.weeksToSimulate; week++) {
        const weekStart = addDays(config.startDate, week * 7);

        athletes.forEach(athlete => {
            // Progress 1RM periodically
            Object.keys(athlete.oneRMRecords || {}).forEach(exId => {
                const record = athlete.oneRMRecords![exId];
                athlete.oneRMRecords![exId] = progressOneRM(record, week, athlete.experienceLevel);
            });

            // Generate sessions for training days
            trainingDays.forEach(dayOffset => {
                if (Math.random() > 0.15) { // 85% attendance
                    const sessionDate = addDays(weekStart, dayOffset);
                    const session = generateSession(athlete, sessionDate, config.exercisePool, week + 1);
                    sessions.push(session);
                }
            });
        });
    }

    logs.push(`Generated ${sessions.length} sessions total`);
    logs.push(`Average sessions per athlete: ${(sessions.length / athletes.length).toFixed(1)}`);

    return { athletes, sessions, logs };
}

// ============================================
// QUICK START
// ============================================

/**
 * Create a default simulation with minimal configuration
 */
export function createDefaultSimulation(exercisePool: Exercise[]): SimulationResult {
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 2);

    return runSimulation({
        athleteCount: 3,
        sessionsPerWeek: 3,
        weeksToSimulate: 8,
        startDate,
        exercisePool,
    });
}
