/**
 * OneRMAnchorManager - Panel de gestión de ejercicios ancla 1RM
 * 
 * Permite:
 * - Ver/marcar ejercicios como ancla de 1RM
 * - Editar bodyRegion y oneRMGroupId
 * - Configurar mapeos de referencia (ejercicio → ancla)
 * 
 * Este componente es una herramienta interna, no visible siempre al usuario.
 */

import { useState, useMemo } from 'react';
import {
    AuraPanel,
    AuraButton,
    AuraBadge,
    AuraGrid,
} from '../ui/aura';
import { Select } from '../ui';
import { useTrainingStore, useExercises, useAnchorConfig } from '../../store/store';
import { isAnchorExercise } from '../../utils/oneRMReference';
import type { Exercise, BodyRegion } from '../../types/types';

// Grupos lógicos predefinidos
const ONE_RM_GROUPS = [
    { value: '', label: 'Sin grupo' },
    { value: 'squat_pattern', label: 'Patrón Sentadilla' },
    { value: 'hip_hinge', label: 'Bisagra de Cadera' },
    { value: 'horizontal_push', label: 'Empuje Horizontal' },
    { value: 'horizontal_pull', label: 'Tirón Horizontal' },
    { value: 'vertical_push', label: 'Empuje Vertical' },
    { value: 'vertical_pull', label: 'Tirón Vertical' },
    { value: 'carry', label: 'Acarreo' },
];

const BODY_REGIONS: { value: BodyRegion | ''; label: string }[] = [
    { value: '', label: 'Sin región' },
    { value: 'upper', label: 'Tren Superior' },
    { value: 'lower', label: 'Tren Inferior' },
    { value: 'full', label: 'Cuerpo Completo' },
    { value: 'core', label: 'Core' },
];

interface OneRMAnchorManagerProps {
    onClose?: () => void;
}

export function OneRMAnchorManager({ onClose }: OneRMAnchorManagerProps) {
    const exercises = useExercises();
    const anchorConfig = useAnchorConfig();
    const { updateExercise, setAnchorExercise, setExerciseReference, updateAnchorConfig } = useTrainingStore();

    const [activeTab, setActiveTab] = useState<'anchors' | 'mappings' | 'defaults'>('anchors');
    const [search, setSearch] = useState('');
    const [selectedRegion, setSelectedRegion] = useState<string>('all');

    // Filtrar ejercicios
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

    // Ejercicios ancla actuales
    const anchorExercises = useMemo(() => {
        return exercises.filter(ex => isAnchorExercise(ex, anchorConfig));
    }, [exercises, anchorConfig]);

    // Toggle anchor
    const handleToggleAnchor = (exercise: Exercise) => {
        const isCurrentlyAnchor = isAnchorExercise(exercise, anchorConfig);

        // Actualizar en el ejercicio
        updateExercise(exercise.id, { isPrimaryOneRM: !isCurrentlyAnchor });

        // También actualizar en anchorConfig
        setAnchorExercise(exercise.id, !isCurrentlyAnchor);
    };

    // Actualizar bodyRegion
    const handleUpdateBodyRegion = (exerciseId: string, region: BodyRegion | '') => {
        updateExercise(exerciseId, {
            bodyRegion: region || undefined
        });
    };

    // Actualizar oneRMGroupId
    const handleUpdateGroup = (exerciseId: string, groupId: string) => {
        updateExercise(exerciseId, {
            oneRMGroupId: groupId || undefined
        });
    };

    // Actualizar referencia para un ejercicio
    const handleSetReference = (exerciseId: string, anchorId: string) => {
        const current = anchorConfig.referenceMap[exerciseId] || [];
        if (anchorId && !current.includes(anchorId)) {
            setExerciseReference(exerciseId, [...current, anchorId]);
        }
    };

    // Quitar referencia
    const handleRemoveReference = (exerciseId: string, anchorId: string) => {
        const current = anchorConfig.referenceMap[exerciseId] || [];
        setExerciseReference(exerciseId, current.filter(id => id !== anchorId));
    };

    // Actualizar defaults de grupo
    const handleSetGroupDefault = (region: BodyRegion, anchorId: string) => {
        const current = anchorConfig.groupDefaults[region] || [];
        if (!current.includes(anchorId)) {
            updateAnchorConfig({
                groupDefaults: {
                    ...anchorConfig.groupDefaults,
                    [region]: [...current, anchorId],
                },
            });
        }
    };

    const handleRemoveGroupDefault = (region: BodyRegion, anchorId: string) => {
        const current = anchorConfig.groupDefaults[region] || [];
        updateAnchorConfig({
            groupDefaults: {
                ...anchorConfig.groupDefaults,
                [region]: current.filter(id => id !== anchorId),
            },
        });
    };

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-semibold text-white">Ejercicios Ancla 1RM</h2>
                    <p className="text-sm text-gray-500">
                        Configura qué ejercicios son referencia de 1RM y los mapeos
                    </p>
                </div>
                {onClose && (
                    <AuraButton variant="ghost" onClick={onClose}>✕</AuraButton>
                )}
            </div>

            {/* Tabs */}
            <div className="flex gap-2 border-b border-[#2A2A2A] pb-2">
                <button
                    onClick={() => setActiveTab('anchors')}
                    className={`px-4 py-2 rounded-t text-sm font-medium transition-colors ${activeTab === 'anchors'
                            ? 'bg-[var(--color-accent-gold)] text-black'
                            : 'text-gray-400 hover:text-white'
                        }`}
                >
                    Ejercicios Ancla ({anchorExercises.length})
                </button>
                <button
                    onClick={() => setActiveTab('mappings')}
                    className={`px-4 py-2 rounded-t text-sm font-medium transition-colors ${activeTab === 'mappings'
                            ? 'bg-[var(--color-accent-gold)] text-black'
                            : 'text-gray-400 hover:text-white'
                        }`}
                >
                    Mapeos de Referencia
                </button>
                <button
                    onClick={() => setActiveTab('defaults')}
                    className={`px-4 py-2 rounded-t text-sm font-medium transition-colors ${activeTab === 'defaults'
                            ? 'bg-[var(--color-accent-gold)] text-black'
                            : 'text-gray-400 hover:text-white'
                        }`}
                >
                    Defaults por Región
                </button>
            </div>

            {/* Tab: Anchors */}
            {activeTab === 'anchors' && (
                <div className="space-y-4">
                    {/* Filters */}
                    <div className="flex gap-4">
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Buscar ejercicio..."
                            className="flex-1 px-3 py-2 bg-[#141414] border border-[#2A2A2A] rounded-lg text-white text-sm"
                        />
                        <Select
                            value={selectedRegion}
                            onChange={(e) => setSelectedRegion(e.target.value)}
                            options={[
                                { value: 'all', label: 'Todas las regiones' },
                                { value: 'none', label: 'Sin región' },
                                ...BODY_REGIONS.filter(r => r.value),
                            ]}
                            className="w-48"
                        />
                    </div>

                    {/* Exercise List */}
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                        {filteredExercises.map(exercise => {
                            const isAnchor = isAnchorExercise(exercise, anchorConfig);
                            return (
                                <div
                                    key={exercise.id}
                                    className={`p-3 rounded-lg border transition-colors ${isAnchor
                                            ? 'bg-[var(--color-accent-gold)]/10 border-[var(--color-accent-gold)]/30'
                                            : 'bg-[#141414] border-[#2A2A2A]'
                                        }`}
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => handleToggleAnchor(exercise)}
                                                className={`w-6 h-6 rounded flex items-center justify-center text-sm ${isAnchor
                                                        ? 'bg-[var(--color-accent-gold)] text-black'
                                                        : 'bg-[#2A2A2A] text-gray-500'
                                                    }`}
                                            >
                                                {isAnchor ? '★' : '☆'}
                                            </button>
                                            <span className="font-medium text-white">{exercise.name}</span>
                                        </div>
                                        {isAnchor && (
                                            <AuraBadge variant="success" size="sm">Ancla</AuraBadge>
                                        )}
                                    </div>

                                    <div className="flex gap-2 mt-2">
                                        <Select
                                            value={exercise.bodyRegion || ''}
                                            onChange={(e) => handleUpdateBodyRegion(exercise.id, e.target.value as BodyRegion | '')}
                                            options={BODY_REGIONS}
                                            className="flex-1 text-xs"
                                        />
                                        <Select
                                            value={exercise.oneRMGroupId || ''}
                                            onChange={(e) => handleUpdateGroup(exercise.id, e.target.value)}
                                            options={ONE_RM_GROUPS}
                                            className="flex-1 text-xs"
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Tab: Mappings */}
            {activeTab === 'mappings' && (
                <div className="space-y-4">
                    <p className="text-sm text-gray-400">
                        Asigna ejercicios ancla como referencia 1RM para otros ejercicios.
                    </p>

                    {/* Filter: solo no-ancla */}
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                        {exercises
                            .filter(ex => !isAnchorExercise(ex, anchorConfig))
                            .slice(0, 20)
                            .map(exercise => {
                                const references = anchorConfig.referenceMap[exercise.id] || [];
                                return (
                                    <div key={exercise.id} className="p-3 bg-[#141414] rounded-lg border border-[#2A2A2A]">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="font-medium text-white">{exercise.name}</span>
                                            {exercise.bodyRegion && (
                                                <AuraBadge variant="muted" size="sm">{exercise.bodyRegion}</AuraBadge>
                                            )}
                                        </div>

                                        {/* Referencias actuales */}
                                        <div className="flex flex-wrap gap-1 mb-2">
                                            {references.map(refId => {
                                                const refEx = exercises.find(e => e.id === refId);
                                                return (
                                                    <span
                                                        key={refId}
                                                        className="inline-flex items-center gap-1 px-2 py-1 bg-[var(--color-accent-gold)]/20 text-[var(--color-accent-gold)] text-xs rounded"
                                                    >
                                                        {refEx?.name || refId}
                                                        <button
                                                            onClick={() => handleRemoveReference(exercise.id, refId)}
                                                            className="hover:text-red-400"
                                                        >
                                                            ×
                                                        </button>
                                                    </span>
                                                );
                                            })}
                                        </div>

                                        {/* Añadir referencia */}
                                        <Select
                                            value=""
                                            onChange={(e) => handleSetReference(exercise.id, e.target.value)}
                                            options={[
                                                { value: '', label: '+ Añadir referencia...' },
                                                ...anchorExercises
                                                    .filter(a => !references.includes(a.id))
                                                    .map(a => ({ value: a.id, label: a.name })),
                                            ]}
                                            className="w-full text-xs"
                                        />
                                    </div>
                                );
                            })}
                    </div>
                </div>
            )}

            {/* Tab: Defaults */}
            {activeTab === 'defaults' && (
                <div className="space-y-4">
                    <p className="text-sm text-gray-400">
                        Define qué ejercicios ancla se usan por defecto para cada región corporal.
                    </p>

                    <AuraGrid cols={2} gap="md">
                        {BODY_REGIONS.filter(r => r.value).map(region => {
                            const regionKey = region.value as BodyRegion;
                            const defaults = anchorConfig.groupDefaults[regionKey] || [];

                            return (
                                <AuraPanel key={regionKey}>
                                    <h4 className="font-medium text-white mb-2">{region.label}</h4>

                                    {/* Defaults actuales */}
                                    <div className="space-y-1 mb-2">
                                        {defaults.map((anchorId, idx) => {
                                            const anchor = exercises.find(e => e.id === anchorId);
                                            return (
                                                <div key={anchorId} className="flex items-center justify-between text-sm">
                                                    <span className="text-gray-300">
                                                        {idx + 1}. {anchor?.name || anchorId}
                                                    </span>
                                                    <button
                                                        onClick={() => handleRemoveGroupDefault(regionKey, anchorId)}
                                                        className="text-gray-500 hover:text-red-400"
                                                    >
                                                        ×
                                                    </button>
                                                </div>
                                            );
                                        })}
                                        {defaults.length === 0 && (
                                            <p className="text-xs text-gray-500">Sin defaults</p>
                                        )}
                                    </div>

                                    {/* Añadir default */}
                                    <Select
                                        value=""
                                        onChange={(e) => handleSetGroupDefault(regionKey, e.target.value)}
                                        options={[
                                            { value: '', label: '+ Añadir...' },
                                            ...anchorExercises
                                                .filter(a => !defaults.includes(a.id))
                                                .map(a => ({ value: a.id, label: a.name })),
                                        ]}
                                        className="w-full text-xs"
                                    />
                                </AuraPanel>
                            );
                        })}
                    </AuraGrid>
                </div>
            )}
        </div>
    );
}

export default OneRMAnchorManager;
