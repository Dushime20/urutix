import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '@/utils/cn';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
  showCloseButton?: boolean;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl' | '7xl' | 'full';
}

const BottomSheet: React.FC<BottomSheetProps> = ({
  isOpen,
  onClose,
  title,
  children,
  className,
  showCloseButton = true,
  maxWidth = '2xl',
}) => {
  // Prevent body scroll when open
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

  const maxWidthClasses = {
    sm: 'lg:max-w-sm',
    md: 'lg:max-w-md',
    lg: 'lg:max-w-lg',
    xl: 'lg:max-w-xl',
    '2xl': 'lg:max-w-2xl',
    '3xl': 'lg:max-w-3xl',
    '4xl': 'lg:max-w-4xl',
    '5xl': 'lg:max-w-5xl',
    '6xl': 'lg:max-w-6xl',
    '7xl': 'lg:max-w-7xl',
    full: 'lg:max-w-full',
  };

  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop — above DashboardHeader (z-[300]) */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] z-[400]"
          />

          {/* Sheet/Modal Container */}
          <div className="fixed inset-0 flex items-end lg:items-center justify-center pointer-events-none z-[401] p-0 lg:p-4">
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className={cn(
                "w-full bg-white dark:bg-slate-900 rounded-t-[2rem] lg:rounded-[2rem] pointer-events-auto",
                "max-h-[92vh] flex flex-col shadow-2xl overflow-hidden",
                maxWidthClasses[maxWidth],
                "lg:max-h-[85vh]",
                className
              )}
            >
              {/* Drag Handle (Mobile Only) */}
              <div className="lg:hidden w-full flex justify-center py-3">
                <div className="w-12 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full" />
              </div>

              {/* Header */}
              {(title || showCloseButton) && (
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
                  {title && (
                    <h3 className="text-xl font-black text-slate-800 dark:text-white tracking-tight uppercase">
                      {title}
                    </h3>
                  )}
                  {showCloseButton && (
                    <button
                      onClick={onClose}
                      className="p-2 bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors rounded-xl"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  )}
                </div>
              )}

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                {children}
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
};

export default BottomSheet;
