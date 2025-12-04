import { useState, useEffect, lazy, Suspense } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  MapPin,
  Route,
  Navigation,
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
    <div className="min-h-screen bg-gray-50 relative">
      {/* Background Logo */}
      <img 
        src={logoUrutiX} 
        alt="UrutiX Logo Background" 
        className="pointer-events-none select-none fixed inset-0 w-full h-full object-cover opacity-10 z-0" 
        style={{objectPosition: 'center'}} 
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 relative z-10">
        {/* Header */}
        <div className="mb-4">
          <h1 className="text-2xl font-bold text-gray-900">
            <TranslatedText text="Maps & Tracking" />
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            <TranslatedText text="Track shipments in real-time and plan optimal routes" />
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white rounded-lg border border-gray-200 mb-4">
          <nav className="flex space-x-1 p-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={cn(
                    "px-4 py-2.5 rounded-md text-sm font-medium flex items-center gap-2 transition-all",
                    isActive
                      ? "bg-gray-100 text-gray-900 border border-gray-300"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  <span><TranslatedText text={tab.label} /></span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="p-4">
            {activeTab === "tracking" && (
              <Suspense fallback={<div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div></div>}>
                <Tracking />
              </Suspense>
            )}
            {activeTab === "routes" && <RoutesPage />}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UnifiedTrackingManagement;

