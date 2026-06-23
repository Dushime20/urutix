import React, { useState, useEffect } from 'react';
import { 
  Activity, AlertTriangle, CheckCircle, XCircle, Clock, 
  Users, Package, TrendingUp, TrendingDown, Server, 
  Database, Cpu, HardDrive, Wifi, RefreshCw, Bell
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { TranslatedText } from '../../components/translated-text';
import AdminPageLayout from '../../components/Admin/AdminPageLayout';
import ModernLoader from '../../components/common/ModernLoader';
import api from '../../services/api';

interface SystemMetric {
  name: string;
  value: string | number;
  status: 'healthy' | 'warning' | 'critical';
  trend?: 'up' | 'down' | 'stable';
  icon: any;
}

interface ActivityLog {
  id: string;
  timestamp: string;
  action: string;
  user: string;
  status: 'success' | 'warning' | 'error';
  details?: string;
}

const MonitoringDashboard: React.FC = () => {
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(30000); // 30 seconds

  // Fetch activity logs
  const { data: activityLogs, isLoading: logsLoading, refetch: refetchLogs } = useQuery({
    queryKey: ['activity-logs'],
    queryFn: async () => {
      const res = await api.get('/admin/activity-logs?limit=10');
      return res.data as ActivityLog[];
    },
    refetchInterval: autoRefresh ? refreshInterval : false,
    retry: 1,
  });

  // Mock system metrics (replace with real API calls)
  const systemMetrics: SystemMetric[] = [
    {
      name: 'Active Users',
      value: '1,234',
      status: 'healthy',
      trend: 'up',
      icon: Users,
    },
    {
      name: 'Active Trips',
      value: '56',
      status: 'healthy',
      trend: 'stable',
      icon: Package,
    },
    {
      name: 'System Load',
      value: '45%',
      status: 'healthy',
      trend: 'down',
      icon: Cpu,
    },
    {
      name: 'Database',
      value: 'Online',
      status: 'healthy',
      trend: 'stable',
      icon: Database,
    },
    {
      name: 'API Response',
      value: '120ms',
      status: 'healthy',
      trend: 'stable',
      icon: Activity,
    },
    {
      name: 'Storage',
      value: '67%',
      status: 'warning',
      trend: 'up',
      icon: HardDrive,
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'success':
        return 'text-green-600 bg-green-50';
      case 'warning':
        return 'text-yellow-600 bg-yellow-50';
      case 'critical':
      case 'error':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'success':
        return CheckCircle;
      case 'warning':
        return AlertTriangle;
      case 'critical':
      case 'error':
        return XCircle;
      default:
        return Activity;
    }
  };

  const getTrendIcon = (trend?: string) => {
    switch (trend) {
      case 'up':
        return TrendingUp;
      case 'down':
        return TrendingDown;
      default:
        return null;
    }
  };

  if (logsLoading && !activityLogs) {
    return (
      <AdminPageLayout
        title={<TranslatedText text="System Monitoring" />}
        description={<TranslatedText text="Real-time system health and activity monitoring" />}
      >
        <ModernLoader isLoading={true} type="page" />
      </AdminPageLayout>
    );
  }

  return (
    <AdminPageLayout
      title={<TranslatedText text="System Monitoring" />}
      description={<TranslatedText text="Real-time system health and activity monitoring" />}
      actions={
        <>
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold transition-all ${
              autoRefresh
                ? 'bg-green-100 text-green-700 hover:bg-green-200'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <RefreshCw size={14} className={autoRefresh ? 'animate-spin' : ''} />
            <span className="hidden sm:inline">
              {autoRefresh ? <TranslatedText text="Auto Refresh On" /> : <TranslatedText text="Auto Refresh Off" />}
            </span>
          </button>
          <button
            onClick={() => {
              refetchLogs();
            }}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white rounded-lg font-bold transition-all"
          >
            <RefreshCw size={14} />
            <span className="hidden sm:inline"><TranslatedText text="Refresh Now" /></span>
          </button>
        </>
      }
    >
      <div className="safe-bottom space-y-6">
        {/* System Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {systemMetrics.map((metric) => {
            const StatusIcon = getStatusIcon(metric.status);
            const TrendIcon = getTrendIcon(metric.trend);
            
            return (
              <div
                key={metric.name}
                className="bg-white rounded-xl border border-slate-200 p-4 hover:shadow-lg transition-all"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className={`p-2 rounded-lg ${getStatusColor(metric.status)}`}>
                    <metric.icon size={20} />
                  </div>
                  <StatusIcon size={16} className={getStatusColor(metric.status).split(' ')[0]} />
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    {metric.name}
                  </p>
                  <p className="text-2xl font-bold text-slate-800">{metric.value}</p>
                  {TrendIcon && (
                    <div className="flex items-center gap-1 text-xs text-slate-400">
                      <TrendIcon size={12} />
                      <span className="capitalize">{metric.trend}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Activity Logs */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Bell size={20} className="text-primary-600" />
                <h2 className="text-lg font-bold text-slate-800">
                  <TranslatedText text="Recent Activity" />
                </h2>
              </div>
              <span className="text-xs text-slate-500 font-medium">
                <TranslatedText text="Last 24 hours" />
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">
                    <TranslatedText text="Time" />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-slate-600 uppercase tracking-wider hidden sm:table-cell">
                    <TranslatedText text="User" />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">
                    <TranslatedText text="Action" />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-slate-600 uppercase tracking-wider hidden md:table-cell">
                    <TranslatedText text="Status" />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-slate-600 uppercase tracking-wider hidden lg:table-cell">
                    <TranslatedText text="Details" />
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {!activityLogs || activityLogs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-sm text-slate-500">
                      <TranslatedText text="No recent activity" />
                    </td>
                  </tr>
                ) : (
                  activityLogs.map((log: any) => {
                    const StatusIcon = getStatusIcon(log.action?.includes('FAILED') ? 'error' : 'success');
                    return (
                      <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2 text-xs text-slate-600">
                            <Clock size={12} className="text-slate-400" />
                            {new Date(log.created_at || log.timestamp).toLocaleTimeString()}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap hidden sm:table-cell">
                          <p className="text-sm font-medium text-slate-800">
                            {log.user?.email || log.user_id || 'System'}
                          </p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm text-slate-800 font-medium break-words">
                            {log.action}
                          </p>
                          <p className="text-xs text-slate-500 sm:hidden break-words">
                            {log.user?.email || log.user_id || 'System'}
                          </p>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap hidden md:table-cell">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(
                              log.action?.includes('FAILED') ? 'error' : 'success'
                            )}`}
                          >
                            <StatusIcon size={12} />
                            {log.action?.includes('FAILED') ? 'Error' : 'Success'}
                          </span>
                        </td>
                        <td className="px-6 py-4 hidden lg:table-cell">
                          <p className="text-xs text-slate-600 max-w-md truncate">
                            {log.details ? JSON.stringify(log.details).substring(0, 100) : '-'}
                          </p>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <button className="bg-white hover:bg-slate-50 border border-slate-200 rounded-xl p-4 text-left transition-all group">
            <Server size={24} className="text-primary-600 mb-2 group-hover:scale-110 transition-transform" />
            <p className="text-sm font-bold text-slate-800">
              <TranslatedText text="Server Status" />
            </p>
            <p className="text-xs text-slate-500 mt-1">
              <TranslatedText text="View server health" />
            </p>
          </button>
          
          <button className="bg-white hover:bg-slate-50 border border-slate-200 rounded-xl p-4 text-left transition-all group">
            <Database size={24} className="text-green-600 mb-2 group-hover:scale-110 transition-transform" />
            <p className="text-sm font-bold text-slate-800">
              <TranslatedText text="Database" />
            </p>
            <p className="text-xs text-slate-500 mt-1">
              <TranslatedText text="Check connections" />
            </p>
          </button>
          
          <button className="bg-white hover:bg-slate-50 border border-slate-200 rounded-xl p-4 text-left transition-all group">
            <Wifi size={24} className="text-blue-600 mb-2 group-hover:scale-110 transition-transform" />
            <p className="text-sm font-bold text-slate-800">
              <TranslatedText text="API Health" />
            </p>
            <p className="text-xs text-slate-500 mt-1">
              <TranslatedText text="Monitor endpoints" />
            </p>
          </button>
          
          <button className="bg-white hover:bg-slate-50 border border-slate-200 rounded-xl p-4 text-left transition-all group">
            <AlertTriangle size={24} className="text-yellow-600 mb-2 group-hover:scale-110 transition-transform" />
            <p className="text-sm font-bold text-slate-800">
              <TranslatedText text="Alerts" />
            </p>
            <p className="text-xs text-slate-500 mt-1">
              <TranslatedText text="View all alerts" />
            </p>
          </button>
        </div>
      </div>
    </AdminPageLayout>
  );
};

export default MonitoringDashboard;
