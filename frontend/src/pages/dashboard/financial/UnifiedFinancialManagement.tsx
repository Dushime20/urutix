import { useState, useEffect, lazy, Suspense } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  CreditCard,
  DollarSign,
  Activity,
  Calculator,
  Plus,
  Wallet,
} from "lucide-react";
import Payments from "@/pages/Payments";
import EnhancedLoanRequestsPage from "@/pages/EnhancedLoanRequestsPage";
// Dynamically import heavy page to reduce initial bundle size
// Truck owner specific financial management
const TruckOwnerFinancialManagement = lazy(() => import("@/components/FleetDashboard/TruckOwnerFinancialManagement"));
const TripCostAnalysis = lazy(() => import("@/components/FleetDashboard/TripCostAnalysis"));
const CargoOwnerPayment = lazy(() => import("@/components/CargoOwnerPayment/CargoOwnerPayment"));
const FinancialInformation = lazy(() => import("@/components/CargoOwnerPayment/FinancialInformation"));
import { cn } from "@/utils/cn";
import logoUrutiX from "@/assets/logo-urutix.svg";
import { TranslatedText } from "@/components/translated-text";

type TabType = "overview" | "payments" | "payment" | "expenses" | "loans" | "cost-analysis" | "financial-info";

const FinancialDashboard = lazy(() => import("@/pages/dashboard/financial/FinancialDashboard"));
const ExpenseManagement = lazy(() => import("@/components/FinancialManagement/ExpenseManagement"));

const UnifiedFinancialManagement = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Determine initial tab based on route
  const getInitialTab = (): TabType => {
    if (location.pathname.includes("/overview")) return "overview";
    if (location.pathname.includes("/loan-requests")) return "loans";
    if (location.pathname.includes("/payment")) return "payment";
    if (location.pathname.includes("/cost-analysis")) return "cost-analysis";
    if (location.pathname.includes("/financial-info")) return "financial-info";
    if (location.pathname.includes("/expenses")) return "expenses";
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

    if (tab === "overview") {
      navigate(`${basePath}/overview`, { replace: true });
    } else if (tab === "loans") {
      navigate(`${basePath}/loan-requests`, { replace: true });
    } else if (tab === "payment") {
      navigate(`${basePath}/payment`, { replace: true });
    } else if (tab === "cost-analysis") {
      navigate(`${basePath}/cost-analysis`, { replace: true });
    } else if (tab === "expenses") {
      navigate(`${basePath}/expenses`, { replace: true });
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
      id: "overview" as TabType,
      label: "Overview",
      icon: Activity,
      description: "Financial analytics and performance metrics",
    },
    {
      id: "payments" as TabType,
      label: "Payments",
      icon: CreditCard,
      description: "Manage payments and transactions",
    },
    {
      id: "expenses" as TabType,
      label: "Expenses",
      icon: Calculator,
      description: "Track and manage all business expenses",
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
    // Add Financial Information tab for cargo owners, lenders and fleet users
    ...((location.pathname.includes("/cargo-owner") || location.pathname.includes("/lender") || location.pathname.includes("/fleet")) ? [{
      id: "financial-info" as TabType,
      label: "Payment Methods",
      icon: Wallet,
      description: "Manage your payment methods",
    }] : []),
    {
      id: "loans" as TabType,
      label: "Loan Requests",
      icon: DollarSign,
      description: "Manage cargo-based loan requests",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 transition-colors duration-200 relative">
      {/* Background Logo */}
      <img
        src={logoUrutiX}
        alt="UrutiX Logo Background"
        className="pointer-events-none select-none fixed inset-0 w-full h-full object-cover opacity-10 dark:opacity-5 z-0"
        style={{ objectPosition: 'center' }}
      />
      <div className="max-w-[1600px] mx-auto p-4 sm:p-8 md:p-12 relative z-10">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 sm:gap-8 mb-8 sm:mb-12">
          <div className="space-y-2 sm:space-y-3">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-blue-50 dark:bg-blue-900/20 text-[#345E85] dark:text-blue-400 flex items-center justify-center shadow-sm">
                <Wallet className="w-6 h-6 sm:w-7 sm:h-7" />
              </div>
              <h1 className="text-2xl sm:text-4xl md:text-5xl font-black text-[#0f172a] dark:text-white tracking-tight">
                Financial <span className="text-[#345E85] dark:text-blue-400">Hub</span>
              </h1>
            </div>
            <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest sm:tracking-[0.2em] max-w-xl">
              Precision capital management & transaction lifecycle auditing
            </p>
          </div>

          <div className="flex items-center justify-between md:justify-end gap-3 bg-slate-50 dark:bg-slate-900/50 p-1.5 sm:p-2 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-inner w-full md:w-auto">
            <div className="px-3 sm:px-4 py-1.5 sm:py-2 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 flex-1 md:flex-none">
              <div className="text-[9px] sm:text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Active Balance</div>
              <div className="text-base sm:text-lg font-black text-[#0f172a] dark:text-white">$42,500.00</div>
            </div>
            <button className="p-3 sm:p-4 bg-[#345E85] dark:bg-blue-600 text-white rounded-xl hover:bg-slate-800 dark:hover:bg-blue-700 transition-all shadow-lg shadow-blue-900/10 flex-shrink-0">
              <Plus className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Premium Navigation Tabs */}
        <div className="bg-slate-50 dark:bg-gray-800/50 border border-slate-100 dark:border-gray-700 rounded-2xl sm:rounded-[2rem] p-1.5 sm:p-2 mb-8 sm:mb-10 shadow-inner max-w-full overflow-hidden transition-colors">
          <nav className="flex items-center gap-1 overflow-x-auto scrollbar-hide">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={cn(
                    "px-4 sm:px-6 py-2.5 sm:py-3 rounded-[1.25rem] sm:rounded-[1.5rem] text-[9px] sm:text-[10px] font-black uppercase tracking-widest flex items-center gap-2 sm:gap-2.5 transition-all duration-300 whitespace-nowrap flex-1 md:flex-none justify-center md:justify-start",
                    isActive
                      ? "bg-white dark:bg-slate-800 text-[#345E85] dark:text-blue-400 shadow-md border border-slate-200 dark:border-slate-700"
                      : "text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-white/50 dark:hover:bg-slate-800/50"
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
        <div className="bg-white dark:bg-slate-900 rounded-3xl sm:rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-xl overflow-hidden min-h-[500px] sm:min-h-[600px] animate-in fade-in slide-in-from-bottom-4 duration-500 transition-colors">
          <div className="p-4 sm:p-8 md:p-12">
            {activeTab === "overview" && (
              <Suspense fallback={<div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-4 border-slate-200 border-t-[#345E85]"></div></div>}>
                <FinancialDashboard />
              </Suspense>
            )}
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
            {activeTab === "expenses" && (
              <Suspense fallback={<div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-4 border-slate-200 border-t-[#345E85]"></div></div>}>
                <ExpenseManagement />
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
          </div>
        </div>
      </div>
    </div>
  );
};

export default UnifiedFinancialManagement;
