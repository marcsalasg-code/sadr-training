/**
 * AuraCard - Tarjeta básica estilo Aura
 * Fondo metálico oscuro, bordes sutiles, hover dorado
 */

import type { ReactNode, HTMLAttributes } from 'react';

type AuraCardVariant = 'solid' | 'bordered' | 'glass';
type AuraCardSize = 'sm' | 'md' | 'lg';

interface AuraCardProps extends HTMLAttributes<HTMLDivElement> {
    children: ReactNode;
    variant?: AuraCardVariant;
    size?: AuraCardSize;
    hover?: boolean;
    active?: boolean;
}

const variantStyles: Record<AuraCardVariant, string> = {
    solid: 'bg-[#141414] border border-[#2A2A2A]',
    bordered: 'bg-transparent border border-[#2A2A2A]',
    glass: 'bg-[rgba(20,20,20,0.6)] backdrop-blur-[12px] border border-[rgba(255,255,255,0.05)]',
};

const sizeStyles: Record<AuraCardSize, string> = {
    sm: 'p-3 rounded',
    md: 'p-4 rounded-lg',
    lg: 'p-6 rounded-lg',
};

export function AuraCard({
    children,
    variant = 'solid',
    size = 'md',
    hover = false,
    active = false,
    className = '',
    ...props
}: AuraCardProps) {
    const hoverClass = hover
        ? 'cursor-pointer transition-all hover:border-[rgba(212,194,154,0.3)] hover:shadow-[0_0_0_1px_rgba(212,194,154,0.1)]'
        : '';
    const activeClass = active ? 'border-[var(--color-accent-gold)]/30' : '';

    return (
        <div
            className={`
                ${variantStyles[variant]}
                ${sizeStyles[size]}
                ${hoverClass}
                ${activeClass}
                relative
                ${className}
            `}
            {...props}
        >
            {children}
        </div>
    );
}
