/**
 * WeeklyScheduleWidget - Premium Weekly Calendar for Dashboard
 * 
 * Redesigned based on reference image with:
 * - Larger day cells with session badges
 * - Gold accent on today
 * - Session name visible directly on calendar
 * - Click to start session directly
 * - ITERATION 1: Click on day cell opens DayAgendaPanel
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    AuraPanel,
    AuraButton,
    AuraBadge,
} from '../ui/aura';
import { useWeeklySchedule } from '../../hooks/useWeeklySchedule';
import { DayAgendaPanel } from './DayAgendaPanel';
import type { WeekDay, SessionSummary } from '../../hooks/useWeeklySchedule';

// ============================================
// SESSION BADGE COMPONENT
// ============================================

interface SessionBadgeProps {
    session: SessionSummary;
    onClick: () => void;
}

function SessionBadge({ session, onClick }: SessionBadgeProps) {
    const statusColors = {
        reserved: 'bg-purple-900/20 border-purple-500/50 text-purple-400 hover:bg-purple-900/30',
        planned: 'bg-[#C5A572]/20 border-[#C5A572] text-[#C5A572] hover:bg-[#C5A572]/30',
        in_progress: 'bg-[#C5A572] border-[#C5A572] text-black animate-pulse',
        completed: 'bg-green-900/30 border-green-600/50 text-green-400',
        cancelled: 'bg-red-900/20 border-red-500/30 text-red-400/60',
    };

    return (
        <button
            onClick={(e) => { e.stopPropagation(); onClick(); }}
            className={`
                w-full px-2 py-1.5 rounded text-left text-[11px] font-medium
                border transition-all duration-200 truncate
                ${statusColors[session.status] || statusColors.planned}
            `}
            title={`${session.name} - ${session.athleteName}`}
        >
            {session.name}
        </button>
    );
}

// ============================================
// DAY CELL COMPONENT
// ============================================

interface DayCellProps {
    day: WeekDay;
    onStartSession: (sessionId: string) => void;
    onCreateSession: (date: string) => void;
    onDayClick: (date: string) => void;
}

function DayCell({ day, onStartSession, onCreateSession, onDayClick }: DayCellProps) {
    const navigate = useNavigate();
    const hasInProgress = day.sessions.some(s => s.status === 'in_progress');

    const handleSessionClick = (session: SessionSummary) => {
        if (session.status === 'planned') {
            onStartSession(session.id);
        } else {
            navigate(`/sessions/live/${session.id}`);
        }
    };

    // Handle full cell click - opens DayAgendaPanel
    const handleCellClick = () => {
        onDayClick(day.date);
    };

    return (
        <div
            onClick={handleCellClick}
            className={`
                snap-start md:snap-align-none
                relative flex flex-col min-h-[140px] p-3 rounded-xl border transition-all cursor-pointer
                ${day.isToday
                    ? 'bg-gradient-to-b from-[#C5A572]/10 to-[#0A0A0A] border-[#C5A572] shadow-lg shadow-[#C5A572]/10'
                    : 'bg-[#141414] border-[#2A2A2A] hover:border-[#444] hover:bg-[#1A1A1A]'
                }
                ${day.isPast && !day.isToday ? 'opacity-50' : ''}
            `}
        >
            {/* Day Header */}
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                    <span className={`
                        text-xs uppercase tracking-wider font-medium
                        ${day.isToday ? 'text-[#C5A572]' : 'text-gray-500'}
                    `}>
                        {day.dayName}
                    </span>
                    {day.isToday && (
                        <span className="px-1.5 py-0.5 text-[9px] rounded bg-[#C5A572] text-black font-bold">
                            TODAY
                        </span>
                    )}
                </div>
                <span className={`
                    text-2xl font-light font-mono
                    ${day.isToday ? 'text-white' : 'text-gray-400'}
                `}>
                    {day.dayNumber}
                </span>
            </div>

            {/* Sessions List */}
            <div className="flex-1 space-y-1.5">
                {day.sessions.slice(0, 3).map(session => (
                    <SessionBadge
                        key={session.id}
                        session={session}
                        onClick={() => handleSessionClick(session)}
                    />
                ))}

                {day.sessions.length > 3 && (
                    <span
                        className="text-[10px] text-gray-500 pl-1"
                        onClick={(e) => e.stopPropagation()}
                    >
                        +{day.sessions.length - 3} more
                    </span>
                )}
            </div>

            {/* Add Session Button (for empty days) */}
            {day.sessions.length === 0 && !day.isPast && (
                <button
                    onClick={(e) => { e.stopPropagation(); onCreateSession(day.date); }}
                    className="mt-auto py-2 text-xs text-gray-500 hover:text-[#C5A572] transition-colors flex items-center justify-center gap-1"
                >
                    <span className="text-lg leading-none">+</span>
                    <span>Add</span>
                </button>
            )}

            {/* Add more for days with sessions */}
            {day.sessions.length > 0 && !day.isPast && (
                <button
                    onClick={(e) => { e.stopPropagation(); onCreateSession(day.date); }}
                    className="absolute bottom-2 right-2 w-6 h-6 rounded-full bg-[#222] hover:bg-[#333] flex items-center justify-center text-gray-500 hover:text-[#C5A572] transition-all text-sm"
                    title="Add session"
                >
                    +
                </button>
            )}

            {/* In Progress Indicator */}
            {hasInProgress && (
                <div className="absolute top-2 right-2">
                    <div className="w-2 h-2 rounded-full bg-[#C5A572] animate-ping" />
                    <div className="absolute top-0 w-2 h-2 rounded-full bg-[#C5A572]" />
                </div>
            )}
        </div>
    );
}

// ============================================
// MAIN COMPONENT
// ============================================

export function WeeklyScheduleWidget() {
    const navigate = useNavigate();
    const {
        weekDays,
        currentWeekLabel,
        gotoFullCalendar,
        createSessionForDate,
        startSession,
    } = useWeeklySchedule();

    // Day Agenda Panel state (ITERATION 1)
    const [selectedDate, setSelectedDate] = useState<string | null>(null);
    const [showAgendaPanel, setShowAgendaPanel] = useState(false);

    // Handle day cell click - opens DayAgendaPanel
    const handleDayClick = (date: string) => {
        setSelectedDate(date);
        setShowAgendaPanel(true);
    };

    // Close agenda panel
    const handleCloseAgendaPanel = () => {
        setShowAgendaPanel(false);
    };

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
    const plannedSessions = weekDays.reduce(
        (sum, d) => sum + d.sessions.filter(s => s.status === 'planned').length,
        0
    );

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <h2 className="text-xl font-medium text-white">Calendar</h2>
                    <span className="text-sm text-gray-500 font-mono">{currentWeekLabel}</span>
                </div>
                <div className="flex items-center gap-3">
                    {/* Stats Pills */}
                    <div className="flex items-center gap-2 text-xs">
                        {inProgressSessions > 0 && (
                            <span className="px-2 py-1 rounded-full bg-[#C5A572]/20 text-[#C5A572] font-medium">
                                {inProgressSessions} live
                            </span>
                        )}
                        {plannedSessions > 0 && (
                            <span className="px-2 py-1 rounded-full bg-blue-900/30 text-blue-400">
                                {plannedSessions} planned
                            </span>
                        )}
                        <span className="px-2 py-1 rounded-full bg-[#1A1A1A] text-gray-400">
                            {completedSessions}/{totalSessions} done
                        </span>
                    </div>
                    <AuraButton
                        variant="secondary"
                        size="sm"
                        onClick={gotoFullCalendar}
                    >
                        Full Calendar →
                    </AuraButton>
                </div>
            </div>

            {/* Week Grid - Snap scroll on mobile, 7-col grid on desktop */}
            <div
                className="
                    grid gap-2
                    overflow-x-auto pb-2
                    snap-x snap-mandatory
                    grid-flow-col auto-cols-[minmax(200px,1fr)]
                    md:overflow-visible md:pb-0
                    md:snap-none md:grid-flow-row md:auto-cols-auto md:grid-cols-7 md:gap-3
                    -mx-4 px-4 md:mx-0 md:px-0
                "
                aria-label="Calendario semanal"
            >
                {weekDays.map(day => (
                    <DayCell
                        key={day.date}
                        day={day}
                        onStartSession={startSession}
                        onCreateSession={createSessionForDate}
                        onDayClick={handleDayClick}
                    />
                ))}
            </div>

            {/* Empty State */}
            {totalSessions === 0 && (
                <div className="text-center py-8 border border-dashed border-[#2A2A2A] rounded-xl">
                    <p className="text-gray-500 mb-3">No sessions scheduled this week</p>
                    <AuraButton
                        variant="secondary"
                        onClick={() => navigate('/library?tab=templates')}
                    >
                        + Schedule Sessions
                    </AuraButton>
                </div>
            )}

            {/* Day Agenda Panel (ITERATION 1) */}
            {selectedDate && (
                <DayAgendaPanel
                    isOpen={showAgendaPanel}
                    onClose={handleCloseAgendaPanel}
                    selectedDate={selectedDate}
                />
            )}
        </div>
    );
}

export default WeeklyScheduleWidget;
