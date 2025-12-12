/**
 * useExercisePicker - Hook for ExercisePicker component logic
 * 
 * Extracts filtering, search, and configuration logic from ExercisePicker.
 * Improves performance with memoized filtering.
 */

import { useState, useMemo, useCallback } from 'react';
import { useTrainingStore, useExercises } from '../store/store';
import type { MovementPattern, MuscleGroup } from '../core/exercises/exercise.model';
import type { Exercise } from '../types/types';

// ============================================
// TYPES
// ============================================

export interface UseExercisePickerOptions {
    /** Currently selected exercise ID */
    value?: string;
    /** Filter by pattern */
    filterByPattern?: boolean;
    /** Filter by muscle group */
    filterByMuscleGroup?: boolean;
}

export interface UseExercisePickerReturn {
    // State
    isOpen: boolean;
    searchTerm: string;
    selectedPattern: MovementPattern | 'all';
    selectedMuscleGroup: MuscleGroup | 'all';
    showCreateModal: boolean;

    // Setters
    setIsOpen: (value: boolean) => void;
    setSearchTerm: (value: string) => void;
    setSelectedPattern: (value: MovementPattern | 'all') => void;
    setSelectedMuscleGroup: (value: MuscleGroup | 'all') => void;
    setShowCreateModal: (value: boolean) => void;

    // Computed
    exercises: Exercise[];
    filteredExercises: Exercise[];
    selectedExercise: Exercise | undefined;
    enabledPatterns: Array<{ id: MovementPattern; label: string; icon?: string; enabled: boolean; order: number }>;
    enabledMuscleGroups: Array<{ id: MuscleGroup; label: string; icon?: string; enabled: boolean; order: number }>;

    // Actions
    handleSelect: (exerciseId: string, onSelect: (id: string) => void) => void;
    handleClose: () => void;
    getPatternLabel: (pattern: MovementPattern) => string;
    getMuscleGroupLabel: (group: MuscleGroup) => string;
}

// Legacy muscle group mapping
const LEGACY_MUSCLE_MAP: Record<string, MuscleGroup> = {
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

// ============================================
// HOOK
// ============================================

export function useExercisePicker(options: UseExercisePickerOptions = {}): UseExercisePickerReturn {
    const { value, filterByPattern = true, filterByMuscleGroup = true } = options;

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

    // Enabled patterns from config
    const enabledPatterns = useMemo(() => {
        return trainingConfig.patterns
            .filter((p) => p.enabled)
            .sort((a, b) => a.order - b.order);
    }, [trainingConfig.patterns]);

    // Enabled muscle groups from config
    const enabledMuscleGroups = useMemo(() => {
        return trainingConfig.muscleGroups
            .filter((m) => m.enabled)
            .sort((a, b) => a.order - b.order);
    }, [trainingConfig.muscleGroups]);

    // Filter exercises - memoized for performance
    const filteredExercises = useMemo(() => {
        let result = exercises;

        // Pattern filter
        if (filterByPattern && selectedPattern !== 'all') {
            result = result.filter((e) => {
                const pattern = (e as Exercise & { pattern?: MovementPattern }).pattern;
                return pattern ? pattern === selectedPattern : true;
            });
        }

        // Muscle group filter
        if (filterByMuscleGroup && selectedMuscleGroup !== 'all') {
            result = result.filter((e) => {
                const muscleGroup = (e as Exercise & { muscleGroup?: MuscleGroup }).muscleGroup;
                if (muscleGroup) return muscleGroup === selectedMuscleGroup;
                // Fallback to legacy
                if (Array.isArray(e.muscleGroups)) {
                    return e.muscleGroups.some((mg) => LEGACY_MUSCLE_MAP[mg] === selectedMuscleGroup);
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
    }, [exercises, selectedPattern, selectedMuscleGroup, searchTerm, filterByPattern, filterByMuscleGroup]);

    // Selected exercise
    const selectedExercise = useMemo(() => {
        return exercises.find((e) => e.id === value);
    }, [exercises, value]);

    // Handle selection
    const handleSelect = useCallback((exerciseId: string, onSelect: (id: string) => void) => {
        onSelect(exerciseId);
        setIsOpen(false);
        setSearchTerm('');
        setSelectedPattern('all');
        setSelectedMuscleGroup('all');
    }, []);

    // Handle close
    const handleClose = useCallback(() => {
        setIsOpen(false);
        setSearchTerm('');
        setSelectedPattern('all');
        setSelectedMuscleGroup('all');
    }, []);

    return {
        // State
        isOpen,
        searchTerm,
        selectedPattern,
        selectedMuscleGroup,
        showCreateModal,

        // Setters
        setIsOpen,
        setSearchTerm,
        setSelectedPattern,
        setSelectedMuscleGroup,
        setShowCreateModal,

        // Computed
        exercises,
        filteredExercises,
        selectedExercise,
        enabledPatterns,
        enabledMuscleGroups,

        // Actions
        handleSelect,
        handleClose,
        getPatternLabel,
        getMuscleGroupLabel,
    };
}

export default useExercisePicker;
