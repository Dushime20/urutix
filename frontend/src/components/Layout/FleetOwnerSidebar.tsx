import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  FaTruck, 
  FaPlus, 
  FaList, 
  FaMapMarkedAlt, 
  FaChartBar, 
  FaCog, 
  FaUser, 
  FaBell, 
  FaBox,
  FaFileInvoice,
  FaHistory,
  FaStar,
  FaQuestionCircle,
  FaThumbsUp,
  FaGift,
  FaChartLine,
  FaUsers,
  FaRoute,
  FaTools,
  FaShieldAlt,
  FaDollarSign,
  FaGavel,
  FaWarehouse
} from 'react-icons/fa';
import sidebarBack from '../../assets/sidebar-back.svg';
import urutixLogo from '../../assets/urutix.png';
import { TranslatedText } from '../translated-text';

interface FleetOwnerSidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
}

const FleetOwnerSidebar: React.FC<FleetOwnerSidebarProps> = ({ isCollapsed, onToggle }) => {
  const location = useLocation();

  const navigationItems = [
    {
      section: '',
      items: [
        {
          name: 'Dashboard',
          path: '/dashboard/fleet',
          icon: FaTruck,
          description: 'Overview of your fleet',
          end: true
        },
        {
          name: 'Truck Management',
          path: '/dashboard/fleet/trucks',
          icon: FaList,
          description: 'Manage trucks, add new vehicles, and track active trips'
        }
      ]
    },
    {
      section: 'Driver Management',
      items: [
        {
          name: 'My Drivers',
          path: '/dashboard/fleet/drivers',
          icon: FaUsers,
          description: 'Manage drivers, add new drivers, and assign them to trucks'
        }
      ]
    },
    {
      section: '',
      items: [
        {
          name: 'Analytics',
          path: '/dashboard/fleet/analytics',
          icon: FaChartBar,
          description: 'Fleet analytics and PDF reports'
        }
      ]
    },
    {
      section: '',
      items: [
        {
          name: 'Bids',
          path: '/dashboard/fleet/bids',
          icon: FaGavel,
          description: 'View and apply to auctions'
        },
        {
          name: 'Route Planning',
          path: '/dashboard/fleet/routes',
          icon: FaRoute,
          description: 'Plan optimal routes'
        }
      ]
    },
    {
      section: '',
      items: [
        {
          name: 'Safety Records',
          path: '/dashboard/fleet/safety',
          icon: FaShieldAlt,
          description: 'Safety and compliance records'
        },
        {
          name: 'Financial Management',
          path: '/dashboard/fleet/financial',
          icon: FaDollarSign,
          description: 'Billing, invoicing, payments, and financial analytics'
        }
      ]
    },
    {
      section: '',
      items: [
        {
          name: 'Help & Support',
          path: '/dashboard/fleet/support',
          icon: FaQuestionCircle,
          description: 'Get help and contact support'
        }
      ]
    }
  ];

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  return (
    <div
      className={`relative border-r border-gray-200/60 bg-gradient-to-b from-white via-white to-gray-100 shadow-sm transition-all duration-300 ${
      isCollapsed ? 'w-16' : 'w-64'
    } h-full flex flex-col overflow-hidden`}
      style={{
        backgroundImage: `url(${sidebarBack})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      {/* Background overlay for better readability */}
      <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-0" />
      
      {/* Content wrapper with relative z-index */}
      <div className="relative z-10 flex flex-col h-full">
      {/* Header */}
      <div className="border-b border-gray-200/70 bg-white/90 p-4 backdrop-blur-sm">
        <div className="flex items-center justify-between gap-3">
          {!isCollapsed && (
            <div className="flex items-center space-x-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-600/10 text-primary-600">
                <FaTruck className="text-lg" />
              </div>
              <div>
                <span className="block text-xs font-semibold uppercase tracking-wider text-gray-400">
                  <TranslatedText text="Dashboard" />
                </span>
                <span className="block text-base font-bold text-gray-900">
                  <TranslatedText text="Fleet Owner" />
                </span>
              </div>
            </div>
          )}
          <button
            onClick={onToggle}
            className="rounded-md p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-800"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-6 relative z-10">
        {navigationItems.map((section, sectionIndex) => (
          <div key={sectionIndex} className="px-3">
            {!isCollapsed && section.section && section.section !== 'Driver Management' && (
              <h3 className="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
                <TranslatedText text={section.section} />
              </h3>
            )}
            <div className="space-y-2 mb-4">
              {section.items.map((item, itemIndex) => {
                const IconComponent = item.icon;
                return (
                  <NavLink
                    key={itemIndex}
                    to={item.path}
                    end={item?.end}
                    className={({ isActive }) =>
                      `group relative flex items-center ${isCollapsed ? 'justify-center p-2' : 'gap-3 px-3 py-2'} rounded-xl text-sm font-semibold transition-all duration-200 ${
                        isActive
                          ? 'bg-primary-600 text-white'
                          : 'text-gray-600 hover:bg-primary-50/80 hover:text-primary-700'
                      }`
                    }
                    title={isCollapsed ? item.name : undefined}
                  >
                    {({ isActive }) => (
                      <>
                        <div
                          className={`flex h-9 w-9 items-center justify-center rounded-lg border text-base transition-all duration-200 ${
                            isActive
                              ? 'border-white/40 bg-white text-primary-600'
                              : 'border-gray-200 bg-white text-gray-500 group-hover:border-primary-200 group-hover:text-primary-600'
                          }`}
                        >
                          <IconComponent className="h-4 w-4" />
                        </div>
                        {!isCollapsed && (
                          <span className="flex-1 truncate">
                            <TranslatedText text={item.name} />
                          </span>
                        )}
                        {isActive && isCollapsed && (
                          <span className="absolute inset-y-2 right-1 w-1 rounded-full bg-white" />
                        )}
                      </>
                    )}
                  </NavLink>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      {!isCollapsed && (
        <div className="p-4 border-t border-gray-200/70 relative z-10">
          <div className="flex items-center justify-center w-full">
            <img 
              src={urutixLogo} 
              alt="UrutiX Logo" 
              className="w-full h-auto object-contain"
            />
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

export default FleetOwnerSidebar; 