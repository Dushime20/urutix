import { useState, useEffect, lazy, Suspense } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  CreditCard,
  FileText,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Activity,
  Calculator,
  Plus,
  Wallet,
} from "lucide-react";
import Payments from "@/pages/Payments";
import EnhancedLoanRequestsPage from "@/pages/EnhancedLoanRequestsPage";
// Dynamically import heavy page to reduce initial bundle size
const FinancialReportsPage = lazy(() => import("@/pages/FinancialReportsPage"));
// Truck owner specific financial dashboard
const TruckOwnerFinancialDashboard = lazy(() => import("@/components/FleetDashboard/TruckOwnerFinancialDashboard"));
const TruckOwnerFinancialManagement = lazy(() => import("@/components/FleetDashboard/TruckOwnerFinancialManagement"));
const TripCostAnalysis = lazy(() => import("@/components/FleetDashboard/TripCostAnalysis"));
const CargoOwnerPayment = lazy(() => import("@/components/CargoOwnerPayment/CargoOwnerPayment"));
const FinancialInformation = lazy(() => import("@/components/CargoOwnerPayment/FinancialInformation"));
import { cn } from "@/utils/cn";
import logoUrutiX from "@/assets/logo-urutix.svg";
import { TranslatedText } from "@/components/translated-text";

type TabType = "payments" | "payment" | "loans" | "reports" | "cost-analysis" | "financial-info";

const UnifiedFinancialManagement = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Determine initial tab based on route
  const getInitialTab = (): TabType => {
    if (location.pathname.includes("/loan-requests")) return "loans";
    if (location.pathname.includes("/payment")) return "payment";
    if (location.pathname.includes("/reports")) return "reports";
    if (location.pathname.includes("/cost-analysis")) return "cost-analysis";
    if (location.pathname.includes("/financial-info")) return "financial-info";
    return "payments";
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
    // Extract base path (either /dashboard, /dashboard/fleet, or /cargo-owner)
    const pathParts = location.pathname.split("/").filter(Boolean);
    let basePath = "/dashboard";

    // Check if we're in fleet dashboard
    if (pathParts.includes("fleet")) {
      basePath = "/dashboard/fleet";
    } else if (pathParts[0]) {
      basePath = `/${pathParts[0]}`;
    }

    if (tab === "loans") {
      navigate(`${basePath}/loan-requests`, { replace: true });
    } else if (tab === "payment") {
      navigate(`${basePath}/payment`, { replace: true });
    } else if (tab === "reports") {
      navigate(`${basePath}/reports`, { replace: true });
    } else if (tab === "cost-analysis") {
      navigate(`${basePath}/cost-analysis`, { replace: true });
    } else if (tab === "financial-info") {
      navigate(`${basePath}/financial-info`, { replace: true });
    } else {
      // For cargo-owner and dashboard, use /payments; for others (like fleet), use /financial
      if (basePath === "/cargo-owner" || basePath === "/dashboard") {
        navigate(`${basePath}/payments`, { replace: true });
      } else {
        navigate(`${basePath}/financial`, { replace: true });
      }
    }
  };

  const tabs = [
    {
      id: "payments" as TabType,
      label: "Payments",
      icon: CreditCard,
      description: "Manage payments and transactions",
    },
    // Add Payment tab for cargo owners (under Loan Requests section)
    ...(location.pathname.includes("/cargo-owner") ? [{
      id: "payment" as TabType,
      label: "Payment",
      icon: DollarSign,
      description: "Pay for accepted cargo loads",
    }] : []),
    ...(location.pathname.includes("/fleet") ? [{
      id: "cost-analysis" as TabType,
      label: "Cost Analysis",
      icon: Calculator,
      description: "Analyze trip costs and profitability",
    }] : []),
    // Add Financial Information tab for cargo owners and lenders
    ...((location.pathname.includes("/cargo-owner") || location.pathname.includes("/lender")) ? [{
      id: "financial-info" as TabType,
      label: "Financial Information",
      icon: CreditCard,
      description: "Manage your payment information",
    }] : []),
    {
      id: "loans" as TabType,
      label: "Loan Requests",
      icon: DollarSign,
      description: "Manage cargo-based loan requests",
    },
    {
      id: "reports" as TabType,
      label: "Financial Reports",
      icon: FileText,
      description: "View financial reports and analytics",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 relative">
      {/* Background Logo */}
      <img
        src={logoUrutiX}
        alt="UrutiX Logo Background"
        className="pointer-events-none select-none fixed inset-0 w-full h-full object-cover opacity-10 z-0"
        style={{ objectPosition: 'center' }}
      />
      <div className="max-w-[1600px] mx-auto p-8 md:p-12 relative z-10">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12">
          <div className="space-y-3">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-sm">
                <Wallet className="w-7 h-7" />
              </div>
              <h1 className="text-4xl md:text-5xl font-black text-[#0f172a] tracking-tight">
                Financial <span className="text-emerald-600">Hub</span>
              </h1>
            </div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] max-w-xl">
              Precision capital management & transaction lifecycle auditing
            </p>
          </div>

          <div className="flex items-center gap-3 bg-slate-50 p-2 rounded-2xl border border-slate-100 shadow-inner">
            <div className="px-4 py-2 bg-white rounded-xl shadow-sm border border-slate-100">
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Balance</div>
              <div className="text-lg font-black text-[#0f172a]">$42,500.00</div>
            </div>
            <button className="p-4 bg-[#345E85] text-white rounded-xl hover:bg-slate-800 transition-all shadow-lg shadow-blue-900/10">
              <Plus className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Premium Navigation Tabs */}
        <div className="bg-slate-50 border border-slate-100 rounded-[2rem] p-2 mb-10 shadow-inner max-w-fit mx-auto md:mx-0">
          <nav className="flex items-center gap-1 overflow-x-auto scrollbar-hide">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={cn(
                    "px-6 py-3 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest flex items-center gap-2.5 transition-all duration-300 whitespace-nowrap",
                    isActive
                      ? "bg-white text-[#345E85] shadow-md border border-slate-200"
                      : "text-slate-400 hover:text-slate-600 hover:bg-white/50"
                  )}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <TranslatedText text={tab.label} />
                </button>
              );
            })}
          </nav>
        </div>

        {/* Main Content Container */}
        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl overflow-hidden min-h-[600px] animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="p-8 md:p-12">
            {activeTab === "payments" && (
              location.pathname.includes("/fleet") ? (
                <Suspense fallback={<div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-4 border-slate-200 border-t-[#345E85]"></div></div>}>
                  <TruckOwnerFinancialManagement />
                </Suspense>
              ) : (
                <Payments />
              )
            )}
            {activeTab === "payment" && (
              <Suspense fallback={<div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-4 border-slate-200 border-t-[#345E85]"></div></div>}>
                <CargoOwnerPayment />
              </Suspense>
            )}
            {activeTab === "cost-analysis" && (
              <Suspense fallback={<div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-4 border-slate-200 border-t-[#345E85]"></div></div>}>
                <TripCostAnalysis />
              </Suspense>
            )}
            {activeTab === "loans" && <EnhancedLoanRequestsPage />}
            {activeTab === "financial-info" && (
              <Suspense fallback={<div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-4 border-slate-200 border-t-[#345E85]"></div></div>}>
                <FinancialInformation />
              </Suspense>
            )}
            {activeTab === "reports" && (
              <Suspense fallback={<div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-4 border-slate-200 border-t-[#345E85]"></div></div>}>
                <FinancialReportsPage />
              </Suspense>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UnifiedFinancialManagement;
