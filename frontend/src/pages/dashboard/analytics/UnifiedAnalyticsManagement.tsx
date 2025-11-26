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
    <div className="space-y-4">
      {/* Header */}
      <div className="mb-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900 mb-1">Analytics & Reports</h1>
            <p className="text-xs text-gray-600">Track performance, generate reports, and view history</p>
          </div>
        </div>
      </div>

      {/* Navigation Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={cn(
                "relative bg-white rounded-lg border p-3.5 transition-all duration-200 hover:shadow-sm group text-left",
                isActive
                  ? "border-gray-300 shadow-sm bg-gray-50"
                  : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
              )}
            >
              <div className="flex items-start justify-between mb-2">
                <div
                  className={cn(
                    "p-1.5 rounded-md transition-colors",
                    isActive
                      ? "bg-gray-100 text-gray-700"
                      : "bg-gray-50 text-gray-500 group-hover:bg-gray-100 group-hover:text-gray-700"
                  )}
                >
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <h3
                className={cn(
                  "text-sm font-semibold mb-1",
                  isActive ? "text-gray-900" : "text-gray-900"
                )}
              >
                {tab.label}
              </h3>
              <p className={cn(
                "text-xs leading-tight",
                isActive ? "text-gray-600" : "text-gray-500"
              )}>
                {tab.description}
              </p>
              {isActive && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-400 rounded-b-lg" />
              )}
            </button>
          );
        })}
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
  );
};

export default UnifiedAnalyticsManagement;

