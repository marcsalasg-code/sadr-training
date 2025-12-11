/**
 * useOneRMAnchorManager - Hook for OneRMAnchorManager component logic
 * 
 * Extracts state management and business logic for:
 * - Anchor exercise toggle
 * - Body region management
 * - OneRM group assignment
 * - Reference mappings
 * - Group defaults
 */

import { useState, useMemo, useCallback } from 'react';
import { useTrainingStore, useExercises, useAnchorConfig } from '../store/store';
import { isAnchorExercise } from '../utils/oneRMReference';
import type { Exercise, BodyRegion } from '../types/types';

// ============================================
// CONSTANTS
// ============================================

export const ONE_RM_GROUPS = [
    { value: '', label: 'Sin grupo' },
    { value: 'squat_pattern', label: 'Patrón Sentadilla' },
    { value: 'hip_hinge', label: 'Bisagra de Cadera' },
    { value: 'horizontal_push', label: 'Empuje Horizontal' },
    { value: 'horizontal_pull', label: 'Tirón Horizontal' },
    { value: 'vertical_push', label: 'Empuje Vertical' },
    { value: 'vertical_pull', label: 'Tirón Vertical' },
    { value: 'carry', label: 'Acarreo' },
] as const;

export const BODY_REGIONS: { value: BodyRegion | ''; label: string }[] = [
    { value: '', label: 'Sin región' },
    { value: 'upper', label: 'Tren Superior' },
    { value: 'lower', label: 'Tren Inferior' },
    { value: 'full', label: 'Cuerpo Completo' },
    { value: 'core', label: 'Core' },
];

// ============================================
// TYPES
// ============================================

export type AnchorManagerTab = 'anchors' | 'mappings' | 'defaults';

export interface UseOneRMAnchorManagerReturn {
    // State
    activeTab: AnchorManagerTab;
    search: string;
    selectedRegion: string;

    // Setters
    setActiveTab: (tab: AnchorManagerTab) => void;
    setSearch: (value: string) => void;
    setSelectedRegion: (value: string) => void;

    // Data
    exercises: Exercise[];
    filteredExercises: Exercise[];
    anchorExercises: Exercise[];
    anchorConfig: ReturnType<typeof useAnchorConfig>;

    // Actions
    handleToggleAnchor: (exercise: Exercise) => void;
    handleUpdateBodyRegion: (exerciseId: string, region: BodyRegion | '') => void;
    handleUpdateGroup: (exerciseId: string, groupId: string) => void;
    handleSetReference: (exerciseId: string, anchorId: string) => void;
    handleRemoveReference: (exerciseId: string, anchorId: string) => void;
    handleSetGroupDefault: (region: BodyRegion, anchorId: string) => void;
    handleRemoveGroupDefault: (region: BodyRegion, anchorId: string) => void;

    // Helpers
    isAnchor: (exercise: Exercise) => boolean;
    getExerciseReferences: (exerciseId: string) => string[];
    getGroupDefaults: (region: BodyRegion) => string[];
}

// ============================================
// HOOK
// ============================================

export function useOneRMAnchorManager(): UseOneRMAnchorManagerReturn {
    // State
    const [activeTab, setActiveTab] = useState<AnchorManagerTab>('anchors');
    const [search, setSearch] = useState('');
    const [selectedRegion, setSelectedRegion] = useState<string>('all');

    // Store
    const exercises = useExercises();
    const anchorConfig = useAnchorConfig();
    const { updateExercise, setAnchorExercise, setExerciseReference, updateAnchorConfig } = useTrainingStore();

    // Filtered exercises
    const filteredExercises = useMemo(() => {
        return exercises.filter(ex => {
            const matchesSearch = search === '' ||
                ex.name.toLowerCase().includes(search.toLowerCase());
            const matchesRegion = selectedRegion === 'all' ||
                ex.bodyRegion === selectedRegion ||
                (selectedRegion === 'none' && !ex.bodyRegion);
            return matchesSearch && matchesRegion;
        });
    }, [exercises, search, selectedRegion]);

    // Anchor exercises
    const anchorExercises = useMemo(() => {
        return exercises.filter(ex => isAnchorExercise(ex, anchorConfig));
    }, [exercises, anchorConfig]);

    // Check if exercise is anchor
    const isAnchor = useCallback((exercise: Exercise) => {
        return isAnchorExercise(exercise, anchorConfig);
    }, [anchorConfig]);

    // Toggle anchor status
    const handleToggleAnchor = useCallback((exercise: Exercise) => {
        const isCurrentlyAnchor = isAnchorExercise(exercise, anchorConfig);
        updateExercise(exercise.id, { isPrimaryOneRM: !isCurrentlyAnchor });
        setAnchorExercise(exercise.id, !isCurrentlyAnchor);
    }, [anchorConfig, updateExercise, setAnchorExercise]);

    // Update body region
    const handleUpdateBodyRegion = useCallback((exerciseId: string, region: BodyRegion | '') => {
        updateExercise(exerciseId, { bodyRegion: region || undefined });
    }, [updateExercise]);

    // Update oneRM group
    const handleUpdateGroup = useCallback((exerciseId: string, groupId: string) => {
        updateExercise(exerciseId, { oneRMGroupId: groupId || undefined });
    }, [updateExercise]);

    // Set reference
    const handleSetReference = useCallback((exerciseId: string, anchorId: string) => {
        const current = anchorConfig.referenceMap[exerciseId] || [];
        if (anchorId && !current.includes(anchorId)) {
            setExerciseReference(exerciseId, [...current, anchorId]);
        }
    }, [anchorConfig.referenceMap, setExerciseReference]);

    // Remove reference
    const handleRemoveReference = useCallback((exerciseId: string, anchorId: string) => {
        const current = anchorConfig.referenceMap[exerciseId] || [];
        setExerciseReference(exerciseId, current.filter(id => id !== anchorId));
    }, [anchorConfig.referenceMap, setExerciseReference]);

    // Set group default
    const handleSetGroupDefault = useCallback((region: BodyRegion, anchorId: string) => {
        const current = anchorConfig.groupDefaults[region] || [];
        if (!current.includes(anchorId)) {
            updateAnchorConfig({
                groupDefaults: {
                    ...anchorConfig.groupDefaults,
                    [region]: [...current, anchorId],
                },
            });
        }
    }, [anchorConfig.groupDefaults, updateAnchorConfig]);

    // Remove group default
    const handleRemoveGroupDefault = useCallback((region: BodyRegion, anchorId: string) => {
        const current = anchorConfig.groupDefaults[region] || [];
        updateAnchorConfig({
            groupDefaults: {
                ...anchorConfig.groupDefaults,
                [region]: current.filter(id => id !== anchorId),
            },
        });
    }, [anchorConfig.groupDefaults, updateAnchorConfig]);

    // Get exercise references
    const getExerciseReferences = useCallback((exerciseId: string) => {
        return anchorConfig.referenceMap[exerciseId] || [];
    }, [anchorConfig.referenceMap]);

    // Get group defaults
    const getGroupDefaults = useCallback((region: BodyRegion) => {
        return anchorConfig.groupDefaults[region] || [];
    }, [anchorConfig.groupDefaults]);

    return {
        // State
        activeTab,
        search,
        selectedRegion,

        // Setters
        setActiveTab,
        setSearch,
        setSelectedRegion,

        // Data
        exercises,
        filteredExercises,
        anchorExercises,
        anchorConfig,

        // Actions
        handleToggleAnchor,
        handleUpdateBodyRegion,
        handleUpdateGroup,
        handleSetReference,
        handleRemoveReference,
        handleSetGroupDefault,
        handleRemoveGroupDefault,

        // Helpers
        isAnchor,
        getExerciseReferences,
        getGroupDefaults,
    };
}

export default useOneRMAnchorManager;
