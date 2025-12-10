/**
 * ErrorBoundary - Global error boundary with Aura styling
 * 
 * Catches React errors and displays a fallback UI.
 * Logs errors for debugging.
 */

import { Component, type ReactNode, type ErrorInfo } from 'react';
import { AuraEmptyState } from '../ui/aura';

interface ErrorBoundaryProps {
    children: ReactNode;
    /** Optional custom fallback UI */
    fallback?: ReactNode;
    /** Optional error handler */
    onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface ErrorBoundaryState {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
        console.error('[ErrorBoundary] Caught error:', error);
        console.error('[ErrorBoundary] Component stack:', errorInfo.componentStack);

        // Call optional error handler
        this.props.onError?.(error, errorInfo);
    }

    handleReset = (): void => {
        this.setState({ hasError: false, error: null });
    };

    render(): ReactNode {
        if (this.state.hasError) {
            // Custom fallback
            if (this.props.fallback) {
                return this.props.fallback;
            }

            // Default Aura-styled fallback
            return (
                <div className="flex items-center justify-center min-h-[400px] p-8">
                    <AuraEmptyState
                        icon="⚠️"
                        title="Something went wrong"
                        description="An unexpected error occurred. Try refreshing the page."
                        action={{
                            label: 'Try Again',
                            onClick: this.handleReset,
                        }}
                    />
                </div>
            );
        }

        return this.props.children;
    }
}
