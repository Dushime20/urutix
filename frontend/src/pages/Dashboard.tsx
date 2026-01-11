import { useState, useEffect } from 'react';
import { useCargoOwnerLayout } from '../contexts/CargoOwnerLayoutContext';
import { useAuth } from '../contexts/AuthContext';
import { fetchCargos } from '../services/cargoApi';
import { Bell, Calendar, Clock, MessageCircle, Headphones, AlertTriangle, CheckCircle, Droplets, Fuel, X, Search, Zap, ChevronDown, Download } from 'lucide-react';

// New Widgets
import StatsOverview from '../components/Dashboard/Widgets/StatsOverview';
import TradeIntelligence from '../components/Dashboard/Widgets/TradeIntelligence';
import ActionButtons from '../components/Dashboard/Widgets/ActionButtons';
import ActiveShipments from '../components/Dashboard/Widgets/ActiveShipments';
import RecentActivity from '../components/Dashboard/Widgets/RecentActivity';
import FinancingWidget from '../components/Dashboard/Widgets/FinancingWidget';
import WalletOverview from '../components/Dashboard/Widgets/WalletOverview';
import QuickActions from '../components/Dashboard/Widgets/QuickActions';
import AuctionTicker from '../components/Dashboard/Widgets/AuctionTicker';
import SmartInsightsWidget from '../components/Dashboard/Widgets/SmartInsightsWidget';
import RouteTimeline from '../components/Dashboard/Widgets/RouteTimeline';
import CreateCargoModal from '../components/CargoDashboard/CreateCargoModal';
import { AssignBrokerModal } from '../components/CargoDashboard/AssignBrokerModal';
import DashboardHeader from '../components/Dashboard/Layout/DashboardHeader';
import DashboardFooter from '../components/Dashboard/Layout/DashboardFooter';

const Dashboard = () => {
  const layoutContext = useCargoOwnerLayout();
  const { user } = useAuth();
  const { setHideHeader } = layoutContext || {};
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const [userName, setUserName] = useState('Alex');
  const [isCarbonSaver] = useState(true);
  const [greeting, setGreeting] = useState('');

  // New Modal States
  const [isCreateCargoOpen, setIsCreateCargoOpen] = useState(false);
  const [isAssignBrokerOpen, setIsAssignBrokerOpen] = useState(false);

  // State to pass data between modals
  const [newCargoData, setNewCargoData] = useState<{ id: string, value: number, title: string } | null>(null);

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good Morning');
    else if (hour < 18) setGreeting('Good Afternoon');
    else setGreeting('Good Evening');
  }, []);

  const handleCargoCreated = (loadId: string, loadValue: number, loadTitle: string) => {
    setNewCargoData({ id: loadId, value: loadValue, title: loadTitle });
    // Small delay for UX transition
    setTimeout(() => setIsAssignBrokerOpen(true), 300);
  };

  // Hide default header on mount, show on unmount
  useEffect(() => {
    if (setHideHeader) {
      setHideHeader(true);
      return () => setHideHeader(false);
    }
  }, [setHideHeader]);

  // Keep existing state logic for data fetching
  const [cargos, setCargos] = useState<any[]>([]);
  const [, setLoading] = useState(true);

  // Data State
  const [statsData, setStatsData] = useState({
    activeShipments: 12,
    pendingOffers: 8,
    financingLimit: 50000,
    walletBalance: 12540
  });

  // Fetch cargos and related data on mount
  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        const cargoData = await fetchCargos(1, '', {});
        const cargosArray = Array.isArray(cargoData) ? cargoData : [];
        setCargos(cargosArray);

        const activeCount = cargosArray.filter((c: any) =>
          c.status === 'IN_TRANSIT' || c.status === 'ASSIGNED' || c.status === 'PUBLISHED'
        ).length;

        setStatsData(prev => ({
          ...prev,
          activeShipments: activeCount || 12
        }));

      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };
    loadDashboardData();
  }, [user]);


  return (
    <div className="min-h-screen bg-slate-50 font-['Manrope',sans-serif] antialiased selection:bg-teal-100 selection:text-teal-900">

      <DashboardHeader onCreateClick={() => setIsCreateCargoOpen(true)} />

      {/* Welcome Section */}
      <div className="max-w-[1536px] mx-auto px-4 md:px-8 lg:px-12 xl:px-20 pt-4 md:pt-6 pb-12 md:pb-16 bg-[#0f172a] text-white">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10 md:mb-12">
          <div>
            <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight">Welcome back, Kofi</h1>
            <p className="text-white/50 text-sm md:text-base mt-2">Overseeing {statsData.activeShipments} active trade corridors across West Africa.</p>
          </div>
          <div className="flex items-center gap-3 md:gap-4 text-xs font-bold text-white/60">
            <div className="flex items-center gap-2 px-3 md:px-4 py-2 bg-white/5 rounded-xl border border-white/10 backdrop-blur-sm">
              <Calendar size={14} />
              <span className="hidden sm:inline">Nov 04, 2023</span>
              <span className="sm:hidden">Nov 04</span>
            </div>
            <div className="flex items-center gap-2 px-3 md:px-4 py-2 bg-white/5 rounded-xl border border-white/10 backdrop-blur-sm">
              <Clock size={14} />
              14:42 GMT
            </div>
          </div>
        </div>

        {/* Control Bar - Pro UX Feature */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
          <div className="flex bg-white/5 p-1 rounded-lg border border-white/10">
            {['24H', '7D', '30D', '90D'].map((time) => (
              <button key={time} className={`px-4 py-1.5 rounded-md text-[10px] font-bold transition-all ${time === '30D' ? 'bg-teal-500 text-white shadow-lg shadow-teal-500/20' : 'text-white/60 hover:text-white hover:bg-white/5'}`}>
                {time}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white/80 text-xs font-bold transition-all w-full sm:w-auto justify-center group">
              <span className="w-2 h-2 rounded-full bg-indigo-500 group-hover:animate-pulse"></span>
              West Africa
              <ChevronDown size={14} className="text-white/40" />
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white/80 text-xs font-bold transition-all w-full sm:w-auto justify-center group">
              <Download size={14} className="group-hover:text-teal-400 transition-colors" />
              Export
            </button>
          </div>
        </div>

        {/* Stats Cards - Command Cards Style */}
        <StatsOverview stats={statsData} />
      </div>

      {/* Main Content - Light Background */}
      <main className="flex-1 pt-8 md:pt-12 pb-20 md:pb-32 px-4 md:px-8 lg:px-12 xl:px-20 max-w-[1536px] mx-auto w-full -mt-6 md:-mt-12 bg-slate-50">
        <div className="grid grid-cols-12 gap-6 md:gap-8 mb-8 md:mb-12">
          {/* Left Column */}
          <div className="col-span-12 lg:col-span-8 flex flex-col gap-6 md:gap-8">
            {/* Trade Intelligence Section */}
            <TradeIntelligence />

            <SmartInsightsWidget />

            {/* Action Buttons */}
            <ActionButtons />
          </div>

          {/* Right Column - Activity & auctions */}
          <div className="col-span-12 lg:col-span-4 flex flex-col gap-6 md:gap-8">
            <AuctionTicker />
            <RouteTimeline />
            <RecentActivity />
          </div>
        </div>

        {/* Second Row */}
        <div className="grid grid-cols-12 gap-6 md:gap-8">
          {/* Active Shipments */}
          <div className="col-span-12 lg:col-span-8">
            <ActiveShipments cargos={cargos} />
          </div>

          {/* Financing & Wallet */}
          <div className="col-span-12 lg:col-span-4 space-y-6 md:space-y-8">
            <FinancingWidget />
            <WalletOverview />
          </div>
        </div>
      </main>

      <DashboardFooter onCreateClick={() => setIsCreateCargoOpen(true)} />

      {/* Floating Chat Button */}
      <div className="fixed bottom-6 md:bottom-8 right-4 md:right-8 flex flex-col items-end gap-4 z-[60]">
        <div className="hidden md:flex bg-white px-5 py-3 rounded-2xl shadow-2xl border border-slate-100 items-center gap-3">
          <div className="relative">
            <div className="size-10 rounded-full bg-gradient-to-br from-teal-400 to-emerald-600 border-2 border-teal-500 overflow-hidden">
              <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Amara" alt="Support" className="size-full" />
            </div>
            <span className="absolute bottom-0 right-0 size-3 bg-green-500 border-2 border-white rounded-full"></span>
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Support Lead</p>
            <p className="text-xs font-bold text-[#0f172a]">Amara is online</p>
          </div>
        </div>
        <button className="size-14 md:size-16 bg-gradient-to-br from-teal-500 to-teal-700 text-white rounded-full flex items-center justify-center shadow-[0_10px_40px_rgba(13,148,136,0.3)] hover:scale-110 active:scale-95 transition-all group">
          <Headphones size={28} className="group-hover:hidden" />
          <MessageCircle size={28} className="hidden group-hover:block" />
        </button>

        {/* Modals */}
        <CreateCargoModal
          isOpen={isCreateCargoOpen}
          onClose={() => setIsCreateCargoOpen(false)}
          onSuccess={handleCargoCreated}
        />

        {newCargoData && (
          <AssignBrokerModal
            isOpen={isAssignBrokerOpen}
            onClose={() => setIsAssignBrokerOpen(false)}
            loadId={newCargoData.id}
            loadTitle={newCargoData.title}
            loadValue={newCargoData.value}
            onSuccess={() => console.log('Broker Assigned!')}
          />
        )}
      </div>
    </div>
  );
};

export default Dashboard;