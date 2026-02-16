import React from 'react';
import { Calendar } from 'lucide-react';
import { motion } from 'framer-motion';

interface TimeRangeSelectorProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export const TimeRangeSelector: React.FC<TimeRangeSelectorProps> = ({
  value,
  onChange,
  className = ''
}) => {
  const ranges = [
    { value: '24h', label: 'Today' },
    { value: '7d', label: '7 Days' },
    { value: '30d', label: '30 Days' },
    { value: '90d', label: '90 Days' },
    { value: 'custom', label: 'Custom' }
  ];

  return (
    <div className={`flex items-center space-x-3 ${className}`}>
      <div className="flex items-center space-x-2 text-gray-600">
        <Calendar className="w-5 h-5" />
        <span className="text-sm font-medium">Time Range:</span>
      </div>
      <div className="flex items-center space-x-2 bg-white rounded-lg border border-gray-200 p-1 shadow-sm">
        {ranges.map((range) => (
          <motion.button
            key={range.value}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onChange(range.value)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
              value === range.value
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            {range.label}
          </motion.button>
        ))}
      </div>
    </div>
  );
};
