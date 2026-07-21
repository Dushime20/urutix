import React from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  MapPin, 
  DollarSign, 
  Shield,
  Award,
  Calendar,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import { useCurrencyFormat } from '../../hooks/useCurrencyFormat';
import { TranslatedText } from '../translated-text';

interface DriverStatsProps {
  stats?: {
    totalTrips: number;
    totalDistance: number;
    totalEarnings: number;
    safetyScore: number;
    onTimeDeliveryRate: number;
    hoursWorkedThisWeek: number;
    hoursWorkedThisMonth: number;
    rating: number;
    consecutiveDrivingHours: number;
  };
  loading?: boolean;
}

export const DriverStats: React.FC<DriverStatsProps> = ({ stats, loading }) => {
  const { format: formatCurrency } = useCurrencyFormat();
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white rounded-lg shadow p-6 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-8 bg-gray-200 rounded w-1/2"></div>
          </div>
        ))}
      </div>
    );
  }

  const defaultStats = {
    totalTrips: 0,
    totalDistance: 0,
    totalEarnings: 0,
    safetyScore: 100,
    onTimeDeliveryRate: 0,
    hoursWorkedThisWeek: 0,
    hoursWorkedThisMonth: 0,
    rating: 0,
    consecutiveDrivingHours: 0,
  };

  const currentStats = stats || defaultStats;

  const statCards = [
    {
      title: 'Total Trips',
      value: currentStats.totalTrips,
      icon: MapPin,
      color: 'blue',
      change: '+12%',
      changeType: 'positive' as const,
      description: 'Completed trips this month'
    },
    {
      title: 'Total Distance',
      value: `${(currentStats.totalDistance / 1000).toFixed(1)}k km`,
      icon: MapPin,
      color: 'green',
      change: '+8%',
      changeType: 'positive' as const,
      description: 'Distance covered this month'
    },
    {
      title: 'Total Earnings',
      value: formatCurrency(currentStats.totalEarnings),
      icon: DollarSign,
      color: 'yellow',
      change: '+15%',
      changeType: 'positive' as const,
      description: 'Earnings this month'
    },
    {
      title: 'Safety Score',
      value: currentStats.safetyScore,
      icon: Shield,
      color: currentStats.safetyScore >= 90 ? 'green' : currentStats.safetyScore >= 70 ? 'yellow' : 'red',
      change: currentStats.safetyScore >= 90 ? 'Excellent' : currentStats.safetyScore >= 70 ? 'Good' : 'Needs Improvement',
      changeType: currentStats.safetyScore >= 90 ? 'positive' : currentStats.safetyScore >= 70 ? 'neutral' : 'negative' as const,
      description: 'Current safety rating'
    },
    {
      title: 'On-Time Delivery',
      value: `${currentStats.onTimeDeliveryRate}%`,
      icon: Award,
      color: currentStats.onTimeDeliveryRate >= 90 ? 'green' : currentStats.onTimeDeliveryRate >= 70 ? 'yellow' : 'red',
      change: currentStats.onTimeDeliveryRate >= 90 ? 'Excellent' : currentStats.onTimeDeliveryRate >= 70 ? 'Good' : 'Needs Improvement',
      changeType: currentStats.onTimeDeliveryRate >= 90 ? 'positive' : currentStats.onTimeDeliveryRate >= 70 ? 'neutral' : 'negative' as const,
      description: 'On-time delivery rate'
    },
    {
      title: 'Hours This Week',
      value: `${currentStats.hoursWorkedThisWeek}h`,
      icon: Clock,
      color: 'purple',
      change: currentStats.hoursWorkedThisWeek <= 40 ? 'Under Limit' : 'Over Limit',
      changeType: currentStats.hoursWorkedThisWeek <= 40 ? 'positive' : 'negative' as const,
      description: 'Hours worked this week'
    },
    {
      title: 'Driver Rating',
      value: currentStats.rating.toFixed(1),
      icon: Award,
      color: currentStats.rating >= 4.5 ? 'green' : currentStats.rating >= 4.0 ? 'yellow' : 'red',
      change: currentStats.rating >= 4.5 ? 'Excellent' : currentStats.rating >= 4.0 ? 'Good' : 'Needs Improvement',
      changeType: currentStats.rating >= 4.5 ? 'positive' : currentStats.rating >= 4.0 ? 'neutral' : 'negative' as const,
      description: 'Customer rating'
    },
    {
      title: 'Consecutive Hours',
      value: `${currentStats.consecutiveDrivingHours}h`,
      icon: Clock,
      color: currentStats.consecutiveDrivingHours <= 8 ? 'green' : currentStats.consecutiveDrivingHours <= 10 ? 'yellow' : 'red',
      change: currentStats.consecutiveDrivingHours <= 8 ? 'Under Limit' : currentStats.consecutiveDrivingHours <= 10 ? 'Warning' : 'Over Limit',
      changeType: currentStats.consecutiveDrivingHours <= 8 ? 'positive' : currentStats.consecutiveDrivingHours <= 10 ? 'neutral' : 'negative' as const,
      description: 'Current driving session'
    }
  ];

  const getColorClasses = (color: string, changeType: 'positive' | 'negative' | 'neutral') => {
    const colorMap = {
      blue: 'bg-blue-50 text-blue-600',
      green: 'bg-green-50 text-green-600',
      yellow: 'bg-yellow-50 text-yellow-600',
      red: 'bg-red-50 text-red-600',
      purple: 'bg-purple-50 text-purple-600'
    };

    const changeColorMap = {
      positive: 'text-green-600',
      negative: 'text-red-600',
      neutral: 'text-yellow-600'
    };

    return {
      bg: colorMap[color as keyof typeof colorMap] || 'bg-gray-50 text-gray-600',
      change: changeColorMap[changeType]
    };
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900"><TranslatedText text="Performance Overview" /></h2>
        <div className="flex items-center space-x-2 text-sm text-gray-500">
          <Calendar className="w-4 h-4" />
          <span><TranslatedText text="This Month" /></span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          const colors = getColorClasses(stat.color, stat.changeType);
          
          return (
            <div key={index} className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-2 rounded-lg ${colors.bg}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className={`text-sm font-medium ${colors.change}`}>
                  {stat.changeType === 'positive' && <TrendingUp className="w-4 h-4 inline mr-1" />}
                  {stat.changeType === 'negative' && <TrendingDown className="w-4 h-4 inline mr-1" />}
                  {stat.change.startsWith('+') || stat.change.startsWith('-') ? stat.change : <TranslatedText text={stat.change} />}
                </div>
              </div>
              
              <div className="mb-2">
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                <p className="text-sm font-medium text-gray-600"><TranslatedText text={stat.title} /></p>
              </div>
              
              <p className="text-xs text-gray-500"><TranslatedText text={stat.description} /></p>
            </div>
          );
        })}
      </div>

      {/* Additional Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4"><TranslatedText text="Weekly Progress" /></h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600"><TranslatedText text="Hours Target" /></span>
              <span className="text-sm font-medium text-gray-900">40h / 40h</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full" 
                style={{ width: `${Math.min((currentStats.hoursWorkedThisWeek / 40) * 100, 100)}%` }}
              ></div>
            </div>
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>0h</span>
              <span>20h</span>
              <span>40h</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4"><TranslatedText text="Safety Alerts" /></h3>
          <div className="space-y-3">
            {currentStats.consecutiveDrivingHours > 8 && (
              <div className="flex items-center space-x-2 text-yellow-600">
                <AlertTriangle className="w-4 h-4" />
                <span className="text-sm"><TranslatedText text="Approaching driving time limit" /></span>
              </div>
            )}
            {currentStats.safetyScore < 80 && (
              <div className="flex items-center space-x-2 text-red-600">
                <AlertTriangle className="w-4 h-4" />
                <span className="text-sm"><TranslatedText text="Safety score needs improvement" /></span>
              </div>
            )}
            {currentStats.consecutiveDrivingHours <= 8 && currentStats.safetyScore >= 80 && (
              <div className="flex items-center space-x-2 text-green-600">
                <CheckCircle className="w-4 h-4" />
                <span className="text-sm"><TranslatedText text="All safety metrics are good" /></span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
