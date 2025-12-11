/**
 * AthleteQuickActions - Quick action buttons panel for athlete
 */

import { AuraPanel, AuraButton } from '../ui/aura';

interface AthleteQuickActionsProps {
    athleteId: string;
    hasLastSession: boolean;
    onViewCalendar: () => void;
    onViewAnalytics: () => void;
    onOpenPlanModal: () => void;
    onRepeatLastSession: () => void;
}

export function AthleteQuickActions({
    hasLastSession,
    onViewCalendar,
    onViewAnalytics,
    onOpenPlanModal,
    onRepeatLastSession,
}: AthleteQuickActionsProps) {
    return (
        <AuraPanel header={<span className="text-white text-sm font-medium">🚀 Acciones Rápidas</span>}>
            <div className="flex flex-wrap gap-3">
                <AuraButton variant="secondary" onClick={onViewCalendar}>
                    📅 Ver Calendario
                </AuraButton>
                <AuraButton variant="secondary" onClick={onViewAnalytics}>
                    📊 Ver Analytics
                </AuraButton>
                <AuraButton variant="gold" onClick={onOpenPlanModal}>
                    🤖 Plan IA
                </AuraButton>
                {hasLastSession && (
                    <AuraButton variant="secondary" onClick={onRepeatLastSession}>
                        🔄 Repetir Última
                    </AuraButton>
                )}
            </div>
        </AuraPanel>
    );
}
