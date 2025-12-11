/**
 * Badge - Componente de etiqueta/badge
 */

import type { ReactNode } from 'react';

interface BadgeProps {
    children: ReactNode;
    variant?: 'default' | 'gold' | 'success' | 'warning' | 'error';
    size?: 'sm' | 'md';
}

const variantClasses = {
    default: 'badge',
    gold: 'badge badge-gold',
    success: 'badge bg-green-500/15 text-green-400 border-green-500/30',
    warning: 'badge bg-amber-500/15 text-amber-400 border-amber-500/30',
    error: 'badge bg-red-500/15 text-red-400 border-red-500/30',
};

const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-xs px-3 py-1',
};

export function Badge({ children, variant = 'default', size = 'md' }: BadgeProps) {
    return (
        <span className={`${variantClasses[variant]} ${sizeClasses[size]}`}>
            {children}
        </span>
    );
}
