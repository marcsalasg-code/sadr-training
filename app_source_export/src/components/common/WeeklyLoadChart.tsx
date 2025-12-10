/**
 * WeeklyLoadChart - Comparative weekly load visualization
 * 
 * Shows bar chart comparing current week volume vs previous week
 * Pure CSS implementation (no external dependencies)
 */

import React, { useMemo } from 'react';
import { useSessions } from '../../store/store';

interface WeeklyLoadChartProps {
    athleteId?: string; // If not provided, shows all athletes
    weeksToShow?: number;
    compact?: boolean;
}

interface WeekData {
    label: string;
    volume: number;
    sessions: number;
    isCurrentWeek: boolean;
}

export const WeeklyLoadChart: React.FC<WeeklyLoadChartProps> = ({
    athleteId,
    weeksToShow = 4,
    compact = false,
}) => {
    const sessions = useSessions();

    // Calculate weekly data
    const weeklyData = useMemo((): WeekData[] => {
        const now = new Date();
        const data: WeekData[] = [];

        for (let i = weeksToShow - 1; i >= 0; i--) {
            const weekStart = new Date(now);
            weekStart.setDate(now.getDate() - (i * 7) - now.getDay());
            weekStart.setHours(0, 0, 0, 0);

            const weekEnd = new Date(weekStart);
            weekEnd.setDate(weekStart.getDate() + 7);

            const weekSessions = sessions.filter(s => {
                if (s.status !== 'completed' || !s.completedAt) return false;
                if (athleteId && s.athleteId !== athleteId) return false;
                const date = new Date(s.completedAt);
                return date >= weekStart && date < weekEnd;
            });

            const volume = weekSessions.reduce((sum, s) => sum + (s.totalVolume || 0), 0);

            // Format label
            const label = i === 0
                ? 'This Week'
                : i === 1
                    ? 'Last Week'
                    : `${i} weeks ago`;

            data.push({
                label,
                volume,
                sessions: weekSessions.length,
                isCurrentWeek: i === 0,
            });
        }

        return data;
    }, [sessions, athleteId, weeksToShow]);

    const maxVolume = Math.max(...weeklyData.map(w => w.volume), 1);

    // Calculate week-over-week change
    const currentWeek = weeklyData[weeklyData.length - 1];
    const previousWeek = weeklyData[weeklyData.length - 2];
    const percentChange = previousWeek && previousWeek.volume > 0
        ? Math.round(((currentWeek.volume - previousWeek.volume) / previousWeek.volume) * 100)
        : 0;

    // Compact view
    if (compact) {
        return (
            <div className="flex items-center gap-3">
                <div className="flex items-end gap-1 h-8">
                    {weeklyData.map((week, i) => (
                        <div
                            key={i}
                            className={`w-3 rounded-t transition-all ${week.isCurrentWeek
                                    ? 'bg-[var(--color-accent-gold)]'
                                    : 'bg-[#3A3A3A]'
                                }`}
                            style={{ height: `${Math.max(15, (week.volume / maxVolume) * 100)}%` }}
                            title={`${week.label}: ${(week.volume / 1000).toFixed(1)}K kg`}
                        />
                    ))}
                </div>
                <div className="text-xs">
                    <p className="text-white font-medium">{(currentWeek.volume / 1000).toFixed(1)}K</p>
                    {percentChange !== 0 && (
                        <p className={percentChange > 0 ? 'text-green-400' : 'text-red-400'}>
                            {percentChange > 0 ? '+' : ''}{percentChange}%
                        </p>
                    )}
                </div>
            </div>
        );
    }

    // Full view
    return (
        <div className="p-4 bg-[#0D0D0D] rounded-lg border border-[#1A1A1A]">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Weekly Load
                </h4>
                {percentChange !== 0 && (
                    <span className={`text-xs px-2 py-0.5 rounded ${percentChange > 0
                            ? 'bg-green-500/10 text-green-400'
                            : 'bg-red-500/10 text-red-400'
                        }`}>
                        {percentChange > 0 ? '↑' : '↓'} {Math.abs(percentChange)}% vs last week
                    </span>
                )}
            </div>

            {/* Chart */}
            <div className="flex items-end gap-2 h-24">
                {weeklyData.map((week, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                        {/* Bar */}
                        <div
                            className={`w-full rounded-t transition-all ${week.isCurrentWeek
                                    ? 'bg-gradient-to-t from-[var(--color-accent-gold)] to-[var(--color-accent-beige)]'
                                    : 'bg-[#2A2A2A] hover:bg-[#3A3A3A]'
                                }`}
                            style={{ height: `${Math.max(8, (week.volume / maxVolume) * 100)}%` }}
                            title={`${week.sessions} sessions`}
                        />
                        {/* Label */}
                        <span className={`text-[9px] ${week.isCurrentWeek ? 'text-[var(--color-accent-gold)]' : 'text-gray-500'
                            }`}>
                            {week.label.length > 10 ? week.label.slice(0, 4) : week.label}
                        </span>
                    </div>
                ))}
            </div>

            {/* Stats row */}
            <div className="flex justify-between mt-4 pt-3 border-t border-[#1A1A1A]">
                <div>
                    <p className="text-lg font-bold text-white">
                        {(currentWeek.volume / 1000).toFixed(1)}K
                    </p>
                    <p className="text-[10px] text-gray-500">This Week (kg)</p>
                </div>
                <div className="text-right">
                    <p className="text-lg font-mono text-gray-400">
                        {currentWeek.sessions}
                    </p>
                    <p className="text-[10px] text-gray-500">Sessions</p>
                </div>
            </div>
        </div>
    );
};

export default WeeklyLoadChart;
