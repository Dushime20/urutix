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
        <label className="block text-sm font-semibold text-gray-700 mb-2">
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
            ${hasError 
              ? 'border-red-500 focus:border-red-600 focus:ring-red-500' 
              : 'border-gray-200 focus:border-indigo-500 focus:ring-indigo-500'
            }
            focus:outline-none focus:ring-2 focus:ring-opacity-20
            transition-all duration-200
            disabled:bg-gray-100 disabled:cursor-not-allowed
            appearance-none
            bg-white
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
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
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
          className={`mt-1.5 text-sm ${hasError ? 'text-red-600' : 'text-gray-500'}`}
        >
          {error || helperText}
        </motion.p>
      )}
    </div>
  );
};

export default Select;
