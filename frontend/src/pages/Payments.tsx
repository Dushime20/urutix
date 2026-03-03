import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Filter, Search, Eye, CreditCard, DollarSign, ArrowDownRight } from 'lucide-react';
import { paymentsAPI } from '../services/api';
import { TranslatedText } from '../components/translated-text';
import { cn } from '../utils/cn';

const Payments = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const { data: payments, isLoading } = useQuery({
    queryKey: ['payments', searchTerm, statusFilter],
    queryFn: () => paymentsAPI.getAll({ search: searchTerm, status: statusFilter !== 'all' ? statusFilter : undefined }),
  });

  const getStatusStyle = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
      case 'paid':
        return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      case 'pending':
        return 'bg-amber-50 text-amber-600 border-amber-100';
      case 'failed':
      case 'overdue':
        return 'bg-rose-50 text-rose-600 border-rose-100';
      default:
        return 'bg-slate-50 text-slate-600 border-slate-100';
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Search & Filter Header */}
      <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 shadow-sm">
        <div className="flex flex-col lg:flex-row gap-6 items-center">
          <div className="relative flex-1 w-full group">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-[#345E85] transition-colors" />
            <input
              type="text"
              placeholder="SEARCH TRANSACTIONS: REF, TRIP, METHOD..."
              className="w-full h-16 pl-14 pr-32 bg-white border border-slate-100 rounded-3xl text-[10px] font-black uppercase tracking-widest text-slate-600 focus:outline-none focus:ring-4 focus:ring-blue-500/5 transition-all placeholder:text-slate-300"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <div className="absolute right-6 top-1/2 -translate-y-1/2 flex items-center gap-2">
              <div className="h-6 w-px bg-slate-200 mr-2" />
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total:</span>
              <span className="text-sm font-black text-[#345E85]">{payments?.data?.payments?.length || 0}</span>
            </div>
          </div>

          <div className="flex gap-3 items-center w-full lg:w-auto">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-16 pl-8 pr-12 bg-white border border-slate-100 rounded-3xl text-[10px] font-black uppercase tracking-widest text-slate-600 focus:outline-none focus:ring-4 focus:ring-blue-500/5 appearance-none cursor-pointer hover:bg-slate-50 transition-all min-w-[180px]"
            >
              <option value="all">ALL STATUSES</option>
              <option value="completed">COMPLETED</option>
              <option value="pending">PENDING</option>
              <option value="failed">FAILED</option>
            </select>
            <button className="h-16 px-8 bg-slate-900 text-white rounded-3xl hover:bg-slate-800 transition-all shadow-lg flex items-center gap-3 group text-[10px] font-black uppercase tracking-widest">
              <Filter size={16} className="group-hover:rotate-180 transition-transform duration-500" />
              Filters
            </button>
          </div>
        </div>
      </div>

      {/* Transactions Hub */}
      <div className="bg-white rounded-[2.5rem] border border-slate-100 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-50">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="px-8 py-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Transaction Ref</th>
                <th className="px-4 py-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Entity / Trip</th>
                <th className="px-4 py-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Payment Method</th>
                <th className="px-4 py-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Amount / Currency</th>
                <th className="px-4 py-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Status / Lifecycle</th>
                <th className="px-8 py-6 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-50">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-8 py-24 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-12 h-12 border-4 border-slate-100 border-t-[#345E85] rounded-full animate-spin" />
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Synchronizing financial records...</p>
                    </div>
                  </td>
                </tr>
              ) : !payments?.data?.payments?.length ? (
                <tr>
                  <td colSpan={6} className="px-8 py-24 text-center">
                    <div className="flex flex-col items-center gap-4 opacity-40">
                      <CreditCard size={48} className="text-slate-200" />
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Zero transaction activity detected</p>
                    </div>
                  </td>
                </tr>
              ) : (
                payments?.data?.payments?.map((payment: any) => (
                  <tr key={payment.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-8 py-6">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-black text-[#345E85] bg-slate-100 px-3 py-1.5 rounded-full uppercase tracking-widest w-fit">
                          {payment.referenceNumber}
                        </span>
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-2 ml-1">
                          {new Date(payment.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-6">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-[#345E85] group-hover:bg-white border border-slate-100 transition-all shadow-sm">
                          <DollarSign size={18} />
                        </div>
                        <div>
                          <div className="text-[10px] font-black text-slate-800 uppercase tracking-tight">
                            Trip: {payment.trip?.tripNumber || 'N/A'}
                          </div>
                          <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                            Entity Node: {payment.trip?.id?.slice(0, 8).toUpperCase() || 'SYSTEM'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-6">
                      <div className="flex items-center gap-2.5">
                        <CreditCard size={14} className="text-slate-300" />
                        <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">
                          {payment.paymentMethod}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-6">
                      <div className="space-y-1">
                        <div className="text-sm font-black text-slate-900">
                          ${payment.amount?.toLocaleString()}
                        </div>
                        <div className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em]">
                          ISO: {payment.currency || 'USD'}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-6">
                      <div className={cn(
                        "inline-flex items-center gap-2 px-4 py-1.5 rounded-full border shadow-sm text-[9px] font-black uppercase tracking-[0.1em]",
                        getStatusStyle(payment.status)
                      )}>
                        <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                        {payment.status}
                      </div>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button className="w-10 h-10 rounded-2xl flex items-center justify-center transition-all bg-white border border-slate-100 shadow-sm text-slate-400 hover:text-[#345E85] hover:border-[#345E85] hover:bg-blue-50 hover:shadow-md" title="View Audit">
                          <Eye size={16} />
                        </button>
                        <button className="w-10 h-10 rounded-2xl flex items-center justify-center transition-all bg-white border border-slate-100 shadow-sm text-slate-400 hover:text-emerald-500 hover:border-emerald-200 hover:bg-emerald-50 hover:shadow-md" title="Download Receipt">
                          <ArrowDownRight size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Payments;