/**
 * AddExerciseModal - Modal para añadir ejercicios a una sesión
 * Incluye búsqueda, creación de nuevos ejercicios y sugerencias IA
 * 
 * REFACTORED: Uses TrainingConfig for categories instead of hardcoded lists
 * REFACTORED: Uses new Exercise model with pattern/muscleGroup singular
 */

import { useState, useMemo } from 'react';
import { Modal, Input, Select, Button } from '../ui';
import { AuraEmptyState } from '../ui/aura';
import { AIQuotaIndicator } from '../common';
import { useExerciseSuggestions, useAIEnabled } from '../../ai';
import { useTrainingStore } from '../../store/store';
import type { Exercise, ExerciseEntry, MuscleGroup, MovementPattern } from '../../types/types';

export interface AddExerciseModalProps {
    isOpen: boolean;
    onClose: () => void;
    exercises: Exercise[];
    session: { exercises: ExerciseEntry[]; type?: string } | null;
    onAddExercise: (exerciseId: string) => void;
    onCreateExercise: (data: Omit<Exercise, 'id' | 'createdAt'>) => Exercise;
    getExercise: (id: string) => Exercise | undefined;
}


export function AddExerciseModal({
    isOpen,
    onClose,
    exercises,
    session,
    onAddExercise,
    onCreateExercise,
    getExercise,
}: AddExerciseModalProps) {
    // Get muscle groups from TrainingConfig
    const trainingConfig = useTrainingStore((s) => s.trainingConfig);
    const muscleGroupOptions = useMemo(() =>
        trainingConfig.muscleGroups
            .filter(mg => mg.enabled)
            .sort((a, b) => a.order - b.order)
            .map(mg => ({ value: mg.id as MuscleGroup, label: mg.label })),
        [trainingConfig.muscleGroups]
    );

    // Estados del modal
    const [searchQuery, setSearchQuery] = useState('');
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [newExercise, setNewExercise] = useState({
        name: '',
        muscleGroup: (muscleGroupOptions[0]?.value || 'legs') as MuscleGroup,
        pattern: 'other' as MovementPattern,
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

    // Helper: obtener nombre visible del muscleGroup
    const getMuscleGroupLabel = (ex: Exercise): string => {
        // Nuevo modelo: muscleGroup singular
        if (ex.muscleGroup) {
            const config = trainingConfig.muscleGroups.find(mg => mg.id === ex.muscleGroup);
            return config?.label || ex.muscleGroup;
        }
        // Legacy: muscleGroups array
        if (ex.muscleGroups && ex.muscleGroups.length > 0) {
            return ex.muscleGroups.join(', ');
        }
        return 'Sin categoría';
    };

    // Filtrar ejercicios por búsqueda
    const filteredExercises = useMemo(() => {
        if (!searchQuery.trim()) return exercises;
        const query = searchQuery.toLowerCase();
        return exercises.filter(ex =>
            ex.name.toLowerCase().includes(query) ||
            (ex.muscleGroup && ex.muscleGroup.toLowerCase().includes(query)) ||
            (ex.muscleGroups && ex.muscleGroups.some(mg => mg.toLowerCase().includes(query)))
        );
    }, [exercises, searchQuery]);

    // Limpiar estado al cerrar
    const handleClose = () => {
        setSearchQuery('');
        setShowCreateForm(false);
        setNewExercise({ name: '', muscleGroup: muscleGroupOptions[0]?.value || 'legs', pattern: 'other' });
        clearSuggestions();
        onClose();
    };

    // Crear y añadir ejercicio nuevo
    const handleCreateAndAdd = () => {
        if (!newExercise.name.trim()) return;

        const created = onCreateExercise({
            name: newExercise.name.trim(),
            pattern: newExercise.pattern,
            muscleGroup: newExercise.muscleGroup,
            tags: [],
            isCustom: true,
            updatedAt: new Date().toISOString(),
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
    const handleCreateFromSuggestion = (suggestion: { name: string; muscleGroup: MuscleGroup }) => {
        // Verificar si ya existe
        const existing = exercises.find(ex => ex.name.toLowerCase() === suggestion.name.toLowerCase());
        if (existing) {
            handleSelectExercise(existing.id);
            return;
        }

        const created = onCreateExercise({
            name: suggestion.name,
            pattern: 'other',
            muscleGroup: suggestion.muscleGroup,
            tags: [],
            isCustom: true,
            updatedAt: new Date().toISOString(),
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
                                options={muscleGroupOptions}
                            />
                            <Select
                                value={newExercise.pattern}
                                onChange={(e) => setNewExercise(prev => ({ ...prev, pattern: e.target.value as MovementPattern }))}
                                options={trainingConfig.patterns.filter(p => p.enabled).map(p => ({ value: p.id, label: p.label }))}
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
                                        {getMuscleGroupLabel(ex)}
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
