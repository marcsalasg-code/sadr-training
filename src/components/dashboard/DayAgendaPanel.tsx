/**
 * DayAgendaPanel - Day agenda panel for booking sessions
 * 
 * Opens when clicking on a day cell in WeeklyScheduleWidget.
 * Shows hour slots (06:00-22:00) with Reservar/Crear sesión actions.
 * 
 * ITERATION 2: Real session creation with addSession
 */

import { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Modal } from '../ui/Modal';
import { AuraButton, AuraBadge, AuraEmptyState } from '../ui/aura';
import { useAthletes, useSessions } from '../../store/store';
import { useTrainingStore } from '../../store';
import { HOUR_SLOTS, toScheduledDate, formatDisplayDate } from '../scheduling/constants';

// ============================================
// TYPES
// ============================================

interface DayAgendaPanelProps {
    isOpen: boolean;
    onClose: () => void;
    selectedDate: string; // YYYY-MM-DD
    initialAthleteId?: string; // Phase 12D: Pre-select athlete from Calendar filter
}

// ============================================
// COMPONENT
// ============================================

export function DayAgendaPanel({ isOpen, onClose, selectedDate, initialAthleteId }: DayAgendaPanelProps) {
    const navigate = useNavigate();
    const athletes = useAthletes();
    const sessions = useSessions();
    const addSession = useTrainingStore(state => state.addSession);

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

    // Phase 12D: Pre-select athlete from Calendar filter when opening
    useEffect(() => {
        if (isOpen && initialAthleteId && !selectedAthleteId) {
            setSelectedAthleteId(initialAthleteId);
        }
    }, [isOpen, initialAthleteId, selectedAthleteId]);

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
            // Navigate to planning with sessionId in edit mode
            onClose();
            navigate(`/planning?tab=sessions&sessionId=${newSession.id}&mode=edit`);
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
        >
            <div className="space-y-4">
                {/* Athlete Selector */}
                <div className="space-y-2">
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
                    ) : (
                        <select
                            value={selectedAthleteId}
                            onChange={(e) => setSelectedAthleteId(e.target.value)}
                            className="w-full px-3 py-2 bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg text-white text-sm focus:outline-none focus:border-[#C5A572]"
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
                    <div className="p-3 rounded-lg bg-amber-900/20 border border-amber-700/50 text-amber-300 text-sm">
                        ⚠️ Selecciona un atleta para continuar.
                    </div>
                )}

                {/* Duplicate Warning */}
                {showDuplicateWarning && (
                    <div className="p-4 rounded-lg bg-amber-900/30 border border-amber-600 text-amber-200 text-sm space-y-3">
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
                                size="sm"
                                onClick={() => setShowDuplicateWarning(false)}
                            >
                                Cancelar
                            </AuraButton>
                            <AuraButton
                                variant="gold"
                                size="sm"
                                onClick={handleDuplicateConfirm}
                            >
                                Sí, continuar
                            </AuraButton>
                        </div>
                    </div>
                )}

                {/* Hour Slots */}
                <div className="space-y-2 flex-1 flex flex-col min-h-0">
                    <label className="text-xs text-gray-400 uppercase tracking-wider shrink-0">
                        Horario
                    </label>

                    <div className="flex-1 overflow-y-auto space-y-1 pr-2 md:max-h-[400px] md:flex-none">
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
                                        {slotSessions.map(s => (
                                            <button
                                                key={s.id}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onClose();
                                                    navigate(`/planning?tab=sessions&sessionId=${s.id}&mode=edit`);
                                                }}
                                                className="cursor-pointer hover:scale-105 transition-transform"
                                                title={`Editar: ${s.name}`}
                                            >
                                                <AuraBadge
                                                    variant={s.status === 'reserved' ? 'default' : 'gold'}
                                                >
                                                    {s.status === 'reserved' ? '📌' : '📋'} {getAthleteName(s.athleteId)}
                                                </AuraBadge>
                                            </button>
                                        ))}
                                    </div>

                                    <div className="flex items-center gap-2 w-full md:w-auto">
                                        <AuraButton
                                            variant="secondary"
                                            size="sm"
                                            onClick={() => handleSlotAction(slot.time, 'reserve')}
                                            disabled={!selectedAthleteId}
                                            className="flex-1 md:flex-none"
                                        >
                                            Reservar
                                        </AuraButton>
                                        <AuraButton
                                            variant="gold"
                                            size="sm"
                                            onClick={() => handleSlotAction(slot.time, 'create')}
                                            disabled={!selectedAthleteId}
                                            className="flex-1 md:flex-none"
                                        >
                                            Crear sesión
                                        </AuraButton>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Selected info */}
                {selectedAthleteId && (
                    <div className="pt-3 border-t border-[#2A2A2A] text-xs text-gray-500">
                        <AuraBadge variant="default">
                            👤 {activeAthletes.find(a => a.id === selectedAthleteId)?.name}
                        </AuraBadge>
                    </div>
                )}

                {/* Day summary */}
                {daySessions.length > 0 && (
                    <div className="pt-3 border-t border-[#2A2A2A] text-xs text-gray-500">
                        {daySessions.length} sesión(es) programada(s) para este día
                    </div>
                )}
            </div>
        </Modal>
    );
}

export default DayAgendaPanel;
