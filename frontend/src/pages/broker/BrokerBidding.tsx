import { DashboardSkeleton } from '../../components/common/LoadingSkeletons';
import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { biddingAPI } from '../../services/biddingApi';
import AuctionList from '../../components/Bidding/AuctionList';
import BidHistory from '../../components/Bidding/BidHistory';
import BidAnalytics from '../../components/Bidding/BidAnalytics';
import CreateAuction from '../../components/Bidding/CreateAuction';
import BrokerBidManagement from '../../components/Bidding/BrokerBidManagement';
import { Gavel, BarChart3, Heart, Plus, CheckSquare, Clock } from 'lucide-react';

const BrokerBidding: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState('bids');
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    activeBids: 0,
    successRate: 0,
  });

  useEffect(() => {
    loadDashboardStats();
  }, []);

  useEffect(() => {
    if (searchParams.get('loadId') || searchParams.get('bidId')) {
      setActiveTab('bids');
    }
  }, [searchParams]);

  const loadDashboardStats = async () => {
    setLoading(true);
    try {
      const response = await biddingAPI.getDashboardStats();
      setStats({
        activeBids: response.data.activeBids,
        successRate: response.data.successRate,
      });
    } catch (error: any) {
      console.error('Dashboard stats error:', error);
      setStats({
        activeBids: 5,
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
      <div className="relative overflow-hidden bg-white dark:bg-slate-900 rounded-[2rem] p-6 shadow-sm border border-slate-100 dark:border-slate-800 flex items-center justify-between group">
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-slate-100/60 dark:bg-primary-600/10 rounded-full -mr-48 -mt-48 blur-[80px]"></div>
        
        <div className="relative z-10 flex items-center gap-6">
          <div className="w-14 h-14 rounded-2xl bg-[#345E85]/10 dark:bg-white/10 border border-[#345E85]/20 dark:border-white/20 flex items-center justify-center">
            <Gavel size={24} className="text-[#345E85] dark:text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight leading-none mb-1 text-slate-900 dark:text-white">Bidding</h1>
            <p className="text-slate-400 text-sm font-bold uppercase">System Stats</p>
          </div>
        </div>

        <div className="relative z-10 flex items-center gap-12 mr-4 text-right">
           <div className="text-center hidden md:block">
             <p className="text-xl font-bold leading-none text-primary-400">{stats.activeBids}</p>
             <p className="text-xs font-bold text-slate-500 uppercase mt-0.5 dark:text-slate-400">Active</p>
           </div>
           <div className="h-10 w-px bg-white/10 mx-2 hidden md:block"></div>
           <div className="text-center hidden md:block">
             <p className="text-xl font-bold leading-none text-emerald-400">{stats.successRate}%</p>
             <p className="text-xs font-bold text-slate-500 uppercase mt-0.5 dark:text-slate-400">Win Rate</p>
           </div>
        </div>
      </div>

      {/* Tabs Terminal */}
      <div className="bg-white rounded-[3.5rem] border border-slate-100 shadow-sm overflow-hidden animate-slide-up dark:bg-slate-900 dark:border-slate-800">
        <div className="bg-slate-50/50 p-3 border-b border-slate-100 dark:border-slate-800 overflow-x-auto">
           <div className="flex items-center gap-2 min-w-max">
              {/* Primary workflow tabs */}
              {[
                { id: 'bids', label: 'Manage Bids', icon: CheckSquare, badge: 'NEW' },
                { id: 'auctions', label: 'Open Auctions', icon: Gavel },
                { id: 'create', label: 'Create Auction', icon: Plus },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2.5 px-5 py-3.5 rounded-2xl text-xs font-bold uppercase transition-all whitespace-nowrap ${activeTab === tab.id ? 'bg-slate-900 text-white shadow-xl' : 'text-slate-400 hover:text-slate-900 hover:bg-white dark:text-slate-500 dark:hover:text-white dark:hover:bg-slate-800'}`}
                >
                  <tab.icon size={14} />
                  {tab.label}
                  {tab.badge && (
                    <span className="px-1.5 py-0.5 rounded-md bg-primary-600 text-white text-[9px] font-black">{tab.badge}</span>
                  )}
                </button>
              ))}

              <div className="w-px h-8 bg-slate-200 dark:bg-slate-700 mx-1 shrink-0" aria-hidden />

              {/* Reference & insights tabs */}
              {[
                { id: 'history', label: 'History', icon: Clock },
                { id: 'watched', label: 'Saved', icon: Heart },
                { id: 'analytics', label: 'Analysis', icon: BarChart3 },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2.5 px-5 py-3.5 rounded-2xl text-xs font-bold uppercase transition-all whitespace-nowrap ${activeTab === tab.id ? 'bg-slate-900 text-white shadow-xl' : 'text-slate-400 hover:text-slate-900 hover:bg-white dark:text-slate-500 dark:hover:text-white dark:hover:bg-slate-800'}`}
                >
                  <tab.icon size={14} />
                  {tab.label}
                </button>
              ))}
           </div>
        </div>

        <div className="p-8 sm:p-12">
          {activeTab === 'bids' && <BrokerBidManagement onCreateAuction={() => setActiveTab('create')} />}
          {activeTab === 'auctions' && <AuctionList userRole="BROKER" />}
          {activeTab === 'history' && <BidHistory userRole="BROKER" />}
          {activeTab === 'watched' && <AuctionList userRole="BROKER" showWatchedOnly={true} />}
          {activeTab === 'create' && <CreateAuction />}
          {activeTab === 'analytics' && <BidAnalytics userRole="BROKER" />}
        </div>
      </div>
    </div>
  );
};

export default BrokerBidding;
