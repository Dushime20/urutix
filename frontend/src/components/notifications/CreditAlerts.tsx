import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';
import {
  FaExclamationTriangle,
  FaInfoCircle,
  FaBell,
  FaChartLine,
  FaCreditCard,
  FaCalendarAlt,
  FaUsers,
  FaCheckCircle
} from 'react-icons/fa';

interface AlertData {
  currentBalance: number;
  alertLevel: 'NORMAL' | 'LOW' | 'WARNING' | 'CRITICAL';
  alertMessage: string | null;
  thresholds: {
    critical: number;
    warning: number;
    low: number;
  };
  recommendations: string[];
}

interface UsageForecast {
  currentBalance: number;
  dailyAverageUsage: number;
  estimatedDaysRemaining: number;
  forecast: {
    criticalBalanceDate: string | null;
    warningBalanceDate: string | null;
    zeroBalanceDate: string | null;
  };
  recommendations: string[];
  topConsumingFeatures: Array<{
    featureCode: string;
    count: number;
    totalCredits: number;
  }>;
}

const CreditAlerts: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'alerts' | 'forecast' | 'partners'>('alerts');

  // Fetch balance alerts
  const { data: alertsData, isLoading: alertsLoading } = useQuery({
    queryKey: ['balance-alerts'],
    queryFn: async () => {
      const response = await api.get('/notifications/balance-alerts');
      return response.data.data as AlertData;
    },
    refetchInterval: 60000, // Refresh every minute
  });

  // Fetch usage forecast
  const { data: forecastData, isLoading: forecastLoading } = useQuery({
    queryKey: ['usage-forecast'],
    queryFn: async () => {
      const response = await api.get('/notifications/usage-forecast');
      return response.data.data as UsageForecast;
    },
    refetchInterval: 300000, // Refresh every 5 minutes
  });

  // Fetch low balance partners (for tenant admins)
  const { data: partnersData, isLoading: partnersLoading } = useQuery({
    queryKey: ['low-balance-partners'],
    queryFn: async () => {
      const response = await api.get('/notifications/low-balance-partners?threshold=1000');
      return response.data;
    },
    refetchInterval: 300000, // Refresh every 5 minutes
  });

  const getAlertIcon = (level: string) => {
    switch (level) {
      case 'CRITICAL':
        return <FaExclamationTriangle className="text-red-500" />;
      case 'WARNING':
        return <FaExclamationTriangle className="text-yellow-500" />;
      case 'LOW':
        return <FaInfoCircle className="text-blue-500" />;
      default:
        return <FaCheckCircle className="text-green-500" />;
    }
  };

  const getAlertColor = (level: string) => {
    switch (level) {
      case 'CRITICAL':
        return 'border-red-200 bg-red-50';
      case 'WARNING':
        return 'border-yellow-200 bg-yellow-50';
      case 'LOW':
        return 'border-blue-200 bg-blue-50';
      default:
        return 'border-green-200 bg-green-50';
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FaBell className="text-gray-600" />
            <h3 className="text-lg font-semibold text-gray-900">Credit Alerts & Notifications</h3>
          </div>
          
          {/* Tab Navigation */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setActiveTab('alerts')}
              className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                activeTab === 'alerts'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Alerts
            </button>
            <button
              onClick={() => setActiveTab('forecast')}
              className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                activeTab === 'forecast'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Forecast
            </button>
            <button
              onClick={() => setActiveTab('partners')}
              className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                activeTab === 'partners'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Partners
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Alerts Tab */}
        {activeTab === 'alerts' && (
          <div className="space-y-4">
            {alertsLoading ? (
              <div className="animate-pulse space-y-3">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            ) : alertsData ? (
              <>
                {/* Main Alert */}
                {alertsData.alertMessage && (
                  <div className={`p-4 rounded-lg border-2 ${getAlertColor(alertsData.alertLevel)}`}>
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-0.5">
                        {getAlertIcon(alertsData.alertLevel)}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{alertsData.alertMessage}</p>
                        <p className="text-sm text-gray-600 mt-1">
                          Current balance: <span className="font-semibold">{alertsData.currentBalance} credits</span>
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Recommendations */}
                {alertsData.recommendations.length > 0 && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-3">Recommendations</h4>
                    <ul className="space-y-2">
                      {alertsData.recommendations.map((rec, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm text-gray-700">
                          <span className="text-blue-500 mt-1">•</span>
                          <span>{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Thresholds */}
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-3">Alert Thresholds</h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-red-500">{alertsData.thresholds.critical}</div>
                      <div className="text-xs text-gray-600">Critical</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-yellow-500">{alertsData.thresholds.warning}</div>
                      <div className="text-xs text-gray-600">Warning</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-500">{alertsData.thresholds.low}</div>
                      <div className="text-xs text-gray-600">Low</div>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <FaInfoCircle className="mx-auto text-4xl mb-2" />
                <p>No alert data available</p>
              </div>
            )}
          </div>
        )}

        {/* Forecast Tab */}
        {activeTab === 'forecast' && (
          <div className="space-y-4">
            {forecastLoading ? (
              <div className="animate-pulse space-y-3">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            ) : forecastData ? (
              <>
                {/* Usage Summary */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-blue-50 rounded-lg p-4 text-center">
                    <FaChartLine className="mx-auto text-2xl text-blue-500 mb-2" />
                    <div className="text-2xl font-bold text-blue-600">{forecastData.dailyAverageUsage}</div>
                    <div className="text-sm text-gray-600">Credits/Day</div>
                  </div>
                  <div className="bg-green-50 rounded-lg p-4 text-center">
                    <FaCalendarAlt className="mx-auto text-2xl text-green-500 mb-2" />
                    <div className="text-2xl font-bold text-green-600">
                      {forecastData.estimatedDaysRemaining === 999 ? '∞' : forecastData.estimatedDaysRemaining}
                    </div>
                    <div className="text-sm text-gray-600">Days Remaining</div>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-4 text-center">
                    <FaCreditCard className="mx-auto text-2xl text-purple-500 mb-2" />
                    <div className="text-2xl font-bold text-purple-600">{forecastData.currentBalance}</div>
                    <div className="text-sm text-gray-600">Current Balance</div>
                  </div>
                </div>

                {/* Forecast Dates */}
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-3">Projected Dates</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Warning Level (200 credits):</span>
                      <span className="font-medium text-yellow-600">
                        {formatDate(forecastData.forecast.warningBalanceDate)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Critical Level (50 credits):</span>
                      <span className="font-medium text-red-600">
                        {formatDate(forecastData.forecast.criticalBalanceDate)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Zero Balance:</span>
                      <span className="font-medium text-gray-900">
                        {formatDate(forecastData.forecast.zeroBalanceDate)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Top Consuming Features */}
                {forecastData.topConsumingFeatures.length > 0 && (
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-3">Top Credit Consumers</h4>
                    <div className="space-y-2">
                      {forecastData.topConsumingFeatures.map((feature, index) => (
                        <div key={index} className="flex justify-between items-center">
                          <span className="text-sm text-gray-600 capitalize">
                            {feature.featureCode.replace('_', ' ').toLowerCase()}
                          </span>
                          <div className="text-right">
                            <span className="font-medium text-gray-900">{feature.totalCredits} credits</span>
                            <span className="text-xs text-gray-500 ml-2">({feature.count} uses)</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <FaChartLine className="mx-auto text-4xl mb-2" />
                <p>No forecast data available</p>
              </div>
            )}
          </div>
        )}

        {/* Partners Tab */}
        {activeTab === 'partners' && (
          <div className="space-y-4">
            {partnersLoading ? (
              <div className="animate-pulse space-y-3">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            ) : partnersData?.success && partnersData.data.length > 0 ? (
              <>
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-gray-900">Partners with Low Credit Balance</h4>
                  <span className="text-sm text-gray-500">
                    {partnersData.meta.count} partners below {partnersData.meta.threshold} credits
                  </span>
                </div>
                
                <div className="space-y-3">
                  {partnersData.data.map((partner: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <FaUsers className="text-gray-400" />
                        <div>
                          <div className="font-medium text-gray-900">{partner.userName}</div>
                          <div className="text-sm text-gray-600">{partner.email}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-gray-900">{partner.currentBalance} credits</div>
                        <div className="text-xs text-gray-500">
                          {partner.role.replace('_', ' ').toLowerCase()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <FaUsers className="mx-auto text-4xl mb-2" />
                <p>No partners with low balances</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CreditAlerts;