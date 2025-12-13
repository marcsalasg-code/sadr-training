/**
 * SlotPickerModal - Reusable modal for picking date, time, and athlete
 * 
 * Used by DayAgendaPanel and potentially CalendarView for scheduling sessions.
 * Includes duplicate detection and confirmation flow.
 */

import { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { AuraButton, AuraBadge } from '../ui/aura';
import { HOUR_SLOTS, formatDisplayDate } from './constants';

// ============================================
// TYPES
// ============================================

export interface SlotPickerAthlete {
    id: string;
    name: string;
    isActive?: boolean;
}

export interface SlotPickerResult {
    date: string;      // YYYY-MM-DD
    time: string;      // HH:MM
    athleteId: string;
}

export interface SlotPickerModalProps {
    isOpen: boolean;
    title?: string;
    onConfirm: (result: SlotPickerResult) => void;
    onCancel: () => void;
    athletes: SlotPickerAthlete[];
    initialDate?: string;
    initialTime?: string;
    initialAthleteId?: string;
    checkDuplicate?: (date: string, time: string, athleteId: string) => boolean;
    duplicateWarning?: string;
    confirmButtonText?: string;
}

// ============================================
// COMPONENT
// ============================================

export function SlotPickerModal({
    isOpen,
    title,
    onConfirm,
    onCancel,
    athletes,
    initialDate,
    initialTime,
    initialAthleteId,
    checkDuplicate,
    duplicateWarning = 'Ya existe una sesión para este atleta a esta hora.',
    confirmButtonText = 'Confirmar',
}: SlotPickerModalProps) {
    // State
    const [selectedDate, setSelectedDate] = useState<string>(initialDate || '');
    const [selectedTime, setSelectedTime] = useState<string>(initialTime || '');
    const [selectedAthleteId, setSelectedAthleteId] = useState<string>(initialAthleteId || '');
    const [showDuplicateConfirm, setShowDuplicateConfirm] = useState(false);
    const [isDuplicate, setIsDuplicate] = useState(false);

    // Sync initial values when modal opens
    useEffect(() => {
        if (isOpen) {
            setSelectedDate(initialDate || new Date().toISOString().split('T')[0]);
            setSelectedTime(initialTime || '09:00');
            setSelectedAthleteId(initialAthleteId || '');
            setShowDuplicateConfirm(false);
            setIsDuplicate(false);
        }
    }, [isOpen, initialDate, initialTime, initialAthleteId]);

    // Check for duplicates when selection changes
    useEffect(() => {
        if (checkDuplicate && selectedDate && selectedTime && selectedAthleteId) {
            const hasDuplicate = checkDuplicate(selectedDate, selectedTime, selectedAthleteId);
            setIsDuplicate(hasDuplicate);
            if (!hasDuplicate) {
                setShowDuplicateConfirm(false);
            }
        } else {
            setIsDuplicate(false);
            setShowDuplicateConfirm(false);
        }
    }, [selectedDate, selectedTime, selectedAthleteId, checkDuplicate]);

    // Active athletes only
    const activeAthletes = athletes.filter(a => a.isActive !== false);

    // Validation
    const isValid = selectedDate && selectedTime && selectedAthleteId;

    // Handle confirm
    const handleConfirm = () => {
        if (!isValid) return;

        // If duplicate and not yet confirmed, show warning
        if (isDuplicate && !showDuplicateConfirm) {
            setShowDuplicateConfirm(true);
            return;
        }

        // Proceed with confirmation
        onConfirm({
            date: selectedDate,
            time: selectedTime,
            athleteId: selectedAthleteId,
        });
    };

    // Handle cancel
    const handleCancel = () => {
        setShowDuplicateConfirm(false);
        onCancel();
    };

    // Modal title
    const modalTitle = title || (selectedDate ? `📅 ${formatDisplayDate(selectedDate)}` : '📅 Seleccionar horario');

    return (
        <Modal isOpen={isOpen} onClose={handleCancel} title={modalTitle} size="md">
            <div className="space-y-4">
                {/* Date Selector */}
                <div className="space-y-2">
                    <label className="text-xs text-gray-400 uppercase tracking-wider">
                        Fecha
                    </label>
                    <input
                        type="date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="w-full px-3 py-2 bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg text-white text-sm focus:outline-none focus:border-[#C5A572]"
                    />
                </div>

                {/* Athlete Selector */}
                <div className="space-y-2">
                    <label className="text-xs text-gray-400 uppercase tracking-wider">
                        Atleta <span className="text-red-400">*</span>
                    </label>
                    {activeAthletes.length === 0 ? (
                        <div className="text-sm text-gray-500 py-2">
                            No hay atletas activos.
                        </div>
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

                {/* Time Selector */}
                <div className="space-y-2">
                    <label className="text-xs text-gray-400 uppercase tracking-wider">
                        Hora <span className="text-red-400">*</span>
                    </label>
                    <div className="max-h-[200px] overflow-y-auto grid grid-cols-4 gap-1">
                        {HOUR_SLOTS.map(slot => (
                            <button
                                key={slot.time}
                                type="button"
                                onClick={() => setSelectedTime(slot.time)}
                                className={`
                                    px-2 py-2 text-sm rounded-lg border transition-all
                                    ${selectedTime === slot.time
                                        ? 'bg-[#C5A572]/20 border-[#C5A572] text-[#C5A572]'
                                        : 'bg-[#141414] border-[#2A2A2A] text-gray-300 hover:border-[#444]'
                                    }
                                `}
                            >
                                {slot.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Selection Summary */}
                {(selectedAthleteId || selectedTime) && (
                    <div className="pt-3 border-t border-[#2A2A2A] flex flex-wrap gap-2">
                        {selectedAthleteId && (
                            <AuraBadge variant="default">
                                👤 {activeAthletes.find(a => a.id === selectedAthleteId)?.name}
                            </AuraBadge>
                        )}
                        {selectedTime && (
                            <AuraBadge variant="default">
                                🕐 {selectedTime}
                            </AuraBadge>
                        )}
                    </div>
                )}

                {/* Duplicate Warning */}
                {isDuplicate && (
                    <div className={`
                        p-3 rounded-lg border text-sm
                        ${showDuplicateConfirm
                            ? 'bg-amber-900/30 border-amber-600 text-amber-200'
                            : 'bg-amber-900/20 border-amber-700/50 text-amber-300'
                        }
                    `}>
                        <div className="flex items-start gap-2">
                            <span className="text-amber-400">⚠️</span>
                            <div>
                                <p>{duplicateWarning}</p>
                                {showDuplicateConfirm && (
                                    <p className="mt-2 font-medium">
                                        ¿Deseas continuar de todos modos?
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Actions */}
                <div className="flex items-center justify-end gap-3 pt-4">
                    <AuraButton variant="secondary" onClick={handleCancel}>
                        Cancelar
                    </AuraButton>
                    <AuraButton
                        variant="gold"
                        onClick={handleConfirm}
                        disabled={!isValid}
                    >
                        {showDuplicateConfirm ? 'Sí, continuar' : confirmButtonText}
                    </AuraButton>
                </div>
            </div>
        </Modal>
    );
}

export default SlotPickerModal;
