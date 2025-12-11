/**
 * AuraButton - Botón estilo Aura
 * Variantes solid/ghost/gold, tamaños, iconos
 */

import type { ReactNode, ButtonHTMLAttributes } from 'react';

type AuraButtonVariant = 'primary' | 'secondary' | 'ghost' | 'gold';
type AuraButtonSize = 'sm' | 'md' | 'lg';

interface AuraButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    children: ReactNode;
    variant?: AuraButtonVariant;
    size?: AuraButtonSize;
    icon?: ReactNode;
    iconPosition?: 'left' | 'right';
    loading?: boolean;
    fullWidth?: boolean;
}

const variantStyles: Record<AuraButtonVariant, string> = {
    primary: `
        bg-white text-black font-bold
        hover:bg-gray-200
    `,
    secondary: `
        bg-[#1A1A1A] border border-[#333] text-white
        hover:border-[var(--color-accent-gold)] hover:text-[var(--color-accent-gold)]
    `,
    ghost: `
        bg-transparent text-gray-400
        hover:text-white hover:bg-[#1A1A1A]
    `,
    gold: `
        bg-[var(--color-accent-gold)] text-black font-bold
        hover:bg-[#C2B088]
        shadow-[0_0_15px_rgba(212,194,154,0.15)]
    `,
};

const sizeStyles: Record<AuraButtonSize, string> = {
    sm: 'px-2 py-1 text-xs rounded',
    md: 'px-4 py-2 text-sm rounded',
    lg: 'px-6 py-3 text-base rounded-lg',
};

export function AuraButton({
    children,
    variant = 'secondary',
    size = 'md',
    icon,
    iconPosition = 'left',
    loading = false,
    fullWidth = false,
    className = '',
    disabled,
    ...props
}: AuraButtonProps) {
    return (
        <button
            className={`
                inline-flex items-center justify-center gap-2
                transition-all duration-200
                ${variantStyles[variant]}
                ${sizeStyles[size]}
                ${fullWidth ? 'w-full' : ''}
                ${disabled || loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                ${className}
            `}
            disabled={disabled || loading}
            {...props}
        >
            {loading && (
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
            )}
            {!loading && icon && iconPosition === 'left' && icon}
            {children}
            {!loading && icon && iconPosition === 'right' && icon}
        </button>
    );
}
