import React from 'react';
import { NavLink } from 'react-router-dom';
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
  FaWarehouse,
  FaTimes
} from 'react-icons/fa';
import urutixLogo from '../../assets/urutix.png';
import { TranslatedText } from '../translated-text';

interface FleetOwnerSidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
  onClose?: () => void;
}

const FleetOwnerSidebar: React.FC<FleetOwnerSidebarProps> = ({ isCollapsed, onToggle, onClose }) => {
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

  return (
    <div
      className={`relative border-r border-gray-200/60 bg-gradient-to-b from-white via-white to-gray-100 shadow-sm transition-all duration-300 ${
      isCollapsed ? 'w-16' : 'w-64'
    } h-full flex flex-col lg:shadow-none`}
    >
      {/* Header */}
      <div className="border-b border-gray-200/70 bg-white/80 p-3 backdrop-blur">
        <div className="flex items-center justify-between gap-2">
          {!isCollapsed && (
            <div className="flex items-center space-x-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-600/10 text-primary-600">
                <FaTruck className="text-sm" />
              </div>
              <div>
                <span className="block text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                  <TranslatedText text="Dashboard" />
                </span>
                <span className="block text-sm font-bold text-gray-900">
                  <TranslatedText text="Fleet Owner" />
                </span>
              </div>
            </div>
          )}
          <div className="flex items-center gap-2">
            {/* Close button - visible on mobile, hidden on desktop */}
            {onClose && (
              <button
                onClick={onClose}
                className="lg:hidden rounded-md p-1.5 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-800"
                aria-label="Close sidebar"
              >
                <FaTimes className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4">
        {navigationItems.map((section, sectionIndex) => (
          <div key={sectionIndex} className="mb-4 px-2">
            {!isCollapsed && section.section && (
              <h3 className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                <TranslatedText text={section.section} />
              </h3>
            )}
            <div className="space-y-1.5">
              {section.items.map((item, itemIndex) => {
                const IconComponent = item.icon;
                return (
                  <NavLink
                    key={itemIndex}
                    to={item.path}
                    end={item?.end}
                    className={({ isActive }) =>
                      `group relative flex items-center ${isCollapsed ? 'justify-center p-1.5' : 'gap-2 px-2.5 py-1.5'} rounded-lg text-xs font-semibold transition-all duration-200 ${
                        isActive
                          ? 'bg-primary-600 text-white shadow-md shadow-primary-500/30'
                          : 'text-gray-600 hover:bg-primary-50/80 hover:text-primary-700'
                      }`
                    }
                    title={isCollapsed ? item.name : undefined}
                  >
                    {({ isActive }) => (
                      <>
                        <div
                          className={`flex h-7 w-7 items-center justify-center rounded-md border text-sm transition-all duration-200 ${
                            isActive
                              ? 'border-white/40 bg-white text-primary-600 shadow-sm'
                              : 'border-gray-200 bg-white text-gray-500 group-hover:border-primary-200 group-hover:text-primary-600'
                          }`}
                        >
                          <IconComponent className="h-3.5 w-3.5" />
                        </div>
                        {!isCollapsed && (
                          <span className="flex-1 truncate">
                            <TranslatedText text={item.name} />
                          </span>
                        )}
                        {isActive && isCollapsed && (
                          <span className="absolute inset-y-1.5 right-1 w-0.5 rounded-full bg-white" />
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
        <div className="p-3 border-t border-gray-200">
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
  );
};

export default FleetOwnerSidebar; 