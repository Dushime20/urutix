import { useState, useEffect, lazy, Suspense } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  MapPin,
  Route,
  Navigation,
  Loader2,
  Plus,
} from "lucide-react";
// Dynamically import heavy page to reduce initial bundle size
const Tracking = lazy(() => import("@/pages/Tracking"));
import RoutesPage from "@/pages/Routes";
import { cn } from "@/utils/cn";
import logoUrutiX from "@/assets/logo-urutix.svg";
import { TranslatedText } from "@/components/translated-text";

type TabType = "tracking" | "routes";

const UnifiedTrackingManagement = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Determine initial tab based on route
  const getInitialTab = (): TabType => {
    if (location.pathname.includes("/routes")) return "routes";
    return "tracking";
  };

  const [activeTab, setActiveTab] = useState<TabType>(getInitialTab());

  // Update tab when route changes
  useEffect(() => {
    const tab = getInitialTab();
    setActiveTab(tab);
  }, [location.pathname]);

  // Update route when tab changes (for navigation)
  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    
    let basePath = "/dashboard";
    if (location.pathname.startsWith("/dashboard/broker")) {
      basePath = "/dashboard/broker";
    } else if (location.pathname.startsWith("/cargo-owner")) {
      basePath = "/cargo-owner";
    } else if (location.pathname.startsWith("/tenant-admin")) {
      basePath = "/tenant-admin";
    } else if (location.pathname.startsWith("/dashboard/driver")) {
      basePath = "/dashboard/driver";
    } else if (location.pathname.startsWith("/dashboard/fleet")) {
      basePath = "/dashboard/fleet";
    }

    if (tab === "routes") {
      navigate(`${basePath}/routes`, { replace: true });
    } else {
      navigate(`${basePath}/tracking`, { replace: true });
    }
  };

  const tabs = [
    {
      id: "tracking" as TabType,
      label: "Live Tracking",
      icon: MapPin,
      description: "Real-time shipment tracking and monitoring",
    },
    {
      id: "routes" as TabType,
      label: "Route Planning",
      icon: Route,
      description: "Plan and optimize delivery routes",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 relative">
      <img
        src={logoUrutiX}
        alt="UrutiX Logo Background"
        className="pointer-events-none select-none fixed inset-0 w-full h-full object-cover opacity-10 z-0"
        style={{ objectPosition: 'center' }}
      />
      <div className="max-w-[1600px] mx-auto p-4 sm:p-8 md:p-12 relative z-10">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8 sm:mb-12">
          <div className="space-y-3">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-blue-50 text-[#345E85] flex items-center justify-center shadow-sm">
                <Navigation className="w-6 h-6 sm:w-7 sm:h-7" />
              </div>
              <h1 className="text-2xl sm:text-4xl md:text-5xl font-black text-[#0f172a] tracking-tight">
                Live <span className="text-[#345E85]">Tracking</span>
              </h1>
            </div>
            <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest sm:tracking-[0.2em] max-w-xl">
              Track your shipments and plan delivery routes
            </p>
          </div>

          <button className="flex items-center justify-center gap-2 px-6 sm:px-8 py-3 sm:py-4 bg-[#345E85] text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-900/10 hover:bg-slate-800 transition-all w-full md:w-auto">
            <Plus className="w-4 h-4" />
            New Tracking
          </button>
        </div>

        {/* Premium Navigation Tabs */}
        <div className="bg-slate-50 border border-slate-100 rounded-3xl sm:rounded-[2rem] p-1.5 sm:p-2 mb-8 sm:mb-10 shadow-inner max-w-full overflow-hidden">
          <nav className="flex items-center gap-1 overflow-x-auto scrollbar-hide">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={cn(
                    "px-4 sm:px-6 py-2.5 sm:py-3 rounded-2xl sm:rounded-[1.5rem] text-[9px] sm:text-[10px] font-black uppercase tracking-widest flex items-center gap-2 sm:gap-2.5 transition-all duration-300 whitespace-nowrap flex-1 md:flex-none justify-center md:justify-start",
                    isActive
                      ? "bg-white text-[#345E85] shadow-md border border-slate-200"
                      : "text-slate-400 hover:text-slate-600 hover:bg-white/50"
                  )}
                >
                  <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                  <TranslatedText text={tab.label} />
                </button>
              );
            })}
          </nav>
        </div>

        {/* Main Content Container */}
        <div className="bg-white rounded-3xl sm:rounded-[2.5rem] border border-slate-100 shadow-xl overflow-hidden min-h-[500px] sm:min-h-[600px] animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="p-4 sm:p-8 md:p-12">
            {activeTab === "tracking" && (
              <Suspense fallback={
                <div className="flex flex-col items-center justify-center h-64 gap-4">
                  <Loader2 className="animate-spin text-[#345E85]" size={32} />
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Loading Tracking Info...</p>
                </div>
              }>
                <Tracking />
              </Suspense>
            )}
            {activeTab === "routes" && (
              <Suspense fallback={<div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-4 border-slate-200 border-t-[#345E85]"></div></div>}>
                <RoutesPage />
              </Suspense>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UnifiedTrackingManagement;
