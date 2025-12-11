/**
 * SessionsProgressWidget - Componente inteligente de progreso semanal
 * Muestra adherencia, días de entrenamiento y permite edición
 */

import { AuraBadge } from '../ui/aura';
import type { TrainingPlan, WeeklyAdherence, WeekDay } from '../../types/types';

interface SessionsProgressWidgetProps {
    activePlan: TrainingPlan | undefined;
    adherence: WeeklyAdherence;
    onEditPlan: () => void;
    onCreatePlan: () => void;
}

const DAY_LABELS: Record<WeekDay, string> = {
    monday: 'L',
    tuesday: 'M',
    wednesday: 'X',
    thursday: 'J',
    friday: 'V',
    saturday: 'S',
    sunday: 'D'
};

const DAY_ORDER: WeekDay[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

export function SessionsProgressWidget({
    activePlan,
    adherence,
    onEditPlan,
    onCreatePlan
}: SessionsProgressWidgetProps) {
    // No plan state
    if (!activePlan) {
        return (
            <div
                onClick={onCreatePlan}
                className="cursor-pointer hover:scale-[1.02] transition-transform"
            >
                <div className="bg-[#0F0F0F] border border-[#2A2A2A] rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-gray-500">Sessions</span>
                        <AuraBadge variant="default">Set Plan →</AuraBadge>
                    </div>
                    <div className="text-2xl font-bold text-white font-mono">--/--</div>
                    <p className="text-xs text-gray-500 mt-2">
                        Create a training plan to track your weekly progress
                    </p>
                </div>
            </div>
        );
    }

    // With plan state
    const today = new Date().getDay();
    const todayIndex = today === 0 ? 6 : today - 1; // Convert to Monday-first index

    const getStatusMessage = () => {
        const { completed, planned, percentage } = adherence;
        const remaining = planned - completed;

        if (percentage >= 100) return '🎉 Week complete!';
        if (percentage >= 80) return '💪 Almost there!';
        if (percentage >= 50) return `${remaining} sessions remaining`;
        if (percentage > 0) return '📈 Keep pushing!';
        return 'Start your first session';
    };

    return (
        <div className="bg-[#0F0F0F] border border-[#2A2A2A] rounded-lg p-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-gray-500">Weekly Sessions</span>
                <button
                    onClick={onEditPlan}
                    className="text-[10px] text-[var(--color-accent-gold)] hover:underline"
                >
                    Edit Days
                </button>
            </div>

            {/* Main Value */}
            <div className="flex items-baseline gap-2 mb-3">
                <span className="text-2xl font-bold text-white font-mono">
                    {adherence.completed}/{adherence.planned}
                </span>
                <span className="text-sm text-[var(--color-accent-gold)]">
                    {adherence.percentage}%
                </span>
            </div>

            {/* Progress Bar */}
            <div className="h-1.5 bg-[#222] rounded-full overflow-hidden mb-3">
                <div
                    className="h-full bg-[var(--color-accent-gold)] transition-all duration-300"
                    style={{ width: `${Math.min(100, adherence.percentage)}%` }}
                />
            </div>

            {/* Day Pills */}
            <div className="flex gap-1 mb-3">
                {DAY_ORDER.map((day, index) => {
                    const isTrainingDay = activePlan.weekDays.includes(day);
                    const isPast = index < todayIndex;
                    const isToday = index === todayIndex;

                    // Determine if completed based on adherence
                    const isCompleted = isTrainingDay && isPast && (
                        DAY_ORDER.slice(0, index + 1)
                            .filter(d => activePlan.weekDays.includes(d)).length <= adherence.completed
                    );

                    return (
                        <div
                            key={day}
                            className={`
                                w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-medium
                                ${isToday ? 'ring-1 ring-[var(--color-accent-gold)]' : ''}
                                ${isTrainingDay
                                    ? isCompleted
                                        ? 'bg-green-500/20 text-green-400'
                                        : 'bg-[var(--color-accent-gold)]/20 text-[var(--color-accent-gold)]'
                                    : 'bg-[#1A1A1A] text-gray-600'
                                }
                            `}
                        >
                            {DAY_LABELS[day]}
                        </div>
                    );
                })}
            </div>

            {/* Status Message */}
            <p className="text-xs text-gray-400">
                {getStatusMessage()}
            </p>
        </div>
    );
}
