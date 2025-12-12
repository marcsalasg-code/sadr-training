/**
 * AIInsightsPanel - Panel de Insights IA para Analytics
 * 
 * Conecta el analyticsEngine al UI, mostrando:
 * - Patrones de movimiento (push/pull/hinge/squat/etc)
 * - Tendencias de volumen, sesiones, adherencia
 * - Recomendaciones personalizadas
 * - Comparación semanal
 */

import React, { useMemo } from 'react';
import type { WorkoutSession, TrainingPlan } from '../../types/types';
import {
    calculateWeeklyAnalytics,
    compareWeeks,
    type WeeklyAnalytics,
    type AnalyticsTrend,
    type MovementPattern,
} from '../../ai/engines/analyticsEngine';
import { useExercises } from '../../store/store';

interface AIInsightsPanelProps {
    sessions: WorkoutSession[];
    activePlan?: TrainingPlan;
    compact?: boolean;
}

/**
 * Helper: Compute adherence from sessions and plan
 */
function computeAdherence(
    sessions: WorkoutSession[],
    plan?: TrainingPlan
): { planned: number; completed: number; percentage: number; volumeTarget: number; volumeActual: number; volumeDeviation: number; weeklyScore: number } {
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());
    weekStart.setHours(0, 0, 0, 0);

    const thisWeekSessions = sessions.filter(s => {
        if (s.status !== 'completed' || !s.completedAt) return false;
        const completedDate = new Date(s.completedAt);
        return completedDate >= weekStart;
    });

    const volumeActual = thisWeekSessions.reduce((sum, s) => sum + (s.totalVolume || 0), 0);
    const completed = thisWeekSessions.length;

    // Get planned info from training plan if available
    const planned = plan?.dayPlans.length || 4; // Default 4 days/week
    const volumeTarget = plan?.dayPlans.reduce((sum: number, d) => sum + (d.estimatedVolume || 0), 0) || 15000;

    const percentage = planned > 0 ? Math.round((completed / planned) * 100) : 0;
    const volumeDeviation = volumeTarget > 0 ? ((volumeActual - volumeTarget) / volumeTarget) * 100 : 0;

    // Calculate weekly score (simple formula)
    const adherenceScore = Math.min(100, percentage);
    const volumeScore = 100 - Math.abs(volumeDeviation);
    const weeklyScore = Math.round((adherenceScore * 0.4) + (Math.max(0, volumeScore) * 0.6));

    return { planned, completed, percentage, volumeTarget, volumeActual, volumeDeviation, weeklyScore };
}

/**
 * Get sessions from previous week for comparison
 */
function getPreviousWeekSessions(sessions: WorkoutSession[]): WorkoutSession[] {
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());
    weekStart.setHours(0, 0, 0, 0);

    const prevWeekStart = new Date(weekStart);
    prevWeekStart.setDate(prevWeekStart.getDate() - 7);

    return sessions.filter(s => {
        if (s.status !== 'completed' || !s.completedAt) return false;
        const completedDate = new Date(s.completedAt);
        return completedDate >= prevWeekStart && completedDate < weekStart;
    });
}

function getCurrentWeekSessions(sessions: WorkoutSession[]): WorkoutSession[] {
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());
    weekStart.setHours(0, 0, 0, 0);

    return sessions.filter(s => {
        if (s.status !== 'completed' || !s.completedAt) return false;
        const completedDate = new Date(s.completedAt);
        return completedDate >= weekStart;
    });
}

// Trend direction icon
function TrendIcon({ direction, className }: { direction: 'up' | 'down' | 'stable'; className?: string }) {
    const icons = {
        up: '↑',
        down: '↓',
        stable: '→',
    };
    const colors = {
        up: 'text-green-400',
        down: 'text-red-400',
        stable: 'text-gray-400',
    };
    return <span className={`${colors[direction]} ${className || ''}`}>{icons[direction]}</span>;
}

// Pattern color
const patternColors: Record<MovementPattern['pattern'], string> = {
    push: 'bg-blue-500',
    pull: 'bg-purple-500',
    hinge: 'bg-orange-500',
    squat: 'bg-green-500',
    carry: 'bg-yellow-500',
    core: 'bg-pink-500',
    other: 'bg-gray-500',
};

const patternLabels: Record<MovementPattern['pattern'], string> = {
    push: 'Push',
    pull: 'Pull',
    hinge: 'Hinge',
    squat: 'Squat',
    carry: 'Carry',
    core: 'Core',
    other: 'Other',
};

export const AIInsightsPanel: React.FC<AIInsightsPanelProps> = ({
    sessions,
    activePlan,
    compact = false,
}) => {
    const exercises = useExercises();

    // Compute analytics
    const { analytics, weekComparison, adherence } = useMemo(() => {
        const currentWeekSessions = getCurrentWeekSessions(sessions);
        const prevWeekSessions = getPreviousWeekSessions(sessions);
        const adherence = computeAdherence(sessions, activePlan);

        const analytics = calculateWeeklyAnalytics(
            currentWeekSessions,
            activePlan,
            adherence,
            exercises
        );

        const weekComparison = compareWeeks(currentWeekSessions, prevWeekSessions);

        return { analytics, weekComparison, adherence };
    }, [sessions, activePlan, exercises]);

    // No data state
    if (sessions.length === 0) {
        return (
            <div className="p-4 bg-[#0D0D0D] rounded-lg border border-[#1A1A1A] text-center">
                <p className="text-sm text-gray-500">
                    🤖 Sin datos suficientes para generar insights
                </p>
            </div>
        );
    }

    // Compact view
    if (compact) {
        return (
            <div className="p-4 bg-[#0D0D0D] rounded-lg border border-[#1A1A1A]">
                <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">
                    🤖 AI Insights
                </h4>
                {analytics.recommendations.length > 0 && (
                    <ul className="space-y-1">
                        {analytics.recommendations.slice(0, 2).map((rec, i) => (
                            <li key={i} className="text-sm text-gray-300 flex items-start gap-2">
                                <span className="text-[var(--color-accent-gold)]">•</span>
                                {rec}
                            </li>
                        ))}
                    </ul>
                )}
                {analytics.recommendations.length === 0 && (
                    <p className="text-sm text-green-400">✓ Todo en equilibrio esta semana</p>
                )}
            </div>
        );
    }

    // Full view
    return (
        <div className="p-4 bg-[#0D0D0D] rounded-lg border border-[#1A1A1A] space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                    🤖 AI Insights
                </h3>
                {adherence.weeklyScore !== undefined && (
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">Weekly Score</span>
                        <span className={`text-lg font-bold ${adherence.weeklyScore >= 80 ? 'text-green-400' :
                            adherence.weeklyScore >= 50 ? 'text-yellow-400' : 'text-red-400'
                            }`}>
                            {adherence.weeklyScore}
                        </span>
                    </div>
                )}
            </div>

            {/* Movement Patterns */}
            {analytics.movementPatterns.length > 0 && (
                <div>
                    <p className="text-xs text-gray-500 mb-2">Movement Balance</p>
                    <div className="flex h-3 rounded-full overflow-hidden">
                        {analytics.movementPatterns
                            .filter(p => p.percentage > 0)
                            .map((pattern) => (
                                <div
                                    key={pattern.pattern}
                                    className={`${patternColors[pattern.pattern]} transition-all`}
                                    style={{ width: `${pattern.percentage}%` }}
                                    title={`${patternLabels[pattern.pattern]}: ${pattern.percentage.toFixed(0)}%`}
                                />
                            ))}
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2">
                        {analytics.movementPatterns
                            .filter(p => p.percentage > 5)
                            .map((pattern) => (
                                <span
                                    key={pattern.pattern}
                                    className="text-xs text-gray-400 flex items-center gap-1"
                                >
                                    <span className={`w-2 h-2 rounded-full ${patternColors[pattern.pattern]}`} />
                                    {patternLabels[pattern.pattern]} {pattern.percentage.toFixed(0)}%
                                </span>
                            ))}
                    </div>
                </div>
            )}

            {/* Trends */}
            {(analytics.trends.length > 0 || weekComparison.length > 0) && (
                <div>
                    <p className="text-xs text-gray-500 mb-2">Trends</p>
                    <div className="space-y-1">
                        {/* Weekly analytics trends */}
                        {analytics.trends.slice(0, 3).map((trend, i) => (
                            <div key={i} className="flex items-center gap-2 text-sm">
                                <TrendIcon direction={trend.direction} />
                                <span className="text-gray-300">{trend.description}</span>
                            </div>
                        ))}
                        {/* Week comparison trends */}
                        {weekComparison.slice(0, 2).map((trend, i) => (
                            <div key={`cmp-${i}`} className="flex items-center gap-2 text-sm">
                                <TrendIcon direction={trend.direction} />
                                <span className="text-gray-300">{trend.description}</span>
                                {trend.percentChange !== 0 && (
                                    <span className={`text-xs ${trend.direction === 'up' ? 'text-green-400' : trend.direction === 'down' ? 'text-red-400' : 'text-gray-500'}`}>
                                        {trend.percentChange > 0 ? '+' : ''}{trend.percentChange.toFixed(0)}%
                                    </span>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Recommendations */}
            {analytics.recommendations.length > 0 && (
                <div className="border-t border-[#2A2A2A] pt-3">
                    <p className="text-xs text-gray-500 mb-2">💡 Recommendations</p>
                    <ul className="space-y-2">
                        {analytics.recommendations.map((rec, i) => (
                            <li
                                key={i}
                                className="text-sm text-gray-300 flex items-start gap-2 bg-[#141414] p-2 rounded"
                            >
                                <span className="text-[var(--color-accent-gold)] mt-0.5">•</span>
                                {rec}
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {/* No issues */}
            {analytics.recommendations.length === 0 && analytics.trends.length === 0 && (
                <div className="text-center py-4">
                    <span className="text-3xl">✅</span>
                    <p className="text-sm text-green-400 mt-2">Great balance this week!</p>
                    <p className="text-xs text-gray-500 mt-1">No imbalances or issues detected</p>
                </div>
            )}

            {/* Volume deviation indicator */}
            {Math.abs(analytics.volumeDeviation) > 10 && (
                <div className={`text-xs p-2 rounded ${analytics.volumeDeviation > 0
                    ? 'bg-yellow-500/10 text-yellow-400'
                    : 'bg-blue-500/10 text-blue-400'
                    }`}>
                    📊 Volume {analytics.volumeDeviation > 0 ? 'above' : 'below'} target by {Math.abs(analytics.volumeDeviation).toFixed(0)}%
                </div>
            )}
        </div>
    );
};

export default AIInsightsPanel;
