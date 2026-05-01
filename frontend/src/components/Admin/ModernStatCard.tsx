import React from 'react';
import { motion } from 'framer-motion';
import type { IconType } from 'react-icons';
import { TranslatedText } from '../translated-text';

interface ModernStatCardProps {
  title: string;
  value: string | number;
  icon: IconType;
  trend: number;
  trendText?: string;
  color: 'blue' | 'green' | 'orange' | 'yellow' | 'purple' | 'pink' | 'teal';
  delay?: number;
}

const colorMap = {
  blue: {
    bg: 'bg-blue-50',
    text: 'text-blue-600',
    border: 'border-blue-100',
    hoverBorder: 'hover:border-blue-500',
    iconBg: 'bg-blue-600'
  },
  green: {
    bg: 'bg-green-50',
    text: 'text-green-600',
    border: 'border-green-100',
    hoverBorder: 'hover:border-green-500',
    iconBg: 'bg-green-600'
  },
  orange: {
    bg: 'bg-orange-50',
    text: 'text-orange-600',
    border: 'border-orange-100',
    hoverBorder: 'hover:border-orange-500',
    iconBg: 'bg-orange-600'
  },
  yellow: {
    bg: 'bg-yellow-50',
    text: 'text-yellow-600',
    border: 'border-yellow-100',
    hoverBorder: 'hover:border-yellow-500',
    iconBg: 'bg-yellow-500'
  },
  purple: {
    bg: 'bg-purple-50',
    text: 'text-purple-600',
    border: 'border-purple-100',
    hoverBorder: 'hover:border-purple-500',
    iconBg: 'bg-purple-600'
  },
  pink: {
    bg: 'bg-pink-50',
    text: 'text-pink-600',
    border: 'border-pink-100',
    hoverBorder: 'hover:border-pink-500',
    iconBg: 'bg-pink-600'
  },
  teal: {
    bg: 'bg-teal-50',
    text: 'text-teal-600',
    border: 'border-teal-100',
    hoverBorder: 'hover:border-teal-500',
    iconBg: 'bg-teal-600'
  }
};

const ModernStatCard: React.FC<ModernStatCardProps> = ({
  title,
  value,
  icon: Icon,
  trend,
  trendText = 'this month',
  color,
  delay = 0
}) => {
  const colors = colorMap[color];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay }}
      className={`group relative bg-white rounded-2xl p-6 border ${colors.border} ${colors.hoverBorder} transition-all duration-300`}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
            <TranslatedText text={title} />
          </p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-3xl font-black text-gray-900">{value}</h3>
          </div>
          <div className="flex items-center gap-1.5 mt-2">
            <div className={`flex items-center gap-0.5 px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-tighter ${trend >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
              <span>{trend >= 0 ? '↑' : '↓'}</span>
              <span>{Math.abs(trend)}%</span>
            </div>
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">
              <TranslatedText text={trendText} />
            </span>
          </div>
        </div>

        <div className={`p-4 rounded-2xl ${colors.iconBg} text-white transition-transform duration-300 group-hover:scale-110`}>
          <Icon size={24} />
        </div>
      </div>
    </motion.div>
  );
};

export default ModernStatCard;
