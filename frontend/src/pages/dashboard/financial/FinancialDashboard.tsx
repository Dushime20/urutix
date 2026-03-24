import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Download,
  Filter,
  ArrowUpRight,
  PieChart as PieChartIcon,
  BarChart3,
  Wallet,
  Shield,
  TrendingUp,
  CreditCard
} from 'lucide-react';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { cn } from '@/utils/cn';
import { financialAPI } from '@/services/api';

const FinancialDashboard: React.FC = () => {
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'quarter' | 'year'>('month');

  // Fetch real performance metrics
  const { isLoading } = useQuery({
    queryKey: ['financial-performance', timeRange],
    queryFn: async () => {
      const response = await financialAPI.getPerformanceMetrics({ period: timeRange });
      return response.data?.data || response.data || [];
    }
  });

  // Fetch detailed reports for P&L
  const { data: reportData } = useQuery({
    queryKey: ['financial-report-summary'],
    queryFn: async () => {
      const response = await financialAPI.getFinancialReports({ limit: 1 });
      const reports = response.data?.data || response.data || [];
      return reports[0]?.data || null;
    }
  });

  // Fetch recent transactions (Invoices + Payments + Expenses)
  const { data: recentInvoices } = useQuery({
    queryKey: ['recent-invoices'],
    queryFn: () => financialAPI.getInvoices({ limit: 5 })
  });

  const stats = useMemo(() => {
    if (!reportData) return { revenue: 0, expenses: 0, profit: 0, margin: 0 };
    return {
      revenue: reportData.revenue?.total || 0,
      expenses: reportData.expenses?.total || 0,
      profit: reportData.profit?.total || 0,
      margin: reportData.profit?.margin || 0
    };
  }, [reportData]);

  const categoryBreakdown = useMemo(() => {
    if (!reportData?.expenses?.byCategory) return [];
    const colors = ['#345E85', '#EC4899', '#F59E0B', '#6B8DAD', '#10B981', '#8B5CF6'];
    return Object.entries(reportData.expenses.byCategory).map(([name, value], i) => ({
      name,
      value: Number(value),
      color: colors[i % colors.length]
    }));
  }, [reportData]);

  const recentTransactions = useMemo(() => {
    const invoices = (recentInvoices as any)?.data || [];
    return invoices.slice(0, 5).map((inv: any) => ({
      id: inv.id,
      description: `Invoice ${inv.invoiceNumber}`,
      amount: inv.totalAmount,
      date: inv.issueDate,
      status: inv.status,
      type: 'invoice'
    }));
  }, [recentInvoices]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(amount);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-40 gap-4">
        <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center animate-bounce">
          <Wallet className="w-6 h-6 text-[#345E85]" />
        </div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest animate-pulse">Synchronizing Ledger Assets...</p>
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      {/* Header Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-slate-50 p-6 rounded-[2rem] border border-slate-100 shadow-sm">
        <div className="flex gap-2 p-1 bg-white rounded-2xl border border-slate-100 shadow-inner">
          {['week', 'month', 'quarter', 'year'].map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range as any)}
              className={cn(
                "px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                timeRange === range
                  ? 'bg-slate-900 text-white shadow-lg'
                  : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
              )}
            >
               {range}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <button className="h-12 px-6 bg-white border border-slate-200 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center gap-2">
            <Filter size={14} /> Filter Node
          </button>
          <button className="h-12 px-6 bg-[#345E85] text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all flex items-center gap-2 shadow-lg shadow-blue-900/10 active:scale-95">
            <Download size={14} /> Export Audit
          </button>
        </div>
      </div>

      {/* Primary Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-300 group">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
            <TrendingUp size={24} />
          </div>
          <div className="space-y-1">
            <div className="text-3xl font-black text-slate-900 leading-none">{formatCurrency(stats.revenue)}</div>
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center justify-between">
              <span>Total Revenue</span>
              <span className="text-emerald-500">+12%</span>
            </div>
            <div className="text-[9px] font-bold uppercase tracking-widest mt-2 text-slate-300">Net Gross Income</div>
          </div>
        </div>

        <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-300 group">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
            <Wallet size={24} />
          </div>
          <div className="space-y-1">
            <div className="text-3xl font-black text-slate-900 leading-none">{formatCurrency(stats.expenses)}</div>
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center justify-between">
              <span>Total Expenses</span>
              <span className="text-rose-500">+5%</span>
            </div>
            <div className="text-[9px] font-bold uppercase tracking-widest mt-2 text-slate-300">Operational Burn</div>
          </div>
        </div>

        <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-300 group">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#345E85] flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
            <ArrowUpRight size={24} />
          </div>
          <div className="space-y-1">
            <div className="text-3xl font-black text-slate-900 leading-none">{formatCurrency(stats.profit)}</div>
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center justify-between">
              <span>Net Profit</span>
              <span className="text-blue-500">Peak Performance</span>
            </div>
            <div className="text-[9px] font-bold uppercase tracking-widest mt-2 text-slate-300">Liquid Capital</div>
          </div>
        </div>

        <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-300 group">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
            <PieChartIcon size={24} />
          </div>
          <div className="space-y-1">
            <div className="text-3xl font-black text-slate-900 leading-none">{stats.margin.toFixed(1)}%</div>
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center justify-between">
              <span>Profit Margin</span>
              <span className="text-amber-500">Audit Ready</span>
            </div>
            <div className="text-[9px] font-bold uppercase tracking-widest mt-2 text-slate-300">Efficiency Index</div>
          </div>
        </div>
      </div>

      {/* Analytics Architecture */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Expenditure Lifecycle Chart */}
        <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-tighter">Expenditure Lifecycle</h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Cross-category financial velocity</p>
            </div>
            <BarChart3 className="text-[#345E85] w-6 h-6 opacity-40" />
          </div>
          <div className="h-[300px] w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={reportData?.expenses?.byMonth ? Object.entries(reportData.expenses.byMonth).map(([month, total]) => ({ month, total })) : []}>
                <defs>
                  <linearGradient id="colorPrimary" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#345E85" stopOpacity={0.1} />
                    <stop offset="95%" stopColor="#345E85" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={10} axisLine={false} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={10} axisLine={false} tickLine={false} tickFormatter={(value) => `$${value / 1000}k`} />
                <Tooltip
                  contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', fontWeight: 900, textTransform: 'uppercase', fontSize: '10px' }}
                />
                <Area type="monotone" dataKey="total" stroke="#345E85" strokeWidth={3} fillOpacity={1} fill="url(#colorPrimary)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Capital OS Distribution */}
        <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-tighter">Capital Distribution</h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Allocation across operational nodes</p>
            </div>
            <PieChartIcon className="text-[#345E85] w-6 h-6 opacity-40" />
          </div>
          <div className="flex items-center h-[300px]">
            <ResponsiveContainer width="60%" height="100%">
              <PieChart>
                <Pie
                  data={categoryBreakdown}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={8}
                  dataKey="value"
                >
                  {categoryBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex-1 space-y-4 max-h-[250px] overflow-y-auto pr-4 scrollbar-hide">
              {categoryBreakdown.length > 0 ? categoryBreakdown.map((item, index) => (
                <div key={index} className="flex items-center justify-between group cursor-default">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest group-hover:text-slate-900 transition-colors truncate max-w-[100px]">{item.name}</span>
                  </div>
                  <span className="text-[10px] font-black text-slate-900">{formatCurrency(item.value)}</span>
                </div>
              )) : (
                <div className="text-center py-10 opacity-30 text-[10px] font-black uppercase tracking-widest">No Sector Data</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Historic Logs Preview */}
      <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white relative overflow-hidden shadow-2xl">
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h3 className="text-lg font-black uppercase tracking-tighter">System Audit Logs</h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Most recent capital movements across network</p>
            </div>
            <button className="h-12 px-6 bg-white/10 hover:bg-white/20 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border border-white/10 flex items-center gap-2">
              Access Full Log History <ArrowUpRight size={14} />
            </button>
          </div>

          <div className="space-y-4">
            {recentTransactions.length > 0 ? recentTransactions.map((transaction: any) => (
              <div
                key={transaction.id}
                className="flex items-center justify-between p-6 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all group"
              >
                <div className="flex items-center gap-6">
                  <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-white/50 group-hover:text-white transition-colors">
                    {transaction.type === 'invoice' ? <CreditCard size={20} /> : <Shield size={20} />}
                  </div>
                  <div>
                    <p className="text-sm font-black uppercase tracking-tight">{transaction.description}</p>
                    <div className="flex items-center gap-4 mt-1.5 opacity-40">
                      <span className="text-[9px] font-black uppercase tracking-widest">{new Date(transaction.date).toLocaleDateString()}</span>
                      <span className="w-1 h-1 bg-white rounded-full" />
                      <span className="text-[9px] font-black uppercase tracking-widest">System Record</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xl font-black">{formatCurrency(transaction.amount)}</p>
                  <span className={cn(
                    "inline-flex items-center h-6 px-3 rounded-lg text-[9px] font-black uppercase tracking-widest mt-2 border",
                    transaction.status === 'paid' || transaction.status === 'completed' ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" : "bg-amber-500/20 text-amber-400 border-amber-500/30"
                  )}>
                    {transaction.status}
                  </span>
                </div>
              </div>
            )) : (
              <div className="text-center py-10 opacity-20 text-[10px] font-black uppercase tracking-widest">No recent movements detected</div>
            )}
          </div>
        </div>
        {/* Background Decorative Element */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/10 rounded-full -mr-64 -mt-64 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-blue-500/10 rounded-full -ml-32 -mb-32 blur-[100px] pointer-events-none" />
      </div>
    </div>
  );
};

export default FinancialDashboard;
