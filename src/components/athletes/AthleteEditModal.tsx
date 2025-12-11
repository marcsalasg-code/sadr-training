/**
 * AthleteEditModal - Modal for editing athlete details
 */

import type { ChangeEvent } from 'react';
import { Modal, Input } from '../ui';
import { AuraButton } from '../ui/aura';
import type { Athlete, ExperienceLevel } from '../../types/types';

// Type helper for input events
type InputEvent = ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>;

interface AthleteEditModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: () => void;
    editData: Partial<Athlete>;
    setEditData: (data: Partial<Athlete>) => void;
}

export function AthleteEditModal({
    isOpen,
    onClose,
    onSave,
    editData,
    setEditData,
}: AthleteEditModalProps) {
    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Editar Atleta"
            size="lg"
            footer={
                <>
                    <AuraButton variant="ghost" onClick={onClose}>
                        Cancelar
                    </AuraButton>
                    <AuraButton variant="gold" onClick={onSave}>
                        Guardar Cambios
                    </AuraButton>
                </>
            }
        >
            <div className="space-y-4">
                <Input
                    label="Nombre"
                    value={editData.name || ''}
                    onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                />
                <div className="grid grid-cols-2 gap-4">
                    <Input
                        label="Email"
                        type="email"
                        value={editData.email || ''}
                        onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                    />
                    <Input
                        label="Teléfono"
                        type="tel"
                        value={editData.phone || ''}
                        onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                    />
                </div>
                <Input
                    label="Fecha de nacimiento"
                    type="date"
                    value={editData.birthDate || ''}
                    onChange={(e) => setEditData({ ...editData, birthDate: e.target.value })}
                />

                {/* Physical Data Inputs */}
                <div className="grid grid-cols-3 gap-4">
                    <Input
                        label="Altura (cm)"
                        type="number"
                        value={editData.heightCm?.toString() || ''}
                        onChange={(e) => setEditData({
                            ...editData,
                            heightCm: e.target.value ? Number(e.target.value) : undefined
                        })}
                        placeholder="ej: 175"
                    />
                    <Input
                        label="Peso (kg)"
                        type="number"
                        value={editData.currentWeightKg?.toString() || ''}
                        onChange={(e) => setEditData({
                            ...editData,
                            currentWeightKg: e.target.value ? Number(e.target.value) : undefined
                        })}
                        placeholder="ej: 75"
                    />
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">Nivel</label>
                        <select
                            value={editData.experienceLevel || ''}
                            onChange={(e) => setEditData({
                                ...editData,
                                experienceLevel: (e.target.value as ExperienceLevel) || undefined
                            })}
                            className="w-full bg-[#0A0A0A] border border-[#333] rounded-lg px-3 py-2 text-sm text-white focus:border-[var(--color-accent-gold)] outline-none"
                        >
                            <option value="">Seleccionar nivel...</option>
                            <option value="novice">Principiante (0-6 meses)</option>
                            <option value="beginner">Inicial (6-12 meses)</option>
                            <option value="intermediate">Intermedio (1-3 años)</option>
                            <option value="advanced">Avanzado (3-5 años)</option>
                            <option value="elite">Elite (5+ años)</option>
                        </select>
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Objetivos</label>
                    <textarea
                        value={editData.goals || ''}
                        onChange={(e) => setEditData({ ...editData, goals: e.target.value })}
                        rows={3}
                        className="w-full bg-[#0A0A0A] border border-[#333] rounded-lg px-3 py-2 text-sm text-white focus:border-[var(--color-accent-gold)] outline-none resize-none"
                        placeholder="Objetivos del atleta..."
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Lesiones / Limitaciones</label>
                    <textarea
                        value={editData.injuries || ''}
                        onChange={(e) => setEditData({ ...editData, injuries: e.target.value })}
                        rows={2}
                        className="w-full bg-[#0A0A0A] border border-[#333] rounded-lg px-3 py-2 text-sm text-white focus:border-[var(--color-accent-gold)] outline-none resize-none"
                        placeholder="Lesiones o limitaciones..."
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Notas</label>
                    <textarea
                        value={editData.notes || ''}
                        onChange={(e) => setEditData({ ...editData, notes: e.target.value })}
                        rows={2}
                        className="w-full bg-[#0A0A0A] border border-[#333] rounded-lg px-3 py-2 text-sm text-white focus:border-[var(--color-accent-gold)] outline-none resize-none"
                        placeholder="Notas adicionales..."
                    />
                </div>
            </div>
        </Modal>
    );
}
