/**
 * ExercisesView - Gestión global de ejercicios
 * Lista, crea, edita y elimina ejercicios del catálogo
 */

import { useState, useMemo } from 'react';
import { PageContainer } from '../components/layout';
import { Card, Button, Input, Badge, EmptyState, Modal, Select } from '../components/ui';
import { useTrainingStore, useExercises } from '../store/store';
import type { Exercise, MuscleGroup, ExerciseCategory } from '../types/types';

const MUSCLE_GROUPS: { value: MuscleGroup; label: string }[] = [
    { value: 'chest', label: 'Pecho' },
    { value: 'back', label: 'Espalda' },
    { value: 'shoulders', label: 'Hombros' },
    { value: 'biceps', label: 'Bíceps' },
    { value: 'triceps', label: 'Tríceps' },
    { value: 'forearms', label: 'Antebrazos' },
    { value: 'quads', label: 'Cuádriceps' },
    { value: 'hamstrings', label: 'Isquiotibiales' },
    { value: 'glutes', label: 'Glúteos' },
    { value: 'calves', label: 'Gemelos' },
    { value: 'core', label: 'Core' },
    { value: 'full_body', label: 'Full Body' },
    { value: 'cardio', label: 'Cardio' },
];

const CATEGORIES: { value: ExerciseCategory; label: string }[] = [
    { value: 'strength', label: 'Fuerza' },
    { value: 'hypertrophy', label: 'Hipertrofia' },
    { value: 'power', label: 'Potencia' },
    { value: 'endurance', label: 'Resistencia' },
    { value: 'mobility', label: 'Movilidad' },
    { value: 'cardio', label: 'Cardio' },
    { value: 'warmup', label: 'Calentamiento' },
    { value: 'cooldown', label: 'Enfriamiento' },
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
        <PageContainer
            title="Ejercicios"
            subtitle={`${exercises.length} ejercicio${exercises.length !== 1 ? 's' : ''} en el catálogo`}
            actions={
                <Button onClick={() => setShowCreateModal(true)}>+ Nuevo Ejercicio</Button>
            }
        >
            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mb-6">
                <Card className="text-center py-3">
                    <p className="text-2xl font-bold text-[var(--color-accent-beige)]">{stats.total}</p>
                    <p className="text-xs text-[var(--color-text-muted)]">Total</p>
                </Card>
                <Card className="text-center py-3">
                    <p className="text-2xl font-bold text-[var(--color-accent-gold)]">{stats.custom}</p>
                    <p className="text-xs text-[var(--color-text-muted)]">Personalizados</p>
                </Card>
                <Card className="text-center py-3">
                    <p className="text-2xl font-bold text-[var(--color-text-secondary)]">{stats.categories}</p>
                    <p className="text-xs text-[var(--color-text-muted)]">Categorías</p>
                </Card>
            </div>

            {/* Filters */}
            {exercises.length > 0 && (
                <div className="flex gap-4 mb-6">
                    <Input
                        placeholder="Buscar ejercicios..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="flex-1 max-w-md"
                    />
                    <Select
                        value={filterMuscle}
                        onChange={(e) => setFilterMuscle(e.target.value as MuscleGroup | '')}
                        options={[{ value: '', label: 'Todos los músculos' }, ...MUSCLE_GROUPS]}
                        className="w-48"
                    />
                    <Select
                        value={filterCategory}
                        onChange={(e) => setFilterCategory(e.target.value as ExerciseCategory | '')}
                        options={[{ value: '', label: 'Todas las categorías' }, ...CATEGORIES]}
                        className="w-48"
                    />
                </div>
            )}

            {/* Content */}
            {exercises.length === 0 ? (
                <Card>
                    <EmptyState
                        icon="🏋️"
                        title="Sin ejercicios"
                        description="Crea ejercicios para usar en tus sesiones y plantillas."
                        action={{ label: 'Crear Ejercicio', onClick: () => setShowCreateModal(true) }}
                    />
                </Card>
            ) : filteredExercises.length === 0 ? (
                <Card>
                    <EmptyState
                        icon="🔍"
                        title="Sin resultados"
                        description="No hay ejercicios que coincidan con los filtros."
                    />
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredExercises.map(exercise => (
                        <ExerciseCard
                            key={exercise.id}
                            exercise={exercise}
                            onEdit={() => setEditingExercise(exercise)}
                            onDelete={() => setShowDeleteModal(exercise)}
                        />
                    ))}
                </div>
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

            {/* Delete Confirmation Modal */}
            <Modal
                isOpen={!!showDeleteModal}
                onClose={() => setShowDeleteModal(null)}
                title="Eliminar Ejercicio"
                size="sm"
                footer={
                    <>
                        <Button variant="ghost" onClick={() => setShowDeleteModal(null)}>Cancelar</Button>
                        <Button
                            className="bg-red-600 hover:bg-red-700"
                            onClick={() => { if (showDeleteModal) { deleteExercise(showDeleteModal.id); setShowDeleteModal(null); } }}
                        >
                            Eliminar
                        </Button>
                    </>
                }
            >
                <p className="text-[var(--color-text-secondary)]">
                    ¿Eliminar el ejercicio <strong>{showDeleteModal?.name}</strong>?
                </p>
                <p className="text-sm text-[var(--color-text-muted)] mt-2">
                    Esta acción no se puede deshacer. Las sesiones y plantillas que usen este ejercicio mostrarán "Ejercicio eliminado".
                </p>
            </Modal>
        </PageContainer>
    );
}

// Exercise Card Component
interface ExerciseCardProps {
    exercise: Exercise;
    onEdit: () => void;
    onDelete: () => void;
}

function ExerciseCard({ exercise, onEdit, onDelete }: ExerciseCardProps) {
    const categoryLabel = CATEGORIES.find(c => c.value === exercise.category)?.label || exercise.category;

    return (
        <Card hover className="relative group" onClick={onEdit}>
            <div className="flex items-start justify-between mb-2">
                <h3 className="font-semibold">{exercise.name}</h3>
                {exercise.isCustom && <Badge size="sm" variant="gold">Personalizado</Badge>}
            </div>

            <div className="flex flex-wrap gap-1 mb-3">
                {exercise.muscleGroups.map(mg => {
                    const label = MUSCLE_GROUPS.find(m => m.value === mg)?.label || mg;
                    return <Badge key={mg} size="sm">{label}</Badge>;
                })}
            </div>

            <div className="flex items-center gap-4 pt-3 border-t border-[var(--color-border-default)] text-xs text-[var(--color-text-muted)]">
                <span>📂 {categoryLabel}</span>
                {exercise.equipment && (
                    <span>🛠️ {exercise.equipment}</span>
                )}
            </div>

            {exercise.description && (
                <p className="text-sm text-[var(--color-text-muted)] mt-2 line-clamp-2">{exercise.description}</p>
            )}

            <button
                onClick={(e) => { e.stopPropagation(); onDelete(); }}
                className="absolute top-4 right-4 p-2 rounded-lg opacity-0 group-hover:opacity-100 hover:text-red-400 transition-all"
            >
                🗑️
            </button>
        </Card>
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
            title={exercise ? 'Editar Ejercicio' : 'Nuevo Ejercicio'}
            size="md"
            footer={
                <>
                    <Button variant="ghost" onClick={onClose}>Cancelar</Button>
                    <Button onClick={handleSave} disabled={!name.trim() || muscleGroups.length === 0}>
                        {exercise ? 'Guardar' : 'Crear'}
                    </Button>
                </>
            }
        >
            <div className="space-y-4">
                <Input
                    label="Nombre *"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    autoFocus
                />

                <Select
                    label="Categoría"
                    value={category}
                    onChange={(e) => setCategory(e.target.value as ExerciseCategory)}
                    options={CATEGORIES}
                />

                <div>
                    <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                        Grupos Musculares *
                    </label>
                    <div className="flex flex-wrap gap-2">
                        {MUSCLE_GROUPS.map(mg => (
                            <button
                                key={mg.value}
                                onClick={() => toggleMuscleGroup(mg.value)}
                                className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${muscleGroups.includes(mg.value)
                                    ? 'bg-[var(--color-accent-gold)] text-[var(--color-bg-primary)]'
                                    : 'bg-[var(--color-bg-tertiary)] text-[var(--color-text-muted)] hover:bg-[var(--color-bg-elevated)]'
                                    }`}
                            >
                                {mg.label}
                            </button>
                        ))}
                    </div>
                    {muscleGroups.length === 0 && (
                        <p className="text-xs text-red-400 mt-1">Selecciona al menos un grupo muscular</p>
                    )}
                </div>

                <Input
                    label="Equipamiento"
                    value={equipment}
                    onChange={(e) => setEquipment(e.target.value)}
                    placeholder="Barra, mancuernas, máquina..."
                />

                <div>
                    <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                        Descripción
                    </label>
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={3}
                        className="input resize-none"
                        placeholder="Descripción del ejercicio, técnica, etc."
                    />
                </div>
            </div>
        </Modal>
    );
}
