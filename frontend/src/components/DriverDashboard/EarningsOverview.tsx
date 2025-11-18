import React, { useState } from 'react';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Calendar,
  Clock,
  MapPin,
  Award,
  BarChart3,
  Download,
  Filter
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { driverApi } from '../../services/driverApi';

interface EarningsOverviewProps {
  driverId: string;
}

interface EarningsData {
  period: string;
  trips: number;
  distance: number;
  hours: number;
  earnings: number;
  bonuses: number;
  deductions: number;
  netEarnings: number;
}

export const EarningsOverview: React.FC<EarningsOverviewProps> = ({ driverId }) => {
  const [period, setPeriod] = useState<'week' | 'month' | 'quarter' | 'year'>('month');
  const [showDetails, setShowDetails] = useState(false);

  const { data: earnings, isLoading } = useQuery({
    queryKey: ['driver-earnings', driverId, period],
    queryFn: () => driverApi.getEarnings(driverId, period),
    enabled: !!driverId,
  });

  const { data: tripHistory, isLoading: tripHistoryLoading } = useQuery({
    queryKey: ['driver-trip-history', driverId, period],
    queryFn: () => driverApi.getTripHistory(driverId, period),
    enabled: !!driverId,
  });

  // Mock data for demonstration
  const mockEarnings: EarningsData[] = [
    {
      period: 'Week 1',
      trips: 5,
      distance: 1200,
      hours: 45,
      earnings: 850,
      bonuses: 100,
      deductions: 50,
      netEarnings: 900
    },
    {
      period: 'Week 2',
      trips: 6,
      distance: 1400,
      hours: 52,
      earnings: 950,
      bonuses: 120,
      deductions: 30,
      netEarnings: 1040
    },
    {
      period: 'Week 3',
      trips: 4,
      distance: 1000,
      hours: 38,
      earnings: 750,
      bonuses: 80,
      deductions: 40,
      netEarnings: 790
    },
    {
      period: 'Week 4',
      trips: 7,
      distance: 1600,
      hours: 58,
      earnings: 1100,
      bonuses: 150,
      deductions: 60,
      netEarnings: 1190
    }
  ];

  const currentData = earnings || mockEarnings;
  const totalEarnings = currentData.reduce((sum, item) => sum + item.netEarnings, 0);
  const totalTrips = currentData.reduce((sum, item) => sum + item.trips, 0);
  const totalDistance = currentData.reduce((sum, item) => sum + item.distance, 0);
  const totalHours = currentData.reduce((sum, item) => sum + item.hours, 0);

  const averagePerTrip = totalTrips > 0 ? totalEarnings / totalTrips : 0;
  const averagePerHour = totalHours > 0 ? totalEarnings / totalHours : 0;
  const averagePerKm = totalDistance > 0 ? totalEarnings / totalDistance : 0;

  const getPeriodLabel = (period: string) => {
    switch (period) {
      case 'week': return 'This Week';
      case 'month': return 'This Month';
      case 'quarter': return 'This Quarter';
      case 'year': return 'This Year';
      default: return 'This Month';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDistance = (distance: number) => {
    return `${distance.toLocaleString()} km`;
  };

  const formatHours = (hours: number) => {
    return `${hours}h`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Earnings & Performance</h2>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value as any)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="quarter">This Quarter</option>
              <option value="year">This Year</option>
            </select>
          </div>
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium flex items-center space-x-2">
            <Download className="w-4 h-4" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-green-100 rounded-lg">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
            <TrendingUp className="w-5 h-5 text-green-500" />
          </div>
          <div className="mb-2">
            <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalEarnings)}</p>
            <p className="text-sm font-medium text-gray-600">Total Earnings</p>
          </div>
          <p className="text-xs text-gray-500">{getPeriodLabel(period)}</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-blue-100 rounded-lg">
              <MapPin className="w-6 h-6 text-blue-600" />
            </div>
            <TrendingUp className="w-5 h-5 text-blue-500" />
          </div>
          <div className="mb-2">
            <p className="text-2xl font-bold text-gray-900">{totalTrips}</p>
            <p className="text-sm font-medium text-gray-600">Total Trips</p>
          </div>
          <p className="text-xs text-gray-500">{getPeriodLabel(period)}</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Clock className="w-6 h-6 text-purple-600" />
            </div>
            <TrendingUp className="w-5 h-5 text-purple-500" />
          </div>
          <div className="mb-2">
            <p className="text-2xl font-bold text-gray-900">{formatHours(totalHours)}</p>
            <p className="text-sm font-medium text-gray-600">Total Hours</p>
          </div>
          <p className="text-xs text-gray-500">{getPeriodLabel(period)}</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Award className="w-6 h-6 text-yellow-600" />
            </div>
            <TrendingUp className="w-5 h-5 text-yellow-500" />
          </div>
          <div className="mb-2">
            <p className="text-2xl font-bold text-gray-900">{formatCurrency(averagePerTrip)}</p>
            <p className="text-sm font-medium text-gray-600">Avg. Per Trip</p>
          </div>
          <p className="text-xs text-gray-500">{getPeriodLabel(period)}</p>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Earnings Breakdown</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Base Earnings</span>
              <span className="text-sm font-medium text-gray-900">{formatCurrency(totalEarnings)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Bonuses</span>
              <span className="text-sm font-medium text-green-600">+{formatCurrency(currentData.reduce((sum, item) => sum + item.bonuses, 0))}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Deductions</span>
              <span className="text-sm font-medium text-red-600">-{formatCurrency(currentData.reduce((sum, item) => sum + item.deductions, 0))}</span>
            </div>
            <hr className="my-2" />
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-gray-900">Net Earnings</span>
              <span className="text-lg font-bold text-gray-900">{formatCurrency(totalEarnings)}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Efficiency Metrics</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Per Hour</span>
              <span className="text-sm font-medium text-gray-900">{formatCurrency(averagePerHour)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Per Kilometer</span>
              <span className="text-sm font-medium text-gray-900">{formatCurrency(averagePerKm)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Per Trip</span>
              <span className="text-sm font-medium text-gray-900">{formatCurrency(averagePerTrip)}</span>
            </div>
            <hr className="my-2" />
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Total Distance</span>
              <span className="text-sm font-medium text-gray-900">{formatDistance(totalDistance)}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Trends</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Earnings Trend</span>
              <span className="text-sm font-medium text-green-600 flex items-center">
                <TrendingUp className="w-4 h-4 mr-1" />
                +12.5%
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Trips Trend</span>
              <span className="text-sm font-medium text-green-600 flex items-center">
                <TrendingUp className="w-4 h-4 mr-1" />
                +8.2%
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Efficiency Trend</span>
              <span className="text-sm font-medium text-green-600 flex items-center">
                <TrendingUp className="w-4 h-4 mr-1" />
                +5.7%
              </span>
            </div>
            <hr className="my-2" />
            <div className="text-center">
              <button
                onClick={() => setShowDetails(!showDetails)}
                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                {showDetails ? 'Hide' : 'Show'} Detailed Analysis
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Earnings Table */}
      {showDetails && (
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Detailed Earnings Breakdown</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Period</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trips</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Distance</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hours</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Base</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bonuses</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Deductions</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Net</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {currentData.map((item, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.period}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.trips}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDistance(item.distance)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatHours(item.hours)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatCurrency(item.earnings)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">+{formatCurrency(item.bonuses)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">-{formatCurrency(item.deductions)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{formatCurrency(item.netEarnings)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg font-medium flex items-center justify-center space-x-2">
            <BarChart3 className="w-5 h-5" />
            <span>View Detailed Reports</span>
          </button>
          <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-lg font-medium flex items-center justify-center space-x-2">
            <Download className="w-5 h-5" />
            <span>Download Statement</span>
          </button>
          <button className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-3 rounded-lg font-medium flex items-center justify-center space-x-2">
            <Calendar className="w-5 h-5" />
            <span>Schedule Payment</span>
          </button>
        </div>
      </div>
    </div>
  );
};
