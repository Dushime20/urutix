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
  primary: { bg: 'bg-primary-50', text: 'text-primary-700', border: 'border-primary-100', icon: 'bg-primary-600' },
  blue: { bg: 'bg-primary-50', text: 'text-primary-700', border: 'border-primary-100', icon: 'bg-primary-600' },
  green: { bg: 'bg-primary-50', text: 'text-primary-700', border: 'border-primary-100', icon: 'bg-primary-600' },
  emerald: { bg: 'bg-primary-50', text: 'text-primary-700', border: 'border-primary-100', icon: 'bg-primary-600' },
  orange: { bg: 'bg-primary-50', text: 'text-primary-700', border: 'border-primary-100', icon: 'bg-primary-600' },
  amber: { bg: 'bg-primary-50', text: 'text-primary-700', border: 'border-primary-100', icon: 'bg-primary-600' },
  indigo: { bg: 'bg-primary-50', text: 'text-primary-700', border: 'border-primary-100', icon: 'bg-primary-600' },
  purple: { bg: 'bg-primary-50', text: 'text-primary-700', border: 'border-primary-100', icon: 'bg-primary-600' },
  teal: { bg: 'bg-primary-50', text: 'text-primary-700', border: 'border-primary-100', icon: 'bg-primary-600' },
  cyan: { bg: 'bg-primary-50', text: 'text-primary-700', border: 'border-primary-100', icon: 'bg-primary-600' },
  pink: { bg: 'bg-primary-50', text: 'text-primary-700', border: 'border-primary-100', icon: 'bg-primary-600' },
  rose: { bg: 'bg-primary-50', text: 'text-primary-700', border: 'border-primary-100', icon: 'bg-primary-600' },
  yellow: { bg: 'bg-primary-50', text: 'text-primary-700', border: 'border-primary-100', icon: 'bg-primary-600' },
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
  const colors = colorMap[colorKey] || colorMap.primary;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, delay }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="group relative cursor-pointer overflow-hidden rounded-2xl bg-white dark:bg-slate-900 p-6 border border-transparent dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all duration-300 shadow-sm"
    >
      <div className="flex items-center justify-between mb-6">
        <div className={`flex h-14 w-14 items-center justify-center rounded-2xl ${colors.icon} text-white transition-transform duration-300 group-hover:scale-110`}>
          <Icon size={28} />
        </div>
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-50 dark:bg-slate-800 text-gray-400 dark:text-slate-500 group-hover:bg-primary-50 dark:group-hover:bg-primary-950/30 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
          <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M8.14645 3.14645C8.34171 2.95118 8.65829 2.95118 8.85355 3.14645L12.8536 7.14645C13.0488 7.34171 13.0488 7.65829 12.8536 7.85355L8.85355 11.8536C8.65829 12.0488 8.34171 12.0488 8.14645 11.8536C7.95118 11.6583 7.95118 11.3417 8.14645 11.1464L11.2929 8H2.5C2.22386 8 2 7.77614 2 7.5C2 7.22386 2.22386 7 2.5 7H11.2929L8.14645 3.85355C7.95118 3.65829 7.95118 3.34171 8.14645 3.14645Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path>
          </svg>
        </div>
      </div>

      <div className="flex-1">
        <h3 className="mb-1 text-lg font-black text-gray-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors uppercase tracking-tight">
          <TranslatedText text={title} />
        </h3>
        <p className="mb-4 text-xs font-medium leading-relaxed text-gray-500 dark:text-slate-400 uppercase tracking-wide opacity-80">
          <TranslatedText text={description} />
        </p>
      </div>

      <div className="flex items-center gap-2 pt-4 border-t border-transparent">
        <div className={`h-1.5 w-1.5 rounded-full ${colors.icon}`} />
        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 dark:text-slate-500 group-hover:text-gray-600 dark:group-hover:text-slate-350 transition-colors">
          {stats}
        </span>
      </div>
    </motion.div>
  );
};

export default ModernNavCard;
