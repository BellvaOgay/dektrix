import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Enhanced error logging for debugging
    const errorMessage = error.message || '';
    const errorStack = error.stack || '';
    
    // Log detailed error information
    console.group('🚨 Error Boundary Caught Error');
    console.error('Error Message:', errorMessage);
    console.error('Error Stack:', errorStack);
    console.error('Component Stack:', errorInfo.componentStack);
    console.error('Error Info:', errorInfo);
    console.groupEnd();

    // Check for UnknownError specifically
    if (errorMessage.includes('UnknownError') || errorMessage.includes('Internal error')) {
      console.error('🔍 DETECTED UNKNOWN/INTERNAL ERROR:', {
        message: errorMessage,
        stack: errorStack,
        componentStack: errorInfo.componentStack,
        timestamp: new Date().toISOString()
      });
    }

    // Suppress specific wallet and storage errors that don't affect core functionality
    const suppressedErrors = [
      'IndexedDB:Get:InternalError',
      'Analytics SDK: Error',
      'Internal error when calculating storage usage',
      'checkCrossOriginOpenerPolicy',
      'Failed to connect Base Account',
      'Wallet provider not initialized'
    ];

    const shouldSuppress = suppressedErrors.some(suppressedError => 
      errorMessage.includes(suppressedError)
    );

    if (shouldSuppress) {
      console.warn('🔇 Error boundary suppressed non-critical error:', error);
      // Reset the error boundary for non-critical errors
      this.setState({ hasError: false, error: undefined });
      return;
    }

    console.error('💥 Error boundary caught critical error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      // Fallback UI for critical errors only
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6">
            <div className="flex items-center mb-4">
              <div className="flex-shrink-0">
                <svg className="h-8 w-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 19.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-lg font-medium text-gray-900">
                  Something went wrong
                </h3>
              </div>
            </div>
            <div className="text-sm text-gray-500 mb-4">
              We encountered an unexpected error. Please refresh the page to continue.
            </div>
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;