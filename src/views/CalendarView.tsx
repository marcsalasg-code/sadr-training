/**
 * CalendarView - Vista de calendario mensual interactivo
 * Muestra sesiones reales, permite filtrar por atleta y crear sesiones
 * Rediseñado con UI Aura
 * 
 * REFACTORED: Usa useCalendarView hook para toda la lógica de negocio (Phase 5)
 */

import { Modal, Input, Select } from '../components/ui';
import {
    AuraSection,
    AuraPanel,
    AuraButton,
    AuraBadge,
    AuraListItem,
    AuraDivider,
    AuraEmptyState,
} from '../components/ui/aura';
import { DayAgenda } from '../components/calendar';
import { useCalendarView } from '../hooks';
import { getDayPlanFor } from '../utils';

export function CalendarView() {
    const {
        // Navigation
        year,
        month,
        prevMonth,
        nextMonth,
        monthNames,
        weekDays,

        // Calendar data
        calendarDays,
        sessionsByDate,

        // Filtering
        selectedAthleteId,
        setSelectedAthleteId,
        athleteOptions,
        athleteOptionsForCreate,
        templateOptions,

        // Day expansion
        expandedDate,
        setExpandedDate,
        handleDayClick,

        // Modal state
        selectedDate,
        showCreateForm,
        newSessionName,
        newSessionAthleteId,
        newSessionTemplateId,
        setNewSessionName,
        setNewSessionAthleteId,
        setNewSessionTemplateId,

        // Handlers
        handleOpenCreateModal,
        handleCloseModal,
        handleCreateSession,
        getSessionAction,

        // Training plan context
        activePlan,
        weeklyAdherence,
        isTrainingDayForDate,
        getDayPlanForDate,

        // Utilities
        isToday,
        formatDateKey,
        formatModalDate,
        selectedDaySessions,
        sessionTypeIcons,
        statusConfig,
        getAthlete,
    } = useCalendarView();

    return (
        <div className="p-8 space-y-6 max-w-6xl mx-auto">
            {/* Header */}
            <AuraSection
                title="Schedule"
                action={
                    <div className="flex items-center gap-3">
                        {/* Athlete Filter */}
                        <Select
                            value={selectedAthleteId}
                            onChange={(e) => setSelectedAthleteId(e.target.value)}
                            options={athleteOptions}
                            className="w-48"
                        />
                        {/* Month Navigation */}
                        <div className="flex items-center gap-1 bg-[#141414] p-1 rounded border border-[#2A2A2A]">
                            <AuraButton variant="ghost" size="sm" onClick={prevMonth}>
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                </svg>
                            </AuraButton>
                            <span className="text-xs font-mono px-3 py-1 text-gray-400">
                                {monthNames[month].toUpperCase()} {year}
                            </span>
                            <AuraButton variant="ghost" size="sm" onClick={nextMonth}>
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </AuraButton>
                        </div>
                    </div>
                }
            >
                {/* Weekly Adherence Bar (when plan active) */}
                {activePlan && (
                    <div className="flex items-center gap-4 mt-4 p-3 rounded-lg bg-[#0F0F0F] border border-[#2A2A2A]">
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500">Weekly Progress</span>
                            <span className="text-sm font-mono text-[var(--color-accent-gold)]">
                                {weeklyAdherence.completed}/{weeklyAdherence.planned}
                            </span>
                        </div>
                        <div className="flex-1 h-2 bg-[#222] rounded-full overflow-hidden">
                            <div
                                className="h-full bg-[var(--color-accent-gold)] transition-all"
                                style={{ width: `${weeklyAdherence.percentage}%` }}
                            />
                        </div>
                        <span className={`text-xs font-mono ${weeklyAdherence.percentage >= 80 ? 'text-green-400' :
                            weeklyAdherence.percentage >= 50 ? 'text-yellow-400' : 'text-red-400'
                            }`}>
                            {weeklyAdherence.percentage}%
                        </span>
                    </div>
                )}
            </AuraSection>

            {/* Calendar Grid */}
            <div className="border border-[#2A2A2A] rounded-lg overflow-hidden bg-[#0F0F0F]">
                {/* Week Days Header */}
                <div className="grid grid-cols-7 border-b border-[#2A2A2A] bg-[#141414]">
                    {weekDays.map((day, i) => (
                        <div
                            key={day}
                            className={`p-3 text-center text-[10px] font-mono ${i === 5 ? 'text-[var(--color-accent-gold)]' : 'text-gray-500'}`}
                        >
                            {day}
                        </div>
                    ))}
                </div>

                {/* Days Grid */}
                <div className="grid grid-cols-7">
                    {calendarDays.map(({ date, isCurrentMonth }, index) => {
                        if (!date) return <div key={index} className="p-2 min-h-[120px]" />;
                        const dateKey = formatDateKey(date);
                        const daySessions = sessionsByDate[dateKey] || [];
                        const isTodayDate = isToday(date);
                        const isTrainingDayForThisDate = isTrainingDayForDate(date);
                        const dayPlan = getDayPlanForDate(date);

                        const hasPlanned = daySessions.some(s => s.status === 'planned');
                        const hasReserved = daySessions.some(s => s.status === 'reserved');
                        const hasInProgress = daySessions.some(s => s.status === 'in_progress');
                        const hasCompleted = daySessions.some(s => s.status === 'completed');

                        return (
                            <div
                                key={index}
                                onClick={() => handleDayClick(date)}
                                className={`
                                    p-2 min-h-[120px] border-r border-b border-[#2A2A2A]
                                    cursor-pointer transition-colors group
                                    ${!isCurrentMonth ? 'opacity-40' : 'hover:bg-[#1A1A1A]'}
                                    ${isTodayDate ? 'bg-[rgba(212,194,154,0.05)]' : ''}
                                    ${isTrainingDayForThisDate && isCurrentMonth ? 'border-l-2 border-l-[var(--color-accent-gold)]' : ''}
                                `}
                                title={dayPlan ? `Training: ${dayPlan.sessionType} (${dayPlan.intensity || 'moderate'})` : undefined}
                            >
                                {/* Day Number */}
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-1">
                                        <span className={`
                                            text-xs font-mono
                                            ${isTodayDate ? 'text-[var(--color-accent-gold)] font-bold' : 'text-gray-500'}
                                        `}>
                                            {String(date.getDate()).padStart(2, '0')}
                                        </span>
                                        {/* Training Day Indicator with session type icon */}
                                        {isTrainingDayForThisDate && isCurrentMonth && daySessions.length === 0 && dayPlan && (
                                            <span className="text-sm" title={`${dayPlan.sessionType} - ${dayPlan.intensity}`}>
                                                {sessionTypeIcons[dayPlan.sessionType] || '💪'}
                                            </span>
                                        )}
                                        {isTrainingDayForThisDate && isCurrentMonth && daySessions.length === 0 && !dayPlan && (
                                            <span className="text-[8px] text-[var(--color-accent-gold)] opacity-60">●</span>
                                        )}
                                    </div>
                                    {/* Status Indicators */}
                                    {daySessions.length > 0 && (
                                        <div className="flex gap-1">
                                            {hasInProgress && <div className="w-1.5 h-1.5 rounded-full bg-[var(--color-accent-gold)] animate-pulse" />}
                                            {hasCompleted && <div className="w-1.5 h-1.5 rounded-full bg-green-500" />}
                                            {hasReserved && <div className="w-1.5 h-1.5 rounded-full bg-purple-500" />}
                                            {hasPlanned && <div className="w-1.5 h-1.5 rounded-full bg-gray-500" />}
                                        </div>
                                    )}
                                </div>

                                {/* Session Cards */}
                                <div className="space-y-1">
                                    {daySessions.slice(0, 2).map(session => (
                                        <button
                                            key={session.id}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                getSessionAction(session).onClick();
                                            }}
                                            className={`
                                                w-full text-left text-[9px] p-1.5 rounded truncate
                                                transition-colors
                                                ${session.status === 'completed'
                                                    ? 'bg-[#1A1A1A] border-l-2 border-green-500 text-white'
                                                    : session.status === 'in_progress'
                                                        ? 'bg-[var(--color-accent-gold)] text-black font-bold'
                                                        : session.status === 'cancelled'
                                                            ? 'border border-dashed border-[#333] text-gray-500 opacity-50'
                                                            : session.status === 'reserved'
                                                                ? 'border border-dashed border-purple-500/50 text-purple-400 bg-purple-900/10'
                                                                : 'border border-dashed border-[#333] text-gray-400'
                                                }
                                            `}
                                        >
                                            <span className="flex items-center gap-1">
                                                {session.name}
                                                {/* Origin Badge */}
                                                {session.origin === 'plan' && (
                                                    <span className="text-[7px] px-1 py-0.5 rounded bg-[var(--color-accent-gold)]/20 text-[var(--color-accent-gold)]" title="Desde Plan">P</span>
                                                )}
                                                {session.origin === 'ai_suggestion' && (
                                                    <span className="text-[7px] px-1 py-0.5 rounded bg-purple-500/20 text-purple-400" title="Sugerencia IA">IA</span>
                                                )}
                                            </span>
                                            {session.status === 'completed' && (
                                                <span className="flex items-center gap-1">
                                                    <span className="text-[8px] text-green-500">Completed</span>
                                                    {session.avgIntensity != null && (
                                                        <span className="text-[8px] text-[var(--color-accent-gold)]" title={`Intensidad: ${session.avgIntensity.toFixed(1)}/10`}>
                                                            ⚡{session.avgIntensity.toFixed(0)}
                                                        </span>
                                                    )}
                                                </span>
                                            )}
                                            {isTodayDate && session.status === 'planned' && (
                                                <span className="block text-[8px] opacity-80">Today</span>
                                            )}
                                        </button>
                                    ))}
                                    {daySessions.length > 2 && (
                                        <p className="text-[9px] text-gray-600">+{daySessions.length - 2} more</p>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Legend */}
            <div className="flex items-center gap-6 text-xs text-gray-500">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-[#1A1A1A] border-l-2 border-green-500" />
                    <span>Completed</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-[var(--color-accent-gold)]" />
                    <span>In Progress</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded border border-dashed border-[#333]" />
                    <span>Planned</span>
                </div>
            </div>

            {/* Day Agenda (expandible al hacer clic en un día) */}
            {expandedDate && (
                <DayAgenda
                    date={expandedDate}
                    sessions={sessionsByDate[formatDateKey(expandedDate)] || []}
                    onClose={() => setExpandedDate(null)}
                    onCreateSession={(hour) => handleOpenCreateModal(expandedDate, hour)}
                    onGoToSession={(sessionId) => getSessionAction({ id: sessionId } as any).onClick()}
                />
            )}

            {/* Day Modal */}
            <Modal
                isOpen={!!selectedDate}
                onClose={handleCloseModal}
                title={selectedDate ? formatModalDate(selectedDate) : ''}
                size="md"
            >
                <div className="space-y-4">
                    {/* Quick Start from Plan (if training day with no sessions) */}
                    {selectedDate && activePlan && getDayPlanFor(selectedDate, activePlan) && selectedDaySessions.length === 0 && (
                        <div className="p-3 rounded-lg bg-[var(--color-accent-gold)]/10 border border-[var(--color-accent-gold)]/30">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-[var(--color-accent-gold)]">
                                        {sessionTypeIcons[getDayPlanFor(selectedDate, activePlan)?.sessionType || ''] || '💪'} Training Day
                                    </p>
                                    <p className="text-xs text-gray-400">
                                        {getDayPlanFor(selectedDate, activePlan)?.sessionType} • {getDayPlanFor(selectedDate, activePlan)?.intensity || 'moderate'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Sessions List */}
                    {selectedDaySessions.length > 0 ? (
                        <div className="space-y-2">
                            <h4 className="text-xs font-mono text-gray-500 uppercase tracking-widest">
                                Sessions ({selectedDaySessions.length})
                            </h4>
                            <div className="space-y-2">
                                {selectedDaySessions.map(session => {
                                    const athlete = getAthlete(session.athleteId);
                                    const action = getSessionAction(session);
                                    const status = statusConfig[session.status];

                                    return (
                                        <AuraListItem
                                            key={session.id}
                                            title={session.name}
                                            subtitle={selectedAthleteId === 'all' && athlete ? athlete.name : undefined}
                                            rightContent={
                                                <div className="flex items-center gap-2">
                                                    <AuraBadge variant={status.variant} size="sm">
                                                        {status.label}
                                                    </AuraBadge>
                                                    <AuraButton size="sm" onClick={action.onClick}>
                                                        {action.label}
                                                    </AuraButton>
                                                </div>
                                            }
                                        />
                                    );
                                })}
                            </div>
                        </div>
                    ) : (
                        <AuraEmptyState
                            icon="📅"
                            title="No sessions scheduled"
                            description="Click below to schedule a session for this day."
                            size="sm"
                        />
                    )}

                    <AuraDivider />

                    {/* Create Session Form */}
                    {!showCreateForm ? (
                        <AuraButton
                            variant="ghost"
                            fullWidth
                            onClick={() => setNewSessionName('')}
                            icon={
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                            }
                        >
                            Create new session
                        </AuraButton>
                    ) : (
                        <AuraPanel variant="default">
                            <div className="space-y-3">
                                <h4 className="text-sm font-medium text-white">New Session</h4>
                                <Input
                                    placeholder="Session name *"
                                    value={newSessionName}
                                    onChange={(e) => setNewSessionName(e.target.value)}
                                />
                                <Select
                                    value={newSessionAthleteId}
                                    onChange={(e) => setNewSessionAthleteId(e.target.value)}
                                    options={athleteOptionsForCreate}
                                />
                                <Select
                                    value={newSessionTemplateId}
                                    onChange={(e) => setNewSessionTemplateId(e.target.value)}
                                    options={templateOptions}
                                />
                                <p className="text-[10px] text-gray-500 font-mono">
                                    Date: {selectedDate ? formatModalDate(selectedDate) : ''}
                                </p>
                                <div className="flex gap-2 pt-2">
                                    <AuraButton
                                        variant="ghost"
                                        size="sm"
                                        onClick={handleCloseModal}
                                    >
                                        Cancel
                                    </AuraButton>
                                    <AuraButton
                                        variant="gold"
                                        size="sm"
                                        onClick={handleCreateSession}
                                        disabled={!newSessionName.trim() || !newSessionAthleteId}
                                    >
                                        Create Session
                                    </AuraButton>
                                </div>
                            </div>
                        </AuraPanel>
                    )}
                </div>
            </Modal>
        </div>
    );
}
