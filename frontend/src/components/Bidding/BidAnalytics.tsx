import React, { useState, useEffect } from 'react';
import { FaChartLine, FaDollarSign, FaPercentage, FaClock } from 'react-icons/fa';

interface BidAnalyticsProps {
  userRole: 'CARGO_OWNER' | 'TRUCK_OWNER';
}

const BidAnalytics: React.FC<BidAnalyticsProps> = ({ userRole }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analytics, setAnalytics] = useState({
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        <p className="mt-3 text-gray-600">Loading analytics...</p>
      </div>
    );
  }

  return (
    <div className="bid-analytics">
      <div className="mb-6">
        <h4 className="text-xl font-semibold text-gray-900 mb-2">
          <FaChartLine className="inline mr-2 text-blue-500" />
          Bidding Analytics
        </h4>
        <p className="text-gray-600">
          {userRole === 'CARGO_OWNER' 
            ? 'Track your auction performance and bid statistics'
            : 'Monitor your bidding success and market insights'
          }
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">{error}</h3>
            </div>
          </div>
        </div>
      )}

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <FaDollarSign className="h-8 w-8 text-green-500" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Bids</p>
              <p className="text-2xl font-semibold text-gray-900">{analytics.totalBids}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <FaPercentage className="h-8 w-8 text-blue-500" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Success Rate</p>
              <p className="text-2xl font-semibold text-gray-900">{analytics.successRate}%</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <FaDollarSign className="h-8 w-8 text-yellow-500" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Avg Bid Amount</p>
              <p className="text-2xl font-semibold text-gray-900">{formatCurrency(analytics.averageBidAmount)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <FaClock className="h-8 w-8 text-purple-500" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Avg Response Time</p>
              <p className="text-2xl font-semibold text-gray-900">{formatTime(analytics.averageResponseTime)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Performance Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h5 className="text-lg font-medium text-gray-900 mb-4">Performance Summary</h5>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Successful Bids</span>
              <span className="text-sm font-medium text-gray-900">{analytics.successfulBids}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Total Value</span>
              <span className="text-sm font-medium text-gray-900">{formatCurrency(analytics.totalValue)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Success Rate</span>
              <span className="text-sm font-medium text-gray-900">{analytics.successRate}%</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h5 className="text-lg font-medium text-gray-900 mb-4">Market Insights</h5>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Average Bid Amount</span>
              <span className="text-sm font-medium text-gray-900">{formatCurrency(analytics.averageBidAmount)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Response Time</span>
              <span className="text-sm font-medium text-gray-900">{formatTime(analytics.averageResponseTime)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Market Activity</span>
              <span className="text-sm font-medium text-green-600">High</span>
            </div>
          </div>
        </div>
      </div>

      {/* Top Performing Loads */}
      {analytics.topPerformingLoads && analytics.topPerformingLoads.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h5 className="text-lg font-medium text-gray-900 mb-4">Top Performing Loads</h5>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Load Title
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Bids
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Final Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {analytics.topPerformingLoads.map((load: any, index: number) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {load.title}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {load.totalBids}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(load.finalPrice)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        load.status === 'COMPLETED' 
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
        </div>
      )}

      {/* Bid Trends Chart Placeholder */}
      <div className="bg-white rounded-lg shadow p-6">
        <h5 className="text-lg font-medium text-gray-900 mb-4">Bid Trends</h5>
        <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
          <div className="text-center">
            <FaChartLine className="h-12 w-12 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-500">Chart visualization coming soon</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BidAnalytics; 