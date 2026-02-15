import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Star,
  Gift,
  TrendingUp,
  Award,
} from "lucide-react";
import UserRatings from "@/pages/UserRatings";
import UserRewards from "@/pages/UserRewards";
import UserScoring from "@/pages/UserScoring";
import { cn } from "@/utils/cn";
import logoUrutiX from "@/assets/logo-urutix.svg";
import { TranslatedText } from "@/components/translated-text";

type TabType = "ratings" | "rewards" | "scoring";

const UnifiedReputationManagement = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Determine initial tab based on route
  const getInitialTab = (): TabType => {
    if (location.pathname.includes("/rewards")) return "rewards";
    if (location.pathname.includes("/scoring")) return "scoring";
    return "ratings";
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

    if (tab === "rewards") {
      navigate(`${basePath}/rewards`, { replace: true });
    } else if (tab === "scoring") {
      navigate(`${basePath}/scoring`, { replace: true });
    } else {
      navigate(`${basePath}/ratings`, { replace: true });
    }
  };

  const tabs = [
    {
      id: "ratings" as TabType,
      label: "User Ratings",
      icon: Star,
      description: "View and manage ratings",
    },
    {
      id: "rewards" as TabType,
      label: "Rewards",
      icon: Gift,
      description: "Platform rewards and benefits",
    },
    {
      id: "scoring" as TabType,
      label: "Credit Scoring",
      icon: TrendingUp,
      description: "AI-powered credit analysis",
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 relative z-10">
        {/* Header */}
        <div className="mb-4">
          <h1 className="text-2xl font-bold text-gray-900">
            <TranslatedText text="Reputation & Rewards" />
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            <TranslatedText text="Manage your ratings, rewards, and credit scoring" />
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
                  <span><TranslatedText text={tab.label} /></span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="p-4">
            {activeTab === "ratings" && <UserRatings />}
            {activeTab === "rewards" && <UserRewards />}
            {activeTab === "scoring" && <UserScoring />}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UnifiedReputationManagement;

