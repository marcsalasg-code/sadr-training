/**
 * AuraLoadingState - Loading state component with Aura styling
 * 
 * Use this when data is being fetched or processed.
 * Provides consistent loading experience.
 */

interface AuraLoadingStateProps {
    /** Loading message */
    message?: string;
    /** Size variant */
    size?: 'sm' | 'md' | 'lg';
    /** Show skeleton instead of spinner */
    variant?: 'spinner' | 'skeleton' | 'dots';
    /** Additional classes */
    className?: string;
}

export function AuraLoadingState({
    message = 'Loading...',
    size = 'md',
    variant = 'spinner',
    className = '',
}: AuraLoadingStateProps) {
    const sizeClasses = {
        sm: 'py-6 px-4',
        md: 'py-12 px-6',
        lg: 'py-16 px-8',
    };

    const spinnerSizes = {
        sm: 'w-6 h-6',
        md: 'w-10 h-10',
        lg: 'w-14 h-14',
    };

    return (
        <div
            className={`
                flex flex-col items-center justify-center text-center
                ${sizeClasses[size]}
                ${className}
            `}
        >
            {/* Spinner */}
            {variant === 'spinner' && (
                <div
                    className={`
                        ${spinnerSizes[size]}
                        border-2 border-[#2A2A2A] border-t-[var(--color-accent-gold)]
                        rounded-full animate-spin mb-4
                    `}
                />
            )}

            {/* Dots */}
            {variant === 'dots' && (
                <div className="flex gap-1.5 mb-4">
                    {[0, 1, 2].map((i) => (
                        <div
                            key={i}
                            className="w-2.5 h-2.5 rounded-full bg-[var(--color-accent-gold)] animate-pulse"
                            style={{ animationDelay: `${i * 150}ms` }}
                        />
                    ))}
                </div>
            )}

            {/* Skeleton */}
            {variant === 'skeleton' && (
                <div className="w-full max-w-sm space-y-3 mb-4">
                    <div className="h-4 bg-[#1A1A1A] rounded animate-pulse" />
                    <div className="h-4 bg-[#1A1A1A] rounded animate-pulse w-3/4" />
                    <div className="h-4 bg-[#1A1A1A] rounded animate-pulse w-1/2" />
                </div>
            )}

            {/* Message */}
            {message && (
                <p className="text-sm text-gray-500">
                    {message}
                </p>
            )}
        </div>
    );
}
