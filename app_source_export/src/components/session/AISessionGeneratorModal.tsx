/**
 * AISessionGeneratorModal - Modal para configurar y generar sesiones con IA
 * 
 * Permite:
 * - Configurar disciplina, duración, nivel
 * - Ajustar tiempo por bloque
 * - Ver propuestas generadas
 * - Aplicar propuesta a sesión
 */

import { useState, useMemo } from 'react';
import { Modal, Input, Select } from '../ui';
import {
    AuraPanel,
    AuraButton,
    AuraBadge,
    AuraLoadingState,
    AuraEmptyState,
} from '../ui/aura';
import { useSessionGenerator, createDefaultBlocks, useAIEnabled } from '../../ai';
import type { SessionGenerationConfig } from '../../ai';
import type { BlockType, ExerciseEntry } from '../../types/types';
import { useExercises } from '../../store/store';

interface AISessionGeneratorModalProps {
    isOpen: boolean;
    onClose: () => void;
    athleteId: string;
    onApplySession: (exercises: ExerciseEntry[], name: string) => void;
}

const DISCIPLINES = [
    { value: 'calistenia', label: 'Calistenia' },
    { value: 'powerlifting', label: 'Powerlifting' },
    { value: 'crossfit', label: 'CrossFit' },
    { value: 'hiit', label: 'HIIT' },
    { value: 'fuerza_general', label: 'Fuerza General' },
    { value: 'hipertrofia', label: 'Hipertrofia' },
    { value: 'funcional', label: 'Funcional' },
];

const LEVELS = [
    { value: 'principiante', label: 'Principiante' },
    { value: 'intermedio', label: 'Intermedio' },
    { value: 'avanzado', label: 'Avanzado' },
];

const BLOCK_LABELS: Record<BlockType, { label: string; emoji: string }> = {
    movilidad_calentamiento: { label: 'Movilidad', emoji: '🔥' },
    fuerza: { label: 'Fuerza', emoji: '💪' },
    tecnica_especifica: { label: 'Técnica', emoji: '🎯' },
    emom_hiit: { label: 'EMOM/HIIT', emoji: '⚡' },
};

export function AISessionGeneratorModal({
    isOpen,
    onClose,
    athleteId,
    onApplySession,
}: AISessionGeneratorModalProps) {
    const isAIEnabled = useAIEnabled();
    const exercises = useExercises();
    const { generate, isGenerating, proposals, rawProposals, error, clear } = useSessionGenerator();

    // Config state
    const [discipline, setDiscipline] = useState('fuerza_general');
    const [duration, setDuration] = useState(60);
    const [level, setLevel] = useState<'principiante' | 'intermedio' | 'avanzado'>('intermedio');
    const [blocks, setBlocks] = useState(createDefaultBlocks(60));

    // View state
    const [step, setStep] = useState<'config' | 'results'>('config');
    const [selectedProposal, setSelectedProposal] = useState<number | null>(null);

    // Recalculate blocks when duration changes
    const handleDurationChange = (newDuration: number) => {
        setDuration(newDuration);
        setBlocks(createDefaultBlocks(newDuration));
    };

    // Update individual block time
    const handleBlockTimeChange = (index: number, minutes: number) => {
        const newBlocks = [...blocks];
        newBlocks[index] = { ...newBlocks[index], tiempo_min: minutes };
        setBlocks(newBlocks);
    };

    // Calculate total from blocks
    const totalFromBlocks = useMemo(() =>
        blocks.reduce((sum, b) => sum + b.tiempo_min, 0),
        [blocks]);

    // Generate sessions
    const handleGenerate = async () => {
        const config: SessionGenerationConfig = {
            disciplina_global: discipline,
            duracion_total_min: totalFromBlocks,
            nivel: level,
            bloques: blocks,
        };

        await generate(config, athleteId, 2);
        setStep('results');
    };

    // Apply selected proposal
    const handleApply = () => {
        if (selectedProposal === null || !proposals[selectedProposal]) return;

        const proposal = proposals[selectedProposal];
        onApplySession(proposal.exercises, proposal.name || `${discipline} Session`);
        handleClose();
    };

    // Reset and close
    const handleClose = () => {
        clear();
        setStep('config');
        setSelectedProposal(null);
        onClose();
    };

    // Get exercise name by ID
    const getExerciseName = (id: string) => {
        return exercises.find(e => e.id === id)?.name || id;
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={handleClose}
            title={step === 'config' ? '🤖 Generate Session with AI' : '🤖 AI Proposals'}
            size="lg"
            footer={
                step === 'config' ? (
                    <>
                        <AuraButton variant="ghost" onClick={handleClose}>
                            Cancel
                        </AuraButton>
                        <AuraButton
                            variant="gold"
                            onClick={handleGenerate}
                            disabled={!isAIEnabled || isGenerating || totalFromBlocks < 15}
                        >
                            {isGenerating ? 'Generating...' : 'Generate Proposals'}
                        </AuraButton>
                    </>
                ) : (
                    <>
                        <AuraButton variant="ghost" onClick={() => setStep('config')}>
                            ← Back
                        </AuraButton>
                        <AuraButton
                            variant="gold"
                            onClick={handleApply}
                            disabled={selectedProposal === null}
                        >
                            Apply Selected
                        </AuraButton>
                    </>
                )
            }
        >
            {step === 'config' ? (
                <div className="space-y-6">
                    {/* AI Status */}
                    {!isAIEnabled && (
                        <div className="p-3 bg-yellow-900/20 border border-yellow-600/30 rounded-lg text-yellow-400 text-sm">
                            ⚠️ AI is disabled. Enable it in Settings or Internal Lab.
                        </div>
                    )}

                    {/* Basic Config */}
                    <AuraPanel header={<span className="text-white font-medium">Session Configuration</span>}>
                        <div className="grid grid-cols-3 gap-4">
                            <Select
                                label="Discipline"
                                value={discipline}
                                onChange={(e) => setDiscipline(e.target.value)}
                                options={DISCIPLINES}
                            />
                            <Select
                                label="Level"
                                value={level}
                                onChange={(e) => setLevel(e.target.value as typeof level)}
                                options={LEVELS}
                            />
                            <Input
                                label="Total Duration (min)"
                                type="number"
                                min={15}
                                max={120}
                                value={duration}
                                onChange={(e) => handleDurationChange(Number(e.target.value))}
                            />
                        </div>
                    </AuraPanel>

                    {/* Block Times */}
                    <AuraPanel header={
                        <div className="flex items-center justify-between w-full">
                            <span className="text-white font-medium">Block Distribution</span>
                            <span className={`text-sm ${totalFromBlocks === duration ? 'text-green-400' : 'text-yellow-400'}`}>
                                {totalFromBlocks} / {duration} min
                            </span>
                        </div>
                    }>
                        <div className="grid grid-cols-4 gap-4">
                            {blocks.map((block, index) => {
                                const info = BLOCK_LABELS[block.tipo];
                                return (
                                    <div key={block.tipo} className="space-y-2">
                                        <label className="flex items-center gap-1 text-xs text-gray-400">
                                            <span>{info.emoji}</span>
                                            <span>{info.label}</span>
                                        </label>
                                        <input
                                            type="number"
                                            min={0}
                                            max={60}
                                            value={block.tiempo_min}
                                            onChange={(e) => handleBlockTimeChange(index, Number(e.target.value))}
                                            className="w-full bg-[#0A0A0A] border border-[#333] rounded px-3 py-2 text-sm text-white text-center focus:border-[var(--color-accent-gold)] outline-none"
                                        />
                                    </div>
                                );
                            })}
                        </div>
                        <p className="text-xs text-gray-500 mt-3">
                            Adjust time for each block. Total must match session duration.
                        </p>
                    </AuraPanel>
                </div>
            ) : (
                <div className="space-y-4">
                    {isGenerating ? (
                        <div className="py-12">
                            <AuraLoadingState
                                message="Generating session proposals..."
                                variant="dots"
                            />
                        </div>
                    ) : error ? (
                        <div className="p-4 bg-red-900/20 border border-red-600/30 rounded-lg">
                            <p className="text-red-400 text-sm">Error: {error}</p>
                            <AuraButton
                                variant="ghost"
                                size="sm"
                                onClick={() => setStep('config')}
                                className="mt-2"
                            >
                                Try Again
                            </AuraButton>
                        </div>
                    ) : rawProposals.length === 0 ? (
                        <AuraEmptyState
                            icon="🤖"
                            title="No proposals generated"
                            description="Try adjusting your configuration and generate again."
                        />
                    ) : (
                        <div className="space-y-4">
                            <p className="text-sm text-gray-400">
                                Select a proposal to apply to your session:
                            </p>

                            {rawProposals.map((proposal, index) => (
                                <div
                                    key={proposal.id}
                                    onClick={() => setSelectedProposal(index)}
                                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${selectedProposal === index
                                        ? 'border-[var(--color-accent-gold)] bg-[#1A1A1A]'
                                        : 'border-[#2A2A2A] bg-[#0F0F0F] hover:border-[#444]'
                                        }`}
                                >
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-2">
                                            <AuraBadge variant="gold">Proposal {index + 1}</AuraBadge>
                                            <span className="text-white font-medium">
                                                {proposal.disciplina_global}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm text-gray-400">
                                            <span>{proposal.duracion_total_min} min</span>
                                            <AuraBadge size="sm" variant="muted">
                                                {proposal.nivel}
                                            </AuraBadge>
                                        </div>
                                    </div>

                                    {/* Block preview */}
                                    <div className="grid grid-cols-4 gap-2">
                                        {proposal.bloques.map((bloque) => {
                                            const info = BLOCK_LABELS[bloque.tipo];
                                            return (
                                                <div
                                                    key={bloque.tipo}
                                                    className="p-2 bg-[#0A0A0A] rounded text-xs"
                                                >
                                                    <div className="flex items-center gap-1 text-gray-400 mb-1">
                                                        <span>{info.emoji}</span>
                                                        <span>{info.label}</span>
                                                        <span className="ml-auto">{bloque.tiempo_min}′</span>
                                                    </div>
                                                    <div className="text-gray-500 truncate">
                                                        {bloque.ejercicios.length} exercises
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </Modal>
    );
}
