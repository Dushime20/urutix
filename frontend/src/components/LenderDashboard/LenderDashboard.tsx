import React, { useState, useEffect } from 'react';
import { Line, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { lendingApi } from '../../services/lending/lendingApi';
import { useAuth } from '../../contexts/AuthContext';
import { TranslatedText } from '../translated-text';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

interface DashboardStats {
  totalLoans: number;
  totalAmount: number;
  pendingRequests: number;
  activeLoans: number;
  defaultRate: number;
  averageAmount: number;
}

interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    borderColor?: string;
    backgroundColor?: string | string[];
    tension?: number;
  }[];
}

const LenderDashboard: React.FC = () => {
  const { user, accessToken } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalLoans: 0,
    totalAmount: 0,
    pendingRequests: 0,
    activeLoans: 0,
    defaultRate: 0,
    averageAmount: 0,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get lender ID from user context - for lenders, use user.id directly
  // In production, you might have a lenderId property in user profile
  const lenderId = user?.role === 'LENDER' ? user.id : null;

  useEffect(() => {
    const loadDashboardData = async () => {
      if (!lenderId || !accessToken) {
        console.log('LenderDashboard: No lender ID or access token available');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        console.log('LenderDashboard: Loading data for lender:', lenderId);
        
        // Make parallel API calls for better performance
        const [dashboardData] = await Promise.all([
          lendingApi.getLenderDashboard(lenderId).catch(err => {
            console.warn('Dashboard API failed, using fallback:', err.message);
            return null;
          }),
          lendingApi.getLenderAnalytics(lenderId, '30d').catch(err => {
            console.warn('Analytics API failed, using fallback:', err.message);
            return null;
          })
        ]);

        if (dashboardData) {
          setStats({
            totalLoans: dashboardData.totalLoansIssued || 0,
            totalAmount: dashboardData.totalOutstandingPrincipal || 0,
            pendingRequests: 0, // Not directly available from dashboard API
            activeLoans: dashboardData.totalLoansIssued || 0, // Using total as approximation
            defaultRate: dashboardData.defaultRate || 0,
            averageAmount: dashboardData.averageLoanSize || 0,
          });
          console.log('LenderDashboard: Real data loaded successfully');
        } else {
          throw new Error('No dashboard data received');
        }
        
      } catch (error: any) {
        console.error('LenderDashboard: Error loading data:', error);
        setError(error.message || 'Failed to load dashboard data');
        
        // Graceful fallback to mock data
        console.log('LenderDashboard: Falling back to mock data');
        setStats({
          totalLoans: 156,
          totalAmount: 245000000,
          pendingRequests: 23,
          activeLoans: 89,
          defaultRate: 3.2,
          averageAmount: 1570500,
        });
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, [lenderId, accessToken]); // Depend on authentication state

  // Loading state component
  const LoadingSpinner = () => (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                  <span className="ml-3 text-gray-600">
                    <TranslatedText text="Loading dashboard data..." />
                  </span>
    </div>
  );

  // Error state component
  const ErrorMessage = ({ message }: { message: string }) => (
    <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
      <div className="flex">
        <div className="flex-shrink-0">
          <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="ml-3">
          <h3 className="text-sm font-medium text-red-800">
            <TranslatedText text="Dashboard Error" />
          </h3>
          <div className="mt-2 text-sm text-red-700">
            <p>{message}</p>
            <p className="mt-1 text-xs">Using fallback data for now. Please refresh or contact support if this persists.</p>
          </div>
        </div>
      </div>
    </div>
  );

  // Authentication check
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            <TranslatedText text="Access Required" />
          </h2>
          <p className="text-gray-600">
            <TranslatedText text="Please log in to access the lender dashboard." />
          </p>
        </div>
      </div>
    );
  }

  if (!lenderId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            <TranslatedText text="Lender Access Required" />
          </h2>
          <p className="text-gray-600">
            <TranslatedText text="Your account doesn't have lender permissions." />
          </p>
          <p className="text-sm text-gray-500 mt-2">Current role: {user?.role}</p>
        </div>
      </div>
    );
  }

  const monthlyLoansData: ChartData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        label: 'Loans Disbursed', // Will be translated in chart
        data: [12, 19, 15, 25, 22, 30],
        borderColor: '#2196f3',
        backgroundColor: 'rgba(33, 150, 243, 0.1)',
        tension: 0.4,
      },
    ],
  };

  const loanStatusData: ChartData = {
    labels: ['Active', 'Completed', 'Defaulted'], // Will be translated
    datasets: [
      {
        label: 'Loan Status', // Will be translated
        data: [89, 54, 13],
        backgroundColor: [
          '#22c55e',
          '#2196f3',
          '#ef4444',
        ]
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          usePointStyle: true,
          padding: 20,
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="flex items-center justify-between px-6 py-4">
          {/* Search Bar */}
          <div className="flex items-center flex-1 max-w-md">
            <div className="relative w-full">
              <input
                type="text"
                placeholder="Search loans, borrowers..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy-500 focus:border-transparent"
              />
              <svg className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          {/* Right Side Icons */}
          <div className="flex items-center gap-4">
            {loading && (
              <span className="text-sm text-gray-500 flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                <TranslatedText text="Updating..." />
              </span>
            )}
            <button className="p-2 hover:bg-gray-100 rounded-lg relative">
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
            <button className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded-lg">
              <div className="w-8 h-8 bg-navy-600 rounded-full flex items-center justify-center text-white font-semibold">
                {user?.firstName?.charAt(0) || 'L'}
              </div>
            </button>
          </div>
        </div>

        {/* Menu Tabs */}
        <div className="flex items-center gap-8 px-6">
          <button className="pb-3 border-b-2 border-navy-600 text-navy-600 font-medium">
            <TranslatedText text="Overview" />
          </button>
          <button className="pb-3 border-b-2 border-transparent text-gray-600 hover:text-gray-900">
            <TranslatedText text="Loans" />
          </button>
          <button className="pb-3 border-b-2 border-transparent text-gray-600 hover:text-gray-900">
            <TranslatedText text="Requests" />
          </button>
          <button className="pb-3 border-b-2 border-transparent text-gray-600 hover:text-gray-900">
            <TranslatedText text="Analytics" />
          </button>
          <button className="pb-3 border-b-2 border-transparent text-gray-600 hover:text-gray-900">
            <TranslatedText text="Reports" />
          </button>
          <button className="pb-3 border-b-2 border-transparent text-gray-600 hover:text-gray-900">
            <TranslatedText text="Help" />
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error Message */}
        {error && <ErrorMessage message={error} />}

        {/* Loading State */}
        {loading && !stats.totalLoans ? (
          <LoadingSpinner />
        ) : (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {/* Total Loans Card */}
              <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-all duration-300">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600 mb-1">
                      <TranslatedText text="Total Loans" />
                    </p>
                    <p className="text-3xl font-bold text-gray-800 mb-2">{stats.totalLoans}</p>
                    <div className="flex items-center space-x-2">
                      <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 17l9.2-9.2M17 17V7M17 17H7" />
                      </svg>
                      <span className="text-sm font-semibold text-green-600">+12%</span>
                      <span className="text-sm text-gray-500">
                        <TranslatedText text="vs last month" />
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      <TranslatedText text="Active lending portfolio" />
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center ml-4 shadow-lg">
                    <svg className="text-white text-xl w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Total Amount Card */}
              <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-all duration-300">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600 mb-1">
                      <TranslatedText text="Total Amount" />
                    </p>
                    <p className="text-3xl font-bold text-gray-800 mb-2">RWF {stats.totalAmount.toLocaleString()}</p>
                    <div className="flex items-center space-x-2">
                      <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 17l9.2-9.2M17 17V7M17 17H7" />
                      </svg>
                      <span className="text-sm font-semibold text-green-600">+8.5%</span>
                      <span className="text-sm text-gray-500">
                        <TranslatedText text="vs last month" />
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      <TranslatedText text="Total disbursed capital" />
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center ml-4 shadow-lg">
                    <svg className="text-white text-xl w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Active Loans Card */}
              <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-all duration-300">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600 mb-1">
                      <TranslatedText text="Active Loans" />
                    </p>
                    <p className="text-3xl font-bold text-gray-800 mb-2">{stats.activeLoans}</p>
                    <div className="flex items-center space-x-2">
                      <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 17l9.2-9.2M17 17V7M17 17H7" />
                      </svg>
                      <span className="text-sm font-semibold text-green-600">+5</span>
                      <span className="text-sm text-gray-500">
                        <TranslatedText text="this week" />
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      <TranslatedText text="Currently disbursed" />
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center ml-4 shadow-lg">
                    <svg className="text-white text-xl w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Default Rate Card */}
              <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-all duration-300">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600 mb-1">
                      <TranslatedText text="Default Rate" />
                    </p>
                    <p className="text-3xl font-bold text-gray-800 mb-2">{stats.defaultRate}%</p>
                    <div className="flex items-center space-x-2">
                      <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                      </svg>
                      <span className="text-sm font-semibold text-green-600">-0.2%</span>
                      <span className="text-sm text-gray-500">
                        <TranslatedText text="vs last month" />
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      <TranslatedText text="Risk management" />
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center ml-4 shadow-lg">
                    <svg className="text-white text-xl w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 15.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Average Amount Card */}
              <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-all duration-300">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600 mb-1">
                      <TranslatedText text="Average Amount" />
                    </p>
                    <p className="text-3xl font-bold text-gray-800 mb-2">RWF {stats.averageAmount.toLocaleString()}</p>
                    <div className="flex items-center space-x-2">
                      <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 17l9.2-9.2M17 17V7M17 17H7" />
                      </svg>
                      <span className="text-sm font-semibold text-green-600">+2.3%</span>
                      <span className="text-sm text-gray-500">
                        <TranslatedText text="vs last month" />
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      <TranslatedText text="Per loan amount" />
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center ml-4 shadow-lg">
                    <svg className="text-white text-xl w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Pending Requests Card */}
              <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-all duration-300">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600 mb-1">
                      <TranslatedText text="Pending Requests" />
                    </p>
                    <p className="text-3xl font-bold text-gray-800 mb-2">{stats.pendingRequests}</p>
                    <div className="flex items-center space-x-2">
                      <svg className="w-4 h-4 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                      </svg>
                      <span className="text-sm font-semibold text-yellow-600">+3</span>
                      <span className="text-sm text-gray-500">
                        <TranslatedText text="new today" />
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      <TranslatedText text="Awaiting approval" />
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl flex items-center justify-center ml-4 shadow-lg">
                    <svg className="text-white text-xl w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  <TranslatedText text="Monthly Loan Disbursements" />
                </h3>
                <div className="h-64">
                  <Line data={monthlyLoansData} options={chartOptions} />
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  <TranslatedText text="Loan Status Distribution" />
                </h3>
                <div className="h-64">
                  <Doughnut data={loanStatusData} options={chartOptions} />
                </div>
              </div>
            </div>

            {/* Recent Loan Requests Table */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-800">
                  <TranslatedText text="Recent Loan Requests" />
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  <TranslatedText text="Latest loan applications requiring your attention" />
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <TranslatedText text="Borrower" />
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <TranslatedText text="Amount" />
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <TranslatedText text="Purpose" />
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <TranslatedText text="Status" />
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <TranslatedText text="Date" />
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">John Doe</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">RWF 15,000,000</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">Equipment Purchase</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                          Pending
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">2024-01-15</td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">Jane Smith</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">RWF 25,000,000</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">Working Capital</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                          Approved
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">2024-01-14</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default LenderDashboard;
