import React, { useEffect } from 'react';
import { FaExclamationTriangle, FaTimes, FaInfoCircle, FaExclamationCircle } from 'react-icons/fa';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  variant?: 'danger' | 'warning' | 'info';
  isLoading?: boolean;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  variant = 'danger',
  isLoading = false,
}) => {
  // Prevent body scroll when dialog is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Handle ESC key
  useEffect(() => {
    if (!isOpen) return;
    
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isLoading) {
        onCancel();
      }
    };
    
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, isLoading, onCancel]);

  if (!isOpen) return null;

  const variantStyles = {
    danger: {
      icon: 'text-red-600',
      button: 'bg-red-600 hover:bg-red-700 focus:ring-red-500 active:bg-red-800',
      iconBg: 'bg-red-100',
      border: 'border-red-200',
      titleColor: 'text-red-900',
    },
    warning: {
      icon: 'text-yellow-600',
      button: 'bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500 active:bg-yellow-800',
      iconBg: 'bg-yellow-100',
      border: 'border-yellow-200',
      titleColor: 'text-yellow-900',
    },
    info: {
      icon: 'text-blue-600',
      button: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500 active:bg-blue-800',
      iconBg: 'bg-blue-100',
      border: 'border-blue-200',
      titleColor: 'text-blue-900',
    },
  };

  const styles = variantStyles[variant];
  const IconComponent = variant === 'info' ? FaInfoCircle : variant === 'warning' ? FaExclamationCircle : FaExclamationTriangle;

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[10000] p-4 animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isLoading) {
          onCancel();
        }
      }}
    >
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 transform transition-all animate-in zoom-in-95 duration-200 border border-gray-200">
        <div className="p-6">
          <div className="flex items-start gap-4">
            <div className={`flex-shrink-0 ${styles.iconBg} rounded-full p-3 ring-4 ring-opacity-20 ${styles.icon.replace('text-', 'ring-')}`}>
              <IconComponent className={`w-6 h-6 ${styles.icon}`} />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className={`ui-section-title normal-case ${styles.titleColor} mb-2`}>
                {title}
              </h3>
              <p className="ui-body font-medium text-gray-600 leading-relaxed whitespace-pre-wrap">
                {message}
              </p>
            </div>
            <button
              onClick={onCancel}
              disabled={isLoading}
              className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50 p-1 rounded-lg hover:bg-gray-100"
              aria-label="Close"
            >
              <FaTimes className="w-5 h-5" />
            </button>
          </div>
        </div>
        <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-gray-100/50 rounded-b-xl flex items-center justify-end gap-3 border-t border-gray-200">
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="px-5 py-2.5 ui-button text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={`px-5 py-2.5 ui-button text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg ${styles.button}`}
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </span>
            ) : (
              confirmText
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

