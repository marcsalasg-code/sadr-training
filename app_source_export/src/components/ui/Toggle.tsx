/**
 * Toggle - Switch/toggle reutilizable
 */

interface ToggleProps {
    label?: string;
    description?: string;
    checked: boolean;
    onChange: (checked: boolean) => void;
    disabled?: boolean;
}

export function Toggle({ label, description, checked, onChange, disabled = false }: ToggleProps) {
    return (
        <label className={`flex items-start gap-3 cursor-pointer ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
            <div className="relative mt-0.5">
                <input
                    type="checkbox"
                    checked={checked}
                    onChange={(e) => !disabled && onChange(e.target.checked)}
                    className="sr-only"
                    disabled={disabled}
                />
                <div
                    className={`w-11 h-6 rounded-full transition-colors duration-200 ${checked
                            ? 'bg-[var(--color-accent-gold)]'
                            : 'bg-[var(--color-bg-elevated)] border border-[var(--color-border-default)]'
                        }`}
                />
                <div
                    className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full transition-transform duration-200 ${checked
                            ? 'translate-x-5 bg-[var(--color-text-inverted)]'
                            : 'translate-x-0 bg-[var(--color-text-muted)]'
                        }`}
                />
            </div>
            {(label || description) && (
                <div className="flex-1">
                    {label && (
                        <span className="block text-sm font-medium text-[var(--color-text-primary)]">
                            {label}
                        </span>
                    )}
                    {description && (
                        <span className="block text-xs text-[var(--color-text-muted)] mt-0.5">
                            {description}
                        </span>
                    )}
                </div>
            )}
        </label>
    );
}
