/**
 * ExercisesView - Gestión global de ejercicios
 * Lista, crea, edita y elimina ejercicios del catálogo
 * Rediseñado con UI Aura
 * REFACTORED: Uses new Exercise model with pattern/muscleGroup from TrainingConfig
 */

import { useState, useMemo } from 'react';
import { Modal, Input, Select } from '../components/ui';
import {
    AuraSection,
    AuraGrid,
    AuraCard,
    AuraPanel,
    AuraButton,
    AuraBadge,
    AuraMetric,
    AuraEmptyState,
} from '../components/ui/aura';
import { useTrainingStore, useExercises } from '../store/store';
import type { Exercise, MuscleGroup, MovementPattern, ExerciseEquipment, ExerciseMechanics, ExerciseDifficulty } from '../types/types';

export function ExercisesView() {
    const exercises = useExercises();
    const { addExercise, updateExercise, deleteExercise, trainingConfig } = useTrainingStore();

    // Get options from TrainingConfig
    const muscleGroupOptions = useMemo(() =>
        trainingConfig.muscleGroups
            .filter(mg => mg.enabled)
            .sort((a, b) => a.order - b.order)
            .map(mg => ({ value: mg.id as MuscleGroup, label: mg.label })),
        [trainingConfig.muscleGroups]
    );

    const patternOptions = useMemo(() =>
        trainingConfig.patterns
            .filter(p => p.enabled)
            .sort((a, b) => a.order - b.order)
            .map(p => ({ value: p.id as MovementPattern, label: p.label })),
        [trainingConfig.patterns]
    );

    const [searchQuery, setSearchQuery] = useState('');
    const [filterMuscle, setFilterMuscle] = useState<MuscleGroup | ''>('');
    const [filterPattern, setFilterPattern] = useState<MovementPattern | ''>('');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [editingExercise, setEditingExercise] = useState<Exercise | null>(null);
    const [showDeleteModal, setShowDeleteModal] = useState<Exercise | null>(null);

    const filteredExercises = useMemo(() => {
        return exercises.filter(ex => {
            if (searchQuery && !ex.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
            if (filterMuscle && ex.muscleGroup !== filterMuscle) return false;
            if (filterPattern && ex.pattern !== filterPattern) return false;
            return true;
        });
    }, [exercises, searchQuery, filterMuscle, filterPattern]);

    const stats = useMemo(() => ({
        total: exercises.length,
        custom: exercises.filter(e => e.isCustom).length,
        patterns: new Set(exercises.map(e => e.pattern).filter(Boolean)).size,
    }), [exercises]);

    // Helper to get label from config
    const getMuscleGroupLabel = (id: MuscleGroup) =>
        trainingConfig.muscleGroups.find(mg => mg.id === id)?.label || id;
    const getPatternLabel = (id: MovementPattern) =>
        trainingConfig.patterns.find(p => p.id === id)?.label || id;

    return (
        <div className="p-8 space-y-6 max-w-6xl mx-auto">
            {/* Header */}
            <AuraSection
                title="Exercises"
                subtitle={`${exercises.length} exercise${exercises.length !== 1 ? 's' : ''} in catalog`}
                action={
                    <AuraButton variant="gold" onClick={() => setShowCreateModal(true)}>
                        + New Exercise
                    </AuraButton>
                }
            />

            {/* Stats */}
            <AuraGrid cols={3} gap="md">
                <AuraMetric label="Total" value={stats.total} />
                <AuraMetric label="Custom" value={stats.custom} />
                <AuraMetric label="Patterns" value={stats.patterns} />
            </AuraGrid>

            {/* Filters */}
            {exercises.length > 0 && (
                <div className="flex gap-4 p-4 bg-[#0F0F0F] border border-[#2A2A2A] rounded-lg">
                    <Input
                        placeholder="Search exercises..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="flex-1 max-w-md"
                    />
                    <Select
                        value={filterMuscle}
                        onChange={(e) => setFilterMuscle(e.target.value as MuscleGroup | '')}
                        options={[{ value: '', label: 'All muscles' }, ...muscleGroupOptions]}
                        className="w-40"
                    />
                    <Select
                        value={filterPattern}
                        onChange={(e) => setFilterPattern(e.target.value as MovementPattern | '')}
                        options={[{ value: '', label: 'All patterns' }, ...patternOptions]}
                        className="w-40"
                    />
                </div>
            )}

            {/* Content */}
            {exercises.length === 0 ? (
                <AuraPanel>
                    <AuraEmptyState
                        icon="📚"
                        title="Your exercise library is empty"
                        description="Add exercises to create templates and plan sessions."
                        action={{ label: 'Add Exercise', onClick: () => setShowCreateModal(true) }}
                    />
                </AuraPanel>
            ) : filteredExercises.length === 0 ? (
                <AuraPanel>
                    <AuraEmptyState
                        icon="🔍"
                        title="No exercises found"
                        description="Try adjusting your filters or search terms."
                        size="sm"
                    />
                </AuraPanel>
            ) : (
                <AuraGrid cols={3} gap="md">
                    {filteredExercises.map(exercise => (
                        <ExerciseCard
                            key={exercise.id}
                            exercise={exercise}
                            getMuscleGroupLabel={getMuscleGroupLabel}
                            getPatternLabel={getPatternLabel}
                            onEdit={() => setEditingExercise(exercise)}
                            onDelete={() => setShowDeleteModal(exercise)}
                        />
                    ))}
                </AuraGrid>
            )}

            {/* Create Modal */}
            <ExerciseFormModal
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                muscleGroupOptions={muscleGroupOptions}
                patternOptions={patternOptions}
                onSave={(data) => { addExercise(data); setShowCreateModal(false); }}
            />

            {/* Edit Modal */}
            {editingExercise && (
                <ExerciseFormModal
                    isOpen={true}
                    exercise={editingExercise}
                    onClose={() => setEditingExercise(null)}
                    muscleGroupOptions={muscleGroupOptions}
                    patternOptions={patternOptions}
                    onSave={(data) => { updateExercise(editingExercise.id, data); setEditingExercise(null); }}
                />
            )}

            {/* Delete Modal */}
            <Modal
                isOpen={!!showDeleteModal}
                onClose={() => setShowDeleteModal(null)}
                title="Delete Exercise"
                size="sm"
                footer={
                    <>
                        <AuraButton variant="ghost" onClick={() => setShowDeleteModal(null)}>Cancel</AuraButton>
                        <AuraButton
                            variant="secondary"
                            className="!bg-red-600 hover:!bg-red-700 !border-red-600"
                            onClick={() => { if (showDeleteModal) { deleteExercise(showDeleteModal.id); setShowDeleteModal(null); } }}
                        >
                            Delete
                        </AuraButton>
                    </>
                }
            >
                <p className="text-gray-400">
                    Delete <strong className="text-white">{showDeleteModal?.name}</strong>?
                </p>
                <p className="text-sm text-gray-600 mt-2">
                    Sessions and templates using this exercise will show "Deleted exercise".
                </p>
            </Modal>
        </div>
    );
}

// Exercise Card
interface ExerciseCardProps {
    exercise: Exercise;
    getMuscleGroupLabel: (id: MuscleGroup) => string;
    getPatternLabel: (id: MovementPattern) => string;
    onEdit: () => void;
    onDelete: () => void;
}

function ExerciseCard({ exercise, getMuscleGroupLabel, getPatternLabel, onEdit, onDelete }: ExerciseCardProps) {
    return (
        <AuraCard hover className="relative group" onClick={onEdit}>
            <div className="flex items-start justify-between mb-2">
                <h3 className="font-semibold text-white truncate">{exercise.name}</h3>
                {exercise.isCustom && <AuraBadge size="sm" variant="gold">Custom</AuraBadge>}
            </div>

            <div className="flex flex-wrap gap-1 mb-3">
                {exercise.muscleGroup && (
                    <AuraBadge size="sm" variant="muted">{getMuscleGroupLabel(exercise.muscleGroup)}</AuraBadge>
                )}
                {exercise.pattern && (
                    <AuraBadge size="sm" variant="muted">{getPatternLabel(exercise.pattern)}</AuraBadge>
                )}
            </div>

            <div className="flex items-center gap-4 pt-3 border-t border-[#2A2A2A] text-xs text-gray-500">
                {exercise.tags && exercise.tags.length > 0 && (
                    <span>🏷️ {exercise.tags.slice(0, 2).join(', ')}</span>
                )}
                {exercise.equipment && <span>🛠️ {exercise.equipment}</span>}
            </div>

            {exercise.description && (
                <p className="text-sm text-gray-600 mt-2 line-clamp-2">{exercise.description}</p>
            )}

            <button
                onClick={(e) => { e.stopPropagation(); onDelete(); }}
                className="absolute top-3 right-3 p-1.5 rounded bg-[#1A1A1A] text-gray-600 opacity-0 group-hover:opacity-100 hover:text-red-400 transition-all"
            >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
            </button>
        </AuraCard>
    );
}

// Exercise Form Modal
interface ExerciseFormModalProps {
    isOpen: boolean;
    exercise?: Exercise;
    muscleGroupOptions: { value: MuscleGroup; label: string }[];
    patternOptions: { value: MovementPattern; label: string }[];
    onClose: () => void;
    onSave: (data: Omit<Exercise, 'id' | 'createdAt'>) => void;
}

// Phase 17B: Equipment options from enum
const EQUIPMENT_OPTIONS: { value: ExerciseEquipment; label: string }[] = [
    { value: 'barbell', label: 'Barra' },
    { value: 'dumbbell', label: 'Mancuernas' },
    { value: 'kettlebell', label: 'Kettlebell' },
    { value: 'machine', label: 'Máquina' },
    { value: 'cable', label: 'Polea/Cable' },
    { value: 'bodyweight', label: 'Peso corporal' },
    { value: 'bands', label: 'Bandas' },
    { value: 'smith', label: 'Multipower' },
    { value: 'other', label: 'Otro' },
];

// Phase 17B: Mechanics options
const MECHANICS_OPTIONS: { value: ExerciseMechanics | ''; label: string }[] = [
    { value: '', label: 'Sin especificar' },
    { value: 'compound', label: 'Compuesto' },
    { value: 'isolation', label: 'Aislamiento' },
];

// Phase 17B: Difficulty options
const DIFFICULTY_OPTIONS: { value: ExerciseDifficulty | ''; label: string }[] = [
    { value: '', label: 'Sin especificar' },
    { value: 'beginner', label: 'Principiante' },
    { value: 'intermediate', label: 'Intermedio' },
    { value: 'advanced', label: 'Avanzado' },
];

function ExerciseFormModal({ isOpen, exercise, muscleGroupOptions, patternOptions, onClose, onSave }: ExerciseFormModalProps) {
    const [name, setName] = useState(exercise?.name || '');
    const [description, setDescription] = useState(exercise?.description || '');
    const [pattern, setPattern] = useState<MovementPattern>(exercise?.pattern || 'other');
    const [muscleGroup, setMuscleGroup] = useState<MuscleGroup>(exercise?.muscleGroup || 'other');
    const [equipment, setEquipment] = useState<ExerciseEquipment>(exercise?.equipment || 'other');
    const [mechanics, setMechanics] = useState<ExerciseMechanics | ''>(exercise?.mechanics || '');
    const [difficulty, setDifficulty] = useState<ExerciseDifficulty | ''>(exercise?.difficulty || '');
    const [tags, setTags] = useState<string>(exercise?.tags?.join(', ') || '');

    const handleSave = () => {
        if (!name.trim()) return;
        onSave({
            name: name.trim(),
            description: description.trim() || undefined,
            pattern,
            muscleGroup,
            equipment, // Now strictly typed from Select
            mechanics: mechanics || undefined,
            difficulty: difficulty || undefined,
            tags: tags.split(',').map(t => t.trim()).filter(Boolean),
            isCustom: true,
            updatedAt: new Date().toISOString(),
        });
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={exercise ? 'Edit Exercise' : 'New Exercise'}
            size="md"
            footer={
                <>
                    <AuraButton variant="ghost" onClick={onClose}>Cancel</AuraButton>
                    <AuraButton variant="gold" onClick={handleSave} disabled={!name.trim()}>
                        {exercise ? 'Save' : 'Create'}
                    </AuraButton>
                </>
            }
        >
            <div className="space-y-4">
                <Input
                    label="Name *"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    autoFocus
                />

                <div className="grid grid-cols-2 gap-4">
                    <Select
                        label="Movement Pattern"
                        value={pattern}
                        onChange={(e) => setPattern(e.target.value as MovementPattern)}
                        options={patternOptions}
                    />
                    <Select
                        label="Muscle Group"
                        value={muscleGroup}
                        onChange={(e) => setMuscleGroup(e.target.value as MuscleGroup)}
                        options={muscleGroupOptions}
                    />
                </div>

                {/* Phase 17B: Equipment Select (strict) */}
                <Select
                    label="Equipment"
                    value={equipment}
                    onChange={(e) => setEquipment(e.target.value as ExerciseEquipment)}
                    options={EQUIPMENT_OPTIONS}
                />

                {/* Phase 17B: Mechanics & Difficulty */}
                <div className="grid grid-cols-2 gap-4">
                    <Select
                        label="Mechanics"
                        value={mechanics}
                        onChange={(e) => setMechanics(e.target.value as ExerciseMechanics | '')}
                        options={MECHANICS_OPTIONS}
                    />
                    <Select
                        label="Difficulty"
                        value={difficulty}
                        onChange={(e) => setDifficulty(e.target.value as ExerciseDifficulty | '')}
                        options={DIFFICULTY_OPTIONS}
                    />
                </div>

                <Input
                    label="Tags (comma separated)"
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                    placeholder="compound, bilateral, push..."
                />

                <div>
                    <label className="block text-[10px] text-gray-500 uppercase tracking-widest mb-2">
                        Description
                    </label>
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={3}
                        className="w-full bg-[#0A0A0A] border border-[#333] rounded px-3 py-2 text-sm text-white focus:border-[var(--color-accent-gold)] outline-none resize-none"
                        placeholder="Exercise description, technique, etc."
                    />
                </div>
            </div>
        </Modal>
    );
}

