/**
 * DayAgendaPanel - Day agenda panel for booking sessions
 * 
 * Opens when clicking on a day cell in WeeklyScheduleWidget.
 * Shows hour slots (06:00-22:00) with Reservar/Crear sesión actions.
 * 
 * ITERATION 2: Real session creation with addSession
 * PHASE 12E: Mobile UX - touch targets (44px min) + scroll containment
 */

import { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Modal } from '../ui/Modal';
import { AuraButton, AuraBadge, AuraEmptyState } from '../ui/aura';
import { useAthletes, useSessions } from '../../store/store';
import { useTrainingStore } from '../../store';
import { useActorScope } from '../../hooks/useActorScope';
import { HOUR_SLOTS, toScheduledDate, formatDisplayDate } from '../scheduling/constants';

// ============================================
// TYPES
// ============================================

interface DayAgendaPanelProps {
    isOpen: boolean;
    onClose: () => void;
    selectedDate: string; // YYYY-MM-DD
    initialAthleteId?: string; // Phase 12D: Pre-select athlete from Calendar filter
    returnPath?: string; // Phase 28B: Contextual return path for athlete flow
}

// ============================================
// COMPONENT
// ============================================

export function DayAgendaPanel({ isOpen, onClose, selectedDate, initialAthleteId, returnPath }: DayAgendaPanelProps) {
    const navigate = useNavigate();
    const athletes = useAthletes();
    const sessions = useSessions();
    const addSession = useTrainingStore(state => state.addSession);

    // Phase 18: Actor scope for athlete data isolation
    const { isAthlete, actorAthleteId } = useActorScope();

    // State
    const [selectedAthleteId, setSelectedAthleteId] = useState<string>('');
    const [selectedTime, setSelectedTime] = useState<string | null>(null);
    const [pendingAction, setPendingAction] = useState<'reserve' | 'create' | null>(null);
    const [showDuplicateWarning, setShowDuplicateWarning] = useState(false);

    // Reset state when panel closes
    useEffect(() => {
        if (!isOpen) {
            setSelectedTime(null);
            setPendingAction(null);
            setShowDuplicateWarning(false);
        }
    }, [isOpen]);

    // Phase 18: Force athlete ID for athlete role
    useEffect(() => {
        if (isAthlete && actorAthleteId) {
            setSelectedAthleteId(actorAthleteId);
        } else if (isOpen && initialAthleteId && !selectedAthleteId) {
            // Phase 12D: Pre-select for coach from Calendar filter
            setSelectedAthleteId(initialAthleteId);
        }
    }, [isOpen, initialAthleteId, selectedAthleteId, isAthlete, actorAthleteId]);

    // Active athletes only
    const activeAthletes = useMemo(() =>
        athletes.filter(a => a.isActive),
        [athletes]
    );

    // Sessions for this day
    const daySessions = useMemo(() =>
        sessions.filter(s => s.scheduledDate?.startsWith(selectedDate)),
        [sessions, selectedDate]
    );

    // Check for duplicate session
    const checkDuplicate = useCallback((time: string, athleteId: string): boolean => {
        if (!athleteId) return false;
        const scheduledPrefix = `${selectedDate}T${time}`;
        return daySessions.some(s =>
            s.athleteId === athleteId &&
            s.scheduledDate?.startsWith(scheduledPrefix)
        );
    }, [daySessions, selectedDate]);

    // Get athlete name
    const getAthleteName = useCallback((athleteId: string): string => {
        const athlete = athletes.find(a => a.id === athleteId);
        return athlete?.name || 'Atleta';
    }, [athletes]);

    // Handle slot action (reserve or create)
    const handleSlotAction = (time: string, action: 'reserve' | 'create') => {
        if (!selectedAthleteId) {
            // Require athlete selection
            setSelectedTime(time);
            return;
        }

        // Check for duplicate
        if (checkDuplicate(time, selectedAthleteId)) {
            setSelectedTime(time);
            setPendingAction(action);
            setShowDuplicateWarning(true);
            return;
        }

        // Proceed with action
        executeAction(time, selectedAthleteId, action);
    };

    // Execute the actual session creation
    const executeAction = (time: string, athleteId: string, action: 'reserve' | 'create') => {
        const scheduledDate = toScheduledDate(selectedDate, time);
        const athleteName = getAthleteName(athleteId);

        // Create session
        const newSession = addSession({
            athleteId,
            name: action === 'reserve'
                ? `Reserva - ${athleteName} - ${time}`
                : `Sesión - ${athleteName} - ${time}`,
            status: action === 'reserve' ? 'reserved' : 'planned',
            scheduledDate,
            exercises: [],
        });

        // Reset state
        setShowDuplicateWarning(false);
        setPendingAction(null);
        setSelectedTime(null);

        if (action === 'create') {
            // Phase 28B: Navigate to session editor with contextual returnPath
            onClose();
            const returnParam = returnPath ? `&returnPath=${encodeURIComponent(returnPath)}` : '';
            navigate(`/planning?tab=sessions&sessionId=${newSession.id}&mode=edit${returnParam}`);
        } else {
            // For reserve, just close and show feedback
            onClose();
        }
    };

    // Handle duplicate confirmation
    const handleDuplicateConfirm = () => {
        if (selectedTime && selectedAthleteId && pendingAction) {
            executeAction(selectedTime, selectedAthleteId, pendingAction);
        }
    };

    // Handle navigate to create athlete
    const handleCreateAthlete = () => {
        onClose();
        navigate('/athletes');
    };

    // Get sessions for a specific time slot
    const getSlotSessions = (time: string) => {
        const scheduledPrefix = `${selectedDate}T${time}`;
        return daySessions.filter(s => s.scheduledDate?.startsWith(scheduledPrefix));
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={`📅 ${formatDisplayDate(selectedDate)}`}
            size="lg"
            fullScreenOnMobile
            disableContentScroll // Phase 14A: Delegate scroll to child
        >
            {/* Phase 14A: Flex container, h-full for proper scroll delegation */}
            <div className="flex flex-col h-full min-h-0">
                {/* Athlete Selector - Phase 14A: Fixed header, shrink-0 */}
                <div className="shrink-0 space-y-2">
                    <label className="text-xs text-gray-400 uppercase tracking-wider">
                        Atleta <span className="text-red-400">*</span>
                    </label>

                    {activeAthletes.length === 0 ? (
                        <AuraEmptyState
                            icon="👤"
                            title="No hay atletas"
                            description="Crea un atleta para comenzar a programar sesiones."
                            size="sm"
                            action={{
                                label: "+ Crear atleta",
                                onClick: handleCreateAthlete,
                            }}
                        />
                    ) : isAthlete ? (
                        /* Phase 18: Show fixed athlete for athlete role */
                        <div className="w-full px-3 py-3 min-h-[44px] bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg text-white text-sm">
                            👤 {activeAthletes.find(a => a.id === actorAthleteId)?.name || 'Mi cuenta'}
                        </div>
                    ) : (
                        <select
                            value={selectedAthleteId}
                            onChange={(e) => setSelectedAthleteId(e.target.value)}
                            className="w-full px-3 py-3 min-h-[44px] bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg text-white text-sm focus:outline-none focus:border-[#C5A572]"
                        >
                            <option value="">Seleccionar atleta...</option>
                            {activeAthletes.map(athlete => (
                                <option key={athlete.id} value={athlete.id}>
                                    {athlete.name}
                                </option>
                            ))}
                        </select>
                    )}
                </div>

                {/* Validation message */}
                {!selectedAthleteId && selectedTime && (
                    <div className="shrink-0 p-3 rounded-lg bg-amber-900/20 border border-amber-700/50 text-amber-300 text-sm">
                        ⚠️ Selecciona un atleta para continuar.
                    </div>
                )}

                {/* Duplicate Warning */}
                {showDuplicateWarning && (
                    <div className="shrink-0 p-4 rounded-lg bg-amber-900/30 border border-amber-600 text-amber-200 text-sm space-y-3">
                        <div className="flex items-start gap-2">
                            <span className="text-amber-400">⚠️</span>
                            <div>
                                <p className="font-medium">Ya existe una sesión para este atleta a las {selectedTime}.</p>
                                <p className="mt-1 text-amber-300/80">¿Deseas crear otra sesión de todos modos?</p>
                            </div>
                        </div>
                        <div className="flex gap-2 justify-end">
                            <AuraButton
                                variant="secondary"
                                size="md"
                                onClick={() => setShowDuplicateWarning(false)}
                                className="min-h-[44px]"
                            >
                                Cancelar
                            </AuraButton>
                            <AuraButton
                                variant="gold"
                                size="md"
                                onClick={handleDuplicateConfirm}
                                className="min-h-[44px]"
                            >
                                Sí, continuar
                            </AuraButton>
                        </div>
                    </div>
                )}

                {/* Hour Slots - Phase 14A: Single scroll owner */}
                <div className="flex-1 flex flex-col min-h-0">
                    <label className="text-xs text-gray-400 uppercase tracking-wider shrink-0 pb-2">
                        Horario
                    </label>

                    {/* Single scroll owner with overscroll-contain */}
                    <div className="flex-1 overflow-y-auto overscroll-contain space-y-2 -mx-4 px-4">
                        {HOUR_SLOTS.map(slot => {
                            const slotSessions = getSlotSessions(slot.time);
                            const hasSession = slotSessions.length > 0;

                            return (
                                <div
                                    key={slot.time}
                                    className={`
                                        flex flex-col gap-2 p-3 rounded-lg border transition-all
                                        md:flex-row md:items-center md:justify-between
                                        ${selectedTime === slot.time
                                            ? 'bg-[#C5A572]/10 border-[#C5A572]'
                                            : hasSession
                                                ? 'bg-[#1A1A1A] border-[#333]'
                                                : 'bg-[#141414] border-[#2A2A2A] hover:border-[#444]'
                                        }
                                    `}
                                >
                                    <div className="flex items-center gap-3 flex-wrap">
                                        <span className="font-mono text-white text-sm w-14">
                                            {slot.label}
                                        </span>
                                        {/* Session badges - PHASE 12E: min-h-11 for 44px touch target */}
                                        {slotSessions.map(s => (
                                            <button
                                                key={s.id}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onClose();
                                                    // Phase 28B: Include returnPath for contextual back
                                                    const returnParam = returnPath ? `&returnPath=${encodeURIComponent(returnPath)}` : '';
                                                    navigate(`/planning?tab=sessions&sessionId=${s.id}&mode=edit${returnParam}`);
                                                }}
                                                className="min-h-11 px-3 py-2 rounded-lg bg-[#1A1A1A] border border-[#333] hover:border-[#C5A572] transition-all flex items-center gap-2"
                                                title={`Editar: ${s.name}`}
                                            >
                                                <span>{s.status === 'reserved' ? '📌' : '📋'}</span>
                                                <span className="text-sm text-white truncate max-w-[120px]">
                                                    {getAthleteName(s.athleteId)}
                                                </span>
                                            </button>
                                        ))}
                                    </div>

                                    {/* CTA Buttons - PHASE 12E: min-h-11 for 44px touch target */}
                                    <div className="flex items-center gap-3 w-full md:w-auto mt-2 md:mt-0">
                                        <AuraButton
                                            variant="secondary"
                                            size="md"
                                            onClick={() => handleSlotAction(slot.time, 'reserve')}
                                            disabled={!selectedAthleteId}
                                            className="flex-1 md:flex-none min-h-11 px-4"
                                        >
                                            Reservar
                                        </AuraButton>
                                        <AuraButton
                                            variant="gold"
                                            size="md"
                                            onClick={() => handleSlotAction(slot.time, 'create')}
                                            disabled={!selectedAthleteId}
                                            className="flex-1 md:flex-none min-h-11 px-4"
                                        >
                                            Crear sesión
                                        </AuraButton>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Selected info - Phase 14A: shrink-0 */}
                {selectedAthleteId && (
                    <div className="shrink-0 pt-3 border-t border-[#2A2A2A] text-xs text-gray-500">
                        <AuraBadge variant="default">
                            👤 {activeAthletes.find(a => a.id === selectedAthleteId)?.name}
                        </AuraBadge>
                    </div>
                )}

                {/* Day summary - Phase 14A: shrink-0 */}
                {daySessions.length > 0 && (
                    <div className="shrink-0 pt-3 border-t border-[#2A2A2A] text-xs text-gray-500">
                        {daySessions.length} sesión(es) programada(s) para este día
                    </div>
                )}
            </div>
        </Modal>
    );
}

export default DayAgendaPanel;
