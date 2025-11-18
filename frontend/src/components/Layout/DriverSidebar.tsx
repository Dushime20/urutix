import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  FaUser,
  FaRoute,
  FaDollarSign,
  FaShieldAlt,
  FaFileAlt,
  FaBell,
  FaMapMarkedAlt,
  FaChartBar,
  FaQuestionCircle,
  FaTruck,
  FaBox
} from 'react-icons/fa';

interface DriverSidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
}

type NavigationSection = {
  section?: string;
  items: Array<{
    name: string;
    path: string;
    icon: React.ComponentType<{ className?: string }>;
    end?: boolean;
  }>;
};

const DriverSidebar: React.FC<DriverSidebarProps> = ({ isCollapsed, onToggle }) => {
  const navigationItems: NavigationSection[] = [
    {
      section: 'Driver Management',
      items: [
        {
          name: 'Dashboard',
          path: '/dashboard/driver',
          icon: FaUser,
          end: true,
        },
        {
          name: 'My Trips',
          path: '/dashboard/driver/trips',
          icon: FaRoute
        },
        {
          name: 'My Truck',
          path: '/dashboard/driver/truck',
          icon: FaTruck
        }
      ]
    },
    {
      items: [
        {
          name: 'Cargo Management',
          path: '/dashboard/driver/cargo',
          icon: FaBox
        },
        {
          name: 'Earnings',
          path: '/dashboard/driver/earnings',
          icon: FaDollarSign
        },
        {
          name: 'Safety & Compliance',
          path: '/dashboard/driver/safety',
          icon: FaShieldAlt
        },
        {
          name: 'Documents',
          path: '/dashboard/driver/documents',
          icon: FaFileAlt
        },
        {
          name: 'Live Tracking',
          path: '/dashboard/driver/tracking',
          icon: FaMapMarkedAlt
        },
        {
          name: 'Analytics',
          path: '/dashboard/driver/analytics',
          icon: FaChartBar
        }
      ]
    },
    {
      section: 'Account & Settings',
      items: [
        {
          name: 'Notifications',
          path: '/dashboard/driver/notifications',
          icon: FaBell
        },
        {
          name: 'Account & Settings',
          path: '/dashboard/driver/profile',
          icon: FaUser
        },
        {
          name: 'Help & Support',
          path: '/dashboard/driver/support',
          icon: FaQuestionCircle
        }
      ]
    }
  ];

  return (
    <div
      className={`relative border-r border-gray-200/60 bg-gradient-to-b from-white via-white to-gray-100 shadow-sm transition-all duration-300 ${
      isCollapsed ? 'w-16' : 'w-64'
    } h-full flex flex-col`}
    >
      {/* Header */}
      <div className="border-b border-gray-200/70 bg-white/80 p-4 backdrop-blur">
        <div className="flex items-center justify-between gap-3">
          {!isCollapsed && (
            <div className="flex items-center space-x-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-600/10 text-primary-600">
                <FaUser className="text-lg" />
              </div>
              <div>
                <span className="block text-xs font-semibold uppercase tracking-wider text-gray-400">
                  Dashboard
                </span>
                <span className="block text-base font-bold text-gray-900">Driver</span>
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
      <nav className="flex-1 overflow-y-auto py-6">
        {navigationItems.map((section, sectionIndex) => (
          <div key={sectionIndex} className="mb-6 px-3">
            {!isCollapsed && section.section && (
              <h3 className="mb-3 px-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
                {section.section}
              </h3>
            )}
            <div className="space-y-2">
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
                          ? 'bg-primary-600 text-white shadow-lg shadow-primary-500/30'
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
                              ? 'border-white/40 bg-white text-primary-600 shadow-sm'
                              : 'border-gray-200 bg-white text-gray-500 group-hover:border-primary-200 group-hover:text-primary-600'
                          }`}
                        >
                          <IconComponent className="h-4 w-4" />
                        </div>
                        {!isCollapsed && (
                          <span className="flex-1 truncate">{item.name}</span>
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
        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <FaUser className="text-primary-600" />
            <span>Driver Account</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default DriverSidebar;

