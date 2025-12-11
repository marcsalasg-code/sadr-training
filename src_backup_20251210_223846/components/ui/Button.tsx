/**
 * Button - Componente de botón reutilizable
 */

import type { ButtonHTMLAttributes, ReactNode } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    children: ReactNode;
    variant?: 'primary' | 'secondary' | 'ghost';
    size?: 'sm' | 'md' | 'lg';
    fullWidth?: boolean;
}

const sizeClasses = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2.5 text-sm',
    lg: 'px-6 py-3 text-base',
};

export function Button({
    children,
    variant = 'primary',
    size = 'md',
    fullWidth = false,
    className = '',
    ...props
}: ButtonProps) {
    const variantClass = `btn-${variant}`;
    const sizeClass = sizeClasses[size];
    const widthClass = fullWidth ? 'w-full' : '';

    return (
        <button
            className={`btn ${variantClass} ${sizeClass} ${widthClass} ${className}`}
            {...props}
        >
            {children}
        </button>
    );
}
