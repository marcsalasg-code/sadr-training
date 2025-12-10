/**
 * PageContainer - Contenedor base para todas las páginas
 */

import type { ReactNode } from 'react';

interface PageContainerProps {
    title: string;
    subtitle?: string;
    actions?: ReactNode;
    children: ReactNode;
}

export function PageContainer({ title, subtitle, actions, children }: PageContainerProps) {
    return (
        <div className="min-h-screen bg-[var(--color-bg-primary)]">
            {/* Header */}
            <header className="sticky top-0 z-10 bg-[var(--color-bg-primary)]/80 backdrop-blur-md border-b border-[var(--color-border-default)]">
                <div className="px-8 py-6 flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">
                            {title}
                        </h1>
                        {subtitle && (
                            <p className="text-sm text-[var(--color-text-muted)] mt-1">
                                {subtitle}
                            </p>
                        )}
                    </div>
                    {actions && <div className="flex items-center gap-3">{actions}</div>}
                </div>
            </header>

            {/* Content */}
            <main className="p-8">
                {children}
            </main>
        </div>
    );
}
