/**
 * AuraGrid - Helper de layouts con grid
 */

import type { ReactNode, HTMLAttributes } from 'react';

interface AuraGridProps extends HTMLAttributes<HTMLDivElement> {
    children: ReactNode;
    cols?: 1 | 2 | 3 | 4 | 5 | 6;
    gap?: 'sm' | 'md' | 'lg';
    responsive?: boolean;
}

const colStyles = {
    1: 'grid-cols-1',
    2: 'grid-cols-2',
    3: 'grid-cols-3',
    4: 'grid-cols-4',
    5: 'grid-cols-5',
    6: 'grid-cols-6',
};

const responsiveCols = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-2 md:grid-cols-4',
    5: 'grid-cols-2 md:grid-cols-3 lg:grid-cols-5',
    6: 'grid-cols-2 md:grid-cols-3 lg:grid-cols-6',
};

const gapStyles = {
    sm: 'gap-3',
    md: 'gap-4',
    lg: 'gap-6',
};

export function AuraGrid({
    children,
    cols = 2,
    gap = 'md',
    responsive = true,
    className = '',
    ...props
}: AuraGridProps) {
    const colClass = responsive ? responsiveCols[cols] : colStyles[cols];

    return (
        <div
            className={`grid ${colClass} ${gapStyles[gap]} ${className}`}
            {...props}
        >
            {children}
        </div>
    );
}
