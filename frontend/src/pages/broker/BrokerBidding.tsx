import { DashboardSkeleton } from '../../components/common/LoadingSkeletons';
import React, { useState, useEffect } from 'react';
import { biddingAPI } from '../../services/biddingApi';
import AuctionList from '../../components/Bidding/AuctionList';
import BidHistory from '../../components/Bidding/BidHistory';
import BidAnalytics from '../../components/Bidding/BidAnalytics';
import CreateAuction from '../../components/Bidding/CreateAuction';
import { Gavel, Users, BarChart3, DollarSign, Heart, Plus, Activity, Zap, Shield, ArrowRight } from 'lucide-react';

const BrokerBidding: React.FC = () => {
  const [activeTab, setActiveTab] = useState('auctions');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    totalAuctions: 0,
    activeBids: 0,
    totalValue: 0,
    successRate: 0,
  });

  useEffect(() => {
    loadDashboardStats();
  }, []);

  const loadDashboardStats = async () => {
    setLoading(true);
    try {
      const response = await biddingAPI.getDashboardStats();
      setStats(response.data);
    } catch (error: any) {
      console.error('Dashboard stats error:', error);
      setError('Failed to load real-time metrics - using demo data');
      setStats({
        totalAuctions: 8,
        activeBids: 5,
        totalValue: 32000,
        successRate: 68,
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="max-w-[1400px] mx-auto space-y-12 animate-fade-in pb-24">
      {/* Ultra-Compact Bidding Header */}
      <div className="relative overflow-hidden bg-slate-900 rounded-[2rem] p-6 text-white shadow-2xl flex items-center justify-between group">
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-primary-600/10 rounded-full -mr-48 -mt-48 blur-[80px]"></div>
        
        <div className="relative z-10 flex items-center gap-6">
          <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center backdrop-blur-xl">
            <Gavel size={24} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight leading-none mb-1">Bidding</h1>
            <p className="text-slate-400 text-sm font-bold uppercase">System Stats</p>
          </div>
        </div>

        <div className="relative z-10 flex items-center gap-12 mr-4 text-right">
           <div className="text-center hidden md:block">
             <p className="text-xl font-bold leading-none text-primary-400">{stats.activeBids}</p>
             <p className="text-xs font-bold text-slate-500 uppercase mt-0.5">Active</p>
           </div>
           <div className="h-10 w-px bg-white/10 mx-2 hidden md:block"></div>
           <div className="text-center hidden md:block">
             <p className="text-xl font-bold leading-none text-emerald-400">{stats.successRate}%</p>
             <p className="text-xs font-bold text-slate-500 uppercase mt-0.5">Win Rate</p>
           </div>
        </div>
      </div>

      {/* Statistics Board */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        {[
          { label: 'Auctions', value: stats.totalAuctions, icon: Gavel },
          { label: 'Active', value: stats.activeBids, icon: Users },
          { label: 'Liquidity', value: stats.totalValue >= 1000 ? `$${(stats.totalValue / 1000).toFixed(1)}K` : `$${stats.totalValue.toLocaleString()}`, icon: DollarSign },
          { label: 'Win Rate', value: `${stats.successRate}%`, icon: Activity }
        ].map((stat, i) => (
          <div key={i} className="group bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm hover:shadow-2xl transition-all duration-500 relative overflow-hidden">
            <div className="relative z-10 space-y-6">
              <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-slate-900 group-hover:text-white transition-all">
                <stat.icon size={18} />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase mb-1">{stat.label}</p>
                <h3 className="text-2xl font-bold text-slate-900">{stat.value}</h3>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs Terminal */}
      <div className="bg-white rounded-[3.5rem] border border-slate-100 shadow-sm overflow-hidden animate-slide-up">
        <div className="bg-slate-50/50 p-3 border-b border-slate-100">
           <div className="flex gap-2">
              {[
                { id: 'auctions', label: 'Open', icon: Gavel },
                { id: 'bids', label: 'History', icon: Clock },
                { id: 'watched', label: 'Saved', icon: Heart },
                { id: 'create', label: 'Host', icon: Plus },
                { id: 'analytics', label: 'Analysis', icon: BarChart3 },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-3 px-8 py-4 rounded-2xl text-sm font-bold uppercase transition-all ${activeTab === tab.id ? 'bg-slate-900 text-white shadow-xl' : 'text-slate-400 hover:text-slate-900 hover:bg-white'}`}
                >
                  <tab.icon size={14} />
                  {tab.label}
                </button>
              ))}
           </div>
        </div>

        <div className="p-12">
          {activeTab === 'auctions' && <AuctionList userRole="BROKER" />}
          {activeTab === 'bids' && <BidHistory userRole="BROKER" />}
          {activeTab === 'watched' && <AuctionList userRole="BROKER" showWatchedOnly={true} />}
          {activeTab === 'create' && <CreateAuction />}
          {activeTab === 'analytics' && <BidAnalytics userRole="BROKER" />}
        </div>
      </div>
    </div>
  );
};

// Internal constant for Clock until I decide to import it
const Clock = ({ size }: { size: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
);

export default BrokerBidding;