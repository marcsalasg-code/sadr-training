/**
 * AuraEmptyState - Empty state component with coach-friendly messaging
 * 
 * Use this when a view has no data to display.
 * Provides consistent styling and optional action button.
 */

import { AuraButton } from './AuraButton';

interface AuraEmptyStateProps {
    /** Emoji or icon to display */
    icon?: string;
    /** Main title - should be motivational */
    title: string;
    /** Description - coach-friendly language */
    description?: string;
    /** Optional action button */
    action?: {
        label: string;
        onClick: () => void;
    };
    /** Size variant */
    size?: 'sm' | 'md' | 'lg';
    /** Additional classes */
    className?: string;
}

export function AuraEmptyState({
    icon = '📋',
    title,
    description,
    action,
    size = 'md',
    className = '',
}: AuraEmptyStateProps) {
    const sizeClasses = {
        sm: 'py-6 px-4',
        md: 'py-12 px-6',
        lg: 'py-16 px-8',
    };

    const iconSizes = {
        sm: 'text-3xl',
        md: 'text-5xl',
        lg: 'text-6xl',
    };

    const titleSizes = {
        sm: 'text-base',
        md: 'text-lg',
        lg: 'text-xl',
    };

    return (
        <div
            className={`
                flex flex-col items-center justify-center text-center
                bg-[#0A0A0A]/50 border border-[#1A1A1A] rounded-xl
                ${sizeClasses[size]}
                ${className}
            `}
        >
            {/* Icon */}
            <div className={`${iconSizes[size]} mb-4 opacity-60`}>
                {icon}
            </div>

            {/* Title */}
            <h3 className={`${titleSizes[size]} font-medium text-white mb-2`}>
                {title}
            </h3>

            {/* Description */}
            {description && (
                <p className="text-sm text-gray-500 max-w-xs mb-4">
                    {description}
                </p>
            )}

            {/* Action */}
            {action && (
                <AuraButton
                    variant="gold"
                    size={size === 'lg' ? 'md' : 'sm'}
                    onClick={action.onClick}
                >
                    {action.label}
                </AuraButton>
            )}
        </div>
    );
}
