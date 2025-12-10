/**
 * AthleteSelector - Modal para seleccionar atleta antes de iniciar sesión
 * 
 * Muestra lista de atletas activos con búsqueda, info del atleta seleccionado
 * y botón de confirmación para iniciar sesión
 */

import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Modal, Input } from '../ui';
import {
    AuraPanel,
    AuraButton,
    AuraBadge,
    AuraEmptyState,
} from '../ui/aura';
import { useAthletes } from '../../store/store';
import type { Athlete, WorkoutTemplate } from '../../types/types';

interface AthleteSelectorProps {
    isOpen: boolean;
    onClose: () => void;
    template: WorkoutTemplate;
    onConfirm: (athleteId: string) => void;
}

export function AthleteSelector({ isOpen, onClose, template, onConfirm }: AthleteSelectorProps) {
    const athletes = useAthletes();
    const navigate = useNavigate();

    const [searchQuery, setSearchQuery] = useState('');
    const [selectedAthleteId, setSelectedAthleteId] = useState<string | null>(null);

    // Filter active athletes
    const filteredAthletes = useMemo(() => {
        const active = athletes.filter(a => a.isActive);
        if (!searchQuery.trim()) return active;
        const q = searchQuery.toLowerCase();
        return active.filter(a =>
            a.name.toLowerCase().includes(q) ||
            a.notes?.toLowerCase().includes(q)
        );
    }, [athletes, searchQuery]);

    // Get selected athlete details
    const selectedAthlete = useMemo(() => {
        return athletes.find(a => a.id === selectedAthleteId);
    }, [athletes, selectedAthleteId]);

    const handleConfirm = () => {
        if (selectedAthleteId) {
            onConfirm(selectedAthleteId);
            onClose();
        }
    };

    const handleClose = () => {
        setSearchQuery('');
        setSelectedAthleteId(null);
        onClose();
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={handleClose}
            title="Select Athlete"
            size="md"
            footer={
                <>
                    <AuraButton variant="ghost" onClick={handleClose}>
                        Cancel
                    </AuraButton>
                    <AuraButton
                        variant="gold"
                        onClick={handleConfirm}
                        disabled={!selectedAthleteId}
                    >
                        ▶️ Start Session
                    </AuraButton>
                </>
            }
        >
            <div className="space-y-4">
                {/* Template Info */}
                <div className="p-3 bg-[#0A0A0A] rounded-lg border border-[#2A2A2A]">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs text-gray-500 mb-1">Template</p>
                            <p className="text-white font-medium">{template.name}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-xs text-gray-500 mb-1">Exercises</p>
                            <p className="text-white font-mono">{template.exercises.length}</p>
                        </div>
                    </div>
                </div>

                {/* Search */}
                <Input
                    placeholder="Search athletes..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full"
                />

                {/* Athletes List */}
                {filteredAthletes.length === 0 ? (
                    athletes.length === 0 ? (
                        <AuraEmptyState
                            icon="👤"
                            title="No athletes yet"
                            description="Create an athlete first to start a session."
                            action={{
                                label: 'Create Athlete',
                                onClick: () => {
                                    handleClose();
                                    navigate('/athletes');
                                },
                            }}
                            size="sm"
                        />
                    ) : (
                        <AuraEmptyState
                            icon="🔍"
                            title="No athletes found"
                            description="Try a different search term."
                            size="sm"
                        />
                    )
                ) : (
                    <div className="max-h-64 overflow-y-auto space-y-1">
                        {filteredAthletes.map(athlete => (
                            <AthleteRow
                                key={athlete.id}
                                athlete={athlete}
                                isSelected={athlete.id === selectedAthleteId}
                                onClick={() => setSelectedAthleteId(athlete.id)}
                            />
                        ))}
                    </div>
                )}

                {/* Selected Athlete Details */}
                {selectedAthlete && (
                    <AuraPanel header={<span className="text-white text-sm">Athlete Details</span>}>
                        <div className="space-y-3">
                            {/* Goals */}
                            {selectedAthlete.goals && (
                                <div>
                                    <p className="text-[10px] text-gray-500 uppercase mb-1">Goals</p>
                                    <p className="text-sm text-gray-300">{selectedAthlete.goals}</p>
                                </div>
                            )}

                            {/* Injuries Warning */}
                            {selectedAthlete.injuries && (
                                <div className="p-2 bg-yellow-900/20 border border-yellow-600/30 rounded text-xs text-yellow-400">
                                    ⚠️ <span className="font-medium">Injuries/Notes:</span> {selectedAthlete.injuries}
                                </div>
                            )}

                            {/* Notes */}
                            {selectedAthlete.notes && !selectedAthlete.injuries && (
                                <div>
                                    <p className="text-[10px] text-gray-500 uppercase mb-1">Notes</p>
                                    <p className="text-sm text-gray-400">{selectedAthlete.notes}</p>
                                </div>
                            )}

                            {/* No additional info */}
                            {!selectedAthlete.goals && !selectedAthlete.injuries && !selectedAthlete.notes && (
                                <p className="text-sm text-gray-500 text-center py-2">No additional information</p>
                            )}
                        </div>
                    </AuraPanel>
                )}
            </div>
        </Modal>
    );
}

// Athlete Row Component
function AthleteRow({
    athlete,
    isSelected,
    onClick,
}: {
    athlete: Athlete;
    isSelected: boolean;
    onClick: () => void;
}) {
    const hasInjuries = athlete.injuries && athlete.injuries.length > 0;

    return (
        <button
            onClick={onClick}
            className={`w-full p-3 rounded-lg text-left transition-all flex items-center gap-3 ${isSelected
                    ? 'bg-[var(--color-accent-gold)]/10 border border-[var(--color-accent-gold)]'
                    : 'bg-[#0F0F0F] border border-[#2A2A2A] hover:border-[#444]'
                }`}
        >
            {/* Avatar */}
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium ${isSelected ? 'bg-[var(--color-accent-gold)] text-black' : 'bg-[#2A2A2A] text-gray-400'
                }`}>
                {athlete.name.charAt(0).toUpperCase()}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
                <p className={`font-medium truncate ${isSelected ? 'text-white' : 'text-gray-300'}`}>
                    {athlete.name}
                </p>
                {athlete.notes && (
                    <p className="text-xs text-gray-500 truncate">
                        {athlete.notes}
                    </p>
                )}
            </div>

            {/* Badges */}
            <div className="flex-shrink-0 flex gap-1">
                {hasInjuries && (
                    <AuraBadge size="sm" variant="warning">⚠️</AuraBadge>
                )}
            </div>

            {/* Check */}
            {isSelected && (
                <div className="w-5 h-5 rounded-full bg-[var(--color-accent-gold)] flex items-center justify-center">
                    <svg className="w-3 h-3 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                </div>
            )}
        </button>
    );
}
