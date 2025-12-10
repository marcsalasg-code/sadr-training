/**
 * AuraDivider - Línea divisora estilo Aura
 */

import type { HTMLAttributes } from 'react';

interface AuraDividerProps extends HTMLAttributes<HTMLDivElement> {
    variant?: 'default' | 'subtle' | 'accent';
    spacing?: 'sm' | 'md' | 'lg';
}

const variantStyles = {
    default: 'bg-[#2A2A2A]',
    subtle: 'bg-[#1A1A1A]',
    accent: 'bg-gradient-to-r from-transparent via-[var(--color-accent-gold)]/30 to-transparent',
};

const spacingStyles = {
    sm: 'my-4',
    md: 'my-6',
    lg: 'my-8',
};

export function AuraDivider({
    variant = 'default',
    spacing = 'md',
    className = '',
    ...props
}: AuraDividerProps) {
    return (
        <div
            className={`w-full h-px ${variantStyles[variant]} ${spacingStyles[spacing]} ${className}`}
            {...props}
        />
    );
}
