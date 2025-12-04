import { useState, useEffect, lazy, Suspense } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  BarChart3,
  FileText,
  History,
} from "lucide-react";
// Dynamically import heavy pages to reduce initial bundle size
const Analytics = lazy(() => import("@/pages/Analytics"));
const FinancialReportsPage = lazy(() => import("@/pages/FinancialReportsPage"));
import CargoList from "@/pages/dashboard/cargos/list";
import { cn } from "@/utils/cn";
import logoUrutiX from "@/assets/logo-urutix.svg";

type TabType = "analytics" | "reports" | "history";

const UnifiedAnalyticsManagement = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Determine initial tab based on route
  const getInitialTab = (): TabType => {
    if (location.pathname.includes("/reports")) return "reports";
    if (location.pathname.includes("/history")) return "history";
    return "analytics";
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

    if (tab === "reports") {
      navigate(`${basePath}/reports`, { replace: true });
    } else if (tab === "history") {
      navigate(`${basePath}/history`, { replace: true });
    } else {
      navigate(`${basePath}/analytics`, { replace: true });
    }
  };

  const tabs = [
    {
      id: "analytics" as TabType,
      label: "Analytics",
      icon: BarChart3,
      description: "Track cargo performance and insights",
    },
    {
      id: "reports" as TabType,
      label: "Financial Reports",
      icon: FileText,
      description: "Generate and view financial reports",
    },
    {
      id: "history" as TabType,
      label: "History",
      icon: History,
      description: "View past shipments and transactions",
    },
  ];

  // For history, we'll use the cargo list component
  const renderHistoryContent = () => {
    // History uses the cargo list which can be filtered to show past shipments
    return <CargoList />;
  };

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
            Analytics & Reports
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Track performance, generate reports, and view history
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
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="p-4">
            {activeTab === "analytics" && (
              <Suspense fallback={<div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div></div>}>
                <Analytics />
              </Suspense>
            )}
            {activeTab === "reports" && (
              <Suspense fallback={<div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div></div>}>
                <FinancialReportsPage />
              </Suspense>
            )}
            {activeTab === "history" && renderHistoryContent()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UnifiedAnalyticsManagement;

