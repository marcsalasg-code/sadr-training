/**
 * TrainingPlanBanner - Active training plan context banner
 */

import { AuraPanel, AuraBadge } from '../ui/aura';

interface TrainingPlanBannerProps {
    planName: string;
    todaySessionType?: string;
    todayIntensity?: string;
    weeklyCompleted: number;
    weeklyPlanned: number;
    weeklyPercentage: number;
    weeklyScore?: number;
}

export function TrainingPlanBanner({
    planName,
    todaySessionType,
    todayIntensity,
    weeklyCompleted,
    weeklyPlanned,
    weeklyPercentage,
    weeklyScore,
}: TrainingPlanBannerProps) {
    return (
        <AuraPanel variant="default" className="border-l-2 border-[var(--color-accent-gold)]">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <span className="text-lg">📋</span>
                    <div>
                        <p className="text-sm font-medium text-white">{planName}</p>
                        <p className="text-xs text-gray-500">
                            {todaySessionType
                                ? `Today: ${todaySessionType} • ${todayIntensity || 'moderate'}`
                                : 'Rest day'
                            }
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <div className="text-right">
                        <p className="text-xs text-gray-500">Weekly Progress</p>
                        <p className="text-sm font-mono text-[var(--color-accent-gold)]">
                            {weeklyCompleted}/{weeklyPlanned} ({weeklyPercentage}%)
                        </p>
                    </div>
                    <div className="h-8 w-8 rounded-full bg-[#1A1A1A] flex items-center justify-center">
                        <span className={`text-xs font-bold ${weeklyPercentage >= 80 ? 'text-green-400' : weeklyPercentage >= 50 ? 'text-yellow-400' : 'text-red-400'}`}>
                            {weeklyScore?.toFixed(0) || 0}
                        </span>
                    </div>
                </div>
            </div>
        </AuraPanel>
    );
}
