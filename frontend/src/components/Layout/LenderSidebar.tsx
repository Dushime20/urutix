import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  FaDollarSign, 
  FaHandHoldingUsd, 
  FaChartLine, 
  FaFileInvoiceDollar,
  FaPercent,
  FaExclamationTriangle,
  FaCheckCircle,
  FaUsers,
  FaUserFriends,
  FaCog,
  FaUser,
  FaBell,
  FaHistory,
  FaShieldAlt,
  FaMoneyBillWave,
  FaBuilding,
  FaCalculator,
  FaCreditCard,
  FaQuestionCircle
} from 'react-icons/fa';
import { TranslatedText } from '../translated-text';

interface LenderSidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
}

const LenderSidebar: React.FC<LenderSidebarProps> = ({ isCollapsed, onToggle }) => {
  const location = useLocation();

  const navigationItems = [
    {
      section: 'Lending Dashboard',
      items: [
        {
          name: 'Overview',
          path: '/lender',
          icon: FaDollarSign,
          description: 'Main lending dashboard'
        },
        {
          name: 'Loan Requests',
          path: '/lender/requests',
          icon: FaHandHoldingUsd,
          description: 'Manage loan applications'
        },
        {
          name: 'Active Loans',
          path: '/lender/active',
          icon: FaFileInvoiceDollar,
          description: 'Monitor active loans'
        },
        {
          name: 'Disbursements',
          path: '/lender/disbursements',
          icon: FaMoneyBillWave,
          description: 'Track loan disbursements'
        },
        {
          name: 'Repayments',
          path: '/lender/repayments',
          icon: FaCheckCircle,
          description: 'Monitor repayments'
        }
      ]
    },
    {
      section: 'Analytics & Reports',
      items: [
        {
          name: 'Portfolio Analytics',
          path: '/lender/analytics',
          icon: FaChartLine,
          description: 'Portfolio performance'
        },
        {
          name: 'Risk Analysis',
          path: '/lender/risk',
          icon: FaExclamationTriangle,
          description: 'Risk assessment tools'
        },
        {
          name: 'Interest Tracking',
          path: '/lender/interest',
          icon: FaPercent,
          description: 'Interest earnings'
        },
        {
          name: 'Financial Reports',
          path: '/lender/reports',
          icon: FaCalculator,
          description: 'Generate reports'
        }
      ]
    },
    {
      section: 'Management',
      items: [
        {
          name: 'Borrower Management',
          path: '/lender/borrowers',
          icon: FaUsers,
          description: 'Manage borrower profiles'
        },
        {
          name: 'Lending Policies',
          path: '/lender/policies',
          icon: FaShieldAlt,
          description: 'Configure lending rules'
        },
        {
          name: 'Credit Assessment',
          path: '/lender/credit',
          icon: FaCreditCard,
          description: 'Credit evaluation tools'
        },
        {
          name: 'Transaction History',
          path: '/lender/history',
          icon: FaHistory,
          description: 'View all transactions'
        }
      ]
    },
    {
      section: 'Account',
      items: [
        {
          name: 'Profile',
          path: '/lender/profile',
          icon: FaUser,
          description: 'Lender profile settings'
        },
        {
          name: 'Team Management',
          path: '/lender/team',
          icon: FaUserFriends,
          description: 'Manage team members and roles'
        },
        {
          name: 'Notifications',
          path: '/lender/notifications',
          icon: FaBell,
          description: 'Alert preferences'
        },
        {
          name: 'Support',
          path: '/lender/support',
          icon: FaQuestionCircle,
          description: 'Help and support'
        }
      ]
    }
  ];

  const isActivePath = (path: string) => {
    if (path === '/lender') {
      return location.pathname === '/lender';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className={`bg-white shadow-lg h-full flex flex-col transition-all duration-300 ${isCollapsed ? 'w-16' : 'w-64'}`}>
      {/* Logo and Title */}
      <div className="p-4 border-b border-gray-200 flex-shrink-0">
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            <FaBuilding className="w-8 h-8 text-primary-600" />
          </div>
          {!isCollapsed && (
            <div>
              <h2 className="text-lg font-bold text-gray-800">
                <TranslatedText text="Lender Portal" />
              </h2>
              <p className="text-xs text-gray-500">
                <TranslatedText text="Lending Management" />
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 mt-4 px-2 overflow-y-auto custom-scrollbar">
        {navigationItems.map((section, sectionIndex) => (
          <div key={sectionIndex} className="mb-6">
            {!isCollapsed && (
              <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                <TranslatedText text={section.section} />
              </h3>
            )}
            <div className="space-y-1">
              {section.items.map((item, itemIndex) => (
                <NavLink
                  key={itemIndex}
                  to={item.path}
                  className={({ isActive }) =>
                    `group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${
                      isActivePath(item.path)
                        ? 'bg-primary-50 text-primary-700 border-r-2 border-primary-600'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`
                  }
                  title={isCollapsed ? item.name : ''}
                >
                  <item.icon
                    className={`flex-shrink-0 w-5 h-5 ${
                      isActivePath(item.path) ? 'text-primary-600' : 'text-gray-400 group-hover:text-gray-500'
                    }`}
                  />
                  {!isCollapsed && (
                    <div className="ml-3">
                      <span className="block">
                        <TranslatedText text={item.name} />
                      </span>
                      <span className="text-xs text-gray-500 group-hover:text-gray-600">
                        <TranslatedText text={item.description} />
                      </span>
                    </div>
                  )}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Collapse Toggle */}
      <div className="p-4 border-t border-gray-200 flex-shrink-0">
        <button
          onClick={onToggle}
          className="w-full flex items-center justify-center px-3 py-2 text-sm font-medium text-gray-600 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors"
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <FaCog className="w-4 h-4" />
          {!isCollapsed && <span className="ml-2"><TranslatedText text="Toggle Sidebar" /></span>}
        </button>
      </div>
    </div>
  );
};

export default LenderSidebar;
