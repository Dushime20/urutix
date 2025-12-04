import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  FaTachometerAlt, FaUsers, FaTruck, FaBox,
  FaChartLine, FaRoute, FaMapMarkerAlt, FaDesktop, FaGavel, FaBalanceScale, FaDollarSign,
  FaBars, FaTimes
} from 'react-icons/fa';
import { useAdminLayout } from '../../contexts/AdminLayoutContext';
import urutixLogo from '../../assets/urutix.png';

const Sidebar: React.FC = () => {
  const { sidebarCollapsed, toggleSidebar } = useAdminLayout();

  const menuItems = [
    { to: '/admin', label: 'Overview', icon: FaTachometerAlt },
    { to: '/admin/monitoring', label: 'Monitoring', icon: FaDesktop },
    { to: '/admin/bidding', label: 'Bidding', icon: FaGavel },
    { to: '/admin/disputes', label: 'Disputes', icon: FaBalanceScale },
    { to: '/admin/financial', label: 'Financial', icon: FaDollarSign },
    { to: '/admin/users', label: 'Users', icon: FaUsers },
    { to: '/admin/trucks', label: 'Trucks', icon: FaTruck },
    { to: '/admin/loads', label: 'Loads', icon: FaBox },
    { to: '/admin/trips', label: 'Trips', icon: FaRoute },
    { to: '/admin/analytics', label: 'Analytics', icon: FaChartLine },
    { to: '/admin/tenants', label: 'Tenants', icon: FaMapMarkerAlt },
    { to: '/admin/routes', label: 'Routes', icon: FaRoute },
    { to: '/admin/lenders/register', label: 'Lenders', icon: FaDollarSign },
    { to: '/admin/borrowers', label: 'Borrowers', icon: FaUsers },
  ];

  return (
    <>
      {/* Mobile overlay */}
      {!sidebarCollapsed && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
          onClick={toggleSidebar}
        />
      )}
      
      <aside className={`${sidebarCollapsed ? 'w-16' : 'w-64'} bg-white/80 backdrop-blur border-r h-screen flex flex-col transition-all duration-300 fixed lg:sticky top-0 z-30`}>
        {/* Header with toggle */}
        <div className={`${sidebarCollapsed ? 'p-2' : 'p-4'} border-b flex items-center justify-between`}>
          {!sidebarCollapsed && (
            <div className="flex items-center space-x-2">
              <FaTachometerAlt className="text-primary-600 text-xl" />
              <div>
                <div className="text-xs uppercase text-gray-500 tracking-wider">UrutiX</div>
                <div className="text-lg font-bold text-gray-900">Admin Console</div>
              </div>
            </div>
          )}
          <button
            onClick={toggleSidebar}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {sidebarCollapsed ? <FaBars /> : <FaTimes />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {menuItems.map(item => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) => `flex items-center ${sidebarCollapsed ? 'justify-center px-2' : 'space-x-3 px-3'} py-2 text-sm transition-colors rounded ${isActive ? 'bg-primary-50 text-primary-700 font-medium border-r-2 border-primary-600' : 'text-gray-700 hover:bg-gray-50'}`}
                end={item.to === '/admin'}
                title={sidebarCollapsed ? item.label : undefined}
              >
                <Icon className="text-lg flex-shrink-0" />
                {!sidebarCollapsed && <span>{item.label}</span>}
              </NavLink>
            );
          })}
        </nav>
        
        {/* Footer with Logo */}
        <div className={`${sidebarCollapsed ? 'p-2' : 'p-4'} border-t flex items-center justify-center`}>
          {sidebarCollapsed ? (
            <img 
              src={urutixLogo} 
              alt="UrutiX Logo" 
              className="w-full h-auto max-h-12 object-contain"
            />
          ) : (
            <div className="w-full flex flex-col items-center gap-2">
              <img 
                src={urutixLogo} 
                alt="UrutiX Logo" 
                className="w-full h-auto max-h-32 object-contain"
              />
            </div>
          )}
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
