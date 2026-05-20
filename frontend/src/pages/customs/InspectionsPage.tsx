import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ShieldCheck, Plus, Search, Eye, Inbox } from 'lucide-react';
import { customsApi } from '../../services/customsApi';
import { cn } from '../../utils/cn';

const BRAND = '#2c5173';

const STATUSES = ['', 'PENDING', 'IN_PROGRESS', 'CLEARED', 'REJECTED', 'ON_HOLD', 'HIGH_RISK'];
const RISKS    = ['', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

const statusBadge: Record<string, string> = {
  PENDING:     'bg-amber-100 text-amber-700',
  IN_PROGRESS: 'bg-blue-100 text-blue-700',
  CLEARED:     'bg-emerald-100 text-emerald-700',
  REJECTED:    'bg-rose-100 text-rose-700',
  ON_HOLD:     'bg-purple-100 text-purple-700',
  HIGH_RISK:   'bg-red-100 text-red-700',
};

const riskBadge: Record<string, string> = {
  LOW:      'bg-emerald-100 text-emerald-700',
  MEDIUM:   'bg-amber-100 text-amber-700',
  HIGH:     'bg-rose-100 text-rose-700',
  CRITICAL: 'bg-red-900 text-white',
};

const InspectionsPage: React.FC = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [risk, setRisk] = useState('');
  const [page, setPage] = useState(0);
  const limit = 20;

  const { data, isLoading } = useQuery({
    queryKey: ['customs-inspections', status, risk, search, page],
    queryFn: () => customsApi.getInspections({
      status: status || undefined,
      riskLevel: risk || undefined,
      search: search || undefined,
      limit,
      offset: page * limit,
    }),
    refetchInterval: 30000,
  });

  const inspections: any[] = data?.data?.data || [];
  const total: number = data?.data?.total || 0;
  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <div className="space-y-6 p-6 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: BRAND }}>
            <ShieldCheck size={16} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900 dark:text-white">All Inspections</h1>
            <p className="text-xs text-slate-400">{total} total inspections</p>
          </div>
        </div>
        <button
          onClick={() => navigate('/dashboard/customs/inspections/new')}
          className="px-5 py-2.5 rounded-xl text-white text-sm font-bold flex items-center gap-2 hover:opacity-90 transition-opacity"
          style={{ background: BRAND }}
        >
          <Plus size={15} /> New Inspection
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search plate, ref, container, driver..."
            className="w-full pl-9 pr-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2c5173]/30"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(0); }}
          />
        </div>
        <select
          className="px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold focus:outline-none"
          value={status}
          onChange={e => { setStatus(e.target.value); setPage(0); }}
        >
          <option value="">All Statuses</option>
          {STATUSES.filter(Boolean).map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
        </select>
        <select
          className="px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold focus:outline-none"
          value={risk}
          onChange={e => { setRisk(e.target.value); setPage(0); }}
        >
          <option value="">All Risk Levels</option>
          {RISKS.filter(Boolean).map(r => <option key={r} value={r}>{r}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-800">
          <thead className="bg-slate-50 dark:bg-slate-800/60">
            <tr>
              {['Plate / Ref', 'Cargo Type', 'Route', 'Driver', 'Checkpoint', 'Risk', 'Status', 'Date', ''].map(h => (
                <th key={h} className="px-4 py-3 text-left text-[9px] font-black text-slate-500 uppercase tracking-widest">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 dark:divide-slate-800/40">
            {isLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <tr key={i}>
                  {Array.from({ length: 9 }).map((_, j) => (
                    <td key={j} className="px-4 py-4">
                      <div className="h-3 bg-slate-100 rounded animate-pulse" />
                    </td>
                  ))}
                </tr>
              ))
            ) : inspections.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-16 text-center">
                  <Inbox className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                  <p className="text-sm font-bold text-slate-400">No inspections found</p>
                </td>
              </tr>
            ) : inspections.map((ins: any) => (
              <tr
                key={ins.id}
                className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors cursor-pointer"
                onClick={() => navigate(`/dashboard/customs/inspections/${ins.id}`)}
              >
                <td className="px-4 py-4">
                  <p className="text-sm font-bold text-slate-800 dark:text-white">{ins.plateNumber || '—'}</p>
                  <p className="text-[10px] font-mono text-slate-400">{ins.shipmentReference || ins.containerNumber || '—'}</p>
                </td>
                <td className="px-4 py-4 text-xs text-slate-600 dark:text-slate-300">{ins.cargoType || '—'}</td>
                <td className="px-4 py-4 text-xs text-slate-500">
                  {ins.originCountry && ins.destinationCountry
                    ? `${ins.originCountry} → ${ins.destinationCountry}`
                    : ins.originCountry || ins.destinationCountry || '—'}
                </td>
                <td className="px-4 py-4 text-xs text-slate-500">{ins.driverName || '—'}</td>
                <td className="px-4 py-4 text-xs text-slate-500">{ins.checkpointName || '—'}</td>
                <td className="px-4 py-4">
                  <span className={cn('text-[9px] font-black px-2 py-0.5 rounded-lg uppercase', riskBadge[ins.riskLevel] || 'bg-slate-100 text-slate-600')}>
                    {ins.riskLevel}
                  </span>
                </td>
                <td className="px-4 py-4">
                  <span className={cn('text-[9px] font-black px-2 py-0.5 rounded-lg uppercase tracking-wide', statusBadge[ins.status] || 'bg-slate-100 text-slate-600')}>
                    {ins.status?.replace(/_/g, ' ')}
                  </span>
                </td>
                <td className="px-4 py-4 text-xs text-slate-400 whitespace-nowrap">
                  {new Date(ins.createdAt).toLocaleDateString()}
                </td>
                <td className="px-4 py-4">
                  <button
                    onClick={e => { e.stopPropagation(); navigate(`/dashboard/customs/inspections/${ins.id}`); }}
                    className="p-1.5 rounded-lg bg-slate-100 hover:bg-[#2c5173]/10 text-slate-500 hover:text-[#2c5173] transition-colors"
                  >
                    <Eye size={13} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-slate-400">Showing {page * limit + 1}–{Math.min((page + 1) * limit, total)} of {total}</p>
          <div className="flex gap-2">
            <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
              className="px-3 py-1.5 rounded-lg border text-xs font-bold disabled:opacity-40">Prev</button>
            <span className="px-3 py-1.5 text-xs font-bold text-slate-600">{page + 1}/{totalPages}</span>
            <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page === totalPages - 1}
              className="px-3 py-1.5 rounded-lg border text-xs font-bold disabled:opacity-40">Next</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default InspectionsPage;
