import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { lendingApi } from '../services/lending/lendingApi';
import {
  FaExclamationTriangle,
  FaTimesCircle,
  FaMapMarkerAlt
} from 'react-icons/fa';
import { Search, List, Download, AlertTriangle } from 'lucide-react';
import DisbursementsEnlite, { type Disbursement } from '../components/LenderDashboard/Disbursements.enlite';

const DisbursementsPage: React.FC = () => {
  const { user } = useAuth();
  const [disbursements, setDisbursements] = useState<Disbursement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<string>('requestedDate');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [selectedDisbursement, setSelectedDisbursement] = useState<Disbursement | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [disbursementStats, setDisbursementStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    disbursed: 0,
    totalAmount: 0,
    disbursedAmount: 0,
    avgProcessingTime: 0
  });

  useEffect(() => {
    if (!user || user.role !== 'LENDER') return;
    loadDisbursements();
  }, [user, searchTerm, statusFilter, priorityFilter, sortField, sortDirection, pagination.page]);

  const loadDisbursements = async () => {
    if (!user) return;
    try {
      setLoading(true);
      setError(null);

      const response = await lendingApi.getLenderDisbursements(user.id, {
        page: pagination.page,
        limit: pagination.limit,
        status: statusFilter === 'all' ? undefined : statusFilter,
        priority: priorityFilter === 'all' ? undefined : priorityFilter,
        search: searchTerm || undefined,
        sortBy: sortField,
        sortOrder: sortDirection
      });

      setDisbursements(response.disbursements || []);
      setPagination(response.pagination || pagination);
      setDisbursementStats(response.stats || {
        total: 0,
        pending: 0,
        approved: 0,
        disbursed: 0,
        totalAmount: 0,
        disbursedAmount: 0,
        avgProcessingTime: 0
      });
    } catch (error) {
      console.error('Failed to load disbursements:', error);
      setError('Failed to load disbursements. Please try again.');
      setDisbursements([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const handleViewDetails = (disbursement: Disbursement) => {
    setSelectedDisbursement(disbursement);
    setShowDetails(true);
  };

  const handleExport = () => {
    const csvContent = [
      'ID,Loan ID,Borrower,Amount,Status,Requested Date,Cargo Type',
      ...disbursements.map(d =>
        `${d.id},${d.loanId},${d.borrowerName},${d.amount},${d.status},${d.requestedDate},${d.cargoType}`
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `disbursements-export-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (!user || user.role !== 'LENDER') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center p-8 bg-white rounded-2xl shadow-sm border border-gray-100">
          <FaExclamationTriangle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2 uppercase tracking-tight">Access Restricted</h2>
          <p className="text-gray-500 text-sm">Please authenticate as a Lender to access this console.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50 p-6 md:p-8">
      <div className="max-w-[1536px] mx-auto space-y-8">
        {/* Modern Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight uppercase">Disbursement Operations</h1>
            <p className="text-gray-500 mt-1 uppercase text-xs font-bold tracking-widest opacity-70">Manage and authorize active funding pipelines</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
              <button className="p-1.5 rounded-lg bg-slate-100 text-indigo-600 shadow-sm">
                <List size={16} />
              </button>
            </div>
            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-slate-200 transition-all font-sans"
            >
              <Download size={14} className="rotate-90" /> Export Register
            </button>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-rose-50 border border-rose-100 rounded-2xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertTriangle className="text-rose-500 w-5 h-5" />
              <span className="text-rose-800 text-xs font-black uppercase tracking-widest">{error}</span>
            </div>
            <button onClick={loadDisbursements} className="text-rose-600 text-[10px] font-black uppercase tracking-widest hover:underline">Retry Operations</button>
          </div>
        )}

        {/* Search and Filters */}
        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto font-sans">
              <div className="relative group min-w-[280px]">
                <input
                  type="text"
                  placeholder="SEARCH DISBURSEMENTS..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2.5 text-[10px] font-black uppercase tracking-widest border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent w-full bg-[#fafafa] transition-all"
                />
                <Search className="absolute left-3.5 top-3 text-slate-400 group-hover:text-indigo-500 transition-colors w-3.5 h-3.5" />
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-4 py-2.5 text-[10px] font-black uppercase tracking-widest border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 bg-white cursor-pointer hover:border-indigo-200 transition-all"
                >
                  <option value="all">ALL STATUS</option>
                  <option value="pending">PENDING</option>
                  <option value="approved">APPROVED</option>
                  <option value="disbursed">DISBURSED</option>
                  <option value="rejected">REJECTED</option>
                  <option value="on_hold">ON HOLD</option>
                </select>

                <select
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                  className="px-4 py-2.5 text-[10px] font-black uppercase tracking-widest border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 bg-white cursor-pointer hover:border-indigo-200 transition-all"
                >
                  <option value="all">ALL PRIORITY</option>
                  <option value="urgent">URGENT</option>
                  <option value="high">HIGH</option>
                  <option value="medium">MEDIUM</option>
                  <option value="low">LOW</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <DisbursementsEnlite
          loading={loading}
          disbursements={disbursements}
          stats={disbursementStats}
          onSort={handleSort}
          sortKey={sortField}
          sortDirection={sortDirection}
          onViewDetails={handleViewDetails}
          onExport={handleExport}
        />
      </div>

      {/* Disbursement Details Modal */}
      {showDetails && selectedDisbursement && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4 font-sans">
          <div className="relative mx-auto border w-full max-w-4xl shadow-2xl rounded-2xl bg-white overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="bg-slate-900 p-6 text-white flex justify-between items-center">
              <div>
                <h3 className="text-lg font-black uppercase tracking-tighter">Request Details: {selectedDisbursement.id}</h3>
                <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1">Reviewing funding authorization</p>
              </div>
              <button
                onClick={() => setShowDetails(false)}
                className="p-2 hover:bg-white/10 rounded-xl transition-colors"
              >
                <FaTimesCircle className="h-6 w-6" />
              </button>
            </div>

            <div className="p-8 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div>
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                      Loan Profile
                    </h4>
                    <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                      <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase">Borrower</p>
                        <p className="font-bold text-slate-900 text-sm">{selectedDisbursement.borrowerName}</p>
                      </div>
                      <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase">Loan Reference</p>
                        <p className="font-bold text-slate-900 text-sm">#{selectedDisbursement.loanId}</p>
                      </div>
                      <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase">Amount</p>
                        <p className="font-black text-indigo-600 text-base">RWF {(selectedDisbursement.amount / 1000000).toFixed(1)}M</p>
                      </div>
                      <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase">Rate/Term</p>
                        <p className="font-bold text-slate-900 text-sm">{selectedDisbursement.interestRate}% / {selectedDisbursement.termMonths}m</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                      Route Logistics
                    </h4>
                    <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600">
                          <FaMapMarkerAlt size={14} />
                        </div>
                        <div>
                          <p className="text-[9px] font-black text-slate-400 uppercase leading-none mb-1">Origin Point</p>
                          <p className="text-[11px] font-black text-slate-900">{selectedDisbursement.route.origin}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-rose-100 flex items-center justify-center text-rose-600">
                          <FaMapMarkerAlt size={14} />
                        </div>
                        <div>
                          <p className="text-[9px] font-black text-slate-400 uppercase leading-none mb-1">Destination</p>
                          <p className="text-[11px] font-black text-slate-900">{selectedDisbursement.route.destination}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                      Risk Index
                    </h4>
                    <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                      <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase">Risk Level</p>
                        <p className="font-bold text-slate-900 text-sm">{selectedDisbursement.riskScore}/10 UNIT</p>
                      </div>
                      <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase">Credit Score</p>
                        <p className="font-bold text-slate-900 text-sm">{selectedDisbursement.creditScore} PTS</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-500"></span>
                      Documentation Status
                    </h4>
                    <div className="space-y-2">
                      {selectedDisbursement.documents?.map((doc, index) => (
                        <div key={index} className="flex items-center justify-between p-3 border border-slate-100 rounded-xl bg-white">
                          <span className="text-[10px] font-black text-slate-900 uppercase">{doc.type}</span>
                          <span className={`px-2 py-0.5 text-[8px] font-black uppercase rounded ${doc.status === 'verified' ? 'bg-emerald-100 text-emerald-700' :
                            doc.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                              'bg-rose-100 text-rose-700'
                            }`}>
                            {doc.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {selectedDisbursement.notes && (
                <div className="pt-4 border-t border-slate-100">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Administrative Notes</h4>
                  <p className="text-xs text-slate-600 leading-relaxed italic">{selectedDisbursement.notes}</p>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
                <button
                  onClick={() => setShowDetails(false)}
                  className="px-6 py-2.5 bg-slate-100 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all"
                >
                  Close Register
                </button>
                <button
                  className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
                >
                  Authorize Payout
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DisbursementsPage;
