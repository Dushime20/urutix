import { NavLink, useNavigate } from 'react-router-dom';
import { 
  Home, 
  Truck, 
  Package, 
  Route, 
  CreditCard, 
  BarChart3, 
  Bell,
  Settings,
  LogOut,
  MapPin,
  FileText,
  Calendar,
  Users,
  Shield,
  X,
  DollarSign,
  TrendingUp,
  Wallet,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import sidebarBack from '../../assets/sidebar-back.svg';
import { TranslatedText } from '../translated-text';

interface SidebarProps {
  onClose?: () => void;
}

const Sidebar = ({ onClose }: SidebarProps) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    try {
      // Direct logout approach - clear tokens immediately
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      
      // Call logout function if available
      if (logout && typeof logout === 'function') {
        logout();
      }
      
      // Force immediate redirect
      setTimeout(() => {
        window.location.href = '/auth';
      }, 100);
    } catch (error) {
      console.error('Logout error:', error);
      window.location.href = '/auth';
    }
  };

  // Debug logging
  console.log('Sidebar: Current user:', user);
  console.log('Sidebar: User role:', user?.role);

  // Role-based navigation items
  const getMenuItems = () => {
    if (!user) {
      console.log('Sidebar: No user found');
      return [];
    }

    console.log('Sidebar: Getting menu items for role:', user.role);

    switch (user.role) {
      case 'DRIVER':
        console.log('Sidebar: Using DRIVER navigation');
        return [
          { path: '/dashboard', icon: Home, label: 'Dashboard' },
          { path: '/dashboard/cargo', icon: Package, label: 'Cargo Management' },
          { path: '/dashboard/documents', icon: FileText, label: 'Documents' },
          { path: '/dashboard/notifications', icon: Bell, label: 'Notifications' },
          { path: '/dashboard/profile', icon: Users, label: 'Profile' },
        ];
      
      case 'CARGO_OWNER':
        console.log('Sidebar: Using CARGO_OWNER navigation');
        return [
          { path: '/cargo-owner', icon: Home, label: 'Dashboard' },
          { path: '/cargo-owner/cargos/list', icon: Package, label: 'Cargo Management' },
          { path: '/cargo-owner/my-bids', icon: Route, label: 'My Bids' },
          { path: '/cargo-owner/analytics', icon: BarChart3, label: 'Analytics' },
          { path: '/cargo-owner/payments', icon: CreditCard, label: 'Payments' },
          { path: '/cargo-owner/notifications', icon: Bell, label: 'Notifications' },
        ];
      
      case 'TRUCK_OWNER':
        return [
          { path: '/dashboard', icon: Home, label: 'Dashboard' },
          { path: '/dashboard/fleet', icon: Truck, label: 'Fleet Management' },
          { path: '/dashboard/drivers', icon: Users, label: 'Drivers' },
          { path: '/dashboard/trips', icon: Route, label: 'Trips' },
          { path: '/dashboard/analytics', icon: BarChart3, label: 'Analytics' },
          { path: '/dashboard/payments', icon: CreditCard, label: 'Payments' },
          { path: '/dashboard/notifications', icon: Bell, label: 'Notifications' },
        ];
      
      case 'ADMIN':
      case 'SUPER_ADMIN':
        return [
          { path: '/dashboard', icon: Home, label: 'Dashboard' },
          { path: '/dashboard/admin/users', icon: Users, label: 'User Management' },
          { path: '/dashboard/admin/tenants', icon: Shield, label: 'Tenant Management' },
          { path: '/dashboard/admin/analytics', icon: BarChart3, label: 'Analytics' },
          { path: '/dashboard/admin/monitoring', icon: BarChart3, label: 'Monitoring' },
          { path: '/dashboard/notifications', icon: Bell, label: 'Notifications' },
        ];
      
      case 'LENDER':
        return [
          { path: '/dashboard', icon: Home, label: 'Dashboard' },
          { path: '/dashboard/loans', icon: CreditCard, label: 'Loan Management' },
          { path: '/dashboard/borrowers', icon: Users, label: 'Borrowers' },
          { path: '/dashboard/analytics', icon: BarChart3, label: 'Analytics' },
          { path: '/dashboard/notifications', icon: Bell, label: 'Notifications' },
        ];
      
      case 'BROKER':
        console.log('Sidebar: Using BROKER navigation');
        return [
          { path: '/dashboard/broker', icon: Home, label: 'Dashboard' },
          { path: '/dashboard/broker/loads', icon: Package, label: 'My Loads' },
          { path: '/dashboard/broker/discovery', icon: Package, label: 'Cargo Discovery' },
          { path: '/dashboard/broker/deals', icon: TrendingUp, label: 'Deal Facilitation' },
          { path: '/dashboard/broker/contracts', icon: FileText, label: 'Contracts' },
          { path: '/dashboard/broker/insurance', icon: Shield, label: 'Insurance Verification' },
          { path: '/dashboard/broker/disputes', icon: AlertCircle, label: 'Disputes' },
          { path: '/dashboard/broker/escrow', icon: Wallet, label: 'Escrow' },
          { path: '/dashboard/broker/documents', icon: FileText, label: 'Documents' },
          { path: '/dashboard/broker/smart-matching', icon: TrendingUp, label: 'Smart Matching' },
          { path: '/dashboard/broker/market-intelligence', icon: BarChart3, label: 'Market Intelligence' },
          { path: '/dashboard/broker/credit-management', icon: CreditCard, label: 'Credit Management' },
          { path: '/dashboard/broker/multi-stop', icon: Route, label: 'Multi-Stop' },
          { path: '/dashboard/broker/performance', icon: BarChart3, label: 'Performance Analytics' },
          { path: '/dashboard/broker/commissions', icon: DollarSign, label: 'Commissions' },
          { path: '/dashboard/broker/analytics', icon: BarChart3, label: 'Analytics' },
          { path: '/dashboard/broker/notifications', icon: Bell, label: 'Notifications' },
          { path: '/dashboard/broker/profile', icon: Users, label: 'Profile' },
        ];
      
      default:
        console.log('Sidebar: Using DEFAULT navigation for role:', user.role);
        return [
          { path: '/dashboard', icon: Home, label: 'Dashboard' },
          { path: '/dashboard/notifications', icon: Bell, label: 'Notifications' },
        ];
    }
  };

  const menuItems = getMenuItems();

  return (
    <div 
      className="w-64 h-full bg-white shadow-lg relative overflow-hidden lg:shadow-none"
      style={{
        backgroundImage: `url(${sidebarBack})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      {/* Background overlay for better readability */}
      <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-0" />
      
      <div className="flex flex-col h-full relative z-10">
        {/* Logo and Close Button */}
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
              <Truck className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">UrutiX</span>
          </div>
          {/* Close button - visible on mobile, hidden on desktop (desktop uses menu button to toggle) */}
          {onClose && (
            <button
              onClick={onClose}
              className="lg:hidden p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
              aria-label="Close sidebar"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          )}
        </div>
        
        {/* Show user role */}
        {user && (
          <div className="px-4 pt-2 pb-2 text-sm text-gray-500">
            {user.firstName} {user.lastName}
            <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
              {user.role.replace('_', ' ')}
            </span>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-2">
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-primary-50 text-primary-700 border-r-2 border-primary-600'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`
              }
            >
              <item.icon className="w-5 h-5" />
              <span><TranslatedText text={item.label} /></span>
            </NavLink>
          ))}
        </nav>

        {/* Bottom section */}
        <div className="p-4 border-t border-gray-200 space-y-2">
          <NavLink
            to="/dashboard/settings"
            className="flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors"
          >
            <Settings className="w-5 h-5" />
            <span><TranslatedText text="Settings" /></span>
          </NavLink>
          
          <button
            onClick={handleLogout}
            className="flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors w-full"
          >
            <LogOut className="w-5 h-5" />
            <span><TranslatedText text="Logout" /></span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Sidebar; 