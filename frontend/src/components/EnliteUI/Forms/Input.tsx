import React from 'react';
import { motion } from 'framer-motion';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  helperText,
  icon,
  iconPosition = 'left',
  fullWidth = true,
  className = '',
  ...props
}) => {
  const hasError = !!error;
  const widthClass = fullWidth ? 'w-full' : '';

  return (
    <div className={`${widthClass} ${className}`}>
      {/* Label */}
      {label && (
        <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-2 transition-colors duration-300">
          {label}
          {props.required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      {/* Input Container */}
      <div className="relative">
        {/* Left Icon */}
        {icon && iconPosition === 'left' && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500 transition-colors duration-300">
            {icon}
          </div>
        )}

        {/* Input */}
        <motion.input
          whileFocus={{ scale: 1.01 }}
          className={`
            w-full px-4 py-2.5 
            ${icon && iconPosition === 'left' ? 'pl-10' : ''}
            ${icon && iconPosition === 'right' ? 'pr-10' : ''}
            border-2 rounded-xl
            bg-white dark:bg-slate-800
            text-gray-900 dark:text-slate-100
            ${hasError 
              ? 'border-red-500 focus:border-red-600 focus:ring-red-500' 
              : 'border-gray-200 dark:border-slate-700 focus:border-indigo-500 dark:focus:border-blue-500 focus:ring-indigo-500 dark:focus:ring-blue-500'
            }
            focus:outline-none focus:ring-2 focus:ring-opacity-20
            transition-all duration-300
            disabled:bg-gray-100 dark:disabled:bg-slate-900 disabled:cursor-not-allowed
            placeholder:text-gray-400 dark:placeholder:text-slate-500
          `}
          {...props}
        />

        {/* Right Icon */}
        {icon && iconPosition === 'right' && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500 transition-colors duration-300">
            {icon}
          </div>
        )}
      </div>

      {/* Error or Helper Text */}
      {(error || helperText) && (
        <motion.p
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className={`mt-1.5 text-sm ${hasError ? 'text-red-600' : 'text-gray-500 dark:text-slate-400'} transition-colors duration-300`}
        >
          {error || helperText}
        </motion.p>
      )}
    </div>
  );
};

export default Input;
