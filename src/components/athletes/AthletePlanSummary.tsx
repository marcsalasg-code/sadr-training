/**
 * AthletePlanSummary - Active training plan summary panel
 */

import { AuraPanel, AuraButton, AuraBadge } from '../ui/aura';

interface TrainingPlanData {
    name: string;
    objective?: string;
    sessionsPerWeek?: number;
    dayPlansCount?: number;
}

interface AthletePlanSummaryProps {
    plan: TrainingPlanData;
    isActivePlan: boolean;
    onOpenPlanModal: () => void;
}

export function AthletePlanSummary({
    plan,
    isActivePlan,
    onOpenPlanModal,
}: AthletePlanSummaryProps) {
    return (
        <AuraPanel header={
            <div className="flex items-center gap-2">
                <span className="text-white text-sm font-medium">📋 Plan Activo</span>
                {isActivePlan && <AuraBadge variant="gold">Principal</AuraBadge>}
            </div>
        }>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="text-center p-3 rounded-lg bg-[#141414]">
                    <p className="text-lg font-semibold text-white">{plan.name}</p>
                    <p className="text-xs text-gray-500">Nombre del Plan</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-[#141414]">
                    <p className="text-lg font-semibold text-[var(--color-accent-gold)] capitalize">
                        {plan.objective || '-'}
                    </p>
                    <p className="text-xs text-gray-500">Objetivo</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-[#141414]">
                    <p className="text-lg font-semibold text-white">{plan.sessionsPerWeek || '-'}</p>
                    <p className="text-xs text-gray-500">Días/Semana</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-[#141414]">
                    <p className="text-lg font-semibold text-white">{plan.dayPlansCount || '-'}</p>
                    <p className="text-xs text-gray-500">Días/Plan</p>
                </div>
            </div>
            <AuraButton
                variant="secondary"
                size="sm"
                onClick={onOpenPlanModal}
            >
                Ver/Editar Plan Completo →
            </AuraButton>
        </AuraPanel>
    );
}
