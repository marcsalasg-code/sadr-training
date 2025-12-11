/**
 * AthleteCharts - Chart components for athlete statistics
 * Extracted from AthleteDetail.tsx for reusability
 */

import React from 'react';

// ============================================
// TYPES
// ============================================

export interface WeeklyVolumeData {
    label: string;
    volume: number;
}

export interface MonthlySessionsData {
    label: string;
    count: number;
}

export interface IntensityFatigueData {
    date: string;
    preSessionFatigue: number | null;
    avgIntensity: number | null;
}

// ============================================
// WEEKLY VOLUME CHART
// ============================================

export function WeeklyVolumeChart({ data }: { data: WeeklyVolumeData[] }) {
    const maxVolume = Math.max(...data.map(d => d.volume), 1);

    if (data.every(d => d.volume === 0)) {
        return (
            <div className="h-32 flex items-center justify-center text-gray-500 text-sm">
                Sin datos de volumen
            </div>
        );
    }

    return (
        <div className="h-32 flex items-end justify-between gap-1">
            {data.map((week, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <div className="w-full flex flex-col justify-end" style={{ height: '100px' }}>
                        <div
                            className="w-full bg-gradient-to-t from-[var(--color-accent-gold)] to-[var(--color-accent-gold)]/60 rounded-t transition-all duration-300"
                            style={{ height: `${(week.volume / maxVolume) * 100}%`, minHeight: week.volume > 0 ? '4px' : '0' }}
                        />
                    </div>
                    <span className="text-[10px] text-gray-500">{week.label}</span>
                </div>
            ))}
        </div>
    );
}

// ============================================
// MONTHLY SESSIONS CHART
// ============================================

export function MonthlySessionsChart({ data }: { data: MonthlySessionsData[] }) {
    const maxCount = Math.max(...data.map(d => d.count), 1);

    if (data.every(d => d.count === 0)) {
        return (
            <div className="h-32 flex items-center justify-center text-gray-500 text-sm">
                Sin sesiones completadas
            </div>
        );
    }

    return (
        <div className="h-32 flex items-end justify-between gap-2">
            {data.map((month, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-xs text-[var(--color-accent-gold)] font-mono">
                        {month.count > 0 ? month.count : ''}
                    </span>
                    <div className="w-full flex flex-col justify-end" style={{ height: '80px' }}>
                        <div
                            className="w-full bg-white/20 rounded-t transition-all duration-300"
                            style={{ height: `${(month.count / maxCount) * 100}%`, minHeight: month.count > 0 ? '4px' : '0' }}
                        />
                    </div>
                    <span className="text-[10px] text-gray-500 capitalize">{month.label}</span>
                </div>
            ))}
        </div>
    );
}

// ============================================
// INTENSITY VS FATIGUE TREND CHART
// ============================================

export function IntensityFatigueTrend({ data }: { data: IntensityFatigueData[] }) {
    // Filter to only sessions with values and take last 12
    const validData = data.filter(d => d.preSessionFatigue != null || d.avgIntensity != null).slice(-12);

    if (validData.length === 0) {
        return (
            <div className="h-32 flex items-center justify-center text-gray-500 text-sm">
                Sin datos de intensidad/fatiga
            </div>
        );
    }

    return (
        <div className="space-y-2">
            {/* Legend */}
            <div className="flex justify-end gap-4 text-xs">
                <span className="flex items-center gap-1">
                    <span className="w-3 h-3 rounded-full bg-[var(--color-accent-gold)]" /> Intensidad
                </span>
                <span className="flex items-center gap-1">
                    <span className="w-3 h-3 rounded-full bg-blue-400" /> Fatiga Previa
                </span>
            </div>

            {/* Chart */}
            <div className="h-32 flex items-end justify-between gap-1">
                {validData.map((session, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                        <div className="w-full flex flex-col justify-end relative" style={{ height: '100px' }}>
                            {/* Fatigue bar (background) */}
                            {session.preSessionFatigue != null && (
                                <div
                                    className="absolute bottom-0 left-0 w-1/2 bg-blue-400/60 rounded-t transition-all duration-300"
                                    style={{ height: `${(session.preSessionFatigue / 10) * 100}%` }}
                                    title={`Fatiga: ${session.preSessionFatigue}/10`}
                                />
                            )}
                            {/* Intensity bar (foreground) */}
                            {session.avgIntensity != null && (
                                <div
                                    className="absolute bottom-0 right-0 w-1/2 bg-gradient-to-t from-[var(--color-accent-gold)] to-[var(--color-accent-gold)]/60 rounded-t transition-all duration-300"
                                    style={{ height: `${(session.avgIntensity / 10) * 100}%` }}
                                    title={`Intensidad: ${session.avgIntensity.toFixed(1)}/10`}
                                />
                            )}
                        </div>
                        <span className="text-[9px] text-gray-500">
                            {new Date(session.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }).split(' ')[0]}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}
