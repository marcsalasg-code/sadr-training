/**
 * AIInsightBanner - Banner de insights IA contextuales
 * Muestra recomendaciones basadas en plan y adherencia
 */

import { useState } from 'react';
import { AuraButton } from '../ui/aura';

interface AIInsightBannerProps {
    type: 'info' | 'warning' | 'success' | 'tip';
    message: string;
    action?: {
        label: string;
        onClick: () => void;
    };
    dismissible?: boolean;
    onDismiss?: () => void;
}

const TYPE_STYLES: Record<AIInsightBannerProps['type'], { bg: string; border: string; icon: string }> = {
    info: {
        bg: 'bg-blue-500/10',
        border: 'border-blue-500/30',
        icon: '💡'
    },
    warning: {
        bg: 'bg-yellow-500/10',
        border: 'border-yellow-500/30',
        icon: '⚠️'
    },
    success: {
        bg: 'bg-green-500/10',
        border: 'border-green-500/30',
        icon: '🎉'
    },
    tip: {
        bg: 'bg-[var(--color-accent-gold)]/10',
        border: 'border-[var(--color-accent-gold)]/30',
        icon: '🤖'
    }
};

export function AIInsightBanner({
    type,
    message,
    action,
    dismissible = true,
    onDismiss
}: AIInsightBannerProps) {
    const [dismissed, setDismissed] = useState(false);

    if (dismissed) return null;

    const styles = TYPE_STYLES[type];

    const handleDismiss = () => {
        setDismissed(true);
        onDismiss?.();
    };

    return (
        <div className={`
            ${styles.bg} ${styles.border} 
            border rounded-lg p-4
            animate-in slide-in-from-top-2 duration-300
        `}>
            <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 flex-1">
                    <span className="text-lg flex-shrink-0">{styles.icon}</span>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-200">{message}</p>
                        {action && (
                            <AuraButton
                                variant="ghost"
                                size="sm"
                                onClick={action.onClick}
                                className="mt-2 text-[var(--color-accent-gold)]"
                            >
                                {action.label}
                            </AuraButton>
                        )}
                    </div>
                </div>
                {dismissible && (
                    <button
                        onClick={handleDismiss}
                        className="text-gray-500 hover:text-gray-300 transition-colors"
                        aria-label="Dismiss"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                )}
            </div>
        </div>
    );
}

/**
 * Hook para obtener el insight prioritario del día
 */
export function useAIInsight(
    adherence: { percentage: number; completed: number; planned: number },
    hasTodayPlan: boolean,
    hasSessionToday: boolean
): AIInsightBannerProps | null {
    // Priority 1: Low adherence warning
    if (adherence.planned > 0 && adherence.percentage < 50) {
        const remaining = adherence.planned - adherence.completed;
        return {
            type: 'warning',
            message: `You're behind on your weekly goal. ${remaining} sessions remaining to stay on track.`,
            dismissible: true
        };
    }

    // Priority 2: Today's session reminder
    if (hasTodayPlan && !hasSessionToday) {
        return {
            type: 'tip',
            message: "Today is a training day! Ready to start your session?",
            dismissible: true
        };
    }

    // Priority 3: Great adherence
    if (adherence.percentage >= 100) {
        return {
            type: 'success',
            message: "Perfect week! All planned sessions completed. 🎯",
            dismissible: true
        };
    }

    // Priority 4: On track
    if (adherence.percentage >= 80) {
        return {
            type: 'info',
            message: "Great progress! You're on track to meet your weekly goal.",
            dismissible: true
        };
    }

    return null;
}
