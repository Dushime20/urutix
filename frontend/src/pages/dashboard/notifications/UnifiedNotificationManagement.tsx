import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Bell,
  Settings,
  Box,
  CreditCard,
  MessageSquare,
} from "lucide-react";
import NotificationsPage from "@/pages/NotificationsPage";
import { cn } from "@/utils/cn";
import logoUrutiX from "@/assets/logo-urutix.svg";

type TabType = "all" | "system" | "cargo" | "financial";

const UnifiedNotificationManagement = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Determine initial tab based on route and query params
  const getInitialTab = (): TabType => {
    const searchParams = new URLSearchParams(location.search);
    const category = searchParams.get("category");
    if (category === "SYSTEM") return "system";
    if (category === "CARGO") return "cargo";
    if (category === "FINANCIAL") return "financial";
    return "all";
  };

  const [activeTab, setActiveTab] = useState<TabType>(getInitialTab());

  // Update tab when route changes
  useEffect(() => {
    const tab = getInitialTab();
    setActiveTab(tab);
  }, [location.pathname, location.search]);

  // Update route when tab changes (for navigation)
  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    // Extract base path (either /dashboard or /cargo-owner)
    const pathParts = location.pathname.split("/").filter(Boolean);
    const basePath = pathParts[0] ? `/${pathParts[0]}` : "/dashboard";

    let categoryParam = "";
    if (tab === "system") {
      categoryParam = "?category=SYSTEM";
    } else if (tab === "cargo") {
      categoryParam = "?category=CARGO";
    } else if (tab === "financial") {
      categoryParam = "?category=FINANCIAL";
    }

    navigate(`${basePath}/notification-center${categoryParam}`, { replace: true });
  };

  const tabs = [
    {
      id: "all" as TabType,
      label: "All Notifications",
      icon: Bell,
      description: "Manage all notifications and alerts",
    },
    {
      id: "system" as TabType,
      label: "System Notifications",
      icon: Settings,
      description: "Platform and system updates",
    },
    {
      id: "cargo" as TabType,
      label: "Cargo Notifications",
      icon: Box,
      description: "Cargo status and delivery updates",
    },
    {
      id: "financial" as TabType,
      label: "Financial Alerts",
      icon: CreditCard,
      description: "Payment and financial alerts",
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
            Communication & Notifications
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Manage all your notifications and alerts
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
            {/* NotificationsPage will read category from URL query params */}
            <NotificationsPage />
          </div>
        </div>
      </div>
    </div>
  );
};

export default UnifiedNotificationManagement;

