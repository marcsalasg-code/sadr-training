/**
 * multiAthleteSession.ts - Helpers para sesiones multi-atleta
 * 
 * Proporciona funciones para:
 * - Detectar si una sesión es multi-atleta
 * - Obtener datos de un atleta específico
 * - Crear/actualizar datos de atleta
 */

import type {
    WorkoutSession,
    AthleteSessionData,
    ExerciseEntry,
    UUID
} from '../types/types';

// ============================================
// DETECCIÓN Y ACCESO
// ============================================

/**
 * Verifica si una sesión es multi-atleta
 */
export function isMultiAthleteSession(session: WorkoutSession): boolean {
    return session.isMultiAthlete === true ||
        (session.athleteData !== undefined && session.athleteData.length > 1);
}

/**
 * Obtiene la lista de IDs de atletas en la sesión
 */
export function getSessionAthleteIds(session: WorkoutSession): string[] {
    if (isMultiAthleteSession(session) && session.athleteData) {
        return session.athleteData.map(d => d.athleteId);
    }
    // Single-athlete: solo el athleteId principal
    return [session.athleteId];
}

/**
 * Obtiene los datos de un atleta específico en la sesión
 */
export function getAthleteSessionData(
    session: WorkoutSession,
    athleteId: string
): AthleteSessionData | null {
    // Multi-atleta: buscar en athleteData
    if (session.athleteData) {
        const found = session.athleteData.find(d => d.athleteId === athleteId);
        if (found) return found;
    }

    // Single-athlete: usar datos legacy
    if (session.athleteId === athleteId) {
        return {
            athleteId: session.athleteId,
            exercises: session.exercises,
            totalVolume: session.totalVolume,
            totalSets: session.totalSets,
            totalReps: session.totalReps,
            notes: session.notes,
            rating: session.rating,
        };
    }

    return null;
}

/**
 * Obtiene los ejercicios de un atleta específico
 */
export function getAthleteExercises(
    session: WorkoutSession,
    athleteId: string
): ExerciseEntry[] {
    const data = getAthleteSessionData(session, athleteId);
    return data?.exercises || [];
}

// ============================================
// MODIFICACIÓN
// ============================================

/**
 * Actualiza los datos de un atleta en la sesión
 * Retorna la sesión actualizada (inmutable)
 */
export function updateAthleteSessionData(
    session: WorkoutSession,
    athleteId: string,
    updates: Partial<AthleteSessionData>
): WorkoutSession {
    // Si es multi-atleta
    if (session.athleteData) {
        const newAthleteData = session.athleteData.map(d =>
            d.athleteId === athleteId
                ? { ...d, ...updates }
                : d
        );
        return { ...session, athleteData: newAthleteData };
    }

    // Single-athlete: actualizar campos legacy
    if (session.athleteId === athleteId) {
        return {
            ...session,
            exercises: updates.exercises ?? session.exercises,
            totalVolume: updates.totalVolume ?? session.totalVolume,
            totalSets: updates.totalSets ?? session.totalSets,
            totalReps: updates.totalReps ?? session.totalReps,
            notes: updates.notes ?? session.notes,
            rating: updates.rating ?? session.rating,
        };
    }

    return session;
}

/**
 * Actualiza los ejercicios de un atleta
 */
export function updateAthleteExercises(
    session: WorkoutSession,
    athleteId: string,
    exercises: ExerciseEntry[]
): WorkoutSession {
    return updateAthleteSessionData(session, athleteId, { exercises });
}

// ============================================
// CREACIÓN
// ============================================

/**
 * Crea una sesión multi-atleta desde una lista de IDs
 */
export function createMultiAthleteSession(
    baseSession: Omit<WorkoutSession, 'athleteData' | 'isMultiAthlete'>,
    athleteIds: string[]
): WorkoutSession {
    if (athleteIds.length <= 1) {
        // Single-athlete: no necesita athleteData
        return {
            ...baseSession,
            athleteId: athleteIds[0] || baseSession.athleteId,
            isMultiAthlete: false,
        } as WorkoutSession;
    }

    // Multi-atleta: crear athleteData para cada atleta
    const athleteData: AthleteSessionData[] = athleteIds.map(athleteId => ({
        athleteId,
        exercises: JSON.parse(JSON.stringify(baseSession.exercises)), // Clone exercises
        totalVolume: 0,
        totalSets: 0,
        totalReps: 0,
    }));

    return {
        ...baseSession,
        athleteId: athleteIds[0], // Primer atleta como principal
        athleteData,
        isMultiAthlete: true,
    } as WorkoutSession;
}

/**
 * Añade un atleta a una sesión existente
 */
export function addAthleteToSession(
    session: WorkoutSession,
    athleteId: string
): WorkoutSession {
    const existingIds = getSessionAthleteIds(session);
    if (existingIds.includes(athleteId)) {
        return session; // Ya existe
    }

    const newAthleteData: AthleteSessionData = {
        athleteId,
        exercises: JSON.parse(JSON.stringify(session.exercises)), // Clone template
        totalVolume: 0,
        totalSets: 0,
        totalReps: 0,
    };

    const currentData = session.athleteData || [
        // Convertir single-athlete a multi
        {
            athleteId: session.athleteId,
            exercises: session.exercises,
            totalVolume: session.totalVolume,
            totalSets: session.totalSets,
            totalReps: session.totalReps,
            notes: session.notes,
            rating: session.rating,
        }
    ];

    return {
        ...session,
        athleteData: [...currentData, newAthleteData],
        isMultiAthlete: true,
    };
}

/**
 * Elimina un atleta de la sesión
 */
export function removeAthleteFromSession(
    session: WorkoutSession,
    athleteId: string
): WorkoutSession {
    if (!session.athleteData) return session;

    const newData = session.athleteData.filter(d => d.athleteId !== athleteId);

    if (newData.length <= 1) {
        // Volver a single-athlete
        const remaining = newData[0];
        return {
            ...session,
            athleteId: remaining?.athleteId || session.athleteId,
            exercises: remaining?.exercises || session.exercises,
            totalVolume: remaining?.totalVolume,
            totalSets: remaining?.totalSets,
            totalReps: remaining?.totalReps,
            notes: remaining?.notes,
            rating: remaining?.rating,
            athleteData: undefined,
            isMultiAthlete: false,
        };
    }

    return {
        ...session,
        athleteData: newData,
    };
}

export default {
    isMultiAthleteSession,
    getSessionAthleteIds,
    getAthleteSessionData,
    getAthleteExercises,
    updateAthleteSessionData,
    updateAthleteExercises,
    createMultiAthleteSession,
    addAthleteToSession,
    removeAthleteFromSession,
};
