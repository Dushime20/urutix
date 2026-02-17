import { useState, useEffect, lazy, Suspense } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  MapPin,
  Route,
  Navigation,
  Loader2
} from "lucide-react";
// Dynamically import heavy page to reduce initial bundle size
const Tracking = lazy(() => import("@/pages/Tracking"));
import RoutesPage from "@/pages/Routes";
import { cn } from "@/utils/cn";

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
    // Extract base path (either /dashboard or /cargo-owner)
    const pathParts = location.pathname.split("/").filter(Boolean);
    const basePath = pathParts[0] ? `/${pathParts[0]}` : "/dashboard";

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
    <div className="space-y-12 max-w-[1600px] mx-auto animate-in fade-in duration-700">
      {/* Header - Premium Enlite Prime Style */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center">
              <Navigation className="w-6 h-6 text-[#345E85]" />
            </div>
            <h1 className="text-4xl font-black text-[#0f172a] tracking-tight">Logistics Intelligence</h1>
          </div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest max-w-xl">
            Real-time geospatial tracking and strategic route optimization
          </p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-white p-2 rounded-[2rem] border border-slate-100 shadow-sm">
          <nav className="flex gap-1 p-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={cn(
                    "px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all",
                    isActive
                      ? "bg-[#345E85] text-white shadow-lg shadow-blue-900/10"
                      : "text-slate-400 hover:text-slate-600 hover:bg-slate-50"
                  )}
                >
                  <Icon size={14} />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm min-h-[600px]">
          {activeTab === "tracking" && (
            <Suspense fallback={
              <div className="flex flex-col items-center justify-center h-64 gap-4">
                <Loader2 className="animate-spin text-[#345E85]" size={32} />
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Initializing Tracking Nexus...</p>
              </div>
            }>
              <Tracking />
            </Suspense>
          )}
          {activeTab === "routes" && <RoutesPage />}
        </div>
      </div>
    </div>
  );
};

export default UnifiedTrackingManagement;

