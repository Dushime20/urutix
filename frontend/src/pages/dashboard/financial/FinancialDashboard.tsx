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
import { motion } from 'framer-motion';
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
    queryFn: async () => {
      const response = await financialAPI.getInvoices({ limit: 5 });
      return response.data?.data || response.data || [];
    }
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
    const invoices = Array.isArray(recentInvoices) ? recentInvoices : [];
    
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

  const SummaryCard = ({ title, value, icon: Icon, colorClass, gradient, change, changePositive }: { title: string; value: string; icon: any; colorClass: string; gradient: string; change?: string; changePositive?: boolean }) => (
    <motion.div
      whileHover={{ y: -5 }}
      className="flex flex-col items-center group cursor-pointer"
    >
      <div className="relative size-40 lg:size-44 bg-white dark:bg-gray-800 border-[6px] border-slate-50 dark:border-gray-700 rounded-full flex flex-col items-center justify-center transition-all duration-500 hover:border-slate-100 dark:hover:border-gray-600 hover:shadow-xl hover:shadow-slate-200/50">
        {/* Subtle Decorative Ring */}
        <svg className="absolute inset-0 w-full h-full -rotate-90 scale-[1.05]">
          <circle
            cx="50%"
            cy="50%"
            r="46%"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeDasharray="414"
            strokeDashoffset="300"
            className={cn("opacity-10 transition-all duration-1000 group-hover:opacity-30", colorClass)}
          />
        </svg>

        {/* Central Content */}
        <div className={cn("p-2 rounded-xl mb-1 bg-slate-50 dark:bg-gray-700 text-slate-400 dark:text-gray-400 group-hover:bg-white dark:group-hover:bg-gray-600 group-hover:text-inherit transition-all duration-500 shadow-sm", gradient)}>
          <Icon size={16} />
        </div>
        <p className="text-xl lg:text-2xl font-black text-[#0f172a] dark:text-white tracking-tighter group-hover:scale-110 transition-transform duration-500 text-center leading-none">
          {value}
        </p>
        {change && (
          <span className={cn("text-[8px] font-black mt-1", changePositive ? "text-emerald-500" : "text-rose-500")}>
            {change}
          </span>
        )}
      </div>
      <p className="mt-4 text-[8px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-gray-500 group-hover:text-[#345E85] dark:group-hover:text-blue-400 transition-colors text-center px-2">
        {title}
      </p>
    </motion.div>
  );

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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-slate-50 dark:bg-gray-800/50 p-6 rounded-[2rem] border border-slate-100 dark:border-gray-700 shadow-sm transition-colors">
        <div className="flex gap-2 p-1 bg-white dark:bg-gray-800 rounded-2xl border border-slate-100 dark:border-gray-700 shadow-inner overflow-x-auto scrollbar-hide">
          {['week', 'month', 'quarter', 'year'].map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range as any)}
              className={cn(
                "px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap",
                timeRange === range
                  ? 'bg-slate-900 dark:bg-blue-600 text-white shadow-lg'
                  : 'text-slate-400 dark:text-gray-500 hover:text-slate-600 dark:hover:text-gray-300 hover:bg-slate-50 dark:hover:bg-gray-700'
              )}
            >
               {range}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <button className="h-12 px-6 bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 text-slate-600 dark:text-gray-300 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-gray-700 transition-all flex items-center gap-2">
            <Filter size={14} /> Filter Node
          </button>
          <button className="h-12 px-6 bg-[#345E85] dark:bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 dark:hover:bg-blue-700 transition-all flex items-center gap-2 shadow-lg shadow-blue-900/10 active:scale-95">
            <Download size={14} /> Export Audit
          </button>
        </div>
      </div>

      {/* Primary Metrics Vector Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 py-10 bg-white/40 dark:bg-gray-800/20 rounded-[3rem] border border-slate-100/50 dark:border-gray-700/50 transition-colors">
        <SummaryCard 
          title="Total Revenue" 
          value={formatCurrency(stats.revenue)} 
          change="+12%"
          changePositive={true}
          icon={TrendingUp} 
          colorClass="text-emerald-500" 
          gradient="bg-emerald-50 text-emerald-600" 
        />
        <SummaryCard 
          title="Total Expenses" 
          value={formatCurrency(stats.expenses)} 
          change="+5%"
          changePositive={false}
          icon={Wallet} 
          colorClass="text-rose-400" 
          gradient="bg-rose-50 text-rose-600" 
        />
        <SummaryCard 
          title="Net Profit" 
          value={formatCurrency(stats.profit)} 
          change="Peak"
          changePositive={true}
          icon={ArrowUpRight} 
          colorClass="text-blue-500" 
          gradient="bg-blue-50 text-[#345E85]" 
        />
        <SummaryCard 
          title="Profit Margin" 
          value={`${stats.margin.toFixed(1)}%`} 
          change="Audit Ready"
          changePositive={true}
          icon={PieChartIcon} 
          colorClass="text-amber-500" 
          gradient="bg-amber-50 text-amber-600" 
        />
      </div>

      {/* Analytics Architecture */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Expenditure Lifecycle Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] p-8 border border-slate-100 dark:border-gray-700 shadow-sm transition-colors">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tighter">Expenditure Lifecycle</h3>
              <p className="text-[10px] font-bold text-slate-400 dark:text-gray-500 uppercase tracking-widest mt-1">Cross-category financial velocity</p>
            </div>
            <BarChart3 className="text-[#345E85] dark:text-blue-400 w-6 h-6 opacity-40" />
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
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" className="dark:stroke-gray-700" vertical={false} />
                <XAxis dataKey="month" stroke="#94a3b8" className="dark:stroke-gray-500" fontSize={10} axisLine={false} tickLine={false} />
                <YAxis stroke="#94a3b8" className="dark:stroke-gray-500" fontSize={10} axisLine={false} tickLine={false} tickFormatter={(value) => `$${value / 1000}k`} />
                <Tooltip
                  contentStyle={{ 
                    borderRadius: '1rem', 
                    border: 'none', 
                    boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', 
                    fontWeight: 900, 
                    textTransform: 'uppercase', 
                    fontSize: '10px',
                    backgroundColor: 'var(--tooltip-bg, #fff)',
                    color: 'var(--tooltip-color, #000)'
                  }}
                  itemStyle={{ color: 'inherit' }}
                />
                <Area type="monotone" dataKey="total" stroke="#345E85" strokeWidth={3} fillOpacity={1} fill="url(#colorPrimary)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Capital OS Distribution */}
        <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] p-8 border border-slate-100 dark:border-gray-700 shadow-sm transition-colors">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tighter">Capital Distribution</h3>
              <p className="text-[10px] font-bold text-slate-400 dark:text-gray-500 uppercase tracking-widest mt-1">Allocation across operational nodes</p>
            </div>
            <PieChartIcon className="text-[#345E85] dark:text-blue-400 w-6 h-6 opacity-40" />
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
                    <span className="text-[9px] font-black text-slate-500 dark:text-gray-400 uppercase tracking-widest group-hover:text-slate-900 dark:group-hover:text-white transition-colors truncate max-w-[100px]">{item.name}</span>
                  </div>
                  <span className="text-[10px] font-black text-slate-900 dark:text-white">{formatCurrency(item.value)}</span>
                </div>
              )) : (
                <div className="text-center py-10 opacity-30 text-[10px] font-black uppercase tracking-widest">No Sector Data</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Historic Logs Preview */}
      <div className="bg-slate-900 dark:bg-gray-950 rounded-[2.5rem] p-10 text-white relative overflow-hidden shadow-2xl transition-colors">
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
