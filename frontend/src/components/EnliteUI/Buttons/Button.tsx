import React from 'react';
import { motion } from 'framer-motion';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
}

const variantClasses = {
  primary: 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:from-indigo-600 hover:to-purple-700 shadow-lg shadow-indigo-500/30',
  secondary: 'bg-gradient-to-r from-purple-500 to-pink-600 text-white hover:from-purple-600 hover:to-pink-700 shadow-lg shadow-purple-500/30',
  success: 'bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-700 shadow-lg shadow-green-500/30',
  warning: 'bg-gradient-to-r from-amber-500 to-orange-600 text-white hover:from-amber-600 hover:to-orange-700 shadow-lg shadow-amber-500/30',
  error: 'bg-gradient-to-r from-red-500 to-rose-600 text-white hover:from-red-600 hover:to-rose-700 shadow-lg shadow-red-500/30',
  info: 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:from-cyan-600 hover:to-blue-700 shadow-lg shadow-cyan-500/30',
  outline: 'border-2 border-indigo-500 text-indigo-600 hover:bg-indigo-50',
  ghost: 'text-gray-700 hover:bg-gray-100',
};

const sizeClasses = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-base',
  lg: 'px-6 py-3 text-lg',
};

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  iconPosition = 'left',
  fullWidth = false,
  disabled,
  className = '',
  onClick,
  ...props
}) => {
  const baseClasses = 'font-semibold rounded-xl transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed';
  const variantClass = variantClasses[variant];
  const sizeClass = sizeClasses[size];
  const widthClass = fullWidth ? 'w-full' : '';

  return (
    <motion.button
      whileHover={{ scale: disabled || loading ? 1 : 1.02 }}
      whileTap={{ scale: disabled || loading ? 1 : 0.98 }}
      className={`${baseClasses} ${variantClass} ${sizeClass} ${widthClass} ${className}`}
      disabled={disabled || loading}
      onClick={onClick}
      type={props.type || 'button'}
    >
      {loading && (
        <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      )}
      
      {!loading && icon && iconPosition === 'left' && <span>{icon}</span>}
      
      <span>{children}</span>
      
      {!loading && icon && iconPosition === 'right' && <span>{icon}</span>}
    </motion.button>
  );
};

export default Button;
