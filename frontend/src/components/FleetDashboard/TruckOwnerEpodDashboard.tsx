import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  FileCheck,
  Truck,
  User,
  Calendar,
  Filter,
  Download,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Eye,
  DollarSign,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../services/api';
import { EpodViewer } from '../trips/EpodViewer';
import toast from 'react-hot-toast';

interface EpodListItem {
  id: string;
  tripId: string;
  tripNumber: string;
  truckNumber: string;
  driverName: string;
  loadTitle: string;
  recipientName: string;
  status: 'PENDING' | 'CONFIRMED' | 'DISPUTED';
  submittedAt: string;
  confirmedAt?: string;
  hasSignature: boolean;
  photoCount: number;
}

interface EpodSummary {
  totalEpods: number;
  pendingConfirmations: number;
  confirmedDeliveries: number;
  totalRevenue: number;
}

const TruckOwnerEpodDashboard: React.FC = () => {
  const [selectedEpodId, setSelectedEpodId] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    truckId: '',
    driverId: '',
    startDate: '',
    endDate: '',
    status: 'all',
  });
  const [page, setPage] = useState(1);
  const limit = 20;

  // Fetch ePODs
  const { data, isLoading, error } = useQuery({
    queryKey: ['fleet-epods', filters, page],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.truckId) params.append('truckId', filters.truckId);
      if (filters.driverId) params.append('driverId', filters.driverId);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      if (filters.status !== 'all') params.append('status', filters.status);
      params.append('page', page.toString());
      params.append('limit', limit.toString());

      const response = await api.get(`/fleet/epods?${params.toString()}`);
      return response.data.data;
    },
  });

  const epods: EpodListItem[] = data?.epods || [];
  const summary: EpodSummary = data?.summary || {
    totalEpods: 0,
    pendingConfirmations: 0,
    confirmedDeliveries: 0,
    totalRevenue: 0,
  };
  const pagination = data?.pagination || { total: 0, page: 1, limit: 20, totalPages: 1 };

  const statusConfig = {
    PENDING: { label: 'Pending', color: 'text-amber-600 bg-amber-50 border-amber-200', icon: Clock },
    CONFIRMED: { label: 'Confirmed', color: 'text-emerald-600 bg-emerald-50 border-emerald-200', icon: CheckCircle2 },
    DISPUTED: { label: 'Disputed', color: 'text-red-600 bg-red-50 border-red-200', icon: AlertTriangle },
  };

  const handleExport = () => {
    toast.success('Export functionality coming soon!');
  };

  if (selectedEpodId) {
    return (
      <div className="space-y-6">
        <button
          onClick={() => setSelectedEpodId(null)}
          className="flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors"
        >
          ← Back to ePOD List
        </button>
        <EpodViewer tripId={selectedEpodId} canConfirm={false} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">ePOD Reports</h1>
          <p className="text-sm text-slate-500 mt-1">View delivery confirmations and proof of delivery</p>
        </div>
        <button
          onClick={handleExport}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors"
        >
          <Download size={16} />
          Export
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
              <FileCheck size={20} className="text-blue-600" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900">{summary.totalEpods}</p>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total ePODs</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
              <Clock size={20} className="text-amber-600" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900">{summary.pendingConfirmations}</p>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Pending</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
              <CheckCircle2 size={20} className="text-emerald-600" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900">{summary.confirmedDeliveries}</p>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Confirmed</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center">
              <DollarSign size={20} className="text-green-600" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900">${summary.totalRevenue.toLocaleString()}</p>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Revenue</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Filter size={16} className="text-slate-400" />
          <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Filters</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-2">Status</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="PENDING">Pending</option>
              <option value="CONFIRMED">Confirmed</option>
              <option value="DISPUTED">Disputed</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-2">Start Date</label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-2">End Date</label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="md:col-span-2 flex items-end">
            <button
              onClick={() => setFilters({ truckId: '', driverId: '', startDate: '', endDate: '', status: 'all' })}
              className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* ePOD List */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-20">
            <AlertTriangle size={48} className="text-red-400 mb-4" />
            <p className="text-sm font-semibold text-slate-600">Failed to load ePODs</p>
          </div>
        ) : epods.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <FileCheck size={48} className="text-slate-300 mb-4" />
            <p className="text-sm font-semibold text-slate-600">No ePODs found</p>
            <p className="text-xs text-slate-400 mt-1">Try adjusting your filters</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-black text-slate-500 uppercase tracking-wider">Trip</th>
                    <th className="px-6 py-3 text-left text-xs font-black text-slate-500 uppercase tracking-wider">Truck</th>
                    <th className="px-6 py-3 text-left text-xs font-black text-slate-500 uppercase tracking-wider">Driver</th>
                    <th className="px-6 py-3 text-left text-xs font-black text-slate-500 uppercase tracking-wider">Load</th>
                    <th className="px-6 py-3 text-left text-xs font-black text-slate-500 uppercase tracking-wider">Recipient</th>
                    <th className="px-6 py-3 text-left text-xs font-black text-slate-500 uppercase tracking-wider">Submitted</th>
                    <th className="px-6 py-3 text-left text-xs font-black text-slate-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-black text-slate-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <AnimatePresence>
                    {epods.map((epod) => {
                      const StatusIcon = statusConfig[epod.status].icon;
                      return (
                        <motion.tr
                          key={epod.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="hover:bg-slate-50 transition-colors"
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <p className="text-sm font-semibold text-slate-900">{epod.tripNumber}</p>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <Truck size={14} className="text-slate-400" />
                              <p className="text-sm text-slate-600">{epod.truckNumber}</p>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <User size={14} className="text-slate-400" />
                              <p className="text-sm text-slate-600">{epod.driverName}</p>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <p className="text-sm text-slate-600 max-w-xs truncate">{epod.loadTitle}</p>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <p className="text-sm text-slate-600">{epod.recipientName}</p>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <Calendar size={14} className="text-slate-400" />
                              <p className="text-sm text-slate-600">
                                {new Date(epod.submittedAt).toLocaleDateString()}
                              </p>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${statusConfig[epod.status].color}`}>
                              <StatusIcon size={12} />
                              {statusConfig[epod.status].label}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <button
                              onClick={() => setSelectedEpodId(epod.tripId)}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-xs font-semibold hover:bg-blue-100 transition-colors"
                            >
                              <Eye size={14} />
                              View
                            </button>
                          </td>
                        </motion.tr>
                      );
                    })}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100">
                <p className="text-sm text-slate-600">
                  Showing {((page - 1) * limit) + 1} to {Math.min(page * limit, pagination.total)} of {pagination.total} results
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Previous
                  </button>
                  <span className="text-sm font-semibold text-slate-600">
                    Page {page} of {pagination.totalPages}
                  </span>
                  <button
                    onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
                    disabled={page === pagination.totalPages}
                    className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default TruckOwnerEpodDashboard;
