import {
  ArrowUp, ArrowDown, Minus,
  Trophy, Target,
  ShieldCheck, Zap, Activity
} from 'lucide-react';

interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  target: number;
  previous: number;
  trend: 'up' | 'down' | 'stable';
  category: 'revenue' | 'efficiency' | 'quality' | 'safety';
  status: 'excellent' | 'good' | 'average' | 'poor';
}

interface PerformanceMetricsProps {
  tenantId?: string;
  className?: string;
}

const PerformanceMetrics: React.FC<PerformanceMetricsProps> = ({
  className = ''
}) => {
  // Mock data - in real app, this would come from API calls
  const metrics: PerformanceMetric[] = [
    {
      name: 'Sales Growth',
      value: 12.5,
      unit: '%',
      target: 10.0,
      previous: 8.2,
      trend: 'up',
      category: 'revenue',
      status: 'excellent'
    },
    {
      name: 'Truck Usage',
      value: 87.3,
      unit: '%',
      target: 85.0,
      previous: 84.1,
      trend: 'up',
      category: 'efficiency',
      status: 'good'
    },
    {
      name: 'On-Time Delivery',
      value: 94.2,
      unit: '%',
      target: 95.0,
      previous: 93.8,
      trend: 'up',
      category: 'quality',
      status: 'good'
    },
    {
      name: 'Fuel Efficiency',
      value: 8.7,
      unit: 'km/L',
      target: 9.0,
      previous: 8.5,
      trend: 'up',
      category: 'efficiency',
      status: 'good'
    },
    {
      name: 'Customer Satisfaction',
      value: 4.6,
      unit: '/5',
      target: 4.5,
      previous: 4.4,
      trend: 'up',
      category: 'quality',
      status: 'excellent'
    },
    {
      name: 'Safety Score',
      value: 98.5,
      unit: '%',
      target: 99.0,
      previous: 98.2,
      trend: 'up',
      category: 'safety',
      status: 'good'
    },
    {
      name: 'Load Optimization',
      value: 92.1,
      unit: '%',
      target: 90.0,
      previous: 89.5,
      trend: 'up',
      category: 'efficiency',
      status: 'excellent'
    },
    {
      name: 'Dispute Rate',
      value: 2.1,
      unit: '%',
      target: 2.0,
      previous: 2.3,
      trend: 'down',
      category: 'quality',
      status: 'good'
    }
  ];

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <ArrowUp className="w-3 h-3 text-emerald-500" />;
      case 'down':
        return <ArrowDown className="w-3 h-3 text-rose-500" />;
      default:
        return <Minus className="w-3 h-3 text-slate-400" />;
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'excellent':
        return 'bg-emerald-50 text-emerald-700 border-emerald-100';
      case 'good':
        return 'bg-primary-50 text-primary-700 border-primary-100';
      case 'average':
        return 'bg-amber-50 text-amber-700 border-amber-100';
      case 'poor':
        return 'bg-rose-50 text-rose-700 border-rose-100';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-100';
    }
  };

  const getCategoryIcon = (category: string) => {
    const iconClass = "w-4 h-4 text-primary-600";
    switch (category) {
      case 'revenue':
        return <Trophy className={iconClass} />;
      case 'efficiency':
        return <Zap className={iconClass} />;
      case 'quality':
        return <Target className={iconClass} />;
      case 'safety':
        return <ShieldCheck className={iconClass} />;
      default:
        return <Activity className={iconClass} />;
    }
  };

  const getProgressColor = (value: number, target: number) => {
    const percentage = (value / target) * 100;
    if (percentage >= 100) return 'bg-emerald-500';
    if (percentage >= 80) return 'bg-primary-500';
    if (percentage >= 60) return 'bg-amber-500';
    return 'bg-rose-500';
  };

  const getProgressWidth = (value: number, target: number) => {
    const percentage = Math.min((value / target) * 100, 100);
    return `${percentage}%`;
  };

  return (
    <div className={`space-y-8 ${className}`}>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric) => (
          <div key={metric.name} className="bg-white rounded-[32px] p-6 border border-gray-100 shadow-sm hover:shadow-xl hover:shadow-primary-500/5 transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <div className="p-2.5 bg-[#f0f7ff] rounded-xl">
                  {getCategoryIcon(metric.category)}
                </div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{metric.category}</span>
              </div>
              <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border ${getStatusStyle(metric.status)}`}>
                {metric.status}
              </span>
            </div>

            <div className="mb-4">
              <h4 className="text-sm font-black text-slate-800 tracking-tight mb-2">
                {metric.name}
              </h4>
              <div className="flex items-end space-x-2">
                <span className="text-2xl font-black text-slate-900 leading-none">
                  {metric.value}
                </span>
                <span className="text-xs font-bold text-slate-400 mb-0.5">{metric.unit}</span>
                <div className="flex items-center space-x-1 mb-1 ml-1">
                  {getTrendIcon(metric.trend)}
                  <span className={`text-[10px] font-bold ${metric.trend === 'up' ? 'text-emerald-600' :
                    metric.trend === 'down' ? 'text-rose-600' : 'text-slate-500'
                    }`}>
                    {Math.abs(metric.value - metric.previous).toFixed(1)}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-[10px] font-bold text-slate-400">
                <span className="uppercase tracking-wide">Target: {metric.target}{metric.unit}</span>
                <span>{((metric.value / metric.target) * 100).toFixed(0)}%</span>
              </div>
              <div className="w-full bg-gray-50 rounded-full h-1.5 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ease-out ${getProgressColor(metric.value, metric.target)}`}
                  style={{ width: getProgressWidth(metric.value, metric.target) }}
                ></div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Summary Section - Premium Enlite Card */}
      <div className="bg-primary-600 rounded-[32px] p-8 text-white relative overflow-hidden shadow-lg shadow-primary-200">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-20 -mt-20 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full -ml-10 -mb-10 blur-2xl"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="flex items-center space-x-4">
            <div className="p-4 bg-white/20 backdrop-blur-md rounded-[20px]">
              <Trophy className="text-white w-6 h-6" />
            </div>
            <div>
              <h4 className="text-lg font-black tracking-tight">Operational Insights</h4>
              <p className="text-primary-100 text-sm font-medium">Overview of your business performance</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-8 md:gap-12">
            <div>
              <div className="text-3xl font-black">
                {metrics.filter(m => m.status === 'excellent').length}
              </div>
              <div className="text-[10px] font-black uppercase tracking-widest text-primary-100">Excellent</div>
            </div>
            <div>
              <div className="text-3xl font-black">
                {metrics.filter(m => m.trend === 'up').length}
              </div>
              <div className="text-[10px] font-black uppercase tracking-widest text-primary-100">Improving</div>
            </div>
            <div>
              <div className="text-3xl font-black">
                {((metrics.filter(m => m.value >= m.target).length / metrics.length) * 100).toFixed(0)}%
              </div>
              <div className="text-[10px] font-black uppercase tracking-widest text-primary-100">Target</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PerformanceMetrics;

