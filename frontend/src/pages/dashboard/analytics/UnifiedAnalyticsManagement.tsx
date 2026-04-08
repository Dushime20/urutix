import { useState, useEffect, lazy, Suspense } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  BarChart3,
  FileText,
  History,
  Activity,
  Plus,
} from "lucide-react";
// Dynamically import heavy pages to reduce initial bundle size
const Analytics = lazy(() => import("@/pages/Analytics"));
const FinancialReportsPage = lazy(() => import("@/pages/FinancialReportsPage"));
const AdminHistory = lazy(() => import("@/pages/AdminHistory"));
import { cn } from "@/utils/cn";
import { TranslatedText } from "@/components/translated-text";
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
      navigate(`${basePath}/analytics/operational`, { replace: true });
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
      <Suspense fallback={<div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-4 border-slate-200 border-t-[#345E85]"></div></div>}>
        <AdminHistory />
      </Suspense>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 relative">
      {/* Background Logo */}
      <img
        src={logoUrutiX}
        alt="UrutiX Logo Background"
        className="pointer-events-none select-none fixed inset-0 w-full h-full object-cover opacity-10 z-0"
        style={{ objectPosition: 'center' }}
      />
      <div className="max-w-[1600px] mx-auto p-4 sm:p-8 md:p-12 relative z-10">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8 sm:mb-10">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-blue-50 text-[#345E85] flex items-center justify-center shadow-sm">
                <Activity className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-[#0f172a] tracking-tight">
                Operations <span className="text-[#345E85]">Analytics</span>
              </h1>
            </div>
            <p className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest sm:tracking-[0.2em] max-w-xl">
              Real-time performance metrics & historical audit logs
            </p>
          </div>

          <button className="flex items-center justify-center gap-2 px-6 py-3 bg-[#345E85] text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-900/10 hover:bg-slate-800 transition-all w-full md:w-auto">
            <Plus className="w-4 h-4" />
            Generate Report
          </button>
        </div>

        {/* Premium Navigation Tabs */}
        <div className="bg-slate-100/50 border border-slate-200/60 rounded-2xl sm:rounded-3xl p-1 sm:p-1.5 mb-8 shadow-inner max-w-full overflow-hidden">
          <nav className="flex items-center gap-1 overflow-x-auto scrollbar-hide">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={cn(
                    "px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl text-[9px] sm:text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 sm:gap-2 transition-all duration-300 whitespace-nowrap flex-1 md:flex-none justify-center md:justify-start",
                    isActive
                      ? "bg-white text-[#345E85] shadow-sm border border-slate-200"
                      : "text-slate-400 hover:text-slate-600 hover:bg-white/50"
                  )}
                >
                  <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                  <TranslatedText text={tab.label} />
                </button>
              );
            })}
          </nav>
        </div>

        {/* Main Content Container */}
        <div className="bg-white rounded-3xl sm:rounded-[2.5rem] border border-slate-100 shadow-xl overflow-hidden min-h-[500px] sm:min-h-[600px] animate-in fade-in slide-in-from-bottom-4 duration-500 p-4 sm:p-8 md:p-12">
          {activeTab === "analytics" && (
            <Suspense fallback={<div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-4 border-slate-200 border-t-[#345E85]"></div></div>}>
              <Analytics />
            </Suspense>
          )}
          {activeTab === "reports" && (
            <Suspense fallback={<div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-4 border-slate-200 border-t-[#345E85]"></div></div>}>
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
