/**
 * WeeklyScheduleWidget - Weekly coach hub for Dashboard
 * 
 * Shows the current week (Mon-Sun) with sessions for each day.
 * Allows quick navigation to calendar and starting sessions.
 */

import { useState } from 'react';
import {
    AuraPanel,
    AuraButton,
    AuraBadge,
    AuraCard,
} from '../ui/aura';
import { useWeeklySchedule } from '../../hooks/useWeeklySchedule';
import type { WeekDay, SessionSummary } from '../../hooks/useWeeklySchedule';

// ============================================
// SUB-COMPONENTS
// ============================================

interface DayCardProps {
    day: WeekDay;
    isExpanded: boolean;
    onExpand: () => void;
    onStartSession: (sessionId: string) => void;
    onCreateSession: (date: string) => void;
}

function DayCard({ day, isExpanded, onExpand, onStartSession, onCreateSession }: DayCardProps) {
    const hasScheduled = day.sessions.some(s => s.status === 'planned');
    const hasInProgress = day.sessions.some(s => s.status === 'in_progress');
    const hasCompleted = day.sessions.some(s => s.status === 'completed');

    // Status indicator color
    const getStatusColor = () => {
        if (hasInProgress) return 'bg-[var(--color-accent-gold)]';
        if (hasScheduled) return 'bg-blue-500';
        if (hasCompleted) return 'bg-green-500';
        if (day.isTrainingDay && !day.isPast) return 'bg-gray-600';
        return 'bg-transparent';
    };

    return (
        <div className="flex flex-col">
            {/* Day Card */}
            <button
                onClick={onExpand}
                className={`
                    relative flex flex-col items-center p-3 rounded-lg border transition-all
                    ${day.isToday
                        ? 'bg-[var(--color-accent-gold)]/10 border-[var(--color-accent-gold)] ring-1 ring-[var(--color-accent-gold)]/30'
                        : 'bg-[#141414] border-[#2A2A2A] hover:border-[#444]'
                    }
                    ${day.isPast && !day.isToday ? 'opacity-60' : ''}
                    ${isExpanded ? 'ring-2 ring-[var(--color-accent-gold)]/50' : ''}
                `}
            >
                {/* Day name */}
                <span className={`text-[10px] uppercase tracking-wider ${day.isToday ? 'text-[var(--color-accent-gold)]' : 'text-gray-500'}`}>
                    {day.dayName}
                </span>

                {/* Day number */}
                <span className={`text-lg font-mono ${day.isToday ? 'text-white font-bold' : 'text-gray-300'}`}>
                    {day.dayNumber}
                </span>

                {/* Session count / status */}
                {day.sessions.length > 0 ? (
                    <div className="flex items-center gap-1 mt-1">
                        <div className={`w-2 h-2 rounded-full ${getStatusColor()}`} />
                        <span className="text-[10px] text-gray-400">{day.sessions.length}</span>
                    </div>
                ) : day.isTrainingDay && !day.isPast ? (
                    <div className="mt-1">
                        <span className="text-[10px] text-gray-500">📅</span>
                    </div>
                ) : (
                    <div className="mt-1 h-4" /> // Spacer for alignment
                )}
            </button>

            {/* Expanded sessions */}
            {isExpanded && (
                <div className="mt-2 p-2 bg-[#1A1A1A] rounded-lg border border-[#2A2A2A] space-y-2 min-w-[200px]">
                    {day.sessions.length > 0 ? (
                        day.sessions.map(session => (
                            <SessionRow
                                key={session.id}
                                session={session}
                                onStart={() => onStartSession(session.id)}
                            />
                        ))
                    ) : (
                        <div className="text-center py-2">
                            <p className="text-xs text-gray-500 mb-2">No sessions</p>
                            {!day.isPast && (
                                <AuraButton
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => onCreateSession(day.date)}
                                >
                                    + Add Session
                                </AuraButton>
                            )}
                        </div>
                    )}
                    {day.sessions.length > 0 && !day.isPast && (
                        <AuraButton
                            variant="ghost"
                            size="sm"
                            fullWidth
                            onClick={() => onCreateSession(day.date)}
                        >
                            + Add Another
                        </AuraButton>
                    )}
                </div>
            )}
        </div>
    );
}

interface SessionRowProps {
    session: SessionSummary;
    onStart: () => void;
}

function SessionRow({ session, onStart }: SessionRowProps) {
    const statusConfig = {
        planned: { label: 'Planned', variant: 'default' as const, action: 'Start' },
        in_progress: { label: 'In Progress', variant: 'gold' as const, action: 'Continue' },
        completed: { label: 'Done', variant: 'success' as const, action: 'View' },
        cancelled: { label: 'Cancelled', variant: 'error' as const, action: 'View' },
    };

    const config = statusConfig[session.status] || statusConfig.planned;

    return (
        <div className="flex items-center justify-between gap-2 p-2 bg-[#0D0D0D] rounded">
            <div className="flex-1 min-w-0">
                <p className="text-sm text-white truncate">{session.name}</p>
                <p className="text-[10px] text-gray-500 truncate">{session.athleteName}</p>
            </div>
            <div className="flex items-center gap-2">
                <AuraBadge variant={config.variant} size="sm">
                    {config.label}
                </AuraBadge>
                <AuraButton
                    variant={session.status === 'in_progress' ? 'gold' : 'secondary'}
                    size="sm"
                    onClick={onStart}
                >
                    {config.action}
                </AuraButton>
            </div>
        </div>
    );
}

// ============================================
// MAIN COMPONENT
// ============================================

export function WeeklyScheduleWidget() {
    const {
        weekDays,
        currentWeekLabel,
        gotoFullCalendar,
        createSessionForDate,
        startSession,
    } = useWeeklySchedule();

    const [expandedDay, setExpandedDay] = useState<string | null>(null);

    // Stats
    const totalSessions = weekDays.reduce((sum, d) => sum + d.sessions.length, 0);
    const completedSessions = weekDays.reduce(
        (sum, d) => sum + d.sessions.filter(s => s.status === 'completed').length,
        0
    );
    const inProgressSessions = weekDays.reduce(
        (sum, d) => sum + d.sessions.filter(s => s.status === 'in_progress').length,
        0
    );

    const handleDayClick = (date: string) => {
        setExpandedDay(prev => prev === date ? null : date);
    };

    return (
        <AuraPanel
            header={
                <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-3">
                        <span className="text-white text-sm font-medium">📆 This Week</span>
                        <span className="text-xs text-gray-500 font-mono">{currentWeekLabel}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        {inProgressSessions > 0 && (
                            <AuraBadge variant="gold">
                                {inProgressSessions} in progress
                            </AuraBadge>
                        )}
                        <span className="text-xs text-gray-400">
                            {completedSessions}/{totalSessions} done
                        </span>
                        <AuraButton variant="ghost" size="sm" onClick={gotoFullCalendar}>
                            View Calendar →
                        </AuraButton>
                    </div>
                </div>
            }
        >
            {/* Week Grid */}
            <div className="flex gap-2 overflow-x-auto pb-2">
                {weekDays.map(day => (
                    <DayCard
                        key={day.date}
                        day={day}
                        isExpanded={expandedDay === day.date}
                        onExpand={() => handleDayClick(day.date)}
                        onStartSession={startSession}
                        onCreateSession={createSessionForDate}
                    />
                ))}
            </div>

            {/* Quick tip when no sessions */}
            {totalSessions === 0 && (
                <div className="mt-4 pt-4 border-t border-[#222] text-center">
                    <p className="text-xs text-gray-500">
                        No sessions scheduled this week.{' '}
                        <button
                            onClick={() => createSessionForDate(weekDays.find(d => d.isToday)?.date || weekDays[0].date)}
                            className="text-[var(--color-accent-gold)] hover:underline"
                        >
                            Create one now →
                        </button>
                    </p>
                </div>
            )}
        </AuraPanel>
    );
}

export default WeeklyScheduleWidget;
