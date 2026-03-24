import React from 'react';
import { Calendar } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '../../utils/cn';

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
    <div className={cn("flex items-center gap-3 overflow-hidden", className)}>
      <div className="flex items-center gap-2 text-slate-500 shrink-0">
        <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-[#345E85] border border-blue-100">
          <Calendar className="w-4 h-4" />
        </div>
        <span className="hidden sm:inline text-[10px] font-black uppercase tracking-widest">Time Range:</span>
      </div>
      <div className="flex items-center gap-1 bg-white/50 backdrop-blur-md rounded-2xl border border-slate-100 p-1 shadow-sm overflow-x-auto no-scrollbar scroll-smooth">
        {ranges.map((range) => (
          <motion.button
            key={range.value}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onChange(range.value)}
            className={cn(
               "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all whitespace-nowrap",
               value === range.value
                ? 'bg-[#345E85] text-white shadow-lg shadow-blue-500/20'
                : 'text-slate-400 hover:text-[#345E85] hover:bg-white'
            )}
          >
            {range.label}
          </motion.button>
        ))}
      </div>
    </div>
  );
};
