import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { User, Menu, X, ChevronDown, Package, Gavel, MapPin, BarChart3, CreditCard, FileText, Settings, HelpCircle, Truck, Users, Route, Shield, Wallet, DollarSign, Home, CheckCircle, ClipboardList, Receipt } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import ContextualHelp from '../Help/ContextualHelp';
import NotificationDropdown from '../notifications/NotificationDropdown';

interface DashboardHeaderProps {
  children?: React.ReactNode;
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const userMenuRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);



  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node)) {
        setShowMobileMenu(false);
      }
    };

    if (showUserMenu || showMobileMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showUserMenu, showMobileMenu]);

  const handleLogout = async () => {
    setShowUserMenu(false);
    try {
      if (logout && typeof logout === 'function') {
        logout();
      } else {
        // Fallback logout
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
      }
      // Redirect to auth page
      setTimeout(() => {
        window.location.href = '/auth';
      }, 100);
    } catch (error) {
      console.error('Logout error:', error);
      window.location.href = '/auth';
    }
  };

  // Role-based navigation items
  const getNavItems = () => {
    const basePath = user?.role === 'CARGO_OWNER' ? '/cargo-owner' : '/dashboard';

    if (user?.role === 'CARGO_RECEIVER') {
      return [
        {
          label: 'Dashboard',
          path: '/dashboard',
          icon: Home
        },
        {
          label: 'My Cargos',
          path: '/cargo-owner/cargos/my-cargos',
          icon: Package
        },
        {
          label: 'Tracking',
          path: '/cargo-owner/tracking',
          icon: MapPin
        },
        {
          label: 'Settings',
          path: '/cargo-owner/settings',
          icon: Settings
        },
      ];
    }

    if (user?.role === 'CARGO_OWNER') {
      return [
        {
          label: 'Dashboard',
          path: basePath,
          icon: Home
        },
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
          label: 'Receivers',
          path: `${basePath}/receivers`,
          icon: Users
        },
        {
          label: 'Bidding',
          path: `${basePath}/bidding`,
          icon: Gavel
        },
        {
          label: 'Tracking',
          path: `${basePath}/tracking`,
          icon: MapPin
        },
      ];
    }

    if (user?.role === 'BROKER') {
      return [
        {
          label: 'Dashboard',
          path: '/dashboard/broker',
          icon: Home
        },
        {
          label: 'Loads',
          path: '/dashboard/broker/loads',
          icon: Package
        },
        {
          label: 'Bidding',
          path: '/dashboard/broker/bidding',
          icon: Gavel
        },
        {
          label: 'Contracts',
          path: '/dashboard/broker/contracts',
          icon: FileText
        },
        {
          label: 'Tracking',
          path: '/dashboard/broker/tracking',
          icon: MapPin
        },
        {
          label: 'Commissions',
          path: '/dashboard/broker/commissions',
          icon: DollarSign
        },
        {
          label: 'Analytics',
          path: '/dashboard/broker/analytics',
          icon: BarChart3
        },
        {
          label: 'Profile',
          path: '/dashboard/broker/profile',
          icon: User
        },
      ];
    }

    if (user?.role === 'DRIVER') {
      return [
        {
          label: 'Dashboard',
          path: '/dashboard/driver',
          icon: Home
        },
        {
          label: 'My Trips',
          path: '/dashboard/driver/trips',
          icon: Route
        },
        {
          label: 'My Truck',
          path: '/dashboard/driver/truck',
          icon: Truck
        },
        {
          label: 'Cargo Management',
          path: '/dashboard/driver/cargo',
          icon: Package
        },
        {
          label: 'Earnings',
          path: '/dashboard/driver/earnings',
          icon: DollarSign
        },
        {
          label: 'Safety & Compliance',
          path: '/dashboard/driver/safety',
          icon: Shield
        },
        {
          label: 'Live Tracking',
          path: '/dashboard/driver/tracking',
          icon: MapPin
        },
        {
          label: 'Analytics',
          path: '/dashboard/driver/analytics',
          icon: BarChart3
        },
        {
          label: 'Profile',
          path: '/dashboard/driver/profile',
          icon: User
        },
      ];
    }

    if (user?.role === 'TRUCK_OWNER') {
      return [
        {
          label: 'Dashboard',
          path: '/dashboard/fleet',
          icon: Home
        },
        {
          label: 'Fleet Management',
          path: '/dashboard/fleet/drivers',
          icon: Truck,
          subItems: [
            { label: 'Drivers', path: '/dashboard/fleet/drivers' },
            { label: 'Trucks', path: '/dashboard/fleet/trucks' },
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
            { label: 'Analytics', path: '/dashboard/fleet/analytics' },
          ]
        },
      ];
    }

    if (user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN') {
      return [
        {
          label: 'Users',
          path: '/admin/users',
          icon: Users
        },
        {
          label: 'Analytics',
          path: '/admin/analytics',
          icon: BarChart3
        },
        {
          label: 'Settings',
          path: '/admin/settings',
          icon: Settings
        },
        {
          label: 'Reports',
          path: '/admin/reports',
          icon: FileText
        },
        {
          label: 'Help',
          path: '/admin/help',
          icon: HelpCircle
        },
      ];
    }

    if (user?.role === 'LENDER') {
      return [
        {
          label: 'Overview',
          path: '/lender',
          icon: Home
        },
        {
          label: 'Loan Requests',
          path: '/lender/requests',
          icon: Wallet
        },
        {
          label: 'Active Loans',
          path: '/lender/active',
          icon: Receipt
        },
        {
          label: 'Disbursements',
          path: '/lender/disbursements',
          icon: Wallet
        },
        {
          label: 'Repayments',
          path: '/lender/repayments',
          icon: CheckCircle
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
        {
          label: 'Management',
          path: '/lender/borrowers',
          icon: Users,
          subItems: [
            { label: 'Borrower Management', path: '/lender/borrowers' },
            { label: 'Lending Policies', path: '/lender/policies' },
            { label: 'Credit Assessment', path: '/lender/credit' },
            { label: 'Transaction History', path: '/lender/history' },
            { label: 'Receipts', path: '/lender/receipts' },
          ]
        },
        {
          label: 'Account',
          path: '/lender/profile',
          icon: User,
          subItems: [
            { label: 'Profile', path: '/lender/profile' },
            { label: 'Team Management', path: '/lender/team' },
            { label: 'Notifications', path: '/lender/notifications' },
            { label: 'Support', path: '/lender/support' },
          ]
        },
      ];
    }

    if (user?.role === 'TENANT_ADMIN') {
      return [
        {
          label: 'Dashboard',
          path: '/tenant-admin',
          icon: Home
        },
        {
          label: 'Fleet Management',
          path: '/tenant-admin/fleet',
          icon: Truck
        },
        {
          label: 'Cargo Operations',
          path: '/tenant-admin/cargo',
          icon: Package
        },
        {
          label: 'Drivers',
          path: '/tenant-admin/drivers',
          icon: Users
        },
        {
          label: 'Lenders',
          path: '/tenant-admin/lenders',
          icon: DollarSign
        },
        {
          label: 'Routes',
          path: '/tenant-admin/routes',
          icon: Route
        },
        {
          label: 'Trip Management',
          path: '/tenant-admin/trips',
          icon: ClipboardList
        },
        {
          label: 'Financial',
          path: '/tenant-admin/financial',
          icon: DollarSign
        },
        {
          label: 'Analytics',
          path: '/tenant-admin/analytics',
          icon: BarChart3
        },
        {
          label: 'Reports',
          path: '/tenant-admin/reports',
          icon: ClipboardList
        },
        {
          label: 'Tenant Settings',
          path: '/tenant-admin/settings',
          icon: Settings
        },
      ];
    }

    // Default navigation for other roles
    return [
      { label: 'Dashboard', path: '/dashboard', icon: Home },
      { label: 'All Cargos', path: '/dashboard/cargos', icon: Package },
      { label: 'Transactions', path: '/dashboard/payments', icon: CreditCard },
      { label: 'Analytics', path: '/dashboard/analytics', icon: BarChart3 },
      { label: 'Tracking', path: '/dashboard/tracking', icon: MapPin },
      { label: 'Settings', path: '/dashboard/settings', icon: Settings },
      { label: 'Support', path: '/dashboard/support', icon: HelpCircle },
    ];
  };

  const navItems = getNavItems();
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const dropdownRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      Object.keys(dropdownRefs.current).forEach(key => {
        if (dropdownRefs.current[key] && !dropdownRefs.current[key]?.contains(event.target as Node)) {
          setOpenDropdown(null);
        }
      });
    };

    if (openDropdown) {
      // Use 'click' instead of 'mousedown' to let onClick handlers fire first
      document.addEventListener('click', handleClickOutside);
    }

    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [openDropdown]);

  // Determine active nav item based on current path
  const getActiveNavItem = () => {
    const path = location.pathname;
    const basePath = user?.role === 'CARGO_OWNER' ? '/cargo-owner' : '/dashboard';

    // Dashboard paths
    if (path === basePath || path === `${basePath}/` ||
      path === '/dashboard/broker' || path === '/dashboard/broker/' ||
      path === '/dashboard/driver' || path === '/dashboard/driver/' ||
      path === '/dashboard/fleet' || path === '/dashboard/fleet/' ||
      path === '/lender' || path === '/lender/' ||
      path === '/tenant-admin' || path === '/tenant-admin/') return 'Dashboard';

    // Broker-specific paths
    if (user?.role === 'BROKER') {
      if (path.includes('/broker/loads')) return 'My Loads';
      if (path.includes('/broker/discovery')) return 'Cargo Discovery';
      if (path.includes('/broker/deals')) return 'Deal Facilitation';
      if (path.includes('/broker/smart-matching')) return 'Smart Matching';
      if (path.includes('/broker/contracts') || path.includes('/broker/insurance') ||
        path.includes('/broker/escrow') || path.includes('/broker/documents')) return 'Services';
      if (path.includes('/broker/disputes')) return 'Disputes';
      if (path.includes('/broker/market-intelligence')) return 'Market Intelligence';
      if (path.includes('/broker/credit-management')) return 'Credit Management';
      if (path.includes('/broker/multi-stop')) return 'Multi-Stop';
      if (path.includes('/broker/performance')) return 'Performance Analytics';
      if (path.includes('/broker/commissions')) return 'Commissions';
      if (path.includes('/broker/analytics')) return 'Analytics';
      if (path.includes('/broker/notifications')) return 'Notifications';
      if (path.includes('/broker/profile')) return 'Profile';
    }

    // Driver-specific paths
    if (user?.role === 'DRIVER') {
      if (path.includes('/driver/trips')) return 'My Trips';
      if (path.includes('/driver/truck')) return 'My Truck';
      if (path.includes('/driver/cargo')) return 'Cargo Management';
      if (path.includes('/driver/earnings')) return 'Earnings';
      if (path.includes('/driver/safety')) return 'Safety & Compliance';
      if (path.includes('/driver/documents')) return 'Documents';
      if (path.includes('/driver/tracking')) return 'Live Tracking';
      if (path.includes('/driver/analytics')) return 'Analytics';
      if (path.includes('/driver/notifications')) return 'Notifications';
      if (path.includes('/driver/profile')) return 'Profile';
    }

    // Truck Owner/Fleet Owner paths
    if (user?.role === 'TRUCK_OWNER') {
      if (path.includes('/fleet/drivers') || path.includes('/fleet/trucks') || path.includes('/fleet/safety')) return 'Fleet Management';
      if (path.includes('/trips') || path.includes('/fleet/bids') || path.includes('/fleet/routes')) return 'Operations';
      if (path.includes('/fleet/financial') || path.includes('/payments') || path.includes('/fleet/analytics')) return 'Financial';
      if (path.includes('/notifications')) return 'Notifications';
    }

    // Admin paths
    if (user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN') {
      if (path.includes('/admin/users')) return 'Users';
      if (path.includes('/admin/analytics')) return 'Analytics';
      if (path.includes('/admin/settings')) return 'Settings';
      if (path.includes('/admin/reports')) return 'Reports';
      if (path.includes('/admin/help')) return 'Help';
    }

    // Lender paths
    if (user?.role === 'LENDER') {
      if (path.includes('/lender/requests')) return 'Loan Requests';
      if (path.includes('/lender/active')) return 'Active Loans';
      if (path.includes('/lender/disbursements')) return 'Disbursements';
      if (path.includes('/lender/repayments')) return 'Repayments';
      if (path.includes('/lender/analytics') || path.includes('/lender/risk') ||
        path.includes('/lender/interest') || path.includes('/lender/reports')) return 'Analytics';
      if (path.includes('/lender/borrowers') || path.includes('/lender/policies') ||
        path.includes('/lender/credit') || path.includes('/lender/history') ||
        path.includes('/lender/receipts')) return 'Management';
      if (path.includes('/lender/profile') || path.includes('/lender/team') ||
        path.includes('/lender/notifications') || path.includes('/lender/support')) return 'Account';
    }

    // Tenant Admin paths
    if (user?.role === 'TENANT_ADMIN') {
      if (path.includes('/tenant-admin/fleet')) return 'Fleet Management';
      if (path.includes('/tenant-admin/cargo')) return 'Cargo Operations';
      if (path.includes('/tenant-admin/drivers')) return 'Drivers';
      if (path.includes('/tenant-admin/lenders')) return 'Lenders';
      if (path.includes('/tenant-admin/routes')) return 'Routes';
      if (path.includes('/tenant-admin/trips')) return 'Trip Management';
      if (path.includes('/tenant-admin/financial')) return 'Financial';
      if (path.includes('/tenant-admin/analytics')) return 'Analytics';
      if (path.includes('/tenant-admin/reports')) return 'Reports';
      if (path.includes('/tenant-admin/settings')) return 'Tenant Settings';
    }

    // Cargo owner paths
    if (path.includes('/cargos')) return 'Cargo Management';
    if (path.includes('/receivers')) return 'Receivers';
    if (path.includes('/bidding') || path.includes('/my-bids')) return 'Bidding';
    if (path.includes('/payments') || path.includes('/loan-requests') || path.includes('/financial')) return 'Payments';
    if (path.includes('/analytics') || path.includes('/reports') || path.includes('/history')) return 'Analytics';
    if (path.includes('/tracking') || path.includes('/routes')) return 'Tracking';
    if (path.includes('/documents')) return 'Documents';
    if (path.includes('/notifications')) return 'Notifications';
    if (path.includes('/settings') || path.includes('/profile')) return 'Settings';
    if (path.includes('/support')) return 'Support';
    return null;
  };

  const activeNavItem = getActiveNavItem();

  const handleNavClick = (path: string) => {
    navigate(path);
    setShowMobileMenu(false);
    setOpenDropdown(null);
  };

  return (
    <div data-header="dashboard-header" className="bg-white border-b border-gray-200 text-gray-900 px-4 pt-6 pb-3 sm:px-6 sm:pt-8 sm:pb-4 relative overflow-visible z-50">

      {/* Custom Header inside Dark Section */}
      <div className="max-w-7xl mx-auto px-2 sm:px-3 md:px-4 lg:px-6 xl:px-8 relative z-50">
        {/* Top Row: Logo, Mobile Menu, Search, Notifications, User */}
        <div className="flex justify-between items-center relative z-10 gap-2 sm:gap-3 md:gap-4">
          <div className="flex items-center gap-2 sm:gap-3 md:gap-4 min-w-0 flex-1">
            {/* Mobile Menu Button */}
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="lg:hidden p-2 bg-gray-50 rounded-lg hover:bg-gray-100 active:bg-gray-200 transition-colors touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center flex-shrink-0 text-gray-600"
              aria-label="Toggle menu"
            >
              {showMobileMenu ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>

            {/* Logo */}
            <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
              <div className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 bg-[#345E85] rounded-lg flex items-center justify-center">
                <Truck className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 text-white" />
              </div>
              <span className="text-base sm:text-lg md:text-xl font-bold">UrutiX</span>
            </div>

            {/* Desktop Nav - Keep only most important items */}
            <div className="hidden lg:flex items-center gap-3 ml-8 text-gray-500 text-sm font-medium">
              {navItems.map(item => {
                const hasSubItems = item.subItems && item.subItems.length > 0;
                const isActive = activeNavItem === item.label ||
                  (hasSubItems && item.subItems?.some(sub => location.pathname.includes(sub.path.split('/').pop() || '')));

                const setRef = (el: HTMLDivElement | null) => {
                  if (el) {
                    dropdownRefs.current[item.label] = el;
                  }
                };

                return (
                  <div key={item.label} className="relative" ref={setRef}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (hasSubItems) {
                          setOpenDropdown(openDropdown === item.label ? null : item.label);
                        } else {
                          handleNavClick(item.path);
                        }
                      }}
                      className={`px-4 py-2 rounded-full whitespace-nowrap transition-all touch-manipulation flex items-center gap-1.5 ${isActive
                        ? 'text-navy-600 bg-navy-50'
                        : 'hover:text-gray-900 hover:bg-gray-100'
                        }`}
                    >
                      {item.icon && <item.icon className="w-4 h-4" />}
                      <span>{item.label}</span>
                      {hasSubItems && (
                        <ChevronDown className={`w-3 h-3 transition-transform ${openDropdown === item.label ? 'rotate-180' : ''}`} />
                      )}
                    </button>

                    {/* Dropdown Menu */}
                    {hasSubItems && openDropdown === item.label && (
                      <div className="absolute top-full left-0 mt-1 w-48 bg-white rounded-lg shadow-xl border border-gray-200 z-[100] pointer-events-auto">
                        <div className="py-1">
                          {item.subItems?.map(subItem => (
                            <button
                              key={subItem.path}
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleNavClick(subItem.path);
                              }}
                              className={`w-full text-left px-4 py-2 text-sm transition-colors pointer-events-auto cursor-pointer ${location.pathname === subItem.path || location.pathname.startsWith(subItem.path + '/')
                                ? 'bg-navy-50 text-navy-700 font-medium'
                                : 'text-gray-700 hover:bg-navy-50 hover:text-navy-700'
                                }`}
                            >
                              {subItem.label}
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

          <div className="flex items-center gap-1.5 sm:gap-2 md:gap-4 flex-shrink-0">
            {/* Desktop Actions (Moved from Search) */}
            <div className="hidden md:flex items-center gap-2 mr-4">
              {children}
            </div>

            {/* Help & Support */}
            <ContextualHelp context={location.pathname} />

            {/* Notifications */}
            <NotificationDropdown />

            {/* User Menu */}
            <div className="relative z-[9999]" ref={userMenuRef}>
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 bg-gray-100 hover:bg-gray-200 border border-gray-200 rounded-full flex items-center justify-center flex-shrink-0 transition-all touch-manipulation focus:outline-none focus:ring-2 focus:ring-navy-500"
              >
                {user?.role === 'DRIVER' ? (
                  <User className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-gray-600" />
                ) : (
                  <div className="text-xs sm:text-sm font-bold text-gray-700">
                    {user?.firstName?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'}
                  </div>
                )}
              </button>
              {/* Dropdown Menu */}
              {showUserMenu && (
                <div
                  className="fixed w-48 bg-white rounded-lg shadow-2xl border border-gray-200"
                  style={{
                    top: '4.5rem',
                    right: '1rem',
                    zIndex: 99999
                  }}
                >
                  <div className="p-2">
                    <div className="px-3 py-2 border-b border-gray-100">
                      <div className="text-sm font-semibold text-gray-900">
                        {user?.firstName && user?.lastName
                          ? `${user.firstName} ${user.lastName}`
                          : user?.firstName || user?.email || 'User'
                        }
                      </div>
                      <div className="text-xs text-gray-500 truncate">{user?.email}</div>
                    </div>
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        navigate('/dashboard/settings');
                      }}
                      className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md transition-colors touch-manipulation min-h-[44px]"
                    >
                      Profile Settings
                    </button>
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        navigate('/dashboard/settings');
                      }}
                      className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md transition-colors touch-manipulation min-h-[44px]"
                    >
                      Account
                    </button>
                    <div className="border-t border-gray-100 my-1"></div>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md transition-colors touch-manipulation min-h-[44px]"
                    >
                      Logout
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>



        {/* Mobile Navigation Menu */}
        {showMobileMenu && (
          <div
            ref={mobileMenuRef}
            className="lg:hidden mb-4 bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10"
          >
            <div className="space-y-1">
              {navItems.map(item => {
                const hasSubItems = item.subItems && item.subItems.length > 0;
                const isActive = activeNavItem === item.label ||
                  (hasSubItems && item.subItems?.some(sub => location.pathname.includes(sub.path.split('/').pop() || '')));
                const isSubMenuOpen = openDropdown === item.label;

                return (
                  <div key={item.label}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (hasSubItems) {
                          setOpenDropdown(isSubMenuOpen ? null : item.label);
                        } else {
                          handleNavClick(item.path);
                        }
                      }}
                      className={`w-full text-left px-4 py-3 rounded-lg transition-all touch-manipulation min-h-[44px] flex items-center justify-between ${isActive
                        ? 'text-white bg-white/10 font-medium'
                        : 'text-gray-300 hover:text-white hover:bg-white/5'
                        }`}
                    >
                      <div className="flex items-center gap-2">
                        {item.icon && <item.icon className="w-4 h-4" />}
                        <span>{item.label}</span>
                      </div>
                      {hasSubItems && (
                        <ChevronDown className={`w-4 h-4 transition-transform ${isSubMenuOpen ? 'rotate-180' : ''}`} />
                      )}
                    </button>

                    {/* Mobile Sub-menu */}
                    {hasSubItems && isSubMenuOpen && (
                      <div className="ml-4 mt-1 space-y-1 border-l-2 border-white/10 pl-4 pointer-events-auto">
                        {item.subItems?.map(subItem => (
                          <button
                            key={subItem.path}
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleNavClick(subItem.path);
                            }}
                            className={`w-full text-left px-4 py-2 rounded-lg transition-all touch-manipulation min-h-[44px] text-sm pointer-events-auto cursor-pointer ${location.pathname === subItem.path || location.pathname.startsWith(subItem.path + '/')
                              ? 'text-white bg-white/10 font-medium'
                              : 'text-gray-300 hover:text-white hover:bg-white/5'
                              }`}
                          >
                            {subItem.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardHeader;

