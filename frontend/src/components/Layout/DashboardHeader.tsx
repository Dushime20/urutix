import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LogOut, User, Menu, X, ChevronDown, Package, BarChart3, CreditCard, Settings, HelpCircle, Truck, Users, Route, DollarSign, Home, Wallet, Activity } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import CargoOwnerNotificationDropdown from '../notifications/CargoOwnerNotificationDropdown';
import ContextualHelp from '../Help/ContextualHelp';
import logoUrutiX from '../../assets/urutiX Logistics Logo (1).svg';
import { TranslatedText } from '../translated-text';
import TenantCreditBalance from '../CreditBalance/TenantCreditBalance';
import ThemeToggle from '../Theme/ThemeToggle';
import LanguageSwitcher from '../LanguageSwitcher';
import { motion, AnimatePresence } from 'framer-motion';

interface DashboardHeaderProps {
  children?: React.ReactNode;
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  const navRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const dropdownRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  // Role-based navigation items
  const navItems = useMemo(() => {
    const basePath = '/dashboard';

    if (user?.role === 'CARGO_RECEIVER') {
      return [
        { label: 'Overview', path: '/dashboard', icon: Home },
        { 
          label: 'Receiving Hub', 
          path: '/cargo-owner/cargos/my-cargos', 
          icon: Package,
          subItems: [
            { label: 'My Cargos', path: '/cargo-owner/cargos/my-cargos' },
            { label: 'Live Tracking', path: '/cargo-owner/tracking' },
          ]
        },
        { label: 'Settings', path: '/cargo-owner/settings', icon: Settings },
      ];
    }

    if (user?.role === 'CARGO_OWNER') {
      return [
        { label: 'Dashboard', path: basePath, icon: Home },
        {
          label: 'Supply Chain Hub',
          path: `${basePath}/cargos/list`,
          icon: Package,
          subItems: [
            { label: 'Create Payload', path: `${basePath}/cargos/create` },
            { label: 'Cargo Inventory', path: `${basePath}/cargos/list` },
            { label: 'Freight Bidding', path: `${basePath}/bidding` },
            { label: 'Live Tracking', path: `${basePath}/tracking` },
            { label: 'Multi-Modal Flow', path: `${basePath}/multi-modal` },
            { label: 'Receiver Directory', path: `${basePath}/receivers` },
            { label: 'Drafts & Templates', path: `${basePath}/cargos/list?status=DRAFT` },
            { label: 'Documents & Contracts', path: `${basePath}/documents` },
          ]
        },
        {
          label: 'Intelligence & Capital',
          path: `${basePath}/analytics`,
          icon: BarChart3,
          subItems: [
            { label: 'Neural Overview', path: `${basePath}/analytics` },
            { label: 'Operational Insights', path: `${basePath}/analytics/operational` },
            { label: 'Market Intelligence', path: `${basePath}/analytics/advanced` },
            { label: 'Capital Management', path: `${basePath}/financial` },
            { label: 'Freight Credits', path: `${basePath}/loan-requests` },
            { label: 'Invoice Vault', path: `${basePath}/invoices` },
            { label: 'Financial Analytics', path: `${basePath}/analytics/financial` },
          ]
        },
      ];
    }

    if (user?.role === 'BROKER') {
      return [
        { label: 'Dashboard', path: '/dashboard/broker', icon: Home },
        {
          label: 'Operations',
          path: '/dashboard/broker/loads',
          icon: Activity,
          subItems: [
            { label: 'My Loads', path: '/dashboard/broker/loads' },
            { label: 'Cargo Discovery', path: '/dashboard/broker/discovery' },
            { label: 'Bidding', path: '/dashboard/broker/bidding' },
            { label: 'Contracts', path: '/dashboard/broker/contracts' },
            { label: 'Tracking', path: '/dashboard/broker/tracking' },
            { label: 'Multi-Stop Loads', path: '/dashboard/broker/multi-stop' },
          ]
        },
        {
          label: 'Financials',
          path: '/dashboard/broker/commissions',
          icon: DollarSign,
          subItems: [
            { label: 'Commissions', path: '/dashboard/broker/commissions' },
            { label: 'Payout Requests', path: '/dashboard/broker/payouts' },
            { label: 'Escrow Management', path: '/dashboard/broker/escrow' },
            { label: 'Credit Assessment', path: '/dashboard/broker/credit-management' },
          ]
        },
        {
          label: 'Other',
          path: '#',
          icon: Menu,
          subItems: [
            { label: 'Profile', path: '/dashboard/broker/profile' },
            { label: 'Smart Matching', path: '/dashboard/broker/smart-matching' },
            { label: 'Market Intelligence', path: '/dashboard/broker/market-intelligence' },
            { label: 'Performance Analytics', path: '/dashboard/broker/analytics' },
            { label: 'Insurance Verification', path: '/dashboard/broker/insurance' },
            { label: 'Dispute Resolution', path: '/dashboard/broker/disputes' },
            { label: 'Document Vault', path: '/dashboard/broker/documents' },
          ]
        },
      ];
    }

    if (user?.role === 'DRIVER') {
      return [
        { label: 'Dashboard', path: '/dashboard/driver', icon: Home },
        {
          label: 'Mission Center',
          path: '/dashboard/driver/trips',
          icon: Route,
          subItems: [
            { label: 'My Assignments', path: '/dashboard/driver/trips' },
            { label: 'Live Mission tracking', path: '/dashboard/driver/tracking' },
            { label: 'Inspection & Cargo', path: '/dashboard/driver/cargo' },
            { label: 'Operational Announcements', path: '/dashboard/driver/announcements' },
          ]
        },
        {
          label: 'Fleet & Finance',
          path: '/dashboard/driver/truck',
          icon: Activity,
          subItems: [
            { label: 'My Truck Details', path: '/dashboard/driver/truck' },
            { label: 'Safety & Training', path: '/dashboard/driver/safety' },
            { label: 'Earnings Registry', path: '/dashboard/driver/earnings' },
            { label: 'Performance Metrics', path: '/dashboard/driver/analytics' },
            { label: 'Wallet & Advances', path: '/dashboard/driver/wallet' },
          ]
        },
        { label: 'Account', path: '/dashboard/driver/profile', icon: User },
      ];
    }

    if (user?.role === 'TRUCK_OWNER') {
      return [
        { label: 'Dashboard', path: '/dashboard/fleet', icon: Home },
        {
          label: 'Fleet & Personnel',
          path: '/dashboard/fleet/drivers',
          icon: Truck,
          subItems: [
            { label: 'Driver Directory', path: '/dashboard/fleet/drivers' },
            { label: 'Truck Inventory', path: '/dashboard/fleet/trucks' },
            { label: 'Fuel & Maintenance', path: '/dashboard/fleet/fuel' },
            { label: 'Safety Records', path: '/dashboard/fleet/safety' },
          ]
        },
        {
          label: 'Operations Hub',
          path: '/dashboard/trips',
          icon: Route,
          subItems: [
            { label: 'Active Trips', path: '/dashboard/trips' },
            { label: 'Freight Bidding', path: '/dashboard/fleet/bids' },
            { label: 'Route Planning', path: '/dashboard/fleet/routes' },
          ]
        },
        {
          label: 'Capital & Finance',
          path: '/dashboard/fleet/financial',
          icon: DollarSign,
          subItems: [
            { label: 'Settlement Desk', path: '/dashboard/fleet/financial' },
            { label: 'Line of Credit', path: '/dashboard/fleet/credits' },
            { label: 'Performance Analytics', path: '/dashboard/fleet/analytics' },
          ]
        },
      ];
    }

    if (user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN') {
      return [
        { label: 'Command Center', path: '/admin', icon: Home },
        {
          label: 'Operations Suite',
          path: '/admin/monitoring',
          icon: Activity,
          subItems: [
            { label: 'Network Monitoring', path: '/admin/monitoring' },
            { label: 'Bidding Oversight', path: '/admin/bidding' },
            { label: 'Resolution Center', path: '/admin/disputes' },
            { label: 'System Health', path: '/admin/health' },
          ]
        },
        {
          label: 'Governance',
          path: '/admin/users',
          icon: Users,
          subItems: [
            { label: 'IAM: User Directory', path: '/admin/users' },
            { label: 'RBAC: Role Management', path: '/admin/roles' },
            { label: 'Security Protocols', path: '/admin/security' },
            { label: 'Enhanced Permissions', path: '/admin/enhanced-permissions' },
          ]
        },
        {
          label: 'Enterprise Logic',
          path: '/admin/financial',
          icon: Settings,
          subItems: [
            { label: 'Financial Matrix', path: '/admin/financial' },
            { label: 'Intelligence Analytics', path: '/admin/analytics' },
            { label: 'Reporting Engine', path: '/admin/reports' },
            { label: 'Strategic Settings', path: '/admin/advanced-settings' },
            { label: 'System Configuration', path: '/admin/settings' },
            { label: 'Activity Forensics', path: '/admin/activity-logs' },
          ]
        },
      ];
    }

    if (user?.role === 'LENDER') {
      return [
        { label: 'Overview', path: '/lender', icon: Home },
        {
          label: 'Loan Desk',
          path: '/lender/requests',
          icon: Wallet,
          subItems: [
            { label: 'Pending Requests', path: '/lender/requests' },
            { label: 'Active Loan Book', path: '/lender/active' },
            { label: 'Disbursements', path: '/lender/disbursements' },
            { label: 'Repayment Tracking', path: '/lender/repayments' },
          ]
        },
        {
          label: 'Risk & Policies',
          path: '/lender/policies',
          icon: Users,
          subItems: [
            { label: 'Assessment Engine', path: '/lender/credit' },
            { label: 'Lending Policies', path: '/lender/policies' },
            { label: 'Borrower Directory', path: '/lender/borrowers' },
            { label: 'Transaction Vault', path: '/lender/history' },
          ]
        },
        {
          label: 'Analytics',
          path: '/lender/analytics',
          icon: BarChart3,
          subItems: [
            { label: 'Portfolio Analytics', path: '/lender/analytics' },
            { label: 'Risk Analysis', path: '/lender/risk' },
            { label: 'Interest Tracking', path: '/lender/interest' },
            { label: 'Financial Reports', path: '/lender/reports' },
          ]
        },
      ];
    }

    if (user?.role === 'TENANT_ADMIN') {
      return [
        { label: 'Command Desk', path: '/tenant-admin', icon: Home },
        {
          label: 'Core Ecosystem',
          path: '/tenant-admin/fleet',
          icon: Activity,
          subItems: [
            { label: 'Fleet Intelligence', path: '/tenant-admin/fleet' },
            { label: 'Logistic Flows', path: '/tenant-admin/routes' },
            { label: 'Partner Management', path: '/tenant-admin/truck-owners' },
            { label: 'Operational Insights', path: '/tenant-admin/analytics' },
            { label: 'Performance Reports', path: '/tenant-admin/reports' },
          ]
        },
        {
          label: 'Commercial & Settings',
          path: '/tenant-admin/financial',
          icon: DollarSign,
          subItems: [
            { label: 'Capital Dashboard', path: '/tenant-admin/financial' },
            { label: 'Subscription Deck', path: '/tenant-admin/subscription-plans' },
            { label: 'Purchase Credits', path: '/tenant-admin/purchase-credits' },
            { label: 'Transaction History', path: '/tenant-admin/billing' },
            { label: 'General Settings', path: '/tenant-admin/settings' },
          ]
        },
      ];
    }

    return [
      { label: 'Dashboard', path: '/dashboard', icon: Home },
      { label: 'All Cargos', path: '/dashboard/cargos', icon: Package },
      { label: 'Transactions', path: '/dashboard/payments', icon: CreditCard },
      { label: 'Support', path: '/dashboard/support', icon: HelpCircle },
    ];
  }, [user?.role]);

  const handleLogout = () => {
    setShowUserMenu(false);
    logout?.();
    navigate('/auth');
  };

  const handleNavClick = (path: string) => {
    navigate(path);
    setShowMobileMenu(false);
    setOpenDropdown(null);
  };

  const getActiveNavItem = () => {
    const path = location.pathname;
    const item = navItems.find(n =>
      path === n.path || path.startsWith(n.path + '/') ||
      (n.subItems?.some(s => path === s.path || path.startsWith(s.path + '/')))
    );
    return item?.label || null;
  };

  const activeNavItem = getActiveNavItem();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node)) {
        setShowMobileMenu(false);
      }

      Object.keys(dropdownRefs.current).forEach(key => {
        if (dropdownRefs.current[key] && !dropdownRefs.current[key]?.contains(event.target as Node)) {
          setOpenDropdown(prev => prev === key ? null : prev);
        }
      });
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    // Scroll state is no longer managed via JS as the header uses fluid flex density
  }, []);

  return (
    <div data-header="dashboard-header" className="bg-white/80 backdrop-blur-xl border-b border-gray-100 text-gray-900 px-4 pt-6 pb-3 sm:px-6 sm:pt-8 sm:pb-4 sticky top-0 z-[100]">
      <div className="max-w-7xl mx-auto px-2 sm:px-3 md:px-4 lg:px-6 xl:px-8 relative z-50">
        <div className="flex justify-between items-center relative z-10 gap-2 sm:gap-3 md:gap-4">
          <div className="flex items-center gap-2 sm:gap-3 md:gap-4 min-w-0 flex-1">
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="lg:hidden p-2 bg-gray-50 rounded-lg hover:bg-gray-100 active:bg-gray-200 transition-colors touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center flex-shrink-0 text-gray-600"
            >
              {showMobileMenu ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <div className="flex items-center flex-shrink-0 cursor-pointer px-1 sm:px-2" onClick={() => navigate('/')}>
              <img src={logoUrutiX} alt="UrutiX Logistics Logo" className="h-10 sm:h-12 md:h-16 lg:h-20 max-w-none w-auto object-contain" />
            </div>

            <div className="hidden lg:flex flex-1 items-center relative min-w-0 h-full">
              {/* Intelligent Nav Items with Density Management */}
              <div
                ref={navRef}
                className="flex items-center gap-1 xl:gap-3 ml-2 xl:ml-8 text-gray-500 text-sm font-medium flex-nowrap w-full"
              >
                {navItems.map(item => {
                  const hasSubItems = item.subItems && item.subItems.length > 0;
                  const isActive = activeNavItem === item.label;

                  return (
                    <div key={item.label} className="relative z-[100]" ref={el => dropdownRefs.current[item.label] = el}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (hasSubItems) {
                            setOpenDropdown(openDropdown === item.label ? null : item.label);
                          } else {
                            handleNavClick(item.path);
                          }
                        }}
                        className={`group relative flex items-center gap-1 xl:gap-2 px-2.5 xl:px-4 py-2 text-xs xl:text-sm font-bold rounded-full transition-all duration-300 whitespace-nowrap shrink-0 overflow-hidden
                                            ${isActive
                            ? 'bg-primary-50 text-primary-500'
                            : 'text-slate-500 hover:text-primary-500 hover:bg-slate-50'}
                                        `}
                      >
                        <div className="absolute inset-0 bg-primary-100/10 scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300" />
                        
                        {item.icon && <item.icon className={`w-3.5 h-3.5 xl:w-4 xl:h-4 transition-transform ${isActive ? 'scale-110' : ''}`} />}
                        <span className="relative"><TranslatedText text={item.label} /></span>
                        {hasSubItems && (
                          <ChevronDown className={`w-3 h-3 transition-transform relative ${openDropdown === item.label ? 'rotate-180' : ''}`} />
                        )}
                      </button>

                      {hasSubItems && openDropdown === item.label && (
                        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-3 w-64 bg-white/95 backdrop-blur-xl rounded-2xl shadow-[0_20px_50px_-12px_rgba(0,0,0,0.15)] border border-slate-100 z-[120] overflow-hidden py-2 animate-in fade-in slide-in-from-top-4 duration-300">
                          <div className="px-3 py-2 border-b border-slate-50 mb-1">
                             <div className="text-[10px] font-black tracking-widest text-slate-400 uppercase"><TranslatedText text="Neural Suite" /></div>
                          </div>
                          <div className="py-1">
                            {item.subItems?.map(subItem => (
                              <button
                                key={subItem.path}
                                onClick={() => handleNavClick(subItem.path)}
                                className={`w-full text-left px-4 py-3 text-xs xl:text-sm transition-all flex items-center gap-3 group/item ${location.pathname === subItem.path
                                  ? 'bg-primary-50/50 text-primary-500 font-bold'
                                  : 'text-slate-600 hover:bg-slate-50 hover:text-primary-500'}`}
                              >
                                <div className={`w-1 h-4 rounded-full transition-all ${location.pathname === subItem.path ? 'bg-primary-500 scale-y-100' : 'bg-transparent scale-y-0 grpup-hover/item:scale-y-75 group-hover/item:bg-primary-200'}`} />
                                <TranslatedText text={subItem.label} />
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0 ml-auto">
            <div className="flex items-center gap-1 sm:gap-2 md:gap-4 shrink-0">
              <div className="hidden sm:block">
                <TenantCreditBalance />
              </div>
              <LanguageSwitcher />
              <div className="hidden sm:block">
                <ThemeToggle />
              </div>
              {children}
            </div>
            <div className="block">
              <CargoOwnerNotificationDropdown />
            </div>
            <div className="hidden sm:flex items-center">
              <ContextualHelp context={location.pathname} />
            </div>
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="h-10 w-10 rounded-full bg-[#0f172a] text-white flex items-center justify-center hover:bg-slate-900 transition-all shadow-lg shadow-slate-200/50 relative overflow-hidden group border-2 border-white"
              >
                <User size={20} className="transition-transform group-hover:scale-110" />
              </button>
              {showUserMenu && (
                <div className="absolute top-full right-0 mt-1 w-48 bg-white rounded-lg shadow-xl border border-gray-200 z-[100] p-2">
                  <div className="px-3 py-2 border-b border-gray-100 mb-2">
                    <p className="text-sm font-semibold truncate">{user?.firstName || user?.email || 'User'}</p>
                    <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                  </div>
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      const profilePath = user?.role === 'LENDER' ? '/lender/profile' :
                        user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN' ? '/admin/profile' :
                          user?.role === 'TENANT_ADMIN' ? '/tenant-admin/profile' :
                            user?.role === 'BROKER' ? '/dashboard/broker/profile' :
                              '/dashboard/settings';
                      navigate(profilePath);
                    }}
                    className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md"
                  >
                    Profile Settings
                  </button>
                  <button onClick={handleLogout} className="w-full text-left px-3 py-2.5 text-xs font-bold text-rose-500 uppercase tracking-widest hover:bg-rose-50 rounded-lg transition-colors flex items-center gap-2">
                    <LogOut size={14} /> Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

      {/* Mobile Menu Drawer */}
      <AnimatePresence>
        {showMobileMenu && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowMobileMenu(false)}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[110] lg:hidden"
            />
            
            {/* Side Drawer */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 left-0 bottom-0 w-[280px] sm:w-[320px] bg-white dark:bg-slate-900 z-[120] shadow-2xl lg:hidden flex flex-col"
            >
              {/* Drawer Header */}
              <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <img src={logoUrutiX} alt="UrutiX" className="h-8 w-auto" />
                <button
                  onClick={() => setShowMobileMenu(false)}
                  className="p-2 bg-slate-50 dark:bg-slate-800 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                >
                  <X className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                </button>
              </div>

              {/* Drawer Content */}
              <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                {/* User Info Section */}
                <div className="mb-6 p-4 bg-primary-50 dark:bg-primary-900/10 rounded-2xl flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-primary-600 flex items-center justify-center text-white font-bold text-lg">
                    {user?.firstName?.[0] || user?.email?.[0] || 'U'}
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-slate-900 dark:text-white truncate">
                      {user?.firstName} {user?.lastName}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                      {user?.email}
                    </p>
                  </div>
                </div>

                <div className="space-y-1">
                  {navItems.map(item => {
                    const hasSubItems = item.subItems && item.subItems.length > 0;
                    const isDropdownOpen = openDropdown === item.label;
                    const isActive = activeNavItem === item.label;

                    return (
                      <div key={item.label}>
                        <button
                          onClick={() => {
                            if (hasSubItems) {
                              setOpenDropdown(isDropdownOpen ? null : item.label);
                            } else {
                              handleNavClick(item.path);
                            }
                          }}
                          className={`w-full text-left px-4 py-3 rounded-xl flex items-center justify-between transition-all group
                            ${isActive 
                              ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 font-bold' 
                              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg transition-colors ${isActive ? 'bg-primary-100 dark:bg-primary-800/30' : 'bg-slate-100 dark:bg-slate-800 group-hover:bg-white dark:group-hover:bg-slate-700'}`}>
                              {item.icon && <item.icon className="w-4 h-4" />}
                            </div>
                            <span className="text-sm"><TranslatedText text={item.label} /></span>
                          </div>
                          {hasSubItems && (
                            <ChevronDown 
                              size={16} 
                              className={`transition-transform duration-300 ${isDropdownOpen ? 'rotate-180 text-primary-500' : 'text-slate-400'}`} 
                            />
                          )}
                        </button>

                        <AnimatePresence>
                          {hasSubItems && isDropdownOpen && (
                            <motion.div 
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="overflow-hidden bg-slate-50 dark:bg-slate-800/50 rounded-xl mt-1 ml-4 border-l-2 border-primary-100 dark:border-primary-900/30"
                            >
                              <div className="py-2 space-y-1">
                                {item.subItems?.map(sub => (
                                  <button 
                                    key={sub.path} 
                                    onClick={() => handleNavClick(sub.path)} 
                                    className={`w-full text-left px-5 py-3 text-sm transition-all flex items-center gap-3
                                      ${location.pathname === sub.path 
                                        ? 'text-primary-600 dark:text-primary-400 font-bold' 
                                        : 'text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-700'}`}
                                  >
                                    <div className={`w-1 h-3 rounded-full ${location.pathname === sub.path ? 'bg-primary-500' : 'bg-transparent'}`} />
                                    <TranslatedText text={sub.label} />
                                  </button>
                                ))}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Drawer Footer */}
              <div className="p-4 border-t border-slate-100 dark:border-slate-800 space-y-4 bg-slate-50 dark:bg-slate-800/30">
                <div className="flex items-center justify-between px-2">
                  <div className="flex items-center gap-2">
                    <ThemeToggle />
                    <span className="text-xs font-medium text-slate-500"><TranslatedText text="Theme" /></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-slate-500"><TranslatedText text="Language" /></span>
                    <LanguageSwitcher />
                  </div>
                </div>
                
                <button
                  onClick={handleLogout}
                  className="w-full py-3 px-4 bg-rose-50 dark:bg-rose-900/10 text-rose-600 dark:text-rose-400 rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-rose-100 dark:hover:bg-rose-900/20 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <TranslatedText text="Sign Out" />
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  </div>
);
};

export default DashboardHeader;
