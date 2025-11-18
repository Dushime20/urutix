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
      <span className="ml-3 text-gray-600">Loading dashboard data...</span>
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
            Dashboard Error
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
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Required</h2>
          <p className="text-gray-600">Please log in to access the lender dashboard.</p>
        </div>
      </div>
    );
  }

  if (!lenderId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Lender Access Required</h2>
          <p className="text-gray-600">Your account doesn't have lender permissions.</p>
          <p className="text-sm text-gray-500 mt-2">Current role: {user?.role}</p>
        </div>
      </div>
    );
  }

  const monthlyLoansData: ChartData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        label: 'Loans Disbursed',
        data: [12, 19, 15, 25, 22, 30],
        borderColor: '#2196f3',
        backgroundColor: 'rgba(33, 150, 243, 0.1)',
        tension: 0.4,
      },
    ],
  };

  const loanStatusData: ChartData = {
    labels: ['Active', 'Completed', 'Defaulted'],
    datasets: [
      {
        label: 'Loan Status',
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
          font: {
            size: 12,
            family: 'Inter, system-ui, sans-serif'
          }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: 'white',
        bodyColor: 'white',
        borderColor: 'rgba(255, 255, 255, 0.2)',
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: true
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)'
        }
      },
      x: {
        grid: {
          color: 'rgba(0, 0, 0, 0.05)'
        }
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Lender Dashboard</h1>
              <p className="mt-1 text-sm text-gray-500">
                Welcome back, {user?.firstName} {user?.lastName}
              </p>
            </div>
            <div className="flex items-center space-x-3">
              {loading && (
                <span className="text-sm text-gray-500 flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                  Updating...
                </span>
              )}
              <div className="text-sm text-gray-500">
                Last updated: {new Date().toLocaleDateString()}
              </div>
            </div>
          </div>
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
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-all duration-300">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600 mb-1">Total Loans</p>
              <p className="text-3xl font-bold text-gray-800 mb-2">{stats.totalLoans}</p>
              <div className="flex items-center space-x-2">
                <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 17l9.2-9.2M17 17V7M17 17H7" />
                </svg>
                <span className="text-sm font-semibold text-green-600">+12%</span>
                <span className="text-sm text-gray-500">vs last month</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">Active lending portfolio</p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center ml-4 shadow-lg">
              <svg className="text-white text-xl w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-all duration-300">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600 mb-1">Total Amount</p>
              <p className="text-3xl font-bold text-gray-800 mb-2">RWF {stats.totalAmount.toLocaleString()}</p>
              <div className="flex items-center space-x-2">
                <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 17l9.2-9.2M17 17V7M17 17H7" />
                </svg>
                <span className="text-sm font-semibold text-green-600">+8.5%</span>
                <span className="text-sm text-gray-500">vs last month</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">Total disbursed capital</p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-success-500 to-success-600 rounded-xl flex items-center justify-center ml-4 shadow-lg">
              <svg className="text-white text-xl w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-all duration-300">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600 mb-1">Pending Requests</p>
              <p className="text-3xl font-bold text-gray-800 mb-2">{stats.pendingRequests}</p>
              <div className="flex items-center space-x-2">
                <svg className="w-4 h-4 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                </svg>
                <span className="text-sm font-semibold text-yellow-600">+3</span>
                <span className="text-sm text-gray-500">new today</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">Awaiting review</p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-warning-500 to-warning-600 rounded-xl flex items-center justify-center ml-4 shadow-lg">
              <svg className="text-white text-xl w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-all duration-300">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600 mb-1">Active Loans</p>
              <p className="text-3xl font-bold text-gray-800 mb-2">{stats.activeLoans}</p>
              <div className="flex items-center space-x-2">
                <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 17l9.2-9.2M17 17V7M17 17H7" />
                </svg>
                <span className="text-sm font-semibold text-green-600">+5</span>
                <span className="text-sm text-gray-500">this week</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">Currently disbursed</p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-secondary-500 to-secondary-600 rounded-xl flex items-center justify-center ml-4 shadow-lg">
              <svg className="text-white text-xl w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-all duration-300">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600 mb-1">Default Rate</p>
              <p className="text-3xl font-bold text-gray-800 mb-2">{stats.defaultRate}%</p>
              <div className="flex items-center space-x-2">
                <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
                <span className="text-sm font-semibold text-green-600">-0.2%</span>
                <span className="text-sm text-gray-500">vs last month</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">Risk management</p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-error-500 to-error-600 rounded-xl flex items-center justify-center ml-4 shadow-lg">
              <svg className="text-white text-xl w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 15.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-all duration-300">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600 mb-1">Average Amount</p>
              <p className="text-3xl font-bold text-gray-800 mb-2">RWF {stats.averageAmount.toLocaleString()}</p>
              <div className="flex items-center space-x-2">
                <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 17l9.2-9.2M17 17V7M17 17H7" />
                </svg>
                <span className="text-sm font-semibold text-green-600">+2.3%</span>
                <span className="text-sm text-gray-500">vs last month</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">Per loan amount</p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center ml-4 shadow-lg">
              <svg className="text-white text-xl w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Monthly Loan Disbursements</h3>
          <Line data={monthlyLoansData} options={chartOptions} />
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Loan Status Distribution</h3>
          <div className="h-64">
            <Doughnut data={loanStatusData} options={chartOptions} />
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="mt-8">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800">Recent Loan Requests</h3>
          </div>
          <div className="p-6">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Borrower
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Purpose
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">John Doe</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">RWF 15,000,000</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">Equipment Purchase</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-warning-100 text-warning-800">
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
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-success-100 text-success-800">
                        Approved
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">2024-01-14</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">Mike Johnson</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">RWF 8,000,000</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">Inventory</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-secondary-100 text-secondary-800">
                        Under Review
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">2024-01-13</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
        </>
        )}
      </div>
    </div>
  );
};

export default LenderDashboard;
