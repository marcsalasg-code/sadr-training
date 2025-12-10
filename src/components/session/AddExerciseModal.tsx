/**
 * AddExerciseModal - Modal para añadir ejercicios a una sesión
 * Incluye búsqueda, creación de nuevos ejercicios y sugerencias IA
 */

import { useState, useMemo } from 'react';
import { Modal, Input, Select, Button } from '../ui';
import { AuraEmptyState } from '../ui/aura';
import { AIQuotaIndicator } from '../common';
import { useExerciseSuggestions, useAIEnabled } from '../../ai';
import type { Exercise, ExerciseEntry, MuscleGroup, ExerciseCategory } from '../../types/types';

export interface AddExerciseModalProps {
    isOpen: boolean;
    onClose: () => void;
    exercises: Exercise[];
    session: { exercises: ExerciseEntry[]; type?: string } | null;
    onAddExercise: (exerciseId: string) => void;
    onCreateExercise: (data: Omit<Exercise, 'id' | 'createdAt'>) => Exercise;
    getExercise: (id: string) => Exercise | undefined;
}

// Opciones para los selectores
const MUSCLE_GROUPS: { value: MuscleGroup; label: string }[] = [
    { value: 'chest', label: 'Pecho' },
    { value: 'back', label: 'Espalda' },
    { value: 'shoulders', label: 'Hombros' },
    { value: 'biceps', label: 'Bíceps' },
    { value: 'triceps', label: 'Tríceps' },
    { value: 'quads', label: 'Cuádriceps' },
    { value: 'hamstrings', label: 'Isquiotibiales' },
    { value: 'glutes', label: 'Glúteos' },
    { value: 'calves', label: 'Pantorrillas' },
    { value: 'core', label: 'Core' },
    { value: 'full_body', label: 'Cuerpo Completo' },
];

const CATEGORIES: { value: ExerciseCategory; label: string }[] = [
    { value: 'strength', label: 'Fuerza' },
    { value: 'hypertrophy', label: 'Hipertrofia' },
    { value: 'power', label: 'Potencia' },
    { value: 'endurance', label: 'Resistencia' },
    { value: 'cardio', label: 'Cardio' },
];

export function AddExerciseModal({
    isOpen,
    onClose,
    exercises,
    session,
    onAddExercise,
    onCreateExercise,
    getExercise,
}: AddExerciseModalProps) {
    // Estados del modal
    const [searchQuery, setSearchQuery] = useState('');
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [newExercise, setNewExercise] = useState({
        name: '',
        muscleGroup: 'chest' as MuscleGroup,
        category: 'strength' as ExerciseCategory,
    });

    // Hook de sugerencias IA
    const aiEnabled = useAIEnabled();
    const { suggest, suggestions, isLoading: isLoadingSuggestions, error: suggestionError, clearSuggestions } = useExerciseSuggestions();

    // Ejercicios actuales en la sesión (para contexto IA)
    const currentExerciseNames = useMemo(() => {
        if (!session) return [];
        return session.exercises
            .map(ex => getExercise(ex.exerciseId)?.name)
            .filter((name): name is string => !!name);
    }, [session, getExercise]);

    // Filtrar ejercicios por búsqueda
    const filteredExercises = useMemo(() => {
        if (!searchQuery.trim()) return exercises;
        const query = searchQuery.toLowerCase();
        return exercises.filter(ex =>
            ex.name.toLowerCase().includes(query) ||
            ex.muscleGroups.some(mg => mg.toLowerCase().includes(query))
        );
    }, [exercises, searchQuery]);

    // Limpiar estado al cerrar
    const handleClose = () => {
        setSearchQuery('');
        setShowCreateForm(false);
        setNewExercise({ name: '', muscleGroup: 'chest', category: 'strength' });
        clearSuggestions();
        onClose();
    };

    // Crear y añadir ejercicio nuevo
    const handleCreateAndAdd = () => {
        if (!newExercise.name.trim()) return;

        const created = onCreateExercise({
            name: newExercise.name.trim(),
            muscleGroups: [newExercise.muscleGroup],
            category: newExercise.category,
            isCustom: true,
        });

        onAddExercise(created.id);
        handleClose();
    };

    // Añadir ejercicio existente
    const handleSelectExercise = (exerciseId: string) => {
        onAddExercise(exerciseId);
        handleClose();
    };

    // Solicitar sugerencias IA
    const handleRequestSuggestions = () => {
        suggest({
            currentExerciseNames,
            sessionType: session?.type,
        });
    };

    // Crear ejercicio desde sugerencia IA
    const handleCreateFromSuggestion = (suggestion: { name: string; muscleGroup: MuscleGroup; category: ExerciseCategory }) => {
        // Verificar si ya existe
        const existing = exercises.find(ex => ex.name.toLowerCase() === suggestion.name.toLowerCase());
        if (existing) {
            handleSelectExercise(existing.id);
            return;
        }

        const created = onCreateExercise({
            name: suggestion.name,
            muscleGroups: [suggestion.muscleGroup],
            category: suggestion.category,
            isCustom: true,
        });

        onAddExercise(created.id);
        handleClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title="Añadir Ejercicio" size="lg">
            <div className="space-y-4">
                {/* Barra de búsqueda */}
                <Input
                    placeholder="🔍 Buscar ejercicio..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />

                {/* Acciones principales */}
                <div className="flex items-center gap-2">
                    {aiEnabled && (
                        <>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleRequestSuggestions}
                                disabled={isLoadingSuggestions}
                            >
                                {isLoadingSuggestions ? '⏳ Cargando...' : '💡 Sugerir con IA'}
                            </Button>
                            <AIQuotaIndicator size="sm" showLabel={false} />
                        </>
                    )}
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowCreateForm(!showCreateForm)}
                    >
                        {showCreateForm ? '✕ Cancelar' : '+ Crear nuevo'}
                    </Button>
                </div>

                {/* Formulario de creación */}
                {showCreateForm && (
                    <div className="p-4 rounded-lg bg-[var(--color-bg-tertiary)] border border-[var(--color-border-default)] space-y-3">
                        <h4 className="font-medium text-sm">Crear ejercicio nuevo</h4>
                        <Input
                            placeholder="Nombre del ejercicio *"
                            value={newExercise.name}
                            onChange={(e) => setNewExercise(prev => ({ ...prev, name: e.target.value }))}
                        />
                        <div className="grid grid-cols-2 gap-2">
                            <Select
                                value={newExercise.muscleGroup}
                                onChange={(e) => setNewExercise(prev => ({ ...prev, muscleGroup: e.target.value as MuscleGroup }))}
                                options={MUSCLE_GROUPS}
                            />
                            <Select
                                value={newExercise.category}
                                onChange={(e) => setNewExercise(prev => ({ ...prev, category: e.target.value as ExerciseCategory }))}
                                options={CATEGORIES}
                            />
                        </div>
                        <Button
                            size="sm"
                            onClick={handleCreateAndAdd}
                            disabled={!newExercise.name.trim()}
                        >
                            Crear y Añadir
                        </Button>
                    </div>
                )}

                {/* Sugerencias IA */}
                {suggestions.length > 0 && (
                    <div className="space-y-2">
                        <h4 className="text-sm font-medium text-[var(--color-accent-gold)]">🤖 Sugerencias IA</h4>
                        <div className="space-y-1">
                            {suggestions.map((suggestion, idx) => {
                                const existing = exercises.find(ex => ex.name.toLowerCase() === suggestion.name.toLowerCase());
                                return (
                                    <div
                                        key={idx}
                                        className="flex items-center justify-between p-3 rounded-lg bg-[var(--color-accent-gold)]/10 border border-[var(--color-accent-gold)]/30"
                                    >
                                        <div>
                                            <p className="font-medium">{suggestion.name}</p>
                                            <p className="text-xs text-[var(--color-text-muted)]">
                                                {suggestion.reasoning}
                                            </p>
                                        </div>
                                        <Button
                                            size="sm"
                                            onClick={() => handleCreateFromSuggestion(suggestion)}
                                        >
                                            {existing ? 'Añadir' : 'Crear y Añadir'}
                                        </Button>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {suggestionError && (
                    <div className="p-3 bg-yellow-900/20 border border-yellow-600/30 rounded-lg">
                        <p className="text-yellow-400 text-sm">
                            ⚠️ {suggestionError.toLowerCase().includes('429') ||
                                suggestionError.toLowerCase().includes('quota') ||
                                suggestionError.toLowerCase().includes('resource_exhausted')
                                ? 'Cuota de IA agotada. Prueba más tarde o crea el ejercicio manualmente.'
                                : suggestionError}
                        </p>
                    </div>
                )}

                {/* Lista de ejercicios existentes */}
                <div className="space-y-1">
                    <h4 className="text-sm font-medium text-[var(--color-text-muted)]">
                        Ejercicios ({filteredExercises.length})
                    </h4>
                    {filteredExercises.length === 0 ? (
                        <AuraEmptyState
                            icon="📋"
                            title={searchQuery ? 'Sin resultados' : 'Sin ejercicios'}
                            description={searchQuery ? 'Prueba con otro término o crea uno nuevo.' : 'Crea un ejercicio nuevo para comenzar.'}
                            size="sm"
                        />
                    ) : (
                        <div className="space-y-1 max-h-64 overflow-y-auto">
                            {filteredExercises.map(ex => (
                                <button
                                    key={ex.id}
                                    onClick={() => handleSelectExercise(ex.id)}
                                    className="w-full text-left p-3 rounded-lg bg-[var(--color-bg-tertiary)] hover:bg-[var(--color-bg-elevated)] transition-colors"
                                >
                                    <p className="font-medium">{ex.name}</p>
                                    <p className="text-sm text-[var(--color-text-muted)]">
                                        {ex.muscleGroups.join(', ')}
                                    </p>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </Modal>
    );
}
