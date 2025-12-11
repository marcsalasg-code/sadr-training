/**
 * AnalyticsExercisesTab - Exercises tab content for analytics
 */

import { AuraCard } from '../ui/aura';
import type { Exercise } from '../../types/types';

interface TopExercise {
    id: string;
    name: string;
    volume: number;
    sets: number;
}

interface AnalyticsExercisesTabProps {
    topExercises: TopExercise[];
    exercises: Exercise[];
}

export function AnalyticsExercisesTab({
    topExercises,
    exercises,
}: AnalyticsExercisesTabProps) {
    return (
        <div className="space-y-6">
            <AuraCard>
                <h3 className="text-lg font-semibold mb-4">🏆 Top Ejercicios por Volumen</h3>
                {topExercises.length === 0 ? (
                    <p className="text-center text-[var(--color-text-muted)] py-8">Sin datos</p>
                ) : (
                    <div className="space-y-3">
                        {topExercises.map((ex, i) => (
                            <div key={ex.id} className="flex items-center gap-4 p-3 rounded-lg bg-[var(--color-bg-tertiary)]">
                                <div className="w-8 h-8 rounded-full bg-[var(--color-accent-gold)]/20 flex items-center justify-center text-[var(--color-accent-gold)] font-bold">
                                    {i + 1}
                                </div>
                                <div className="flex-1">
                                    <p className="font-medium">{ex.name}</p>
                                    <p className="text-sm text-[var(--color-text-muted)]">{ex.sets} series</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-xl font-bold text-[var(--color-accent-beige)]">
                                        {(ex.volume / 1000).toFixed(1)}k
                                    </p>
                                    <p className="text-xs text-[var(--color-text-muted)]">kg</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </AuraCard>

            {/* Exercise Library */}
            <AuraCard>
                <h3 className="text-lg font-semibold mb-4">📋 Biblioteca de Ejercicios</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {exercises.map(ex => (
                        <div key={ex.id} className="p-2 rounded bg-[var(--color-bg-tertiary)] text-sm">
                            <p className="font-medium truncate">{ex.name}</p>
                            <p className="text-xs text-[var(--color-text-muted)]">
                                {ex.muscleGroup || 'Sin categoría'}
                            </p>
                        </div>
                    ))}
                    {exercises.length === 0 && (
                        <p className="col-span-full text-center text-[var(--color-text-muted)] py-4">
                            Sin ejercicios registrados
                        </p>
                    )}
                </div>
            </AuraCard>
        </div>
    );
}
