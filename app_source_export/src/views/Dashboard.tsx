/**
 * Dashboard - Panel principal con estadísticas y actividad reciente
 * Rediseñado con sistema UI Aura
 * 
 * REFACTORED: Usa useDashboardData hook para toda la lógica de datos (Phase 5)
 * UPDATED: Clickable metrics → TrainingAnalytics, TrainingPlanModal integration
 * PHASE 6: Includes FatigueIndicator for overtraining alerts
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    AuraSection,
    AuraGrid,
    AuraMetric,
    AuraPanel,
    AuraButton,
    AuraBadge,
    AuraListItem,
    AuraCard,
    AuraEmptyState,
} from '../components/ui/aura';
import { TrainingPlanModal, AIInsightBanner, useAIInsight } from '../components/dashboard';
import { FatigueIndicator } from '../components/common';
import { useDashboardData } from '../hooks';
import { formatDateShort } from '../utils';

export function Dashboard() {
    const navigate = useNavigate();

    const {
        stats,
        weeklyIntensityFatigue,
        recentSessions,
        upcomingSessions,
        activeSession,
        lastCompletedSession,
        activePlan,
        weeklyAdherence,
        todayPlan,
        getAIRecommendations,
        hasSessionToday,
        getAthleteName,
    } = useDashboardData();

    // State for Training Plan Modal
    const [showTrainingPlanModal, setShowTrainingPlanModal] = useState(false);

    // AI Insight
    const aiInsight = useAIInsight(weeklyAdherence, !!todayPlan, hasSessionToday);

    return (
        <div className="p-8 space-y-8 max-w-6xl mx-auto">
            {/* AI Insight Banner */}
            {aiInsight && (
                <AIInsightBanner
                    type={aiInsight.type}
                    message={aiInsight.message}
                    action={aiInsight.action}
                    dismissible={aiInsight.dismissible}
                />
            )}

            {/* PHASE 6: Overtraining Alert - shown when active plan or high activity */}
            {(activePlan || stats.weekSessions >= 3) && (
                <FatigueIndicator
                    athleteId={activePlan?.athleteId || 'global'}
                    showDetails={false}
                    compact
                />
            )}

            {/* Header Section */}
            <AuraSection
                title="Dashboard"
                subtitle="Daily overview and active metrics."
                action={
                    <AuraButton onClick={() => navigate('/sessions')}>
                        + Nueva Sesión
                    </AuraButton>
                }
            >
                {/* Main Metrics - Clickable with focus params */}
                <AuraGrid cols={4} gap="md">
                    <div
                        onClick={() => navigate('/analytics?tab=training&focus=volume')}
                        className="cursor-pointer hover:scale-[1.02] transition-transform"
                        title="Volumen total levantado esta semana (kg)"
                    >
                        <AuraMetric
                            label="Weekly Volume"
                            value={`${(stats.weekVolume / 1000).toFixed(1)}K`}
                            trend={stats.weekVolume > 0 ? { value: 12, isPositive: true } : undefined}
                        />
                    </div>
                    <div
                        onClick={() => setShowTrainingPlanModal(true)}
                        className="cursor-pointer hover:scale-[1.02] transition-transform"
                        title="Entrenos completados/planificados esta semana"
                    >
                        <AuraMetric
                            label="Sessions"
                            value={activePlan ? `${weeklyAdherence.completed}/${weeklyAdherence.planned}` : `${stats.weekSessions}/5`}
                            icon={
                                <div className="flex flex-col gap-1">
                                    <div className="text-[10px] text-gray-500">
                                        {activePlan ? 'Plan Active' : 'Set Plan →'}
                                    </div>
                                    <div className="h-1 w-12 bg-[#222] rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-[var(--color-accent-gold)]"
                                            style={{
                                                width: activePlan
                                                    ? `${weeklyAdherence.percentage}%`
                                                    : `${Math.min(100, (stats.weekSessions / 5) * 100)}%`
                                            }}
                                        />
                                    </div>
                                </div>
                            }
                        />
                    </div>
                    <div
                        onClick={() => navigate('/athletes')}
                        className="cursor-pointer hover:scale-[1.02] transition-transform"
                        title="Atletas con sesiones en los últimos 30 días"
                    >
                        <AuraMetric
                            label="Active Athletes"
                            value={stats.activeAthletes}
                        />
                    </div>
                    <div
                        onClick={() => navigate('/analytics?tab=training&focus=duration')}
                        className="cursor-pointer hover:scale-[1.02] transition-transform"
                        title="Duración promedio de sesiones completadas"
                    >
                        <AuraMetric
                            label="Avg Duration"
                            value={`${stats.avgDuration} min`}
                        />
                    </div>
                </AuraGrid>

                {/* Secondary KPIs: Weekly Intensity & Fatigue */}
                {weeklyIntensityFatigue.count > 0 && (
                    <div className="grid grid-cols-2 gap-4 mt-4">
                        <AuraCard className="text-center py-3">
                            <p className="text-lg font-mono text-[var(--color-accent-gold)]">
                                {weeklyIntensityFatigue.avgIntensity?.toFixed(1) ?? '-'}/10
                            </p>
                            <p className="text-[10px] text-gray-500">Intensidad Media Semanal</p>
                        </AuraCard>
                        <AuraCard className="text-center py-3">
                            <p className="text-lg font-mono text-blue-400">
                                {weeklyIntensityFatigue.avgFatigue?.toFixed(1) ?? '-'}/10
                            </p>
                            <p className="text-[10px] text-gray-500">Fatiga Previa Media Semanal</p>
                        </AuraCard>
                    </div>
                )}
            </AuraSection>

            {/* AI Recommendations & Today's Plan */}
            {activePlan && (
                <AuraGrid cols={2} gap="md">
                    {/* Today's Plan */}
                    <AuraPanel variant="default">
                        <div className="flex items-center gap-2 mb-3">
                            <span className="text-lg">📅</span>
                            <span className="text-sm font-medium text-white">Today's Plan</span>
                        </div>
                        {todayPlan ? (
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs text-gray-400">Session Type</span>
                                    <AuraBadge variant="gold">{todayPlan.sessionType}</AuraBadge>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-xs text-gray-400">Intensity</span>
                                    <span className="text-sm text-white capitalize">{todayPlan.intensity || 'moderate'}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-xs text-gray-400">Focus</span>
                                    <span className="text-sm text-white">{todayPlan.focus || activePlan.objective}</span>
                                </div>
                                <AuraButton
                                    variant="gold"
                                    fullWidth
                                    size="sm"
                                    onClick={() => navigate('/sessions')}
                                    className="mt-3"
                                >
                                    Start Today's Session
                                </AuraButton>
                            </div>
                        ) : (
                            <p className="text-xs text-gray-500">Rest day - no session planned</p>
                        )}
                    </AuraPanel>

                    {/* AI Recommendations */}
                    <AuraPanel variant="default">
                        <div className="flex items-center gap-2 mb-3">
                            <span className="text-lg">🤖</span>
                            <span className="text-sm font-medium text-white">AI Insights</span>
                        </div>
                        <div className="space-y-2">
                            {getAIRecommendations().map((rec, idx) => (
                                <div
                                    key={idx}
                                    className="text-xs text-gray-300 py-1.5 px-2 bg-[#1A1A1A] rounded"
                                >
                                    {rec}
                                </div>
                            ))}
                        </div>
                        <div className="mt-3 pt-3 border-t border-[#222]">
                            <div className="flex justify-between text-xs">
                                <span className="text-gray-500">Weekly Score</span>
                                <span className="text-[var(--color-accent-gold)] font-mono">
                                    {weeklyAdherence.weeklyScore?.toFixed(0) || 0}%
                                </span>
                            </div>
                        </div>
                    </AuraPanel>
                </AuraGrid>
            )}

            {/* Active Session Panel */}
            {activeSession && (
                <AuraPanel variant="accent" corners>
                    <div className="flex justify-between items-start">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <div className="w-1.5 h-1.5 rounded-full bg-[var(--color-accent-gold)] animate-pulse" />
                                <span className="text-[10px] font-bold text-[var(--color-accent-gold)] uppercase tracking-widest">
                                    Live Session
                                </span>
                            </div>
                            <h3 className="text-xl text-white font-medium">{activeSession.name}</h3>
                            <p className="text-xs text-gray-500 font-mono mt-1">
                                {getAthleteName(activeSession.athleteId)}
                            </p>
                        </div>
                        <AuraButton
                            variant="gold"
                            onClick={() => navigate(`/sessions/live/${activeSession.id}`)}
                            icon={
                                <svg className="w-3 h-3 fill-black" viewBox="0 0 24 24">
                                    <path d="M8 5v14l11-7z" />
                                </svg>
                            }
                        >
                            Resume
                        </AuraButton>
                    </div>
                </AuraPanel>
            )}

            {/* Quick Notice for In-Progress Sessions */}
            {stats.inProgressSessions > 0 && !activeSession && (
                <AuraPanel variant="highlight">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <span className="text-2xl">🔴</span>
                            <div>
                                <h3 className="font-semibold text-white">Sesión en curso</h3>
                                <p className="text-sm text-gray-500">
                                    Tienes {stats.inProgressSessions} sesión(es) activa(s)
                                </p>
                            </div>
                        </div>
                        <AuraButton onClick={() => navigate('/sessions')}>
                            Ver sesiones
                        </AuraButton>
                    </div>
                </AuraPanel>
            )}

            {/* Quick Actions */}
            <AuraPanel
                header={<span className="text-sm text-white font-medium">⚡ Quick Actions</span>}
            >
                <div className="flex flex-wrap gap-3">
                    <AuraButton
                        variant="secondary"
                        size="sm"
                        onClick={() => navigate('/templates')}
                    >
                        📋 Create from template
                    </AuraButton>
                    {lastCompletedSession && (
                        <AuraButton
                            variant="secondary"
                            size="sm"
                            onClick={() => navigate(`/sessions?duplicate=${lastCompletedSession.id}`)}
                        >
                            🔄 Repeat last session
                        </AuraButton>
                    )}
                </div>
            </AuraPanel>

            {/* Sessions Grid */}
            <AuraGrid cols={2} gap="lg">
                {/* Recent Sessions */}
                <AuraPanel
                    header={
                        <button
                            onClick={() => navigate('/sessions?filter=recent')}
                            className="w-full flex items-center justify-between group py-1"
                            role="link"
                            aria-label="Ver todas las sesiones recientes"
                        >
                            <span className="text-sm text-white font-medium group-hover:text-[var(--color-accent-gold)] transition-colors">
                                Recent Sessions →
                            </span>
                        </button>
                    }
                >
                    {recentSessions.length === 0 ? (
                        <AuraEmptyState
                            icon="🏋️"
                            title="Ready to train!"
                            description="Complete your first session to see it here."
                            size="sm"
                        />
                    ) : (
                        <div className="space-y-2">
                            {recentSessions.map(session => (
                                <AuraListItem
                                    key={session.id}
                                    title={session.name}
                                    subtitle={`${getAthleteName(session.athleteId)} • ${formatDateShort(session.completedAt)}`}
                                    onClick={() => navigate(`/sessions/live/${session.id}`)}
                                    rightContent={
                                        <div className="text-right">
                                            <p className="text-[var(--color-accent-gold)] font-semibold text-sm font-mono">
                                                {session.totalVolume?.toLocaleString() || 0} kg
                                            </p>
                                            <p className="text-[10px] text-gray-500">
                                                {session.totalSets || 0} sets
                                            </p>
                                        </div>
                                    }
                                />
                            ))}
                        </div>
                    )}
                </AuraPanel>

                {/* Upcoming Sessions */}
                <AuraPanel
                    header={
                        <button
                            onClick={() => navigate('/calendar')}
                            className="w-full flex items-center justify-between group py-1"
                            role="link"
                            aria-label="Ver calendario de sesiones"
                        >
                            <span className="text-sm text-white font-medium group-hover:text-[var(--color-accent-gold)] transition-colors">
                                Upcoming Sessions →
                            </span>
                        </button>
                    }
                >
                    {upcomingSessions.length === 0 ? (
                        <AuraEmptyState
                            icon="📅"
                            title="No upcoming sessions"
                            description="Schedule sessions in the calendar to stay on track."
                            size="sm"
                        />
                    ) : (
                        <div className="space-y-2">
                            {upcomingSessions.map(session => (
                                <AuraListItem
                                    key={session.id}
                                    title={session.name}
                                    subtitle={getAthleteName(session.athleteId)}
                                    onClick={() => navigate(`/sessions/live/${session.id}`)}
                                    rightContent={
                                        <AuraBadge variant="gold">
                                            {formatDateShort(session.scheduledDate)}
                                        </AuraBadge>
                                    }
                                />
                            ))}
                        </div>
                    )}
                </AuraPanel>
            </AuraGrid>

            {/* Summary Stats */}
            <AuraGrid cols={3} gap="md">
                <AuraCard
                    hover
                    className="text-center py-6 cursor-pointer"
                    onClick={() => navigate('/analytics?tab=training')}
                >
                    <p className="text-3xl font-bold text-[var(--color-accent-gold)] font-mono">
                        {stats.totalSessions}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">Total Sessions</p>
                </AuraCard>
                <AuraCard
                    hover
                    className="text-center py-6 cursor-pointer"
                    onClick={() => navigate('/analytics?tab=training')}
                >
                    <p className="text-3xl font-bold text-[var(--color-accent-gold)] font-mono">
                        {(stats.totalVolume / 1000).toFixed(0)}k
                    </p>
                    <p className="text-sm text-gray-500 mt-1">Total Volume (kg)</p>
                </AuraCard>
                <AuraCard
                    hover
                    className="text-center py-6 cursor-pointer"
                    onClick={() => navigate('/templates')}
                >
                    <p className="text-3xl font-bold text-[var(--color-accent-gold)] font-mono">
                        {stats.totalTemplates}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">Templates</p>
                </AuraCard>
            </AuraGrid>

            {/* Training Plan Modal */}
            <TrainingPlanModal
                isOpen={showTrainingPlanModal}
                onClose={() => setShowTrainingPlanModal(false)}
                onPlanCreated={() => {
                    // Plan created, modal will close automatically
                }}
            />
        </div>
    );
}
