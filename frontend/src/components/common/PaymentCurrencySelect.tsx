/**
 * PaymentCurrencySelect
 *
 * A self-contained currency picker for use inside payment modals/forms.
 * Unlike <CurrencySelector> (which changes the global preferred currency),
 * this component manages local state for the currency that will be sent in
 * a specific payment POST request.
 *
 * Usage:
 *   const [currency, setCurrency] = useState('RWF');
 *   <PaymentCurrencySelect value={currency} onChange={setCurrency} />
 */
import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search, Globe } from 'lucide-react';
import { useCurrency } from '../../contexts/CurrencyContext';
import { cn } from '../../utils/cn';

interface PaymentCurrencySelectProps {
  value: string;
  onChange: (code: string) => void;
  label?: string;
  className?: string;
  /** 'row' = label + picker on one line (default for modal headers)
   *  'block' = label stacked above picker (default for form fields) */
  layout?: 'row' | 'block';
}

const PaymentCurrencySelect: React.FC<PaymentCurrencySelectProps> = ({
  value,
  onChange,
  label = 'Payment Currency',
  className,
  layout = 'block',
}) => {
  const { supportedCurrencies, getCurrencyMeta } = useCurrency();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  const current = getCurrencyMeta(value);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filtered = search.trim()
    ? supportedCurrencies.filter(
        c =>
          c.code.toLowerCase().includes(search.toLowerCase()) ||
          c.name.toLowerCase().includes(search.toLowerCase()),
      )
    : supportedCurrencies;

  const handleSelect = (code: string) => {
    setOpen(false);
    setSearch('');
    onChange(code);
  };

  const trigger = (
    <button
      type="button"
      onClick={() => setOpen(o => !o)}
      className="flex items-center gap-2 px-3 py-2.5 bg-slate-50 border-2 border-slate-100 rounded-xl hover:border-[#345E85] focus:border-[#345E85] focus:outline-none transition-colors text-sm font-black text-slate-700 w-full"
    >
      <Globe size={14} className="text-[#345E85] shrink-0" />
      <span className="text-base shrink-0">{current?.flag}</span>
      <span className="font-black text-slate-900">{value}</span>
      <span className="text-xs text-slate-400 truncate flex-1 text-left hidden sm:block">
        {current?.name}
      </span>
      <ChevronDown
        size={14}
        className={cn('text-slate-400 transition-transform shrink-0', open && 'rotate-180')}
      />
    </button>
  );

  const dropdown = open && (
    <div className="absolute left-0 top-full mt-1 z-[10000] w-72 bg-white border border-slate-200 rounded-2xl shadow-xl shadow-slate-200/60 overflow-hidden">
      {/* Search */}
      <div className="p-3 border-b border-slate-100">
        <div className="relative">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            autoFocus
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search currency…"
            className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-100 rounded-lg text-xs font-medium text-slate-700 outline-none focus:border-[#345E85]"
          />
        </div>
      </div>
      {/* List */}
      <div className="max-h-56 overflow-y-auto">
        {filtered.length === 0 && (
          <div className="px-4 py-6 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            No results
          </div>
        )}
        {filtered.map(c => (
          <button
            key={c.code}
            type="button"
            onClick={() => handleSelect(c.code)}
            className={cn(
              'w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-slate-50 transition-colors',
              c.code === value && 'bg-[#345E85]/5',
            )}
          >
            <span className="text-base w-6 text-center">{c.flag}</span>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-black text-slate-900">{c.code}</p>
              <p className="text-[10px] text-slate-400 truncate">{c.name}</p>
            </div>
            <span className="text-[10px] font-bold text-slate-500 shrink-0">{c.symbol}</span>
            {c.code === value && (
              <span className="w-1.5 h-1.5 rounded-full bg-[#345E85] shrink-0" />
            )}
          </button>
        ))}
      </div>
    </div>
  );

  if (layout === 'row') {
    return (
      <div ref={ref} className={cn('flex items-center gap-3', className)}>
        {label && (
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap shrink-0">
            {label}
          </span>
        )}
        <div className="relative flex-1">
          {trigger}
          {dropdown}
        </div>
      </div>
    );
  }

  return (
    <div ref={ref} className={cn('space-y-1.5', className)}>
      {label && (
        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">
          {label}
        </label>
      )}
      <div className="relative">
        {trigger}
        {dropdown}
      </div>
    </div>
  );
};

export default PaymentCurrencySelect;
