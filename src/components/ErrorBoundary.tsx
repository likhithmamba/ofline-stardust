// ─── React Error Boundary ────────────────────────────────────────────────────
// P3: Wraps components to catch rendering errors gracefully instead of crashing.
// Ollama errors or malformed data should not take down the entire canvas.

import React, { type ReactNode } from 'react';

interface ErrorBoundaryProps {
    children: ReactNode;
    fallbackMessage?: string;
}

interface ErrorBoundaryState {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, info: React.ErrorInfo) {
        console.error('[ErrorBoundary] Caught:', error, info.componentStack);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="flex flex-col items-center justify-center p-8 text-center">
                    <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center mb-4">
                        <span className="text-red-400 text-xl">⚠</span>
                    </div>
                    <h3 className="text-white font-medium mb-2">
                        {this.props.fallbackMessage || 'Something went wrong'}
                    </h3>
                    <p className="text-slate-400 text-sm mb-4 max-w-md">
                        {this.state.error?.message || 'An unexpected error occurred.'}
                    </p>
                    <button
                        onClick={() => this.setState({ hasError: false, error: null })}
                        className="px-4 py-2 bg-purple-600/20 text-purple-400 hover:bg-purple-600 hover:text-white rounded-lg transition-all text-sm"
                    >
                        Try Again
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}
