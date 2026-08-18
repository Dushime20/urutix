import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTimes } from 'react-icons/fa';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  showCloseButton?: boolean;
  closeOnOverlayClick?: boolean;
  footer?: React.ReactNode;
  headerColor?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info' | 'default';
  zIndexClass?: string;
}

const sizeClasses = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
  full: 'max-w-7xl',
};

const headerColorClasses = {
  primary: 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white',
  secondary: 'bg-gradient-to-r from-purple-500 to-pink-600 text-white',
  success: 'bg-gradient-to-r from-green-500 to-emerald-600 text-white',
  warning: 'bg-gradient-to-r from-amber-500 to-orange-600 text-white',
  error: 'bg-gradient-to-r from-red-500 to-rose-600 text-white',
  info: 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white',
  default: 'bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-white border-b border-gray-200 dark:border-slate-700',
};

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  showCloseButton = true,
  closeOnOverlayClick = true,
  footer,
  headerColor = 'default',
  zIndexClass = 'z-[10050]',
}) => {
  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (closeOnOverlayClick && e.target === e.currentTarget) {
      onClose();
    }
  };

  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className={`fixed inset-0 ${zIndexClass} flex items-center justify-center p-4`}>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={handleOverlayClick}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2, type: 'spring', damping: 25 }}
            className={`relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full ${sizeClasses[size]} max-h-[90vh] flex flex-col`}
          >
            {/* Header */}
            {(title || showCloseButton) && (
              <div className={`px-6 py-4 rounded-t-2xl flex items-center justify-between ${headerColorClasses[headerColor]}`}>
                {title && (
                  <h2 className="ui-section-title">
                    {title}
                  </h2>
                )}
                {showCloseButton && (
                  <button
                    onClick={onClose}
                    className={`p-2 rounded-lg transition-colors ${
                      headerColor === 'default'
                        ? 'hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-600 dark:text-slate-300'
                        : 'hover:bg-white/20 text-white'
                    }`}
                  >
                    <FaTimes />
                  </button>
                )}
              </div>
            )}

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-6 py-4 text-slate-900 dark:text-slate-100">
              {children}
            </div>

            {/* Footer */}
            {footer && (
              <div className="px-6 py-4 bg-gray-50 dark:bg-slate-800/50 rounded-b-2xl border-t border-gray-200 dark:border-slate-700">
                {footer}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
};

export default Modal;
