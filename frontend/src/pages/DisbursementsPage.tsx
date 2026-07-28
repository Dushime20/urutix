import React, { useState, useCallback, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { lendingApi } from '../services/lending/lendingApi';
import { Download, RotateCcw } from 'lucide-react';
import DisbursementsEnlite, { type DisbursementEntry } from '../components/LenderDashboard/Disbursements.enlite';
import toast from 'react-hot-toast';

const DisbursementsPage: React.FC = () => {
  const { user } = useAuth();
  const [disbursements, setDisbursements] = useState<DisbursementEntry[]>([]);
  const [loading, setLoading]             = useState(true);
  const [statusFilter, setStatusFilter]   = useState('all');
  const [searchTerm, setSearchTerm]       = useState('');

  /**
   * Map a raw disbursement from the API.
   * Only fields that exist in the response are populated — no fallbacks.
   */
  const mapDisbursement = (d: any): DisbursementEntry => ({
    id:              d.id,
    loanId:          d.loanId ?? null,
    borrowerName:    d.borrowerName !== 'Unknown' ? d.borrowerName : null,
    amount:          d.amount != null ? Number(d.amount) : null,
    status:          d.status ?? null,
    requestedDate:   d.requestedDate ?? null,
    approvedDate:    d.approvedDate ?? null,
    disbursedDate:   d.disbursedDate ?? null,
    purpose:         d.purpose !== 'Cargo financing' ? d.purpose : null,
    interestRate:    d.interestRate > 0 ? d.interestRate : null,
    termMonths:      d.termMonths > 0 ? d.termMonths : null,
    notes:           d.notes || null,
    priority:        d.priority !== 'medium' ? d.priority : null,
    _rawData:        d,
  });

  const fetchDisbursements = useCallback(async () => {
    if (!user?.id) {
      setLoading(false);
      toast.error('No lender session found. Please log in again.');
      return;
    }

    try {
      setLoading(true);

      let lenderId = user.id;
      try {
        const resolved = await lendingApi.resolveLenderId();
        if (resolved) lenderId = resolved;
      } catch {
        // Backend also resolves user → lender when user.id is passed
      }

      const response = await lendingApi.getLenderDisbursements(lenderId, {
        page: 1,
        limit: 200,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        search: searchTerm || undefined,
      });

      const raw: any[] = Array.isArray(response?.disbursements)
        ? response.disbursements
        : Array.isArray(response)
          ? response
          : [];
      setDisbursements(raw.map(mapDisbursement));

      if (raw.length === 0) {
        toast('No disbursement records found.', { icon: 'ℹ️' });
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to load disbursements';
      toast.error(msg);
      setDisbursements([]);
    } finally {
      setLoading(false);
    }
  }, [user?.id, statusFilter, searchTerm]);

  useEffect(() => {
    fetchDisbursements();
  }, [fetchDisbursements]);

  /**
   * Approve a disbursement — moves it from pending → approved.
   */
  const handleApprove = async (disbursementId: string) => {
    try {
      await lendingApi.updateDisbursementStatus(disbursementId, { status: 'approved' });
      toast.success('Disbursement approved');
      setDisbursements(prev =>
        prev.map(d => d.id === disbursementId ? { ...d, status: 'approved' } : d)
      );
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to approve disbursement';
      toast.error(msg);
    }
  };

  /**
   * Disburse — actually sends the funds (approved → disbursed).
   */
  const handleDisburse = async (disbursementId: string) => {
    try {
      await lendingApi.updateDisbursementStatus(disbursementId, { status: 'disbursed' });
      toast.success('Funds disbursed successfully');
      setDisbursements(prev =>
        prev.map(d => d.id === disbursementId ? { ...d, status: 'disbursed' } : d)
      );
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to disburse funds';
      toast.error(msg);
    }
  };

  /**
   * Reject a disbursement.
   */
  const handleReject = async (disbursementId: string, reason: string) => {
    try {
      await lendingApi.updateDisbursementStatus(disbursementId, { status: 'rejected', reason });
      toast.success('Disbursement rejected');
      setDisbursements(prev =>
        prev.map(d => d.id === disbursementId ? { ...d, status: 'rejected' } : d)
      );
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to reject disbursement';
      toast.error(msg);
    }
  };

  const handleExport = () => {
    if (disbursements.length === 0) return;

    const headers = [
      'Disbursement ID', 'Loan ID', 'Borrower', 'Amount',
      'Status', 'Priority', 'Interest Rate', 'Term (Months)',
      'Requested Date', 'Approved Date', 'Disbursed Date', 'Purpose', 'Notes',
    ];

    const rows = disbursements.map(d => [
      d.id,
      d.loanId ?? '',
      d.borrowerName ?? '',
      d.amount ?? '',
      d.status ?? '',
      d.priority ?? '',
      d.interestRate ?? '',
      d.termMonths ?? '',
      d.requestedDate ?? '',
      d.approvedDate ?? '',
      d.disbursedDate ?? '',
      d.purpose ?? '',
      d.notes ?? '',
    ]);

    const csv = [headers, ...rows]
      .map(row => row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `disbursements-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success('Disbursements exported');
  };

  return (
    <div className="min-h-screen bg-gray-50/50 p-6 md:p-8">
      <div className="max-w-[1536px] mx-auto space-y-8">

        {/* Header */}
        <div className="sticky top-16 sm:top-[4.5rem] lg:top-20 z-40 -mx-4 px-4 py-4 bg-gray-50/95 backdrop-blur-md flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight uppercase">
              Disbursement Operations
            </h1>
            <p className="text-gray-500 mt-1 uppercase text-xs font-bold tracking-widest opacity-70">
              Authorize and manage loan funding — real data only
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleExport}
              disabled={disbursements.length === 0}
              className="px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Download size={14} /> Export CSV
            </button>
            <button
              onClick={fetchDisbursements}
              disabled={loading}
              className="px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center gap-2 disabled:opacity-40"
            >
              <RotateCcw size={14} className={loading ? 'animate-spin' : ''} />
              {loading ? 'Loading...' : 'Refresh'}
            </button>
          </div>
        </div>

        <DisbursementsEnlite
          loading={loading}
          disbursements={disbursements}
          statusFilter={statusFilter}
          searchTerm={searchTerm}
          onStatusFilterChange={setStatusFilter}
          onSearchChange={setSearchTerm}
          onApprove={handleApprove}
          onDisburse={handleDisburse}
          onReject={handleReject}
        />
      </div>
    </div>
  );
};

export default DisbursementsPage;
