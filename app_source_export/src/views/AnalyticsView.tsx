/**
 * AnalyticsView - Vista de análisis y métricas de entrenamiento
 */

import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageContainer } from '../components/layout';
import { Select, Tabs, Badge } from '../components/ui';
import { AuraCard, AuraMetric } from '../components/ui/aura';
import { useSessions, useAthletes, useExercises, useTrainingPlans } from '../store/store';
import { getSessionLog } from '../utils/sessionLog';
import { getWeeklyIntensityFatigue } from '../utils/metrics';
import {
    filterCompletedSessions,
    calculateTotalVolume,
    calculateTotalDuration,
    calculateAvgDuration,
} from '../utils/dashboardMetrics';
import { AIInsightsPanel } from '../components/common';

export function AnalyticsView() {
    const navigate = useNavigate();
    const sessions = useSessions();
    const athletes = useAthletes();
    const exercises = useExercises();
    const trainingPlans = useTrainingPlans();

    const [selectedAthlete, setSelectedAthlete] = useState<string>('all');
    const [timeRange, setTimeRange] = useState<string>('month');

    // Filtrar sesiones por rango de tiempo
    const filteredSessions = useMemo(() => {
        let cutoff = new Date();
        if (timeRange === 'week') cutoff.setDate(cutoff.getDate() - 7);
        else if (timeRange === 'month') cutoff.setMonth(cutoff.getMonth() - 1);
        else if (timeRange === '3months') cutoff.setMonth(cutoff.getMonth() - 3);
        else cutoff = new Date(0); // all time

        return sessions
            .filter(s => s.status === 'completed')
            .filter(s => selectedAthlete === 'all' || s.athleteId === selectedAthlete)
            .filter(s => s.completedAt && new Date(s.completedAt) >= cutoff);
    }, [sessions, selectedAthlete, timeRange]);

    // Métricas principales - using centralized calculations
    const metrics = useMemo(() => {
        const totalVolume = calculateTotalVolume(filteredSessions);
        const totalSets = filteredSessions.reduce((sum, s) => sum + (s.totalSets || 0), 0);
        const totalReps = filteredSessions.reduce((sum, s) => sum + (s.totalReps || 0), 0);
        const totalDuration = calculateTotalDuration(filteredSessions);
        const avgVolume = filteredSessions.length > 0 ? Math.round(totalVolume / filteredSessions.length) : 0;
        const avgDuration = calculateAvgDuration(filteredSessions);

        return { totalVolume, totalSets, totalReps, totalDuration, avgVolume, avgDuration, sessionCount: filteredSessions.length };
    }, [filteredSessions]);

    // Volumen por semana (para gráfico simple)
    const weeklyVolume = useMemo(() => {
        const weeks: Record<string, number> = {};
        filteredSessions.forEach(s => {
            if (!s.completedAt) return;
            const date = new Date(s.completedAt);
            const weekStart = new Date(date);
            weekStart.setDate(date.getDate() - date.getDay());
            const weekKey = weekStart.toISOString().split('T')[0];
            weeks[weekKey] = (weeks[weekKey] || 0) + (s.totalVolume || 0);
        });
        return Object.entries(weeks)
            .sort(([a], [b]) => a.localeCompare(b))
            .slice(-8);
    }, [filteredSessions]);

    // Top ejercicios (por volumen)
    const topExercises = useMemo(() => {
        const volumes: Record<string, { volume: number; sets: number }> = {};
        filteredSessions.forEach(s => {
            s.exercises?.forEach(ex => {
                if (!volumes[ex.exerciseId]) volumes[ex.exerciseId] = { volume: 0, sets: 0 };
                ex.sets.forEach(set => {
                    if (set.isCompleted) {
                        volumes[ex.exerciseId].volume += (set.actualWeight || 0) * (set.actualReps || 0);
                        volumes[ex.exerciseId].sets++;
                    }
                });
            });
        });
        return Object.entries(volumes)
            .map(([id, data]) => ({ id, name: exercises.find(e => e.id === id)?.name || 'Ejercicio', ...data }))
            .sort((a, b) => b.volume - a.volume)
            .slice(0, 5);
    }, [filteredSessions, exercises]);

    // Historial de sesiones usando el helper
    const sessionLog = useMemo(() => {
        // Calcular fecha de corte según timeRange
        let fromDate: string | undefined;
        const now = new Date();
        if (timeRange === 'week') {
            const cutoff = new Date(now);
            cutoff.setDate(cutoff.getDate() - 7);
            fromDate = cutoff.toISOString();
        } else if (timeRange === 'month') {
            const cutoff = new Date(now);
            cutoff.setMonth(cutoff.getMonth() - 1);
            fromDate = cutoff.toISOString();
        } else if (timeRange === '3months') {
            const cutoff = new Date(now);
            cutoff.setMonth(cutoff.getMonth() - 3);
            fromDate = cutoff.toISOString();
        }
        // 'all' = sin fromDate

        return getSessionLog(sessions, athletes, {
            athleteId: selectedAthlete === 'all' ? null : selectedAthlete,
            statuses: ['completed'],
            fromDate,
        });
    }, [sessions, athletes, selectedAthlete, timeRange]);

    // Max volumen
    const maxWeekVolume = weeklyVolume.length > 0 ? Math.max(...weeklyVolume.map(([, v]) => v)) : 1;

    const tabs = [
        {
            id: 'overview',
            label: 'Resumen',
            icon: '📊',
            content: (
                <div className="space-y-6">
                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <AuraMetric label="Sesiones" value={metrics.sessionCount} icon="📋" />
                        <AuraMetric label="Volumen Total" value={`${(metrics.totalVolume / 1000).toFixed(1)}k kg`} icon="🏋️" />
                        <AuraMetric label="Series Totales" value={metrics.totalSets} icon="🔢" />
                        <AuraMetric label="Tiempo Total" value={`${Math.round(metrics.totalDuration / 60)}h`} icon="⏱️" />
                    </div>

                    {/* Volume Chart (Simple bar) */}
                    <AuraCard>
                        <h3 className="text-lg font-semibold mb-4">📈 Volumen Semanal</h3>
                        {weeklyVolume.length === 0 ? (
                            <p className="text-center text-[var(--color-text-muted)] py-8">Sin datos para el período seleccionado</p>
                        ) : (
                            <div className="flex items-end gap-2 h-40">
                                {weeklyVolume.map(([week, volume]) => {
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

                    {/* 1RM Evolution (Sistema 1RM) */}
                    <AuraCard>
                        <h3 className="text-lg font-semibold mb-4">🏆 1RM Evolution</h3>
                        {(() => {
                            // Collect 1RM data from all athletes
                            const oneRMData: Array<{ exercise: string, value: number, athlete: string }> = [];
                            athletes.forEach(athlete => {
                                if (athlete.oneRMRecords) {
                                    Object.entries(athlete.oneRMRecords).forEach(([exId, record]) => {
                                        const exercise = exercises.find(e => e.id === exId);
                                        if (record.currentOneRM && exercise) {
                                            oneRMData.push({
                                                exercise: exercise.name,
                                                value: record.currentOneRM,
                                                athlete: athlete.name,
                                            });
                                        }
                                    });
                                }
                            });

                            if (oneRMData.length === 0) {
                                return <p className="text-center text-[var(--color-text-muted)] py-8">No hay datos de 1RM registrados</p>;
                            }

                            // Group by exercise and show top 5
                            const byExercise = oneRMData.reduce((acc, item) => {
                                if (!acc[item.exercise]) acc[item.exercise] = [];
                                acc[item.exercise].push(item);
                                return acc;
                            }, {} as Record<string, typeof oneRMData>);

                            const topOneRM = Object.entries(byExercise)
                                .map(([name, records]) => ({
                                    name,
                                    maxValue: Math.max(...records.map(r => r.value)),
                                }))
                                .sort((a, b) => b.maxValue - a.maxValue)
                                .slice(0, 5);

                            const maxVal = Math.max(...topOneRM.map(e => e.maxValue));

                            return (
                                <div className="space-y-3">
                                    {topOneRM.map(ex => (
                                        <div key={ex.name} className="flex items-center gap-3">
                                            <span className="text-sm text-[var(--color-text-muted)] w-32 truncate">{ex.name}</span>
                                            <div className="flex-1 h-6 bg-[var(--color-bg-tertiary)] rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-gradient-to-r from-[var(--color-accent-gold)] to-[var(--color-accent-beige)] rounded-full"
                                                    style={{ width: `${(ex.maxValue / maxVal) * 100}%` }}
                                                />
                                            </div>
                                            <span className="text-sm font-mono text-[var(--color-accent-beige)] w-16 text-right">
                                                {ex.maxValue}kg
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            );
                        })()}
                    </AuraCard>

                    {/* Intensity Metrics (Sistema 1RM) */}
                    <AuraCard>
                        <h3 className="text-lg font-semibold mb-4">💪 Intensity Metrics</h3>
                        {(() => {
                            let totalIntensity = 0;
                            let intensityCount = 0;
                            let highIntensitySets = 0;
                            let totalSets = 0;

                            filteredSessions.forEach(session => {
                                session.exercises.forEach(ex => {
                                    ex.sets.forEach(set => {
                                        if (set.isCompleted) {
                                            totalSets++;
                                            const intensity = set.intensity ?? set.rpe ?? 7;
                                            totalIntensity += intensity;
                                            intensityCount++;
                                            if (intensity >= 8) highIntensitySets++;
                                        }
                                    });
                                });
                            });

                            const avgIntensity = intensityCount > 0 ? (totalIntensity / intensityCount).toFixed(1) : '-';
                            const highIntensityPercent = totalSets > 0 ? Math.round((highIntensitySets / totalSets) * 100) : 0;

                            return (
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="text-center p-4 bg-[var(--color-bg-tertiary)] rounded-lg">
                                        <p className="text-2xl font-mono text-[var(--color-accent-gold)]">{avgIntensity}</p>
                                        <p className="text-xs text-[var(--color-text-muted)]">Avg Intensity</p>
                                    </div>
                                    <div className="text-center p-4 bg-[var(--color-bg-tertiary)] rounded-lg">
                                        <p className="text-2xl font-mono text-red-400">{highIntensityPercent}%</p>
                                        <p className="text-xs text-[var(--color-text-muted)]">High (8+)</p>
                                    </div>
                                    <div className="text-center p-4 bg-[var(--color-bg-tertiary)] rounded-lg">
                                        <p className="text-2xl font-mono">{totalSets}</p>
                                        <p className="text-xs text-[var(--color-text-muted)]">Total Sets</p>
                                    </div>
                                </div>
                            );
                        })()}
                    </AuraCard>

                    {/* Fatigue vs Intensity Trend (Sprint Intensity-Fatigue) */}
                    <AuraCard>
                        <h3 className="text-lg font-semibold mb-4">🏃 Fatiga vs Intensidad</h3>
                        {(() => {
                            const weeklyData = getWeeklyIntensityFatigue(filteredSessions);

                            if (weeklyData.count === 0) {
                                return <p className="text-center text-[var(--color-text-muted)] py-8">Sin datos de fatiga/intensidad para el período</p>;
                            }

                            return (
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="text-center p-4 bg-[var(--color-bg-tertiary)] rounded-lg">
                                        <p className="text-2xl font-mono text-[var(--color-accent-gold)]">
                                            {weeklyData.avgIntensity?.toFixed(1) ?? '-'}
                                        </p>
                                        <p className="text-xs text-[var(--color-text-muted)]">Intensidad Media</p>
                                    </div>
                                    <div className="text-center p-4 bg-[var(--color-bg-tertiary)] rounded-lg">
                                        <p className="text-2xl font-mono text-blue-400">
                                            {weeklyData.avgFatigue?.toFixed(1) ?? '-'}
                                        </p>
                                        <p className="text-xs text-[var(--color-text-muted)]">Fatiga Previa Media</p>
                                    </div>
                                    <div className="text-center p-4 bg-[var(--color-bg-tertiary)] rounded-lg">
                                        <p className="text-2xl font-mono">{weeklyData.count}</p>
                                        <p className="text-xs text-[var(--color-text-muted)]">Sesiones con Datos</p>
                                    </div>
                                </div>
                            );
                        })()}
                    </AuraCard>

                    {/* AI Insights Panel */}
                    <AIInsightsPanel
                        sessions={filteredSessions}
                        activePlan={selectedAthlete !== 'all' ? trainingPlans.find(p => p.athleteId === selectedAthlete && p.isActive) : undefined}
                    />

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
            ),
        },
        {
            id: 'exercises',
            label: 'Ejercicios',
            icon: '💪',
            content: (
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

                    {/* Ejercicios disponibles */}
                    <AuraCard>
                        <h3 className="text-lg font-semibold mb-4">📋 Biblioteca de Ejercicios</h3>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                            {exercises.map(ex => (
                                <div key={ex.id} className="p-2 rounded bg-[var(--color-bg-tertiary)] text-sm">
                                    <p className="font-medium truncate">{ex.name}</p>
                                    <p className="text-xs text-[var(--color-text-muted)]">{ex.muscleGroups.join(', ')}</p>
                                </div>
                            ))}
                            {exercises.length === 0 && (
                                <p className="col-span-full text-center text-[var(--color-text-muted)] py-4">Sin ejercicios registrados</p>
                            )}
                        </div>
                    </AuraCard>
                </div>
            ),
        },
        {
            id: 'athletes',
            label: 'Atletas',
            icon: '👥',
            content: (
                <div className="space-y-4">
                    {athletes.map(athlete => {
                        const athleteSessions = sessions.filter(s => s.athleteId === athlete.id && s.status === 'completed');
                        const volume = athleteSessions.reduce((sum, s) => sum + (s.totalVolume || 0), 0);
                        return (
                            <AuraCard key={athlete.id} className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-full bg-[var(--color-accent-gold)]/20 flex items-center justify-center text-lg font-bold text-[var(--color-accent-gold)]">
                                        {athlete.name.charAt(0)}
                                    </div>
                                    <div>
                                        <p className="font-semibold">{athlete.name}</p>
                                        <p className="text-sm text-[var(--color-text-muted)]">{athleteSessions.length} sesiones</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-xl font-bold text-[var(--color-accent-beige)]">{(volume / 1000).toFixed(1)}k</p>
                                    <p className="text-xs text-[var(--color-text-muted)]">kg total</p>
                                </div>
                            </AuraCard>
                        );
                    })}
                    {athletes.length === 0 && (
                        <AuraCard>
                            <p className="text-center text-[var(--color-text-muted)] py-8">Sin atletas registrados</p>
                        </AuraCard>
                    )}
                </div>
            ),
        },
        {
            id: 'history',
            label: 'Historial',
            icon: '📜',
            content: (
                <div className="space-y-4">
                    <AuraCard>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold">📜 Historial de Sesiones</h3>
                            <span className="text-sm text-[var(--color-text-muted)]">
                                {sessionLog.length} sesiones completadas
                            </span>
                        </div>

                        {sessionLog.length === 0 ? (
                            <p className="text-center text-[var(--color-text-muted)] py-8">
                                Sin sesiones completadas en el período seleccionado
                            </p>
                        ) : (
                            <div className="space-y-2">
                                {sessionLog.map(entry => (
                                    <div
                                        key={entry.id}
                                        className="flex items-center justify-between p-3 rounded-lg bg-[var(--color-bg-tertiary)] hover:bg-[var(--color-bg-elevated)] transition-colors cursor-pointer"
                                        onClick={() => navigate(`/sessions/live/${entry.id}`)}
                                    >
                                        <div className="flex items-center gap-4 min-w-0 flex-1">
                                            {/* Fecha */}
                                            <div className="w-24 shrink-0">
                                                <p className="text-sm font-medium">{entry.dateFormatted.split(',')[0]}</p>
                                                <p className="text-xs text-[var(--color-text-muted)]">{entry.dateFormatted.split(',')[1]}</p>
                                            </div>

                                            {/* Info sesión */}
                                            <div className="min-w-0 flex-1">
                                                <p className="font-medium truncate">{entry.sessionName}</p>
                                                <p className="text-sm text-[var(--color-text-muted)]">{entry.athleteName}</p>
                                            </div>
                                        </div>

                                        {/* Métricas */}
                                        <div className="flex items-center gap-4 shrink-0">
                                            <div className="text-right">
                                                <p className="text-sm font-bold text-[var(--color-accent-beige)]">
                                                    {entry.volume > 1000 ? `${(entry.volume / 1000).toFixed(1)}k` : entry.volume} kg
                                                </p>
                                                <p className="text-xs text-[var(--color-text-muted)]">{entry.setsCompleted} series</p>
                                            </div>
                                            {entry.duration > 0 && (
                                                <div className="text-right">
                                                    <p className="text-sm text-[var(--color-text-secondary)]">{entry.duration} min</p>
                                                </div>
                                            )}
                                            <Badge size="sm" variant="success">Completada</Badge>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </AuraCard>
                </div>
            ),
        },
    ];

    return (
        <PageContainer
            title="Analytics"
            subtitle="Métricas y análisis de entrenamiento"
        >
            {/* Filtros */}
            <div className="flex flex-wrap gap-4 mb-6">
                <Select
                    value={timeRange}
                    onChange={(e) => setTimeRange(e.target.value)}
                    options={[
                        { value: 'week', label: 'Última semana' },
                        { value: 'month', label: 'Último mes' },
                        { value: '3months', label: 'Últimos 3 meses' },
                        { value: 'all', label: 'Todo el tiempo' },
                    ]}
                    className="w-48"
                />
                <Select
                    value={selectedAthlete}
                    onChange={(e) => setSelectedAthlete(e.target.value)}
                    options={[
                        { value: 'all', label: 'Todos los atletas' },
                        ...athletes.map(a => ({ value: a.id, label: a.name })),
                    ]}
                    className="w-48"
                />
            </div>

            <Tabs tabs={tabs} />
        </PageContainer>
    );
}
