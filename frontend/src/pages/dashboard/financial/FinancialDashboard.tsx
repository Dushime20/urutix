import React, { useState } from 'react';
import {
  Calendar,
  Download,
  Filter,
  ArrowUpRight,
  PieChart as PieChartIcon,
  BarChart3,
  Wallet,
  Clock,
  AlertCircle,
  Shield
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

interface Transaction {
  id: string;
  type: 'payment' | 'invoice' | 'refund' | 'fee';
  description: string;
  amount: number;
  status: 'completed' | 'pending' | 'failed' | 'scheduled';
  date: string;
  cargoId?: string;
  invoiceNumber?: string;
  paymentMethod?: string;
}

interface SpendingData {
  month: string;
  transport: number;
  insurance: number;
  fees: number;
  total: number;
}

interface BudgetItem {
  category: string;
  budgeted: number;
  actual: number;
  variance: number;
  percentage: number;
}

export const FinancialDashboard: React.FC = () => {
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'quarter' | 'year'>('month');

  // Mock data - Consistent with premium theme
  const financialStats = {
    totalSpent: 125430,
    thisMonth: 18750,
    pending: 5200,
    overdue: 1200,
    avgPerShipment: 3240,
    totalShipments: 42,
    monthlyChange: 12.5,
    budgetUtilization: 76
  };

  const spendingTrend: SpendingData[] = [
    { month: 'Jan', transport: 12000, insurance: 1200, fees: 800, total: 14000 },
    { month: 'Feb', transport: 15000, insurance: 1400, fees: 900, total: 17300 },
    { month: 'Mar', transport: 11000, insurance: 1100, fees: 750, total: 12850 },
    { month: 'Apr', transport: 16500, insurance: 1600, fees: 1000, total: 19100 },
    { month: 'May', transport: 14200, insurance: 1350, fees: 850, total: 16400 },
    { month: 'Jun', transport: 17800, insurance: 1700, fees: 1100, total: 20600 }
  ];

  const categoryBreakdown = [
    { name: 'Transportation', value: 72, amount: 90360, color: '#345E85' },
    { name: 'Insurance', value: 11, amount: 13797, color: '#EC4899' },
    { name: 'Platform Fees', value: 8, amount: 10034, color: '#F59E0B' },
    { name: 'Additional Services', value: 9, amount: 11288, color: '#10B981' }
  ];

  const budgetAnalysis: BudgetItem[] = [
    { category: 'Transportation', budgeted: 95000, actual: 90360, variance: -4640, percentage: 95.1 },
    { category: 'Insurance', budgeted: 15000, actual: 13797, variance: -1203, percentage: 92.0 },
    { category: 'Fees', budgeted: 12000, actual: 10034, variance: -1966, percentage: 83.6 },
    { category: 'Additional', budgeted: 10000, actual: 11288, variance: 1288, percentage: 112.9 }
  ];

  const recentTransactions: Transaction[] = [
    {
      id: '1',
      type: 'payment',
      description: 'Shipment Payment - NYC to LA',
      amount: 3450,
      status: 'completed',
      date: '2026-01-02',
      cargoId: 'CARGO-2401',
      paymentMethod: 'Credit Card'
    },
    {
      id: '2',
      type: 'invoice',
      description: 'Insurance Premium - Q1 2026',
      amount: 1200,
      status: 'pending',
      date: '2026-01-05',
      invoiceNumber: 'INV-2026-001'
    },
    {
      id: '3',
      type: 'payment',
      description: 'Shipment Payment - Chicago to Houston',
      amount: 2100,
      status: 'completed',
      date: '2025-12-28',
      cargoId: 'CARGO-2398',
      paymentMethod: 'Bank Transfer'
    }
  ];


  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(amount);
  };

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
          <button className="h-12 px-6 bg-[#345E85] text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all flex items-center gap-2 shadow-lg shadow-blue-900/10">
            <Download size={14} /> Export Audit
          </button>
        </div>
      </div>

      {/* Primary Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Total Expenditure', value: formatCurrency(financialStats.totalSpent), icon: Wallet, color: 'emerald', change: '+12.5%' },
          { label: 'Current Period', value: formatCurrency(financialStats.thisMonth), icon: Calendar, color: 'blue', sub: '42 Active Assets' },
          { label: 'Pending Liquidity', value: formatCurrency(financialStats.pending), icon: Clock, color: 'amber', sub: '3 Scheduled Syncs' },
          { label: 'Risk Threshold', value: formatCurrency(financialStats.overdue), icon: AlertCircle, color: 'rose', sub: 'Immediate Audit Required' }
        ].map((stat, i) => (
          <div key={i} className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-300 group">
            <div className={cn(
              "w-12 h-12 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform",
              stat.color === 'emerald' ? "bg-emerald-50 text-emerald-600" :
                stat.color === 'blue' ? "bg-blue-50 text-blue-600" :
                  stat.color === 'amber' ? "bg-amber-50 text-amber-600" : "bg-rose-50 text-rose-600"
            )}>
              <stat.icon size={24} />
            </div>
            <div className="space-y-1">
              <div className="text-3xl font-black text-slate-900 leading-none">
                {stat.value}
              </div>
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center justify-between">
                <span>{stat.label}</span>
                {stat.change && <span className="text-emerald-500">{stat.change}</span>}
              </div>
              {stat.sub && (
                <div className={cn(
                  "text-[9px] font-bold uppercase tracking-widest mt-2",
                  stat.color === 'rose' ? "text-rose-500 animate-pulse" : "text-slate-300"
                )}>
                  {stat.sub}
                </div>
              )}
            </div>
          </div>
        ))}
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
              <AreaChart data={spendingTrend}>
                <defs>
                  <linearGradient id="colorPrimary" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#345E85" stopOpacity={0.1} />
                    <stop offset="95%" stopColor="#345E85" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={10} fontWeight={900} axisLine={false} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={10} fontWeight={900} axisLine={false} tickLine={false} tickFormatter={(value) => `$${value / 1000}k`} />
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
            <div className="flex-1 space-y-4">
              {categoryBreakdown.map((item, index) => (
                <div key={index} className="flex items-center justify-between group cursor-default">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest group-hover:text-slate-900 transition-colors">{item.name}</span>
                  </div>
                  <span className="text-[10px] font-black text-slate-900">{item.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Resource Allocation Registry */}
      <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm">
        <div className="flex items-center justify-between mb-10">
          <div>
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-tighter">Budget Allocation Registry</h3>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Real-time utilization vs benchmark</p>
          </div>
          <div className="bg-slate-50 px-6 py-3 rounded-2xl border border-slate-100">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Global Pool Used:</span>
            <span className="ml-3 text-lg font-black text-[#345E85]">{financialStats.budgetUtilization}%</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
          {budgetAnalysis.map((item, index) => (
            <div key={index} className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest">{item.category}</span>
                  <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                    {formatCurrency(item.actual)} / {formatCurrency(item.budgeted)}
                  </div>
                </div>
                <div className={cn(
                  "text-[10px] font-black px-3 py-1 rounded-full border",
                  item.variance < 0 ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-rose-50 text-rose-600 border-rose-100"
                )}>
                  {item.variance < 0 ? "Under Budget" : "Over Budget"}
                </div>
              </div>
              <div className="relative h-2 bg-slate-50 rounded-full overflow-hidden border border-slate-100 shadow-inner">
                <div
                  className={cn(
                    "absolute top-0 left-0 h-full rounded-full transition-all duration-1000",
                    item.percentage > 100 ? "bg-rose-500" : "bg-[#345E85]"
                  )}
                  style={{ width: `${Math.min(item.percentage, 100)}%` }}
                />
              </div>
            </div>
          ))}
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
            {recentTransactions.map((transaction) => (
              <div
                key={transaction.id}
                className="flex items-center justify-between p-6 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all group"
              >
                <div className="flex items-center gap-6">
                  <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-white/50 group-hover:text-white transition-colors">
                    <Shield size={20} />
                  </div>
                  <div>
                    <p className="text-sm font-black uppercase tracking-tight">{transaction.description}</p>
                    <div className="flex items-center gap-4 mt-1.5 opacity-40">
                      <span className="text-[9px] font-black uppercase tracking-widest">{transaction.date}</span>
                      <span className="w-1 h-1 bg-white rounded-full" />
                      <span className="text-[9px] font-black uppercase tracking-widest">{transaction.paymentMethod || "Internal Sync"}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xl font-black">{formatCurrency(transaction.amount)}</p>
                  <span className={cn(
                    "inline-flex items-center h-6 px-3 rounded-lg text-[9px] font-black uppercase tracking-widest mt-2 border",
                    transaction.status === 'completed' ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" : "bg-amber-500/20 text-amber-400 border-amber-500/30"
                  )}>
                    {transaction.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
        {/* Background Decorative Element */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/10 rounded-full -mr-64 -mt-64 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-emerald-500/10 rounded-full -ml-32 -mb-32 blur-[100px] pointer-events-none" />
      </div>
    </div>
  );
};

export default FinancialDashboard;
