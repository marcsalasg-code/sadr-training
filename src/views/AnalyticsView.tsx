/**
 * AnalyticsView - Vista de análisis y métricas de entrenamiento
 * 
 * REFACTORED: Using extracted tab components
 * Original: 523 lines → Now: ~280 lines
 */

import { useMemo, useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { PageContainer } from '../components/layout';
import { Select, Tabs, Badge } from '../components/ui';
import { AuraCard } from '../components/ui/aura';
import { useSessions, useAthletes, useExercises, useTrainingPlans } from '../store/store';
import { getSessionLog } from '../utils/sessionLog';
import { getWeeklyIntensityFatigue } from '../core/analysis/metrics';
import {
    calculateTotalVolume,
    calculateTotalDuration,
    calculateAvgDuration,
} from '../utils/dashboardMetrics';
import { AnalyticsOverviewTab, AnalyticsExercisesTab } from '../components/analytics';

export function AnalyticsView() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const sessions = useSessions();
    const athletes = useAthletes();
    const exercises = useExercises();
    const trainingPlans = useTrainingPlans();

    const initialAthlete = searchParams.get('athleteId') || 'all';
    const initialRange = searchParams.get('range') || 'month';

    const [selectedAthlete, setSelectedAthlete] = useState<string>(initialAthlete);
    const [timeRange, setTimeRange] = useState<string>(initialRange);

    useEffect(() => {
        const athleteParam = searchParams.get('athleteId');
        if (athleteParam && athleteParam !== selectedAthlete) {
            setSelectedAthlete(athleteParam);
        }
    }, [searchParams, selectedAthlete]);

    // Filter sessions by time range
    const filteredSessions = useMemo(() => {
        let cutoff = new Date();
        if (timeRange === 'week') cutoff.setDate(cutoff.getDate() - 7);
        else if (timeRange === 'month') cutoff.setMonth(cutoff.getMonth() - 1);
        else if (timeRange === '3months') cutoff.setMonth(cutoff.getMonth() - 3);
        else cutoff = new Date(0);

        return sessions
            .filter(s => s.status === 'completed')
            .filter(s => selectedAthlete === 'all' || s.athleteId === selectedAthlete)
            .filter(s => s.completedAt && new Date(s.completedAt) >= cutoff);
    }, [sessions, selectedAthlete, timeRange]);

    // Main metrics
    const metrics = useMemo(() => {
        const totalVolume = calculateTotalVolume(filteredSessions);
        const totalSets = filteredSessions.reduce((sum, s) => sum + (s.totalSets || 0), 0);
        const totalDuration = calculateTotalDuration(filteredSessions);
        const avgVolume = filteredSessions.length > 0 ? Math.round(totalVolume / filteredSessions.length) : 0;
        const avgDuration = calculateAvgDuration(filteredSessions);

        return { totalVolume, totalSets, totalDuration, avgVolume, avgDuration, sessionCount: filteredSessions.length };
    }, [filteredSessions]);

    // Weekly volume for chart
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
            .slice(-8)
            .map(([week, volume]) => ({ week, volume }));
    }, [filteredSessions]);

    // Top exercises
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

    // 1RM Data
    const oneRMData = useMemo(() => {
        const data: Array<{ name: string; maxValue: number }> = [];
        athletes.forEach(athlete => {
            if (athlete.oneRMRecords) {
                Object.entries(athlete.oneRMRecords).forEach(([exId, record]) => {
                    const exercise = exercises.find(e => e.id === exId);
                    if (record.currentOneRM && exercise) {
                        const existing = data.find(d => d.name === exercise.name);
                        if (existing) {
                            existing.maxValue = Math.max(existing.maxValue, record.currentOneRM);
                        } else {
                            data.push({ name: exercise.name, maxValue: record.currentOneRM });
                        }
                    }
                });
            }
        });
        return data.sort((a, b) => b.maxValue - a.maxValue).slice(0, 5);
    }, [athletes, exercises]);

    // Intensity data
    const intensityData = useMemo(() => {
        let totalIntensity = 0, intensityCount = 0, highIntensitySets = 0, totalSets = 0;
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
        return {
            avgIntensity: intensityCount > 0 ? (totalIntensity / intensityCount).toFixed(1) : '-',
            highIntensityPercent: totalSets > 0 ? Math.round((highIntensitySets / totalSets) * 100) : 0,
            totalSets,
        };
    }, [filteredSessions]);

    // Fatigue data
    const fatigueData = useMemo(() => getWeeklyIntensityFatigue(filteredSessions), [filteredSessions]);

    // Session log
    const sessionLog = useMemo(() => {
        let fromDate: string | undefined;
        const now = new Date();
        if (timeRange === 'week') fromDate = new Date(now.setDate(now.getDate() - 7)).toISOString();
        else if (timeRange === 'month') fromDate = new Date(now.setMonth(now.getMonth() - 1)).toISOString();
        else if (timeRange === '3months') fromDate = new Date(now.setMonth(now.getMonth() - 3)).toISOString();

        return getSessionLog(sessions, athletes, {
            athleteId: selectedAthlete === 'all' ? null : selectedAthlete,
            statuses: ['completed'],
            fromDate,
        });
    }, [sessions, athletes, selectedAthlete, timeRange]);

    const activePlan = selectedAthlete !== 'all'
        ? trainingPlans.find(p => p.athleteId === selectedAthlete && p.isActive)
        : undefined;

    const tabs = [
        {
            id: 'overview',
            label: 'Resumen',
            icon: '📊',
            content: (
                <AnalyticsOverviewTab
                    metrics={metrics}
                    weeklyVolume={weeklyVolume}
                    oneRMData={oneRMData}
                    intensityData={intensityData}
                    fatigueData={fatigueData}
                    filteredSessions={filteredSessions}
                    activePlan={activePlan}
                />
            ),
        },
        {
            id: 'exercises',
            label: 'Ejercicios',
            icon: '💪',
            content: <AnalyticsExercisesTab topExercises={topExercises} exercises={exercises} />,
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
                            <span className="text-sm text-[var(--color-text-muted)]">{sessionLog.length} sesiones</span>
                        </div>
                        {sessionLog.length === 0 ? (
                            <p className="text-center text-[var(--color-text-muted)] py-8">Sin sesiones completadas</p>
                        ) : (
                            <div className="space-y-2">
                                {sessionLog.map(entry => (
                                    <div
                                        key={entry.id}
                                        className="flex items-center justify-between p-3 rounded-lg bg-[var(--color-bg-tertiary)] hover:bg-[var(--color-bg-elevated)] transition-colors cursor-pointer"
                                        onClick={() => navigate(`/sessions/live/${entry.id}`)}
                                    >
                                        <div className="flex items-center gap-4 min-w-0 flex-1">
                                            <div className="w-24 shrink-0">
                                                <p className="text-sm font-medium">{entry.dateFormatted.split(',')[0]}</p>
                                                <p className="text-xs text-[var(--color-text-muted)]">{entry.dateFormatted.split(',')[1]}</p>
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="font-medium truncate">{entry.sessionName}</p>
                                                <p className="text-sm text-[var(--color-text-muted)]">{entry.athleteName}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4 shrink-0">
                                            <div className="text-right">
                                                <p className="text-sm font-bold text-[var(--color-accent-beige)]">
                                                    {entry.volume > 1000 ? `${(entry.volume / 1000).toFixed(1)}k` : entry.volume} kg
                                                </p>
                                                <p className="text-xs text-[var(--color-text-muted)]">{entry.setsCompleted} series</p>
                                            </div>
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
        <PageContainer title="Analytics" subtitle="Métricas y análisis de entrenamiento">
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
