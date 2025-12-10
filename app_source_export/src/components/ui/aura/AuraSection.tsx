/**
 * AuraSection - Sección con título y acciones
 * Wrapper para agrupar contenido con header
 */

import type { ReactNode, HTMLAttributes } from 'react';

interface AuraSectionProps extends HTMLAttributes<HTMLElement> {
    children?: ReactNode;
    title?: string;
    subtitle?: string;
    action?: ReactNode;
    spacing?: 'sm' | 'md' | 'lg';
}

const spacingStyles = {
    sm: 'space-y-4',
    md: 'space-y-6',
    lg: 'space-y-8',
};

export function AuraSection({
    children,
    title,
    subtitle,
    action,
    spacing = 'md',
    className = '',
    ...props
}: AuraSectionProps) {
    return (
        <section className={`${spacingStyles[spacing]} ${className}`} {...props}>
            {/* Header */}
            {(title || action) && (
                <header className="flex justify-between items-end">
                    <div>
                        {title && (
                            <h2 className="text-2xl text-white font-semibold tracking-tight">
                                {title}
                            </h2>
                        )}
                        {subtitle && (
                            <p className="text-gray-500 text-sm mt-1">
                                {subtitle}
                            </p>
                        )}
                    </div>
                    {action && (
                        <div className="flex gap-2">
                            {action}
                        </div>
                    )}
                </header>
            )}

            {/* Content */}
            {children}
        </section>
    );
}
