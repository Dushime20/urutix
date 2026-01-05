import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { brokerAPI, type BrokerStatistics } from '../../services/brokerApi';
import { 
  TrendingUp, 
  DollarSign, 
  Package, 
  BarChart3,
  Calendar,
  Loader2,
  ArrowUp,
  ArrowDown
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
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

const BrokerAnalytics: React.FC = () => {
  const { user } = useAuth();
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

  // Mock data for charts - replace with real API data
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
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
            <p className="text-gray-600 mt-1">
              Track your performance, commissions, and business metrics
            </p>
          </div>
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as any)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="1y">Last year</option>
          </select>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-primary-600">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Commissions</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">
                ${(statistics?.totalCommissions ?? 0).toLocaleString()}
              </p>
              <div className="flex items-center mt-2 text-sm text-green-600">
                <ArrowUp className="w-4 h-4 mr-1" />
                <span>12% vs last period</span>
              </div>
            </div>
            <DollarSign className="w-8 h-8 text-primary-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-green-600">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Earned</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">
                ${(statistics?.totalEarned ?? 0).toLocaleString()}
              </p>
              <div className="flex items-center mt-2 text-sm text-green-600">
                <ArrowUp className="w-4 h-4 mr-1" />
                <span>8% vs last period</span>
              </div>
            </div>
            <TrendingUp className="w-8 h-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-blue-600">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Loads</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">
                {statistics?.totalLoads || 0}
              </p>
              <div className="flex items-center mt-2 text-sm text-gray-600">
                <span>Currently active</span>
              </div>
            </div>
            <Package className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-yellow-600">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Avg Commission Rate</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">
                {(statistics?.averageCommissionRate ?? 0).toFixed(1)}%
              </p>
              <div className="flex items-center mt-2 text-sm text-gray-600">
                <span>Industry avg: 5.0%</span>
              </div>
            </div>
            <BarChart3 className="w-8 h-8 text-yellow-600" />
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Commission Trend */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Commission Trend</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={commissionData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="amount" 
                stroke="#3b82f6" 
                name="Commission ($)"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Commission Status Distribution */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Commission Status</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={statusData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {statusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Load Volume */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Load Volume</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={commissionData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="count" fill="#10b981" name="Number of Loads" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Success Rate */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Deal Success Rate</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={performanceData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="success" 
                stroke="#10b981" 
                name="Success Rate (%)"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Performance Summary */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Performance Summary</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">Average Commission per Load</p>
            <p className="text-2xl font-bold text-gray-900 mt-2">
              ${((statistics?.totalCommissions || 0) / (statistics?.totalLoads || 1)).toFixed(2)}
            </p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">Pending Commission</p>
            <p className="text-2xl font-bold text-gray-900 mt-2">
              ${statistics?.totalPending.toLocaleString() || '0.00'}
            </p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">Approved Commission</p>
            <p className="text-2xl font-bold text-gray-900 mt-2">
              ${statistics?.totalApproved.toLocaleString() || '0.00'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BrokerAnalytics;

