import { DashboardSkeleton } from '../../components/common/LoadingSkeletons';
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { brokerAPI, type BrokerStatistics } from '../../services/brokerApi';
import { useCurrencyFormat } from '../../hooks/useCurrencyFormat';
import { 
  TrendingUp, 
  DollarSign, 
  Package, 
  BarChart3,
  Calendar,
  Activity,
  Zap,
  Shield,
  ArrowRight
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

const BrokerAnalytics: React.FC = () => {
  const { user } = useAuth();
  const { compact: fmtMoney, format: fmtFull } = useCurrencyFormat();
  const [statistics, setStatistics] = useState<BrokerStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');

  useEffect(() => {
    if (user && user.role === 'BROKER') {
      loadStatistics();
    }
  }, [user, timeRange]);

  const loadStatistics = async () => {
    try {
      setLoading(true);
      const response = await brokerAPI.getBrokerStatistics(user!.id);
      setStatistics(response.data);
    } catch (err: any) {
      console.error('Failed to load broker statistics:', err);
    } finally {
      setLoading(false);
    }
  };

  const commissionData = [
    { month: 'Jan', amount: 4500, count: 12 },
    { month: 'Feb', amount: 5200, count: 15 },
    { month: 'Mar', amount: 4800, count: 13 },
    { month: 'Apr', amount: 6100, count: 18 },
    { month: 'May', amount: 5500, count: 16 },
    { month: 'Jun', amount: 6800, count: 20 },
  ];

  const statusData = [
    { name: 'Paid', value: 45, color: '#10b981' },
    { name: 'Approved', value: 25, color: '#3b82f6' },
    { name: 'Pending', value: 20, color: '#f59e0b' },
    { name: 'Cancelled', value: 10, color: '#ef4444' },
  ];

  const performanceData = [
    { month: 'Jan', success: 85, total: 100 },
    { month: 'Feb', success: 90, total: 100 },
    { month: 'Mar', success: 88, total: 100 },
    { month: 'Apr', success: 92, total: 100 },
    { month: 'May', success: 87, total: 100 },
    { month: 'Jun', success: 95, total: 100 },
  ];

  if (loading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="max-w-[1400px] mx-auto space-y-12 animate-fade-in pb-24">
      {/* Ultra-Compact Insights Header */}
      <div className="relative overflow-hidden bg-white dark:bg-slate-900 rounded-[2rem] p-6 shadow-sm border border-slate-100 dark:border-slate-800 flex items-center justify-between group">
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-slate-100/60 dark:bg-primary-600/10 rounded-full -mr-48 -mt-48 blur-[80px]"></div>
        
        <div className="relative z-10 flex items-center gap-6">
          <div className="w-14 h-14 rounded-2xl bg-[#345E85]/10 dark:bg-white/10 border border-[#345E85]/20 dark:border-white/20 flex items-center justify-center">
            <BarChart3 size={24} className="text-[#345E85] dark:text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight leading-none mb-1 text-slate-900 dark:text-white">Insights</h1>
            <p className="text-slate-400 text-sm font-bold uppercase">Global Metrics</p>
          </div>
        </div>

        <div className="relative z-10 flex items-center gap-6 mr-4">
           <div className="flex items-center gap-4 bg-white/5 border border-white/10 rounded-xl px-6 py-3">
             <Calendar size={14} className="text-primary-400" />
             <select value={timeRange} onChange={(e) => setTimeRange(e.target.value as any)} className="bg-transparent border-none text-sm font-bold uppercase text-white outline-none cursor-pointer pr-4 appearance-none">
                <option value="7d" className="bg-slate-900 text-white dark:bg-slate-950">7 Days</option>
                <option value="30d" className="bg-slate-900 text-white dark:bg-slate-950" selected>30 Days</option>
                <option value="90d" className="bg-slate-900 text-white dark:bg-slate-950">90 Days</option>
                <option value="1y" className="bg-slate-900 text-white dark:bg-slate-950">1 Year</option>
             </select>
           </div>
        </div>
      </div>

      {/* Primary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {[
          { label: 'Revenue', value: fmtMoney(statistics?.totalCommissions ?? 0), icon: DollarSign },
          { label: 'Settled', value: fmtMoney(statistics?.totalEarned ?? 0), icon: TrendingUp },
          { label: 'Loads', value: statistics?.totalLoads || 0, icon: Package },
          { label: 'Yield', value: `${(statistics?.averageCommissionRate ?? 0).toFixed(1)}%`, icon: Activity },
        ].map((stat, i) => (
          <div key={i} className="group bg-white rounded-[2.5rem] p-10 border border-slate-100 shadow-sm transition-all hover:shadow-2xl overflow-hidden relative dark:bg-slate-900 dark:border-slate-800">
            <div className="relative z-10">
              <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-slate-900 group-hover:text-white transition-all mb-8 shadow-sm dark:bg-slate-800/50">
                <stat.icon size={20} />
              </div>
              <p className="text-sm font-bold text-slate-400 uppercase mb-2">{stat.label}</p>
              <h3 className="text-3xl font-bold text-slate-900 dark:text-white">{stat.value}</h3>
            </div>
          </div>
        ))}
      </div>

      {/* Analysis Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        <div className="bg-white rounded-[3rem] border border-slate-100 p-10 shadow-sm space-y-10 dark:bg-slate-900 dark:border-slate-800">
          <h3 className="text-sm font-bold text-slate-900 uppercase flex items-center gap-3 dark:text-white">
            <div className="w-2 h-2 bg-primary-600 rounded-full"></div> Revenue Flow
          </h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={commissionData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 900}} dy={15} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 900}} dx={-10} />
                <Tooltip contentStyle={{borderRadius: '20px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', padding: '20px'}} />
                <Line type="monotone" dataKey="amount" stroke="#3b82f6" strokeWidth={4} dot={{ r: 6, fill: '#3b82f6', strokeWidth: 3, stroke: '#fff' }} activeDot={{ r: 8, strokeWidth: 0 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-[3rem] border border-slate-100 p-10 shadow-sm space-y-10 dark:bg-slate-900 dark:border-slate-800">
          <h3 className="text-sm font-bold text-slate-900 uppercase flex items-center gap-3 dark:text-white">
            <div className="w-2 h-2 bg-slate-900 rounded-full dark:bg-slate-950"></div> Distribution
          </h3>
          <div className="h-[300px] w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={statusData} cx="50%" cy="50%" innerRadius={80} outerRadius={110} paddingAngle={5} dataKey="value">
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-[3rem] border border-slate-100 p-10 shadow-sm space-y-10 dark:bg-slate-900 dark:border-slate-800">
          <h3 className="text-sm font-bold text-slate-900 uppercase flex items-center gap-3 dark:text-white">
            <div className="w-2 h-2 bg-emerald-500 rounded-full"></div> Volume
          </h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={commissionData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 900}} dy={15} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 900}} dx={-10} />
                <Bar dataKey="count" fill="#10b981" radius={[8, 8, 0, 0]} barSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-[3rem] border border-slate-100 p-10 shadow-sm space-y-10 dark:bg-slate-900 dark:border-slate-800">
          <h3 className="text-sm font-bold text-slate-900 uppercase flex items-center gap-3 dark:text-white">
            <div className="w-2 h-2 bg-indigo-500 rounded-full"></div> Success
          </h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={performanceData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 900}} dy={15} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 900}} dx={-10} />
                <Line type="stepAfter" dataKey="success" stroke="#6366f1" strokeWidth={4} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="bg-white rounded-[3.5rem] border border-slate-100 p-12 shadow-sm space-y-12 dark:bg-slate-900 dark:border-slate-800">
        <h2 className="text-2xl font-bold text-slate-900 uppercase italic dark:text-white">Strategic Summary</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {[
            { label: 'Yield per Load', value: fmtFull((statistics?.totalCommissions || 0) / (statistics?.totalLoads || 1)) },
            { label: 'Pipeline Reserve', value: fmtMoney(statistics?.totalPending ?? 0) },
            { label: 'Authorized Earnings', value: fmtMoney(statistics?.totalApproved ?? 0) },
          ].map((item, index) => (
            <div key={index} className="p-10 bg-slate-50 rounded-[2.5rem] border border-slate-100 hover:bg-white transition-all shadow-sm dark:bg-slate-800/50 dark:border-slate-800">
              <p className="text-sm font-bold text-slate-400 uppercase mb-4">{item.label}</p>
              <p className="text-3xl font-bold text-slate-900 italic dark:text-white">{item.value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default BrokerAnalytics;
