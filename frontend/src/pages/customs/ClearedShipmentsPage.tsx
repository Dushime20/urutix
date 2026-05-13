import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Archive, Search, Eye, Inbox, CheckCircle } from 'lucide-react';
import { customsApi } from '../../services/customsApi';

const BRAND = '#345E85';

const ClearedShipmentsPage: React.FC = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['customs-cleared', search],
    queryFn: () => customsApi.getInspections({ status: 'CLEARED', search: search || undefined, limit: 50 }),
    refetchInterval: 60000,
  });

  const inspections: any[] = data?.data?.data || [];
  const total = data?.data?.total || 0;

  return (
    <div className="space-y-6 p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center">
            <Archive size={16} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900 dark:text-white">Cleared Shipments</h1>
            <p className="text-xs text-slate-400">{total} shipments cleared</p>
          </div>
        </div>
        <div className="relative w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            className="w-full pl-9 pr-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#345E85]/30"
            placeholder="Search..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-4 border-slate-200 border-t-emerald-600" />
        </div>
      ) : inspections.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-3">
          <Inbox className="w-12 h-12 text-slate-200" />
          <p className="text-sm font-bold">No cleared shipments</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
          <table className="min-w-full divide-y divide-slate-50 dark:divide-slate-800">
            <thead className="bg-slate-50 dark:bg-slate-800/50">
              <tr>
                {['Plate / Ref', 'Cargo', 'Route', 'Checkpoint', 'Cleared At', ''].map(h => (
                  <th key={h} className="px-5 py-3 text-left text-[9px] font-black text-slate-500 uppercase tracking-widest">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800/30">
              {inspections.map((ins: any) => (
                <tr key={ins.id} className="hover:bg-emerald-50/30 transition-colors cursor-pointer" onClick={() => navigate(`/dashboard/customs/inspections/${ins.id}`)}>
                  <td className="px-5 py-4">
                    <p className="text-sm font-bold text-slate-800 dark:text-white">{ins.plateNumber || '—'}</p>
                    <p className="text-[10px] font-mono text-slate-400">{ins.shipmentReference || ins.containerNumber || '—'}</p>
                  </td>
                  <td className="px-5 py-4 text-xs text-slate-600 dark:text-slate-300">{ins.cargoType || '—'}</td>
                  <td className="px-5 py-4 text-xs text-slate-500">
                    {ins.originCountry && ins.destinationCountry ? `${ins.originCountry} → ${ins.destinationCountry}` : '—'}
                  </td>
                  <td className="px-5 py-4 text-xs text-slate-500">{ins.checkpointName || '—'}</td>
                  <td className="px-5 py-4 text-xs text-slate-400 whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <CheckCircle size={12} className="text-emerald-500" />
                      {ins.completedAt ? new Date(ins.completedAt).toLocaleDateString() : new Date(ins.updatedAt).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <button onClick={e => { e.stopPropagation(); navigate(`/dashboard/customs/inspections/${ins.id}`); }}
                      className="p-1.5 rounded-lg bg-slate-100 hover:bg-emerald-100 text-slate-500 hover:text-emerald-600 transition-colors">
                      <Eye size={13} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ClearedShipmentsPage;
