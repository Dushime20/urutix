import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { createPortal } from 'react-dom';
import { FaCheck, FaChevronDown, FaSearch, FaTimes } from 'react-icons/fa';

export interface SearchableSelectOption {
  value: string;
  label: string;
  description?: string;
}

export interface SearchableSelectProps {
  options: SearchableSelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  disabled?: boolean;
  emptyMessage?: string;
  allowClear?: boolean;
  className?: string;
  triggerClassName?: string;
}

export function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = 'Select an option',
  searchPlaceholder = 'Search…',
  disabled = false,
  emptyMessage = 'No matching options',
  allowClear = false,
  className = '',
  triggerClassName = '',
}: SearchableSelectProps) {
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });

  const selected = useMemo(
    () => options.find((option) => option.value === value) || null,
    [options, value],
  );

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return options;
    return options.filter((option) => {
      const haystack = `${option.label} ${option.description || ''} ${option.value}`.toLowerCase();
      return haystack.includes(term);
    });
  }, [options, query]);

  const updatePosition = () => {
    const el = triggerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const maxHeight = 280;
    const spaceBelow = window.innerHeight - rect.bottom;
    const openUp = spaceBelow < maxHeight + 12 && rect.top > spaceBelow;
    setCoords({
      top: openUp ? Math.max(8, rect.top - maxHeight - 8) : rect.bottom + 8,
      left: rect.left,
      width: rect.width,
    });
  };

  useEffect(() => {
    if (!open) return;
    updatePosition();
    const handle = () => updatePosition();
    window.addEventListener('resize', handle);
    window.addEventListener('scroll', handle, true);
    const id = window.setTimeout(() => searchRef.current?.focus(), 20);
    return () => {
      window.clearTimeout(id);
      window.removeEventListener('resize', handle);
      window.removeEventListener('scroll', handle, true);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: MouseEvent) => {
      const target = event.target as Node;
      if (triggerRef.current?.contains(target) || panelRef.current?.contains(target)) return;
      setOpen(false);
      setQuery('');
    };
    document.addEventListener('mousedown', onPointer);
    return () => document.removeEventListener('mousedown', onPointer);
  }, [open]);

  const close = () => {
    setOpen(false);
    setQuery('');
  };

  const choose = (next: string) => {
    onChange(next);
    close();
  };

  const onTriggerKey = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === 'ArrowDown' || event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      setOpen(true);
    }
  };

  const onSearchKey = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      close();
      triggerRef.current?.focus();
    }
    if (event.key === 'Enter' && filtered[0]) {
      event.preventDefault();
      choose(filtered[0].value);
    }
  };

  const panel = open && typeof document !== 'undefined'
    ? createPortal(
        <div
          ref={panelRef}
          className="fixed z-[10120] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl dark:border-slate-600 dark:bg-slate-800"
          style={{ top: coords.top, left: coords.left, width: coords.width }}
        >
          <div className="border-b border-slate-200 p-2 dark:border-slate-600">
            <div className="relative">
              <FaSearch className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <input
                ref={searchRef}
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={onSearchKey}
                placeholder={searchPlaceholder}
                className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-900 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
                aria-label={searchPlaceholder}
              />
            </div>
          </div>
          <ul className="max-h-64 overflow-y-auto py-1" role="listbox">
            {filtered.length === 0 ? (
              <li className="px-3 py-3 text-center text-sm text-slate-500">{emptyMessage}</li>
            ) : (
              filtered.map((option) => {
                const isSelected = option.value === value;
                return (
                  <li key={option.value}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={isSelected}
                      onClick={() => choose(option.value)}
                      className={`flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left text-sm hover:bg-slate-50 dark:hover:bg-slate-700 ${
                        isSelected ? 'bg-primary-50 text-primary-800 dark:bg-primary-900/30 dark:text-primary-100' : 'text-slate-800 dark:text-slate-100'
                      }`}
                    >
                      <span className="min-w-0">
                        <span className="block truncate font-medium">{option.label}</span>
                        {option.description && (
                          <span className="mt-0.5 block truncate text-xs text-slate-500">{option.description}</span>
                        )}
                      </span>
                      {isSelected && <FaCheck className="h-3.5 w-3.5 shrink-0 text-primary-600" />}
                    </button>
                  </li>
                );
              })
            )}
          </ul>
        </div>,
        document.body,
      )
    : null;

  return (
    <div className={`relative ${className}`}>
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen((current) => !current)}
        onKeyDown={onTriggerKey}
        className={`ui-input flex w-full items-center justify-between gap-2 rounded-xl border p-3 text-left disabled:cursor-not-allowed disabled:opacity-60 ${triggerClassName}`}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className={`truncate ${selected ? 'text-slate-900 dark:text-slate-100' : 'text-slate-400'}`}>
          {selected?.label || placeholder}
        </span>
        <span className="flex shrink-0 items-center gap-1 text-slate-400">
          {allowClear && selected && !disabled && (
            <span
              role="button"
              tabIndex={-1}
              onClick={(event) => {
                event.stopPropagation();
                onChange('');
              }}
              className="rounded p-1 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-700"
              aria-label="Clear selection"
            >
              <FaTimes className="h-3 w-3" />
            </span>
          )}
          <FaChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
        </span>
      </button>
      {panel}
    </div>
  );
}

export default SearchableSelect;
