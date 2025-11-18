import React, { useState, useEffect } from 'react';
import { 
  FaDollarSign, FaChartLine, FaCreditCard, FaWallet, FaExchangeAlt,
  FaSearch, FaFilter, FaDownload, FaEye, FaEdit, FaPlus, FaCalendar,
  FaClock, FaArrowUp, FaArrowDown, FaCaretUp, FaCaretDown,
  FaCheckCircle, FaTimesCircle, FaHourglassHalf, FaPiggyBank,
  FaReceipt, FaMoneyBillWave, FaUniversity, FaHandshake, FaShoppingCart,
  FaTruck, FaGasPump, FaTools, FaRoad, FaUserTie, FaShieldAlt
} from 'react-icons/fa';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';

interface Expense {
  id: string;
  type: 'fuel' | 'maintenance' | 'toll' | 'driver' | 'insurance' | 'tax' | 'other';
  category: string;
  amount: number;
  date: string;
  description: string;
  truckId?: string;
  driverId?: string;
  tripId?: string;
  receipt?: string;
  status: 'pending' | 'approved' | 'rejected' | 'paid';
  taxDeductible: boolean;
  allocationPercentage: number;
}

interface Revenue {
  id: string;
  tripId: string;
  tripNumber: string;
  customerName: string;
  amount: number;
  date: string;
  status: 'pending' | 'completed' | 'overdue';
  paymentMethod: string;
}

interface FinancialMetrics {
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  profitMargin: number;
  pendingPayments: number;
  averageTripRevenue: number;
  monthlyRevenue: number[];
  expenseBreakdown: { type: string; amount: number; percentage: number }[];
}

const TruckOwnerFinancialDashboard: React.FC = () => {
  const [expenses, setExpenses] = useState<Expense[]>([
    {
      id: '1',
      type: 'fuel',
      category: 'Diesel',
      amount: 450.00,
      date: '2024-08-10',
      description: 'Fuel refill at Shell Station',
      truckId: 'TRK-001',
      status: 'paid',
      taxDeductible: true,
      allocationPercentage: 100
    },
    {
      id: '2',
      type: 'maintenance',
      category: 'Oil Change',
      amount: 120.00,
      date: '2024-08-08',
      description: 'Regular oil change and filter',
      truckId: 'TRK-001',
      status: 'paid',
      taxDeductible: true,
      allocationPercentage: 100
    },
    {
      id: '3',
      type: 'toll',
      category: 'Highway Tolls',
      amount: 85.50,
      date: '2024-08-09',
      description: 'I-95 and I-80 toll charges',
      tripId: 'TRP-001',
      status: 'paid',
      taxDeductible: true,
      allocationPercentage: 100
    }
  ]);

  const [revenues, setRevenues] = useState<Revenue[]>([
    {
      id: '1',
      tripId: 'TRP-001',
      tripNumber: 'TRIP-2024-001',
      customerName: 'TechCorp Industries',
      amount: 2500.00,
      date: '2024-08-10',
      status: 'completed',
      paymentMethod: 'ACH Transfer'
    },
    {
      id: '2',
      tripId: 'TRP-002',
      tripNumber: 'TRIP-2024-002',
      customerName: 'MedSupply Corp',
      amount: 3200.00,
      date: '2024-08-12',
      status: 'pending',
      paymentMethod: 'Credit Card'
    }
  ]);

  const [metrics, setMetrics] = useState<FinancialMetrics>({
    totalRevenue: 5700.00,
    totalExpenses: 655.50,
    netProfit: 5044.50,
    profitMargin: 88.5,
    pendingPayments: 3200.00,
    averageTripRevenue: 2850.00,
    monthlyRevenue: [4200, 3800, 4500, 5200, 4800, 5700],
    expenseBreakdown: [
      { type: 'Fuel', amount: 450.00, percentage: 68.7 },
      { type: 'Maintenance', amount: 120.00, percentage: 18.3 },
      { type: 'Tolls', amount: 85.50, percentage: 13.0 }
    ]
  });

  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [selectedTruck, setSelectedTruck] = useState('all');
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [showAddRevenue, setShowAddRevenue] = useState(false);

  const expenseColors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8'];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const getExpenseIcon = (type: string) => {
    const icons = {
      fuel: FaGasPump,
      maintenance: FaTools,
      toll: FaRoad,
      driver: FaUserTie,
      insurance: FaShieldAlt,
      tax: FaUniversity,
      other: FaReceipt
    };
    return icons[type] || FaReceipt;
  };

  const getStatusColor = (status: string) => {
    const colors = {
      pending: 'text-yellow-600 bg-yellow-100',
      approved: 'text-blue-600 bg-blue-100',
      rejected: 'text-red-600 bg-red-100',
      paid: 'text-green-600 bg-green-100',
      completed: 'text-green-600 bg-green-100',
      overdue: 'text-red-600 bg-red-100'
    };
    return colors[status] || 'text-gray-600 bg-gray-100';
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Financial Dashboard</h1>
          <p className="text-gray-600 mt-2">Track your trucking business finances, expenses, and profitability</p>
        </div>

        {/* Period and Filter Controls */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="quarter">This Quarter</option>
              <option value="year">This Year</option>
            </select>
            
            <select
              value={selectedTruck}
              onChange={(e) => setSelectedTruck(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Trucks</option>
              <option value="TRK-001">TRK-001</option>
              <option value="TRK-002">TRK-002</option>
            </select>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowAddExpense(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2"
            >
              <FaPlus className="w-4 h-4" />
              <span>Add Expense</span>
            </button>
            <button
              onClick={() => setShowAddRevenue(true)}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center space-x-2"
            >
              <FaPlus className="w-4 h-4" />
              <span>Add Revenue</span>
            </button>
          </div>
        </div>

        {/* Key Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(metrics.totalRevenue)}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <FaDollarSign className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <FaArrowUp className="w-4 h-4 text-green-500 mr-1" />
              <span className="text-green-500">+12.5%</span>
              <span className="text-gray-500 ml-1">from last month</span>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Expenses</p>
                <p className="text-2xl font-bold text-red-600">{formatCurrency(metrics.totalExpenses)}</p>
              </div>
              <div className="p-3 bg-red-100 rounded-full">
                <FaReceipt className="w-6 h-6 text-red-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <FaArrowDown className="w-4 h-4 text-red-500 mr-1" />
              <span className="text-red-500">-8.2%</span>
              <span className="text-gray-500 ml-1">from last month</span>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Net Profit</p>
                <p className="text-2xl font-bold text-blue-600">{formatCurrency(metrics.netProfit)}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <FaChartLine className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <FaArrowUp className="w-4 h-4 text-blue-500 mr-1" />
              <span className="text-blue-500">+{metrics.profitMargin}%</span>
              <span className="text-gray-500 ml-1">profit margin</span>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending Payments</p>
                <p className="text-2xl font-bold text-yellow-600">{formatCurrency(metrics.pendingPayments)}</p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-full">
                <FaClock className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <span className="text-yellow-500">2 payments</span>
              <span className="text-gray-500 ml-1">awaiting</span>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Revenue Trend */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue Trend</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={metrics.monthlyRevenue.map((value, index) => ({ month: `Month ${index + 1}`, revenue: value }))}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                <Line type="monotone" dataKey="revenue" stroke="#10B981" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Expense Breakdown */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Expense Breakdown</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={metrics.expenseBreakdown}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ type, percentage }) => `${type}: ${percentage}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="amount"
                >
                  {metrics.expenseBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={expenseColors[index % expenseColors.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatCurrency(Number(value))} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Expenses and Revenue */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Recent Expenses */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Recent Expenses</h3>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {expenses.slice(0, 5).map((expense) => {
                  const IconComponent = getExpenseIcon(expense.type);
                  return (
                    <div key={expense.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-blue-100 rounded-full">
                          <IconComponent className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{expense.description}</p>
                          <p className="text-sm text-gray-500">{expense.category} • {expense.date}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-red-600">{formatCurrency(expense.amount)}</p>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(expense.status)}`}>
                          {expense.status}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Recent Revenue */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Recent Revenue</h3>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {revenues.slice(0, 5).map((revenue) => (
                  <div key={revenue.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-green-100 rounded-full">
                        <FaTruck className="w-4 h-4 text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{revenue.tripNumber}</p>
                        <p className="text-sm text-gray-500">{revenue.customerName} • {revenue.date}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-green-600">{formatCurrency(revenue.amount)}</p>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(revenue.status)}`}>
                        {revenue.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors">
              <div className="text-center">
                <FaDownload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm font-medium text-gray-900">Export Report</p>
                <p className="text-xs text-gray-500">Download financial data</p>
              </div>
            </button>
            
            <button className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-400 hover:bg-green-50 transition-colors">
              <div className="text-center">
                <FaChartLine className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm font-medium text-gray-900">Generate Report</p>
                <p className="text-xs text-gray-500">Create custom analysis</p>
              </div>
            </button>
            
            <button className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-400 hover:bg-purple-50 transition-colors">
              <div className="text-center">
                <FaUniversity className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm font-medium text-gray-900">Tax Summary</p>
                <p className="text-xs text-gray-500">View tax-deductible items</p>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TruckOwnerFinancialDashboard;
