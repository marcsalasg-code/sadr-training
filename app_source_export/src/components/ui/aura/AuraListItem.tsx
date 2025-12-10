/**
 * AuraListItem - Elemento de lista clicable estilo Aura
 * Con título, subtítulo, meta y estado activo
 */

import type { ReactNode, HTMLAttributes } from 'react';

interface AuraListItemProps extends HTMLAttributes<HTMLDivElement> {
    title: string;
    subtitle?: string;
    meta?: ReactNode;
    active?: boolean;
    onClick?: () => void;
    leftContent?: ReactNode;
    rightContent?: ReactNode;
}

export function AuraListItem({
    title,
    subtitle,
    meta,
    active = false,
    onClick,
    leftContent,
    rightContent,
    className = '',
    ...props
}: AuraListItemProps) {
    return (
        <div
            onClick={onClick}
            className={`
                flex items-center justify-between
                p-3 rounded-lg
                transition-all
                ${active
                    ? 'bg-[#1A1A1A] border border-[rgba(212,194,154,0.3)]'
                    : 'bg-[#141414] border border-[#2A2A2A] hover:border-[var(--color-accent-gold)] hover:bg-[#1A1A1A]'
                }
                ${onClick ? 'cursor-pointer' : ''}
                ${className}
            `}
            {...props}
        >
            <div className="flex items-center gap-3">
                {leftContent}
                <div>
                    <p className={`text-sm font-medium ${active ? 'text-[var(--color-accent-gold)]' : 'text-white'}`}>
                        {title}
                    </p>
                    {subtitle && (
                        <p className="text-[10px] text-gray-500 font-mono mt-0.5">
                            {subtitle}
                        </p>
                    )}
                </div>
            </div>

            <div className="flex items-center gap-3">
                {meta && (
                    <div className="text-right">
                        {meta}
                    </div>
                )}
                {rightContent}
            </div>
        </div>
    );
}
