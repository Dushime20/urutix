import React from 'react';
import { motion } from 'framer-motion';
import type { IconType } from 'react-icons';
import { TranslatedText } from '../translated-text';

interface ModernNavCardProps {
  title: string;
  description: string;
  icon: IconType;
  stats: string;
  color: string; // Now expecting a base color like "blue", "green", etc.
  onClick: () => void;
  delay?: number;
}

const colorMap: Record<string, { bg: string; text: string; border: string; icon: string }> = {
  blue: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-100', icon: 'bg-blue-600' },
  green: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-100', icon: 'bg-green-600' },
  emerald: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-100', icon: 'bg-emerald-600' },
  orange: { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-100', icon: 'bg-orange-600' },
  amber: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-100', icon: 'bg-amber-600' },
  indigo: { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-100', icon: 'bg-indigo-600' },
  purple: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-100', icon: 'bg-purple-600' },
  teal: { bg: 'bg-teal-50', text: 'text-teal-700', border: 'border-teal-100', icon: 'bg-teal-600' },
  cyan: { bg: 'bg-cyan-50', text: 'text-cyan-700', border: 'border-cyan-100', icon: 'bg-cyan-600' },
  pink: { bg: 'bg-pink-50', text: 'text-pink-700', border: 'border-pink-100', icon: 'bg-pink-600' },
  rose: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-100', icon: 'bg-rose-600' },
  yellow: { bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-100', icon: 'bg-yellow-500' },
};

const ModernNavCard: React.FC<ModernNavCardProps> = ({
  title,
  description,
  icon: Icon,
  stats,
  color,
  onClick,
  delay = 0
}) => {
  // Extract the first color part if it's still a gradient string for backward compatibility
  const colorKey = color.includes('-') ? color.split('-')[1] : color;
  const colors = colorMap[colorKey] || colorMap.blue;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, delay }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="group relative cursor-pointer overflow-hidden rounded-2xl bg-white p-6 border border-gray-100 hover:border-indigo-500 transition-all duration-300"
    >
      <div className="flex items-center justify-between mb-6">
        <div className={`flex h-14 w-14 items-center justify-center rounded-2xl ${colors.icon} text-white transition-transform duration-300 group-hover:scale-110`}>
          <Icon size={28} />
        </div>
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-50 text-gray-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
          <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M8.14645 3.14645C8.34171 2.95118 8.65829 2.95118 8.85355 3.14645L12.8536 7.14645C13.0488 7.34171 13.0488 7.65829 12.8536 7.85355L8.85355 11.8536C8.65829 12.0488 8.34171 12.0488 8.14645 11.8536C7.95118 11.6583 7.95118 11.3417 8.14645 11.1464L11.2929 8H2.5C2.22386 8 2 7.77614 2 7.5C2 7.22386 2.22386 7 2.5 7H11.2929L8.14645 3.85355C7.95118 3.65829 7.95118 3.34171 8.14645 3.14645Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path>
          </svg>
        </div>
      </div>

      <div className="flex-1">
        <h3 className="mb-1 text-lg font-black text-gray-900 group-hover:text-indigo-600 transition-colors uppercase tracking-tight">
          <TranslatedText text={title} />
        </h3>
        <p className="mb-4 text-xs font-medium leading-relaxed text-gray-500 uppercase tracking-wide opacity-80">
          <TranslatedText text={description} />
        </p>
      </div>

      <div className="flex items-center gap-2 pt-4 border-t border-gray-50">
        <div className={`h-1.5 w-1.5 rounded-full ${colors.icon}`} />
        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 group-hover:text-gray-600 transition-colors">
          {stats}
        </span>
      </div>
    </motion.div>
  );
};

export default ModernNavCard;
