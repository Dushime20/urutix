import React from 'react';

export class DetailedErrorBoundary extends React.Component<
    { children: React.ReactNode },
    { hasError: boolean; error: Error | null; errorInfo: React.ErrorInfo | null }
> {
    constructor(props: { children: React.ReactNode }) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error: Error) {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error("DetailedErrorBoundary caught:", error, errorInfo);
        this.setState({ errorInfo });
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="bg-red-50 border border-red-200 p-6 rounded-lg m-4">
                    <h2 className="text-xl font-bold text-red-800 mb-2">Something went wrong showing this section</h2>
                    <details className="whitespace-pre-wrap text-sm text-red-700 bg-red-100 p-4 rounded border border-red-200">
                        <summary className="cursor-pointer font-medium mb-2">View Error Details</summary>
                        {this.state.error && this.state.error.toString()}
                        <br />
                        {this.state.errorInfo && this.state.errorInfo.componentStack}
                    </details>
                    <button
                        className="mt-4 px-4 py-2 bg-red-700 text-white rounded hover:bg-red-800"
                        onClick={() => window.location.reload()}
                    >
                        Refresh Page
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}
