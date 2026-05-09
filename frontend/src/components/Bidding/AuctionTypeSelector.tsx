import React from 'react';
import { TrendingDown, TrendingUp, Zap, Lock, Info } from 'lucide-react';
import { cn } from '@/utils/cn';

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

const auctionTypes = [
  {
    type: AuctionType.REVERSE,
    icon: TrendingDown,
    label: 'Reverse Auction',
    subtitle: 'Descending',
    description: 'Carriers bid DOWN from target price. Most common for standard freight.',
    color: 'blue',
    marketShare: '70%',
    recommended: true
  },
  {
    type: AuctionType.FORWARD,
    icon: TrendingUp,
    label: 'Forward Auction',
    subtitle: 'Ascending',
    description: 'Carriers bid UP from starting price. Best for premium/urgent cargo.',
    color: 'emerald',
    marketShare: '15%',
    recommended: false
  },
  {
    type: AuctionType.DUTCH,
    icon: Zap,
    label: 'Dutch Auction',
    subtitle: 'Fast-Drop',
    description: 'Price drops automatically until someone accepts. For time-critical shipments.',
    color: 'amber',
    marketShare: '10%',
    recommended: false
  },
  {
    type: AuctionType.SEALED,
    icon: Lock,
    label: 'Sealed Bid',
    subtitle: 'Confidential',
    description: 'Blind bidding with bids revealed after deadline. For fair competition.',
    color: 'purple',
    marketShare: '5%',
    recommended: false
  }
];

const colorClasses = {
  blue: {
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    border: 'border-blue-200 dark:border-blue-800',
    text: 'text-blue-700 dark:text-blue-400',
    icon: 'text-blue-600 dark:text-blue-400',
    selected: 'ring-2 ring-blue-500 bg-blue-100 dark:bg-blue-900/40'
  },
  emerald: {
    bg: 'bg-emerald-50 dark:bg-emerald-900/20',
    border: 'border-emerald-200 dark:border-emerald-800',
    text: 'text-emerald-700 dark:text-emerald-400',
    icon: 'text-emerald-600 dark:text-emerald-400',
    selected: 'ring-2 ring-emerald-500 bg-emerald-100 dark:bg-emerald-900/40'
  },
  amber: {
    bg: 'bg-amber-50 dark:bg-amber-900/20',
    border: 'border-amber-200 dark:border-amber-800',
    text: 'text-amber-700 dark:text-amber-400',
    icon: 'text-amber-600 dark:text-amber-400',
    selected: 'ring-2 ring-amber-500 bg-amber-100 dark:bg-amber-900/40'
  },
  purple: {
    bg: 'bg-purple-50 dark:bg-purple-900/20',
    border: 'border-purple-200 dark:border-purple-800',
    text: 'text-purple-700 dark:text-purple-400',
    icon: 'text-purple-600 dark:text-purple-400',
    selected: 'ring-2 ring-purple-500 bg-purple-100 dark:bg-purple-900/40'
  }
};

const AuctionTypeSelector: React.FC<AuctionTypeSelectorProps> = ({
  selected,
  onChange,
  disabled = false
}) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <h3 className="text-sm font-black text-slate-900 dark:text-slate-100 uppercase tracking-wider">
          Select Auction Type
        </h3>
        <div className="group relative">
          <Info size={16} className="text-slate-400 cursor-help" />
          <div className="absolute left-0 top-6 w-64 p-3 bg-slate-900 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 shadow-xl">
            Choose the auction type that best fits your cargo and business needs. REVERSE is recommended for most shipments.
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {auctionTypes.map((auctionType) => {
          const Icon = auctionType.icon;
          const colors = colorClasses[auctionType.color as keyof typeof colorClasses];
          const isSelected = selected === auctionType.type;

          return (
            <button
              key={auctionType.type}
              onClick={() => !disabled && onChange(auctionType.type)}
              disabled={disabled}
              className={cn(
                "relative p-4 rounded-2xl border-2 transition-all text-left",
                "hover:shadow-lg active:scale-[0.98]",
                colors.bg,
                colors.border,
                isSelected ? colors.selected : "hover:border-slate-300 dark:hover:border-slate-600",
                disabled && "opacity-50 cursor-not-allowed"
              )}
            >
              {/* Recommended Badge */}
              {auctionType.recommended && (
                <div className="absolute -top-2 -right-2 px-2 py-0.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white text-[9px] font-black uppercase tracking-wider rounded-full shadow-lg">
                  Recommended
                </div>
              )}

              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center",
                    colors.bg,
                    colors.icon
                  )}>
                    <Icon size={20} />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-slate-900 dark:text-slate-100">
                      {auctionType.label}
                    </h4>
                    <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      {auctionType.subtitle}
                    </p>
                  </div>
                </div>

                {/* Market Share Badge */}
                <div className={cn(
                  "px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider",
                  colors.bg,
                  colors.text
                )}>
                  {auctionType.marketShare}
                </div>
              </div>

              {/* Description */}
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                {auctionType.description}
              </p>

              {/* Selection Indicator */}
              {isSelected && (
                <div className="absolute bottom-3 right-3">
                  <div className={cn(
                    "w-6 h-6 rounded-full flex items-center justify-center",
                    "bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg"
                  )}>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Selected Type Info */}
      {selected && (
        <div className={cn(
          "p-4 rounded-xl border-2",
          colorClasses[auctionTypes.find(t => t.type === selected)?.color as keyof typeof colorClasses].bg,
          colorClasses[auctionTypes.find(t => t.type === selected)?.color as keyof typeof colorClasses].border
        )}>
          <div className="flex items-start gap-3">
            <Info size={16} className={cn(
              "mt-0.5 shrink-0",
              colorClasses[auctionTypes.find(t => t.type === selected)?.color as keyof typeof colorClasses].icon
            )} />
            <div>
              <h4 className="text-xs font-black text-slate-900 dark:text-slate-100 mb-1">
                {auctionTypes.find(t => t.type === selected)?.label} Selected
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                {selected === AuctionType.REVERSE && "Carriers will compete by bidding DOWN from your target price. The lowest bid above your reserve price wins."}
                {selected === AuctionType.FORWARD && "Carriers will compete by bidding UP from the starting price. The highest bid above your reserve price wins."}
                {selected === AuctionType.DUTCH && "Price will automatically drop at set intervals until a carrier accepts. First to accept wins."}
                {selected === AuctionType.SEALED && "Carriers submit blind bids without seeing competitors. You choose the winner after the deadline."}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuctionTypeSelector;
