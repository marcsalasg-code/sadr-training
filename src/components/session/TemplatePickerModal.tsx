/**
 * TemplatePickerModal - Modal for selecting a template to apply
 * 
 * PHASE 16A: Used in Session Editor to apply template to existing session.
 * Coach-only feature.
 */

import { useState, useMemo } from 'react';
import { Modal, Input } from '../ui';
import { AuraButton, AuraEmptyState } from '../ui/aura';
import { useTemplates, useExercises } from '../../store/store';
import type { WorkoutTemplate } from '../../types/types';

interface TemplatePickerModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (template: WorkoutTemplate) => void;
}

export function TemplatePickerModal({ isOpen, onClose, onSelect }: TemplatePickerModalProps) {
    const templates = useTemplates();
    const exercises = useExercises();
    const [searchQuery, setSearchQuery] = useState('');

    // Filter templates
    const filteredTemplates = useMemo(() => {
        if (!searchQuery.trim()) return templates.filter(t => !t.isArchived);
        const q = searchQuery.toLowerCase();
        return templates.filter(t =>
            !t.isArchived && (
                t.name.toLowerCase().includes(q) ||
                t.category?.toLowerCase().includes(q)
            )
        );
    }, [templates, searchQuery]);

    // Get exercise name for display
    const getExerciseName = (exerciseId: string): string => {
        return exercises.find(e => e.id === exerciseId)?.name || 'Ejercicio';
    };

    const handleSelect = (template: WorkoutTemplate) => {
        onSelect(template);
        setSearchQuery('');
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={() => {
                setSearchQuery('');
                onClose();
            }}
            title="📎 Aplicar plantilla"
            size="lg"
        >
            <div className="space-y-4">
                {/* Search */}
                <Input
                    placeholder="Buscar plantilla..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    autoFocus
                />

                {/* Template List */}
                <div className="max-h-[400px] overflow-y-auto space-y-2">
                    {filteredTemplates.length === 0 ? (
                        <AuraEmptyState
                            icon="📋"
                            title="No hay plantillas"
                            description={searchQuery ? `No se encontraron plantillas para "${searchQuery}"` : "Crea una plantilla primero"}
                            size="sm"
                        />
                    ) : (
                        filteredTemplates.map(template => (
                            <button
                                key={template.id}
                                onClick={() => handleSelect(template)}
                                className="w-full p-4 text-left rounded-lg border border-[#2A2A2A] hover:border-[#C5A572] hover:bg-[#1A1A1A] transition-all group"
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-white group-hover:text-[var(--color-accent-gold)] transition-colors">
                                            {template.name}
                                        </p>
                                        {template.description && (
                                            <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">
                                                {template.description}
                                            </p>
                                        )}
                                        <div className="flex flex-wrap gap-2 mt-2">
                                            <span className="text-[10px] px-2 py-0.5 rounded bg-[#1A1A1A] text-gray-400">
                                                {template.exercises.length} ejercicios
                                            </span>
                                            {template.estimatedDuration && (
                                                <span className="text-[10px] px-2 py-0.5 rounded bg-[#1A1A1A] text-gray-400">
                                                    ~{template.estimatedDuration} min
                                                </span>
                                            )}
                                            {template.structure && (
                                                <span className="text-[10px] px-2 py-0.5 rounded bg-[var(--color-accent-gold)]/10 text-[var(--color-accent-gold)]">
                                                    Con bloques
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <svg className="w-5 h-5 text-gray-500 group-hover:text-[var(--color-accent-gold)] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                </div>
                                {/* Exercise preview */}
                                {template.exercises.length > 0 && (
                                    <div className="mt-2 pt-2 border-t border-[#222]">
                                        <p className="text-[10px] text-gray-500">
                                            {template.exercises.slice(0, 3).map(e => getExerciseName(e.exerciseId)).join(', ')}
                                            {template.exercises.length > 3 && ` +${template.exercises.length - 3} más`}
                                        </p>
                                    </div>
                                )}
                            </button>
                        ))
                    )}
                </div>

                {/* Footer */}
                <div className="pt-3 border-t border-[#2A2A2A] flex justify-end">
                    <AuraButton variant="ghost" onClick={onClose}>
                        Cancelar
                    </AuraButton>
                </div>
            </div>
        </Modal>
    );
}
