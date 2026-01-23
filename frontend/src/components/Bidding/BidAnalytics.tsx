import React, { useState, useEffect } from 'react';
import { FaChartLine, FaDollarSign, FaPercentage, FaClock } from 'react-icons/fa';
import { formatCurrency } from '../../utils/formatNumber';

interface LoadPerformance {
  title: string;
  totalBids: number;
  finalPrice: number;
  status: string;
}

interface BidAnalyticsProps {
  userRole: 'CARGO_OWNER' | 'TRUCK_OWNER';
}

const BidAnalytics: React.FC<BidAnalyticsProps> = ({ userRole }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analytics, setAnalytics] = useState<{
    totalBids: number;
    successfulBids: number;
    averageBidAmount: number;
    totalValue: number;
    successRate: number;
    averageResponseTime: number;
    topPerformingLoads: LoadPerformance[];
    bidTrends: any[];
  }>({
    totalBids: 0,
    successfulBids: 0,
    averageBidAmount: 0,
    totalValue: 0,
    successRate: 0,
    averageResponseTime: 0,
    topPerformingLoads: [],
    bidTrends: [],
  });

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      // Load analytics data
      const response = await fetch('/api/bidding/analytics');
      const data = await response.json();

      // Ensure all required properties exist with fallbacks
      setAnalytics({
        totalBids: data.totalBids || 0,
        successfulBids: data.successfulBids || 0,
        averageBidAmount: data.averageBidAmount || 0,
        totalValue: data.totalValue || 0,
        successRate: data.successRate || 0,
        averageResponseTime: data.averageResponseTime || 0,
        topPerformingLoads: data.topPerformingLoads || [],
        bidTrends: data.bidTrends || [],
      });
    } catch (error) {
      setError('Failed to load analytics data - using demo data');
      console.error('Analytics error:', error);

      // Set demo data when API fails
      setAnalytics({
        totalBids: 25,
        successfulBids: 18,
        averageBidAmount: 1500,
        totalValue: 45000,
        successRate: 72,
        averageResponseTime: 45,
        topPerformingLoads: [
          {
            title: 'Electronics Shipment',
            totalBids: 8,
            finalPrice: 2200,
            status: 'COMPLETED'
          },
          {
            title: 'Furniture Delivery',
            totalBids: 6,
            finalPrice: 1800,
            status: 'COMPLETED'
          },
          {
            title: 'Automotive Parts',
            totalBids: 5,
            finalPrice: 1600,
            status: 'ACTIVE'
          }
        ],
        bidTrends: [],
      });
    } finally {
      setLoading(false);
    }
  };



  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  if (loading) {
    return (
      <div className="text-center py-8 sm:py-12">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        <p className="mt-3 text-xs sm:text-sm text-gray-600">Loading analytics...</p>
      </div>
    );
  }

  return (
    <div className="bid-analytics">
      <div className="mb-4 sm:mb-6">
        <h4 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 flex items-center gap-2">
          <FaChartLine className="text-gray-500 flex-shrink-0" />
          <span>Bidding Analytics</span>
        </h4>
        <p className="text-xs sm:text-sm text-gray-600">
          {userRole === 'CARGO_OWNER'
            ? 'Track your auction performance and bid statistics'
            : 'Monitor your bidding success and market insights'
          }
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6">
          <div className="flex items-start sm:items-center">
            <div className="flex-shrink-0 mt-0.5 sm:mt-0">
              <svg className="h-4 w-4 sm:h-5 sm:w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-2 flex-1 min-w-0">
              <h3 className="text-xs sm:text-sm font-medium text-red-800 break-words">{error}</h3>
            </div>
          </div>
        </div>
      )}

      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6 mb-4 sm:mb-6 md:mb-8">
        <div className="bg-white rounded-lg shadow p-3 sm:p-4 md:p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <FaDollarSign className="h-6 w-6 sm:h-8 sm:w-8 text-gray-500" />
            </div>
            <div className="ml-3 sm:ml-4 min-w-0 flex-1">
              <p className="text-xs sm:text-sm font-medium text-gray-500">Total Bids</p>
              <p className="text-xl sm:text-2xl font-semibold text-gray-900 truncate">{analytics.totalBids}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-3 sm:p-4 md:p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <FaPercentage className="h-6 w-6 sm:h-8 sm:w-8 text-gray-500" />
            </div>
            <div className="ml-3 sm:ml-4 min-w-0 flex-1">
              <p className="text-xs sm:text-sm font-medium text-gray-500">Success Rate</p>
              <p className="text-xl sm:text-2xl font-semibold text-gray-900 truncate">{analytics.successRate}%</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-3 sm:p-4 md:p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <FaDollarSign className="h-6 w-6 sm:h-8 sm:w-8 text-gray-500" />
            </div>
            <div className="ml-3 sm:ml-4 min-w-0 flex-1">
              <p className="text-xs sm:text-sm font-medium text-gray-500">Avg Bid Amount</p>
              <p className="text-xl sm:text-2xl font-semibold text-gray-900 truncate">{formatCurrency(analytics.averageBidAmount)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-3 sm:p-4 md:p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <FaClock className="h-6 w-6 sm:h-8 sm:w-8 text-gray-500" />
            </div>
            <div className="ml-3 sm:ml-4 min-w-0 flex-1">
              <p className="text-xs sm:text-sm font-medium text-gray-500">Avg Response Time</p>
              <p className="text-xl sm:text-2xl font-semibold text-gray-900 truncate">{formatTime(analytics.averageResponseTime)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Performance Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 md:gap-6 mb-4 sm:mb-6 md:mb-8">
        <div className="bg-white rounded-lg shadow p-3 sm:p-4 md:p-6">
          <h5 className="text-base sm:text-lg font-medium text-gray-900 mb-3 sm:mb-4">Performance Summary</h5>
          <div className="space-y-2 sm:space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-xs sm:text-sm text-gray-600 break-words">Successful Bids</span>
              <span className="text-xs sm:text-sm font-medium text-gray-900 flex-shrink-0 ml-2">{analytics.successfulBids}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs sm:text-sm text-gray-600 break-words">Total Value</span>
              <span className="text-xs sm:text-sm font-medium text-gray-900 flex-shrink-0 ml-2 whitespace-nowrap">{formatCurrency(analytics.totalValue)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs sm:text-sm text-gray-600 break-words">Success Rate</span>
              <span className="text-xs sm:text-sm font-medium text-gray-900 flex-shrink-0 ml-2">{analytics.successRate}%</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-3 sm:p-4 md:p-6">
          <h5 className="text-base sm:text-lg font-medium text-gray-900 mb-3 sm:mb-4">Market Insights</h5>
          <div className="space-y-2 sm:space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-xs sm:text-sm text-gray-600 break-words">Average Bid Amount</span>
              <span className="text-xs sm:text-sm font-medium text-gray-900 flex-shrink-0 ml-2 whitespace-nowrap">{formatCurrency(analytics.averageBidAmount)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs sm:text-sm text-gray-600 break-words">Response Time</span>
              <span className="text-xs sm:text-sm font-medium text-gray-900 flex-shrink-0 ml-2 whitespace-nowrap">{formatTime(analytics.averageResponseTime)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs sm:text-sm text-gray-600 break-words">Market Activity</span>
              <span className="text-xs sm:text-sm font-medium text-green-600 flex-shrink-0 ml-2">High</span>
            </div>
          </div>
        </div>
      </div>

      {/* Top Performing Loads */}
      {analytics.topPerformingLoads && analytics.topPerformingLoads.length > 0 && (
        <div className="bg-white rounded-lg shadow p-3 sm:p-4 md:p-6 mb-4 sm:mb-6 md:mb-8">
          <h5 className="text-base sm:text-lg font-medium text-gray-900 mb-3 sm:mb-4">Top Performing Loads</h5>
          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Load Title
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Bids
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Final Price
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {analytics.topPerformingLoads.map((load: any, index: number) => (
                  <tr key={index}>
                    <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900">
                      {load.title}
                    </td>
                    <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900">
                      {load.totalBids}
                    </td>
                    <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900">
                      {formatCurrency(load.finalPrice)}
                    </td>
                    <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${load.status === 'COMPLETED'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-yellow-100 text-yellow-800'
                        }`}>
                        {load.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Mobile Cards */}
          <div className="md:hidden space-y-3">
            {analytics.topPerformingLoads.map((load: any, index: number) => (
              <div key={index} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                <div className="text-sm font-medium text-gray-900 mb-2 break-words">{load.title}</div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-gray-500">Total Bids:</span>
                    <span className="ml-1 font-medium text-gray-900">{load.totalBids}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Final Price:</span>
                    <span className="ml-1 font-medium text-gray-900">{formatCurrency(load.finalPrice)}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-gray-500">Status:</span>
                    <span className={`ml-1 px-2 py-0.5 text-xs font-medium rounded-full ${load.status === 'COMPLETED'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-yellow-100 text-yellow-800'
                      }`}>
                      {load.status}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bid Trends Chart Placeholder */}
      <div className="bg-white rounded-lg shadow p-3 sm:p-4 md:p-6">
        <h5 className="text-base sm:text-lg font-medium text-gray-900 mb-3 sm:mb-4">Bid Trends</h5>
        <div className="h-48 sm:h-64 bg-gray-50 rounded-lg flex items-center justify-center">
          <div className="text-center px-4">
            <FaChartLine className="h-8 w-8 sm:h-12 sm:w-12 text-gray-400 mx-auto mb-2" />
            <p className="text-xs sm:text-sm text-gray-500">Chart visualization coming soon</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BidAnalytics; 