/**
 * Dashboard - Panel principal con estadísticas y actividad reciente
 */

import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageContainer } from '../components/layout';
import { Card, Button, StatCard, Badge } from '../components/ui';
import { useSessions, useAthletes, useTemplates } from '../store/store';

export function Dashboard() {
    const navigate = useNavigate();
    const sessions = useSessions();
    const athletes = useAthletes();
    const templates = useTemplates();

    // Stats
    const stats = useMemo(() => {
        const now = new Date();
        const thisWeekStart = new Date(now);
        thisWeekStart.setDate(now.getDate() - now.getDay());
        thisWeekStart.setHours(0, 0, 0, 0);

        const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

        const completedSessions = sessions.filter(s => s.status === 'completed');
        const weekSessions = completedSessions.filter(s => s.completedAt && new Date(s.completedAt) >= thisWeekStart);
        const monthSessions = completedSessions.filter(s => s.completedAt && new Date(s.completedAt) >= thisMonthStart);

        const totalVolume = completedSessions.reduce((sum, s) => sum + (s.totalVolume || 0), 0);
        const weekVolume = weekSessions.reduce((sum, s) => sum + (s.totalVolume || 0), 0);
        const avgDuration = completedSessions.length > 0
            ? Math.round(completedSessions.reduce((sum, s) => sum + (s.durationMinutes || 0), 0) / completedSessions.length)
            : 0;

        const activeAthletes = athletes.filter(a => a.isActive).length;
        const inProgressSessions = sessions.filter(s => s.status === 'in_progress').length;

        return {
            totalSessions: completedSessions.length,
            weekSessions: weekSessions.length,
            monthSessions: monthSessions.length,
            totalVolume,
            weekVolume,
            avgDuration,
            activeAthletes,
            inProgressSessions,
            totalAthletes: athletes.length,
            totalTemplates: templates.length,
        };
    }, [sessions, athletes, templates]);

    // Sesiones recientes
    const recentSessions = useMemo(() => {
        return sessions
            .filter(s => s.status === 'completed')
            .sort((a, b) => new Date(b.completedAt || 0).getTime() - new Date(a.completedAt || 0).getTime())
            .slice(0, 5);
    }, [sessions]);

    // Próximas sesiones
    const upcomingSessions = useMemo(() => {
        return sessions
            .filter(s => s.status === 'planned' && s.scheduledDate)
            .sort((a, b) => new Date(a.scheduledDate!).getTime() - new Date(b.scheduledDate!).getTime())
            .slice(0, 3);
    }, [sessions]);

    const getAthleteName = (id: string) => athletes.find(a => a.id === id)?.name || 'Atleta';

    const formatDate = (dateStr?: string) => {
        if (!dateStr) return '';
        return new Date(dateStr).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
    };

    return (
        <PageContainer
            title="Dashboard"
            subtitle="Resumen de actividad"
            actions={
                <Button onClick={() => navigate('/sessions')}>+ Nueva Sesión</Button>
            }
        >
            {/* Main Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <StatCard label="Sesiones Esta Semana" value={stats.weekSessions} icon="📊" />
                <StatCard label="Volumen Semanal" value={`${(stats.weekVolume / 1000).toFixed(1)}k kg`} icon="🏋️" />
                <StatCard label="Atletas Activos" value={stats.activeAthletes} icon="👥" />
                <StatCard label="Duración Media" value={`${stats.avgDuration} min`} icon="⏱️" />
            </div>

            {/* Quick Actions */}
            {stats.inProgressSessions > 0 && (
                <Card className="mb-6 border-[var(--color-accent-gold)] bg-[var(--color-accent-gold)]/5">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <span className="text-2xl">🔴</span>
                            <div>
                                <h3 className="font-semibold">Sesión en curso</h3>
                                <p className="text-sm text-[var(--color-text-muted)]">Tienes {stats.inProgressSessions} sesión(es) activa(s)</p>
                            </div>
                        </div>
                        <Button onClick={() => navigate('/sessions')}>Ver sesiones</Button>
                    </div>
                </Card>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Sessions */}
                <Card>
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold">Sesiones Recientes</h3>
                        <Button variant="ghost" size="sm" onClick={() => navigate('/sessions')}>Ver todas</Button>
                    </div>
                    {recentSessions.length === 0 ? (
                        <p className="text-[var(--color-text-muted)] text-center py-6">Sin sesiones completadas</p>
                    ) : (
                        <div className="space-y-3">
                            {recentSessions.map(session => (
                                <div
                                    key={session.id}
                                    onClick={() => navigate(`/sessions/live/${session.id}`)}
                                    className="flex items-center justify-between p-3 rounded-lg bg-[var(--color-bg-tertiary)] hover:bg-[var(--color-bg-elevated)] cursor-pointer transition-colors"
                                >
                                    <div>
                                        <p className="font-medium">{session.name}</p>
                                        <p className="text-sm text-[var(--color-text-muted)]">
                                            {getAthleteName(session.athleteId)} • {formatDate(session.completedAt)}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[var(--color-accent-beige)] font-semibold">
                                            {session.totalVolume?.toLocaleString() || 0} kg
                                        </p>
                                        <p className="text-xs text-[var(--color-text-muted)]">
                                            {session.totalSets || 0} series
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </Card>

                {/* Upcoming Sessions */}
                <Card>
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold">Próximas Sesiones</h3>
                        <Button variant="ghost" size="sm" onClick={() => navigate('/calendar')}>Ver calendario</Button>
                    </div>
                    {upcomingSessions.length === 0 ? (
                        <p className="text-[var(--color-text-muted)] text-center py-6">Sin sesiones programadas</p>
                    ) : (
                        <div className="space-y-3">
                            {upcomingSessions.map(session => (
                                <div
                                    key={session.id}
                                    onClick={() => navigate(`/sessions/live/${session.id}`)}
                                    className="flex items-center justify-between p-3 rounded-lg bg-[var(--color-bg-tertiary)] hover:bg-[var(--color-bg-elevated)] cursor-pointer transition-colors"
                                >
                                    <div>
                                        <p className="font-medium">{session.name}</p>
                                        <p className="text-sm text-[var(--color-text-muted)]">{getAthleteName(session.athleteId)}</p>
                                    </div>
                                    <Badge variant="gold">{formatDate(session.scheduledDate)}</Badge>
                                </div>
                            ))}
                        </div>
                    )}
                </Card>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-3 gap-4 mt-6">
                <Card className="text-center py-4">
                    <p className="text-3xl font-bold text-[var(--color-accent-beige)]">{stats.totalSessions}</p>
                    <p className="text-sm text-[var(--color-text-muted)]">Sesiones totales</p>
                </Card>
                <Card className="text-center py-4">
                    <p className="text-3xl font-bold text-[var(--color-accent-beige)]">{(stats.totalVolume / 1000).toFixed(0)}k</p>
                    <p className="text-sm text-[var(--color-text-muted)]">Kg levantados</p>
                </Card>
                <Card className="text-center py-4">
                    <p className="text-3xl font-bold text-[var(--color-accent-beige)]">{stats.totalTemplates}</p>
                    <p className="text-sm text-[var(--color-text-muted)]">Plantillas</p>
                </Card>
            </div>
        </PageContainer>
    );
}
