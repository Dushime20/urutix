import React, { useState, useEffect } from 'react';
import { 
  FaServer, FaDatabase, FaNetworkWired, FaExclamationTriangle, 
  FaCheckCircle, FaClock, FaChartLine, FaEye, FaEyeSlash,
  FaSync, FaDownload, FaBell, FaCog, FaUsers, FaTruck,
  FaBox, FaRoute, FaDollarSign, FaThermometerHalf, FaTimes
} from 'react-icons/fa';

interface SystemMetric {
  name: string;
  value: number;
  unit: string;
  status: 'healthy' | 'warning' | 'critical';
  trend: 'up' | 'down' | 'stable';
  lastUpdated: Date;
}

interface Alert {
  id: string;
  type: 'error' | 'warning' | 'info' | 'success';
  title: string;
  message: string;
  timestamp: Date;
  severity: 'low' | 'medium' | 'high' | 'critical';
  acknowledged: boolean;
  source: string;
}

interface PerformanceData {
  timestamp: Date;
  cpu: number;
  memory: number;
  disk: number;
  network: number;
  responseTime: number;
  activeUsers: number;
  activeLoads: number;
  activeTrucks: number;
}

const MonitoringDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [isRealTime, setIsRealTime] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(30);
  const [showAcknowledged, setShowAcknowledged] = useState(false);

  // Simulated real-time data
  const [systemMetrics, setSystemMetrics] = useState<SystemMetric[]>([
    {
      name: 'CPU Usage',
      value: 45,
      unit: '%',
      status: 'healthy',
      trend: 'stable',
      lastUpdated: new Date()
    },
    {
      name: 'Memory Usage',
      value: 78,
      unit: '%',
      status: 'warning',
      trend: 'up',
      lastUpdated: new Date()
    },
    {
      name: 'Disk Usage',
      value: 62,
      unit: '%',
      status: 'healthy',
      trend: 'stable',
      lastUpdated: new Date()
    },
    {
      name: 'Network Latency',
      value: 45,
      unit: 'ms',
      status: 'healthy',
      trend: 'down',
      lastUpdated: new Date()
    },
    {
      name: 'Database Connections',
      value: 127,
      unit: '',
      status: 'healthy',
      trend: 'stable',
      lastUpdated: new Date()
    },
    {
      name: 'API Response Time',
      value: 180,
      unit: 'ms',
      status: 'warning',
      trend: 'up',
      lastUpdated: new Date()
    }
  ]);

  const [alerts, setAlerts] = useState<Alert[]>([
    {
      id: '1',
      type: 'error',
      title: 'High Memory Usage',
      message: 'Memory usage has exceeded 80% threshold',
      timestamp: new Date(Date.now() - 5 * 60 * 1000),
      severity: 'high',
      acknowledged: false,
      source: 'System Monitor'
    },
    {
      id: '2',
      type: 'warning',
      title: 'API Response Time Degradation',
      message: 'Average API response time increased to 180ms',
      timestamp: new Date(Date.now() - 15 * 60 * 1000),
      severity: 'medium',
      acknowledged: false,
      source: 'API Gateway'
    },
    {
      id: '3',
      type: 'info',
      title: 'Database Backup Completed',
      message: 'Daily database backup completed successfully',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
      severity: 'low',
      acknowledged: true,
      source: 'Backup Service'
    }
  ]);

  const [performanceData, setPerformanceData] = useState<PerformanceData[]>([
    {
      timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000),
      cpu: 42,
      memory: 75,
      disk: 58,
      network: 35,
      responseTime: 120,
      activeUsers: 1247,
      activeLoads: 89,
      activeTrucks: 156
    },
    {
      timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000),
      cpu: 48,
      memory: 78,
      disk: 60,
      network: 38,
      responseTime: 135,
      activeUsers: 1289,
      activeLoads: 92,
      activeTrucks: 162
    },
    {
      timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
      cpu: 45,
      memory: 76,
      disk: 59,
      network: 36,
      responseTime: 125,
      activeUsers: 1267,
      activeLoads: 88,
      activeTrucks: 158
    },
    {
      timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000),
      cpu: 52,
      memory: 79,
      disk: 61,
      network: 40,
      responseTime: 145,
      activeUsers: 1301,
      activeLoads: 95,
      activeTrucks: 165
    },
    {
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
      cpu: 49,
      memory: 77,
      disk: 60,
      network: 37,
      responseTime: 130,
      activeUsers: 1285,
      activeLoads: 90,
      activeTrucks: 160
    },
    {
      timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000),
      cpu: 46,
      memory: 76,
      disk: 59,
      network: 36,
      responseTime: 125,
      activeUsers: 1278,
      activeLoads: 89,
      activeTrucks: 159
    },
    {
      timestamp: new Date(),
      cpu: 45,
      memory: 78,
      disk: 62,
      network: 35,
      responseTime: 180,
      activeUsers: 1290,
      activeLoads: 91,
      activeTrucks: 161
    }
  ]);

  // Real-time updates simulation
  useEffect(() => {
    if (isRealTime) {
      const interval = setInterval(() => {
        setSystemMetrics(prev => prev.map(metric => {
          const change = (Math.random() - 0.5) * 5;
          let newValue = metric.value + change;
          
          if (metric.unit === '%') {
            newValue = Math.max(0, Math.min(100, newValue));
          } else if (metric.name === 'Network Latency' || metric.name === 'API Response Time') {
            newValue = Math.max(10, Math.min(500, newValue));
          } else if (metric.name === 'Database Connections') {
            newValue = Math.max(50, Math.min(200, newValue));
          }
          
          return {
            ...metric,
            value: Math.round(newValue),
            lastUpdated: new Date()
          };
        }));
      }, refreshInterval * 1000);

      return () => clearInterval(interval);
    }
  }, [isRealTime, refreshInterval]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'bg-gray-100 text-gray-700';
      case 'warning': return 'bg-gray-100 text-gray-600';
      case 'critical': return 'bg-gray-100 text-gray-500';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'border-gray-400 bg-gray-50';
      case 'high': return 'border-gray-400 bg-gray-50';
      case 'medium': return 'border-gray-300 bg-gray-50';
      case 'low': return 'border-gray-200 bg-gray-50';
      default: return 'border-gray-200 bg-gray-50';
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'error': return FaExclamationTriangle;
      case 'warning': return FaClock;
      case 'info': return FaCheckCircle;
      case 'success': return FaCheckCircle;
      default: return FaBell;
    }
  };

  const acknowledgeAlert = (alertId: string) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId ? { ...alert, acknowledged: true } : alert
    ));
  };

  const filteredAlerts = alerts.filter(alert => 
    showAcknowledged || !alert.acknowledged
  );

  const getTimeAgo = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleTimeString();
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: FaChartLine },
    { id: 'system', label: 'System Health', icon: FaServer },
    { id: 'performance', label: 'Performance', icon: FaThermometerHalf },
    { id: 'alerts', label: 'Alerts & Events', icon: FaBell },
    { id: 'users', label: 'User Activity', icon: FaUsers }
  ];

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-gray-900">System Monitoring</h1>
          <p className="text-xs text-gray-600 mt-0.5">Real-time system health and performance monitoring</p>
        </div>
        <div className="flex items-center gap-2">
          <select 
            value={refreshInterval} 
            onChange={(e) => setRefreshInterval(Number(e.target.value))}
            className="px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent bg-white"
          >
            <option value={5}>5s</option>
            <option value={15}>15s</option>
            <option value={30}>30s</option>
            <option value={60}>1m</option>
          </select>
          <button
            onClick={() => setIsRealTime(!isRealTime)}
            className={`px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors text-xs font-medium ${
              isRealTime 
                ? 'bg-gray-800 hover:bg-gray-900 text-white' 
                : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
            }`}
          >
            <FaChartLine className="w-3 h-3" />
            <span>{isRealTime ? 'Live' : 'Paused'}</span>
          </button>
          <button className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
            <FaDownload className="w-3.5 h-3.5 text-gray-600" />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-1 px-2">
            {tabs.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-2 px-3 border-b-2 font-medium text-xs flex items-center gap-1.5 transition-colors ${
                    activeTab === tab.id
                      ? 'border-gray-700 text-gray-900'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-3 h-3" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-3">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-3">
              {/* System Metrics Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {systemMetrics.map((metric, index) => (
                  <div key={index} className="bg-gray-50 rounded-lg p-2.5 border border-gray-200">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-medium text-gray-600">{metric.name}</span>
                      <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-medium ${getStatusColor(metric.status)}`}>
                        {metric.status}
                      </span>
                    </div>
                    <div className="flex items-end space-x-1.5 mb-1">
                      <span className="text-lg font-bold text-gray-900">{metric.value}</span>
                      <span className="text-xs text-gray-500 mb-0.5">{metric.unit}</span>
                    </div>
                    <div className="text-[10px] text-gray-500">
                      Updated {getTimeAgo(metric.lastUpdated)}
                    </div>
                  </div>
                ))}
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2.5">
                <div className="bg-white rounded-lg p-2.5 border border-gray-200 hover:shadow-md transition-all duration-200">
                  <div className="flex items-center space-x-2">
                    <div className="w-10 h-10 bg-gray-700 rounded-lg flex items-center justify-center">
                      <FaUsers className="text-white text-sm" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 mb-0.5">Active Users</p>
                      <p className="text-lg font-bold text-gray-900">1,290</p>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-lg p-2.5 border border-gray-200 hover:shadow-md transition-all duration-200">
                  <div className="flex items-center space-x-2">
                    <div className="w-10 h-10 bg-gray-700 rounded-lg flex items-center justify-center">
                      <FaBox className="text-white text-sm" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 mb-0.5">Active Loads</p>
                      <p className="text-lg font-bold text-gray-900">91</p>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-lg p-2.5 border border-gray-200 hover:shadow-md transition-all duration-200">
                  <div className="flex items-center space-x-2">
                    <div className="w-10 h-10 bg-gray-700 rounded-lg flex items-center justify-center">
                      <FaTruck className="text-white text-sm" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 mb-0.5">Active Trucks</p>
                      <p className="text-lg font-bold text-gray-900">161</p>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-lg p-2.5 border border-gray-200 hover:shadow-md transition-all duration-200">
                  <div className="flex items-center space-x-2">
                    <div className="w-10 h-10 bg-gray-700 rounded-lg flex items-center justify-center">
                      <FaRoute className="text-white text-sm" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 mb-0.5">Active Routes</p>
                      <p className="text-lg font-bold text-gray-900">45</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* System Health Tab */}
          {activeTab === 'system' && (
            <div className="space-y-3">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                  <h3 className="text-xs font-semibold text-gray-900 mb-3">Resource Usage</h3>
                  <div className="space-y-3">
                    {systemMetrics.slice(0, 4).map((metric, index) => (
                      <div key={index}>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-gray-600">{metric.name}</span>
                          <span className="font-medium text-gray-900">{metric.value}{metric.unit}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-1.5">
                          <div 
                            className={`h-1.5 rounded-full transition-all duration-300 ${
                              metric.status === 'critical' ? 'bg-gray-500' :
                              metric.status === 'warning' ? 'bg-gray-400' : 'bg-gray-600'
                            }`}
                            style={{ 
                              width: `${metric.unit === '%' ? metric.value : 
                                metric.name === 'Network Latency' ? Math.min(100, (metric.value / 200) * 100) :
                                metric.name === 'API Response Time' ? Math.min(100, (metric.value / 300) * 100) :
                                metric.name === 'Database Connections' ? Math.min(100, (metric.value / 200) * 100) :
                                metric.value}%` 
                            }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                  <h3 className="text-xs font-semibold text-gray-900 mb-3">System Status</h3>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex items-center gap-2">
                        <FaDatabase className="text-gray-600 text-xs" />
                        <span className="text-xs text-gray-700">Database</span>
                      </div>
                      <span className="text-gray-600 text-xs font-medium">Healthy</span>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex items-center gap-2">
                        <FaNetworkWired className="text-gray-600 text-xs" />
                        <span className="text-xs text-gray-700">API Gateway</span>
                      </div>
                      <span className="text-gray-600 text-xs font-medium">Healthy</span>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex items-center gap-2">
                        <FaServer className="text-gray-600 text-xs" />
                        <span className="text-xs text-gray-700">File Storage</span>
                      </div>
                      <span className="text-gray-600 text-xs font-medium">Warning</span>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex items-center gap-2">
                        <FaSync className="text-gray-600 text-xs" />
                        <span className="text-xs text-gray-700">Message Queue</span>
                      </div>
                      <span className="text-gray-600 text-xs font-medium">Healthy</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Performance Tab */}
          {activeTab === 'performance' && (
            <div className="space-y-3">
              <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                <h3 className="text-xs font-semibold text-gray-900 mb-3">Performance Trends (Last 6 Hours)</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-2">
                  {performanceData.slice(-7).map((data, index) => (
                    <div key={index} className="text-center p-2 bg-white rounded-lg border border-gray-200">
                      <p className="text-[10px] text-gray-500 mb-1.5">
                        {data.timestamp.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                      <div className="space-y-1">
                        <div className="text-xs">
                          <span className="text-gray-600">CPU: </span>
                          <span className="font-medium text-gray-900">{data.cpu}%</span>
                        </div>
                        <div className="text-xs">
                          <span className="text-gray-600">Mem: </span>
                          <span className="font-medium text-gray-900">{data.memory}%</span>
                        </div>
                        <div className="text-xs">
                          <span className="text-gray-600">Resp: </span>
                          <span className="font-medium text-gray-900">{data.responseTime}ms</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Performance Metrics Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2.5">
                <div className="bg-gray-50 rounded-lg p-2.5 border border-gray-200">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-gray-600">Avg CPU</span>
                    <FaServer className="text-gray-400 text-xs" />
                  </div>
                  <div className="text-lg font-bold text-gray-900">
                    {Math.round(performanceData.reduce((sum, d) => sum + d.cpu, 0) / performanceData.length)}%
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-2.5 border border-gray-200">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-gray-600">Avg Memory</span>
                    <FaDatabase className="text-gray-400 text-xs" />
                  </div>
                  <div className="text-lg font-bold text-gray-900">
                    {Math.round(performanceData.reduce((sum, d) => sum + d.memory, 0) / performanceData.length)}%
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-2.5 border border-gray-200">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-gray-600">Avg Response</span>
                    <FaNetworkWired className="text-gray-400 text-xs" />
                  </div>
                  <div className="text-lg font-bold text-gray-900">
                    {Math.round(performanceData.reduce((sum, d) => sum + d.responseTime, 0) / performanceData.length)}ms
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-2.5 border border-gray-200">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-gray-600">Peak Users</span>
                    <FaUsers className="text-gray-400 text-xs" />
                  </div>
                  <div className="text-lg font-bold text-gray-900">
                    {Math.max(...performanceData.map(d => d.activeUsers)).toLocaleString()}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Alerts Tab */}
          {activeTab === 'alerts' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold text-gray-900">System Alerts</h3>
                <label className="flex items-center gap-1.5">
                  <input
                    type="checkbox"
                    checked={showAcknowledged}
                    onChange={(e) => setShowAcknowledged(e.target.checked)}
                    className="w-3.5 h-3.5 text-gray-600 focus:ring-gray-500 border-gray-300 rounded"
                  />
                  <span className="text-xs text-gray-600">Show Acknowledged</span>
                </label>
              </div>

              <div className="space-y-2">
                {filteredAlerts.length === 0 ? (
                  <div className="text-center py-8 text-xs text-gray-500">
                    No alerts found
                  </div>
                ) : (
                  filteredAlerts.map(alert => {
                    const Icon = getAlertIcon(alert.type);
                    return (
                      <div key={alert.id} className={`border-l-4 p-2.5 rounded-r-lg ${getSeverityColor(alert.severity)}`}>
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-2 flex-1">
                            <Icon className={`text-sm mt-0.5 ${
                              alert.type === 'error' ? 'text-gray-600' :
                              alert.type === 'warning' ? 'text-gray-500' :
                              alert.type === 'info' ? 'text-gray-600' : 'text-gray-600'
                            }`} />
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-xs text-gray-900">{alert.title}</h4>
                              <p className="text-[10px] text-gray-600 mt-0.5">{alert.message}</p>
                              <div className="flex items-center space-x-3 mt-1.5 text-[10px] text-gray-500">
                                <span>{alert.source}</span>
                                <span>•</span>
                                <span>{alert.severity}</span>
                                <span>•</span>
                                <span>{getTimeAgo(alert.timestamp)}</span>
                              </div>
                            </div>
                          </div>
                          {!alert.acknowledged && (
                            <button
                              onClick={() => acknowledgeAlert(alert.id)}
                              className="px-2 py-1 bg-gray-800 text-white rounded text-xs hover:bg-gray-900 transition-colors ml-2 flex-shrink-0"
                            >
                              Acknowledge
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* User Activity Tab */}
          {activeTab === 'users' && (
            <div className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                  <h3 className="text-xs font-semibold text-gray-900 mb-3">User Activity</h3>
                  <div className="space-y-2.5">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-600">Online Users</span>
                      <span className="font-medium text-gray-700">1,290</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-600">Active Sessions</span>
                      <span className="font-medium text-gray-700">1,847</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-600">New Users Today</span>
                      <span className="font-medium text-gray-700">23</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-600">Failed Logins</span>
                      <span className="font-medium text-gray-700">7</span>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                  <h3 className="text-xs font-semibold text-gray-900 mb-3">Recent Activity</h3>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2 p-2 bg-white rounded border border-gray-200">
                      <div className="w-1.5 h-1.5 bg-gray-500 rounded-full"></div>
                      <span className="text-xs text-gray-700">User login: john.doe@example.com</span>
                    </div>
                    <div className="flex items-center space-x-2 p-2 bg-white rounded border border-gray-200">
                      <div className="w-1.5 h-1.5 bg-gray-500 rounded-full"></div>
                      <span className="text-xs text-gray-700">New load created: Electronics shipment</span>
                    </div>
                    <div className="flex items-center space-x-2 p-2 bg-white rounded border border-gray-200">
                      <div className="w-1.5 h-1.5 bg-gray-500 rounded-full"></div>
                      <span className="text-xs text-gray-700">Payment processed: $450.00</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MonitoringDashboard;
