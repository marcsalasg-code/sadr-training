/**
 * AuraMetric - Tarjeta de métrica estilo Aura
 * Bevel metálico, glow sutil, indicador de tendencia
 */

import type { HTMLAttributes } from 'react';

interface AuraMetricProps extends HTMLAttributes<HTMLDivElement> {
    label: string;
    value: string | number;
    icon?: React.ReactNode;
    trend?: {
        value: number;
        isPositive: boolean;
    };
    variant?: 'default' | 'compact';
}

export function AuraMetric({
    label,
    value,
    icon,
    trend,
    variant = 'default',
    className = '',
    ...props
}: AuraMetricProps) {
    const isCompact = variant === 'compact';

    return (
        <div
            className={`
                bg-[#141414] border border-[#2A2A2A] rounded-lg
                relative group
                hover:border-[rgba(212,194,154,0.3)] transition-all
                ${isCompact ? 'p-3' : 'p-4'}
                ${className}
            `}
            {...props}
        >
            {/* Rivet indicator */}
            <div className="absolute top-2 right-2 w-1 h-1 bg-[#2A2A2A] rounded-full group-hover:bg-[var(--color-accent-gold)] transition-colors" />

            {/* Label */}
            <span className="text-[10px] text-gray-500 uppercase tracking-widest">
                {label}
            </span>

            {/* Value + Trend */}
            <div className={`flex items-baseline gap-2 ${isCompact ? 'mt-1' : 'mt-2'}`}>
                <span className={`font-mono text-white ${isCompact ? 'text-lg' : 'text-2xl'}`}>
                    {value}
                </span>
                {trend && (
                    <span className={`text-[10px] font-mono ${trend.isPositive ? 'text-green-500' : 'text-red-500'}`}>
                        {trend.isPositive ? '+' : ''}{trend.value}%
                    </span>
                )}
            </div>

            {/* Icon */}
            {icon && (
                <div className="absolute bottom-3 right-3 text-gray-600 group-hover:text-[var(--color-accent-gold)] transition-colors">
                    {icon}
                </div>
            )}
        </div>
    );
}
