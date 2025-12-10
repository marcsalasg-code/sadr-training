/**
 * ExercisesView - Gestión global de ejercicios
 * Lista, crea, edita y elimina ejercicios del catálogo
 * Rediseñado con UI Aura
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
import type { Exercise, MuscleGroup, ExerciseCategory } from '../types/types';

const MUSCLE_GROUPS: { value: MuscleGroup; label: string }[] = [
    { value: 'chest', label: 'Chest' },
    { value: 'back', label: 'Back' },
    { value: 'shoulders', label: 'Shoulders' },
    { value: 'biceps', label: 'Biceps' },
    { value: 'triceps', label: 'Triceps' },
    { value: 'forearms', label: 'Forearms' },
    { value: 'quads', label: 'Quads' },
    { value: 'hamstrings', label: 'Hamstrings' },
    { value: 'glutes', label: 'Glutes' },
    { value: 'calves', label: 'Calves' },
    { value: 'core', label: 'Core' },
    { value: 'full_body', label: 'Full Body' },
    { value: 'cardio', label: 'Cardio' },
];

const CATEGORIES: { value: ExerciseCategory; label: string }[] = [
    { value: 'strength', label: 'Strength' },
    { value: 'hypertrophy', label: 'Hypertrophy' },
    { value: 'power', label: 'Power' },
    { value: 'endurance', label: 'Endurance' },
    { value: 'mobility', label: 'Mobility' },
    { value: 'cardio', label: 'Cardio' },
    { value: 'warmup', label: 'Warm-up' },
    { value: 'cooldown', label: 'Cool-down' },
];

export function ExercisesView() {
    const exercises = useExercises();
    const { addExercise, updateExercise, deleteExercise } = useTrainingStore();

    const [searchQuery, setSearchQuery] = useState('');
    const [filterMuscle, setFilterMuscle] = useState<MuscleGroup | ''>('');
    const [filterCategory, setFilterCategory] = useState<ExerciseCategory | ''>('');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [editingExercise, setEditingExercise] = useState<Exercise | null>(null);
    const [showDeleteModal, setShowDeleteModal] = useState<Exercise | null>(null);

    const filteredExercises = useMemo(() => {
        return exercises.filter(ex => {
            if (searchQuery && !ex.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
            if (filterMuscle && !ex.muscleGroups.includes(filterMuscle)) return false;
            if (filterCategory && ex.category !== filterCategory) return false;
            return true;
        });
    }, [exercises, searchQuery, filterMuscle, filterCategory]);

    const stats = useMemo(() => ({
        total: exercises.length,
        custom: exercises.filter(e => e.isCustom).length,
        categories: new Set(exercises.map(e => e.category)).size,
    }), [exercises]);

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
                <AuraMetric label="Categories" value={stats.categories} />
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
                        options={[{ value: '', label: 'All muscles' }, ...MUSCLE_GROUPS]}
                        className="w-40"
                    />
                    <Select
                        value={filterCategory}
                        onChange={(e) => setFilterCategory(e.target.value as ExerciseCategory | '')}
                        options={[{ value: '', label: 'All categories' }, ...CATEGORIES]}
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
                onSave={(data) => { addExercise(data); setShowCreateModal(false); }}
            />

            {/* Edit Modal */}
            {editingExercise && (
                <ExerciseFormModal
                    isOpen={true}
                    exercise={editingExercise}
                    onClose={() => setEditingExercise(null)}
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
    onEdit: () => void;
    onDelete: () => void;
}

function ExerciseCard({ exercise, onEdit, onDelete }: ExerciseCardProps) {
    const categoryLabel = CATEGORIES.find(c => c.value === exercise.category)?.label || exercise.category;

    return (
        <AuraCard hover className="relative group" onClick={onEdit}>
            <div className="flex items-start justify-between mb-2">
                <h3 className="font-semibold text-white truncate">{exercise.name}</h3>
                {exercise.isCustom && <AuraBadge size="sm" variant="gold">Custom</AuraBadge>}
            </div>

            <div className="flex flex-wrap gap-1 mb-3">
                {exercise.muscleGroups.map(mg => {
                    const label = MUSCLE_GROUPS.find(m => m.value === mg)?.label || mg;
                    return <AuraBadge key={mg} size="sm" variant="muted">{label}</AuraBadge>;
                })}
            </div>

            <div className="flex items-center gap-4 pt-3 border-t border-[#2A2A2A] text-xs text-gray-500">
                <span>📂 {categoryLabel}</span>
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
    onClose: () => void;
    onSave: (data: Omit<Exercise, 'id' | 'createdAt'>) => void;
}

function ExerciseFormModal({ isOpen, exercise, onClose, onSave }: ExerciseFormModalProps) {
    const [name, setName] = useState(exercise?.name || '');
    const [description, setDescription] = useState(exercise?.description || '');
    const [category, setCategory] = useState<ExerciseCategory>(exercise?.category || 'strength');
    const [muscleGroups, setMuscleGroups] = useState<MuscleGroup[]>(exercise?.muscleGroups || []);
    const [equipment, setEquipment] = useState(exercise?.equipment || '');

    const handleSave = () => {
        if (!name.trim() || muscleGroups.length === 0) return;
        onSave({
            name: name.trim(),
            description: description.trim() || undefined,
            category,
            muscleGroups,
            equipment: equipment.trim() || undefined,
            isCustom: true,
        });
    };

    const toggleMuscleGroup = (mg: MuscleGroup) => {
        if (muscleGroups.includes(mg)) {
            setMuscleGroups(muscleGroups.filter(m => m !== mg));
        } else {
            setMuscleGroups([...muscleGroups, mg]);
        }
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
                    <AuraButton variant="gold" onClick={handleSave} disabled={!name.trim() || muscleGroups.length === 0}>
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

                <Select
                    label="Category"
                    value={category}
                    onChange={(e) => setCategory(e.target.value as ExerciseCategory)}
                    options={CATEGORIES}
                />

                <div>
                    <label className="block text-[10px] text-gray-500 uppercase tracking-widest mb-2">
                        Muscle Groups *
                    </label>
                    <div className="flex flex-wrap gap-2">
                        {MUSCLE_GROUPS.map(mg => (
                            <button
                                key={mg.value}
                                onClick={() => toggleMuscleGroup(mg.value)}
                                className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${muscleGroups.includes(mg.value)
                                    ? 'bg-[var(--color-accent-gold)] text-black'
                                    : 'bg-[#1A1A1A] text-gray-500 hover:bg-[#222]'
                                    }`}
                            >
                                {mg.label}
                            </button>
                        ))}
                    </div>
                    {muscleGroups.length === 0 && (
                        <p className="text-xs text-red-400 mt-1">Select at least one muscle group</p>
                    )}
                </div>

                <Input
                    label="Equipment"
                    value={equipment}
                    onChange={(e) => setEquipment(e.target.value)}
                    placeholder="Barbell, dumbbells, machine..."
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
