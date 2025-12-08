/**
 * SessionLog - Helper para derivar historial global de sesiones
 * No duplica estado, solo deriva información de sessions + athletes
 */

import type { WorkoutSession, Athlete, SessionStatus } from '../types/types';

/**
 * Entrada del historial de sesiones
 */
export interface SessionLogEntry {
    id: string;
    date: string;
    dateFormatted: string;
    athleteId: string;
    athleteName: string;
    sessionName: string;
    status: SessionStatus;
    volume: number;
    duration: number;
    setsCompleted: number;
    repsCompleted: number;
}

/**
 * Opciones de filtrado para el historial
 */
export interface SessionLogOptions {
    /** Filtrar por ID de atleta (null = todos) */
    athleteId?: string | null;
    /** Filtrar por estados (por defecto solo 'completed') */
    statuses?: SessionStatus[];
    /** Fecha mínima (ISO string) */
    fromDate?: string;
    /** Fecha máxima (ISO string) */
    toDate?: string;
    /** Límite de resultados */
    limit?: number;
}

/**
 * Deriva un historial ordenado de sesiones a partir de los datos del store
 * @param sessions - Lista de sesiones del store
 * @param athletes - Lista de atletas del store
 * @param options - Opciones de filtrado
 * @returns Array ordenado de entradas de historial (más recientes primero)
 */
export function getSessionLog(
    sessions: WorkoutSession[],
    athletes: Athlete[],
    options: SessionLogOptions = {}
): SessionLogEntry[] {
    const {
        athleteId = null,
        statuses = ['completed'],
        fromDate,
        toDate,
        limit,
    } = options;

    // Crear mapa de atletas para lookup rápido
    const athleteMap = new Map(athletes.map(a => [a.id, a.name]));

    // Filtrar y mapear sesiones
    let result = sessions
        // Filtrar por estado
        .filter(s => statuses.includes(s.status))
        // Filtrar por atleta
        .filter(s => !athleteId || s.athleteId === athleteId)
        // Filtrar por rango de fechas
        .filter(s => {
            const sessionDate = s.completedAt || s.scheduledDate || s.createdAt;
            if (fromDate && sessionDate < fromDate) return false;
            if (toDate && sessionDate > toDate) return false;
            return true;
        })
        // Mapear a SessionLogEntry
        .map(s => {
            const sessionDate = s.completedAt || s.scheduledDate || s.createdAt;
            const date = new Date(sessionDate);

            // Calcular métricas si no están precalculadas
            let setsCompleted = s.totalSets || 0;
            let repsCompleted = s.totalReps || 0;
            let volume = s.totalVolume || 0;

            if (!s.totalSets || !s.totalReps || !s.totalVolume) {
                s.exercises?.forEach(ex => {
                    ex.sets?.forEach(set => {
                        if (set.isCompleted) {
                            setsCompleted++;
                            repsCompleted += set.actualReps || 0;
                            volume += (set.actualWeight || 0) * (set.actualReps || 0);
                        }
                    });
                });
            }

            return {
                id: s.id,
                date: sessionDate,
                dateFormatted: formatDate(date),
                athleteId: s.athleteId,
                athleteName: athleteMap.get(s.athleteId) || 'Atleta desconocido',
                sessionName: s.name,
                status: s.status,
                volume,
                duration: s.durationMinutes || 0,
                setsCompleted,
                repsCompleted,
            };
        })
        // Ordenar por fecha descendente (más recientes primero)
        .sort((a, b) => b.date.localeCompare(a.date));

    // Aplicar límite si existe
    if (limit && limit > 0) {
        result = result.slice(0, limit);
    }

    return result;
}

/**
 * Formatea una fecha para mostrar en el historial
 */
function formatDate(date: Date): string {
    const day = date.getDate();
    const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const month = monthNames[date.getMonth()];
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');

    return `${day} ${month} ${year}, ${hours}:${minutes}`;
}

/**
 * Obtiene estadísticas resumidas del historial
 */
export function getSessionLogStats(entries: SessionLogEntry[]) {
    return {
        totalSessions: entries.length,
        totalVolume: entries.reduce((sum, e) => sum + e.volume, 0),
        totalDuration: entries.reduce((sum, e) => sum + e.duration, 0),
        totalSets: entries.reduce((sum, e) => sum + e.setsCompleted, 0),
        totalReps: entries.reduce((sum, e) => sum + e.repsCompleted, 0),
        avgVolumePerSession: entries.length > 0
            ? Math.round(entries.reduce((sum, e) => sum + e.volume, 0) / entries.length)
            : 0,
        avgDurationPerSession: entries.length > 0
            ? Math.round(entries.reduce((sum, e) => sum + e.duration, 0) / entries.length)
            : 0,
    };
}
