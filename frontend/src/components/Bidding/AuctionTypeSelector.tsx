import React from 'react';
import { TrendingDown, TrendingUp, Zap, Lock, ChevronDown } from 'lucide-react';

export enum AuctionType {
  REVERSE = 'REVERSE',
  FORWARD = 'FORWARD',
  DUTCH = 'DUTCH',
  SEALED = 'SEALED'
}

interface AuctionTypeSelectorProps {
  selected: AuctionType;
  onChange: (type: AuctionType) => void;
  disabled?: boolean;
}

const AUCTION_TYPES = [
  {
    value: AuctionType.REVERSE,
    label: 'Reverse Auction — Lowest Bid Wins',
    sublabel: 'Carriers bid DOWN from your target price. Most common for standard freight.',
    icon: TrendingDown,
    badge: 'Recommended · 70% market',
    badgeColor: 'text-blue-700 bg-blue-50 dark:text-blue-300 dark:bg-blue-900/30',
    iconColor: 'text-blue-600 dark:text-blue-400',
    iconBg: 'bg-blue-50 dark:bg-blue-900/20',
    ringColor: 'ring-blue-500',
    borderColor: 'border-blue-200 dark:border-blue-700',
    activeBg: 'bg-blue-50 dark:bg-blue-900/20',
  },
  {
    value: AuctionType.FORWARD,
    label: 'Forward Auction — Highest Bid Wins',
    sublabel: 'Carriers bid UP from starting price. Best for premium or urgent cargo.',
    icon: TrendingUp,
    badge: '15% market',
    badgeColor: 'text-emerald-700 bg-emerald-50 dark:text-emerald-300 dark:bg-emerald-900/30',
    iconColor: 'text-emerald-600 dark:text-emerald-400',
    iconBg: 'bg-emerald-50 dark:bg-emerald-900/20',
    ringColor: 'ring-emerald-500',
    borderColor: 'border-emerald-200 dark:border-emerald-700',
    activeBg: 'bg-emerald-50 dark:bg-emerald-900/20',
  },
  {
    value: AuctionType.DUTCH,
    label: 'Dutch Auction — Fast-Drop Price',
    sublabel: 'Price drops automatically at set intervals until a carrier accepts.',
    icon: Zap,
    badge: '10% market',
    badgeColor: 'text-amber-700 bg-amber-50 dark:text-amber-300 dark:bg-amber-900/30',
    iconColor: 'text-amber-600 dark:text-amber-400',
    iconBg: 'bg-amber-50 dark:bg-amber-900/20',
    ringColor: 'ring-amber-500',
    borderColor: 'border-amber-200 dark:border-amber-700',
    activeBg: 'bg-amber-50 dark:bg-amber-900/20',
  },
  {
    value: AuctionType.SEALED,
    label: 'Sealed Bid — Confidential Bids',
    sublabel: 'Blind bidding; bids revealed only after deadline closes.',
    icon: Lock,
    badge: '5% market',
    badgeColor: 'text-purple-700 bg-purple-50 dark:text-purple-300 dark:bg-purple-900/30',
    iconColor: 'text-purple-600 dark:text-purple-400',
    iconBg: 'bg-purple-50 dark:bg-purple-900/20',
    ringColor: 'ring-purple-500',
    borderColor: 'border-purple-200 dark:border-purple-700',
    activeBg: 'bg-purple-50 dark:bg-purple-900/20',
  },
];

const AuctionTypeSelector: React.FC<AuctionTypeSelectorProps> = ({
  selected,
  onChange,
  disabled = false,
}) => {
  const active = AUCTION_TYPES.find(t => t.value === selected) ?? AUCTION_TYPES[0];
  const ActiveIcon = active.icon;

  return (
    <div className="space-y-3">
      {/* Label row */}
      <div className="flex items-center justify-between">
        <label className="text-sm font-black text-slate-900 dark:text-slate-100 uppercase tracking-wider">
          Select Auction Type
        </label>
        <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full ${active.badgeColor}`}>
          {active.badge}
        </span>
      </div>

      {/* Select input */}
      <div className="relative">
        {/* Leading icon */}
        <div className={`absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-xl flex items-center justify-center pointer-events-none ${active.iconBg}`}>
          <ActiveIcon size={16} className={active.iconColor} />
        </div>

        <select
          value={selected}
          onChange={e => onChange(e.target.value as AuctionType)}
          disabled={disabled}
          className={`
            w-full pl-14 pr-10 py-3.5 appearance-none
            border-2 rounded-2xl text-sm font-bold
            bg-white dark:bg-slate-900
            text-slate-900 dark:text-slate-100
            outline-none transition-all
            focus:ring-2 focus:ring-offset-0
            disabled:opacity-50 disabled:cursor-not-allowed
            ${active.borderColor} focus:${active.ringColor}
            ${active.activeBg}
          `}
        >
          {AUCTION_TYPES.map(t => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>

        {/* Trailing chevron */}
        <ChevronDown
          size={16}
          className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 dark:text-slate-500"
        />
      </div>

      {/* Description card for selected type */}
      <div className={`flex items-start gap-3 p-4 rounded-2xl border-2 ${active.activeBg} ${active.borderColor}`}>
        <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${active.iconBg}`}>
          <ActiveIcon size={16} className={active.iconColor} />
        </div>
        <div>
          <p className="text-xs font-black text-slate-900 dark:text-slate-100 mb-0.5">
            {AUCTION_TYPES.find(t => t.value === selected)?.label}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            {AUCTION_TYPES.find(t => t.value === selected)?.sublabel}
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuctionTypeSelector;
