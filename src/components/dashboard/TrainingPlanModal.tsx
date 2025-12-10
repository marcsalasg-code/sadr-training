/**
 * TrainingPlanModal - Modal para crear/editar Training Plans
 * 
 * Permite:
 * - Seleccionar días de entrenamiento (L-D)
 * - Definir objetivo
 * - Seleccionar atleta
 * - Generar plan con IA
 */

import { useState, useMemo } from 'react';
import { Modal, Select } from '../ui';
import {
    AuraPanel,
    AuraButton,
    AuraEmptyState,
} from '../ui/aura';
import { useTrainingPlan } from '../../hooks';
import { useAthletes } from '../../store/store';
import type { WeekDay, TrainingObjective } from '../../types/types';

interface TrainingPlanModalProps {
    isOpen: boolean;
    onClose: () => void;
    onPlanCreated?: () => void;
    preselectedAthleteId?: string; // When opening from AthleteDetail, pre-fill athlete
}

const weekDays: { id: WeekDay; label: string; short: string }[] = [
    { id: 'monday', label: 'Monday', short: 'M' },
    { id: 'tuesday', label: 'Tuesday', short: 'T' },
    { id: 'wednesday', label: 'Wednesday', short: 'W' },
    { id: 'thursday', label: 'Thursday', short: 'T' },
    { id: 'friday', label: 'Friday', short: 'F' },
    { id: 'saturday', label: 'Saturday', short: 'S' },
    { id: 'sunday', label: 'Sunday', short: 'S' },
];

const objectives: { id: TrainingObjective; label: string; icon: string }[] = [
    { id: 'strength', label: 'Strength', icon: '💪' },
    { id: 'hypertrophy', label: 'Hypertrophy', icon: '🏋️' },
    { id: 'endurance', label: 'Endurance', icon: '🏃' },
    { id: 'recomposition', label: 'Recomposition', icon: '⚖️' },
    { id: 'technique', label: 'Technique', icon: '🎯' },
    { id: 'performance', label: 'Performance', icon: '🏆' },
    { id: 'general_fitness', label: 'General Fitness', icon: '❤️' },
];

export function TrainingPlanModal({ isOpen, onClose, onPlanCreated, preselectedAthleteId }: TrainingPlanModalProps) {
    const athletes = useAthletes();
    const { generatePlanWithAI, activePlan } = useTrainingPlan();

    const [selectedDays, setSelectedDays] = useState<WeekDay[]>([]);
    const [selectedObjective, setSelectedObjective] = useState<TrainingObjective>('strength');
    const [selectedAthleteId, setSelectedAthleteId] = useState<string>(preselectedAthleteId || '');
    const [planName, setPlanName] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedPlan, setGeneratedPlan] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);

    const activeAthletes = useMemo(() => {
        return athletes.filter(a => a.isActive);
    }, [athletes]);

    const athleteOptions = useMemo(() => {
        return [
            { value: '', label: 'Select athlete...' },
            ...activeAthletes.map(a => ({ value: a.id, label: a.name })),
        ];
    }, [activeAthletes]);

    const toggleDay = (day: WeekDay) => {
        setSelectedDays(prev =>
            prev.includes(day)
                ? prev.filter(d => d !== day)
                : [...prev, day]
        );
    };

    const handleGeneratePlan = async () => {
        if (selectedDays.length === 0) {
            setError('Select at least one training day');
            return;
        }
        if (!selectedAthleteId) {
            setError('Select an athlete');
            return;
        }

        setError(null);
        setIsGenerating(true);

        try {
            const plan = await generatePlanWithAI({
                athleteId: selectedAthleteId,
                weekDays: selectedDays,
                objective: selectedObjective,
                name: planName || undefined,
            });
            setGeneratedPlan(plan);
        } catch (err) {
            setError('Failed to generate plan');
        } finally {
            setIsGenerating(false);
        }
    };

    const handleConfirm = () => {
        if (generatedPlan) {
            onPlanCreated?.();
            handleClose();
        }
    };

    const handleClose = () => {
        setSelectedDays([]);
        setSelectedObjective('strength');
        setSelectedAthleteId('');
        setPlanName('');
        setGeneratedPlan(null);
        setError(null);
        onClose();
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={handleClose}
            title="🗓️ Training Plan"
            size="lg"
            footer={
                generatedPlan ? (
                    <>
                        <AuraButton variant="ghost" onClick={() => setGeneratedPlan(null)}>
                            ← Back
                        </AuraButton>
                        <AuraButton variant="gold" onClick={handleConfirm}>
                            ✓ Confirm Plan
                        </AuraButton>
                    </>
                ) : (
                    <>
                        <AuraButton variant="ghost" onClick={handleClose}>
                            Cancel
                        </AuraButton>
                        <AuraButton
                            variant="gold"
                            onClick={handleGeneratePlan}
                            disabled={isGenerating || selectedDays.length === 0 || !selectedAthleteId}
                        >
                            {isGenerating ? '⏳ Generating...' : '🤖 Generate with AI'}
                        </AuraButton>
                    </>
                )
            }
        >
            {generatedPlan ? (
                // Plan Preview
                <div className="space-y-4">
                    <div className="p-4 bg-green-900/20 border border-green-500/30 rounded-lg">
                        <div className="flex items-center gap-2 text-green-400 mb-2">
                            <span>✓</span>
                            <span className="font-medium">Plan Generated!</span>
                        </div>
                        <h3 className="text-white font-bold text-lg">{generatedPlan.name}</h3>
                        <p className="text-gray-400 text-sm">
                            {generatedPlan.sessionsPerWeek} sessions/week • Target: {(generatedPlan.weeklyVolume / 1000).toFixed(1)}K kg
                        </p>
                    </div>

                    <AuraPanel header={<span className="text-white text-sm">Weekly Schedule</span>}>
                        <div className="space-y-2">
                            {generatedPlan.dayPlans.map((dp: any) => (
                                <div
                                    key={dp.dayOfWeek}
                                    className="flex items-center justify-between p-2 bg-[#0F0F0F] rounded-lg"
                                >
                                    <div>
                                        <span className="text-white font-medium capitalize">{dp.dayOfWeek}</span>
                                        <span className="text-gray-500 mx-2">•</span>
                                        <span className="text-[var(--color-accent-gold)]">{dp.sessionType}</span>
                                    </div>
                                    <div className="text-xs text-gray-500">
                                        ~{dp.estimatedDuration} min
                                    </div>
                                </div>
                            ))}
                        </div>
                    </AuraPanel>
                </div>
            ) : (
                // Configuration Form
                <div className="space-y-6">
                    {/* Athlete Selection */}
                    {activeAthletes.length === 0 ? (
                        <AuraEmptyState
                            icon="👤"
                            title="No athletes"
                            description="Create an athlete first to set up a training plan."
                            size="sm"
                        />
                    ) : (
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">
                                Athlete
                            </label>
                            <Select
                                value={selectedAthleteId}
                                onChange={(e) => setSelectedAthleteId(e.target.value)}
                                options={athleteOptions}
                            />
                        </div>
                    )}

                    {/* Plan Name */}
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">
                            Plan Name (optional)
                        </label>
                        <input
                            type="text"
                            value={planName}
                            onChange={(e) => setPlanName(e.target.value)}
                            placeholder="e.g., Strength Block Phase 1"
                            className="w-full bg-[#0A0A0A] border border-[#333] rounded-lg px-3 py-2 text-sm text-white focus:border-[var(--color-accent-gold)] outline-none"
                        />
                    </div>

                    {/* Day Selector */}
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-3">
                            Training Days ({selectedDays.length} selected)
                        </label>
                        <div className="flex gap-2">
                            {weekDays.map((day, index) => (
                                <button
                                    key={day.id}
                                    onClick={() => toggleDay(day.id)}
                                    className={`flex-1 py-3 rounded-lg text-center transition-all ${selectedDays.includes(day.id)
                                        ? 'bg-[var(--color-accent-gold)] text-black font-bold'
                                        : 'bg-[#1A1A1A] text-gray-400 hover:bg-[#2A2A2A]'
                                        }`}
                                >
                                    <div className="text-xs mb-1">{['M', 'Tu', 'W', 'Th', 'F', 'Sa', 'Su'][index]}</div>
                                    <div className="text-[10px] opacity-60 hidden sm:block">{day.label.slice(0, 3)}</div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Objective Selector */}
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-3">
                            Training Objective
                        </label>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            {objectives.map((obj) => (
                                <button
                                    key={obj.id}
                                    onClick={() => setSelectedObjective(obj.id)}
                                    className={`p-3 rounded-lg text-center transition-all ${selectedObjective === obj.id
                                        ? 'bg-[var(--color-accent-gold)]/20 border border-[var(--color-accent-gold)] text-white'
                                        : 'bg-[#1A1A1A] border border-[#2A2A2A] text-gray-400 hover:border-[#444]'
                                        }`}
                                >
                                    <div className="text-xl mb-1">{obj.icon}</div>
                                    <div className="text-xs">{obj.label}</div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Current Active Plan Notice */}
                    {activePlan && (
                        <div className="p-3 bg-blue-900/20 border border-blue-500/30 rounded-lg text-blue-400 text-sm">
                            ℹ️ You already have an active plan: <strong>{activePlan.name}</strong>.
                            Creating a new plan will replace it.
                        </div>
                    )}

                    {/* Error */}
                    {error && (
                        <div className="p-3 bg-red-900/20 border border-red-500/30 rounded-lg text-red-400 text-sm">
                            {error}
                        </div>
                    )}
                </div>
            )}
        </Modal>
    );
}
