import React, { useState, useMemo } from 'react';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  CreditCard,
  Receipt,
  Calendar,
  Download,
  Filter,
  ArrowUpRight,
  ArrowDownRight,
  Package,
  Truck,
  Clock,
  AlertCircle,
  CheckCircle,
  PieChart as PieChartIcon,
  BarChart3,
  FileText,
  Wallet
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart
} from 'recharts';

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
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Mock data - Replace with actual API calls
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
    { name: 'Transportation', value: 72, amount: 90360, color: '#8B5CF6' },
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
    },
    {
      id: '4',
      type: 'fee',
      description: 'Platform Service Fee',
      amount: 145,
      status: 'completed',
      date: '2025-12-25',
      paymentMethod: 'Auto-debit'
    },
    {
      id: '5',
      type: 'payment',
      description: 'Shipment Payment - Boston to Miami',
      amount: 4250,
      status: 'scheduled',
      date: '2026-01-10',
      cargoId: 'CARGO-2405'
    }
  ];

  const upcomingPayments = [
    { id: '1', description: 'Insurance Premium', amount: 1200, dueDate: '2026-01-05', status: 'pending' },
    { id: '2', description: 'Shipment to Seattle', amount: 3800, dueDate: '2026-01-10', status: 'scheduled' },
    { id: '3', description: 'Monthly Platform Fee', amount: 299, dueDate: '2026-01-15', status: 'scheduled' }
  ];

  const getStatusColor = (status: string) => {
    const colors = {
      completed: 'text-emerald-600 bg-emerald-50',
      pending: 'text-amber-600 bg-amber-50',
      failed: 'text-rose-600 bg-rose-50',
      scheduled: 'text-blue-600 bg-blue-50'
    };
    return colors[status as keyof typeof colors] || 'text-gray-600 bg-gray-50';
  };

  const getTypeIcon = (type: string) => {
    const icons = {
      payment: <DollarSign className="w-5 h-5" />,
      invoice: <FileText className="w-5 h-5" />,
      refund: <TrendingUp className="w-5 h-5" />,
      fee: <Receipt className="w-5 h-5" />
    };
    return icons[type as keyof typeof icons] || <DollarSign className="w-5 h-5" />;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-violet-50 p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Financial Dashboard</h1>
            <p className="text-gray-600">Track spending, manage payments, and optimize costs</p>
          </div>
          <div className="flex gap-3">
            <button className="px-4 py-2 border-2 border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 font-semibold transition-all flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Filter
            </button>
            <button className="px-4 py-2 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-xl hover:from-violet-700 hover:to-purple-700 font-semibold transition-all flex items-center gap-2 shadow-lg">
              <Download className="w-5 h-5" />
              Export Report
            </button>
          </div>
        </div>

        {/* Time Range Selector */}
        <div className="flex gap-2 mt-4">
          {['week', 'month', 'quarter', 'year'].map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range as any)}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                timeRange === range
                  ? 'bg-violet-600 text-white shadow-md'
                  : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              {range.charAt(0).toUpperCase() + range.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3">
              <Wallet className="w-6 h-6" />
            </div>
            <div className="text-right">
              <p className="text-violet-100 text-sm font-medium">Total Spent</p>
              <p className="text-3xl font-bold mt-1">{formatCurrency(financialStats.totalSpent)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <div className="flex items-center gap-1 bg-white/20 px-2 py-1 rounded-lg">
              <TrendingUp className="w-4 h-4" />
              <span>{financialStats.monthlyChange}%</span>
            </div>
            <span className="text-violet-100">vs last month</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 border-2 border-gray-100 shadow-sm hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-emerald-100 rounded-xl p-3">
              <Calendar className="w-6 h-6 text-emerald-600" />
            </div>
            <div className="text-right">
              <p className="text-gray-600 text-sm font-medium">This Month</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{formatCurrency(financialStats.thisMonth)}</p>
            </div>
          </div>
          <div className="text-sm text-gray-600">
            {financialStats.totalShipments} shipments
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 border-2 border-gray-100 shadow-sm hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-amber-100 rounded-xl p-3">
              <Clock className="w-6 h-6 text-amber-600" />
            </div>
            <div className="text-right">
              <p className="text-gray-600 text-sm font-medium">Pending</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{formatCurrency(financialStats.pending)}</p>
            </div>
          </div>
          <div className="text-sm text-gray-600">
            3 payments scheduled
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 border-2 border-gray-100 shadow-sm hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-rose-100 rounded-xl p-3">
              <AlertCircle className="w-6 h-6 text-rose-600" />
            </div>
            <div className="text-right">
              <p className="text-gray-600 text-sm font-medium">Overdue</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{formatCurrency(financialStats.overdue)}</p>
            </div>
          </div>
          <div className="text-sm text-rose-600 font-medium">
            Action required
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Spending Trend */}
        <div className="bg-white rounded-2xl p-6 border-2 border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-1">Spending Trend</h3>
              <p className="text-sm text-gray-600">Monthly breakdown by category</p>
            </div>
            <BarChart3 className="w-6 h-6 text-violet-600" />
          </div>

          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={spendingTrend}>
              <defs>
                <linearGradient id="colorTransport" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorInsurance" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#EC4899" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#EC4899" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorFees" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#F59E0B" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="month" stroke="#6B7280" />
              <YAxis stroke="#6B7280" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'white', 
                  border: '2px solid #E5E7EB', 
                  borderRadius: '12px',
                  padding: '12px'
                }}
              />
              <Legend />
              <Area 
                type="monotone" 
                dataKey="transport" 
                stroke="#8B5CF6" 
                strokeWidth={2}
                fillOpacity={1} 
                fill="url(#colorTransport)" 
                name="Transportation"
              />
              <Area 
                type="monotone" 
                dataKey="insurance" 
                stroke="#EC4899" 
                strokeWidth={2}
                fillOpacity={1} 
                fill="url(#colorInsurance)" 
                name="Insurance"
              />
              <Area 
                type="monotone" 
                dataKey="fees" 
                stroke="#F59E0B" 
                strokeWidth={2}
                fillOpacity={1} 
                fill="url(#colorFees)" 
                name="Fees"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Category Breakdown */}
        <div className="bg-white rounded-2xl p-6 border-2 border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-1">Cost Breakdown</h3>
              <p className="text-sm text-gray-600">Distribution by category</p>
            </div>
            <PieChartIcon className="w-6 h-6 text-violet-600" />
          </div>

          <div className="flex items-center gap-6">
            <ResponsiveContainer width="50%" height={250}>
              <PieChart>
                <Pie
                  data={categoryBreakdown}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {categoryBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: any, name: any, props: any) => [
                    `${formatCurrency(props.payload.amount)} (${value}%)`,
                    props.payload.name
                  ]}
                />
              </PieChart>
            </ResponsiveContainer>

            <div className="flex-1 space-y-3">
              {categoryBreakdown.map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-sm font-medium text-gray-700">{item.name}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-gray-900">{formatCurrency(item.amount)}</p>
                    <p className="text-xs text-gray-500">{item.value}%</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Budget Analysis */}
      <div className="bg-white rounded-2xl p-6 border-2 border-gray-100 shadow-sm mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">Budget vs Actual</h3>
            <p className="text-sm text-gray-600">Track spending against your budget</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600">Overall Budget Utilization</p>
            <p className="text-2xl font-bold text-gray-900">{financialStats.budgetUtilization}%</p>
          </div>
        </div>

        <div className="space-y-4">
          {budgetAnalysis.map((item, index) => (
            <div key={index} className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-gray-900">{item.category}</span>
                <div className="text-right">
                  <span className="text-sm font-bold text-gray-900">
                    {formatCurrency(item.actual)} / {formatCurrency(item.budgeted)}
                  </span>
                  <span className={`ml-3 text-sm font-medium ${
                    item.variance < 0 ? 'text-emerald-600' : 'text-rose-600'
                  }`}>
                    {item.variance < 0 ? '↓' : '↑'} {formatCurrency(Math.abs(item.variance))}
                  </span>
                </div>
              </div>
              <div className="relative h-3 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`absolute top-0 left-0 h-full rounded-full transition-all ${
                    item.percentage > 100 
                      ? 'bg-gradient-to-r from-rose-500 to-red-600' 
                      : item.percentage > 90
                      ? 'bg-gradient-to-r from-amber-500 to-orange-600'
                      : 'bg-gradient-to-r from-emerald-500 to-teal-600'
                  }`}
                  style={{ width: `${Math.min(item.percentage, 100)}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-gray-500">
                <span>{item.percentage.toFixed(1)}% utilized</span>
                <span className={item.percentage > 100 ? 'text-rose-600 font-semibold' : ''}>
                  {item.percentage > 100 ? 'Over budget!' : `${formatCurrency(item.budgeted - item.actual)} remaining`}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Transactions & Upcoming Payments */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Transactions */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border-2 border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-1">Recent Transactions</h3>
              <p className="text-sm text-gray-600">{recentTransactions.length} transactions</p>
            </div>
            <button className="text-violet-600 hover:text-violet-700 font-semibold text-sm flex items-center gap-1">
              View All
              <ArrowUpRight className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-3">
            {recentTransactions.map((transaction) => (
              <div 
                key={transaction.id}
                className="flex items-center justify-between p-4 rounded-xl border border-gray-100 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-xl ${
                    transaction.type === 'payment' ? 'bg-violet-100 text-violet-600' :
                    transaction.type === 'invoice' ? 'bg-blue-100 text-blue-600' :
                    transaction.type === 'fee' ? 'bg-amber-100 text-amber-600' :
                    'bg-emerald-100 text-emerald-600'
                  }`}>
                    {getTypeIcon(transaction.type)}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{transaction.description}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs text-gray-500">{transaction.date}</span>
                      {transaction.paymentMethod && (
                        <>
                          <span className="text-gray-300">•</span>
                          <span className="text-xs text-gray-500">{transaction.paymentMethod}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-gray-900">
                    {formatCurrency(transaction.amount)}
                  </p>
                  <span className={`inline-block px-2 py-1 rounded-lg text-xs font-semibold mt-1 ${getStatusColor(transaction.status)}`}>
                    {transaction.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming Payments */}
        <div className="bg-gradient-to-br from-violet-600 to-purple-700 rounded-2xl p-6 text-white shadow-lg">
          <div className="mb-6">
            <h3 className="text-lg font-bold mb-1">Upcoming Payments</h3>
            <p className="text-violet-100 text-sm">{upcomingPayments.length} scheduled</p>
          </div>

          <div className="space-y-3">
            {upcomingPayments.map((payment) => (
              <div key={payment.id} className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                <div className="flex items-start justify-between mb-2">
                  <p className="font-semibold text-sm">{payment.description}</p>
                  <span className="text-lg font-bold">{formatCurrency(payment.amount)}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-violet-100">Due: {payment.dueDate}</span>
                  <span className="px-2 py-1 bg-white/20 rounded-lg">
                    {payment.status}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <button className="w-full mt-6 py-3 bg-white text-violet-600 rounded-xl font-bold hover:bg-violet-50 transition-colors flex items-center justify-center gap-2">
            <CreditCard className="w-5 h-5" />
            Make Payment
          </button>
        </div>
      </div>
    </div>
  );
};

export default FinancialDashboard;

