/**
 * StrengthProgress.tsx - Visualización de progreso de fuerza
 * 
 * Muestra tendencias de 1RM por ejercicio usando el Performance Engine
 */

import React from 'react';
import type { Athlete } from '../../types/types';
import { getOneRepMax, getOneRMTrend, getOneRMHistory } from '../../ai/performance/performanceEngine';
import { useExercises } from '../../store/store';

interface StrengthProgressProps {
    athlete: Athlete;
    exerciseIds?: string[]; // Si no se pasa, muestra todos con 1RM
    compact?: boolean;
}

export const StrengthProgress: React.FC<StrengthProgressProps> = ({
    athlete,
    exerciseIds,
    compact = false,
}) => {
    const exercises = useExercises();

    // Get exercises with 1RM data
    const exercisesWithRM = React.useMemo(() => {
        const oneRMRecords = athlete.oneRMRecords || {};
        const targetIds = exerciseIds || Object.keys(oneRMRecords);

        return targetIds
            .map(id => ({
                id,
                exercise: exercises.find(e => e.id === id),
                currentRM: getOneRepMax(id, athlete),
                trend: getOneRMTrend(id, athlete),
                history: getOneRMHistory(id, athlete),
            }))
            .filter(item => item.currentRM && item.currentRM > 0);
    }, [athlete, exerciseIds, exercises]);

    if (exercisesWithRM.length === 0) {
        return (
            <div className="text-sm text-gray-500 italic">
                No 1RM data available
            </div>
        );
    }

    // Compact version - simple list
    if (compact) {
        return (
            <div className="flex flex-wrap gap-2">
                {exercisesWithRM.map(item => (
                    <div
                        key={item.id}
                        className="px-3 py-1.5 bg-[#1A1A1A] rounded-lg border border-[#2A2A2A] flex items-center gap-2"
                    >
                        <span className="text-sm text-white">
                            {item.exercise?.name || 'Unknown'}
                        </span>
                        <span className="text-sm font-medium text-[var(--color-accent-gold)]">
                            {item.currentRM} kg
                        </span>
                        {item.trend !== 0 && (
                            <span className={`text-xs ${item.trend > 0 ? 'text-green-400' : 'text-red-400'}`}>
                                {item.trend > 0 ? '↑' : '↓'}{Math.abs(item.trend).toFixed(1)}%
                            </span>
                        )}
                    </div>
                ))}
            </div>
        );
    }

    // Full version with history sparkline
    return (
        <div className="space-y-3">
            {exercisesWithRM.map(item => (
                <div
                    key={item.id}
                    className="p-3 bg-[#141414] rounded-lg border border-[#2A2A2A]"
                >
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-white">
                            {item.exercise?.name || 'Unknown'}
                        </span>
                        <div className="flex items-center gap-2">
                            <span className="text-lg font-bold text-[var(--color-accent-gold)]">
                                {item.currentRM} kg
                            </span>
                            {item.trend !== 0 && (
                                <span className={`text-sm px-2 py-0.5 rounded ${item.trend > 0
                                    ? 'bg-green-500/20 text-green-400'
                                    : 'bg-red-500/20 text-red-400'
                                    }`}>
                                    {item.trend > 0 ? '+' : ''}{item.trend.toFixed(1)}%
                                </span>
                            )}
                        </div>
                    </div>

                    {/* History sparkline */}
                    {item.history.length > 1 && (
                        <div className="flex items-end gap-1 h-6">
                            {item.history.slice(-10).map((h, i, arr) => {
                                const max = Math.max(...arr.map(x => x.value));
                                const min = Math.min(...arr.map(x => x.value));
                                const range = max - min || 1;
                                const height = ((h.value - min) / range) * 100;
                                const isLast = i === arr.length - 1;

                                return (
                                    <div
                                        key={i}
                                        className={`flex-1 rounded-t ${isLast ? 'bg-[var(--color-accent-gold)]' : 'bg-[#3A3A3A]'
                                            }`}
                                        style={{ height: `${Math.max(20, height)}%` }}
                                        title={`${h.value}kg on ${new Date(h.date).toLocaleDateString()}`}
                                    />
                                );
                            })}
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
};

/**
 * Summary card variant for Analytics
 */
export const StrengthProgressSummary: React.FC<{
    athlete: Athlete;
    limit?: number;
}> = ({ athlete, limit = 4 }) => {
    const exercises = useExercises();
    const oneRMRecords = athlete.oneRMRecords || {};

    // Get top exercises by recent activity
    const topExercises = Object.entries(oneRMRecords)
        .filter(([, record]) => record.currentOneRM && record.currentOneRM > 0)
        .sort((a, b) => new Date(b[1].lastUpdate).getTime() - new Date(a[1].lastUpdate).getTime())
        .slice(0, limit)
        .map(([id, record]) => ({
            id,
            name: exercises.find(e => e.id === id)?.name || 'Unknown',
            value: record.currentOneRM,
            trend: getOneRMTrend(id, athlete),
        }));

    if (topExercises.length === 0) return null;

    return (
        <div className="p-4 bg-[#0D0D0D] rounded-lg border border-[#1A1A1A]">
            <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">
                Strength Progress
            </h4>
            <div className="grid grid-cols-2 gap-3">
                {topExercises.map(ex => (
                    <div key={ex.id} className="flex flex-col">
                        <span className="text-xs text-gray-400 truncate">{ex.name}</span>
                        <div className="flex items-baseline gap-1">
                            <span className="text-lg font-bold text-white">{ex.value}</span>
                            <span className="text-xs text-gray-500">kg</span>
                            {ex.trend !== 0 && (
                                <span className={`text-xs ${ex.trend > 0 ? 'text-green-400' : 'text-red-400'}`}>
                                    {ex.trend > 0 ? '+' : ''}{ex.trend.toFixed(0)}%
                                </span>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default StrengthProgress;
