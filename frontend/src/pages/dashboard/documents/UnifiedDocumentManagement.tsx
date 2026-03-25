import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Box,
  Truck,
  CreditCard,
  FolderOpen,
  Plus,
} from "lucide-react";
import DocumentsPage from "../../DocumentsPage";
import { cn } from "../../../utils/cn";
import logoUrutiX from "../../../assets/logo-urutix.svg";
import { TranslatedText } from "../../../components/translated-text";
import { useAuth } from "../../../contexts/AuthContext";

type TabType = "all" | "cargo" | "trip" | "financial";

const UnifiedDocumentManagement = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Determine initial tab based on route
  const getInitialTab = (): TabType => {
    if (location.pathname.includes("/documents/CARGO")) return "cargo";
    if (location.pathname.includes("/documents/TRIP")) return "trip";
    if (location.pathname.includes("/documents/FINANCIAL")) return "financial";
    return "all";
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

    if (tab === "cargo") {
      navigate(`${basePath}/documents/CARGO`, { replace: true });
    } else if (tab === "trip") {
      navigate(`${basePath}/documents/TRIP`, { replace: true });
    } else if (tab === "financial") {
      navigate(`${basePath}/documents/FINANCIAL`, { replace: true });
    } else {
      navigate(`${basePath}/documents`, { replace: true });
    }
  };

  const tabs = [
    {
      id: "all" as TabType,
      label: "All Documents",
      icon: FolderOpen,
      description: "Manage all cargo and business documents",
    },
    {
      id: "cargo" as TabType,
      label: "Cargo Documents",
      icon: Box,
      description: "View cargo-specific documents",
    },
    {
      id: "trip" as TabType,
      label: "Trip Documents",
      icon: Truck,
      description: "Access trip-related documentation",
    },
    {
      id: "financial" as TabType,
      label: "Financial Documents",
      icon: CreditCard,
      description: "Invoices, contracts, and financial records",
    },
  ];

  const isCargoOwner = user?.role === 'CARGO_OWNER';

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
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 sm:gap-8 mb-8 sm:mb-12">
          <div className="space-y-2 sm:space-y-3">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shadow-sm">
                <FolderOpen className="w-6 h-6 sm:w-7 sm:h-7" />
              </div>
              <h1 className="text-2xl sm:text-4xl md:text-5xl font-black text-[#0f172a] tracking-tight">
                Document <span className="text-amber-600">Vault</span>
              </h1>
            </div>
            <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest sm:tracking-[0.2em] max-w-xl">
              Secure archival & real-time document verification system
            </p>
          </div>

          <button className="flex items-center justify-center gap-2 px-6 sm:px-8 py-3 sm:py-4 bg-[#345E85] text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-900/10 hover:bg-slate-800 transition-all w-full md:w-auto">
            <Plus className="w-4 h-4" />
            Upload Document
          </button>
        </div>

        {/* Premium Navigation Tabs - Only show if not Cargo Owner or if needed */}
        {!isCargoOwner && (
          <div className="bg-slate-50 border border-slate-100 rounded-2xl sm:rounded-[2rem] p-1.5 sm:p-2 mb-8 sm:mb-10 shadow-inner max-w-full overflow-hidden">
            <nav className="flex items-center gap-1 overflow-x-auto scrollbar-hide">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => handleTabChange(tab.id)}
                    className={cn(
                      "px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl sm:rounded-[1.5rem] text-[9px] sm:text-[10px] font-black uppercase tracking-widest flex items-center gap-2 sm:gap-2.5 transition-all duration-300 whitespace-nowrap flex-1 md:flex-none justify-center md:justify-start",
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
        )}

        {/* Main Content Container */}
        <div className="bg-white rounded-3xl sm:rounded-[2.5rem] border border-slate-100 shadow-xl overflow-hidden min-h-[500px] sm:min-h-[600px] animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="p-4 sm:p-8 md:p-12">
            <DocumentsPage
              key={activeTab}
              entityTypeOverride={
                activeTab === 'cargo' ? 'CARGO' :
                  activeTab === 'trip' ? 'TRIP' :
                    activeTab === 'financial' ? 'FINANCIAL' :
                      undefined
              }
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default UnifiedDocumentManagement;
