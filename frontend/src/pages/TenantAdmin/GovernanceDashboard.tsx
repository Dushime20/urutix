import React, { useState, useEffect } from 'react';
import {
  FaExclamationTriangle,
  FaFlag,
  FaGavel,
  FaChartLine,
  FaSync,
  FaShieldAlt,
  FaClock
} from 'react-icons/fa';
import axios from 'axios';
import FlaggedUsersTable from './FlaggedUsersTable';
import ModernLoader from '../../components/common/ModernLoader';

/**
 * GovernanceDashboard
 * 
 * Main dashboard for governance and abuse control.
 * Displays statistics, flagged users, pending appeals, and recent actions.
 * 
 * Features:
 * - Real-time statistics
 * - Flagged users list
 * - Pending appeals
 * - Recent enforcement actions
 * - Quick action buttons
 */

interface DashboardStats {
  enforcement: {
    totalActions: number;
    suspensions: number;
    terminations: number;
    restrictions: number;
  };
  appeals: {
    pending: number;
    total: number;
  };
  blacklist: {
    totalEntries: number;
    activeEntries: number;
  };
  riskFlags: {
    pending: number;
    total: number;
  };
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`governance-tabpanel-${index}`}
      aria-labelledby={`governance-tab-${index}`}
      {...other}
    >
      {value === index && <div className="p-6">{children}</div>}
    </div>
  );
}

const GovernanceDashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState(0);
  const [period, setPeriod] = useState<'day' | 'week' | 'month' | 'year'>('month');

  useEffect(() => {
    fetchDashboardStats();
  }, [period]);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.get(`/api/governance/dashboard/stats?period=${period}`);
      setStats(response.data);
    } catch (err: any) {
      console.error('Error fetching dashboard stats:', err);
      setError(err.response?.data?.message || 'Failed to load dashboard statistics');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    fetchDashboardStats();
  };

  const handleTabChange = (newValue: number) => {
    setTabValue(newValue);
  };

  if (loading) {
    return <ModernLoader isLoading={true} type="dashboard" />;
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <FaExclamationTriangle className="text-red-500 mr-3" />
            <div>
              <h3 className="text-lg font-semibold text-red-800">Error</h3>
              <p className="text-red-700">{error}</p>
            </div>
          </div>
          <button
            onClick={handleRefresh}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <FaShieldAlt className="text-blue-600 text-2xl" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Governance & Abuse Control</h1>
              <p className="text-sm text-gray-600 dark:text-slate-300">Monitor and manage platform integrity</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value as any)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="day">Last 24 Hours</option>
              <option value="week">Last 7 Days</option>
              <option value="month">Last 30 Days</option>
              <option value="year">Last Year</option>
            </select>
            <button
              onClick={handleRefresh}
              className="p-2 text-gray-600 dark:text-slate-300 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              title="Refresh"
            >
              <FaSync className="text-lg" />
            </button>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Tabs */}
        <div className="bg-white dark:bg-slate-900 rounded-lg shadow">
          <div className="border-b border-gray-200 dark:border-slate-700">
            <nav className="flex space-x-8 px-6" aria-label="Tabs">
              {[
                { label: 'Flagged Users', icon: FaFlag },
                { label: 'Pending Appeals', icon: FaClock },
                { label: 'Recent Actions', icon: FaGavel },
                { label: 'Analytics', icon: FaChartLine },
              ].map((tab, index) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={index}
                    onClick={() => handleTabChange(index)}
                    className={`
                      py-4 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap flex items-center space-x-2
                      ${tabValue === index
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-slate-300 hover:border-gray-300'
                      }
                    `}
                  >
                    <Icon className="text-lg" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Tab Panels */}
          <TabPanel value={tabValue} index={0}>
            <FlaggedUsersTable />
          </TabPanel>

          <TabPanel value={tabValue} index={1}>
            <div className="text-center py-12">
              <FaClock className="text-gray-400 text-5xl mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Pending Appeals</h3>
              <p className="text-gray-600 dark:text-slate-300">Appeals management interface coming soon</p>
            </div>
          </TabPanel>

          <TabPanel value={tabValue} index={2}>
            <div className="text-center py-12">
              <FaGavel className="text-gray-400 text-5xl mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Recent Actions</h3>
              <p className="text-gray-600 dark:text-slate-300">Action history interface coming soon</p>
            </div>
          </TabPanel>

          <TabPanel value={tabValue} index={3}>
            <div className="text-center py-12">
              <FaChartLine className="text-gray-400 text-5xl mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Analytics</h3>
              <p className="text-gray-600 dark:text-slate-300">Analytics dashboard coming soon</p>
            </div>
          </TabPanel>
        </div>
      </div>
    </div>
  );
};

export default GovernanceDashboard;
