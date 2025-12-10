/**
 * TrainingConfigView - Panel de configuración de entrenamiento
 * 
 * Permite configurar:
 * - Etiquetas de movement patterns
 * - Etiquetas de muscle groups
 * - Activar/desactivar categorías
 * - Reordenar categorías
 * - Configuración de análisis (método 1RM, formato volumen)
 * 
 * IMPORTANTE: Los cambios aquí afectan a toda la app:
 * - ExercisePicker
 * - Biblioteca de ejercicios
 * - Filtros en sesiones y plantillas
 * - Analytics y gráficos
 */

import { useState } from 'react';
import { useTrainingStore } from '../../store/store';
import { Modal, Input } from '../../components/ui';
import {
    AuraSection,
    AuraPanel,
    AuraButton,
    AuraBadge,
    AuraCard,
    AuraDivider,
} from '../../components/ui/aura';
import { PageContainer } from '../../components/layout';
import type { MovementPattern, MuscleGroup } from '../../core/exercises/exercise.model';
import type { OneRMMethod, VolumeDisplay } from '../../core/config/trainingConfig.model';

export function TrainingConfigView() {
    // Store
    const trainingConfig = useTrainingStore((state) => state.trainingConfig);
    const updatePatternLabel = useTrainingStore((state) => state.updatePatternLabel);
    const togglePattern = useTrainingStore((state) => state.togglePattern);
    const updatePatternIcon = useTrainingStore((state) => state.updatePatternIcon);
    const updateMuscleGroupLabel = useTrainingStore((state) => state.updateMuscleGroupLabel);
    const toggleMuscleGroup = useTrainingStore((state) => state.toggleMuscleGroup);
    const updateMuscleGroupIcon = useTrainingStore((state) => state.updateMuscleGroupIcon);
    const updateAnalysisSettings = useTrainingStore((state) => state.updateAnalysisSettings);
    const resetToDefaults = useTrainingStore((state) => state.resetToDefaults);

    // State for editing
    const [editingPatternId, setEditingPatternId] = useState<MovementPattern | null>(null);
    const [editingMuscleGroupId, setEditingMuscleGroupId] = useState<MuscleGroup | null>(null);
    const [showResetConfirm, setShowResetConfirm] = useState(false);

    // Sorted patterns and muscle groups
    const sortedPatterns = [...trainingConfig.patterns].sort((a, b) => a.order - b.order);
    const sortedMuscleGroups = [...trainingConfig.muscleGroups].sort((a, b) => a.order - b.order);

    return (
        <PageContainer
            title="Configuración de Entrenamiento"
            subtitle="Personaliza categorías, etiquetas y ajustes de análisis"
        >
            <div className="space-y-8 max-w-4xl mx-auto">
                {/* Movement Patterns */}
                <AuraSection
                    title="Patrones de Movimiento"
                    subtitle="Configura las categorías principales de ejercicios"
                >
                    <div className="space-y-2">
                        {sortedPatterns.map((pattern) => (
                            <div
                                key={pattern.id}
                                className={`
                                    flex items-center justify-between p-4 rounded-lg
                                    ${pattern.enabled
                                        ? 'bg-[#141414] border border-[#2A2A2A]'
                                        : 'bg-[#0A0A0A] border border-[#1A1A1A] opacity-60'
                                    }
                                `}
                            >
                                <div className="flex items-center gap-4">
                                    {/* Icon */}
                                    <span className="text-2xl">{pattern.icon || '📦'}</span>

                                    {/* Label */}
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-white font-medium">{pattern.label}</span>
                                            <AuraBadge variant="muted">{pattern.id}</AuraBadge>
                                        </div>
                                        <span className="text-xs text-gray-500">
                                            Orden: {pattern.order + 1}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    {/* Edit Button */}
                                    <AuraButton
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setEditingPatternId(pattern.id)}
                                    >
                                        ✏️
                                    </AuraButton>

                                    {/* Toggle */}
                                    <button
                                        onClick={() => togglePattern(pattern.id, !pattern.enabled)}
                                        className={`
                                            w-12 h-6 rounded-full transition-colors relative
                                            ${pattern.enabled
                                                ? 'bg-[var(--color-accent-gold)]'
                                                : 'bg-[#333]'
                                            }
                                        `}
                                    >
                                        <div
                                            className={`
                                                absolute top-1 w-4 h-4 rounded-full bg-white transition-transform
                                                ${pattern.enabled ? 'left-7' : 'left-1'}
                                            `}
                                        />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </AuraSection>

                {/* Muscle Groups */}
                <AuraSection
                    title="Grupos Musculares"
                    subtitle="Configura los filtros secundarios por grupo muscular"
                >
                    <div className="space-y-2">
                        {sortedMuscleGroups.map((group) => (
                            <div
                                key={group.id}
                                className={`
                                    flex items-center justify-between p-4 rounded-lg
                                    ${group.enabled
                                        ? 'bg-[#141414] border border-[#2A2A2A]'
                                        : 'bg-[#0A0A0A] border border-[#1A1A1A] opacity-60'
                                    }
                                `}
                            >
                                <div className="flex items-center gap-4">
                                    <span className="text-2xl">{group.icon || '💪'}</span>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-white font-medium">{group.label}</span>
                                            <AuraBadge variant="muted">{group.id}</AuraBadge>
                                        </div>
                                        <span className="text-xs text-gray-500">
                                            Orden: {group.order + 1}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <AuraButton
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setEditingMuscleGroupId(group.id)}
                                    >
                                        ✏️
                                    </AuraButton>

                                    <button
                                        onClick={() => toggleMuscleGroup(group.id, !group.enabled)}
                                        className={`
                                            w-12 h-6 rounded-full transition-colors relative
                                            ${group.enabled
                                                ? 'bg-purple-600'
                                                : 'bg-[#333]'
                                            }
                                        `}
                                    >
                                        <div
                                            className={`
                                                absolute top-1 w-4 h-4 rounded-full bg-white transition-transform
                                                ${group.enabled ? 'left-7' : 'left-1'}
                                            `}
                                        />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </AuraSection>

                {/* Analysis Settings */}
                <AuraSection
                    title="Configuración de Análisis"
                    subtitle="Ajusta cómo se calculan y muestran las métricas"
                >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* 1RM Method */}
                        <AuraPanel header={<span className="text-white text-sm">Método de cálculo 1RM</span>}>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => updateAnalysisSettings({ defaultRMMethod: 'brzycki' })}
                                    className={`
                                        flex-1 p-3 rounded-lg text-sm transition-colors
                                        ${trainingConfig.analysis.defaultRMMethod === 'brzycki'
                                            ? 'bg-[var(--color-accent-gold)] text-black font-bold'
                                            : 'bg-[#1A1A1A] text-gray-400 hover:bg-[#2A2A2A]'
                                        }
                                    `}
                                >
                                    Brzycki
                                    <p className="text-xs opacity-70 mt-1">Más conservador</p>
                                </button>
                                <button
                                    onClick={() => updateAnalysisSettings({ defaultRMMethod: 'epley' })}
                                    className={`
                                        flex-1 p-3 rounded-lg text-sm transition-colors
                                        ${trainingConfig.analysis.defaultRMMethod === 'epley'
                                            ? 'bg-[var(--color-accent-gold)] text-black font-bold'
                                            : 'bg-[#1A1A1A] text-gray-400 hover:bg-[#2A2A2A]'
                                        }
                                    `}
                                >
                                    Epley
                                    <p className="text-xs opacity-70 mt-1">Más agresivo</p>
                                </button>
                            </div>
                        </AuraPanel>

                        {/* Volume Display */}
                        <AuraPanel header={<span className="text-white text-sm">Formato de volumen</span>}>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => updateAnalysisSettings({ showVolumeAs: 'kg_total' })}
                                    className={`
                                        flex-1 p-3 rounded-lg text-sm transition-colors
                                        ${trainingConfig.analysis.showVolumeAs === 'kg_total'
                                            ? 'bg-[var(--color-accent-gold)] text-black font-bold'
                                            : 'bg-[#1A1A1A] text-gray-400 hover:bg-[#2A2A2A]'
                                        }
                                    `}
                                >
                                    Kg Totales
                                    <p className="text-xs opacity-70 mt-1">Ej: 15,420 kg</p>
                                </button>
                                <button
                                    onClick={() => updateAnalysisSettings({ showVolumeAs: 'tonnage' })}
                                    className={`
                                        flex-1 p-3 rounded-lg text-sm transition-colors
                                        ${trainingConfig.analysis.showVolumeAs === 'tonnage'
                                            ? 'bg-[var(--color-accent-gold)] text-black font-bold'
                                            : 'bg-[#1A1A1A] text-gray-400 hover:bg-[#2A2A2A]'
                                        }
                                    `}
                                >
                                    Tonelaje
                                    <p className="text-xs opacity-70 mt-1">Ej: 15.42t</p>
                                </button>
                            </div>
                        </AuraPanel>
                    </div>
                </AuraSection>

                {/* Reset */}
                <AuraDivider />
                <div className="flex justify-end">
                    <AuraButton
                        variant="ghost"
                        className="!text-red-400"
                        onClick={() => setShowResetConfirm(true)}
                    >
                        🔄 Restaurar valores por defecto
                    </AuraButton>
                </div>
            </div>

            {/* Edit Pattern Modal */}
            {editingPatternId && (
                <EditPatternModal
                    patternId={editingPatternId}
                    onClose={() => setEditingPatternId(null)}
                />
            )}

            {/* Edit Muscle Group Modal */}
            {editingMuscleGroupId && (
                <EditMuscleGroupModal
                    muscleGroupId={editingMuscleGroupId}
                    onClose={() => setEditingMuscleGroupId(null)}
                />
            )}

            {/* Reset Confirm Modal */}
            <Modal
                isOpen={showResetConfirm}
                onClose={() => setShowResetConfirm(false)}
                title="Confirmar Reset"
                size="sm"
                footer={
                    <>
                        <AuraButton variant="ghost" onClick={() => setShowResetConfirm(false)}>
                            Cancelar
                        </AuraButton>
                        <AuraButton
                            variant="secondary"
                            className="!bg-red-600"
                            onClick={() => {
                                resetToDefaults();
                                setShowResetConfirm(false);
                            }}
                        >
                            Restaurar
                        </AuraButton>
                    </>
                }
            >
                <p className="text-gray-400">
                    ¿Estás seguro de que quieres restaurar todas las configuraciones a sus valores por defecto?
                </p>
            </Modal>
        </PageContainer>
    );
}

// ============================================
// EDIT PATTERN MODAL
// ============================================

interface EditPatternModalProps {
    patternId: MovementPattern;
    onClose: () => void;
}

function EditPatternModal({ patternId, onClose }: EditPatternModalProps) {
    const trainingConfig = useTrainingStore((state) => state.trainingConfig);
    const updatePatternLabel = useTrainingStore((state) => state.updatePatternLabel);
    const updatePatternIcon = useTrainingStore((state) => state.updatePatternIcon);

    const pattern = trainingConfig.patterns.find((p) => p.id === patternId);
    const [label, setLabel] = useState(pattern?.label || '');
    const [icon, setIcon] = useState(pattern?.icon || '');

    if (!pattern) return null;

    const handleSave = () => {
        if (label.trim()) {
            updatePatternLabel(patternId, label.trim());
        }
        if (icon.trim()) {
            updatePatternIcon(patternId, icon.trim());
        }
        onClose();
    };

    return (
        <Modal
            isOpen={true}
            onClose={onClose}
            title={`Editar: ${pattern.label}`}
            size="sm"
            footer={
                <>
                    <AuraButton variant="ghost" onClick={onClose}>
                        Cancelar
                    </AuraButton>
                    <AuraButton variant="gold" onClick={handleSave}>
                        Guardar
                    </AuraButton>
                </>
            }
        >
            <div className="space-y-4">
                <div>
                    <label className="block text-sm text-gray-400 mb-1">Etiqueta visible</label>
                    <Input
                        value={label}
                        onChange={(e) => setLabel(e.target.value)}
                        placeholder="Ej: Sentadilla"
                    />
                </div>
                <div>
                    <label className="block text-sm text-gray-400 mb-1">Icono (emoji)</label>
                    <Input
                        value={icon}
                        onChange={(e) => setIcon(e.target.value)}
                        placeholder="Ej: 🦵"
                    />
                </div>
                <p className="text-xs text-gray-500">
                    ID interno: <code className="bg-[#1A1A1A] px-1 rounded">{patternId}</code>
                </p>
            </div>
        </Modal>
    );
}

// ============================================
// EDIT MUSCLE GROUP MODAL
// ============================================

interface EditMuscleGroupModalProps {
    muscleGroupId: MuscleGroup;
    onClose: () => void;
}

function EditMuscleGroupModal({ muscleGroupId, onClose }: EditMuscleGroupModalProps) {
    const trainingConfig = useTrainingStore((state) => state.trainingConfig);
    const updateMuscleGroupLabel = useTrainingStore((state) => state.updateMuscleGroupLabel);
    const updateMuscleGroupIcon = useTrainingStore((state) => state.updateMuscleGroupIcon);

    const group = trainingConfig.muscleGroups.find((m) => m.id === muscleGroupId);
    const [label, setLabel] = useState(group?.label || '');
    const [icon, setIcon] = useState(group?.icon || '');

    if (!group) return null;

    const handleSave = () => {
        if (label.trim()) {
            updateMuscleGroupLabel(muscleGroupId, label.trim());
        }
        if (icon.trim()) {
            updateMuscleGroupIcon(muscleGroupId, icon.trim());
        }
        onClose();
    };

    return (
        <Modal
            isOpen={true}
            onClose={onClose}
            title={`Editar: ${group.label}`}
            size="sm"
            footer={
                <>
                    <AuraButton variant="ghost" onClick={onClose}>
                        Cancelar
                    </AuraButton>
                    <AuraButton variant="gold" onClick={handleSave}>
                        Guardar
                    </AuraButton>
                </>
            }
        >
            <div className="space-y-4">
                <div>
                    <label className="block text-sm text-gray-400 mb-1">Etiqueta visible</label>
                    <Input
                        value={label}
                        onChange={(e) => setLabel(e.target.value)}
                        placeholder="Ej: Piernas"
                    />
                </div>
                <div>
                    <label className="block text-sm text-gray-400 mb-1">Icono (emoji)</label>
                    <Input
                        value={icon}
                        onChange={(e) => setIcon(e.target.value)}
                        placeholder="Ej: 🦵"
                    />
                </div>
                <p className="text-xs text-gray-500">
                    ID interno: <code className="bg-[#1A1A1A] px-1 rounded">{muscleGroupId}</code>
                </p>
            </div>
        </Modal>
    );
}
