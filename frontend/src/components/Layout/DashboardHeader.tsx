import { createPortal } from 'react-dom';
import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { LogOut, User, Menu, X, ChevronDown, Package, BarChart3, CreditCard, Settings, HelpCircle, Truck, Users, Route, DollarSign, Home, Wallet, Activity, Zap, Landmark, AlertTriangle, Clock, FileText, Shield, TrendingUp, ClipboardList, ShoppingCart, MessageSquare, Radio, Headphones } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import CargoOwnerNotificationDropdown from '../notifications/CargoOwnerNotificationDropdown';
import CurrencySelector from '../common/CurrencySelector';
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

interface SubNavItem {
  label: string;
  path: string;
  icon?: any;
}

interface NavItem {
  label: string;
  path: string;
  icon: any;
  subItems?: SubNavItem[];
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [desktopDropdown, setDesktopDropdown] = useState<string | null>(null);
  const [mobileExpanded, setMobileExpanded]   = useState<string | null>(null);

  // Track desktopDropdown changes
  useEffect(() => {
    if (desktopDropdown !== null) {
    }
  }, [desktopDropdown, showMobileMenu]);

  const navRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const dropdownRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  // Role-based navigation items
  const navItems = useMemo<NavItem[]>(() => {
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
            { label: 'Smart Matching', path: `${basePath}/smart-matching` },
            { label: 'Accepted Matches', path: `${basePath}/accepted-matches` },
            { label: 'Freight Bidding', path: `${basePath}/bidding` },
            { label: '🔴 Live Tracking', path: `${basePath}/tracking` },
            { label: 'Multi-Modal Flow', path: `${basePath}/multi-modal` },
            { label: 'Receiver Directory', path: `${basePath}/receivers` },
            { label: 'Drafts & Templates', path: `${basePath}/cargos/list?status=DRAFT` },
            { label: 'Documents & Contracts', path: `${basePath}/documents` },
            { label: 'Customs Inspections', path: `${basePath}/customs-inspections` },
          ]
        },
        {
          label: 'Intelligence & Capital',
          path: `${basePath}/analytics`,
          icon: BarChart3,
          subItems: [
            { label: 'Neural Overview', path: `${basePath}/analytics` },
            { label: 'Operational Insights', path: `${basePath}/analytics/operational` },
            { label: 'Invoice Vault', path: `${basePath}/invoices` },
            { label: 'Financial Analytics', path: `${basePath}/analytics/financial` },
          ]
        },
        {
          label: 'Support',
          path: `${basePath}/support`,
          icon: Headphones,
          subItems: [
            { label: 'Report Issue', path: `${basePath}/support/new` },
            { label: 'My Reports', path: `${basePath}/support` },
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
            { label: 'My Assignments', path: '/dashboard/broker/loads' },
            { label: 'Auctions', path: '/dashboard/broker/bidding' },
            { label: 'Smart Matching', path: '/dashboard/broker/smart-matching' },
            { label: 'Bidding', path: '/dashboard/broker/bidding' },
            { label: '🔴 Live Tracking', path: '/dashboard/broker/tracking' },
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
          label: 'Support',
          path: '/dashboard/broker/support',
          icon: Headphones,
          subItems: [
            { label: 'Report Issue', path: '/dashboard/broker/support/new' },
            { label: 'My Reports', path: '/dashboard/broker/support' },
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
            { label: '🔴 Live Tracking', path: '/dashboard/driver/tracking' },
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
        {
          label: 'Support',
          path: '/dashboard/driver/support',
          icon: Headphones,
          subItems: [
            { label: 'Report Issue', path: '/dashboard/driver/support/new' },
            { label: 'My Reports', path: '/dashboard/driver/support' },
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
            { label: 'Team Management', path: '/dashboard/fleet/settings' },
            { label: 'Marketplace', path: '/dashboard/fleet/buy-credits' },
            { label: 'Comms', path: '/dashboard/fleet/communicate' },
          ]
        },
        {
          label: 'Operations Hub',
          path: '/dashboard/trips',
          icon: Route,
          subItems: [
            { label: 'Active Trips', path: '/dashboard/trips' },
            { label: '🔴 Live Tracking', path: '/dashboard/fleet/tracking' },
            { label: 'Freight Bidding', path: '/dashboard/fleet/bids' },
            { label: 'Route Planning', path: '/dashboard/fleet/routes' },
            { label: 'Financial Hub', path: '/dashboard/fleet/financial' },
            { label: 'Line of Credit', path: '/dashboard/fleet/credits' },
            { label: 'Performance Analytics', path: '/dashboard/fleet/analytics' },
          ]
        },
        {
          label: 'Support',
          path: '/dashboard/fleet/support',
          icon: Headphones,
          subItems: [
            { label: 'Report Issue', path: '/dashboard/fleet/support/new' },
            { label: 'My Reports', path: '/dashboard/fleet/support' },
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
        {
          label: 'Global Support',
          path: '/admin/support',
          icon: Headphones,
          subItems: [
            { label: 'All Tickets', path: '/admin/support' },
            { label: 'Analytics', path: '/admin/support/analytics' },
            { label: 'Notifications Hub', path: '/admin/onboarding' },
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
            { label: 'Pending Requests', path: '/lender/requests', icon: Clock },
            { label: 'Active Loan Book', path: '/lender/active', icon: Activity },
            { label: 'Disbursements', path: '/lender/disbursements', icon: DollarSign },
            { label: 'Repayment Tracking', path: '/lender/repayments', icon: CreditCard },
          ]
        },
        {
          label: 'Risk & Policies',
          path: '/lender/policies',
          icon: Shield,
          subItems: [
            { label: 'Assessment Engine', path: '/lender/credit', icon: Zap },
            { label: 'Lending Policies', path: '/lender/policies', icon: Settings },
            { label: 'Borrower Directory', path: '/lender/borrowers', icon: Users },
            { label: 'Transaction Vault', path: '/lender/history', icon: Landmark },
          ]
        },
        {
          label: 'Analytics',
          path: '/lender/analytics',
          icon: BarChart3,
          subItems: [
            { label: 'Portfolio Analytics', path: '/lender/analytics', icon: Activity },
            { label: 'Risk Analysis', path: '/lender/risk', icon: AlertTriangle },
            { label: 'Interest Tracking', path: '/lender/interest', icon: TrendingUp },
            { label: 'Financial Reports', path: '/lender/reports', icon: FileText },
          ]
        },
        {
          label: 'Support',
          path: '/lender/support',
          icon: Headphones,
          subItems: [
            { label: 'Report Issue', path: '/lender/support/new' },
            { label: 'My Reports', path: '/lender/support' },
          ]
        },
      ];
    }

    if (user?.role === 'CUSTOMS_OFFICER') {
      return [
        { label: 'Dashboard', path: '/dashboard/customs', icon: Home },
        {
          label: 'Inspections',
          path: '/dashboard/customs/inspections',
          icon: ClipboardList,
          subItems: [
            { label: 'All Inspections', path: '/dashboard/customs/inspections' },
            { label: 'New Inspection', path: '/dashboard/customs/inspections/new' },
            { label: 'Flagged Cargo', path: '/dashboard/customs/flagged' },
            { label: 'Cleared Shipments', path: '/dashboard/customs/cleared' },
          ]
        },
        {
          label: 'Operations',
          path: '/dashboard/customs/search',
          icon: Activity,
          subItems: [
            { label: 'Truck Search', path: '/dashboard/customs/search' },
            { label: 'Checkpoints', path: '/dashboard/customs/checkpoints' },
            { label: 'Analytics', path: '/dashboard/customs/analytics' },
            { label: 'Audit Log', path: '/dashboard/customs/audit' },
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
            { label: 'Purchase Credits', path: '/tenant-admin/purchase-credits' },
            { label: 'Transaction History', path: '/tenant-admin/billing' },
            { label: 'General Settings', path: '/tenant-admin/settings' },
          ]
        },
        {
          label: 'Support Center',
          path: '/tenant-admin/support',
          icon: Headphones,
          subItems: [
            { label: 'All Reports', path: '/tenant-admin/support' },
            { label: 'Open', path: '/tenant-admin/support?status=OPEN' },
            { label: 'In Progress', path: '/tenant-admin/support?status=UNDER_REVIEW' },
            { label: 'Escalated', path: '/tenant-admin/support?status=ESCALATED' },
            { label: 'Resolved', path: '/tenant-admin/support?status=RESOLVED' },
            { label: 'Analytics', path: '/tenant-admin/support/analytics' },
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
    setShowMobileMenu(false);
    logout?.();
    navigate('/auth');
  };

  const handleNavClick = (path?: string) => {
    if (path) navigate(path);
    setTimeout(() => {
      setDesktopDropdown(null);
      setMobileExpanded(null);
      setShowMobileMenu(false);
      setShowUserMenu(false);
    }, 10);
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

      if (!showMobileMenu) {
        Object.keys(dropdownRefs.current).forEach(key => {
          if (dropdownRefs.current[key] && !dropdownRefs.current[key]?.contains(event.target as Node)) {
            setDesktopDropdown(prev => prev === key ? null : prev);
          }
        });
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Track showMobileMenu changes
  useEffect(() => {
    if (showMobileMenu === true) {
    }
  }, [showMobileMenu, desktopDropdown]);

  useEffect(() => {
    if (showMobileMenu) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      // When mobile menu closes, also close any dropdowns
      setDesktopDropdown(null);
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [showMobileMenu]);

  // Close dropdown and mobile menu when route changes
  useEffect(() => {
    setDesktopDropdown(null);
    setShowMobileMenu(false);
  }, [location.pathname]);

  useEffect(() => {
    // Scroll state is no longer managed via JS as the header uses fluid flex density
  }, []);

  return (
    <div data-header="dashboard-header" className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-b border-gray-50 dark:border-slate-800 text-gray-900 px-3 py-1.5 sm:px-6 sm:py-3 lg:py-4 sticky top-0 z-[100] transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-1 sm:px-3 md:px-4 lg:px-6 xl:px-8 relative z-50">
        <div className="flex justify-between items-center relative z-10 gap-1.5 sm:gap-3 md:gap-4">
          <div className="flex items-center gap-2 sm:gap-3 md:gap-4 min-w-0 flex-1">
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="xl:hidden p-1.5 bg-slate-50 dark:bg-slate-800 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors touch-manipulation min-w-[38px] min-h-[38px] flex items-center justify-center flex-shrink-0 text-slate-600 dark:text-slate-400 border border-slate-100 dark:border-slate-700"
            >
              {showMobileMenu ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
            <div className="flex items-center flex-shrink-0 cursor-pointer px-1" onClick={() => navigate(user?.role === 'CUSTOMS_OFFICER' ? '/dashboard/customs' : user?.role === 'LENDER' ? '/lender' : user?.role === 'BROKER' ? '/dashboard/broker' : user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN' ? '/admin' : user?.role === 'TENANT_ADMIN' ? '/tenant-admin' : '/dashboard')}>
              <img src={logoUrutiX} alt="UrutiX Logistics Logo" className="h-7 sm:h-8 md:h-10 lg:h-12 max-w-none w-auto object-contain transition-all" />
            </div>

            <div className="hidden xl:flex flex-1 items-center relative min-w-0 h-full">
              {/* Intelligent Nav Items with Density Management */}
              <div
                ref={navRef}
                className="flex items-center gap-0.5 xl:gap-2 ml-1 xl:ml-4 text-gray-500 dark:text-slate-400 text-sm font-medium flex-nowrap"
              >
                {navItems.map(item => {
                  const hasSubItems = item.subItems && item.subItems.length > 0;
                  const isActive = activeNavItem === item.label;

                  return (
                    <div key={item.label} className="relative z-[100]" ref={el => dropdownRefs.current[item.label] = el}>
                      {hasSubItems ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setDesktopDropdown(desktopDropdown === item.label ? null : item.label);
                          }}
                          className={`group relative flex items-center gap-1 xl:gap-2 px-2.5 xl:px-4 py-2 text-xs xl:text-sm font-bold rounded-full transition-all duration-300 whitespace-nowrap shrink-0 overflow-hidden
                                              ${isActive
                                                ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-500 dark:text-primary-400'
                                                : 'text-slate-500 dark:text-slate-400 hover:text-primary-500 dark:hover:text-primary-400 hover:bg-slate-50 dark:hover:bg-slate-800'}
                                          `}
                        >
                          <div className="absolute inset-0 bg-primary-100/10 scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300" />
                          {item.icon && <item.icon className={`w-3.5 h-3.5 xl:w-4 xl:h-4 transition-transform ${isActive ? 'scale-110' : ''}`} />}
                          <span className="relative"><TranslatedText text={item.label} /></span>
                          <ChevronDown className={`w-3 h-3 transition-transform relative ${desktopDropdown === item.label ? 'rotate-180' : ''}`} />
                        </button>
                      ) : (
                        <Link
                          to={item.path}
                          onClick={(e) => { e.preventDefault(); handleNavClick(item.path); }}
                          className={`group relative flex items-center gap-1 xl:gap-2 px-2.5 xl:px-4 py-2 text-xs xl:text-sm font-bold rounded-full transition-all duration-300 whitespace-nowrap shrink-0 overflow-hidden
                                              ${isActive
                                                ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-500 dark:text-primary-400'
                                                : 'text-slate-500 dark:text-slate-400 hover:text-primary-500 dark:hover:text-primary-400 hover:bg-slate-50 dark:hover:bg-slate-800'}
                                          `}
                        >
                          <div className="absolute inset-0 bg-primary-100/10 scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300" />
                          {item.icon && <item.icon className={`w-3.5 h-3.5 xl:w-4 xl:h-4 transition-transform ${isActive ? 'scale-110' : ''}`} />}
                          <span className="relative"><TranslatedText text={item.label} /></span>
                        </Link>
                      )}

                      {hasSubItems && desktopDropdown === item.label && (
                        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-3 w-64 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-2xl shadow-[0_20px_50px_-12px_rgba(0,0,0,0.15)] dark:shadow-none border border-slate-100 dark:border-slate-800 z-[120] overflow-hidden py-2 animate-in fade-in slide-in-from-top-4 duration-300">
                          <div className="px-3 py-2 border-b border-slate-50 dark:border-slate-800 mb-1 space-y-2">
                            <div className="text-[10px] font-black tracking-widest text-slate-400 dark:text-slate-500 uppercase"><TranslatedText text="Quick Actions" /></div>
                            {item.label === 'Commercial & Settings' && user?.role === 'TENANT_ADMIN' && (
                              <TenantCreditBalance />
                            )}
                          </div>
                          <div className="py-2 px-1">
                            {item.subItems?.map(subItem => (
                              <Link
                                key={subItem.path}
                                to={subItem.path}
                                onClick={(e) => { e.preventDefault(); handleNavClick(subItem.path); }}
                                className={`w-full text-left px-4 py-2 md:py-3 text-[11px] xl:text-xs transition-all flex items-center gap-3 group/sub rounded-xl ${location.pathname === subItem.path
                                  ? 'bg-primary-50/50 dark:bg-primary-900/20 text-primary-500 dark:text-primary-400 font-bold shadow-sm'
                                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-primary-500 dark:hover:text-primary-400'}`}
                              >
                                {subItem.icon && (
                                  <div className={`p-1 rounded-lg transition-colors ${
                                    location.pathname === subItem.path
                                      ? 'bg-primary-100 dark:bg-primary-900/50 text-primary-600'
                                      : 'bg-slate-100 dark:bg-slate-800 text-slate-400 group-hover/sub:bg-primary-50 dark:group-hover/sub:bg-primary-900/30 group-hover/sub:text-primary-500'
                                  }`}>
                                    <subItem.icon size={14} />
                                  </div>
                                )}
                                <span className="tracking-wide uppercase font-black opacity-80 group-hover/sub:opacity-100 transition-opacity">
                                  <TranslatedText text={subItem.label} />
                                </span>
                                {location.pathname === subItem.path && (
                                  <div className="ml-auto w-1 h-3 bg-primary-500 rounded-full" />
                                )}
                              </Link>
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

          <div className="flex items-center gap-1.5 sm:gap-3 flex-shrink-0 ml-auto">
            <div className="flex items-center gap-1 sm:gap-2 md:gap-4 shrink-0">
              <LanguageSwitcher />
              <div className="hidden sm:block">
                <ThemeToggle />
              </div>
              {children}
            </div>
            <div className="block">
              <CargoOwnerNotificationDropdown />
            </div>
            <div className="hidden sm:flex items-center gap-2">
              <CurrencySelector variant="compact" />
            </div>
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="h-10 w-10 rounded-full bg-[#0f172a] dark:bg-slate-800 text-white flex items-center justify-center hover:bg-slate-900 dark:hover:bg-slate-700 transition-all shadow-lg shadow-slate-200/50 dark:shadow-none relative overflow-hidden group border-2 border-white dark:border-slate-700"
              >
                <User size={20} className="transition-transform group-hover:scale-110" />
              </button>
              {showUserMenu && (
                <div className="absolute top-full right-0 mt-1 w-48 bg-white dark:bg-slate-900 rounded-lg shadow-xl border border-gray-200 dark:border-slate-800 z-[100] p-2">
                  <div className="px-3 py-2 border-b border-gray-100 dark:border-slate-800 mb-2">
                    <p className="text-sm font-semibold truncate text-slate-900 dark:text-white">{user?.firstName || user?.email || 'User'}</p>
                    <p className="text-xs text-gray-500 dark:text-slate-400 truncate">{user?.email}</p>
                  </div>
                  <div className="py-1">
                    <Link
                      to={user?.role === 'LENDER' ? '/lender/profile' :
                          user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN' ? '/admin/profile' :
                          user?.role === 'TENANT_ADMIN' ? '/tenant-admin/settings' :
                          user?.role === 'BROKER' ? '/dashboard/broker/profile' :
                          user?.role === 'TRUCK_OWNER' ? '/dashboard/fleet/settings' :
                          user?.role === 'CUSTOMS_OFFICER' ? '/dashboard/customs/profile' :
                          '/dashboard/settings'}
                      onClick={() => setShowUserMenu(false)}
                      className="w-full text-left px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-3 transition-colors rounded-lg"
                    >
                      <User size={14} className="text-slate-400 dark:text-slate-500" />
                      <TranslatedText text="Profile Settings" />
                    </Link>

                    {user?.role === 'TRUCK_OWNER' && (
                      <>
                        <Link
                          to="/dashboard/fleet/settings"
                          onClick={() => setShowUserMenu(false)}
                          className="w-full text-left px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-3 transition-colors rounded-lg"
                        >
                          <Settings size={14} className="text-slate-400 dark:text-slate-500" />
                          <TranslatedText text="Fleet Settings" />
                        </Link>
                        <Link
                          to="/dashboard/fleet/settings"
                          onClick={() => setShowUserMenu(false)}
                          className="w-full text-left px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-3 transition-colors rounded-lg"
                        >
                          <Users size={14} className="text-slate-400 dark:text-slate-500" />
                          <TranslatedText text="Team Management" />
                        </Link>
                      </>
                    )}
                    <div className="px-4 py-1">
                      <ContextualHelp context={location.pathname} dropdownMode />
                    </div>
                  </div>
                  <div className="border-t border-slate-100 dark:border-slate-800 my-1 pt-1 pb-1">
                    <div className="px-4 py-2">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                          <TranslatedText text="Theme" />
                        </span>
                      </div>
                      <ThemeToggle />
                    </div>
                  </div>
                  <div className="border-t border-slate-100 dark:border-slate-800 pt-1">
                    <button onClick={handleLogout} className="w-full text-left px-4 py-2 text-xs font-bold text-rose-500 uppercase tracking-widest hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-colors flex items-center gap-3">
                      <LogOut size={14} /> <TranslatedText text="Sign Out" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

      {/* Side-Docked Mobile Menu Drawer */}
      {createPortal(
        <AnimatePresence initial={false} key={location.pathname}>
          {(() => {
            return showMobileMenu;
          })() && (
            <>
              {console.log('📱📱📱 Mobile menu IS RENDERING (inside AnimatePresence)')}
              {/* Backdrop */}
              <motion.div
                key="mobile-backdrop"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, transition: { duration: 0.2 } }}
                onClick={() => {
                  setShowMobileMenu(false);
                }}
                className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm xl:hidden z-[999998]"
              />

              {/* Drawer Panel */}
              <motion.div
                key="mobile-drawer"
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: '-100%', transition: { duration: 0.2 } }}
                transition={{ 
                  type: 'spring', 
                  damping: 25, 
                  stiffness: 200,
                  duration: 0.3
                }}
                onAnimationStart={(definition) => {
                }}
                onAnimationComplete={(definition) => {
                }}
                className="fixed inset-y-0 left-0 w-[85vw] max-w-[320px] bg-white dark:bg-slate-900 shadow-2xl xl:hidden z-[999999] flex flex-col border-r border-slate-200 dark:border-slate-800"
              >
                {/* Header Section */}
                <div className="flex-shrink-0 p-5 flex items-center justify-between border-b border-slate-50 dark:border-slate-800/50 bg-slate-50/50 dark:bg-slate-800/30">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center text-white shadow-lg shadow-primary-500/20">
                      <Truck size={16} />
                    </div>
                    <img src={logoUrutiX} alt="UrutiX" className="h-6 w-auto" />
                  </div>
                  <button
                    onClick={() => setShowMobileMenu(false)}
                    className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors text-slate-500"
                  >
                    <X size={20} />
                  </button>
                </div>



                {/* Navigation Items */}
                <div className="flex-1 overflow-y-auto px-3 custom-scrollbar space-y-1 py-2">
                  {navItems.map((item, idx) => {
                    const hasSubItems = item.subItems && item.subItems.length > 0;
                    const isDropdownOpen = mobileExpanded === item.label;
                    const isActive = activeNavItem === item.label;

                    return (
                      <motion.div
                        key={item.label}
                        initial={{ x: -10, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.1 + idx * 0.05 }}
                      >
                        {hasSubItems ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              // Toggle the dropdown
                              setMobileExpanded(isDropdownOpen ? null : item.label);
                            }}
                            className={`w-full flex items-center justify-between p-3.5 rounded-xl transition-all active:scale-[0.98] ${
                              isActive 
                                ? 'bg-blue-50 dark:bg-blue-900/20 text-[#345E85] dark:text-blue-400' 
                                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div className={`${isActive ? 'text-[#345E85] dark:text-blue-400' : 'text-slate-400'}`}>
                                {item.icon && <item.icon size={18} />}
                              </div>
                              <span className="text-[11px] font-black uppercase tracking-widest">
                                <TranslatedText text={item.label} />
                              </span>
                            </div>
                            <ChevronDown 
                              size={14} 
                              className={`transition-transform duration-300 ${isDropdownOpen ? 'rotate-180' : ''}`} 
                            />
                          </button>
                        ) : (
                          <Link
                            to={item.path}
                            onClick={() => setTimeout(() => setShowMobileMenu(false), 80)}
                            className={`w-full flex items-center justify-between p-3.5 rounded-xl transition-all active:scale-[0.98] ${
                              isActive 
                                ? 'bg-blue-50 dark:bg-blue-900/20 text-[#345E85] dark:text-blue-400' 
                                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div className={`${isActive ? 'text-[#345E85] dark:text-blue-400' : 'text-slate-400'}`}>
                                {item.icon && <item.icon size={18} />}
                              </div>
                              <span className="text-[11px] font-black uppercase tracking-widest">
                                <TranslatedText text={item.label} />
                              </span>
                            </div>
                          </Link>
                        )}

                        <AnimatePresence initial={false}>
                          {hasSubItems && isDropdownOpen && (
                            <motion.div
                              key={`${item.label}-sub`}
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0, transition: { duration: 0.15 } }}
                              transition={{ duration: 0.22, ease: 'easeInOut' }}
                              style={{ overflow: "hidden" }} className="bg-slate-50/50 dark:bg-slate-800/30 rounded-xl mx-2 my-1 border-l-2 border-slate-200 dark:border-slate-700"
                            >
                                <div className="py-2 px-1 space-y-1">
                                  {item.subItems?.map((sub, sIdx) => (
                                    <Link key={sub.path} to={sub.path} onClick={() => setTimeout(() => setShowMobileMenu(false), 80)}
                                      className={`w-full group flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${
                                        location.pathname === sub.path
                                          ? 'bg-white dark:bg-slate-800 shadow-sm text-[#345E85] dark:text-blue-400'
                                          : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-300 hover:bg-white/50 dark:hover:bg-slate-800/50'
                                      }`}
                                    >
                                      {sub.icon && (
                                        <div className={`p-1.5 rounded-lg transition-colors ${
                                          location.pathname === sub.path
                                            ? 'bg-blue-50 dark:bg-blue-900/30 text-[#345E85] dark:text-blue-400'
                                            : 'bg-slate-50 dark:bg-slate-800 text-slate-400 group-hover:text-slate-600'
                                        }`}>
                                          <sub.icon size={14} />
                                        </div>
                                      )}
                                      <span className={`text-[10px] font-black uppercase tracking-widest ${
                                        location.pathname === sub.path ? 'opacity-100' : 'opacity-70 group-hover:opacity-100'
                                      }`}>
                                        <TranslatedText text={sub.label} />
                                      </span>
                                      {location.pathname === sub.path && (
                                        <div className="ml-auto w-1 h-3 bg-[#345E85] rounded-full" />
                                      )}
                                    </Link>
                                  ))}
                                </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    );
                  })}
                </div>

                {/* Footer Controls Card */}
                <div className="flex-shrink-0 p-4 border-t border-slate-100 dark:border-slate-800/50 bg-slate-50/30">
                  <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-2 shadow-sm mb-3">
                    <div className="grid grid-cols-2 gap-1">
                      <div className="flex items-center gap-2 p-1.5">
                        <ThemeToggle />
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">Mode</span>
                      </div>
                      <div className="flex items-center gap-2 p-1.5 justify-end">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">Lang</span>
                        <LanguageSwitcher />
                      </div>
                    </div>
                    <div className="mt-1 pt-1 border-t border-slate-100 dark:border-slate-700 px-1.5 pb-0.5 flex items-center justify-between">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">Currency</span>
                      <CurrencySelector variant="compact" />
                    </div>
                  </div>

                  <button
                    onClick={handleLogout}
                    className="w-full h-12 flex items-center justify-center gap-2 bg-rose-500 hover:bg-rose-600 active:bg-rose-700 text-white rounded-xl text-[10px] font-black uppercase tracking-[0.2em] shadow-lg shadow-rose-500/20 active:scale-[0.98] transition-all"
                  >
                    <LogOut size={16} />
                    <TranslatedText text="Sign Out" />
                  </button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>,
        document.body
      )}

    </div>
  </div>
);
};

export default DashboardHeader;
