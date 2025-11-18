import React, { useState, useMemo } from 'react';
import {
  FaDollarSign, FaChartLine, FaArrowUp, FaArrowDown,
  FaCalculator, FaReceipt, FaCreditCard, FaUniversity,
  FaCalendar, FaFilter, FaDownload, FaEye
} from 'react-icons/fa';
import { Line, Bar, Doughnut } from 'react-chartjs-2';

interface FinancialMetricsProps {
  tenantId?: string;
}

const FinancialMetrics: React.FC<FinancialMetricsProps> = ({ tenantId }) => {
  const [timeRange, setTimeRange] = useState('30d');
  const [selectedMetric, setSelectedMetric] = useState('revenue');

  // Mock financial data - in real app, this would come from API
  const financialData = useMemo(() => ({
    summary: {
      totalRevenue: 12500000,
      totalExpenses: 8900000,
      netProfit: 3600000,
      profitMargin: 28.8,
      averageRevenuePerLoad: 10032,
      averageCostPerLoad: 7140,
      totalLoads: 1247,
      activeContracts: 23,
    },
    trends: {
      revenue: [1250000, 1890000, 1500000, 2500000, 2200000, 3000000, 2800000, 3200000, 2900000, 3500000, 3100000, 3800000],
      expenses: [890000, 1340000, 1060000, 1780000, 1560000, 2130000, 1990000, 2270000, 2060000, 2480000, 2200000, 2700000],
      profit: [360000, 550000, 440000, 720000, 640000, 870000, 810000, 930000, 840000, 1020000, 900000, 1100000],
    },
    breakdown: {
      revenue: {
        'Freight Charges': 8500000,
        'Additional Services': 2800000,
        'Storage Fees': 800000,
        'Insurance': 400000,
      },
      expenses: {
        'Fuel Costs': 3200000,
        'Driver Salaries': 2100000,
        'Maintenance': 1800000,
        'Insurance': 800000,
        'Administrative': 600000,
        'Other': 400000,
      },
      costs: {
        'Fixed Costs': 3500000,
        'Variable Costs': 5400000,
      }
    },
    monthly: {
      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
      revenue: [1250000, 1890000, 1500000, 2500000, 2200000, 3000000, 2800000, 3200000, 2900000, 3500000, 3100000, 3800000],
      expenses: [890000, 1340000, 1060000, 1780000, 1560000, 2130000, 1990000, 2270000, 2060000, 2480000, 2200000, 2700000],
      profit: [360000, 550000, 440000, 720000, 640000, 870000, 810000, 930000, 840000, 1020000, 900000, 1100000],
    }
  }), []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-RW', {
      style: 'currency',
      currency: 'RWF',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatPercentage = (num: number) => {
    return `${num.toFixed(1)}%`;
  };

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up': return <FaArrowUp className="w-4 h-4 text-green-500" />;
      case 'down': return <FaArrowDown className="w-4 h-4 text-red-500" />;
      case 'stable': return <FaChartLine className="w-4 h-4 text-gray-500" />;
    }
  };

  const getTrendColor = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up': return 'text-green-600';
      case 'down': return 'text-red-600';
      case 'stable': return 'text-gray-600';
    }
  };

  const revenueChartData = {
    labels: financialData.monthly.labels,
    datasets: [
      {
        label: 'Revenue',
        data: financialData.monthly.revenue,
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderWidth: 3,
        fill: true,
        tension: 0.4,
      },
      {
        label: 'Expenses',
        data: financialData.monthly.expenses,
        borderColor: 'rgb(239, 68, 68)',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        borderWidth: 3,
        fill: true,
        tension: 0.4,
      }
    ]
  };

  const profitChartData = {
    labels: financialData.monthly.labels,
    datasets: [
      {
        label: 'Net Profit',
        data: financialData.monthly.profit,
        borderColor: 'rgb(34, 197, 94)',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        borderWidth: 3,
        fill: true,
        tension: 0.4,
      }
    ]
  };

  const revenueBreakdownData = {
    labels: Object.keys(financialData.breakdown.revenue),
    datasets: [
      {
        label: 'Revenue Breakdown',
        data: Object.values(financialData.breakdown.revenue),
        backgroundColor: [
          'rgba(59, 130, 246, 0.8)',
          'rgba(34, 197, 94, 0.8)',
          'rgba(251, 191, 36, 0.8)',
          'rgba(168, 85, 247, 0.8)',
        ],
        borderColor: [
          'rgb(59, 130, 246)',
          'rgb(34, 197, 94)',
          'rgb(251, 191, 36)',
          'rgb(168, 85, 247)',
        ],
        borderWidth: 2
      }
    ]
  };

  const expenseBreakdownData = {
    labels: Object.keys(financialData.breakdown.expenses),
    datasets: [
      {
        label: 'Expense Breakdown',
        data: Object.values(financialData.breakdown.expenses),
        backgroundColor: [
          'rgba(239, 68, 68, 0.8)',
          'rgba(59, 130, 246, 0.8)',
          'rgba(251, 191, 36, 0.8)',
          'rgba(168, 85, 247, 0.8)',
          'rgba(16, 185, 129, 0.8)',
          'rgba(107, 114, 128, 0.8)',
        ],
        borderColor: [
          'rgb(239, 68, 68)',
          'rgb(59, 130, 246)',
          'rgb(251, 191, 36)',
          'rgb(168, 85, 247)',
          'rgb(16, 185, 129)',
          'rgb(107, 114, 128)',
        ],
        borderWidth: 2
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: { font: { size: 12 } }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: { color: 'rgba(0, 0, 0, 0.05)' }
      },
      x: {
        grid: { color: 'rgba(0, 0, 0, 0.05)' }
      }
    }
  };

  const pieChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: { font: { size: 12 } }
      }
    }
  };

  return (
    <div className="space-y-8">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 bg-green-50 rounded-lg">
              <FaDollarSign className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(financialData.summary.totalRevenue)}</p>
              <div className="flex items-center mt-1">
                {getTrendIcon('up')}
                <span className={`text-sm font-medium ${getTrendColor('up')} ml-1`}>+12.5%</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 bg-red-50 rounded-lg">
              <FaCalculator className="w-6 h-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Expenses</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(financialData.summary.totalExpenses)}</p>
              <div className="flex items-center mt-1">
                {getTrendIcon('up')}
                <span className={`text-sm font-medium ${getTrendColor('up')} ml-1`}>+8.2%</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 bg-blue-50 rounded-lg">
                              <FaArrowUp className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Net Profit</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(financialData.summary.netProfit)}</p>
              <div className="flex items-center mt-1">
                {getTrendIcon('up')}
                <span className={`text-sm font-medium ${getTrendColor('up')} ml-1`}>+18.7%</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 bg-purple-50 rounded-lg">
              <FaChartLine className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Profit Margin</p>
              <p className="text-2xl font-bold text-gray-900">{formatPercentage(financialData.summary.profitMargin)}</p>
              <div className="flex items-center mt-1">
                {getTrendIcon('up')}
                <span className={`text-sm font-medium ${getTrendColor('up')} ml-1`}>+2.1%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Additional Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-center">
            <p className="text-sm font-medium text-gray-500">Revenue per Load</p>
            <p className="text-2xl font-bold text-gray-900">{formatCurrency(financialData.summary.averageRevenuePerLoad)}</p>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-center">
            <p className="text-sm font-medium text-gray-500">Cost per Load</p>
            <p className="text-2xl font-bold text-gray-900">{formatCurrency(financialData.summary.averageCostPerLoad)}</p>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-center">
            <p className="text-sm font-medium text-gray-500">Active Contracts</p>
            <p className="text-2xl font-bold text-gray-900">{financialData.summary.activeContracts}</p>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Revenue vs Expenses */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Revenue vs Expenses</h3>
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="text-sm border border-gray-300 rounded px-2 py-1"
            >
              <option value="7d">7 Days</option>
              <option value="30d">30 Days</option>
              <option value="90d">90 Days</option>
              <option value="1y">1 Year</option>
            </select>
          </div>
          <div className="h-64">
            <Line data={revenueChartData} options={chartOptions} />
          </div>
        </div>

        {/* Profit Trend */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Profit Trend</h3>
          <div className="h-64">
            <Line data={profitChartData} options={chartOptions} />
          </div>
        </div>
      </div>

      {/* Breakdown Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Revenue Breakdown */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue Breakdown</h3>
          <div className="h-64">
            <Doughnut data={revenueBreakdownData} options={pieChartOptions} />
          </div>
        </div>

        {/* Expense Breakdown */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Expense Breakdown</h3>
          <div className="h-64">
            <Doughnut data={expenseBreakdownData} options={pieChartOptions} />
          </div>
        </div>
      </div>

      {/* Financial Summary Table */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Financial Summary</h3>
            <div className="flex space-x-2">
              <button className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors flex items-center">
                <FaFilter className="w-4 h-4 mr-2" />
                Filter
              </button>
              <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center">
                <FaDownload className="w-4 h-4 mr-2" />
                Export
              </button>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Percentage</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trend</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {Object.entries(financialData.breakdown.revenue).map(([category, amount]) => (
                <tr key={category} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{category}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatCurrency(amount)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatPercentage((amount / financialData.summary.totalRevenue) * 100)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {getTrendIcon('up')}
                      <span className="text-sm text-green-600 ml-1">+5.2%</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button className="text-blue-600 hover:text-blue-900">
                      <FaEye className="w-4 h-4" />
                    </button>
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

export default FinancialMetrics;
