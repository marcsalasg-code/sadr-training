/**
 * AuraPanel - Panel destacado estilo Aura
 * Con esquinas decorativas, efecto glass, borde accent
 */

import type { ReactNode, HTMLAttributes } from 'react';

type AuraPanelVariant = 'default' | 'accent' | 'highlight' | 'terminal';

interface AuraPanelProps extends HTMLAttributes<HTMLDivElement> {
    children: ReactNode;
    variant?: AuraPanelVariant;
    corners?: boolean;
    glass?: boolean;
    header?: ReactNode;
}

const variantStyles: Record<AuraPanelVariant, string> = {
    default: 'bg-[#141414] border-[#2A2A2A]',
    accent: 'bg-gradient-to-br from-[#1A1A1A] to-[#0F0F0F] border-[rgba(212,194,154,0.2)]',
    highlight: 'bg-[rgba(212,194,154,0.05)] border-[rgba(212,194,154,0.3)]',
    terminal: 'bg-[#050505] border-[#2A2A2A] font-mono',
};

export function AuraPanel({
    children,
    variant = 'default',
    corners = false,
    glass = false,
    header,
    className = '',
    ...props
}: AuraPanelProps) {
    const glassClass = glass
        ? 'bg-[rgba(20,20,20,0.6)] backdrop-blur-[12px] border-[rgba(255,255,255,0.05)]'
        : '';

    return (
        <div
            className={`
                border rounded-lg relative
                ${variantStyles[variant]}
                ${glassClass}
                ${variant === 'accent' ? 'shadow-lg' : ''}
                ${className}
            `}
            {...props}
        >
            {/* Decorative Corners */}
            {corners && (
                <>
                    <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-[var(--color-accent-gold)]" />
                    <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-[var(--color-accent-gold)]" />
                </>
            )}

            {/* Header */}
            {header && (
                <div className="px-4 py-3 border-b border-[#2A2A2A] bg-[#1A1A1A] rounded-t-lg">
                    {header}
                </div>
            )}

            {/* Content */}
            <div className={header ? 'p-4' : 'p-6'}>
                {children}
            </div>
        </div>
    );
}
