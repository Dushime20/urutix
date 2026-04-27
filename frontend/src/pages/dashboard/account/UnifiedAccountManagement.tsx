import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  User,
  Settings,
} from "lucide-react";
import Profile from "@/pages/Profile";
import SettingsPage from "@/pages/Settings";
import { cn } from "@/utils/cn";
import logoUrutiX from "@/assets/logo-urutix.svg";
import { TranslatedText } from "@/components/translated-text";
import { useAuth } from "@/contexts/AuthContext";
import TruckOwnerProfilePage from "@/pages/TruckOwnerProfilePage";
import TruckOwnerSettingsPage from "@/pages/TruckOwnerSettingsPage";

type TabType = "profile" | "settings";

const UnifiedAccountManagement = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  // Determine initial tab based on route
  const getInitialTab = (): TabType => {
    if (location.pathname.includes("/settings")) return "settings";
    return "profile";
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

    if (tab === "settings") {
      navigate(`${basePath}/settings`, { replace: true });
    } else {
      navigate(`${basePath}/profile`, { replace: true });
    }
  };

  const tabs = [
    {
      id: "profile" as TabType,
      label: "Profile",
      icon: User,
      description: "Manage your profile information",
    },
    {
      id: "settings" as TabType,
      label: "Settings",
      icon: Settings,
      description: "Account settings and preferences",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 relative transition-colors duration-300">
      {/* Background Logo */}
      <img
        src={logoUrutiX}
        alt="UrutiX Logo Background"
        className="pointer-events-none select-none fixed inset-0 w-full h-full object-cover opacity-10 dark:opacity-5 z-0 transition-opacity duration-300"
        style={{ objectPosition: 'center' }}
      />
      <div className="max-w-[1600px] mx-auto p-4 sm:p-8 md:p-12 relative z-10">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 sm:gap-8 mb-8 sm:mb-12">
          <div className="space-y-2 sm:space-y-3">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center shadow-sm transition-colors duration-300">
                <User className="w-6 h-6 sm:w-7 sm:h-7" />
              </div>
              <h1 className="text-2xl sm:text-4xl md:text-5xl font-black text-[#0f172a] dark:text-slate-100 tracking-tight transition-colors duration-300">
                Account <span className="text-slate-500 dark:text-slate-400 transition-colors duration-300">& Settings</span>
              </h1>
            </div>
            <p className="text-[10px] sm:text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest sm:tracking-[0.2em] max-w-xl transition-colors duration-300">
              Personalize your identity & configure platform preferences
            </p>
          </div>

          <div className="flex items-center justify-between md:justify-end gap-3 bg-slate-50 dark:bg-slate-900 p-1.5 sm:p-2 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-inner w-full md:w-auto transition-colors duration-300">
            <div className="px-3 sm:px-4 py-1.5 sm:py-2 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 flex-1 md:flex-none transition-colors duration-300">
              <div className="text-[9px] sm:text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest transition-colors duration-300">Account Status</div>
              <div className="text-base sm:text-lg font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-tighter transition-colors duration-300">VERIFIED</div>
            </div>
          </div>
        </div>

        {/* Premium Navigation Tabs */}
        <div className="bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl sm:rounded-[2rem] p-1.5 sm:p-2 mb-8 sm:mb-10 shadow-inner max-w-full overflow-hidden transition-colors duration-300">
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
          <div className="">
            {activeTab === "profile" && (user?.role === "TRUCK_OWNER" ? (
              <TruckOwnerProfilePage />
            ) : (
              <div className="p-4 sm:p-8"><Profile /></div>
            ))}
            {activeTab === "settings" && (user?.role === "TRUCK_OWNER" ? (
              <TruckOwnerSettingsPage />
            ) : (
              <div className="p-4 sm:p-8"><SettingsPage /></div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UnifiedAccountManagement;

