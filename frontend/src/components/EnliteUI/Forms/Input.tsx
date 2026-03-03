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
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          {label}
          {props.required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      {/* Input Container */}
      <div className="relative">
        {/* Left Icon */}
        {icon && iconPosition === 'left' && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
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
            ${hasError 
              ? 'border-red-500 focus:border-red-600 focus:ring-red-500' 
              : 'border-gray-200 focus:border-indigo-500 focus:ring-indigo-500'
            }
            focus:outline-none focus:ring-2 focus:ring-opacity-20
            transition-all duration-200
            disabled:bg-gray-100 disabled:cursor-not-allowed
            placeholder:text-gray-400
          `}
          {...props}
        />

        {/* Right Icon */}
        {icon && iconPosition === 'right' && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
            {icon}
          </div>
        )}
      </div>

      {/* Error or Helper Text */}
      {(error || helperText) && (
        <motion.p
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className={`mt-1.5 text-sm ${hasError ? 'text-red-600' : 'text-gray-500'}`}
        >
          {error || helperText}
        </motion.p>
      )}
    </div>
  );
};

export default Input;
