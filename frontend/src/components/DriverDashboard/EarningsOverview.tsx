import React, { useState, useMemo } from 'react';
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
  Filter,
  ArrowUpRight,
  ArrowDownRight,
  Target,
  Zap
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { driverApi } from '../../services/driverApi';
import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

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

  // Calculate trends (comparing with previous period)
  const previousPeriodTotal = useMemo(() => {
    // Mock previous period data - in real app, fetch previous period
    return totalEarnings * 0.88; // Simulate 12% increase
  }, [totalEarnings]);

  const earningsTrend = useMemo(() => {
    if (previousPeriodTotal === 0) return 0;
    return ((totalEarnings - previousPeriodTotal) / previousPeriodTotal) * 100;
  }, [totalEarnings, previousPeriodTotal]);

  // Chart data for earnings trend
  const earningsChartData = useMemo(() => {
    const labels = currentData.map(item => item.period);
    const earningsData = currentData.map(item => item.netEarnings);
    const bonusesData = currentData.map(item => item.bonuses);
    
    return {
      labels,
      datasets: [
        {
          label: 'Net Earnings',
          data: earningsData,
          borderColor: 'rgb(34, 197, 94)',
          backgroundColor: 'rgba(34, 197, 94, 0.1)',
          borderWidth: 3,
          fill: true,
          tension: 0.4,
          pointBackgroundColor: 'rgb(34, 197, 94)',
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          pointRadius: 5,
          pointHoverRadius: 7,
        },
        {
          label: 'Bonuses',
          data: bonusesData,
          borderColor: 'rgb(59, 130, 246)',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          borderWidth: 2,
          fill: true,
          tension: 0.4,
          pointBackgroundColor: 'rgb(59, 130, 246)',
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          pointRadius: 4,
        },
      ],
    };
  }, [currentData]);

  // Bar chart data for breakdown
  const breakdownChartData = useMemo(() => {
    const labels = currentData.map(item => item.period);
    const baseData = currentData.map(item => item.earnings);
    const bonusesData = currentData.map(item => item.bonuses);
    const deductionsData = currentData.map(item => -item.deductions);
    
    return {
      labels,
      datasets: [
        {
          label: 'Base Earnings',
          data: baseData,
          backgroundColor: 'rgba(34, 197, 94, 0.8)',
          borderRadius: 6,
        },
        {
          label: 'Bonuses',
          data: bonusesData,
          backgroundColor: 'rgba(59, 130, 246, 0.8)',
          borderRadius: 6,
        },
        {
          label: 'Deductions',
          data: deductionsData,
          backgroundColor: 'rgba(239, 68, 68, 0.8)',
          borderRadius: 6,
        },
      ],
    };
  }, [currentData]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          usePointStyle: true,
          padding: 15,
          font: { size: 12, weight: '600' as const },
        },
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: 'white',
        bodyColor: 'white',
        borderColor: 'rgba(255, 255, 255, 0.2)',
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: true,
        padding: 12,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
        },
        ticks: {
          callback: function(value: any) {
            return formatCurrency(value);
          },
          font: { size: 11 },
        },
      },
      x: {
        grid: {
          display: false,
        },
        ticks: {
          font: { size: 11 },
        },
      },
    },
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Earnings & Performance</h2>
          <p className="text-sm text-gray-600 mt-1">Track your earnings, bonuses, and performance metrics</p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2 bg-white border border-gray-200 rounded-lg px-3 py-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value as any)}
              className="border-0 focus:outline-none focus:ring-0 text-sm font-medium text-gray-700 bg-transparent cursor-pointer"
            >
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="quarter">This Quarter</option>
              <option value="year">This Year</option>
            </select>
          </div>
          <button className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-4 py-2 rounded-lg font-medium flex items-center space-x-2 shadow-lg shadow-blue-500/25 transition-all">
            <Download className="w-4 h-4" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl shadow-lg border border-green-100 p-6 hover:shadow-xl transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl shadow-lg">
              <DollarSign className="w-6 h-6 text-white" />
            </div>
            <div className="flex items-center space-x-1 bg-green-100 px-2 py-1 rounded-full">
              {earningsTrend >= 0 ? (
                <ArrowUpRight className="w-4 h-4 text-green-600" />
              ) : (
                <ArrowDownRight className="w-4 h-4 text-red-600" />
              )}
              <span className={`text-xs font-bold ${earningsTrend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {Math.abs(earningsTrend).toFixed(1)}%
              </span>
            </div>
          </div>
          <div className="mb-2">
            <p className="text-3xl font-bold text-gray-900">{formatCurrency(totalEarnings)}</p>
            <p className="text-sm font-semibold text-gray-700 mt-1">Total Earnings</p>
          </div>
          <p className="text-xs text-gray-500 font-medium">{getPeriodLabel(period)}</p>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl shadow-lg border border-blue-100 p-6 hover:shadow-xl transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl shadow-lg">
              <MapPin className="w-6 h-6 text-white" />
            </div>
            <div className="flex items-center space-x-1 bg-blue-100 px-2 py-1 rounded-full">
              <TrendingUp className="w-4 h-4 text-blue-600" />
              <span className="text-xs font-bold text-blue-600">+{totalTrips}</span>
            </div>
          </div>
          <div className="mb-2">
            <p className="text-3xl font-bold text-gray-900">{totalTrips}</p>
            <p className="text-sm font-semibold text-gray-700 mt-1">Total Trips</p>
          </div>
          <p className="text-xs text-gray-500 font-medium">{getPeriodLabel(period)}</p>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-violet-50 rounded-xl shadow-lg border border-purple-100 p-6 hover:shadow-xl transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-gradient-to-br from-purple-500 to-violet-600 rounded-xl shadow-lg">
              <Clock className="w-6 h-6 text-white" />
            </div>
            <div className="flex items-center space-x-1 bg-purple-100 px-2 py-1 rounded-full">
              <Zap className="w-4 h-4 text-purple-600" />
              <span className="text-xs font-bold text-purple-600">{formatHours(totalHours)}</span>
            </div>
          </div>
          <div className="mb-2">
            <p className="text-3xl font-bold text-gray-900">{formatHours(totalHours)}</p>
            <p className="text-sm font-semibold text-gray-700 mt-1">Total Hours</p>
          </div>
          <p className="text-xs text-gray-500 font-medium">{getPeriodLabel(period)}</p>
        </div>

        <div className="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-xl shadow-lg border border-amber-100 p-6 hover:shadow-xl transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-gradient-to-br from-amber-500 to-yellow-600 rounded-xl shadow-lg">
              <Target className="w-6 h-6 text-white" />
            </div>
            <div className="flex items-center space-x-1 bg-amber-100 px-2 py-1 rounded-full">
              <Award className="w-4 h-4 text-amber-600" />
              <span className="text-xs font-bold text-amber-600">Avg</span>
            </div>
          </div>
          <div className="mb-2">
            <p className="text-3xl font-bold text-gray-900">{formatCurrency(averagePerTrip)}</p>
            <p className="text-sm font-semibold text-gray-700 mt-1">Avg. Per Trip</p>
          </div>
          <p className="text-xs text-gray-500 font-medium">{getPeriodLabel(period)}</p>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Earnings Trend Chart */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-bold text-gray-900">Earnings Trend</h3>
              <p className="text-xs text-gray-500 mt-1">Net earnings and bonuses over time</p>
            </div>
            <div className="p-2 bg-green-100 rounded-lg">
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
          </div>
          <div className="h-64">
            <Line data={earningsChartData} options={chartOptions} />
          </div>
        </div>

        {/* Earnings Breakdown Chart */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-bold text-gray-900">Earnings Breakdown</h3>
              <p className="text-xs text-gray-500 mt-1">Base, bonuses, and deductions by period</p>
            </div>
            <div className="p-2 bg-blue-100 rounded-lg">
              <BarChart3 className="w-5 h-5 text-blue-600" />
            </div>
          </div>
          <div className="h-64">
            <Bar data={breakdownChartData} options={chartOptions} />
          </div>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-300">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
            <DollarSign className="w-5 h-5 mr-2 text-green-600" />
            Earnings Summary
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium text-gray-700">Base Earnings</span>
              <span className="text-sm font-bold text-gray-900">{formatCurrency(currentData.reduce((sum, item) => sum + item.earnings, 0))}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-100">
              <span className="text-sm font-medium text-gray-700">Bonuses</span>
              <span className="text-sm font-bold text-green-600">+{formatCurrency(currentData.reduce((sum, item) => sum + item.bonuses, 0))}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-100">
              <span className="text-sm font-medium text-gray-700">Deductions</span>
              <span className="text-sm font-bold text-red-600">-{formatCurrency(currentData.reduce((sum, item) => sum + item.deductions, 0))}</span>
            </div>
            <div className="mt-4 pt-4 border-t-2 border-gray-200">
              <div className="flex items-center justify-between">
                <span className="text-base font-bold text-gray-900">Net Earnings</span>
                <span className="text-2xl font-bold text-gray-900">{formatCurrency(totalEarnings)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-300">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
            <Zap className="w-5 h-5 mr-2 text-purple-600" />
            Efficiency Metrics
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg border border-purple-100">
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-purple-600" />
                <span className="text-sm font-medium text-gray-700">Per Hour</span>
              </div>
              <span className="text-sm font-bold text-gray-900">{formatCurrency(averagePerHour)}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-100">
              <div className="flex items-center space-x-2">
                <MapPin className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-gray-700">Per Kilometer</span>
              </div>
              <span className="text-sm font-bold text-gray-900">{formatCurrency(averagePerKm)}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-amber-50 rounded-lg border border-amber-100">
              <div className="flex items-center space-x-2">
                <Award className="w-4 h-4 text-amber-600" />
                <span className="text-sm font-medium text-gray-700">Per Trip</span>
              </div>
              <span className="text-sm font-bold text-gray-900">{formatCurrency(averagePerTrip)}</span>
            </div>
            <div className="mt-4 pt-4 border-t-2 border-gray-200">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">Total Distance</span>
                <span className="text-lg font-bold text-gray-900">{formatDistance(totalDistance)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-300">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
            <TrendingUp className="w-5 h-5 mr-2 text-blue-600" />
            Performance Trends
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-100">
              <span className="text-sm font-medium text-gray-700">Earnings Trend</span>
              <span className="text-sm font-bold text-green-600 flex items-center">
                {earningsTrend >= 0 ? (
                  <ArrowUpRight className="w-4 h-4 mr-1" />
                ) : (
                  <ArrowDownRight className="w-4 h-4 mr-1" />
                )}
                {earningsTrend >= 0 ? '+' : ''}{earningsTrend.toFixed(1)}%
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-100">
              <span className="text-sm font-medium text-gray-700">Trips Trend</span>
              <span className="text-sm font-bold text-blue-600 flex items-center">
                <TrendingUp className="w-4 h-4 mr-1" />
                +8.2%
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg border border-purple-100">
              <span className="text-sm font-medium text-gray-700">Efficiency Trend</span>
              <span className="text-sm font-bold text-purple-600 flex items-center">
                <TrendingUp className="w-4 h-4 mr-1" />
                +5.7%
              </span>
            </div>
            <div className="mt-4 pt-4 border-t-2 border-gray-200">
              <button
                onClick={() => setShowDetails(!showDetails)}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-4 py-2 rounded-lg font-medium transition-all shadow-md shadow-blue-500/25"
              >
                {showDetails ? 'Hide' : 'Show'} Detailed Analysis
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Earnings Table */}
      {showDetails && (
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Detailed Earnings Breakdown</h3>
                <p className="text-xs text-gray-500 mt-1">Complete period-by-period analysis</p>
              </div>
              <button
                onClick={() => setShowDetails(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <span className="sr-only">Close</span>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Period</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Trips</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Distance</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Hours</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Base</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Bonuses</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Deductions</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Net</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {currentData.map((item, index) => (
                  <tr key={index} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-semibold text-gray-900">{item.period}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-700">{item.trips}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-700">{formatDistance(item.distance)}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-700">{formatHours(item.hours)}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-gray-900">{formatCurrency(item.earnings)}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-semibold text-green-600">+{formatCurrency(item.bonuses)}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-semibold text-red-600">-{formatCurrency(item.deductions)}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-bold text-gray-900">{formatCurrency(item.netEarnings)}</span>
                    </td>
                  </tr>
                ))}
                <tr className="bg-gray-50 font-bold">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">Total</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{totalTrips}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatDistance(totalDistance)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatHours(totalHours)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatCurrency(currentData.reduce((sum, item) => sum + item.earnings, 0))}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">+{formatCurrency(currentData.reduce((sum, item) => sum + item.bonuses, 0))}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">-{formatCurrency(currentData.reduce((sum, item) => sum + item.deductions, 0))}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-lg text-gray-900">{formatCurrency(totalEarnings)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="bg-gradient-to-br from-gray-50 to-white rounded-xl shadow-lg border border-gray-100 p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-6">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-6 py-4 rounded-xl font-semibold flex items-center justify-center space-x-2 shadow-lg shadow-blue-500/25 transition-all transform hover:scale-105">
            <BarChart3 className="w-5 h-5" />
            <span>View Detailed Reports</span>
          </button>
          <button className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-6 py-4 rounded-xl font-semibold flex items-center justify-center space-x-2 shadow-lg shadow-blue-500/25 transition-all transform hover:scale-105">
            <Download className="w-5 h-5" />
            <span>Download Statement</span>
          </button>
          <button className="bg-gradient-to-r from-blue-400 to-blue-500 hover:from-blue-500 hover:to-blue-600 text-white px-6 py-4 rounded-xl font-semibold flex items-center justify-center space-x-2 shadow-lg shadow-blue-500/25 transition-all transform hover:scale-105">
            <Calendar className="w-5 h-5" />
            <span>Schedule Payment</span>
          </button>
        </div>
      </div>
    </div>
  );
};
