import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Search, Truck, ShieldCheck, AlertTriangle, MapPin, User, Inbox,
  Plus, FileText, ExternalLink, Eye, X, Package,
  Hash, ArrowRight,
} from 'lucide-react';
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

  const [selectedTrip, setSelectedTrip] = useState<any | null>(null);

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

                  <div className="flex gap-2 flex-shrink-0 flex-wrap justify-end">
                    <button
                      onClick={() => setSelectedTrip(r)}
                      className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors flex items-center gap-1"
                    >
                      <Eye size={12} /> View Details
                    </button>
                    {r.lastInspectionId ? (
                      <button
                        onClick={() => navigate(`/dashboard/customs/inspections/${r.lastInspectionId}`)}
                        className="px-4 py-2 rounded-xl text-xs font-bold border border-[#345E85] text-[#345E85] hover:bg-blue-50 transition-colors flex items-center gap-1"
                      >
                        <ShieldCheck size={12} /> View Inspection
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
                    {r.cargoWeight && <span className="ml-auto font-normal text-amber-600">Weight: {r.cargoWeight} kg</span>}
                  </div>
                )}

                {/* Cargo Documents */}
                {r.documents && r.documents.length > 0 && (
                  <div className="mt-4 border-t border-slate-100 dark:border-slate-800 pt-3">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1">
                      <FileText size={10} /> Cargo Documents ({r.documents.length})
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {r.documents.map((doc: any) => (
                        <a
                          key={doc.id}
                          href={doc.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-300 hover:border-[#345E85]/50 hover:text-[#345E85] transition-colors"
                        >
                          <FileText size={11} />
                          <span className="max-w-[140px] truncate">{doc.title || doc.fileName || 'Document'}</span>
                          <span className="text-[9px] text-slate-400 uppercase">{doc.documentType}</span>
                          <ExternalLink size={10} className="text-slate-300 flex-shrink-0" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {r.documents && r.documents.length === 0 && (
                  <div className="mt-3 flex items-center gap-2 text-xs text-slate-400 bg-slate-50 dark:bg-slate-800 rounded-xl px-4 py-2">
                    <FileText size={12} />
                    No cargo documents uploaded for this shipment
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}
      {/* Trip Detail Modal */}
      {selectedTrip && (
        <div className="fixed inset-0 bg-black/50 z-[200] flex items-center justify-center p-4" onClick={() => setSelectedTrip(null)}>
          <div
            className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal header */}
            <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800 sticky top-0 bg-white dark:bg-slate-900 rounded-t-2xl z-10">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: BRAND }}>
                  <Truck size={16} className="text-white" />
                </div>
                <div>
                  <h2 className="text-base font-black text-slate-900 dark:text-white">Trip Details</h2>
                  <p className="text-xs text-slate-400">{selectedTrip.tripNumber || selectedTrip.tripId?.slice(0, 8)}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={cn('text-[9px] font-black px-2 py-1 rounded-lg uppercase tracking-wide', statusBadge[selectedTrip.status] || 'bg-slate-100 text-slate-600')}>
                  {selectedTrip.status?.replace(/_/g, ' ')}
                </span>
                <button
                  onClick={() => setSelectedTrip(null)}
                  className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <X size={16} className="text-slate-500" />
                </button>
              </div>
            </div>

            <div className="p-5 space-y-5">

              {/* Vehicle & Driver */}
              <section>
                <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-1.5">
                  <Truck size={11} /> Vehicle & Driver
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'Plate Number', value: selectedTrip.plateNumber, icon: <Hash size={11}/> },
                    { label: 'Truck Type', value: selectedTrip.truckType, icon: <Truck size={11}/> },
                    { label: 'Driver Name', value: selectedTrip.driverName, icon: <User size={11}/> },
                    { label: 'Driver ID', value: selectedTrip.driverId?.slice(0, 12), icon: <Hash size={11}/> },
                  ].filter(f => f.value).map(f => (
                    <div key={f.label} className="bg-slate-50 dark:bg-slate-800 rounded-xl px-3 py-2.5">
                      <p className="text-[10px] text-slate-400 flex items-center gap-1 mb-0.5">{f.icon}{f.label}</p>
                      <p className="text-xs font-bold text-slate-800 dark:text-white truncate">{f.value}</p>
                    </div>
                  ))}
                </div>
              </section>

              {/* Cargo */}
              <section>
                <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-1.5">
                  <Package size={11} /> Cargo Information
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'Cargo Title', value: selectedTrip.cargoTitle },
                    { label: 'Cargo Type', value: selectedTrip.cargoType },
                    { label: 'Weight', value: selectedTrip.cargoWeight ? `${selectedTrip.cargoWeight} kg` : null },
                    { label: 'Load ID', value: selectedTrip.loadId?.slice(0, 12) },
                  ].filter(f => f.value).map(f => (
                    <div key={f.label} className="bg-slate-50 dark:bg-slate-800 rounded-xl px-3 py-2.5">
                      <p className="text-[10px] text-slate-400 mb-0.5">{f.label}</p>
                      <p className="text-xs font-bold text-slate-800 dark:text-white truncate">{f.value}</p>
                    </div>
                  ))}
                </div>
              </section>

              {/* Route */}
              <section>
                <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-1.5">
                  <MapPin size={11} /> Route
                </h3>
                <div className="bg-slate-50 dark:bg-slate-800 rounded-xl px-4 py-3 flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] text-slate-400">Origin</p>
                    <p className="text-xs font-bold text-slate-800 dark:text-white truncate">
                      {selectedTrip.origin?.name || selectedTrip.origin?.city || selectedTrip.origin?.address || '—'}
                    </p>
                    {selectedTrip.origin?.country && <p className="text-[10px] text-slate-400">{selectedTrip.origin.country}</p>}
                  </div>
                  <ArrowRight size={16} className="text-slate-300 flex-shrink-0" />
                  <div className="flex-1 min-w-0 text-right">
                    <p className="text-[10px] text-slate-400">Destination</p>
                    <p className="text-xs font-bold text-slate-800 dark:text-white truncate">
                      {selectedTrip.destination?.name || selectedTrip.destination?.city || selectedTrip.destination?.address || '—'}
                    </p>
                    {selectedTrip.destination?.country && <p className="text-[10px] text-slate-400">{selectedTrip.destination.country}</p>}
                  </div>
                </div>
              </section>

              {/* Inspection Status */}
              <section>
                <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-1.5">
                  <ShieldCheck size={11} /> Customs Status
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-50 dark:bg-slate-800 rounded-xl px-3 py-2.5">
                    <p className="text-[10px] text-slate-400 mb-0.5">Inspection Status</p>
                    <p className={cn('text-xs font-black uppercase', {
                      'text-emerald-600': selectedTrip.customsStatus === 'CLEARED',
                      'text-rose-600': selectedTrip.customsStatus === 'REJECTED',
                      'text-amber-600': selectedTrip.customsStatus === 'PENDING' || selectedTrip.customsStatus === 'IN_PROGRESS',
                      'text-red-700': selectedTrip.customsStatus === 'HIGH_RISK',
                      'text-slate-400': !selectedTrip.customsStatus,
                    })}>
                      {selectedTrip.customsStatus?.replace(/_/g, ' ') || 'Not Inspected'}
                    </p>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800 rounded-xl px-3 py-2.5">
                    <p className="text-[10px] text-slate-400 mb-0.5">Risk Level</p>
                    <p className={cn('text-xs font-black uppercase', {
                      'text-emerald-600': selectedTrip.riskLevel === 'LOW',
                      'text-amber-600': selectedTrip.riskLevel === 'MEDIUM',
                      'text-rose-600': selectedTrip.riskLevel === 'HIGH',
                      'text-red-700': selectedTrip.riskLevel === 'CRITICAL',
                      'text-slate-400': !selectedTrip.riskLevel,
                    })}>
                      {selectedTrip.riskLevel || '—'}
                    </p>
                  </div>
                </div>
              </section>

              {/* Cargo Documents */}
              <section>
                <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-1.5">
                  <FileText size={11} /> Cargo Documents ({selectedTrip.documents?.length || 0})
                </h3>
                {selectedTrip.documents?.length > 0 ? (
                  <div className="space-y-2">
                    {selectedTrip.documents.map((doc: any) => (
                      <a
                        key={doc.id}
                        href={doc.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:border-[#345E85]/50 hover:bg-blue-50 dark:hover:bg-slate-700 transition-all group"
                      >
                        <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                          <FileText size={14} className="text-[#345E85]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-slate-800 dark:text-white truncate">
                            {doc.title || doc.fileName || 'Document'}
                          </p>
                          <p className="text-[10px] text-slate-400 uppercase">
                            {doc.documentType} {doc.status && `· ${doc.status}`}
                          </p>
                        </div>
                        <ExternalLink size={12} className="text-slate-300 group-hover:text-[#345E85] flex-shrink-0 transition-colors" />
                      </a>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-50 dark:bg-slate-800 rounded-xl px-4 py-3">
                    <FileText size={13} /> No cargo documents uploaded for this shipment
                  </div>
                )}
              </section>
            </div>

            {/* Modal footer actions */}
            <div className="flex gap-3 p-5 border-t border-slate-100 dark:border-slate-800 sticky bottom-0 bg-white dark:bg-slate-900 rounded-b-2xl">
              <button
                onClick={() => setSelectedTrip(null)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Close
              </button>
              {selectedTrip.lastInspectionId && (
                <button
                  onClick={() => { setSelectedTrip(null); navigate(`/dashboard/customs/inspections/${selectedTrip.lastInspectionId}`); }}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-[#345E85] text-[#345E85] text-sm font-bold hover:bg-blue-50 transition-colors flex items-center justify-center gap-2"
                >
                  <ShieldCheck size={14} /> View Inspection
                </button>
              )}
              <button
                onClick={() => { setSelectedTrip(null); navigate(`/dashboard/customs/inspections/new?tripId=${selectedTrip.tripId}&plate=${selectedTrip.plateNumber || ''}`); }}
                className="flex-1 px-4 py-2.5 rounded-xl text-white text-sm font-bold hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                style={{ background: BRAND }}
              >
                <Plus size={14} /> Start Inspection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TruckSearchPage;
