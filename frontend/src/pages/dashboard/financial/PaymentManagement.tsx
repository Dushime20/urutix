import React, { useState } from 'react';
import {
  CreditCard,
  CheckCircle2,
  Clock,
  AlertCircle,
  Download,
  Send,
  X,
  Building,
  FileText,
  Search,
  ArrowRight,
  ShieldCheck,
  Zap
} from 'lucide-react';
import { cn } from '@/utils/cn';

interface PaymentMethod {
  id: string;
  type: 'credit_card' | 'bank_account' | 'wallet';
  name: string;
  last4?: string;
  expiry?: string;
  isDefault: boolean;
  bankName?: string;
  accountType?: string;
}

interface Invoice {
  id: string;
  number: string;
  description: string;
  amount: number;
  dueDate: string;
  issueDate: string;
  status: 'paid' | 'pending' | 'overdue' | 'scheduled';
  cargoId?: string;
  paymentMethod?: string;
  paidDate?: string;
}

export const PaymentManagement: React.FC = () => {
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Mock data
  const paymentMethods: PaymentMethod[] = [
    { id: '1', type: 'credit_card', name: 'Visa Gold', last4: '4242', expiry: '12/25', isDefault: true },
    { id: '2', type: 'bank_account', name: 'Chase Business', last4: '7890', bankName: 'Chase Bank', accountType: 'Checking', isDefault: false },
    { id: '3', type: 'wallet', name: 'System Liquidity', last4: '5000', isDefault: false }
  ];

  const invoices: Invoice[] = [
    { id: '1', number: 'INV-2026-001', description: 'Cargo Asset Payment - Node 2401', amount: 3450, dueDate: '2026-01-05', issueDate: '2026-01-02', status: 'pending', cargoId: 'CARGO-2401' },
    { id: '2', number: 'INV-2025-348', description: 'Insurance Coverage - Q1 Protocol', amount: 1200, dueDate: '2026-01-05', issueDate: '2025-12-28', status: 'pending' },
    { id: '3', number: 'INV-2025-347', description: 'Logistics Clearing - Chicago Houston', amount: 2100, dueDate: '2025-12-28', issueDate: '2025-12-25', status: 'paid', cargoId: 'CARGO-2398', paymentMethod: 'Visa ****4242', paidDate: '2025-12-27' },
    { id: '4', number: 'INV-2025-346', description: 'System Service Fee - Dec Audit', amount: 299, dueDate: '2025-12-20', issueDate: '2025-12-15', status: 'paid', paymentMethod: 'Auto-debit', paidDate: '2025-12-20' }
  ];

  const stats = {
    total: invoices.reduce((sum, inv) => sum + inv.amount, 0),
    paid: invoices.filter(inv => inv.status === 'paid').reduce((sum, inv) => sum + inv.amount, 0),
    pending: invoices.filter(inv => inv.status === 'pending' || inv.status === 'scheduled').reduce((sum, inv) => sum + inv.amount, 0),
    overdue: invoices.filter(inv => inv.status === 'overdue').reduce((sum, inv) => sum + inv.amount, 0)
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(amount);
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      case 'pending': return 'bg-amber-50 text-amber-600 border-amber-100';
      case 'overdue': return 'bg-rose-50 text-rose-600 border-rose-100';
      case 'scheduled': return 'bg-blue-50 text-blue-600 border-blue-100';
      default: return 'bg-slate-50 text-slate-600 border-slate-100';
    }
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      {/* Dynamic Inventory Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: 'Cumulative Debt', value: formatCurrency(stats.total), icon: FileText, color: 'slate' },
          { label: 'Settled Assets', value: formatCurrency(stats.paid), icon: CheckCircle2, color: 'emerald' },
          { label: 'Active Pipeline', value: formatCurrency(stats.pending), icon: Clock, color: 'amber' },
          { label: 'Critical Variance', value: formatCurrency(stats.overdue), icon: AlertCircle, color: 'rose' }
        ].map((stat, i) => (
          <div key={i} className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-300">
            <div className={cn(
              "w-12 h-12 rounded-2xl flex items-center justify-center mb-6",
              stat.color === 'slate' ? "bg-slate-900 text-white" :
                stat.color === 'emerald' ? "bg-emerald-50 text-emerald-600" :
                  stat.color === 'amber' ? "bg-amber-50 text-amber-600" : "bg-rose-50 text-rose-600"
            )}>
              <stat.icon size={22} />
            </div>
            <div className="space-y-1">
              <div className="text-3xl font-black text-slate-900 leading-none">{stat.value}</div>
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Settlement Center */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 shadow-sm">
            <div className="flex flex-col md:flex-row gap-6 items-center">
              <div className="relative flex-1 w-full group">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-[#345E85] transition-colors" />
                <input
                  type="text"
                  placeholder="SEARCH HUB: INVOICE, CATEGORY, REFERENCE..."
                  className="w-full h-16 pl-14 pr-4 bg-white border border-slate-100 rounded-3xl text-[10px] font-black uppercase tracking-widest text-slate-600 focus:outline-none focus:ring-4 focus:ring-blue-500/5 transition-all"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="flex gap-2 p-1.5 bg-white border border-slate-100 rounded-[1.5rem]">
                {['all', 'pending', 'paid'].map((status) => (
                  <button
                    key={status}
                    onClick={() => setFilterStatus(status)}
                    className={cn(
                      "px-6 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all",
                      filterStatus === status ? "bg-slate-900 text-white shadow-lg" : "text-slate-400 hover:text-slate-900"
                    )}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            {invoices.map((invoice) => (
              <div key={invoice.id} className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm hover:shadow-xl transition-all group relative overflow-hidden">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
                  <div className="flex items-center gap-6">
                    <div className={cn(
                      "w-16 h-16 rounded-[1.5rem] flex items-center justify-center border transition-all group-hover:scale-105",
                      getStatusStyle(invoice.status)
                    )}>
                      {invoice.status === 'paid' ? <CheckCircle2 size={28} /> :
                        invoice.status === 'pending' ? <Clock size={28} /> : <AlertCircle size={28} />}
                    </div>
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <span className="text-[10px] font-black text-[#345E85] bg-blue-50 px-3 py-1 rounded-full uppercase tracking-widest">{invoice.number}</span>
                        <span className={cn(
                          "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border",
                          getStatusStyle(invoice.status)
                        )}>{invoice.status}</span>
                      </div>
                      <h4 className="text-lg font-black text-slate-900 uppercase tracking-tight">{invoice.description}</h4>
                      <div className="flex items-center gap-4 mt-2 text-[9px] font-bold text-slate-400 uppercase tracking-[0.1em]">
                        <span>Issued: {invoice.issueDate}</span>
                        <span className="w-1 h-1 bg-slate-200 rounded-full" />
                        <span>Deadline: {invoice.dueDate}</span>
                        {invoice.cargoId && (
                          <>
                            <span className="w-1 h-1 bg-slate-200 rounded-full" />
                            <span className="text-[#345E85] font-black">{invoice.cargoId}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right w-full md:w-auto">
                    <div className="text-3xl font-black text-slate-900 mb-4">{formatCurrency(invoice.amount)}</div>
                    <div className="flex justify-end gap-3">
                      <button className="h-12 w-12 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center hover:bg-slate-100 hover:text-slate-900 transition-all border border-slate-100">
                        <Download size={18} />
                      </button>
                      {invoice.status !== 'paid' && (
                        <button
                          onClick={() => { setSelectedInvoice(invoice); setShowPaymentModal(true); }}
                          className="h-12 px-8 bg-[#345E85] text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-900 transition-all shadow-lg flex items-center gap-3"
                        >
                          Authorize Payment <ArrowRight size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
                {invoice.status === 'paid' && (
                  <div className="mt-8 pt-6 border-t border-slate-50 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-[9px] font-black text-emerald-600 uppercase tracking-widest">
                      <ShieldCheck size={14} /> Settlement Confirmed via {invoice.paymentMethod}
                    </div>
                    <span className="text-[9px] font-bold text-slate-300 uppercase italic">Timestamp: {invoice.paidDate}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Treasury Sidebar */}
        <div className="space-y-8">
          <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white relative overflow-hidden shadow-2xl">
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-sm font-black uppercase tracking-widest">Treasury Nodes</h3>
              </div>

              <div className="space-y-4">
                {paymentMethods.map((method) => (
                  <div key={method.id} className={cn(
                    "p-6 rounded-[1.5rem] border transition-all group relative overflow-hidden",
                    method.isDefault ? "bg-white/10 border-white/20 shadow-xl" : "bg-white/5 border-white/5 hover:border-white/10"
                  )}>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-white/60">
                          {method.type === 'credit_card' ? <CreditCard size={20} /> : <Building size={20} />}
                        </div>
                        <div>
                          <p className="text-[11px] font-black uppercase tracking-tight">{method.name}</p>
                          <p className="text-[9px] font-bold text-white/40 uppercase tracking-widest">
                            •••• {method.last4}
                          </p>
                        </div>
                      </div>
                      {method.isDefault && <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_10px_#10b981]" />}
                    </div>
                    {method.isDefault && (
                      <span className="text-[8px] font-black text-white/30 uppercase tracking-[0.3em]">Primary Authorization Source</span>
                    )}
                  </div>
                ))}
              </div>

              <button className="w-full mt-10 py-5 bg-white text-slate-900 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest hover:bg-slate-100 transition-all shadow-xl flex items-center justify-center gap-3">
                <Zap size={16} fill="currentColor" /> Set Auto-Draft Logic
              </button>
            </div>
            {/* Background Light */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full -mr-32 -mt-32 blur-[100px] pointer-events-none" />
          </div>

          <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm relative overflow-hidden">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6">Accounting Artifacts</h4>
            <div className="space-y-3">
              {[
                { label: 'Q3 Tax Portfolio', date: 'Aug 12', size: '4.2MB' },
                { label: 'System Audit Log', date: 'Aug 10', size: '1.8MB' },
                { label: 'Carrier Settlement', date: 'Aug 08', size: '6.5MB' }
              ].map((doc, i) => (
                <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:border-[#345E85] transition-all cursor-pointer group">
                  <div className="flex items-center gap-3">
                    <FileText size={16} className="text-slate-300 group-hover:text-[#345E85]" />
                    <span className="text-[10px] font-black text-slate-600 uppercase tracking-tight">{doc.label}</span>
                  </div>
                  <span className="text-[8px] font-bold text-slate-300 uppercase">{doc.date}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Authority Modal */}
      {showPaymentModal && selectedInvoice && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-[2.5rem] shadow-2xl max-w-md w-full p-10 border border-slate-100">
            <div className="flex items-center justify-between mb-10">
              <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter italic">Authorize Fund Transfer</h3>
              <button
                onClick={() => { setShowPaymentModal(false); setSelectedInvoice(null); }}
                className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:text-slate-900 transition-all"
              >
                <X size={20} />
              </button>
            </div>

            <div className="bg-slate-900 rounded-3xl p-8 mb-8 text-white relative overflow-hidden">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Authorization Value</p>
              <p className="text-4xl font-black">{formatCurrency(selectedInvoice.amount)}</p>
              <div className="mt-6 flex items-center gap-3 text-[9px] font-black text-white/50 uppercase tracking-widest">
                <ShieldCheck size={14} className="text-emerald-400" /> Secure Protocol v.4.0
              </div>
              <div className="absolute bottom-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full -mr-16 -mb-16 blur-2xl" />
            </div>

            <div className="space-y-6 mb-10">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Treasury Destination</label>
                <select className="w-full h-16 px-6 bg-slate-50 border border-slate-100 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-900 focus:outline-none focus:ring-4 focus:ring-blue-500/5 transition-all">
                  {paymentMethods.map((method) => (
                    <option key={method.id} value={method.id}>
                      {method.name} ({method.last4})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <button className="w-full py-6 bg-[#345E85] text-white rounded-3xl font-black text-[12px] uppercase tracking-[0.2em] shadow-2xl shadow-blue-900/40 hover:bg-slate-900 transition-all flex items-center justify-center gap-4 group">
              Confirm Authorization <Send size={16} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentManagement;
