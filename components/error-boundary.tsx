/**
 * Error Boundary Component
 * Catches React errors and reports to Sentry
 * Phase 3: MONITOR-001
 */

'use client';

import React, { Component, ReactNode } from 'react';
import { captureException } from '@/lib/sentry';
import { logger } from '@/lib/logger';

// ============================================================
// TYPES
// ============================================================

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

// ============================================================
// ERROR BOUNDARY COMPONENT
// ============================================================

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error Boundary caught exception:', error, errorInfo);
    }

    // Log to Winston
    logger.error('React Error Boundary caught exception', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
    });

    // Report to Sentry
    captureException(error, {
      componentStack: errorInfo.componentStack,
    });

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Update state
    this.setState({
      error,
      errorInfo,
    });
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return <DefaultErrorFallback error={this.state.error} onReset={this.handleReset} />;
    }

    return this.props.children;
  }
}

// ============================================================
// DEFAULT ERROR FALLBACK UI
// ============================================================

interface DefaultErrorFallbackProps {
  error: Error | null;
  onReset: () => void;
}

function DefaultErrorFallback({ error, onReset }: DefaultErrorFallbackProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8 text-center">
        <div className="mb-4">
          <svg
            className="mx-auto h-12 w-12 text-red-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">Something went wrong</h1>

        <p className="text-gray-600 mb-6">
          We're sorry, but an unexpected error occurred. Our team has been notified and will investigate.
        </p>

        {process.env.NODE_ENV === 'development' && error && (
          <details className="mb-6 text-left">
            <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
              Error details (development only)
            </summary>
            <pre className="mt-2 p-4 bg-red-50 border border-red-200 rounded text-xs overflow-auto">
              {error.toString()}
              {'\n\n'}
              {error.stack}
            </pre>
          </details>
        )}

        <div className="flex gap-4 justify-center">
          <button
            onClick={onReset}
            className="px-4 py-2 bg-primary text-white rounded hover:opacity-90 transition"
          >
            Try Again
          </button>

          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 transition"
          >
            Reload Page
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// ROUTE ERROR BOUNDARY (for app router)
// ============================================================

interface RouteErrorBoundaryProps {
  error: Error;
  reset: () => void;
}

export function RouteErrorBoundary({ error, reset }: RouteErrorBoundaryProps) {
  React.useEffect(() => {
    // Log to Winston
    logger.error('Route error', {
      error: error.message,
      stack: error.stack,
    });

    // Report to Sentry
    captureException(error);
  }, [error]);

  return <DefaultErrorFallback error={error} onReset={reset} />;
}
