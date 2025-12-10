/**
 * AuraSurface - Contenedor glass/metálico para grupos
 */

import type { ReactNode, HTMLAttributes } from 'react';

interface AuraSurfaceProps extends HTMLAttributes<HTMLDivElement> {
    children: ReactNode;
    glass?: boolean;
    bordered?: boolean;
    padding?: 'none' | 'sm' | 'md' | 'lg';
}

const paddingStyles = {
    none: '',
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6',
};

export function AuraSurface({
    children,
    glass = false,
    bordered = true,
    padding = 'md',
    className = '',
    ...props
}: AuraSurfaceProps) {
    const baseClass = glass
        ? 'bg-[rgba(20,20,20,0.6)] backdrop-blur-[12px]'
        : 'bg-[#0F0F0F]';

    const borderClass = bordered
        ? glass
            ? 'border border-[rgba(255,255,255,0.05)]'
            : 'border border-[#2A2A2A]'
        : '';

    return (
        <div
            className={`
                ${baseClass}
                ${borderClass}
                ${paddingStyles[padding]}
                rounded-lg
                ${className}
            `}
            {...props}
        >
            {children}
        </div>
    );
}
