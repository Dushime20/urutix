import React, { useState, useEffect } from 'react';
import {
  BarChart2,
  DollarSign,
  Clock,
  TrendingUp,
  Activity,
  Truck,
  Shield,
  Zap,
  Target,
  BarChart3
} from 'lucide-react';
import { cn } from '@/utils/cn';
import api from '@/services/api';

interface LoadPerformance {
  title: string;
  totalBids: number;
  finalPrice: number;
  status: string;
}

interface BidAnalyticsProps {
  userRole: 'CARGO_OWNER' | 'TRUCK_OWNER' | 'BROKER';
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
    setError(null);
    try {
      // Use existing authenticated endpoints
      const [bidsRes, statsRes] = await Promise.all([
        api.get('/bidding/bids'),
        api.get('/bidding/dashboard/stats'),
      ]);

      const bids: any[] = bidsRes.data?.bids || bidsRes.data?.data || bidsRes.data || [];
      const stats = statsRes.data?.stats || statsRes.data?.data || statsRes.data || {};

      const successfulBids = bids.filter((b: any) => b.status === 'ACCEPTED' || b.status === 'WON');
      const totalValue = bids.reduce((sum: number, b: any) => sum + (Number(b.amount) || 0), 0);
      const avgAmount = bids.length > 0 ? totalValue / bids.length : 0;
      const successRate = bids.length > 0 ? Math.round((successfulBids.length / bids.length) * 100) : 0;

      // Group by load for top performing loads
      const loadMap: Record<string, any> = {};
      bids.forEach((b: any) => {
        const key = b.loadId || b.auctionId || 'unknown';
        if (!loadMap[key]) {
          loadMap[key] = { title: b.load?.title || b.auction?.load?.title || `Load ${key.slice(0,6)}`, totalBids: 0, finalPrice: 0, status: b.status };
        }
        loadMap[key].totalBids++;
        if (b.status === 'ACCEPTED' || b.status === 'WON') loadMap[key].finalPrice = Number(b.amount);
      });

      setAnalytics({
        totalBids: stats.totalBids ?? bids.length,
        successfulBids: stats.wonBids ?? successfulBids.length,
        averageBidAmount: stats.averageBidAmount ?? avgAmount,
        totalValue: stats.totalValue ?? totalValue,
        successRate: stats.winRate ?? successRate,
        averageResponseTime: stats.averageResponseTime ?? 0,
        topPerformingLoads: Object.values(loadMap).slice(0, 5),
        bidTrends: [],
      });
    } catch (error) {
      console.error('Analytics error:', error);
      setError('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };



  const StatsCard = ({ title, value, icon: Icon, colorClass, secondaryColor }: any) => {
    const displayValue = Array.isArray(value) ? value.length : value;

    return (
      <div className="flex flex-col items-center group">
        <div className="relative w-40 h-40 rounded-full bg-white dark:bg-slate-900 border-[8px] border-slate-50 dark:border-slate-800 flex flex-col items-center justify-center transition-all duration-500 hover:border-slate-100 dark:hover:border-blue-900/30 hover:shadow-xl hover:shadow-slate-200/50 dark:hover:shadow-blue-500/10">
          <svg className="absolute inset-0 w-full h-full -rotate-90 scale-[1.05]">
            <circle
              cx="80"
              cy="80"
              r="72"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeDasharray="452"
              strokeDashoffset="350"
              className={cn("opacity-10 transition-all duration-1000 group-hover:stroke-dashoffset-[200]", secondaryColor)}
            />
          </svg>

          <div className={cn("p-2 rounded-2xl mb-1 bg-slate-50 dark:bg-slate-950 text-slate-400 dark:text-slate-600 group-hover:bg-white dark:group-hover:bg-slate-800 group-hover:text-inherit transition-all duration-500 shadow-sm", colorClass)}>
            <Icon className="w-5 h-5" />
          </div>

          <div className="flex flex-col items-center px-4 w-full overflow-hidden">
            <span className="text-xl font-black text-[#0f172a] dark:text-slate-100 tracking-tight group-hover:scale-110 transition-transform duration-500 truncate w-full text-center">
              {displayValue}
            </span>
          </div>

          <div className="absolute inset-4 rounded-full border border-dashed border-slate-100 dark:border-slate-800 opacity-50 group-hover:rotate-90 transition-transform duration-1000" />
        </div>

        <div className="mt-4 text-center">
          <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] group-hover:text-[#345E85] transition-colors duration-300">
            {title}
          </p>
        </div>
      </div>
    );
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}H ${mins}M` : `${mins}M`;
  };

  if (loading) {
    return (
      <div className="text-center py-8 sm:py-12">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 dark:border-blue-400"></div>
        <p className="mt-3 text-xs sm:text-sm text-gray-600 dark:text-slate-400">Loading analytics...</p>
      </div>
    );
  }

  return (
    <div className="space-y-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-[#345E85] dark:text-blue-400" />
            </div>
            <h1 className="text-4xl font-black text-[#0f172a] dark:text-slate-100 tracking-tight">Performance Intelligence</h1>
          </div>
          <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest max-w-xl">
            {userRole === 'CARGO_OWNER'
              ? 'Comprehensive tracking of auction ecosystem and bidder dynamics'
              : 'Quantum market insights and success intelligence for your strategic bidding'}
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/30 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6">
          <div className="flex items-start sm:items-center">
            <div className="flex-shrink-0 mt-0.5 sm:mt-0">
              <svg className="h-4 w-4 sm:h-5 sm:w-5 text-red-400 dark:text-red-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-2 flex-1 min-w-0">
              <h3 className="text-xs sm:text-sm font-medium text-red-800 dark:text-red-400 break-words">{error}</h3>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 mb-12 place-items-center bg-white dark:bg-slate-900 p-10 rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-sm">
        <StatsCard
          title="Total Engagement"
          value={analytics.totalBids}
          icon={Activity}
          colorClass="bg-blue-50 dark:bg-blue-900/20 text-[#345E85] dark:text-blue-400"
          secondaryColor="text-[#345E85] dark:text-blue-400"
        />
        <StatsCard
          title="Conversion Rate"
          value={`${analytics.successRate}%`}
          icon={Target}
          colorClass="bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400"
          secondaryColor="text-emerald-600 dark:text-emerald-400"
        />
        <StatsCard
          title="Average Valuation"
          value={formatCurrency(analytics.averageBidAmount)}
          icon={DollarSign}
          colorClass="bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400"
          secondaryColor="text-amber-600 dark:text-amber-400"
        />
        <StatsCard
          title="Response Latency"
          value={formatTime(analytics.averageResponseTime)}
          icon={Clock}
          colorClass="bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400"
          secondaryColor="text-purple-600 dark:text-purple-400"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden group">
          <div className="absolute -right-8 -top-8 w-24 h-24 bg-slate-50 dark:bg-slate-950 rounded-full opacity-50 dark:opacity-20 group-hover:scale-150 transition-transform duration-700" />

          <div className="relative">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 bg-slate-50 dark:bg-slate-950 text-[#345E85] dark:text-blue-400 rounded-xl flex items-center justify-center border border-slate-100 dark:border-slate-800 shadow-sm">
                <Shield size={20} />
              </div>
              <h5 className="text-[10px] font-black text-[#0f172a] dark:text-slate-100 uppercase tracking-[0.2em]">Operational summary</h5>
            </div>
            <div className="space-y-4">
              {[
                { label: 'Converted Opportunities', value: analytics.successfulBids, icon: Zap, color: 'text-blue-500' },
                { label: 'Total Network Volume', value: formatCurrency(analytics.totalValue), icon: DollarSign, color: 'text-emerald-500' },
                { label: 'Global Success Parity', value: `${analytics.successRate}%`, icon: Target, color: 'text-[#345E85]' }
              ].map((row, idx) => (
                <div key={idx} className="flex justify-between items-center p-4 bg-slate-50/50 dark:bg-slate-950/50 rounded-2xl border border-slate-100 dark:border-slate-800 hover:bg-white dark:hover:bg-slate-800 hover:border-blue-100 dark:hover:border-blue-900/50 transition-all group/row">
                  <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{row.label}</span>
                  <div className="flex items-center gap-3">
                    <span className={cn("text-sm font-black italic", row.color)}>{row.value}</span>
                    <div className="w-7 h-7 bg-white dark:bg-slate-900 rounded-lg flex items-center justify-center shadow-sm border border-slate-100 dark:border-slate-800 group-hover/row:scale-110 transition-transform">
                      <row.icon size={14} className="text-slate-400 dark:text-slate-600" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden group">
          <div className="absolute -right-8 -top-8 w-24 h-24 bg-slate-50 dark:bg-slate-950 rounded-full opacity-50 dark:opacity-20 group-hover:scale-150 transition-transform duration-700" />

          <div className="relative">
             <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 bg-slate-50 dark:bg-slate-950 text-amber-500 rounded-xl flex items-center justify-center border border-slate-100 dark:border-slate-800 shadow-sm">
                <TrendingUp size={20} />
              </div>
              <h5 className="text-[10px] font-black text-[#0f172a] dark:text-slate-100 uppercase tracking-[0.2em]">Strategic insights</h5>
            </div>
            <div className="space-y-4">
              {[
                { label: 'Market Valuation Index', value: formatCurrency(analytics.averageBidAmount), icon: DollarSign, color: 'text-amber-500' },
                { label: 'Mean Response Velocity', value: formatTime(analytics.averageResponseTime), icon: Clock, color: 'text-purple-500' },
                { label: 'Market Intensity', value: 'OPTIMAL', icon: Activity, color: 'text-emerald-500' }
              ].map((row, idx) => (
                <div key={idx} className="flex justify-between items-center p-4 bg-slate-50/50 dark:bg-slate-950/50 rounded-2xl border border-slate-100 dark:border-slate-800 hover:bg-white dark:hover:bg-slate-800 hover:border-blue-100 dark:hover:border-blue-900/50 transition-all group/row">
                  <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{row.label}</span>
                  <div className="flex items-center gap-3">
                    <span className={cn("text-sm font-black italic", row.color)}>{row.value}</span>
                    <div className="w-7 h-7 bg-white dark:bg-slate-900 rounded-lg flex items-center justify-center shadow-sm border border-slate-100 dark:border-slate-800 group-hover/row:scale-110 transition-transform">
                      <row.icon size={14} className="text-slate-400 dark:text-slate-600" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {analytics.topPerformingLoads && analytics.topPerformingLoads.length > 0 && (
        <div className="w-full overflow-hidden">
           <div className="flex items-center gap-3 mb-6 px-4">
            <div className="w-10 h-10 bg-slate-900 dark:bg-blue-600 text-white rounded-2xl flex items-center justify-center shadow-lg">
              <Target size={20} />
            </div>
            <h5 className="text-[10px] font-black text-[#0f172a] dark:text-slate-100 uppercase tracking-[0.2em]">High yield opportunities</h5>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-separate border-spacing-y-3">
              <thead>
                 <tr>
                  <th className="px-8 py-2 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">Entity Context</th>
                  <th className="px-8 py-2 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] text-center">Engagement</th>
                  <th className="px-8 py-2 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">Final Valuation</th>
                  <th className="px-8 py-2 text-right text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {analytics.topPerformingLoads.map((load: any, index: number) => (
                   <tr key={index} className="group transition-all">
                    <td className="px-8 py-5 bg-white dark:bg-slate-900 border-y border-l border-slate-100 dark:border-slate-800 first:rounded-l-[2rem] group-hover:bg-slate-50/50 dark:group-hover:bg-slate-800/50">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 flex items-center justify-center text-[#345E85] dark:text-blue-400 group-hover:bg-white dark:group-hover:bg-slate-900 group-hover:scale-110 transition-all">
                          <Truck size={18} />
                        </div>
                        <span className="text-sm font-black text-[#0f172a] dark:text-slate-100 uppercase italic leading-none">{load.title}</span>
                      </div>
                    </td>
                     <td className="px-8 py-5 bg-white dark:bg-slate-900 border-y border-slate-100 dark:border-slate-800 group-hover:bg-slate-50/50 dark:group-hover:bg-slate-800/50 text-center">
                      <span className="text-xs font-black text-slate-900 dark:text-slate-100">{load.totalBids} BIDS</span>
                    </td>
                    <td className="px-8 py-5 bg-white dark:bg-slate-900 border-y border-slate-100 dark:border-slate-800 group-hover:bg-slate-50/50 dark:group-hover:bg-slate-800/50">
                      <span className="text-sm font-black text-emerald-600 dark:text-emerald-400 italic tracking-tight">{formatCurrency(load.finalPrice)}</span>
                    </td>
                     <td className="px-8 py-5 bg-white dark:bg-slate-900 border-y border-r border-slate-100 dark:border-slate-800 last:rounded-r-[2rem] group-hover:bg-slate-50/50 dark:group-hover:bg-slate-800/50 text-right">
                      <span className={cn(
                        "px-4 py-1.5 text-[9px] font-black uppercase tracking-widest rounded-full border shadow-sm inline-flex items-center gap-1.5",
                        load.status === 'COMPLETED' 
                          ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-800' 
                          : 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-800'
                      )}>
                        <span className="w-1 h-1 rounded-full bg-current" />
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

       <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden group">
        <div className="absolute -right-8 -top-8 w-24 h-24 bg-slate-50 dark:bg-slate-950 rounded-full opacity-50 dark:opacity-20 group-hover:scale-150 transition-transform duration-700" />

        <div className="relative">
           <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-slate-50 dark:bg-slate-950 text-indigo-500 rounded-xl flex items-center justify-center border border-slate-100 dark:border-slate-800 shadow-sm">
              <Activity size={20} />
            </div>
            <h5 className="text-[10px] font-black text-[#0f172a] dark:text-slate-100 uppercase tracking-[0.2em]">Market volatility & trends</h5>
          </div>

           <div className="h-64 bg-slate-50/50 dark:bg-slate-950/50 rounded-[2rem] border border-dashed border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center relative overflow-hidden group">
            <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] dark:bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-50 dark:opacity-30"></div>
            <BarChart2 className="h-12 w-12 text-slate-300 dark:text-slate-700 mb-4 group-hover:scale-110 group-hover:text-slate-400 dark:group-hover:text-slate-500 transition-all duration-500" />
            <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest italic">Predictive Hub Coming Soon</p>
             <div className="mt-4 flex gap-1">
              {[1, 2, 3].map(i => (
                <div key={i} className="w-1.5 h-1.5 rounded-full bg-slate-200 dark:bg-slate-800"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BidAnalytics; 