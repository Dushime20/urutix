import React, { useState, useEffect } from 'react';
import { 
  FaServer, FaDatabase, FaNetworkWired, FaExclamationTriangle, 
  FaCheckCircle, FaClock, FaChartLine, FaEye, FaEyeSlash,
  FaSync, FaDownload, FaBell, FaCog, FaUsers, FaTruck,
  FaBox, FaRoute, FaDollarSign, FaThermometerHalf
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
        // Simulate real-time metric updates
        setSystemMetrics(prev => prev.map(metric => {
          const change = (Math.random() - 0.5) * 5;
          let newValue = metric.value + change;
          
          // Ensure values stay within reasonable bounds
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
      case 'healthy': return 'text-green-600 bg-green-100';
      case 'warning': return 'text-yellow-600 bg-yellow-100';
      case 'critical': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'border-red-500 bg-red-50';
      case 'high': return 'border-orange-500 bg-orange-50';
      case 'medium': return 'border-yellow-500 bg-yellow-50';
      case 'low': return 'border-blue-500 bg-blue-50';
      default: return 'border-gray-500 bg-gray-50';
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

  const tabs = [
    { id: 'overview', label: 'Overview', icon: FaChartLine },
    { id: 'system', label: 'System Health', icon: FaServer },
    { id: 'performance', label: 'Performance', icon: FaThermometerHalf },
    { id: 'alerts', label: 'Alerts & Events', icon: FaBell },
    { id: 'users', label: 'User Activity', icon: FaUsers }
  ];

  return (
            <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
        <div>
          <h1 className="text-2xl font-bold">System Monitoring</h1>
          <p className="text-gray-600">Real-time system health and performance monitoring</p>
        </div>
        <div className="flex gap-2 items-center">
          <select 
            value={refreshInterval} 
            onChange={(e) => setRefreshInterval(Number(e.target.value))}
            className="border border-gray-300 rounded-lg px-3 py-2 bg-white"
          >
            <option value={5}>5s</option>
            <option value={15}>15s</option>
            <option value={30}>30s</option>
            <option value={60}>1m</option>
          </select>
          <button
            onClick={() => setIsRealTime(!isRealTime)}
            className={`px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors ${
              isRealTime 
                ? 'bg-green-600 hover:bg-green-700 text-white' 
                : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
            }`}
          >
            <FaChartLine />
            <span>{isRealTime ? 'Live' : 'Paused'}</span>
          </button>
          <button className="p-2 rounded-lg hover:bg-gray-100">
            <FaDownload />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-lg">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {tabs.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* System Metrics Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {systemMetrics.map((metric, index) => (
                  <div key={index} className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-600">{metric.name}</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(metric.status)}`}>
                        {metric.status}
                      </span>
                    </div>
                    <div className="flex items-end space-x-2">
                      <span className="text-2xl font-bold text-gray-900">{metric.value}</span>
                      <span className="text-sm text-gray-500">{metric.unit}</span>
                    </div>
                    <div className="mt-2 text-xs text-gray-500">
                      Last updated: {metric.lastUpdated.toLocaleTimeString()}
                    </div>
                  </div>
                ))}
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white rounded-lg p-4 border border-gray-200">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <FaUsers className="text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Active Users</p>
                      <p className="text-xl font-bold text-gray-900">1,290</p>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-lg p-4 border border-gray-200">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <FaBox className="text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Active Loads</p>
                      <p className="text-xl font-bold text-gray-900">91</p>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-lg p-4 border border-gray-200">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <FaTruck className="text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Active Trucks</p>
                      <p className="text-xl font-bold text-gray-900">161</p>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-lg p-4 border border-gray-200">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-orange-100 rounded-lg">
                      <FaRoute className="text-orange-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Active Routes</p>
                      <p className="text-xl font-bold text-gray-900">45</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* System Health Tab */}
          {activeTab === 'system' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-lg p-6 border border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Resource Usage</h3>
                  <div className="space-y-4">
                    {systemMetrics.slice(0, 4).map((metric, index) => (
                      <div key={index}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-600">{metric.name}</span>
                          <span className="font-medium">{metric.value}{metric.unit}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full transition-all duration-300 ${
                              metric.status === 'critical' ? 'bg-red-500' :
                              metric.status === 'warning' ? 'bg-yellow-500' : 'bg-green-500'
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

                <div className="bg-white rounded-lg p-6 border border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">System Status</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                      <span className="text-sm text-gray-700">Database</span>
                      <span className="text-green-600 text-sm font-medium">Healthy</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                      <span className="text-sm text-gray-700">API Gateway</span>
                      <span className="text-green-600 text-sm font-medium">Healthy</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                      <span className="text-sm text-gray-700">File Storage</span>
                      <span className="text-yellow-600 text-sm font-medium">Warning</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                      <span className="text-sm text-gray-700">Message Queue</span>
                      <span className="text-green-600 text-sm font-medium">Healthy</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Performance Tab */}
          {activeTab === 'performance' && (
            <div className="space-y-6">
              <div className="bg-white rounded-lg p-6 border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Performance Trends (Last 6 Hours)</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {performanceData.slice(-6).map((data, index) => (
                    <div key={index} className="text-center p-3 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-500 mb-1">
                        {data.timestamp.toLocaleTimeString()}
                      </p>
                      <div className="space-y-1">
                        <div className="text-sm">
                          <span className="text-gray-600">CPU: </span>
                          <span className="font-medium">{data.cpu}%</span>
                        </div>
                        <div className="text-sm">
                          <span className="text-gray-600">Memory: </span>
                          <span className="font-medium">{data.memory}%</span>
                        </div>
                        <div className="text-sm">
                          <span className="text-gray-600">Response: </span>
                          <span className="font-medium">{data.responseTime}ms</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Alerts Tab */}
          {activeTab === 'alerts' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-800">System Alerts</h3>
                <div className="flex items-center space-x-3">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={showAcknowledged}
                      onChange={(e) => setShowAcknowledged(e.target.checked)}
                      className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="text-sm text-gray-600">Show Acknowledged</span>
                  </label>
                </div>
              </div>

              <div className="space-y-3">
                {filteredAlerts.map(alert => {
                  const Icon = getAlertIcon(alert.type);
                  return (
                    <div key={alert.id} className={`border-l-4 p-4 rounded-r-lg ${getSeverityColor(alert.severity)}`}>
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-3">
                          <Icon className={`text-lg mt-1 ${
                            alert.type === 'error' ? 'text-red-600' :
                            alert.type === 'warning' ? 'text-yellow-600' :
                            alert.type === 'info' ? 'text-blue-600' : 'text-green-600'
                          }`} />
                          <div>
                            <h4 className="font-medium text-gray-900">{alert.title}</h4>
                            <p className="text-sm text-gray-600 mt-1">{alert.message}</p>
                            <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                              <span>Source: {alert.source}</span>
                              <span>Severity: {alert.severity}</span>
                              <span>{alert.timestamp.toLocaleString()}</span>
                            </div>
                          </div>
                        </div>
                        {!alert.acknowledged && (
                          <button
                            onClick={() => acknowledgeAlert(alert.id)}
                            className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors"
                          >
                            Acknowledge
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* User Activity Tab */}
          {activeTab === 'users' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white rounded-lg p-6 border border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">User Activity</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Online Users</span>
                      <span className="font-medium text-green-600">1,290</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Active Sessions</span>
                      <span className="font-medium text-blue-600">1,847</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">New Users Today</span>
                      <span className="font-medium text-purple-600">23</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Failed Logins</span>
                      <span className="font-medium text-red-600">7</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg p-6 border border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent Activity</h3>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3 p-2 bg-gray-50 rounded">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm text-gray-700">User login: john.doe@example.com</span>
                    </div>
                    <div className="flex items-center space-x-3 p-2 bg-gray-50 rounded">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span className="text-sm text-gray-700">New load created: Electronics shipment</span>
                    </div>
                    <div className="flex items-center space-x-3 p-2 bg-gray-50 rounded">
                      <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                      <span className="text-sm text-gray-700">Payment processed: $450.00</span>
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
