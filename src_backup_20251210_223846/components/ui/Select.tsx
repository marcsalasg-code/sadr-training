/**
 * Select - Campo de selección reutilizable
 */

import { forwardRef, type SelectHTMLAttributes } from 'react';

interface SelectOption {
    value: string;
    label: string;
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
    label?: string;
    options: SelectOption[];
    error?: string;
    placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
    ({ label, options, error, placeholder, className = '', ...props }, ref) => {
        return (
            <div className="w-full">
                {label && (
                    <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                        {label}
                    </label>
                )}
                <select
                    ref={ref}
                    className={`input appearance-none cursor-pointer pr-10 bg-[url('data:image/svg+xml;charset=UTF-8,%3csvg xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 24 24%27 fill=%27none%27 stroke=%27%23a3a3a3%27 stroke-width=%272%27%3e%3cpath d=%27M6 9l6 6 6-6%27/%3e%3c/svg%3e')] bg-no-repeat bg-[right_0.75rem_center] bg-[length:1rem] ${error ? 'border-red-500' : ''} ${className}`}
                    {...props}
                >
                    {placeholder && (
                        <option value="" disabled>
                            {placeholder}
                        </option>
                    )}
                    {options.map((option) => (
                        <option key={option.value} value={option.value}>
                            {option.label}
                        </option>
                    ))}
                </select>
                {error && (
                    <p className="mt-1.5 text-xs text-red-400">{error}</p>
                )}
            </div>
        );
    }
);

Select.displayName = 'Select';
