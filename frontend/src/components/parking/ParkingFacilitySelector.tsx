import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ChevronDown, MapPin, Search, X } from 'lucide-react';
import { parkingApi } from '../../services/parkingApi';
import type { ParkingFacilitySearchResult } from '../../types/parking';
import { TranslatedText } from '../translated-text';
import { useAuth } from '../../contexts/AuthContext';

const fieldClass =
  'w-full px-4 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 placeholder:text-slate-400';
const labelClass = 'block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1';
const errorClass = 'mt-2 text-[10px] font-black text-red-600 uppercase tracking-wide px-1';

interface ParkingFacilitySelectorProps {
  value: ParkingFacilitySearchResult | null;
  onChange: (facility: ParkingFacilitySearchResult | null) => void;
  error?: string;
  authenticatedUser?: { tenantId?: string } | null;
}

export function ParkingFacilitySelector({
  value,
  onChange,
  error,
  authenticatedUser,
}: ParkingFacilitySelectorProps) {
  const auth = useAuth();
  const user = authenticatedUser ?? auth.user;
  const isAuthenticated = !!user?.tenantId || !!auth.user;
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [debounced, setDebounced] = useState('');
  const rootRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const didAutoSelect = useRef(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(query.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    const onPointer = (event: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, []);

  useEffect(() => {
    if (open) {
      window.setTimeout(() => searchRef.current?.focus(), 20);
    } else {
      setQuery('');
      setDebounced('');
    }
  }, [open]);

  const recommendedQuery = useQuery({
    queryKey: ['parking-facilities', 'recommended', user?.tenantId || 'guest'],
    queryFn: () => parkingApi.searchFacilities({ limit: 10 }),
    enabled: isAuthenticated,
    staleTime: 60_000,
  });

  const searchQuery = useQuery({
    queryKey: ['parking-facilities', 'search', debounced],
    queryFn: () => parkingApi.searchFacilities({ search: debounced || undefined, limit: 20 }),
    enabled: open,
    staleTime: 15_000,
  });

  useEffect(() => {
    if (!isAuthenticated || didAutoSelect.current || value) return;
    const items = recommendedQuery.data?.items || [];
    const recommended = items.find((item) => item.recommended && item.isAvailable) || items.find((item) => item.isAvailable);
    if (recommended?.id) {
      didAutoSelect.current = true;
      onChange(recommended);
    }
  }, [isAuthenticated, recommendedQuery.data, value, onChange]);

  const items = (searchQuery.data?.items || []).filter((item) => !!item.id);
  const searching = searchQuery.isFetching;
  const searchError = searchQuery.isError;
  const placeholder = isAuthenticated
    ? 'Search parking location, city or manager...'
    : 'Search parking location, city or manager...';

  const selectFacility = (selected: ParkingFacilitySearchResult) => {
    if (!selected.id) return;
    onChange(selected);
    setOpen(false);
  };

  return (
    <div ref={rootRef} className="relative">
      <label className={labelClass}>
        <TranslatedText text="Parking Location" />
      </label>
      {isAuthenticated && value?.recommended && (
        <p className="mb-2 px-1 text-[10px] font-black uppercase tracking-widest text-primary-600">
          <TranslatedText text="Recommended for you" />
        </p>
      )}
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
        aria-haspopup="listbox"
        className={`${fieldClass} flex items-center justify-between gap-3 text-left ${error ? 'border-red-400' : ''}`}
      >
        <span className="flex min-w-0 items-center gap-2">
          {!value && <Search className="h-4 w-4 shrink-0 text-slate-400" />}
          <span className={`truncate ${value ? 'font-semibold text-slate-800 dark:text-slate-100' : 'text-slate-400'}`}>
            {value ? value.facilityName : <TranslatedText text="Select parking location" />}
          </span>
        </span>
        <ChevronDown className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {value && !open && (
        <div className="mt-2 space-y-0.5 px-1">
          {value.managerName && value.managerName !== value.facilityName && (
            <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
              {`Managed by ${value.managerName}`}
            </p>
          )}
          {value.locationLabel && (
            <p className="flex items-center gap-1 text-[11px] font-medium text-slate-500 dark:text-slate-400">
              <MapPin className="h-3 w-3 shrink-0" />
              {value.locationLabel}
            </p>
          )}
          {typeof value.availableSpaces === 'number' && (
            <p className={`text-[11px] font-semibold ${value.isAvailable ? 'text-emerald-600' : 'text-amber-700'}`}>
              {value.isAvailable
                ? `${value.availableSpaces} ${value.availableSpaces === 1 ? 'space' : 'spaces'} available`
                : 'No spaces currently available'}
            </p>
          )}
        </div>
      )}

      {open && (
        <>
          <div className="fixed inset-0 z-40 bg-slate-900/40 sm:hidden" onClick={() => setOpen(false)} />
          <div className="fixed inset-x-0 bottom-0 z-50 max-h-[80vh] overflow-hidden rounded-t-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-800 sm:absolute sm:inset-auto sm:top-full sm:mt-2 sm:max-h-80 sm:w-full sm:rounded-xl sm:shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 sm:hidden dark:border-slate-700">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                <TranslatedText text="Parking Location" />
              </p>
              <button type="button" onClick={() => setOpen(false)} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="p-3">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  ref={searchRef}
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder={placeholder}
                  className={`${fieldClass} pl-10`}
                  aria-label="Search parking facilities"
                />
              </div>
            </div>
            <div className="max-h-[55vh] overflow-y-auto pb-4 sm:max-h-56">
              {searching && items.length === 0 && (
                <p className="px-4 py-6 text-center text-sm font-medium text-slate-500">
                  <TranslatedText text="Searching parking facilities..." />
                </p>
              )}
              {searchError && (
                <p className="px-4 py-6 text-center text-sm font-semibold text-rose-600">
                  <TranslatedText text="Unable to load parking facilities. Please try again." />
                </p>
              )}
              {!searching && !searchError && items.length === 0 && (
                <p className="px-4 py-6 text-center text-sm font-medium text-slate-500">
                  <TranslatedText text="No parking facilities found." />
                  <span className="mt-1 block text-[11px] font-medium text-slate-400">
                    <TranslatedText text="Parking reservation managers must add a location with city and country before drivers can book it." />
                  </span>
                </p>
              )}
              {items.map((facility) => {
                const selected = value?.id === facility.id;
                return (
                  <button
                    type="button"
                    key={facility.id}
                    onClick={() => selectFacility(facility)}
                    className={`w-full px-4 py-3 text-left transition-colors hover:bg-slate-50 dark:hover:bg-slate-700/50 ${selected ? 'bg-primary-50/70 dark:bg-primary-950/30' : ''}`}
                  >
                    <p className="text-sm font-bold text-slate-900 dark:text-white">{facility.facilityName}</p>
                    {facility.managerName && facility.managerName !== facility.facilityName && (
                      <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">{facility.managerName}</p>
                    )}
                    {facility.locationLabel && (
                      <p className="mt-0.5 flex items-center gap-1 text-[11px] font-medium text-slate-500">
                        <MapPin className="h-3 w-3" />
                        {facility.locationLabel}
                      </p>
                    )}
                    <p className={`mt-0.5 text-[11px] font-semibold ${facility.isAvailable ? 'text-emerald-600' : 'text-amber-700'}`}>
                      {facility.isAvailable
                        ? `${facility.availableSpaces} ${facility.availableSpaces === 1 ? 'space' : 'spaces'} available`
                        : 'No spaces currently available'}
                    </p>
                    {facility.recommended && (
                      <p className="mt-1 text-[10px] font-black uppercase tracking-widest text-primary-600">
                        <TranslatedText text="Recommended for you" />
                      </p>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
      {error && <p className={errorClass}>{error}</p>}
    </div>
  );
}
