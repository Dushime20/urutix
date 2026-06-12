/**
 * CurrencySelector
 * A compact dropdown that lets the user switch their preferred currency.
 * Works in nav bars, settings pages, or anywhere in the UI.
 *
 * Usage:
 *   <CurrencySelector />                  — compact icon + code
 *   <CurrencySelector variant="full" />   — flag + name + code
 *   <CurrencySelector variant="settings"/>— full-width settings style
 */
import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search, Globe } from 'lucide-react';
import { useCurrency } from '../../contexts/CurrencyContext';
import { cn } from '../../utils/cn';

type Variant = 'compact' | 'full' | 'settings';

interface CurrencySelectorProps {
  variant?: Variant;
  className?: string;
}

const CurrencySelector: React.FC<CurrencySelectorProps> = ({
  variant = 'compact',
  className,
}) => {
  const { preferredCurrency, setPreferredCurrency, supportedCurrencies, getCurrencyMeta } = useCurrency();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  const current = getCurrencyMeta(preferredCurrency);

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
    ? supportedCurrencies.filter(c =>
        c.code.toLowerCase().includes(search.toLowerCase()) ||
        c.name.toLowerCase().includes(search.toLowerCase())
      )
    : supportedCurrencies;

  const handleSelect = async (code: string) => {
    setOpen(false);
    setSearch('');
    await setPreferredCurrency(code);
  };

  // ── Settings variant ───────────────────────────────────────────────────────
  if (variant === 'settings') {
    return (
      <div className={cn('space-y-2', className)}>
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
          Preferred Currency
        </label>
        <div ref={ref} className="relative">
          <button
            onClick={() => setOpen(o => !o)}
            className="w-full flex items-center justify-between gap-3 px-4 py-3 bg-white border border-slate-200 rounded-xl hover:border-[#345E85] transition-colors focus:outline-none focus:ring-1 focus:ring-[#345E85]/30"
          >
            <div className="flex items-center gap-3">
              <span className="text-xl">{current?.flag}</span>
              <div className="text-left">
                <p className="text-sm font-black text-slate-900">{current?.code}</p>
                <p className="text-[10px] text-slate-400">{current?.name}</p>
              </div>
            </div>
            <ChevronDown size={16} className={cn('text-slate-400 transition-transform', open && 'rotate-180')} />
          </button>
          {open && <Dropdown filtered={filtered} search={search} onSearch={setSearch} onSelect={handleSelect} selected={preferredCurrency} />}
        </div>
      </div>
    );
  }

  // ── Full variant ───────────────────────────────────────────────────────────
  if (variant === 'full') {
    return (
      <div ref={ref} className={cn('relative', className)}>
        <button
          onClick={() => setOpen(o => !o)}
          className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white border border-slate-200 hover:border-[#345E85] transition-colors text-sm font-bold text-slate-700"
        >
          <span className="text-base">{current?.flag}</span>
          <span>{current?.code}</span>
          <ChevronDown size={14} className={cn('text-slate-400 transition-transform', open && 'rotate-180')} />
        </button>
        {open && <Dropdown filtered={filtered} search={search} onSearch={setSearch} onSelect={handleSelect} selected={preferredCurrency} />}
      </div>
    );
  }

  // ── Compact variant (default) ──────────────────────────────────────────────
  return (
    <div ref={ref} className={cn('relative', className)}>
      <button
        onClick={() => setOpen(o => !o)}
        title="Change currency"
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 hover:border-[#345E85] transition-all text-[10px] font-black uppercase tracking-widest text-slate-600"
      >
        <Globe size={13} className="text-[#345E85]" />
        <span>{preferredCurrency}</span>
        <ChevronDown size={11} className={cn('text-slate-400 transition-transform', open && 'rotate-180')} />
      </button>
      {open && <Dropdown filtered={filtered} search={search} onSearch={setSearch} onSelect={handleSelect} selected={preferredCurrency} />}
    </div>
  );
};

// ── Shared dropdown panel ──────────────────────────────────────────────────────
const Dropdown: React.FC<{
  filtered: ReturnType<typeof useCurrency>['supportedCurrencies'];
  search: string;
  onSearch: (v: string) => void;
  onSelect: (code: string) => void;
  selected: string;
}> = ({ filtered, search, onSearch, onSelect, selected }) => (
  <div className="absolute right-0 top-full mt-2 z-50 w-64 bg-white border border-slate-200 rounded-2xl shadow-xl shadow-slate-200/60 overflow-hidden">
    {/* Search */}
    <div className="p-3 border-b border-slate-100">
      <div className="relative">
        <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          autoFocus
          value={search}
          onChange={e => onSearch(e.target.value)}
          placeholder="Search currency..."
          className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-100 rounded-lg text-xs font-medium text-slate-700 outline-none focus:border-[#345E85]"
        />
      </div>
    </div>

    {/* List */}
    <div className="max-h-60 overflow-y-auto">
      {filtered.length === 0 && (
        <div className="px-4 py-6 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">
          No results
        </div>
      )}
      {filtered.map(c => (
        <button
          key={c.code}
          onClick={() => onSelect(c.code)}
          className={cn(
            'w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-slate-50 transition-colors',
            c.code === selected && 'bg-[#345E85]/5',
          )}
        >
          <span className="text-base w-6 text-center">{c.flag}</span>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-black text-slate-900">{c.code}</p>
            <p className="text-[10px] text-slate-400 truncate">{c.name}</p>
          </div>
          <span className="text-[10px] font-bold text-slate-500 shrink-0">{c.symbol}</span>
          {c.code === selected && (
            <span className="w-1.5 h-1.5 rounded-full bg-[#345E85] shrink-0" />
          )}
        </button>
      ))}
    </div>
  </div>
);

export default CurrencySelector;
