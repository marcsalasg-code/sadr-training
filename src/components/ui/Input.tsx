/**
 * Input - Campo de entrada reutilizable
 */

import { forwardRef, type InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    hint?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
    ({ label, error, hint, className = '', ...props }, ref) => {
        return (
            <div className="w-full">
                {label && (
                    <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                        {label}
                    </label>
                )}
                <input
                    ref={ref}
                    className={`input ${error ? 'border-red-500 focus:border-red-500' : ''} ${className}`}
                    {...props}
                />
                {hint && !error && (
                    <p className="mt-1.5 text-xs text-[var(--color-text-muted)]">{hint}</p>
                )}
                {error && (
                    <p className="mt-1.5 text-xs text-red-400">{error}</p>
                )}
            </div>
        );
    }
);

Input.displayName = 'Input';
