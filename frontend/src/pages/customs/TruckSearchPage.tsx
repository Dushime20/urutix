import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Search, Truck, ShieldCheck, AlertTriangle, MapPin, User, Inbox, Plus } from 'lucide-react';
import { customsApi } from '../../services/customsApi';
import { cn } from '../../utils/cn';

const BRAND = '#345E85';

const statusBadge: Record<string, string> = {
  PENDING:     'bg-amber-100 text-amber-700',
  IN_PROGRESS: 'bg-blue-100 text-blue-700',
  CLEARED:     'bg-emerald-100 text-emerald-700',
  REJECTED:    'bg-rose-100 text-rose-700',
  ON_HOLD:     'bg-purple-100 text-purple-700',
  HIGH_RISK:   'bg-red-100 text-red-700',
};

const TruckSearchPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [searchType, setSearchType] = useState<'plateNumber' | 'shipmentReference' | 'containerNumber' | 'driverName'>('plateNumber');
  const [submitted, setSubmitted] = useState(!!searchParams.get('q'));
  const [searchInput, setSearchInput] = useState<Record<string, string>>({
    plateNumber: searchParams.get('q') || '',
    shipmentReference: '',
    containerNumber: '',
    driverName: '',
  });

  const searchPayload = submitted ? { [searchType]: query } : null;

  const { data, isLoading } = useQuery({
    queryKey: ['customs-truck-search', searchPayload],
    queryFn: () => customsApi.searchTruck(searchPayload as any),
    enabled: submitted && !!query.trim(),
  });

  const results: any[] = data?.data?.data || [];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const val = searchInput[searchType]?.trim();
    if (!val) return;
    setQuery(val);
    setSubmitted(true);
  };

  const searchTypes = [
    { key: 'plateNumber', label: 'Plate Number', placeholder: 'e.g. KDA 123A' },
    { key: 'shipmentReference', label: 'Shipment Ref', placeholder: 'e.g. SHP-20240001' },
    { key: 'containerNumber', label: 'Container ID', placeholder: 'e.g. MSCU1234567' },
    { key: 'driverName', label: 'Driver Name', placeholder: 'Driver full name' },
  ];

  return (
    <div className="space-y-6 p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: BRAND }}>
          <Search size={16} className="text-white" />
        </div>
        <div>
          <h1 className="text-xl font-black text-slate-900 dark:text-white">Truck & Shipment Search</h1>
          <p className="text-xs text-slate-400">Search vehicles, cargo, and shipments for inspection</p>
        </div>
      </div>

      {/* Search Panel */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
        {/* Search type tabs */}
        <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
          {searchTypes.map(st => (
            <button
              key={st.key}
              onClick={() => setSearchType(st.key as any)}
              className={cn(
                'px-4 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all',
                searchType === st.key
                  ? 'text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200',
              )}
              style={searchType === st.key ? { background: BRAND } : {}}
            >
              {st.label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSearch} className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder={searchTypes.find(s => s.key === searchType)?.placeholder}
              className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#345E85]/30"
              value={searchInput[searchType]}
              onChange={e => setSearchInput(prev => ({ ...prev, [searchType]: e.target.value }))}
            />
          </div>
          <button
            type="submit"
            className="px-6 py-3 rounded-xl text-white text-sm font-bold transition-opacity hover:opacity-90"
            style={{ background: BRAND }}
          >
            Search
          </button>
        </form>
      </div>

      {/* Results */}
      {submitted && (
        <div className="space-y-3">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
            {isLoading ? 'Searching...' : `${results.length} result(s) found`}
          </p>

          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-8 w-8 border-4 border-slate-200 border-t-[#345E85]" />
            </div>
          ) : results.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-3">
              <Inbox className="w-12 h-12 text-slate-200" />
              <p className="text-sm font-bold">No trucks or shipments found</p>
              <p className="text-xs">Try different search criteria</p>
            </div>
          ) : (
            results.map((r: any) => (
              <div
                key={r.tripId}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 hover:border-[#345E85]/40 hover:shadow-md transition-all"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="flex gap-4">
                    {/* Truck icon */}
                    <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
                      <Truck className="w-6 h-6 text-[#345E85]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="text-base font-black text-slate-900 dark:text-white">{r.plateNumber || 'Unknown Plate'}</span>
                        <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-lg">{r.truckType || 'Truck'}</span>
                        {r.customsStatus && (
                          <span className={cn('text-[9px] font-black px-2 py-0.5 rounded-lg uppercase tracking-wide', statusBadge[r.customsStatus] || 'bg-slate-100 text-slate-600')}>
                            {r.customsStatus.replace(/_/g, ' ')}
                          </span>
                        )}
                      </div>
                      <p className="text-xs font-bold text-slate-600 mb-2">{r.cargoTitle || r.cargoType || 'Unknown cargo'}</p>
                      <div className="flex flex-wrap gap-4 text-xs text-slate-500">
                        {r.driverName && (
                          <span className="flex items-center gap-1">
                            <User size={12} /> {r.driverName}
                          </span>
                        )}
                        {(r.origin || r.destination) && (
                          <span className="flex items-center gap-1">
                            <MapPin size={12} />
                            {r.origin?.city || r.origin?.address || '?'} → {r.destination?.city || r.destination?.address || '?'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 flex-shrink-0">
                    {r.lastInspectionId ? (
                      <button
                        onClick={() => navigate(`/dashboard/customs/inspections/${r.lastInspectionId}`)}
                        className="px-4 py-2 rounded-xl text-xs font-bold border border-[#345E85] text-[#345E85] hover:bg-blue-50 transition-colors"
                      >
                        <ShieldCheck size={12} className="inline mr-1" />
                        View Inspection
                      </button>
                    ) : null}
                    <button
                      onClick={() => navigate(`/dashboard/customs/inspections/new?tripId=${r.tripId}&plate=${r.plateNumber || ''}`)}
                      className="px-4 py-2 rounded-xl text-xs font-bold text-white transition-opacity hover:opacity-90 flex items-center gap-1"
                      style={{ background: BRAND }}
                    >
                      <Plus size={12} /> Start Inspection
                    </button>
                  </div>
                </div>

                {r.riskLevel && r.riskLevel !== 'LOW' && (
                  <div className="mt-3 flex items-center gap-2 text-xs font-bold text-amber-700 bg-amber-50 rounded-xl px-4 py-2">
                    <AlertTriangle size={13} />
                    Risk Level: {r.riskLevel}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default TruckSearchPage;
