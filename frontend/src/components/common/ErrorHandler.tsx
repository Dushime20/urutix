import React from 'react';
import { AlertTriangle, WifiOff, Server, Shield, Clock, RefreshCw } from 'lucide-react';
import { getErrorMessage } from '../../config/errorMessages';

interface ErrorDisplayProps {
  error: any;
  onRetry?: () => void;
  showRetry?: boolean;
  className?: string;
}

export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({ 
  error, 
  onRetry, 
  showRetry = true,
  className = '' 
}) => {
  const errorInfo = getErrorMessage(error);
  
  const getIcon = () => {
    if (error.code === 'ERR_NETWORK' || error.message?.includes('Network Error')) {
      return <WifiOff className="w-6 h-6 text-red-500" />;
    }
    if (error.response?.status >= 500) {
      return <Server className="w-6 h-6 text-red-500" />;
    }
    if (error.response?.status === 401 || error.response?.status === 403) {
      return <Shield className="w-6 h-6 text-orange-500" />;
    }
    if (error.response?.status === 429) {
      return <Clock className="w-6 h-6 text-orange-500" />;
    }
    return <AlertTriangle className="w-6 h-6 text-red-500" />;
  };

  const getBgColor = () => {
    if (error.response?.status >= 500) return 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800';
    if (error.response?.status === 401 || error.response?.status === 403) return 'bg-orange-50 dark:bg-orange-900/10 border-orange-200 dark:border-orange-800';
    if (error.response?.status === 429) return 'bg-yellow-50 dark:bg-yellow-900/10 border-yellow-200 dark:border-yellow-800';
    return 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800';
  };

  return (
    <div className={`rounded-lg border p-4 ${getBgColor()} ${className}`}>
      <div className="flex items-start gap-3">
        {getIcon()}
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
            {errorInfo.title}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
            {errorInfo.message}
          </p>
          {errorInfo.action && (
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {errorInfo.action}
            </p>
          )}
        </div>
        {showRetry && onRetry && (
          <button
            onClick={onRetry}
            className="flex-shrink-0 inline-flex items-center gap-1 px-3 py-1 text-xs font-medium text-blue-700 bg-blue-100 rounded-md hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50 transition-colors"
          >
            <RefreshCw className="w-3 h-3" />
            Retry
          </button>
        )}
      </div>
    </div>
  );
};

// Hook for handling API errors with toast notifications
export const useErrorHandler = () => {
  const handleError = (error: any, customMessage?: string) => {
    const errorInfo = getErrorMessage(error);
    const message = customMessage || `${errorInfo.title}: ${errorInfo.message}`;
    
    // Log error for debugging
    console.error('API Error:', error);
    
    return {
      title: errorInfo.title,
      message: errorInfo.message,
      action: errorInfo.action,
      fullMessage: message
    };
  };

  return { handleError };
};

// Higher-order component for error boundaries
export const withErrorHandling = <P extends object>(
  Component: React.ComponentType<P>
) => {
  const WrappedComponent = (props: P & { onError?: (error: any) => void }) => {
    const { onError, ...rest } = props;
    
    const handleError = (error: any) => {
      console.error('Component Error:', error);
      if (onError) {
        onError(error);
      }
    };

    return <Component {...(rest as P)} onError={handleError} />;
  };

  WrappedComponent.displayName = `withErrorHandling(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
};
