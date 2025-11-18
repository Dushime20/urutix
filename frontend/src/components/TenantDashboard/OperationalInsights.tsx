import React, { useState } from 'react';
import { 
  FaExclamationTriangle, FaCheckCircle, FaInfoCircle, 
  FaTruck, FaRoute, FaClock, FaThermometerHalf,
  FaMapMarkerAlt, FaChartLine, FaLightbulb, FaBell
} from 'react-icons/fa';

interface OperationalAlert {
  id: number;
  type: 'warning' | 'info' | 'success' | 'critical';
  title: string;
  description: string;
  timestamp: string;
  priority: 'high' | 'medium' | 'low';
  category: 'fleet' | 'route' | 'maintenance' | 'weather' | 'traffic';
  actionable: boolean;
}

interface RouteOptimization {
  id: number;
  route: string;
  currentEfficiency: number;
  potentialImprovement: number;
  estimatedSavings: number;
  recommendations: string[];
}

interface WeatherAlert {
  id: number;
  location: string;
  condition: string;
  severity: 'low' | 'medium' | 'high';
  impact: string;
  duration: string;
}

interface OperationalInsightsProps {
  tenantId?: string;
  className?: string;
}

const OperationalInsights: React.FC<OperationalInsightsProps> = ({ 
  tenantId, 
  className = '' 
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showResolved, setShowResolved] = useState(false);

  // Mock data - in real app, this would come from API calls
  const alerts: OperationalAlert[] = [
    {
      id: 1,
      type: 'warning',
      title: 'Route Congestion Detected',
      description: 'Heavy traffic detected on Route A-15. Consider alternative routes to avoid delays.',
      timestamp: '2 hours ago',
      priority: 'high',
      category: 'traffic',
      actionable: true
    },
    {
      id: 2,
      type: 'info',
      title: 'Maintenance Due',
      description: 'Truck T-001 requires scheduled maintenance within 500km.',
      timestamp: '4 hours ago',
      priority: 'medium',
      category: 'maintenance',
      actionable: true
    },
    {
      id: 3,
      type: 'critical',
      title: 'Weather Warning',
      description: 'Severe weather conditions expected in Northern Region. Consider delaying shipments.',
      timestamp: '6 hours ago',
      priority: 'high',
      category: 'weather',
      actionable: true
    },
    {
      id: 4,
      type: 'success',
      title: 'Route Optimization Complete',
      description: 'New optimized route calculated for Fleet F-003. Estimated 15% fuel savings.',
      timestamp: '1 day ago',
      priority: 'low',
      category: 'route',
      actionable: false
    }
  ];

  const routeOptimizations: RouteOptimization[] = [
    {
      id: 1,
      route: 'Kigali → Mombasa',
      currentEfficiency: 78,
      potentialImprovement: 15,
      estimatedSavings: 25000,
      recommendations: [
        'Use alternative route via Nairobi',
        'Optimize departure times',
        'Consider overnight stops'
      ]
    },
    {
      id: 2,
      route: 'Dar es Salaam → Kampala',
      currentEfficiency: 82,
      potentialImprovement: 8,
      estimatedSavings: 12000,
      recommendations: [
        'Avoid peak traffic hours',
        'Use GPS optimization',
        'Monitor weather conditions'
      ]
    }
  ];

  const weatherAlerts: WeatherAlert[] = [
    {
      id: 1,
      location: 'Northern Region',
      condition: 'Heavy Rain',
      severity: 'high',
      impact: 'Route delays, reduced visibility',
      duration: 'Next 48 hours'
    },
    {
      id: 2,
      location: 'Eastern Corridor',
      condition: 'Strong Winds',
      severity: 'medium',
      impact: 'Minor delays, fuel consumption increase',
      duration: 'Next 24 hours'
    }
  ];

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'warning':
        return <FaExclamationTriangle className="text-yellow-500" />;
      case 'info':
        return <FaInfoCircle className="text-blue-500" />;
      case 'success':
        return <FaCheckCircle className="text-green-500" />;
      case 'critical':
        return <FaExclamationTriangle className="text-red-500" />;
      default:
        return <FaInfoCircle className="text-gray-500" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredAlerts = selectedCategory === 'all' 
    ? alerts 
    : alerts.filter(alert => alert.category === selectedCategory);

  const categories = [
    { id: 'all', label: 'All', icon: FaBell },
    { id: 'fleet', label: 'Fleet', icon: FaTruck },
    { id: 'route', label: 'Route', icon: FaRoute },
    { id: 'maintenance', label: 'Maintenance', icon: FaClock },
    { id: 'weather', label: 'Weather', icon: FaThermometerHalf },
    { id: 'traffic', label: 'Traffic', icon: FaMapMarkerAlt }
  ];

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Operational Insights</h3>
            <p className="text-sm text-gray-600">Real-time alerts and operational intelligence</p>
          </div>
          <div className="flex items-center space-x-4">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={showResolved}
                onChange={(e) => setShowResolved(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-600">Show resolved</span>
            </label>
            <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
              <FaLightbulb className="inline-block w-4 h-4 mr-2" />
              Generate Report
            </button>
          </div>
        </div>

        {/* Category Filter */}
        <div className="flex space-x-2 overflow-x-auto pb-2">
          {categories.map((category) => {
            const Icon = category.icon;
            return (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                  selectedCategory === category.id
                    ? 'bg-blue-100 text-blue-700 border border-blue-200'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{category.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Alerts Section */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h4 className="text-lg font-semibold text-gray-900">Active Alerts</h4>
          <p className="text-sm text-gray-600">
            {filteredAlerts.length} active alerts requiring attention
          </p>
        </div>
        
        <div className="divide-y divide-gray-200">
          {filteredAlerts.length > 0 ? (
            filteredAlerts.map((alert) => (
              <div key={alert.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 mt-1">
                    {getAlertIcon(alert.type)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <h5 className="text-sm font-medium text-gray-900">{alert.title}</h5>
                      <div className="flex items-center space-x-2">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(alert.priority)}`}>
                          {alert.priority}
                        </span>
                        <span className="text-xs text-gray-500">{alert.timestamp}</span>
                      </div>
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-3">{alert.description}</p>
                    
                    <div className="flex items-center justify-between">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(alert.type)}`}>
                        {alert.category}
                      </span>
                      
                      {alert.actionable && (
                        <div className="flex space-x-2">
                          <button className="text-xs text-blue-600 hover:text-blue-800 font-medium">
                            Take Action
                          </button>
                          <button className="text-xs text-gray-500 hover:text-gray-700">
                            Dismiss
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="px-6 py-8 text-center">
              <div className="text-gray-400 mb-2">
                <FaCheckCircle className="mx-auto h-12 w-12" />
              </div>
              <p className="text-gray-500">No active alerts</p>
              <p className="text-sm text-gray-400">All systems operating normally</p>
            </div>
          )}
        </div>
      </div>

      {/* Route Optimization */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h4 className="text-lg font-semibold text-gray-900">Route Optimization</h4>
          <p className="text-sm text-gray-600">AI-powered route suggestions for efficiency improvement</p>
        </div>
        
        <div className="p-6">
          <div className="space-y-4">
            {routeOptimizations.map((optimization) => (
              <div key={optimization.id} className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h5 className="font-medium text-gray-900">{optimization.route}</h5>
                  <span className="text-sm text-green-600 font-medium">
                    +{optimization.potentialImprovement}% efficiency
                  </span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                  <div>
                    <span className="text-sm text-gray-600">Current Efficiency</span>
                    <div className="text-lg font-semibold text-gray-900">{optimization.currentEfficiency}%</div>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">Potential Improvement</span>
                    <div className="text-lg font-semibold text-green-600">{optimization.potentialImprovement}%</div>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">Estimated Savings</span>
                    <div className="text-lg font-semibold text-green-600">RWF {optimization.estimatedSavings.toLocaleString()}</div>
                  </div>
                </div>
                
                <div>
                  <span className="text-sm text-gray-600 mb-2 block">Recommendations:</span>
                  <ul className="space-y-1">
                    {optimization.recommendations.map((rec, index) => (
                      <li key={index} className="text-sm text-gray-700 flex items-center space-x-2">
                        <FaLightbulb className="text-yellow-500 w-3 h-3" />
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Weather Alerts */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h4 className="text-lg font-semibold text-gray-900">Weather Conditions</h4>
          <p className="text-sm text-gray-600">Current weather alerts affecting operations</p>
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {weatherAlerts.map((alert) => (
              <div key={alert.id} className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h5 className="font-medium text-gray-900">{alert.location}</h5>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(alert.severity)}`}>
                    {alert.severity}
                  </span>
                </div>
                
                <div className="space-y-2">
                  <div>
                    <span className="text-sm text-gray-600">Condition:</span>
                    <div className="text-sm font-medium text-gray-900">{alert.condition}</div>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">Impact:</span>
                    <div className="text-sm text-gray-700">{alert.impact}</div>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">Duration:</span>
                    <div className="text-sm text-gray-700">{alert.duration}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OperationalInsights;
