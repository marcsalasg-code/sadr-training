/**
 * AppErrorBoundary — Phase 26 Global Error Boundary
 * 
 * Prevents white-screen crashes by catching render errors.
 * Records errors to flight recorder for diagnosis.
 */

import { Component, type ReactNode, type ErrorInfo } from 'react';
import { syncFlightRecorder } from '../../core/observability/syncFlightRecorder';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class AppErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        // Record to flight recorder
        syncFlightRecorder.record({
            runId: 'boundary',
            phase: 'OTHER',
            event: 'ERROR',
            source: 'unknown',
            details: `${error.name}: ${error.message.slice(0, 100)}`,
        });

        // Log to console in development
        if (import.meta.env.DEV) {
            console.error('[AppErrorBoundary] Caught error:', error);
            console.error('[AppErrorBoundary] Component stack:', errorInfo.componentStack);
        }
    }

    handleReload = () => {
        window.location.reload();
    };

    render() {
        if (this.state.hasError) {
            const isDev = import.meta.env.DEV;
            const { error } = this.state;

            return (
                <div className="min-h-screen flex items-center justify-center bg-zinc-900 p-4">
                    <div className="max-w-md w-full bg-zinc-800 rounded-xl p-6 text-center">
                        <div className="text-4xl mb-4">⚠️</div>
                        <h1 className="text-xl font-semibold text-white mb-2">
                            Something went wrong
                        </h1>
                        <p className="text-zinc-400 mb-4">
                            An unexpected error occurred. Please reload the page.
                        </p>

                        {isDev && error && (
                            <pre className="bg-zinc-900 p-3 rounded text-xs text-red-400 text-left mb-4 overflow-x-auto">
                                {error.name}: {error.message}
                            </pre>
                        )}

                        <button
                            onClick={this.handleReload}
                            className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black font-medium rounded-lg transition-colors"
                        >
                            Reload Page
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default AppErrorBoundary;
