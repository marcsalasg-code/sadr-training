/**
 * ExercisePicker - Selector unificado de ejercicios
 * 
 * Este componente reemplaza TODOS los selectores de ejercicio anteriores.
 * 
 * Características:
 * - Lee TrainingConfig para patterns y muscleGroups
 * - Respeta enabled/order de la configuración
 * - Muestra labels configurables (no IDs internos)
 * - Filtros por pattern, muscleGroup, tags
 * - Búsqueda por nombre
 * - Opción de crear nuevo ejercicio
 */

import { useState, useMemo, useCallback } from 'react';
import { useTrainingStore, useExercises } from '../../store/store';
import { Modal, Input } from '../ui';
import { AuraButton, AuraBadge, AuraEmptyState, AuraPanel } from '../ui/aura';
import type { MovementPattern, MuscleGroup } from '../../core/exercises/exercise.model';
import type { Exercise } from '../../types/types';

// ============================================
// PROPS
// ============================================

export interface ExercisePickerProps {
    /** Current selected exercise ID */
    value?: string;
    /** Callback when exercise is selected */
    onSelect: (exerciseId: string) => void;
    /** Allow creating new exercise inline */
    allowCreateNew?: boolean;
    /** Show pattern filter */
    filterByPattern?: boolean;
    /** Show muscle group filter */
    filterByMuscleGroup?: boolean;
    /** Show tags filter */
    filterByTags?: boolean;
    /** Placeholder text */
    placeholder?: string;
    /** Disabled state */
    disabled?: boolean;
    /** Size variant */
    size?: 'sm' | 'md' | 'lg';
}

// ============================================
// COMPONENT
// ============================================

export function ExercisePicker({
    value,
    onSelect,
    allowCreateNew = true,
    filterByPattern = true,
    filterByMuscleGroup = true,
    filterByTags = false,
    placeholder = 'Seleccionar ejercicio...',
    disabled = false,
    size = 'md',
}: ExercisePickerProps) {
    // State
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedPattern, setSelectedPattern] = useState<MovementPattern | 'all'>('all');
    const [selectedMuscleGroup, setSelectedMuscleGroup] = useState<MuscleGroup | 'all'>('all');
    const [showCreateModal, setShowCreateModal] = useState(false);

    // Store
    const exercises = useExercises();
    const trainingConfig = useTrainingStore((state) => state.trainingConfig);
    const getPatternLabel = useTrainingStore((state) => state.getPatternLabel);
    const getMuscleGroupLabel = useTrainingStore((state) => state.getMuscleGroupLabel);

    // Enabled patterns and muscle groups from config
    const enabledPatterns = useMemo(() => {
        return trainingConfig.patterns
            .filter((p) => p.enabled)
            .sort((a, b) => a.order - b.order);
    }, [trainingConfig.patterns]);

    const enabledMuscleGroups = useMemo(() => {
        return trainingConfig.muscleGroups
            .filter((m) => m.enabled)
            .sort((a, b) => a.order - b.order);
    }, [trainingConfig.muscleGroups]);

    // Filter exercises
    const filteredExercises = useMemo(() => {
        let result = exercises;

        // Pattern filter (check if exercise has pattern or infer from legacy)
        if (selectedPattern !== 'all') {
            result = result.filter((e) => {
                // Check new pattern field or legacy muscleGroups
                const pattern = (e as Exercise & { pattern?: MovementPattern }).pattern;
                if (pattern) return pattern === selectedPattern;
                // Fallback: don't filter if no pattern data
                return true;
            });
        }

        // Muscle group filter
        if (selectedMuscleGroup !== 'all') {
            result = result.filter((e) => {
                // Check new muscleGroup field
                const muscleGroup = (e as Exercise & { muscleGroup?: MuscleGroup }).muscleGroup;
                if (muscleGroup) return muscleGroup === selectedMuscleGroup;
                // Fallback to legacy muscleGroups array
                if (Array.isArray(e.muscleGroups)) {
                    // Map old names to new
                    const legacyMap: Record<string, MuscleGroup> = {
                        chest: 'chest',
                        back: 'back',
                        shoulders: 'shoulders',
                        biceps: 'arms',
                        triceps: 'arms',
                        forearms: 'arms',
                        quads: 'legs',
                        hamstrings: 'legs',
                        glutes: 'legs',
                        calves: 'legs',
                        core: 'other',
                        full_body: 'full',
                    };
                    return e.muscleGroups.some((mg) => legacyMap[mg] === selectedMuscleGroup);
                }
                return true;
            });
        }

        // Search filter
        if (searchTerm) {
            const lower = searchTerm.toLowerCase();
            result = result.filter((e) => e.name.toLowerCase().includes(lower));
        }

        return result;
    }, [exercises, selectedPattern, selectedMuscleGroup, searchTerm]);

    // Selected exercise
    const selectedExercise = useMemo(() => {
        return exercises.find((e) => e.id === value);
    }, [exercises, value]);

    // Handlers
    const handleSelect = useCallback((exerciseId: string) => {
        onSelect(exerciseId);
        setIsOpen(false);
        setSearchTerm('');
        setSelectedPattern('all');
        setSelectedMuscleGroup('all');
    }, [onSelect]);

    const handleClose = useCallback(() => {
        setIsOpen(false);
        setSearchTerm('');
        setSelectedPattern('all');
        setSelectedMuscleGroup('all');
    }, []);

    // Size classes
    const sizeClasses = {
        sm: 'h-8 text-sm',
        md: 'h-10 text-sm',
        lg: 'h-12 text-base',
    };

    return (
        <>
            {/* Trigger Button */}
            <button
                type="button"
                onClick={() => !disabled && setIsOpen(true)}
                disabled={disabled}
                className={`
                    w-full ${sizeClasses[size]} px-3
                    bg-[#0A0A0A] border border-[#333] rounded-lg
                    text-left truncate
                    ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-[var(--color-accent-gold)] cursor-pointer'}
                    transition-colors
                `}
            >
                {selectedExercise ? (
                    <span className="text-white">{selectedExercise.name}</span>
                ) : (
                    <span className="text-gray-500">{placeholder}</span>
                )}
            </button>

            {/* Picker Modal */}
            <Modal
                isOpen={isOpen}
                onClose={handleClose}
                title="Seleccionar Ejercicio"
                size="lg"
            >
                <div className="space-y-4">
                    {/* Search */}
                    <Input
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Buscar ejercicio..."
                        className="w-full"
                    />

                    {/* Filters */}
                    <div className="flex flex-wrap gap-2">
                        {/* Pattern Filter */}
                        {filterByPattern && enabledPatterns.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                                <button
                                    onClick={() => setSelectedPattern('all')}
                                    className={`px-2 py-1 rounded text-xs transition-colors ${selectedPattern === 'all'
                                        ? 'bg-[var(--color-accent-gold)] text-black'
                                        : 'bg-[#1A1A1A] text-gray-400 hover:bg-[#2A2A2A]'
                                        }`}
                                >
                                    Todos
                                </button>
                                {enabledPatterns.map((p) => (
                                    <button
                                        key={p.id}
                                        onClick={() => setSelectedPattern(p.id)}
                                        className={`px-2 py-1 rounded text-xs transition-colors ${selectedPattern === p.id
                                            ? 'bg-[var(--color-accent-gold)] text-black'
                                            : 'bg-[#1A1A1A] text-gray-400 hover:bg-[#2A2A2A]'
                                            }`}
                                    >
                                        {p.icon} {p.label}
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Muscle Group Filter */}
                        {filterByMuscleGroup && enabledMuscleGroups.length > 0 && (
                            <div className="flex flex-wrap gap-1 border-l border-[#333] pl-2 ml-2">
                                <button
                                    onClick={() => setSelectedMuscleGroup('all')}
                                    className={`px-2 py-1 rounded text-xs transition-colors ${selectedMuscleGroup === 'all'
                                        ? 'bg-purple-600 text-white'
                                        : 'bg-[#1A1A1A] text-gray-400 hover:bg-[#2A2A2A]'
                                        }`}
                                >
                                    Todos
                                </button>
                                {enabledMuscleGroups.map((m) => (
                                    <button
                                        key={m.id}
                                        onClick={() => setSelectedMuscleGroup(m.id)}
                                        className={`px-2 py-1 rounded text-xs transition-colors ${selectedMuscleGroup === m.id
                                            ? 'bg-purple-600 text-white'
                                            : 'bg-[#1A1A1A] text-gray-400 hover:bg-[#2A2A2A]'
                                            }`}
                                    >
                                        {m.icon} {m.label}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Exercise List */}
                    <div className="max-h-80 overflow-y-auto space-y-1">
                        {filteredExercises.length === 0 ? (
                            <AuraEmptyState
                                icon="🏋️"
                                title="Sin resultados"
                                description="No se encontraron ejercicios con estos filtros"
                                size="sm"
                            />
                        ) : (
                            filteredExercises.map((exercise) => (
                                <button
                                    key={exercise.id}
                                    onClick={() => handleSelect(exercise.id)}
                                    className={`
                                        w-full p-3 rounded-lg text-left transition-colors
                                        ${value === exercise.id
                                            ? 'bg-[var(--color-accent-gold)]/20 border border-[var(--color-accent-gold)]'
                                            : 'bg-[#141414] border border-transparent hover:border-[var(--color-accent-gold)]/30'
                                        }
                                    `}
                                >
                                    <div className="flex items-center justify-between">
                                        <span className="text-white font-medium">{exercise.name}</span>
                                        <div className="flex gap-1">
                                            {/* Pattern badge */}
                                            {(exercise as Exercise & { pattern?: MovementPattern }).pattern && (
                                                <AuraBadge variant="muted">
                                                    {getPatternLabel((exercise as Exercise & { pattern?: MovementPattern }).pattern!)}
                                                </AuraBadge>
                                            )}
                                            {/* Muscle group badge */}
                                            {(exercise as Exercise & { muscleGroup?: MuscleGroup }).muscleGroup && (
                                                <AuraBadge variant="muted">
                                                    {getMuscleGroupLabel((exercise as Exercise & { muscleGroup?: MuscleGroup }).muscleGroup!)}
                                                </AuraBadge>
                                            )}
                                            {/* Legacy category */}
                                            {!((exercise as Exercise & { pattern?: MovementPattern }).pattern) && exercise.category && (
                                                <AuraBadge variant="muted">{exercise.category}</AuraBadge>
                                            )}
                                        </div>
                                    </div>
                                    {exercise.equipment && (
                                        <p className="text-xs text-gray-500 mt-1">{exercise.equipment}</p>
                                    )}
                                </button>
                            ))
                        )}
                    </div>

                    {/* Create New Button */}
                    {allowCreateNew && (
                        <div className="pt-2 border-t border-[#333]">
                            <AuraButton
                                variant="secondary"
                                onClick={() => setShowCreateModal(true)}
                                className="w-full"
                            >
                                ➕ Crear nuevo ejercicio
                            </AuraButton>
                        </div>
                    )}
                </div>
            </Modal>

            {/* Create Exercise Modal - placeholder */}
            {showCreateModal && (
                <CreateExerciseModal
                    isOpen={showCreateModal}
                    onClose={() => setShowCreateModal(false)}
                    onCreated={(newId) => {
                        handleSelect(newId);
                        setShowCreateModal(false);
                    }}
                />
            )}
        </>
    );
}

// ============================================
// CREATE EXERCISE MODAL
// ============================================

interface CreateExerciseModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCreated: (exerciseId: string) => void;
}

function CreateExerciseModal({ isOpen, onClose, onCreated }: CreateExerciseModalProps) {
    const [name, setName] = useState('');
    const addExercise = useTrainingStore((state) => state.addExercise);
    const trainingConfig = useTrainingStore((state) => state.trainingConfig);

    const [selectedPattern, setSelectedPattern] = useState<MovementPattern>('other');
    const [selectedMuscleGroup, setSelectedMuscleGroup] = useState<MuscleGroup>('other');

    const handleCreate = () => {
        if (!name.trim()) return;

        const newExercise = addExercise({
            name: name.trim(),
            pattern: selectedPattern,
            muscleGroup: selectedMuscleGroup,
            tags: [],
            isCustom: true,
            updatedAt: new Date().toISOString(),
        });

        onCreated(newExercise.id);
    };

    const enabledPatterns = trainingConfig.patterns.filter((p) => p.enabled);
    const enabledMuscleGroups = trainingConfig.muscleGroups.filter((m) => m.enabled);

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Crear Ejercicio"
            size="md"
            footer={
                <>
                    <AuraButton variant="ghost" onClick={onClose}>
                        Cancelar
                    </AuraButton>
                    <AuraButton variant="gold" onClick={handleCreate} disabled={!name.trim()}>
                        Crear
                    </AuraButton>
                </>
            }
        >
            <div className="space-y-4">
                {/* Name */}
                <div>
                    <label className="block text-sm text-gray-400 mb-1">Nombre</label>
                    <Input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Ej: Sentadilla trasera"
                    />
                </div>

                {/* Pattern */}
                <div>
                    <label className="block text-sm text-gray-400 mb-2">Patrón de movimiento</label>
                    <div className="flex flex-wrap gap-2">
                        {enabledPatterns.map((p) => (
                            <button
                                key={p.id}
                                onClick={() => setSelectedPattern(p.id)}
                                className={`px-3 py-2 rounded-lg text-sm transition-colors ${selectedPattern === p.id
                                    ? 'bg-[var(--color-accent-gold)] text-black'
                                    : 'bg-[#1A1A1A] text-gray-400 hover:bg-[#2A2A2A]'
                                    }`}
                            >
                                {p.icon} {p.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Muscle Group */}
                <div>
                    <label className="block text-sm text-gray-400 mb-2">Grupo muscular</label>
                    <div className="flex flex-wrap gap-2">
                        {enabledMuscleGroups.map((m) => (
                            <button
                                key={m.id}
                                onClick={() => setSelectedMuscleGroup(m.id)}
                                className={`px-3 py-2 rounded-lg text-sm transition-colors ${selectedMuscleGroup === m.id
                                    ? 'bg-purple-600 text-white'
                                    : 'bg-[#1A1A1A] text-gray-400 hover:bg-[#2A2A2A]'
                                    }`}
                            >
                                {m.icon} {m.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </Modal>
    );
}
