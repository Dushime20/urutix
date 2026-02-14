import React, { useState, useEffect } from 'react';
import {
  BarChart2,
  DollarSign,
  Clock,
  TrendingUp,
  Award,
  Activity,
  Truck
} from 'lucide-react';

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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins} m`;
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
    <div className="bid-analytics space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="bg-white rounded-3xl border border-gray-200 p-8 relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform">
          <TrendingUp size={160} className="text-gray-900" />
        </div>
        <div className="relative">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-gray-900 rounded-xl flex items-center justify-center shadow-lg">
              <BarChart2 className="text-white" size={20} />
            </div>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight italic uppercase">Bidding Analytics</h1>
          </div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest max-w-lg">
            {userRole === 'CARGO_OWNER'
              ? 'Comprehensive performance tracking for your auction ecosystem and bidder dynamics'
              : 'Quantum market insights and success intelligence for your strategic bidding operations'
            }
          </p>
        </div>
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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Total Bids', value: analytics.totalBids, icon: Activity, color: 'gray' },
          { label: 'Success Rate', value: `${analytics.successRate}% `, icon: Award, color: 'indigo' },
          { label: 'Avg Bid Amount', value: formatCurrency(analytics.averageBidAmount), icon: DollarSign, color: 'emerald' },
          { label: 'Avg Response', value: formatTime(analytics.averageResponseTime), icon: Clock, color: 'amber' }
        ].map((item, idx) => (
          <div key={idx} className="bg-white rounded-2xl border border-gray-200 p-6 hover:border-gray-900 transition-all duration-300 group relative overflow-hidden shadow-sm">
            <div className="relative flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 leading-none">{item.label}</p>
                <h5 className="text-2xl font-black text-gray-900 leading-none tracking-tight">{item.value}</h5>
              </div>
              <div className="w-12 h-12 bg-gray-900 rounded-xl flex items-center justify-center group-hover:bg-black transition-colors shadow-lg shadow-gray-200">
                <item.icon className="text-white" size={20} />
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-50 flex items-center gap-2">
              <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">Live Data Tracking</span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-3xl border border-gray-200 p-8 shadow-sm group">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center">
              <Award size={18} />
            </div>
            <h5 className="text-xs font-black text-gray-900 uppercase tracking-widest italic leading-none">Performance Summary</h5>
          </div>
          <div className="space-y-4">
            {[
              { label: 'Successful Bids', value: analytics.successfulBids, icon: Activity },
              { label: 'Total Value', value: formatCurrency(analytics.totalValue), icon: DollarSign },
              { label: 'Success Rate', value: `${analytics.successRate}% `, icon: Award }
            ].map((row, idx) => (
              <div key={idx} className="flex justify-between items-center p-3 bg-gray-50/50 rounded-xl border border-gray-100 hover:bg-white transition-colors">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none shrink-0">{row.label}</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-gray-900 italic">{row.value}</span>
                  <div className="w-6 h-6 bg-white rounded-lg flex items-center justify-center border border-gray-100 shadow-sm">
                    <row.icon size={12} className="text-gray-400" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-gray-200 p-8 shadow-sm group">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 bg-amber-50 text-amber-600 rounded-lg flex items-center justify-center">
              <TrendingUp size={18} />
            </div>
            <h5 className="text-xs font-black text-gray-900 uppercase tracking-widest italic leading-none">Market Insights</h5>
          </div>
          <div className="space-y-4">
            {[
              { label: 'Avg Bid Amount', value: formatCurrency(analytics.averageBidAmount), icon: DollarSign },
              { label: 'Response Time', value: formatTime(analytics.averageResponseTime), icon: Clock },
              { label: 'Market Activity', value: 'High Intensity', icon: Activity, customColor: 'text-emerald-600' }
            ].map((row, idx) => (
              <div key={idx} className="flex justify-between items-center p-3 bg-gray-50/50 rounded-xl border border-gray-100 hover:bg-white transition-colors">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none shrink-0">{row.label}</span>
                <div className="flex items-center gap-2">
                  <span className={`text - xs font - black italic ${row.customColor || 'text-gray-900'} `}>{row.value}</span>
                  <div className="w-6 h-6 bg-white rounded-lg flex items-center justify-center border border-gray-100 shadow-sm">
                    <row.icon size={12} className="text-gray-400" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {analytics.topPerformingLoads && analytics.topPerformingLoads.length > 0 && (
        <div className="bg-white rounded-3xl border border-gray-200 overflow-hidden shadow-sm">
          <div className="p-8 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center">
                < Award size={18} />
              </div>
              <h5 className="text-xs font-black text-gray-900 uppercase tracking-widest italic leading-none">Top Performing Loads</h5>
            </div>
          </div>

          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-100">
                  <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Load Details</th>
                  <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Bids</th>
                  <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Final Price</th>
                  <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {analytics.topPerformingLoads.map((load: any, index: number) => (
                  <tr key={index} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gray-900 rounded-lg flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                          <Truck size={14} className="text-white" />
                        </div>
                        <span className="text-xs font-black text-gray-900 uppercase italic leading-none tracking-tight">{load.title}</span>
                      </div>
                    </td>
                    <td className="px-8 py-5 text-center">
                      <span className="text-xs font-black text-gray-900">{load.totalBids}</span>
                    </td>
                    <td className="px-8 py-5">
                      <span className="text-xs font-black text-emerald-600 italic">{formatCurrency(load.finalPrice)}</span>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <span className={`px - 3 py - 1 text - [10px] font - black uppercase tracking - widest rounded - full italic ${load.status === 'COMPLETED'
                          ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                          : 'bg-amber-50 text-amber-600 border border-amber-100'
                        } `}>
                        {load.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden p-4 space-y-4">
            {analytics.topPerformingLoads.map((load: any, index: number) => (
              <div key={index} className="bg-gray-50/50 rounded-2xl border border-gray-100 p-4 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gray-900 rounded-lg flex items-center justify-center shrink-0">
                    <Truck size={14} className="text-white" />
                  </div>
                  <span className="text-xs font-black text-gray-900 uppercase italic tracking-tight">{load.title}</span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Bids</p>
                    <p className="text-xs font-black text-gray-900">{load.totalBids}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Final Price</p>
                    <p className="text-xs font-black text-emerald-600">{formatCurrency(load.finalPrice)}</p>
                  </div>
                </div>
                <div className="pt-4 border-t border-gray-100">
                  <span className={`px - 3 py - 1 text - [10px] font - black uppercase tracking - widest rounded - full italic ${load.status === 'COMPLETED'
                      ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                      : 'bg-amber-50 text-amber-600 border border-amber-100'
                    } `}>
                    {load.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bid Trends Chart Placeholder */}
      <div className="bg-white rounded-3xl border border-gray-200 p-8 shadow-sm">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-8 h-8 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center">
            <Activity size={18} />
          </div>
          <h5 className="text-xs font-black text-gray-900 uppercase tracking-widest italic leading-none">Market Volatility & Bid Trends</h5>
        </div>
        <div className="h-64 bg-gray-50/50 rounded-3xl border border-dashed border-gray-200 flex flex-col items-center justify-center relative overflow-hidden group">
          <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-50"></div>
          <BarChart2 className="h-12 w-12 text-gray-300 mb-4 group-hover:scale-110 group-hover:text-gray-400 transition-all duration-500" />
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest italic">Predictive Analytics Hub Coming Soon</p>
          <div className="mt-4 flex gap-1">
            {[1, 2, 3].map(i => (
              <div key={i} className="w-1.5 h-1.5 rounded-full bg-gray-200"></div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BidAnalytics; 