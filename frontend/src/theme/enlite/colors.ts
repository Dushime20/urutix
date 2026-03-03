// Enlite-inspired color palette
// Modern, professional colors for admin dashboard

export const enliteColors = {
  // Primary colors - Deep blue/indigo
  primary: {
    50: '#EEF2FF',
    100: '#E0E7FF',
    200: '#C7D2FE',
    300: '#A5B4FC',
    400: '#818CF8',
    500: '#6366F1',  // Main primary
    600: '#4F46E5',
    700: '#4338CA',
    800: '#3730A3',
    900: '#312E81',
  },

  // Secondary colors - Purple
  secondary: {
    50: '#FAF5FF',
    100: '#F3E8FF',
    200: '#E9D5FF',
    300: '#D8B4FE',
    400: '#C084FC',
    500: '#A855F7',  // Main secondary
    600: '#9333EA',
    700: '#7E22CE',
    800: '#6B21A8',
    900: '#581C87',
  },

  // Success - Green
  success: {
    50: '#F0FDF4',
    100: '#DCFCE7',
    200: '#BBF7D0',
    300: '#86EFAC',
    400: '#4ADE80',
    500: '#22C55E',  // Main success
    600: '#16A34A',
    700: '#15803D',
    800: '#166534',
    900: '#14532D',
  },

  // Warning - Amber
  warning: {
    50: '#FFFBEB',
    100: '#FEF3C7',
    200: '#FDE68A',
    300: '#FCD34D',
    400: '#FBBF24',
    500: '#F59E0B',  // Main warning
    600: '#D97706',
    700: '#B45309',
    800: '#92400E',
    900: '#78350F',
  },

  // Error - Red
  error: {
    50: '#FEF2F2',
    100: '#FEE2E2',
    200: '#FECACA',
    300: '#FCA5A5',
    400: '#F87171',
    500: '#EF4444',  // Main error
    600: '#DC2626',
    700: '#B91C1C',
    800: '#991B1B',
    900: '#7F1D1D',
  },

  // Info - Cyan
  info: {
    50: '#ECFEFF',
    100: '#CFFAFE',
    200: '#A5F3FC',
    300: '#67E8F9',
    400: '#22D3EE',
    500: '#06B6D4',  // Main info
    600: '#0891B2',
    700: '#0E7490',
    800: '#155E75',
    900: '#164E63',
  },

  // Neutral/Gray
  gray: {
    50: '#F9FAFB',
    100: '#F3F4F6',
    200: '#E5E7EB',
    300: '#D1D5DB',
    400: '#9CA3AF',
    500: '#6B7280',
    600: '#4B5563',
    700: '#374151',
    800: '#1F2937',
    900: '#111827',
  },

  // Background colors
  background: {
    default: '#F9FAFB',
    paper: '#FFFFFF',
    dark: '#111827',
  },

  // Text colors
  text: {
    primary: '#111827',
    secondary: '#6B7280',
    disabled: '#9CA3AF',
    hint: '#D1D5DB',
  },

  // Gradient combinations
  gradients: {
    primary: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    success: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    warning: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    info: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    purple: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
    blue: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
    indigo: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
  },
};

// Helper function to get color with opacity
export const withOpacity = (color: string, opacity: number): string => {
  return `${color}${Math.round(opacity * 255).toString(16).padStart(2, '0')}`;
};

export default enliteColors;
