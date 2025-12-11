/**
 * AIQuotaIndicator - Indicador de créditos de IA restantes
 * Muestra peticiones restantes con código de color
 */

import { useAIQuota } from '../../ai/aiStore';

interface AIQuotaIndicatorProps {
    size?: 'sm' | 'md';
    showLabel?: boolean;
}

export function AIQuotaIndicator({ size = 'sm', showLabel = true }: AIQuotaIndicatorProps) {
    const quota = useAIQuota();
    const remaining = Math.max(0, quota.dailyLimit - quota.usedToday);
    const percentage = (remaining / quota.dailyLimit) * 100;

    const colorClass = percentage > 50 ? 'text-green-400'
        : percentage > 20 ? 'text-yellow-400'
            : 'text-red-400';

    const bgClass = percentage > 50 ? 'bg-green-500/10'
        : percentage > 20 ? 'bg-yellow-500/10'
            : 'bg-red-500/10';

    return (
        <div className={`flex items-center gap-2 px-2 py-1 rounded ${bgClass}`}>
            <div className={`font-mono ${size === 'sm' ? 'text-xs' : 'text-sm'} ${colorClass}`}>
                🤖 {remaining}
            </div>
            {showLabel && (
                <span className="text-xs text-gray-500">restantes</span>
            )}
        </div>
    );
}
