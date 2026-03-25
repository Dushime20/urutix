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
      <div className="max-w-[1600px] mx-auto p-4 sm:p-8 md:p-12 relative z-10">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 sm:gap-8 mb-8 sm:mb-12">
          <div className="space-y-2 sm:space-y-3">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shadow-sm">
                <Award className="w-6 h-6 sm:w-7 sm:h-7" />
              </div>
              <h1 className="text-2xl sm:text-4xl md:text-5xl font-black text-[#0f172a] tracking-tight">
                Reputation <span className="text-amber-600">& Elite Hub</span>
              </h1>
            </div>
            <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest sm:tracking-[0.2em] max-w-xl">
              Performance-driven incentives & AI-powered credit scoring
            </p>
          </div>

          <div className="flex items-center justify-between md:justify-end gap-3 bg-slate-50 p-1.5 sm:p-2 rounded-2xl border border-slate-100 shadow-inner w-full md:w-auto">
            <div className="px-3 sm:px-4 py-1.5 sm:py-2 bg-white rounded-xl shadow-sm border border-slate-100 flex-1 md:flex-none">
              <div className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest">Global Rank</div>
              <div className="text-base sm:text-lg font-black text-[#0f172a]">TOP 5%</div>
            </div>
            <button className="p-3 sm:p-4 bg-[#345E85] text-white rounded-xl hover:bg-slate-800 transition-all shadow-lg shadow-blue-900/10 flex-shrink-0">
              <Star className="w-5 h-5 fill-current" />
            </button>
          </div>
        </div>

        {/* Premium Navigation Tabs */}
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
                    "px-4 sm:px-6 py-2.5 sm:py-3 rounded-[1.25rem] sm:rounded-[1.5rem] text-[9px] sm:text-[10px] font-black uppercase tracking-widest flex items-center gap-2 sm:gap-2.5 transition-all duration-300 whitespace-nowrap flex-1 md:flex-none justify-center md:justify-start",
                    isActive
                      ? "bg-white text-[#345E85] shadow-md border border-slate-200"
                      : "text-slate-400 hover:text-slate-600 hover:bg-white/50"
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
        <div className="bg-white rounded-3xl sm:rounded-[2.5rem] border border-slate-100 shadow-xl overflow-hidden min-h-[500px] sm:min-h-[600px] animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="p-4 sm:p-8 md:p-12">
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

