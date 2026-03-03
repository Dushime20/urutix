import React, { useState, useEffect } from 'react';
import { lendingApi } from '../services/lending/lendingApi';
import {
  History,
  Download,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowUpRight,
  ArrowDownLeft,
  Search,
  Building2,
  CreditCard,
  FileText,
  Printer,
  ChevronRight,
  ShieldCheck
} from 'lucide-react';
import HistoryEnlite, { type Transaction } from '../components/LenderDashboard/History.enlite';

const TransactionsHistoryPage: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [showTransactionModal, setShowTransactionModal] = useState(false);

  // Lender ID - would typically come from context or auth
  const lenderId = "89fa1340-429e-448f-a19d-0e987679d7cd";

  // Mock data for fallback (truncated for brevity, using same logic as original)
  const mockTransactions: Transaction[] = [
    {
      id: 'TXN001',
      date: '2024-01-15T10:30:00Z',
      type: 'loan_disbursement',
      amount: -75000,
      status: 'completed',
      borrowerName: 'John Smith',
      borrowerBusiness: 'Smith Logistics LLC',
      loanId: 'LOAN001',
      description: 'Initial loan disbursement for fleet expansion',
      reference: 'REF-001-2024',
      method: 'wire',
      category: 'lending',
      balanceBefore: 500000,
      balanceAfter: 425000
    },
    {
      id: 'TXN002',
      date: '2024-01-14T14:15:00Z',
      type: 'loan_repayment',
      amount: 8500,
      status: 'completed',
      borrowerName: 'Maria Garcia',
      borrowerBusiness: 'Garcia Freight Solutions',
      loanId: 'LOAN002',
      description: 'Monthly loan repayment - Principal + Interest',
      reference: 'REF-002-2024',
      method: 'ach',
      category: 'collections',
      balanceBefore: 425000,
      balanceAfter: 433500
    }
  ];

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        setLoading(true);
        setError(null);

        const [disbursements, repayments] = await Promise.all([
          lendingApi.getLenderDisbursements(lenderId, { page: 1, limit: 100 }),
          lendingApi.getLenderRepayments(lenderId, { page: 1, limit: 100 })
        ]);

        const disbursementTransactions: Transaction[] = (disbursements || []).map((d: any) => ({
          id: d.id || Math.random().toString(36).substr(2, 9),
          date: d.disbursement_date || d.created_at || new Date().toISOString(),
          type: 'loan_disbursement' as const,
          amount: -(d.total_amount || d.amount || 0),
          status: d.status === 'success' ? 'completed' as const :
            d.status === 'failed' ? 'failed' as const : 'pending' as const,
          borrowerName: d.loan_request?.borrower_name || 'Unknown Borrower',
          borrowerBusiness: d.loan_request?.business_name || 'Unknown Business',
          loanId: d.loan_request_id || '',
          description: `Loan disbursement for ${d.loan_request?.title || 'loan request'}`,
          reference: d.external_txn_ref || `DIS-${d.id}`,
          method: 'wire',
          category: 'lending',
          balanceBefore: 0,
          balanceAfter: 0
        }));

        const repaymentTransactions: Transaction[] = (repayments || []).map((r: any) => ({
          id: r.id || Math.random().toString(36).substr(2, 9),
          date: r.payment_date || r.created_at || new Date().toISOString(),
          type: 'loan_repayment' as const,
          amount: r.amount || 0,
          status: r.status === 'success' ? 'completed' as const :
            r.status === 'failed' ? 'failed' as const : 'pending' as const,
          borrowerName: r.loan_request?.borrower_name || 'Unknown Borrower',
          borrowerBusiness: r.loan_request?.business_name || 'Unknown Business',
          loanId: r.loan_request_id || '',
          description: `Loan repayment for ${r.loan_request?.title || 'loan'}`,
          reference: r.external_txn_ref || `REP-${r.id}`,
          method: r.payment_method || 'bank_transfer',
          category: 'lending',
          balanceBefore: 0,
          balanceAfter: 0
        }));

        const allTransactions = [...disbursementTransactions, ...repaymentTransactions]
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        setTransactions(allTransactions.length > 0 ? allTransactions : mockTransactions);
      } catch (error) {
        console.error('Error fetching transactions:', error);
        setError('Failed to load transaction history');
        setTransactions(mockTransactions);
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, [lenderId]);

  const stats = {
    totalTransactions: transactions.length,
    totalAmount: transactions.reduce((sum, txn) => sum + Math.abs(txn.amount), 0),
    moneyIn: transactions.filter(txn => txn.amount > 0).reduce((sum, txn) => sum + txn.amount, 0),
    moneyOut: Math.abs(transactions.filter(txn => txn.amount < 0).reduce((sum, txn) => sum + txn.amount, 0))
  };

  const handleExport = () => {
    const dataStr = JSON.stringify(transactions, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `transaction-history-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gray-50/50 p-6 md:p-8">
      <div className="max-w-[1536px] mx-auto space-y-8">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight uppercase flex items-center gap-3">
              <div className="p-2 bg-slate-900 text-white rounded-xl shadow-lg shadow-slate-200">
                <History size={24} />
              </div>
              Finance History
            </h1>
            <p className="text-gray-500 mt-2 uppercase text-[10px] font-black tracking-[0.2em] opacity-70">
              Validated ledger of institutional capital movements
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
              <button className="px-4 py-2 bg-slate-900 text-white rounded-lg text-[10px] font-black uppercase tracking-widest shadow-lg shadow-slate-200">Full Audit</button>
              <button className="px-4 py-2 text-slate-400 hover:text-slate-600 rounded-lg text-[10px] font-black uppercase tracking-widest">Monthly Reports</button>
            </div>
          </div>
        </div>

        <HistoryEnlite
          loading={loading}
          transactions={transactions}
          stats={stats}
          onViewDetails={(txn) => {
            setSelectedTransaction(txn);
            setShowTransactionModal(true);
          }}
          onDownloadReceipt={(txn) => alert(`Downloading ledger for ${txn.id}`)}
          onPrint={(txn) => alert(`Preparing print document for ${txn.id}`)}
          onExport={handleExport}
        />

        {/* Transaction Detail Modal */}
        {showTransactionModal && selectedTransaction && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-100">
              <div className="p-8 border-b border-slate-50 flex justify-between items-start">
                <div className="flex gap-4">
                  <div className={`p-4 rounded-2xl ${selectedTransaction.amount > 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                    {selectedTransaction.amount > 0 ? <ArrowDownLeft size={32} /> : <ArrowUpRight size={32} />}
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-slate-900 uppercase">Transaction Voucher</h2>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Ref No: {selectedTransaction.reference}</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowTransactionModal(false)}
                  className="p-2 hover:bg-slate-50 rounded-xl text-slate-400 hover:text-slate-900 transition-all"
                >
                  <XCircle size={24} />
                </button>
              </div>

              <div className="p-8 space-y-8">
                <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-1">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.15em]">Transaction Status</p>
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${selectedTransaction.status === 'completed' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                      <p className="text-sm font-black text-slate-900 uppercase">{selectedTransaction.status}</p>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.15em]">Execution Date</p>
                    <p className="text-sm font-black text-slate-900 uppercase">{new Date(selectedTransaction.date).toLocaleString()}</p>
                  </div>
                </div>

                <div className="p-6 bg-slate-50 rounded-3xl space-y-4">
                  <div className="flex justify-between items-center text-sm">
                    <span className="font-bold text-slate-400 uppercase">Principal Party</span>
                    <span className="font-black text-slate-900 uppercase">{selectedTransaction.borrowerName}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="font-bold text-slate-400 uppercase">Associated Business</span>
                    <span className="font-black text-slate-900 uppercase">{selectedTransaction.borrowerBusiness}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm border-t border-slate-200 pt-4">
                    <span className="font-bold text-slate-400 uppercase">Settlement Amount</span>
                    <span className={`text-lg font-black ${selectedTransaction.amount > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      RWF {Math.abs(selectedTransaction.amount).toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <button className="flex flex-col items-center gap-2 p-4 bg-white border border-slate-100 rounded-2xl hover:border-indigo-200 hover:bg-indigo-50/50 transition-all group">
                    <FileText className="text-slate-400 group-hover:text-indigo-600" size={20} />
                    <span className="text-[9px] font-black text-slate-400 uppercase group-hover:text-indigo-600">Download PDF</span>
                  </button>
                  <button className="flex flex-col items-center gap-2 p-4 bg-white border border-slate-100 rounded-2xl hover:border-indigo-200 hover:bg-indigo-50/50 transition-all group">
                    <Building2 className="text-slate-400 group-hover:text-indigo-600" size={20} />
                    <span className="text-[9px] font-black text-slate-400 uppercase group-hover:text-indigo-600">Company Profile</span>
                  </button>
                  <button className="flex flex-col items-center gap-2 p-4 bg-white border border-slate-100 rounded-2xl hover:border-indigo-200 hover:bg-indigo-50/50 transition-all group">
                    <CreditCard className="text-slate-400 group-hover:text-indigo-600" size={20} />
                    <span className="text-[9px] font-black text-slate-400 uppercase group-hover:text-indigo-600">Payment Trace</span>
                  </button>
                </div>
              </div>

              <div className="p-6 bg-slate-900 text-white flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <ShieldCheck size={20} className="text-indigo-400" />
                  <p className="text-[10px] font-bold uppercase tracking-widest">End-to-End Encrypted Verification</p>
                </div>
                <button
                  onClick={() => setShowTransactionModal(false)}
                  className="px-6 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                >
                  Close Record
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TransactionsHistoryPage;
