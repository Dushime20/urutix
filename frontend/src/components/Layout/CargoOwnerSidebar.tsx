import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  FaBell,
  FaBox,
  FaChartBar,
  FaCreditCard,
  FaFileAlt,
  FaFileInvoice,
  FaList,
  FaMapMarkedAlt,
  FaQuestionCircle,
  FaStar,
  FaUser
} from 'react-icons/fa';
import urutixLogo from '../../assets/urutix.png';

interface CargoOwnerSidebarProps {
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

const CargoOwnerSidebar: React.FC<CargoOwnerSidebarProps> = ({ isCollapsed, onToggle }) => {
  const navigationItems: NavigationSection[] = [
    {
      section: 'Cargo Management',
      items: [
        {
          name: 'Dashboard',
          path: '/cargo-owner',
          icon: FaBox,
          end: true,
        },
        {
          name: 'Cargo Management',
          path: '/cargo-owner/cargos/list',
          icon: FaList
        }
      ]
    },
    {
      items: [
        {
          name: 'Analytics & Reports',
          path: '/cargo-owner/analytics',
          icon: FaChartBar
        },
        {
          name: 'Maps & Tracking',
          path: '/cargo-owner/tracking',
          icon: FaMapMarkedAlt
        },
        {
          name: 'Financial Management',
          path: '/cargo-owner/payments',
          icon: FaCreditCard
        },
        {
          name: 'Invoices',
          path: '/cargo-owner/invoices',
          icon: FaFileInvoice
        },
        {
          name: 'Document Management',
          path: '/cargo-owner/documents',
          icon: FaFileAlt
        },
        {
          name: 'Notifications',
          path: '/cargo-owner/notification-center',
          icon: FaBell
        },
        {
          name: 'Reputation & Rewards',
          path: '/cargo-owner/ratings',
          icon: FaStar
        }
      ]
    },
    {
      section: 'Account & Settings',
      items: [
        {
          name: 'Account & Settings',
          path: '/cargo-owner/profile',
          icon: FaUser
        },
        {
          name: 'Help & Support',
          path: '/cargo-owner/support',
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
      <div className="border-b border-gray-200/70 bg-white/80 p-3 backdrop-blur">
        <div className="flex items-center justify-between gap-2">
          {!isCollapsed && (
            <div className="flex items-center space-x-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-600/10 text-primary-600">
                <FaBox className="text-sm" />
              </div>
              <div>
                <span className="block text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                  Dashboard
                </span>
                <span className="block text-sm font-bold text-gray-900">Cargo Owner</span>
              </div>
            </div>
          )}
          <button
            onClick={onToggle}
            className="rounded-md p-1.5 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-800"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4">
        {navigationItems.map((section, sectionIndex) => (
          <div key={sectionIndex} className="mb-4 px-2">
            {!isCollapsed && section.section && (
              <h3 className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                {section.section}
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
                          <span className="flex-1 truncate">{item.name}</span>
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

export default CargoOwnerSidebar; 