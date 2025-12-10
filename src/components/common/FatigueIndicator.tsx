/**
 * FatigueIndicator - Visual indicator of fatigue/overtraining risk
 * 
 * Uses detectOvertraining() from performanceEngine to calculate
 * fatigue level based on volume, intensity, and frequency.
 */

import React, { useMemo } from 'react';
import { detectOvertraining, type OvertrainingIndicator } from '../../ai/performance/performanceEngine';
import { useSessions } from '../../store/store';

interface FatigueIndicatorProps {
    athleteId: string;
    compact?: boolean;
    showDetails?: boolean;
}

// Level styles
const levelStyles: Record<OvertrainingIndicator['level'], {
    bg: string;
    text: string;
    icon: string;
    border: string;
}> = {
    low: {
        bg: 'bg-green-500/10',
        text: 'text-green-400',
        icon: '✓',
        border: 'border-green-500/30',
    },
    moderate: {
        bg: 'bg-yellow-500/10',
        text: 'text-yellow-400',
        icon: '⚡',
        border: 'border-yellow-500/30',
    },
    high: {
        bg: 'bg-orange-500/10',
        text: 'text-orange-400',
        icon: '⚠️',
        border: 'border-orange-500/30',
    },
    critical: {
        bg: 'bg-red-500/10',
        text: 'text-red-400',
        icon: '🔴',
        border: 'border-red-500/30',
    },
};

const levelLabels: Record<OvertrainingIndicator['level'], string> = {
    low: 'Low Fatigue',
    moderate: 'Moderate',
    high: 'High Fatigue',
    critical: 'Critical',
};

export const FatigueIndicator: React.FC<FatigueIndicatorProps> = ({
    athleteId,
    compact = false,
    showDetails = false,
}) => {
    const sessions = useSessions();

    // Calculate fatigue based on recent sessions
    const indicator = useMemo((): OvertrainingIndicator => {
        const now = new Date();

        // Get weekly volumes for last 4 weeks
        const weeklyVolumes: number[] = [];
        for (let i = 3; i >= 0; i--) {
            const weekStart = new Date(now);
            weekStart.setDate(now.getDate() - (i * 7) - now.getDay());
            weekStart.setHours(0, 0, 0, 0);

            const weekEnd = new Date(weekStart);
            weekEnd.setDate(weekStart.getDate() + 7);

            const weekSessions = sessions.filter(s =>
                s.athleteId === athleteId &&
                s.status === 'completed' &&
                s.completedAt &&
                new Date(s.completedAt) >= weekStart &&
                new Date(s.completedAt) < weekEnd
            );

            const volume = weekSessions.reduce((sum, s) => sum + (s.totalVolume || 0), 0);
            weeklyVolumes.push(volume);
        }

        // Get last week's sessions for intensity and frequency
        const lastWeekStart = new Date(now);
        lastWeekStart.setDate(now.getDate() - 7);

        const lastWeekSessions = sessions.filter(s =>
            s.athleteId === athleteId &&
            s.status === 'completed' &&
            s.completedAt &&
            new Date(s.completedAt) >= lastWeekStart
        );

        // Calculate average intensity from RPE/intensity values
        let totalIntensity = 0;
        let intensityCount = 0;
        lastWeekSessions.forEach(s => {
            s.exercises?.forEach(ex => {
                ex.sets.forEach(set => {
                    if (set.isCompleted && (set.rpe || set.intensity)) {
                        totalIntensity += set.rpe || set.intensity || 7;
                        intensityCount++;
                    }
                });
            });
        });

        const avgIntensity = intensityCount > 0 ? totalIntensity / intensityCount : 7;

        return detectOvertraining(
            weeklyVolumes,
            avgIntensity,
            lastWeekSessions.length,
            7 // baseline intensity
        );
    }, [sessions, athleteId]);

    const style = levelStyles[indicator.level];

    // Compact view - just icon and level
    if (compact) {
        return (
            <div
                className={`inline-flex items-center gap-1.5 px-2 py-1 rounded ${style.bg} ${style.text}`}
                title={indicator.recommendation}
            >
                <span>{style.icon}</span>
                <span className="text-xs font-medium">{levelLabels[indicator.level]}</span>
            </div>
        );
    }

    // Full view
    return (
        <div className={`p-4 rounded-lg border ${style.bg} ${style.border}`}>
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <span className="text-lg">{style.icon}</span>
                    <div>
                        <p className={`text-sm font-medium ${style.text}`}>
                            {levelLabels[indicator.level]}
                        </p>
                        <p className="text-xs text-gray-500">Fatigue Score: {indicator.score}/100</p>
                    </div>
                </div>
                {/* Score bar */}
                <div className="w-16 h-2 bg-[#1A1A1A] rounded-full overflow-hidden">
                    <div
                        className={`h-full transition-all ${indicator.level === 'critical' ? 'bg-red-500' :
                                indicator.level === 'high' ? 'bg-orange-500' :
                                    indicator.level === 'moderate' ? 'bg-yellow-500' : 'bg-green-500'
                            }`}
                        style={{ width: `${indicator.score}%` }}
                    />
                </div>
            </div>

            {/* Recommendation */}
            <p className="text-xs text-gray-400 mb-2">
                {indicator.recommendation}
            </p>

            {/* Factors (if showDetails) */}
            {showDetails && indicator.factors.length > 0 && (
                <div className="mt-3 pt-3 border-t border-[#2A2A2A]">
                    <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Contributing Factors</p>
                    <ul className="space-y-1">
                        {indicator.factors.map((factor, i) => (
                            <li key={i} className="text-xs text-gray-400 flex items-start gap-1">
                                <span className="text-gray-600">•</span>
                                {factor}
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};

export default FatigueIndicator;
