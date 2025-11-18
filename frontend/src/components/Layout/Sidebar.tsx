import { NavLink } from 'react-router-dom';
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
  Shield
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const Sidebar = () => {
  const { user, logout } = useAuth();

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
    <div className="w-64 bg-white shadow-lg">
      <div className="flex flex-col h-full">
        {/* Logo */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
              <Truck className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">UrutiX</span>
          </div>
          {/* Show user role */}
          {user && (
            <div className="mt-2 text-sm text-gray-500">
              {user.firstName} {user.lastName}
              <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                {user.role.replace('_', ' ')}
              </span>
            </div>
          )}
        </div>

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
              <span>{item.label}</span>
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
            <span>Settings</span>
          </NavLink>
          
          <button
            onClick={logout}
            className="flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors w-full"
          >
            <LogOut className="w-5 h-5" />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Sidebar; 