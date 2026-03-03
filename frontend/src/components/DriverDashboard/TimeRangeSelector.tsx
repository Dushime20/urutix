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
      <div className="flex items-center space-x-2 text-slate-500">
        <Calendar className="w-4 h-4 text-[#345E85]" />
        <span className="text-xs font-black uppercase tracking-widest">Time Range:</span>
      </div>
      <div className="flex items-center space-x-1 bg-white rounded-xl border border-slate-100 p-1 shadow-sm">
        {ranges.map((range) => (
          <motion.button
            key={range.value}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onChange(range.value)}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${value === range.value
                ? 'bg-[#345E85] text-white shadow-md'
                : 'text-slate-500 hover:text-[#345E85] hover:bg-slate-50'
              }`}
          >
            {range.label}
          </motion.button>
        ))}
      </div>
    </div>
  );
};
