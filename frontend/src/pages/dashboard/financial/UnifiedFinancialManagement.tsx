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
      // For cargo-owner, use /payments; for others, use /financial
      if (basePath === "/cargo-owner") {
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
  
  // Translate tab labels
  const getTranslatedLabel = (label: string) => label;

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
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            <TranslatedText text="Financial Management" />
          </h1>
          <p className="text-sm text-gray-600">
            <TranslatedText text="Manage payments, loans, and financial reports" />
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200/60 mb-6 overflow-hidden">
          <nav className="flex space-x-1 p-1 bg-gray-50/50">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={cn(
                    "px-5 py-3 rounded-lg text-sm font-semibold flex items-center gap-2 transition-all duration-200",
                    isActive
                      ? "bg-white text-primary-600 shadow-sm border border-primary-200"
                      : "text-gray-600 hover:text-gray-900 hover:bg-white/50"
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
        <div className="bg-white rounded-xl border border-gray-200/60 shadow-sm">
          <div className="p-6">
            {activeTab === "payments" && (
              location.pathname.includes("/fleet") ? (
                <Suspense fallback={<div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-600"></div></div>}>
                  <TruckOwnerFinancialManagement />
                </Suspense>
              ) : (
                <Payments />
              )
            )}
            {activeTab === "payment" && (
              <Suspense fallback={<div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-600"></div></div>}>
                <CargoOwnerPayment />
              </Suspense>
            )}
            {activeTab === "cost-analysis" && (
              <Suspense fallback={<div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-600"></div></div>}>
                <TripCostAnalysis />
              </Suspense>
            )}
            {activeTab === "loans" && <EnhancedLoanRequestsPage />}
            {activeTab === "financial-info" && (
              <Suspense fallback={<div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-600"></div></div>}>
                <FinancialInformation />
              </Suspense>
            )}
            {activeTab === "reports" && (
              <Suspense fallback={<div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-600"></div></div>}>
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

