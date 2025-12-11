/**
 * AnalyticsOverviewTab - Overview tab content for analytics
 */

import { AuraCard, AuraMetric } from '../ui/aura';
import { AIInsightsPanel } from '../common';
import type { WorkoutSession, TrainingPlan } from '../../types/types';

interface Metrics {
    sessionCount: number;
    totalVolume: number;
    totalSets: number;
    totalDuration: number;
    avgVolume: number;
    avgDuration: number;
}

interface WeeklyVolumeItem {
    week: string;
    volume: number;
}

interface OneRMData {
    name: string;
    maxValue: number;
}

interface IntensityData {
    avgIntensity: string;
    highIntensityPercent: number;
    totalSets: number;
}

interface FatigueData {
    avgIntensity: number | null;
    avgFatigue: number | null;
    count: number;
}

interface AnalyticsOverviewTabProps {
    metrics: Metrics;
    weeklyVolume: WeeklyVolumeItem[];
    oneRMData: OneRMData[];
    intensityData: IntensityData;
    fatigueData: FatigueData;
    filteredSessions: WorkoutSession[];
    activePlan?: TrainingPlan;
}

export function AnalyticsOverviewTab({
    metrics,
    weeklyVolume,
    oneRMData,
    intensityData,
    fatigueData,
    filteredSessions,
    activePlan,
}: AnalyticsOverviewTabProps) {
    const maxWeekVolume = weeklyVolume.length > 0 ? Math.max(...weeklyVolume.map(w => w.volume)) : 1;
    const maxOneRM = oneRMData.length > 0 ? Math.max(...oneRMData.map(e => e.maxValue)) : 1;

    return (
        <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <AuraMetric label="Sesiones" value={metrics.sessionCount} icon="📋" />
                <AuraMetric label="Volumen Total" value={`${(metrics.totalVolume / 1000).toFixed(1)}k kg`} icon="🏋️" />
                <AuraMetric label="Series Totales" value={metrics.totalSets} icon="🔢" />
                <AuraMetric label="Tiempo Total" value={`${Math.round(metrics.totalDuration / 60)}h`} icon="⏱️" />
            </div>

            {/* Volume Chart */}
            <AuraCard>
                <h3 className="text-lg font-semibold mb-4">📈 Volumen Semanal</h3>
                {weeklyVolume.length === 0 ? (
                    <p className="text-center text-[var(--color-text-muted)] py-8">Sin datos para el período seleccionado</p>
                ) : (
                    <div className="flex items-end gap-2 h-40">
                        {weeklyVolume.map(({ week, volume }) => {
                            const height = (volume / maxWeekVolume) * 100;
                            const date = new Date(week);
                            return (
                                <div key={week} className="flex-1 flex flex-col items-center gap-1">
                                    <div
                                        className="w-full bg-gradient-to-t from-[var(--color-accent-gold)] to-[var(--color-accent-beige)] rounded-t-lg transition-all"
                                        style={{ height: `${height}%`, minHeight: '4px' }}
                                        title={`${(volume / 1000).toFixed(1)}k kg`}
                                    />
                                    <span className="text-xs text-[var(--color-text-muted)]">
                                        {date.getDate()}/{date.getMonth() + 1}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                )}
            </AuraCard>

            {/* 1RM Evolution */}
            <AuraCard>
                <h3 className="text-lg font-semibold mb-4">🏆 1RM Evolution</h3>
                {oneRMData.length === 0 ? (
                    <p className="text-center text-[var(--color-text-muted)] py-8">No hay datos de 1RM registrados</p>
                ) : (
                    <div className="space-y-3">
                        {oneRMData.map(ex => (
                            <div key={ex.name} className="flex items-center gap-3">
                                <span className="text-sm text-[var(--color-text-muted)] w-32 truncate">{ex.name}</span>
                                <div className="flex-1 h-6 bg-[var(--color-bg-tertiary)] rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-gradient-to-r from-[var(--color-accent-gold)] to-[var(--color-accent-beige)] rounded-full"
                                        style={{ width: `${(ex.maxValue / maxOneRM) * 100}%` }}
                                    />
                                </div>
                                <span className="text-sm font-mono text-[var(--color-accent-beige)] w-16 text-right">
                                    {ex.maxValue}kg
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </AuraCard>

            {/* Intensity Metrics */}
            <AuraCard>
                <h3 className="text-lg font-semibold mb-4">💪 Intensity Metrics</h3>
                <div className="grid grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-[var(--color-bg-tertiary)] rounded-lg">
                        <p className="text-2xl font-mono text-[var(--color-accent-gold)]">{intensityData.avgIntensity}</p>
                        <p className="text-xs text-[var(--color-text-muted)]">Avg Intensity</p>
                    </div>
                    <div className="text-center p-4 bg-[var(--color-bg-tertiary)] rounded-lg">
                        <p className="text-2xl font-mono text-red-400">{intensityData.highIntensityPercent}%</p>
                        <p className="text-xs text-[var(--color-text-muted)]">High (8+)</p>
                    </div>
                    <div className="text-center p-4 bg-[var(--color-bg-tertiary)] rounded-lg">
                        <p className="text-2xl font-mono">{intensityData.totalSets}</p>
                        <p className="text-xs text-[var(--color-text-muted)]">Total Sets</p>
                    </div>
                </div>
            </AuraCard>

            {/* Fatigue vs Intensity - Weekly Trend Chart */}
            <AuraCard>
                <h3 className="text-lg font-semibold mb-4">🏃 Intensidad y Fatiga Semanal</h3>
                {fatigueData.count === 0 ? (
                    <p className="text-center text-[var(--color-text-muted)] py-8">Sin datos de fatiga/intensidad para el período</p>
                ) : (
                    <div className="space-y-4">
                        {/* Summary Stats */}
                        <div className="grid grid-cols-3 gap-4">
                            <div className="text-center p-4 bg-[var(--color-bg-tertiary)] rounded-lg">
                                <p className="text-2xl font-mono text-[var(--color-accent-gold)]">
                                    {fatigueData.avgIntensity?.toFixed(1) ?? '-'}
                                </p>
                                <p className="text-xs text-[var(--color-text-muted)]">Intensidad Media</p>
                            </div>
                            <div className="text-center p-4 bg-[var(--color-bg-tertiary)] rounded-lg">
                                <p className="text-2xl font-mono text-blue-400">
                                    {fatigueData.avgFatigue?.toFixed(1) ?? '-'}
                                </p>
                                <p className="text-xs text-[var(--color-text-muted)]">Fatiga Previa Media</p>
                            </div>
                            <div className="text-center p-4 bg-[var(--color-bg-tertiary)] rounded-lg">
                                <p className="text-2xl font-mono">{fatigueData.count}</p>
                                <p className="text-xs text-[var(--color-text-muted)]">Sesiones con Datos</p>
                            </div>
                        </div>

                        {/* AI Analysis Note */}
                        {fatigueData.avgIntensity !== null && fatigueData.avgIntensity >= 7.5 && (
                            <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg text-sm text-yellow-400">
                                ⚠️ <strong>Nota:</strong> La intensidad media alta ({fatigueData.avgIntensity.toFixed(1)}/10)
                                sugiere que podrías considerar una semana de descarga si no la has tenido recientemente.
                            </div>
                        )}
                        {fatigueData.avgFatigue !== null && fatigueData.avgFatigue >= 6 && (
                            <div className="p-3 bg-orange-500/10 border border-orange-500/30 rounded-lg text-sm text-orange-400">
                                💤 <strong>Consejo:</strong> Los niveles de fatiga previa están elevados ({fatigueData.avgFatigue.toFixed(1)}/10).
                                Prioriza el descanso y la recuperación.
                            </div>
                        )}
                    </div>
                )}
            </AuraCard>

            {/* AI Insights */}
            <AIInsightsPanel sessions={filteredSessions} activePlan={activePlan} />

            {/* Averages */}
            <div className="grid grid-cols-2 gap-4">
                <AuraCard className="text-center py-6">
                    <p className="text-3xl font-bold text-[var(--color-accent-beige)]">{metrics.avgVolume.toLocaleString()}</p>
                    <p className="text-sm text-[var(--color-text-muted)]">Volumen medio/sesión (kg)</p>
                </AuraCard>
                <AuraCard className="text-center py-6">
                    <p className="text-3xl font-bold text-[var(--color-accent-beige)]">{metrics.avgDuration}</p>
                    <p className="text-sm text-[var(--color-text-muted)]">Duración media (min)</p>
                </AuraCard>
            </div>
        </div>
    );
}
