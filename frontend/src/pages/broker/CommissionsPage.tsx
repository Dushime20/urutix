import { DashboardSkeleton } from '../../components/common/LoadingSkeletons';
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { brokerAPI, type BrokerCommission } from '../../services/brokerApi';
import { 
  DollarSign, 
  Clock, 
  Filter,
  Download,
  Loader2,
  TrendingUp,
  Activity,
  ArrowUpRight,
  ShieldCheck,
  Calendar,
  Zap,
  Shield,
  ArrowRight
} from 'lucide-react';
import { StatCard } from '../../components/EnliteUI/Cards/StatCard';

const CommissionsPage: React.FC = () => {
  const { user } = useAuth();
  const [commissions, setCommissions] = useState<BrokerCommission[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: '',
    startDate: '',
    endDate: '',
  });
  const [stats, setStats] = useState({
    totalEarned: 0,
    totalPending: 0,
    total: 0,
  });

  useEffect(() => {
    if (user && user.role === 'BROKER') {
      loadCommissions();
    }
  }, [user, filters]);

  const loadCommissions = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (filters.status) params.status = filters.status;
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;

      const response = await brokerAPI.getBrokerCommissions(user!.id, params);
      const responseData = response.data || response || {};
      const commissionsData = responseData.commissions || [];
      setCommissions(Array.isArray(commissionsData) ? commissionsData : []);
      setStats({
        totalEarned: responseData.totalEarned || 0,
        totalPending: responseData.totalPending || 0,
        total: responseData.total || 0,
      });
    } catch (err: any) {
      console.error('Failed to load commissions:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusPrimeStyle = (status: string) => {
    switch (status) {
      case 'PAID': return 'bg-emerald-50 text-emerald-600 border-emerald-100 shadow-emerald-50';
      case 'APPROVED': return 'bg-primary-50 text-primary-600 border-primary-100 shadow-primary-50';
      case 'PENDING': return 'bg-amber-50 text-amber-600 border-amber-100 shadow-amber-50';
      case 'CANCELLED': return 'bg-rose-50 text-rose-600 border-rose-100 shadow-rose-50';
      default: return 'bg-slate-50 text-slate-500 border-slate-100';
    }
  };

  if (loading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="max-w-[1400px] mx-auto space-y-12 animate-fade-in pb-24">
      {/* Ultra-Compact Yield Header */}
      <div className="relative overflow-hidden bg-white dark:bg-slate-900 rounded-[2rem] p-6 shadow-sm border border-slate-100 dark:border-slate-800 flex items-center justify-between group">
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-slate-100/60 dark:bg-primary-600/10 rounded-full -mr-48 -mt-48 blur-[80px]"></div>
        
        <div className="relative z-10 flex items-center gap-6">
          <div className="w-14 h-14 rounded-2xl bg-[#345E85]/10 dark:bg-white/10 border border-[#345E85]/20 dark:border-white/20 flex items-center justify-center">
            <DollarSign size={24} className="text-[#345E85] dark:text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight leading-none mb-1 text-slate-900 dark:text-white">Yields</h1>
            <p className="text-slate-400 text-sm font-bold uppercase">Financial Audit</p>
          </div>
        </div>

        <div className="relative z-10 flex items-center gap-12 mr-4">
           <div className="text-center hidden md:block">
             <p className="text-xl font-bold leading-none text-emerald-400">{stats.totalEarned.toLocaleString()}</p>
             <p className="text-xs font-bold text-slate-500 uppercase mt-0.5 dark:text-slate-400">KES Revenue</p>
           </div>
           <div className="flex gap-4">
             <button className="px-8 py-4 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-white rounded-2xl text-sm font-bold uppercase hover:bg-slate-100 dark:hover:bg-white/10 transition-all">Export</button>
             <button onClick={() => window.location.href='/dashboard/broker/payouts'} className="px-8 py-4 bg-primary-600 text-white rounded-2xl text-sm font-bold uppercase shadow-xl shadow-primary-900/10 hover:scale-105 active:scale-95 transition-all flex items-center gap-3">
               <ArrowUpRight size={14} /> Payout
             </button>
           </div>
        </div>
      </div>

      {/* Statistics Board */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <StatCard title="Revenue System" value={`${stats.totalEarned.toLocaleString()} KES`} subtitle="Authorized Payouts" icon={<DollarSign size={20} />} color="success" variant="classic" />
        <StatCard title="Pending Pipeline" value={`${stats.totalPending.toLocaleString()} KES`} subtitle="In Clearance Cycle" icon={<Clock size={20} />} color="warning" variant="classic" />
        <StatCard title="Total Records" value={stats.total} subtitle="Facilitations Processed" icon={<Activity size={20} />} color="info" variant="classic" />
      </div>

      {/* Audit Controls */}
      <div className="bg-white rounded-[3rem] border border-slate-100 p-8 shadow-sm flex flex-col lg:flex-row gap-8 relative group overflow-hidden dark:bg-slate-900 dark:border-slate-800">
        <div className="flex-1 space-y-2">
          <label className="text-sm font-bold text-slate-400 uppercase ml-4">Stage</label>
          <div className="relative">
            <Filter size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" />
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="w-full bg-slate-50 border-none rounded-2xl pl-16 pr-8 py-5 text-sm font-bold text-slate-900 focus:bg-white outline-none appearance-none cursor-pointer dark:bg-slate-800/50 dark:text-white"
            >
              <option value="">All Transactions</option>
              <option value="PENDING">Awaiting</option>
              <option value="APPROVED">Verified</option>
              <option value="PAID">Closed</option>
            </select>
          </div>
        </div>
        <div className="flex-1 space-y-2">
          <label className="text-sm font-bold text-slate-400 uppercase ml-4">Start Boundary</label>
          <div className="relative">
            <Calendar size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" />
            <input type="date" value={filters.startDate} onChange={e => setFilters({...filters, startDate: e.target.value})} className="w-full bg-slate-50 border-none rounded-2xl pl-16 pr-8 py-5 text-sm font-bold text-slate-900 focus:bg-white outline-none dark:bg-slate-800/50 dark:text-white" />
          </div>
        </div>
        <div className="flex-1 space-y-2">
          <label className="text-sm font-bold text-slate-400 uppercase ml-4">End Boundary</label>
          <div className="relative">
            <Calendar size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" />
            <input type="date" value={filters.endDate} onChange={e => setFilters({...filters, endDate: e.target.value})} className="w-full bg-slate-50 border-none rounded-2xl pl-16 pr-8 py-5 text-sm font-bold text-slate-900 focus:bg-white outline-none dark:bg-slate-800/50 dark:text-white" />
          </div>
        </div>
      </div>

      {/* Ledger */}
      <div className="bg-white rounded-[3.5rem] border border-slate-100 shadow-sm overflow-hidden animate-slide-up dark:bg-slate-900 dark:border-slate-800">
        <div className="p-10 border-b border-slate-50 flex items-center justify-between bg-slate-50/50 dark:border-slate-800/50">
          <h3 className="text-sm font-bold text-slate-900 uppercase dark:text-white">Transaction Ledger</h3>
          <div className="px-4 py-2 bg-white rounded-full text-xs font-bold text-slate-400 uppercase border border-slate-100 shadow-sm dark:bg-slate-900 dark:border-slate-800">
            Records: {commissions.length}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-white dark:bg-slate-900">
                {['Ref Node', 'Base Value', 'Yield Factor', 'Net Amount', 'State', 'Timestamp'].map((header) => (
                  <th key={header} className="px-10 py-8 text-left text-xs font-bold text-slate-400 uppercase border-b border-slate-50 dark:border-slate-800/50">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {commissions.map((comm) => (
                <tr key={comm.id} className="group hover:bg-slate-50/50 transition-all duration-300">
                  <td className="px-10 py-10">
                    <p className="text-sm font-bold text-slate-900 uppercase italic group-hover:text-primary-600 transition-colors dark:text-white">#{comm.loadId.substring(0, 10).toUpperCase()}</p>
                  </td>
                  <td className="px-10 py-10 text-xs font-bold text-slate-700 dark:text-slate-200">
                    {comm.loadAmount.toLocaleString()} KES
                  </td>
                  <td className="px-10 py-10">
                    <span className="text-xs font-bold text-primary-500 bg-primary-50 px-3 py-1 rounded-lg border border-primary-100">{comm.commissionRate}%</span>
                  </td>
                  <td className="px-10 py-10">
                    <p className="text-xl font-bold text-slate-900 dark:text-white">{comm.commissionAmount.toLocaleString()}</p>
                  </td>
                  <td className="px-10 py-10">
                    <span className={`px-4 py-1.5 rounded-xl text-xs font-bold uppercase border shadow-sm ${getStatusPrimeStyle(comm.status)}`}>
                      {comm.status}
                    </span>
                  </td>
                  <td className="px-10 py-10 text-right">
                    <p className="text-xs font-bold text-slate-900 uppercase dark:text-white">{new Date(comm.createdAt).toLocaleDateString()}</p>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default CommissionsPage;
