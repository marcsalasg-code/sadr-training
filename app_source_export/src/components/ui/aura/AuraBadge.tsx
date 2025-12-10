/**
 * AuraBadge - Etiqueta/badge estilo Aura
 * Variantes de estado y tamaño
 */

import type { ReactNode, HTMLAttributes } from 'react';

type AuraBadgeVariant = 'default' | 'success' | 'warning' | 'error' | 'gold' | 'muted';
type AuraBadgeSize = 'sm' | 'md';

interface AuraBadgeProps extends HTMLAttributes<HTMLSpanElement> {
    children: ReactNode;
    variant?: AuraBadgeVariant;
    size?: AuraBadgeSize;
    dot?: boolean;
}

const variantStyles: Record<AuraBadgeVariant, string> = {
    default: 'bg-gray-800 text-gray-400 border-gray-700',
    success: 'bg-green-900/20 text-green-500 border-green-900/50',
    warning: 'bg-yellow-900/20 text-yellow-500 border-yellow-900/50',
    error: 'bg-red-900/20 text-red-500 border-red-900/50',
    gold: 'bg-[rgba(212,194,154,0.1)] text-[var(--color-accent-gold)] border-[rgba(212,194,154,0.3)]',
    muted: 'bg-[#0A0A0A] text-gray-500 border-[#222]',
};

const sizeStyles: Record<AuraBadgeSize, string> = {
    sm: 'px-1.5 py-0.5 text-[9px]',
    md: 'px-2 py-1 text-[10px]',
};

export function AuraBadge({
    children,
    variant = 'default',
    size = 'md',
    dot = false,
    className = '',
    ...props
}: AuraBadgeProps) {
    return (
        <span
            className={`
                inline-flex items-center gap-1.5
                border rounded
                font-medium uppercase tracking-wide
                ${variantStyles[variant]}
                ${sizeStyles[size]}
                ${className}
            `}
            {...props}
        >
            {dot && (
                <span className={`w-1.5 h-1.5 rounded-full ${variant === 'success' ? 'bg-green-500' :
                        variant === 'warning' ? 'bg-yellow-500' :
                            variant === 'error' ? 'bg-red-500' :
                                variant === 'gold' ? 'bg-[var(--color-accent-gold)]' :
                                    'bg-gray-500'
                    }`} />
            )}
            {children}
        </span>
    );
}
