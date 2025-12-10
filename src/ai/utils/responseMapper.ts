/**
 * Response Mapper - Mapea GeneratedSession al modelo WorkoutSession existente
 */

import type { Exercise, ExerciseEntry, SetEntry, WorkoutSession, BlockType } from '../../types/types';
import type { GeneratedSession } from '../types';

/**
 * Mapea una sesión generada por IA al modelo WorkoutSession
 */
export function mapGeneratedToSession(
    generated: GeneratedSession,
    athleteId: string,
    exercises: Exercise[]
): Omit<WorkoutSession, 'id' | 'createdAt' | 'updatedAt'> {
    const exerciseEntries: ExerciseEntry[] = [];
    let globalOrder = 0;

    for (const bloque of generated.bloques) {
        let orderWithinBlock = 0;

        for (const ej of bloque.ejercicios) {
            const exercise = exercises.find(e => e.id === ej.id);
            if (!exercise) {
                console.warn(`[ResponseMapper] Exercise not found: ${ej.id}`);
                continue;
            }

            // Crear sets basados en series/reps
            const sets = createSetsFromSpec(ej.series, ej.reps);

            exerciseEntries.push({
                id: crypto.randomUUID(),
                exerciseId: ej.id,
                exercise,
                sets,
                notes: ej.notas,
                order: globalOrder++,
                blockType: bloque.tipo,
                orderWithinBlock: orderWithinBlock++,
                durationSeconds: ej.duracion_seg ?? undefined,
            });
        }
    }

    // Calcular duración estimada
    const estimatedDuration = generated.bloques.reduce((sum, b) => sum + b.tiempo_min, 0);

    return {
        athleteId,
        name: `${generated.disciplina_global} - ${formatDate(new Date())}`,
        description: `Sesión ${generated.nivel} generada por IA`,
        status: 'planned',
        exercises: exerciseEntries,
        durationMinutes: estimatedDuration,
    };
}

/**
 * Crea array de SetEntry a partir de series y reps
 */
function createSetsFromSpec(
    series: number | null,
    reps: number | string | null
): SetEntry[] {
    const numSets = series ?? 3;
    const sets: SetEntry[] = [];

    for (let i = 0; i < numSets; i++) {
        sets.push({
            id: crypto.randomUUID(),
            setNumber: i + 1,
            type: 'working',
            targetReps: parseReps(reps),
            isCompleted: false,
        });
    }

    return sets;
}

/**
 * Parsea reps (puede ser número o string como "8-12")
 */
function parseReps(reps: number | string | null): number | undefined {
    if (reps === null || reps === undefined) return undefined;
    if (typeof reps === 'number') return reps;

    // Si es rango como "8-12", tomar el promedio
    const match = reps.match(/(\d+)-(\d+)/);
    if (match) {
        return Math.round((parseInt(match[1]) + parseInt(match[2])) / 2);
    }

    // Si es solo número como string
    const parsed = parseInt(reps, 10);
    return isNaN(parsed) ? undefined : parsed;
}

/**
 * Formatea fecha para nombre de sesión
 */
function formatDate(date: Date): string {
    return date.toLocaleDateString('es-ES', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    });
}

/**
 * Agrupa ExerciseEntry[] por blockType para visualización
 */
export function groupByBlock(entries: ExerciseEntry[]): Record<BlockType, ExerciseEntry[]> {
    const groups: Record<BlockType, ExerciseEntry[]> = {
        movilidad_calentamiento: [],
        fuerza: [],
        tecnica_especifica: [],
        emom_hiit: [],
    };

    for (const entry of entries) {
        const block = entry.blockType ?? 'fuerza';
        groups[block].push(entry);
    }

    // Ordenar cada grupo por orderWithinBlock
    for (const key of Object.keys(groups) as BlockType[]) {
        groups[key].sort((a, b) => (a.orderWithinBlock ?? 0) - (b.orderWithinBlock ?? 0));
    }

    return groups;
}
