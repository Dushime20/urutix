import React, { useState, useEffect } from 'react';
import { BrokerDashboardOverview } from './BrokerDashboardOverview';
import { AssignedCargoManagement } from './AssignedCargoManagement';
import { AuctionsManagement } from './AuctionsManagement';
import { SmartMatchingCenter } from './SmartMatchingCenter';
import { ShipmentTracking } from './ShipmentTracking';
import { brokerAPI } from '../../services/brokerApi';
import { biddingAPI } from '../../services/biddingApi-fixed';
import { useAuth } from '../../contexts/AuthContext';

import DashboardHeader from '../Layout/DashboardHeader';
import DashboardFooter from '../Layout/DashboardFooter';
import { DashboardSkeleton } from '../common/LoadingSkeletons';

export const BrokerDashboard: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'cargo' | 'auctions' | 'tracking'>('overview');
  
  // Real data states
  const [stats, setStats] = useState({ totalAssigned: 0, activeAuctions: 0, inTransit: 0, delivered: 0 });
  const [cargos, setCargos] = useState<any[]>([]);
  const [auctions, setAuctions] = useState<any[]>([]);
  const [matches, setMatches] = useState<any[]>([]);
  const [shipments, setShipments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user?.id) return;
      
      setLoading(true);
      try {
        // Fetch Broker Loads
        const loadsResponse = await brokerAPI.getBrokerLoads(user.id);
        const loads = loadsResponse.data?.data || loadsResponse.data || [];
        
        const mappedCargos = loads.map((load: any) => ({
          id: load.id || load._id,
          title: load.title || 'Cargo Shipment',
          status: load.status || 'Pending',
          origin: load.pickupLocation?.city || 'Unknown Origin',
          destination: load.deliveryLocation?.city || 'Unknown Destination',
          date: new Date(load.createdAt).toLocaleDateString()
        }));
        setCargos(mappedCargos);

        // Fetch Auctions
        const auctionsResponse = await biddingAPI.getAuctions({ status: 'ACTIVE' });
        const activeAuctions = auctionsResponse.data?.data || auctionsResponse.data || [];
        
        const mappedAuctions = activeAuctions.map((auc: any) => ({
          id: auc.id || auc._id,
          cargoTitle: auc.loadId ? `Load ${auc.loadId.substring(0,6)}` : 'Auction',
          bidsCount: auc.bidsCount || 0,
          lowestBid: `$${auc.lowestBid || 0}`,
          timeLeft: new Date(auc.auctionEnd) > new Date() ? 'Active' : 'Ended',
          status: auc.status === 'CLOSING' ? 'closing' : 'active'
        }));
        setAuctions(mappedAuctions);

        // Calculate basic stats from loads
        setStats({
          totalAssigned: mappedCargos.length,
          activeAuctions: mappedAuctions.length,
          inTransit: mappedCargos.filter((c: any) => c.status === 'IN_TRANSIT').length,
          delivered: mappedCargos.filter((c: any) => c.status === 'DELIVERED').length
        });
        
        // Matches and shipments could be pulled from other endpoints, leaving empty or mock for now
        setMatches([]);
        setShipments([]);

      } catch (error) {
        console.error('Failed to fetch broker dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user?.id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex flex-col">
        <DashboardHeader />
        <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Broker Dashboard</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-2">Loading your dashboard data...</p>
          </div>
          <DashboardSkeleton />
        </main>
        <DashboardFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex flex-col">
      <DashboardHeader />
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Broker Dashboard</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-2">Manage assigned cargo, auctions, and track shipments in real-time.</p>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 border-b border-gray-200 dark:border-gray-700 mb-6 overflow-x-auto pb-px">
        {['overview', 'cargo', 'auctions', 'tracking'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${
              activeTab === tab
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="space-y-6">
        {activeTab === 'overview' && (
          <>
            <BrokerDashboardOverview stats={stats} />
            <AssignedCargoManagement cargos={cargos} />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
              <div className="mt-0"><AuctionsManagement auctions={auctions.slice(0, 2)} /></div>
              <div className="mt-0"><SmartMatchingCenter matches={matches.slice(0, 2)} /></div>
            </div>
          </>
        )}

        {activeTab === 'cargo' && (
          <div className="space-y-6">
            <AssignedCargoManagement cargos={cargos} />
            <SmartMatchingCenter matches={matches} />
          </div>
        )}

        {activeTab === 'auctions' && (
          <AuctionsManagement auctions={auctions} />
        )}

        {activeTab === 'tracking' && (
          <ShipmentTracking shipments={shipments} />
        )}
      </div>
      </main>
      <DashboardFooter />
    </div>
  );
};
