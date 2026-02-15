import React from 'react';
import { motion } from 'framer-motion';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
  fullWidth?: boolean;
  showCharCount?: boolean;
  maxLength?: number;
}

export const Textarea: React.FC<TextareaProps> = ({
  label,
  error,
  helperText,
  fullWidth = true,
  showCharCount = false,
  maxLength,
  className = '',
  value,
  ...props
}) => {
  const hasError = !!error;
  const widthClass = fullWidth ? 'w-full' : '';
  const charCount = value ? String(value).length : 0;

  return (
    <div className={`${widthClass} ${className}`}>
      {/* Label */}
      {label && (
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          {label}
          {props.required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      {/* Textarea */}
      <motion.textarea
        whileFocus={{ scale: 1.01 }}
        className={`
          w-full px-4 py-2.5
          border-2 rounded-xl
          ${hasError 
            ? 'border-red-500 focus:border-red-600 focus:ring-red-500' 
            : 'border-gray-200 focus:border-indigo-500 focus:ring-indigo-500'
          }
          focus:outline-none focus:ring-2 focus:ring-opacity-20
          transition-all duration-200
          disabled:bg-gray-100 disabled:cursor-not-allowed
          placeholder:text-gray-400
          resize-none
        `}
        maxLength={maxLength}
        value={value}
        {...props}
      />

      {/* Footer with error/helper text and char count */}
      <div className="flex items-center justify-between mt-1.5">
        {/* Error or Helper Text */}
        {(error || helperText) && (
          <motion.p
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className={`text-sm ${hasError ? 'text-red-600' : 'text-gray-500'}`}
          >
            {error || helperText}
          </motion.p>
        )}

        {/* Character Count */}
        {showCharCount && (
          <p className={`text-sm ${
            maxLength && charCount > maxLength * 0.9 
              ? 'text-amber-600' 
              : 'text-gray-500'
          }`}>
            {charCount}{maxLength && ` / ${maxLength}`}
          </p>
        )}
      </div>
    </div>
  );
};

export default Textarea;
