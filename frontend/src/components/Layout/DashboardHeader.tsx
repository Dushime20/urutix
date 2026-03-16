import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LogOut, User, Menu, X, ChevronDown, Package, Gavel, MapPin, BarChart3, CreditCard, FileText, Settings, HelpCircle, Truck, Users, Route, Shield, DollarSign, Home, Navigation, Wallet, AlertCircle, ClipboardList, Activity } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import CargoOwnerNotificationDropdown from '../notifications/CargoOwnerNotificationDropdown';
import ContextualHelp from '../Help/ContextualHelp';
import logoUrutiX from '../../assets/urutiX Logistics Logo (1).svg';
import { TranslatedText } from '../translated-text';
import TenantCreditBalance from '../CreditBalance/TenantCreditBalance';

interface DashboardHeaderProps {
  children?: React.ReactNode;
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [scrollState, setScrollState] = useState({ left: false, right: false });
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
        { label: 'Dashboard', path: '/dashboard', icon: Home },
        { label: 'My Cargos', path: '/cargo-owner/cargos/my-cargos', icon: Package },
        { label: 'Tracking', path: '/cargo-owner/tracking', icon: MapPin },
        { label: 'Settings', path: '/cargo-owner/settings', icon: Settings },
      ];
    }

    if (user?.role === 'CARGO_OWNER') {
      return [
        { label: 'Dashboard', path: basePath, icon: Home },
        {
          label: 'Cargo Management',
          path: `${basePath}/cargos/list`,
          icon: Package,
          subItems: [
            { label: 'All Cargos', path: `${basePath}/cargos/list` },
            { label: 'Create New', path: `${basePath}/cargos/create` },
            { label: 'Active Shipments', path: `${basePath}/cargos/active` },
            { label: 'Drafts', path: `${basePath}/cargos/list?status=DRAFT` },
            { label: 'Templates', path: `${basePath}/cargos/list?tab=template` },
          ]
        },
        {
          label: 'Operations',
          path: `${basePath}/analytics`,
          icon: Activity,
          subItems: [
            { label: 'Tracking', path: `${basePath}/tracking` },
            { label: 'Financials', path: `${basePath}/financial` },
            { label: 'Analytics Overview', path: `${basePath}/analytics` },
            { label: 'Financial Analytics', path: `${basePath}/analytics/financial` },
            { label: 'Operational Analytics', path: `${basePath}/analytics/operational` },
            { label: 'AI Insights', path: `${basePath}/analytics/ai-insights` },
            { label: 'Advanced Analytics', path: `${basePath}/analytics/advanced` },
            { label: 'Bidding', path: `${basePath}/bidding` },
            { label: 'Documents', path: `${basePath}/documents` },
          ]
        },
        { label: 'Receivers', path: `${basePath}/receivers`, icon: Users },
      ];
    }

    if (user?.role === 'BROKER') {
      return [
        { label: 'Dashboard', path: '/dashboard/broker', icon: Home },
        { label: 'Loads', path: '/dashboard/broker/loads', icon: Package },
        { label: 'Bidding', path: '/dashboard/broker/bidding', icon: Gavel },
        { label: 'Contracts', path: '/dashboard/broker/contracts', icon: FileText },
        { label: 'Tracking', path: '/dashboard/broker/tracking', icon: MapPin },
        { label: 'Commissions', path: '/dashboard/broker/commissions', icon: DollarSign },
        { label: 'Analytics', path: '/dashboard/broker/analytics', icon: BarChart3 },
        { label: 'Profile', path: '/dashboard/broker/profile', icon: User },
      ];
    }

    if (user?.role === 'DRIVER') {
      return [
        { label: 'Dashboard', path: '/dashboard/driver', icon: Home },
        { label: 'My Trips', path: '/dashboard/driver/trips', icon: Route },
        { label: 'My Truck', path: '/dashboard/driver/truck', icon: Truck },
        { label: 'Cargo Management', path: '/dashboard/driver/cargo', icon: Package },
        { label: 'Earnings', path: '/dashboard/driver/earnings', icon: DollarSign },
        { label: 'Safety & Compliance', path: '/dashboard/driver/safety', icon: Shield },
        { label: 'Live Tracking', path: '/dashboard/driver/tracking', icon: MapPin },
        { label: 'Analytics', path: '/dashboard/driver/analytics', icon: BarChart3 },
        { label: 'Profile', path: '/dashboard/driver/profile', icon: User },
      ];
    }

    if (user?.role === 'TRUCK_OWNER') {
      return [
        { label: 'Dashboard', path: '/dashboard/fleet', icon: Home },
        {
          label: 'Fleet Management',
          path: '/dashboard/fleet/drivers',
          icon: Truck,
          subItems: [
            { label: 'Drivers', path: '/dashboard/fleet/drivers' },
            { label: 'Trucks', path: '/dashboard/fleet/trucks' },
            { label: 'Fuel Logs', path: '/dashboard/fleet/fuel' },
            { label: 'Safety Records', path: '/dashboard/fleet/safety' },
          ]
        },
        {
          label: 'Operations',
          path: '/dashboard/trips',
          icon: Route,
          subItems: [
            { label: 'Trips', path: '/dashboard/trips' },
            { label: 'Bids', path: '/dashboard/fleet/bids' },
            { label: 'Route Planning', path: '/dashboard/fleet/routes' },
          ]
        },
        {
          label: 'Financial',
          path: '/dashboard/fleet/financial',
          icon: DollarSign,
          subItems: [
            { label: 'Financial Management', path: '/dashboard/fleet/financial' },
            { label: 'Payments', path: '/dashboard/payments' },
            { label: 'Credits', path: '/dashboard/fleet/credits' },
            { label: 'Analytics', path: '/dashboard/fleet/analytics' },
          ]
        },
      ];
    }

    if (user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN') {
      return [
        { label: 'Overview', path: '/admin', icon: Home },
        { label: 'Monitoring', path: '/admin/monitoring', icon: BarChart3 },
        { label: 'Bidding', path: '/admin/bidding', icon: Gavel },
        { label: 'Disputes', path: '/admin/disputes', icon: AlertCircle },
        { label: 'Financial', path: '/admin/financial', icon: DollarSign },
        { label: 'Roles', path: '/admin/roles', icon: Shield },
        { label: 'Users', path: '/admin/users', icon: Users },
        { label: 'Analytics', path: '/admin/analytics', icon: BarChart3 },
        { label: 'Settings', path: '/admin/settings', icon: Settings },
        { label: 'Reports', path: '/admin/reports', icon: FileText },
        {
          label: 'System',
          path: '/admin/advanced-settings',
          icon: Settings,
          subItems: [
            { label: 'Activity Logs', path: '/admin/activity-logs' },
            { label: 'Permissions', path: '/admin/enhanced-permissions' },
            { label: 'Settings', path: '/admin/advanced-settings' },
          ]
        },
      ];
    }

    if (user?.role === 'LENDER') {
      return [
        { label: 'Overview', path: '/lender', icon: Home },
        {
          label: 'Loans',
          path: '/lender/requests',
          icon: Wallet,
          subItems: [
            { label: 'Loan Requests', path: '/lender/requests' },
            { label: 'Active Loans', path: '/lender/active' },
          ]
        },
        {
          label: 'Management',
          path: '/lender/borrowers',
          icon: Users,
          subItems: [
            { label: 'Borrower Management', path: '/lender/borrowers' },
            { label: 'Disbursements', path: '/lender/disbursements' },
            { label: 'Repayments', path: '/lender/repayments' },
            { label: 'Lending Policies', path: '/lender/policies' },
            { label: 'Credit Assessment', path: '/lender/credit' },
            { label: 'Transaction History', path: '/lender/history' },
            { label: 'Receipts', path: '/lender/receipts' },
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
        { label: 'Dashboard', path: '/tenant-admin', icon: Home },
        { label: 'Fleet Management', path: '/tenant-admin/fleet', icon: Truck },
        { label: 'Cargo Operations', path: '/tenant-admin/cargo', icon: Package },
        { label: 'Drivers', path: '/tenant-admin/drivers', icon: Users },
        { label: 'Lenders', path: '/tenant-admin/lenders', icon: DollarSign },
        { label: 'Routes', path: '/tenant-admin/routes', icon: Route },
        { label: 'Trips', path: '/tenant-admin/trips', icon: Navigation },
        {
          label: 'Financial',
          path: '/tenant-admin/financial',
          icon: DollarSign,
          subItems: [
            { label: 'Billing Dashboard', path: '/tenant-admin/financial' },
            { label: 'Purchase Credits', path: '/tenant-admin/purchase-credits' },
            { label: 'Subscription Plans', path: '/tenant-admin/subscription-plans' },
            { label: 'Billing History', path: '/tenant-admin/billing' },
          ]
        },
        { label: 'Truck Owners', path: '/tenant-admin/truck-owners', icon: Users },
        { label: 'Analytics', path: '/tenant-admin/analytics', icon: BarChart3 },
        { label: 'Reports', path: '/tenant-admin/reports', icon: ClipboardList },
        { label: 'Tenant Settings', path: '/tenant-admin/settings', icon: Settings },
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

  const checkScroll = () => {
    if (navRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = navRef.current;
      setScrollState({
        left: scrollLeft > 10,
        right: scrollLeft < scrollWidth - clientWidth - 10
      });
    }
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
    checkScroll();
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, [navItems]);

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
            {/* Logo */}
            <div className="flex items-center flex-shrink-0 cursor-pointer" onClick={() => navigate('/')}>
              <img src={logoUrutiX} alt="UrutiX Logistics Logo" className="h-10 sm:h-14 md:h-18 lg:h-20 w-auto object-contain" />
            </div>

            <div className="hidden lg:flex flex-1 items-center relative min-w-0">
              <div
                ref={navRef}
                className="flex items-center gap-2 ml-4 md:ml-8 text-gray-500 text-sm font-medium flex-nowrap min-w-0 w-full"
              >
                {navItems.map(item => {
                  const hasSubItems = item.subItems && item.subItems.length > 0;
                  const isActive = activeNavItem === item.label;

                  return (
                    <div key={item.label} className="relative" ref={el => dropdownRefs.current[item.label] = el}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (hasSubItems) {
                            setOpenDropdown(openDropdown === item.label ? null : item.label);
                          } else {
                            handleNavClick(item.path);
                          }
                        }}
                        className={`flex items-center gap-2 px-5 py-2.5 text-sm font-bold rounded-full transition-all duration-300 whitespace-nowrap shrink-0 touch-manipulation
                                            ${isActive
                            ? 'bg-primary-50 text-primary-500'
                            : 'text-slate-500 hover:text-primary-500 hover:bg-slate-50'}
                                        `}
                      >
                        {item.icon && <item.icon className="w-4.5 h-4.5" size={18} />}
                        <TranslatedText text={item.label} />
                        {hasSubItems && (
                          <ChevronDown className={`w-3 h-3 transition-transform ${openDropdown === item.label ? 'rotate-180' : ''}`} />
                        )}
                      </button>

                      {hasSubItems && openDropdown === item.label && (
                        <div className="absolute top-full left-0 mt-2 w-56 bg-white rounded-xl shadow-2xl border border-gray-100 z-[100] overflow-hidden py-1.5 animate-in fade-in slide-in-from-top-2 duration-200">
                          <div className="py-1">
                            {item.subItems?.map(subItem => (
                              <button
                                key={subItem.path}
                                onClick={() => handleNavClick(subItem.path)}
                                className={`w-full text-left px-4 py-2.5 text-sm transition-all flex items-center gap-2 ${location.pathname === subItem.path
                                  ? 'bg-primary-50 text-primary-500 font-semibold'
                                  : 'text-gray-600 hover:bg-white hover:text-primary-500 hover:shadow-sm'}`}
                              >
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

              <div className={`absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-white via-white/80 to-transparent z-10 pointer-events-none transition-opacity duration-300 ${scrollState.right ? 'opacity-100' : 'opacity-0'}`} />
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 md:gap-4 flex-shrink-0">
            <div className="hidden md:flex items-center gap-2 mr-4">
              <TenantCreditBalance />
              {children}
            </div>
            <CargoOwnerNotificationDropdown />
            <ContextualHelp context={location.pathname} />
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

        {showMobileMenu && (
          <div ref={mobileMenuRef} className="lg:hidden mt-4 bg-gray-50 rounded-xl p-4 border border-slate-100 shadow-inner">
            <div className="space-y-1">
              {navItems.map(item => (
                <div key={item.label}>
                  <button
                    onClick={() => item.subItems ? setOpenDropdown(openDropdown === item.label ? null : item.label) : handleNavClick(item.path)}
                    className={`w-full text-left px-4 py-3 rounded-lg flex items-center justify-between ${activeNavItem === item.label ? 'text-primary-500 bg-primary-50 font-bold' : 'text-gray-600 font-medium'}`}
                  >
                    <div className="flex items-center gap-2">
                      {item.icon && <item.icon className="w-4 h-4" />}
                      <span>{item.label}</span>
                    </div>
                    {item.subItems && <ChevronDown size={16} className={openDropdown === item.label ? 'rotate-180' : ''} />}
                  </button>
                  {item.subItems && openDropdown === item.label && (
                    <div className="ml-4 mt-1 border-l-2 border-slate-200 pl-4 space-y-1">
                      {item.subItems.map(sub => (
                        <button key={sub.path} onClick={() => handleNavClick(sub.path)} className="w-full text-left px-4 py-2 text-sm text-gray-500">{sub.label}</button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardHeader;
