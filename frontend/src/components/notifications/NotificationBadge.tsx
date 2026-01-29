import React from 'react';

interface NotificationBadgeProps {
  count: number;
  maxCount?: number;
  showPulse?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const NotificationBadge: React.FC<NotificationBadgeProps> = ({
  count,
  maxCount = 99,
  showPulse = false,
  size = 'md',
  className = '',
}) => {
  if (count <= 0) return null;

  const displayCount = count > maxCount ? `${maxCount}+` : count.toString();

  const sizeStyles = {
    sm: 'w-4 h-4 text-[9px]',
    md: 'w-5 h-5 text-[10px]',
    lg: 'w-6 h-6 text-xs',
  };

  return (
    <div className={`relative inline-flex ${className}`}>
      {/* Pulse animation for urgent notifications */}
      {showPulse && (
        <span
          className={`absolute ${sizeStyles[size]} bg-red-500 rounded-full animate-ping opacity-75`}
        />
      )}
      
      {/* Badge */}
      <span
        className={`relative inline-flex items-center justify-center ${sizeStyles[size]} bg-red-500 text-white font-bold rounded-full border-2 border-white shadow-sm`}
      >
        {displayCount}
      </span>
    </div>
  );
};

export default NotificationBadge;
