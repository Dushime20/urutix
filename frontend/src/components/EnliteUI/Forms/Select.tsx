import React from 'react';
import { motion } from 'framer-motion';

export interface SelectOption {
  value: string | number;
  label: string;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
  options: SelectOption[];
  placeholder?: string;
  fullWidth?: boolean;
}

export const Select: React.FC<SelectProps> = ({
  label,
  error,
  helperText,
  options,
  placeholder,
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

      {/* Select Container */}
      <div className="relative">
        <motion.select
          whileFocus={{ scale: 1.01 }}
          className={`
            w-full px-4 py-2.5 pr-10
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
            appearance-none
          `}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </motion.select>

        {/* Dropdown Arrow */}
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 dark:text-slate-500 transition-colors duration-300">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
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

export default Select;
