/**
 * Card - Componente de tarjeta reutilizable
 */

import type { ReactNode, HTMLAttributes } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
    children: ReactNode;
    elevated?: boolean;
    hover?: boolean;
    padding?: 'none' | 'sm' | 'md' | 'lg';
}

const paddingClasses = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
};

export function Card({
    children,
    elevated = false,
    hover = false,
    padding = 'md',
    className = '',
    ...props
}: CardProps) {
    const baseClasses = elevated ? 'card-elevated' : 'card';
    const hoverClasses = hover ? 'hover-lift cursor-pointer' : '';
    const paddingClass = paddingClasses[padding];

    return (
        <div
            className={`${baseClasses} ${hoverClasses} ${paddingClass} ${className}`}
            {...props}
        >
            {children}
        </div>
    );
}
