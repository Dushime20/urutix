import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  FileText,
  Box,
  Truck,
  CreditCard,
  FolderOpen,
} from "lucide-react";
import DocumentsPage from "@/pages/DocumentsPage";
import { cn } from "@/utils/cn";

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
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">
            Document Management
          </h1>
          <p className="text-gray-600 mt-1">
            Manage all your cargo, trip, and financial documents
          </p>
        </div>

        {/* Navigation Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={cn(
                  "relative bg-white rounded-lg border-2 p-6 text-left transition-all duration-200 hover:shadow-lg",
                  isActive
                    ? "border-blue-500 bg-blue-50 shadow-md"
                    : "border-gray-200 hover:border-gray-300"
                )}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <div
                        className={cn(
                          "p-3 rounded-lg",
                          isActive
                            ? "bg-blue-100 text-blue-600"
                            : "bg-gray-100 text-gray-600"
                        )}
                      >
                        <Icon className="w-6 h-6" />
                      </div>
                      <div>
                        <h3
                          className={cn(
                            "text-lg font-semibold",
                            isActive ? "text-blue-900" : "text-gray-900"
                          )}
                        >
                          {tab.label}
                        </h3>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      {tab.description}
                    </p>
                  </div>
                </div>
                {isActive && (
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-500 rounded-b-lg" />
                )}
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="p-6 pt-6">
            {/* DocumentsPage will read entityType from URL params */}
            <DocumentsPage />
          </div>
        </div>
      </div>
    </div>
  );
};

export default UnifiedDocumentManagement;

