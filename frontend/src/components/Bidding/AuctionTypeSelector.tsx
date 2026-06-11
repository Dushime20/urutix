import React from 'react';
import { ChevronDown } from 'lucide-react';

export enum AuctionType {
  REVERSE = 'REVERSE',
  FORWARD = 'FORWARD',
  DUTCH   = 'DUTCH',
  SEALED  = 'SEALED',
}

const AUCTION_TYPES = [
  {
    value: AuctionType.REVERSE,
    label: 'Reverse Auction',
    sublabel: 'Carriers bid down from your target price — lowest bid wins. Most common.',
  },
  {
    value: AuctionType.FORWARD,
    label: 'Forward Auction',
    sublabel: 'Carriers bid up from a starting price — highest bid wins.',
  },
  {
    value: AuctionType.DUTCH,
    label: 'Dutch Auction',
    sublabel: 'Price drops automatically at set intervals until a carrier accepts.',
  },
  {
    value: AuctionType.SEALED,
    label: 'Sealed Bid',
    sublabel: 'Blind bids submitted privately, revealed only after the deadline.',
  },
];

interface AuctionTypeSelectorProps {
  selected: AuctionType;
  onChange: (type: AuctionType) => void;
  disabled?: boolean;
}

const AuctionTypeSelector: React.FC<AuctionTypeSelectorProps> = ({
  selected,
  onChange,
  disabled = false,
}) => {
  const active = AUCTION_TYPES.find(t => t.value === selected) ?? AUCTION_TYPES[0];

  return (
    <div className="space-y-2">
      <label className="block text-sm font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider">
        Auction Type
      </label>

      {/* Select */}
      <div className="relative">
        <select
          value={selected}
          onChange={e => onChange(e.target.value as AuctionType)}
          disabled={disabled}
          className="w-full px-4 py-3 pr-10 appearance-none rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-semibold text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-[#345E85] focus:border-[#345E85] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {AUCTION_TYPES.map(t => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
        <ChevronDown
          size={16}
          className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 dark:text-slate-500"
        />
      </div>

      {/* Single-line description */}
      <p className="text-xs text-slate-400 dark:text-slate-500 leading-relaxed">
        {active.sublabel}
      </p>
    </div>
  );
};

export default AuctionTypeSelector;
