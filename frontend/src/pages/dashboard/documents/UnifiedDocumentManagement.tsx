import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  FileText,
  Box,
  Truck,
  CreditCard,
  FolderOpen,
} from "lucide-react";
import DocumentsPage from "../../DocumentsPage";
import { cn } from "../../../utils/cn";
import logoUrutiX from "../../../assets/logo-urutix.svg";
import { TranslatedText } from "../../../components/translated-text";

type TabType = "all" | "cargo" | "trip" | "financial";

const UnifiedDocumentManagement = () => {
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
            <TranslatedText text="Document Management" />
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            <TranslatedText text="Manage all your cargo, trip, and financial documents" />
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white rounded-lg border border-gray-200 mb-4 overflow-hidden">
          <nav className="flex space-x-1 p-1 overflow-x-auto scrollbar-hide scroll-smooth">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={cn(
                    "px-3 sm:px-4 py-2.5 rounded-md text-xs sm:text-sm font-medium flex items-center gap-1.5 sm:gap-2 transition-all whitespace-nowrap flex-shrink-0",
                    isActive
                      ? "bg-gray-100 text-gray-900 border border-gray-300"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                  )}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <span className="hidden sm:inline"><TranslatedText text={tab.label} /></span>
                  <span className="sm:hidden"><TranslatedText text={tab.label.split(' ')[0]} /></span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="p-6 pt-6">
            {/* Pass entityType to DocumentsPage based on active tab */}
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

