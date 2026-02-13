import { useState, useEffect, lazy, Suspense } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  BarChart3,
  FileText,
  History,
} from "lucide-react";
import AdminPageLayout from "@/components/Admin/AdminPageLayout";
// Dynamically import heavy pages to reduce initial bundle size
const Analytics = lazy(() => import("@/pages/Analytics"));
const FinancialReportsPage = lazy(() => import("@/pages/FinancialReportsPage"));
const AdminHistory = lazy(() => import("@/pages/AdminHistory"));
import { cn } from "@/utils/cn";
import { TranslatedText } from "@/components/translated-text";

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

  // For history, we'll use the admin history component
  const renderHistoryContent = () => {
    return (
      <Suspense fallback={<div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-500"></div></div>}>
        <AdminHistory />
      </Suspense>
    );
  };

  return (
    <AdminPageLayout
      title="Analytics & Reports"
      description="Track performance, generate reports, and view history"
    >
      {/* Navigation Tabs */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-md mb-6 overflow-hidden">
        <nav className="flex space-x-1 p-2 overflow-x-auto scrollbar-hide scroll-smooth">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={cn(
                  "px-3 sm:px-4 md:px-5 py-3 sm:py-3.5 rounded-lg text-sm sm:text-base font-semibold flex items-center gap-2 sm:gap-2.5 md:gap-3 transition-all whitespace-nowrap flex-shrink-0 touch-manipulation min-h-[48px] sm:min-h-0",
                  isActive
                    ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg transform scale-105"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                )}
              >
                <Icon className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                <span className="hidden sm:inline"><TranslatedText text={tab.label} /></span>
                <span className="sm:hidden"><TranslatedText text={tab.label.split(' ')[0]} /></span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-lg p-4 sm:p-6">
        {activeTab === "analytics" && (
          <Suspense fallback={<div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-500"></div></div>}>
            <Analytics />
          </Suspense>
        )}
        {activeTab === "reports" && (
          <Suspense fallback={<div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-500"></div></div>}>
            <FinancialReportsPage />
          </Suspense>
        )}
        {activeTab === "history" && renderHistoryContent()}
      </div>
    </AdminPageLayout>
  );
};

export default UnifiedAnalyticsManagement;

