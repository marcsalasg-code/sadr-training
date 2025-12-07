/**
 * EmptyState - Estado vacío para listas
 */

import { Button } from './Button';

interface EmptyStateProps {
    icon?: string;
    title: string;
    description?: string;
    action?: {
        label: string;
        onClick: () => void;
    };
}

export function EmptyState({ icon = '📭', title, description, action }: EmptyStateProps) {
    return (
        <div className="flex flex-col items-center justify-center py-12 text-center">
            <span className="text-4xl mb-4 opacity-50">{icon}</span>
            <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-2">
                {title}
            </h3>
            {description && (
                <p className="text-sm text-[var(--color-text-muted)] max-w-sm mb-4">
                    {description}
                </p>
            )}
            {action && (
                <Button onClick={action.onClick}>
                    {action.label}
                </Button>
            )}
        </div>
    );
}
