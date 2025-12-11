/**
 * TemplateFormModal - Modal para crear/editar plantillas de entrenamiento
 * 
 * Extracted from TemplatesView.tsx for better maintainability
 */

import { useState } from 'react';
import { Modal, Input, Select } from '../ui';
import { AuraButton, AuraBadge } from '../ui/aura';
import { SessionStructureEditor } from '../session';
import { createDefaultStructure } from '../../core/sessions/sessionStructure.model';
import type { WorkoutTemplate, TemplateExercise, Exercise } from '../../types/types';
import type { SessionStructure } from '../../core/sessions/sessionStructure.model';

// ============================================
// TYPES
// ============================================

export interface TemplateFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    template?: WorkoutTemplate;
    exercises: Exercise[];
    onSave: (data: Omit<WorkoutTemplate, 'id' | 'createdAt' | 'updatedAt'>) => void;
    onAddExercise: (exercise: Omit<Exercise, 'id' | 'createdAt'>) => Exercise;
}

// ============================================
// COMPONENT
// ============================================

export function TemplateFormModal({ isOpen, onClose, template, exercises, onSave, onAddExercise }: TemplateFormModalProps) {
    const [name, setName] = useState(template?.name || '');
    const [description, setDescription] = useState(template?.description || '');
    const [category, setCategory] = useState(template?.category || '');
    const [difficulty, setDifficulty] = useState<'beginner' | 'intermediate' | 'advanced'>(template?.difficulty || 'intermediate');
    const [estimatedDuration, setEstimatedDuration] = useState(template?.estimatedDuration || 60);
    const [templateExercises, setTemplateExercises] = useState<TemplateExercise[]>(template?.exercises || []);
    const [structure, setStructure] = useState<SessionStructure>(
        template?.structure || createDefaultStructure('Plantilla')
    );
    const [showStructure, setShowStructure] = useState(false);
    const [showAddEx, setShowAddEx] = useState(false);
    const [newExName, setNewExName] = useState('');

    const handleAddEx = (exerciseId: string) => {
        setTemplateExercises([...templateExercises, {
            id: crypto.randomUUID(),
            exerciseId,
            defaultSets: 3,
            defaultReps: 10,
            restSeconds: 90,
            order: templateExercises.length,
        }]);
        setShowAddEx(false);
    };

    const handleCreateEx = () => {
        if (!newExName.trim()) return;
        const ex = onAddExercise({
            name: newExName,
            pattern: 'other',
            muscleGroup: 'full',
            tags: [],
            isCustom: true,
            updatedAt: new Date().toISOString(),
        });
        handleAddEx(ex.id);
        setNewExName('');
    };

    const handleSave = () => {
        if (!name.trim()) return;
        onSave({
            name: name.trim(),
            description: description.trim() || undefined,
            category: category.trim() || undefined,
            difficulty,
            estimatedDuration,
            exercises: templateExercises,
            structure,
            isArchived: false,
        });
    };

    const getName = (id: string) => exercises.find(e => e.id === id)?.name || 'Exercise';

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={template ? 'Edit Template' : 'New Template'}
            size="lg"
            footer={
                <>
                    <AuraButton variant="ghost" onClick={onClose}>Cancel</AuraButton>
                    <AuraButton variant="gold" onClick={handleSave} disabled={!name.trim()}>Save</AuraButton>
                </>
            }
        >
            <div className="space-y-4 max-h-[60vh] overflow-y-auto">
                <Input label="Name *" value={name} onChange={(e) => setName(e.target.value)} autoFocus />

                <div className="grid grid-cols-2 gap-4">
                    <Input label="Category" placeholder="Push, Pull, Legs..." value={category} onChange={(e) => setCategory(e.target.value)} />
                    <Select
                        label="Difficulty"
                        value={difficulty}
                        onChange={(e) => setDifficulty(e.target.value as 'beginner' | 'intermediate' | 'advanced')}
                        options={[
                            { value: 'beginner', label: 'Beginner' },
                            { value: 'intermediate', label: 'Intermediate' },
                            { value: 'advanced', label: 'Advanced' },
                        ]}
                    />
                </div>

                <Input
                    label="Duration (min)"
                    type="number"
                    value={estimatedDuration}
                    onChange={(e) => setEstimatedDuration(Number(e.target.value))}
                />

                <div>
                    <label className="block text-[10px] text-gray-500 uppercase tracking-widest mb-2">Description</label>
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={2}
                        className="w-full bg-[#0A0A0A] border border-[#333] rounded px-3 py-2 text-sm text-white focus:border-[var(--color-accent-gold)] outline-none resize-none"
                        placeholder="Description..."
                    />
                </div>

                {/* Session Structure Section */}
                <div className="border border-[#2A2A2A] rounded-lg overflow-hidden">
                    <button
                        type="button"
                        onClick={() => setShowStructure(!showStructure)}
                        className="w-full flex items-center justify-between p-3 bg-[#141414] hover:bg-[#1A1A1A] transition-colors"
                    >
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] text-gray-500 uppercase tracking-widest">Structure</span>
                            <AuraBadge size="sm" variant="muted">{structure.blocks.length} blocks</AuraBadge>
                        </div>
                        <span className="text-gray-500">{showStructure ? '▲' : '▼'}</span>
                    </button>
                    {showStructure && (
                        <div className="p-3 border-t border-[#2A2A2A]">
                            <SessionStructureEditor
                                structure={structure}
                                onChange={setStructure}
                                compact
                            />
                        </div>
                    )}
                </div>

                <div>
                    <div className="flex justify-between mb-2">
                        <label className="text-[10px] text-gray-500 uppercase tracking-widest">Exercises</label>
                        <AuraButton size="sm" variant="ghost" onClick={() => setShowAddEx(true)}>+ Add</AuraButton>
                    </div>

                    {templateExercises.length === 0 ? (
                        <p className="text-sm text-center py-4 text-gray-600">No exercises</p>
                    ) : (
                        <div className="space-y-2">
                            {templateExercises.map((ex, i) => (
                                <div key={ex.id} className="p-3 rounded-lg bg-[#141414] border border-[#2A2A2A] space-y-2">
                                    <div className="flex items-center gap-2">
                                        <span className="flex-1 text-sm font-medium text-white">{getName(ex.exerciseId)}</span>
                                        <button
                                            onClick={() => setTemplateExercises(templateExercises.filter((_, j) => j !== i))}
                                            className="text-gray-500 hover:text-red-400 p-1"
                                        >
                                            ✕
                                        </button>
                                    </div>
                                    <div className="flex items-center gap-3 text-sm">
                                        <div className="flex items-center gap-1">
                                            <label className="text-[10px] text-gray-500">Sets:</label>
                                            <input
                                                type="number"
                                                value={ex.defaultSets}
                                                onChange={(e) => {
                                                    const u = [...templateExercises];
                                                    u[i] = { ...u[i], defaultSets: Number(e.target.value) };
                                                    setTemplateExercises(u);
                                                }}
                                                className="w-12 text-center p-1 rounded bg-[#0A0A0A] border border-[#333] text-sm text-white"
                                                min={1}
                                            />
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <label className="text-[10px] text-gray-500">Reps:</label>
                                            <input
                                                type="number"
                                                value={ex.defaultReps || ''}
                                                onChange={(e) => {
                                                    const u = [...templateExercises];
                                                    u[i] = { ...u[i], defaultReps: Number(e.target.value) || undefined };
                                                    setTemplateExercises(u);
                                                }}
                                                className="w-12 text-center p-1 rounded bg-[#0A0A0A] border border-[#333] text-sm text-white"
                                                placeholder="?"
                                            />
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <label className="text-[10px] text-gray-500">Rest:</label>
                                            <input
                                                type="number"
                                                value={ex.restSeconds || ''}
                                                onChange={(e) => {
                                                    const u = [...templateExercises];
                                                    u[i] = { ...u[i], restSeconds: Number(e.target.value) || undefined };
                                                    setTemplateExercises(u);
                                                }}
                                                className="w-14 text-center p-1 rounded bg-[#0A0A0A] border border-[#333] text-sm text-white"
                                                placeholder="90"
                                            />
                                            <span className="text-[10px] text-gray-500">s</span>
                                        </div>
                                    </div>
                                    <input
                                        type="text"
                                        value={ex.notes || ''}
                                        onChange={(e) => {
                                            const u = [...templateExercises];
                                            u[i] = { ...u[i], notes: e.target.value || undefined };
                                            setTemplateExercises(u);
                                        }}
                                        placeholder="Notes (optional)..."
                                        className="w-full p-1.5 rounded bg-[#0A0A0A] border border-[#333] text-sm text-gray-400"
                                    />
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Add Exercise Sub-Modal */}
            <Modal isOpen={showAddEx} onClose={() => setShowAddEx(false)} title="Add Exercise" size="md">
                {exercises.length === 0 ? (
                    <div className="space-y-4">
                        <p className="text-gray-500">No exercises. Create one:</p>
                        <div className="flex gap-2">
                            <Input placeholder="Name" value={newExName} onChange={(e) => setNewExName(e.target.value)} />
                            <AuraButton variant="gold" onClick={handleCreateEx}>Create</AuraButton>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                            {exercises.map(ex => (
                                <button
                                    key={ex.id}
                                    onClick={() => handleAddEx(ex.id)}
                                    className="w-full text-left p-3 rounded-lg bg-[#141414] border border-[#2A2A2A] hover:border-[var(--color-accent-gold)] transition-colors"
                                >
                                    <p className="font-medium text-white">{ex.name}</p>
                                    <p className="text-xs text-gray-500">{ex.muscleGroup || ex.muscleGroups?.join(', ') || 'Sin categoría'}</p>
                                </button>
                            ))}
                        </div>
                        <div className="pt-4 border-t border-[#2A2A2A]">
                            <p className="text-sm text-gray-500 mb-2">Or create new:</p>
                            <div className="flex gap-2">
                                <Input placeholder="Name" value={newExName} onChange={(e) => setNewExName(e.target.value)} />
                                <AuraButton variant="gold" onClick={handleCreateEx} disabled={!newExName.trim()}>Create</AuraButton>
                            </div>
                        </div>
                    </div>
                )}
            </Modal>
        </Modal>
    );
}
