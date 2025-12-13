/**
 * DayAgendaPanel - Day agenda panel for booking sessions
 * 
 * Opens when clicking on a day cell in WeeklyScheduleWidget.
 * Shows hour slots (06:00-22:00) with Reservar/Crear sesión actions.
 * 
 * ITERATION 1: Stub actions - no addSession, uses navigation with query params
 */

import { useState, useMemo, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Modal } from '../ui/Modal';
import { AuraButton, AuraBadge, AuraEmptyState } from '../ui/aura';
import { useAthletes } from '../../store/store';

// ============================================
// TYPES
// ============================================

interface DayAgendaPanelProps {
    isOpen: boolean;
    onClose: () => void;
    selectedDate: string; // YYYY-MM-DD
}

interface HourSlot {
    time: string; // HH:MM
    label: string; // "06:00"
}

// ============================================
// CONSTANTS
// ============================================

const HOUR_SLOTS: HourSlot[] = Array.from({ length: 17 }, (_, i) => {
    const hour = 6 + i; // 06:00 to 22:00
    const time = `${hour.toString().padStart(2, '0')}:00`;
    return { time, label: time };
});

// ============================================
// HELPER: Format date for display
// ============================================

function formatDisplayDate(dateStr: string): string {
    const date = new Date(dateStr + 'T00:00:00');
    const options: Intl.DateTimeFormatOptions = {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    };
    return date.toLocaleDateString('es-ES', options);
}

// ============================================
// COMPONENT
// ============================================

export function DayAgendaPanel({ isOpen, onClose, selectedDate }: DayAgendaPanelProps) {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const athletes = useAthletes();

    // State
    const [selectedAthleteId, setSelectedAthleteId] = useState<string>('');
    const [selectedTime, setSelectedTime] = useState<string | null>(null);

    // Sync date to URL when panel opens
    useEffect(() => {
        if (isOpen && selectedDate) {
            const params = new URLSearchParams(searchParams);
            params.set('date', selectedDate);
            if (selectedTime) {
                params.set('time', selectedTime);
            } else {
                params.delete('time');
            }
            setSearchParams(params, { replace: true });
        }
    }, [isOpen, selectedDate, selectedTime, setSearchParams, searchParams]);

    // Clear URL params when closing
    useEffect(() => {
        if (!isOpen) {
            const params = new URLSearchParams(searchParams);
            params.delete('date');
            params.delete('time');
            if (params.toString() !== searchParams.toString()) {
                setSearchParams(params, { replace: true });
            }
        }
    }, [isOpen, setSearchParams, searchParams]);

    // Active athletes only
    const activeAthletes = useMemo(() =>
        athletes.filter(a => a.isActive),
        [athletes]
    );

    // Handle "Reservar" (STUB - Iteration 1)
    const handleReservar = (time: string) => {
        setSelectedTime(time);

        // ITERATION 1: Stub - navigate with query params instead of creating session
        const queryParams = new URLSearchParams({
            date: selectedDate,
            time: time,
            action: 'reserve',
        });
        if (selectedAthleteId) {
            queryParams.set('athleteId', selectedAthleteId);
        }

        // TODO: In Iteration 2, call sessionsSlice.addSession here
        console.log('[DayAgendaPanel] Reservar stub:', {
            date: selectedDate,
            time,
            athleteId: selectedAthleteId || 'none',
        });

        // Navigate to planning with session tab
        navigate(`/planning?tab=sessions&${queryParams.toString()}`);
        onClose();
    };

    // Handle "Crear sesión"
    const handleCrearSesion = (time: string) => {
        setSelectedTime(time);

        const queryParams = new URLSearchParams({
            date: selectedDate,
            time: time,
        });
        if (selectedAthleteId) {
            queryParams.set('athleteId', selectedAthleteId);
        }

        // Navigate to planning with session tab
        navigate(`/planning?tab=sessions&${queryParams.toString()}`);
        onClose();
    };

    // Handle navigate to create athlete
    const handleCreateAthlete = () => {
        onClose();
        navigate('/athletes');
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={`📅 ${formatDisplayDate(selectedDate)}`}
            size="lg"
        >
            <div className="space-y-4">
                {/* Athlete Selector */}
                <div className="space-y-2">
                    <label className="text-xs text-gray-400 uppercase tracking-wider">
                        Atleta
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
                            <option value="">Seleccionar atleta (opcional)</option>
                            {activeAthletes.map(athlete => (
                                <option key={athlete.id} value={athlete.id}>
                                    {athlete.name}
                                </option>
                            ))}
                        </select>
                    )}
                </div>

                {/* Hour Slots */}
                <div className="space-y-2">
                    <label className="text-xs text-gray-400 uppercase tracking-wider">
                        Horario
                    </label>

                    <div className="max-h-[400px] overflow-y-auto space-y-1 pr-2">
                        {HOUR_SLOTS.map(slot => (
                            <div
                                key={slot.time}
                                className={`
                                    flex items-center justify-between p-3 rounded-lg border transition-all
                                    ${selectedTime === slot.time
                                        ? 'bg-[#C5A572]/10 border-[#C5A572]'
                                        : 'bg-[#141414] border-[#2A2A2A] hover:border-[#444]'
                                    }
                                `}
                            >
                                <div className="flex items-center gap-3">
                                    <span className="font-mono text-white text-sm w-14">
                                        {slot.label}
                                    </span>
                                    {selectedTime === slot.time && (
                                        <AuraBadge variant="gold">Seleccionado</AuraBadge>
                                    )}
                                </div>

                                <div className="flex items-center gap-2">
                                    <AuraButton
                                        variant="secondary"
                                        size="sm"
                                        onClick={() => handleReservar(slot.time)}
                                    >
                                        Reservar
                                    </AuraButton>
                                    <AuraButton
                                        variant="gold"
                                        size="sm"
                                        onClick={() => handleCrearSesion(slot.time)}
                                    >
                                        Crear sesión
                                    </AuraButton>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Selected info */}
                {(selectedAthleteId || selectedTime) && (
                    <div className="pt-3 border-t border-[#2A2A2A] text-xs text-gray-500">
                        {selectedAthleteId && (
                            <span>
                                Atleta: {activeAthletes.find(a => a.id === selectedAthleteId)?.name}
                            </span>
                        )}
                        {selectedTime && (
                            <span className="ml-3">
                                Hora: {selectedTime}
                            </span>
                        )}
                    </div>
                )}
            </div>
        </Modal>
    );
}

export default DayAgendaPanel;
