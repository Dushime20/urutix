import React, { useState } from 'react';
import {
  AlertTriangle, CheckCircle, Info,
  Truck, Route, Clock, Thermometer,
  MapPin as MapPinIcon, Lightbulb, Bell,
  XCircle, ArrowRight, Search,
  ThermometerSun, Wind, Droplets,
  Shield
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { TranslatedText } from '../translated-text';
import { useTranslation } from '../../hooks/useTranslation';

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
  className?: string;
}

const OperationalInsights: React.FC<OperationalInsightsProps> = ({
  className = ''
}) => {
  const { tSync } = useTranslation();
  const [activeTab, setActiveTab] = useState<'alerts' | 'routes' | 'weather'>('alerts');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showResolved, setShowResolved] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Enlite Prime Theme Colors
  const colors = {
    primary: '#2D5173', // Navy
    primaryLight: '#E8EAF6',
    background: '#F9FAFB',
    surface: '#FFFFFF',
    textPrimary: '#1F2937',
    textSecondary: '#6B7280',
    success: '#4CAF50',
    successLight: '#E8F5E9',
    error: '#F44336',
    errorLight: '#FFEBEE',
    warning: '#FF9800',
    warningLight: '#FFF3E0',
    info: '#2196F3',
    infoLight: '#E3F2FD'
  };

  // Mock data
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
      duration: '48H'
    },
    {
      id: 2,
      location: 'Eastern Corridor',
      condition: 'Strong Winds',
      severity: 'medium',
      impact: 'Minor delays, fuel consumption increase',
      duration: '24H'
    }
  ];

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-amber-500" />;
      case 'info':
        return <Info className="w-5 h-5 text-primary-600" />;
      case 'success':
        return <CheckCircle className="w-5 h-5 text-emerald-500" />;
      case 'critical':
        return <XCircle className="w-5 h-5 text-rose-500" />;
      default:
        return <Info className="w-5 h-5 text-slate-400" />;
    }
  };

  const getPriorityChip = (priority: string) => {
    const theme = priority === 'high'
      ? { bg: colors.errorLight, text: colors.error }
      : priority === 'medium'
        ? { bg: colors.warningLight, text: colors.warning }
        : { bg: colors.successLight, text: colors.success };

    return (
      <span className="px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border border-transparent" style={{ backgroundColor: theme.bg, color: theme.text }}>
        {priority}
      </span>
    );
  };

  const filteredAlerts = (selectedCategory === 'all' ? alerts : alerts.filter(a => a.category === selectedCategory))
    .filter(a => a.title.toLowerCase().includes(searchQuery.toLowerCase()) || a.description.toLowerCase().includes(searchQuery.toLowerCase()));

  const categories = [
    { id: 'all', label: 'All', icon: Bell },
    { id: 'fleet', label: 'Fleet', icon: Truck },
    { id: 'route', label: 'Route', icon: Route },
    { id: 'maintenance', label: 'Maintenance', icon: Clock },
    { id: 'weather', label: 'Weather', icon: Thermometer },
    { id: 'traffic', label: 'Traffic', icon: MapPinIcon }
  ];

  return (
    <div className={`bg-[#F9FAFB] dark:bg-slate-950 rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col h-full max-h-[95vh] text-[#1F2937] antialiased ${className}`}>
      {/* Header */}
      <div className="px-10 py-8 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
        <div>
          <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-1 italic"><TranslatedText text="Intelligence Grid" /></h3>
          <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white"><TranslatedText text="Operational Insights" /></h2>
        </div>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 cursor-pointer group">
            <input
              type="checkbox"
              checked={showResolved}
              onChange={(e) => setShowResolved(e.target.checked)}
              className="w-4 h-4 rounded-md border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-primary-600 dark:text-primary-400 focus:ring-primary-500/20"
            />
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors"><TranslatedText text="Show Resolved" /></span>
          </label>
          <button className="bg-primary-600 hover:bg-primary-700 text-white px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-indigo-100 dark:shadow-slate-950/20 flex items-center text-[10px] font-black uppercase tracking-widest">
            <Lightbulb className="w-4 h-4 mr-2" />
            <TranslatedText text="Live Report" />
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="px-10 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
        <div className="flex gap-8">
          {(['alerts', 'routes', 'weather'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-5 text-[11px] font-black uppercase tracking-widest transition-all relative ${activeTab === tab ? 'text-primary-600 dark:text-primary-400' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
                }`}
            >
              {tab === 'alerts' && tSync('Active Alerts')}
              {tab === 'routes' && tSync('Route Efficiency')}
              {tab === 'weather' && tSync('Weather Updates')}
              {activeTab === tab && (
                <motion.div
                  layoutId="opTabIndicator"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 rounded-full"
                />
              )}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
            <input
              type="text"
              placeholder={tSync("Quick search...")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-lg text-xs font-medium dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:border-primary-600 transition-all outline-none w-48"
            />
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-10 custom-scrollbar">
        <AnimatePresence mode="wait">
          {activeTab === 'alerts' && (
            <motion.div
              key="alerts"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="space-y-6"
            >
              {/* Category Filter Pills */}
              <div className="flex gap-2 pb-4 overflow-x-auto no-scrollbar">
                {categories.map((cat) => {
                  const Icon = cat.icon;
                  const isActive = selectedCategory === cat.id;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`flex items-center gap-2.5 px-4 py-2 rounded-full border transition-all whitespace-nowrap ${isActive
                        ? 'bg-primary-600 text-white border-primary-600 shadow-md shadow-primary-100 dark:shadow-slate-950/40'
                        : 'bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700'
                        }`}
                    >
                      <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-primary-500'}`} />
                      <span className="text-[10px] font-black uppercase tracking-widest">{tSync(cat.label)}</span>
                    </button>
                  );
                })}
              </div>

              {/* Alerts List */}
              <div className="grid grid-cols-1 gap-4">
                {filteredAlerts.length > 0 ? (
                  filteredAlerts.map((alert, idx) => (
                    <motion.div
                      key={alert.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className="group bg-white dark:bg-slate-900 p-6 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-[0_4px_20px_rgba(0,0,0,0.02)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.05)] transition-all flex items-start gap-6"
                      >
                        <div className={`p-4 rounded-[18px] flex-shrink-0 ${alert.type === 'critical' ? 'bg-[#fff1f2] dark:bg-red-900/20' : alert.type === 'warning' ? 'bg-[#fffbeb] dark:bg-amber-900/20' : 'bg-[#f0f7ff] dark:bg-primary-900/20'
                          }`}>
                          {getAlertIcon(alert.type)}
                        </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start mb-1">
                          <h4 className="text-base font-black text-slate-900 dark:text-slate-100 tracking-tight group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors uppercase italic">{tSync(alert.title)}</h4>
                          <div className="flex items-center gap-3">
                            {getPriorityChip(alert.priority)}
                            <span className="text-[10px] font-bold text-slate-300 dark:text-slate-600 uppercase tracking-widest">{tSync(alert.timestamp)}</span>
                          </div>
                        </div>
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400 leading-relaxed mb-4">{tSync(alert.description)}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.15em] bg-slate-50 dark:bg-slate-800 px-2 py-1 rounded-md">{tSync(alert.category.replace(/_/g, ' '))}</span>
                          {alert.actionable && (
                            <div className="flex items-center gap-4">
                              <button className="text-[10px] font-black text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-200 uppercase tracking-widest transition-colors flex items-center gap-1.5 underline decoration-primary-200">
                                <TranslatedText text="Resolve Node" /> <ArrowRight className="w-3 h-3" />
                              </button>
                              <button className="text-[10px] font-black text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 uppercase tracking-widest transition-colors"><TranslatedText text="Dismiss" /></button>
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <div className="py-20 text-center bg-white dark:bg-slate-900 rounded-[32px] border border-dashed border-slate-200 dark:border-slate-800">
                    <div className="w-16 h-16 bg-[#f0f7ff] dark:bg-primary-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Shield className="w-8 h-8 text-[#1e40af] dark:text-primary-400" />
                    </div>
                    <h4 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight"><TranslatedText text="No Issues Found" /></h4>
                    <p className="text-sm text-slate-400 dark:text-slate-500 max-w-xs mx-auto mt-1 font-medium italic"><TranslatedText text="All systems are running normally across your network." /></p>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {activeTab === 'routes' && (
            <motion.div
              key="routes"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="grid grid-cols-1 lg:grid-cols-2 gap-8"
            >
              {routeOptimizations.map((opt) => (
                <div key={opt.id} className="bg-white dark:bg-slate-900 p-8 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-lg hover:shadow-primary-500/5 transition-all flex flex-col justify-between overflow-hidden relative group">
                  <div className="relative z-10">
                    <div className="flex justify-between items-start mb-8">
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <div className="p-2 bg-[#f0f7ff] dark:bg-primary-900/20 rounded-lg">
                            <Route className="w-5 h-5 text-[#1e40af] dark:text-primary-400" />
                          </div>
                          <h4 className="text-lg font-black text-slate-900 dark:text-slate-100 tracking-tight">{tSync(opt.route)}</h4>
                        </div>
                        <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest pl-12"><TranslatedText text="Route Analysis Node" /> #{opt.id}</p>
                      </div>
                      <div className="px-3 py-1 bg-primary-50 dark:bg-primary-900/40 rounded-full border border-slate-100 dark:border-slate-800">
                        <span className="text-[11px] font-black text-primary-600 dark:text-primary-400">+{opt.potentialImprovement}% <TranslatedText text="Improvement" /></span>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-6 mb-10 pl-2">
                      <div>
                        <p className="text-[9px] font-black text-slate-300 dark:text-slate-600 uppercase tracking-widest mb-1"><TranslatedText text="Current" /></p>
                        <p className="text-xl font-black text-slate-800 dark:text-slate-100">{opt.currentEfficiency}%</p>
                      </div>
                      <div>
                        <p className="text-xl font-black text-slate-300 dark:text-slate-600 uppercase tracking-widest mb-1"><TranslatedText text="Projected" /></p>
                        <p className="text-xl font-black text-emerald-500">{opt.currentEfficiency + opt.potentialImprovement}%</p>
                      </div>
                      <div>
                        <p className="text-xl font-black text-slate-300 dark:text-slate-600 uppercase tracking-widest mb-1"><TranslatedText text="Savings" /></p>
                        <p className="text-xl font-black text-[#1e40af] dark:text-primary-400">RF {opt.estimatedSavings.toLocaleString()}</p>
                      </div>
                    </div>

                    <div className="space-y-4 pl-2">
                      <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest italic flex items-center gap-2">
                        <div className="w-1 h-1 bg-primary-500 rounded-full"></div>
                        <TranslatedText text="Recommended Actions" />
                      </p>
                      <div className="space-y-2">
                        {opt.recommendations.map((rec, i) => (
                          <div key={i} className="flex items-center gap-4 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 hover:bg-white dark:hover:bg-slate-800 transition-all cursor-default">
                            <Lightbulb className="w-4 h-4 text-amber-500 flex-shrink-0" />
                            <span className="text-xs font-bold text-slate-600 dark:text-slate-400">{tSync(rec)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="absolute top-0 right-0 w-32 h-32 bg-[#f0f7ff] dark:bg-primary-900/10 rounded-full -mr-16 -mt-16 group-hover:bg-[#e0f2fe] dark:group-hover:bg-primary-900/20 transition-colors duration-500"></div>
                </div>
              ))}
            </motion.div>
          )}

          {activeTab === 'weather' && (
            <motion.div
              key="weather"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-8"
            >
              {weatherAlerts.map((w) => (
                <div key={w.id} className="bg-white dark:bg-slate-900 p-8 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-lg hover:shadow-primary-500/5 transition-all group">
                  <div className="flex gap-6">
                    <div className={`p-5 rounded-[22px] flex-shrink-0 ${w.severity === 'high' ? 'bg-[#fff1f2] dark:bg-red-900/20 text-rose-600 dark:text-red-400' : 'bg-[#fffbeb] dark:bg-amber-900/20 text-amber-600'}`}>
                      <ThermometerSun className="w-8 h-8" />
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h4 className="text-lg font-black text-slate-900 dark:text-white tracking-tight italic">{tSync(w.location)}</h4>
                          <div className="flex items-center gap-2 mt-1">
                            <div className={`w-2 h-2 rounded-full ${w.severity === 'high' ? 'bg-rose-500 animate-pulse' : 'bg-amber-500'}`}></div>
                            <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest italic">{tSync(w.severity)} <TranslatedText text="Severity Vector" /></span>
                          </div>
                        </div>
                        <span className="text-[10px] font-black text-slate-300 dark:text-slate-600 uppercase tracking-widest">{w.duration} <TranslatedText text="Window" /></span>
                      </div>
                      <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className="bg-[#f8fafc] dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                          <p className="text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1 italic"><TranslatedText text="Atmosphere" /></p>
                          <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 font-bold text-xs uppercase">
                            <Droplets className="w-3 h-3 text-[#1e40af] dark:text-primary-400" /> {tSync(w.condition)}
                          </div>
                        </div>
                        <div className="bg-[#f8fafc] dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                          <p className="text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1 italic"><TranslatedText text="Wind Vector" /></p>
                          <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 font-bold text-xs uppercase">
                            <Wind className="w-3 h-3 text-[#1e40af] dark:text-primary-400" /> <TranslatedText text="Moderate" />
                          </div>
                        </div>
                      </div>
                      <div className="p-4 bg-slate-900 dark:bg-black rounded-2xl shadow-inner border border-slate-800">
                        <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1"><TranslatedText text="Operational Impact" /></p>
                        <p className="text-xs font-bold text-white leading-relaxed italic">{tSync(w.impact)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              <div className="md:col-span-2 py-12 flex flex-col items-center justify-center bg-primary-600 dark:bg-primary-700 rounded-[40px] text-white shadow-xl shadow-primary-100 dark:shadow-slate-950/20 relative overflow-hidden group">
                <div className="relative z-10 text-center">
                  <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center mx-auto mb-4 border border-white/20">
                    <Wind className="w-8 h-8 text-white" />
                  </div>
                  <h4 className="text-xl font-black tracking-tight italic uppercase"><TranslatedText text="Access Regional Radar" /></h4>
                  <p className="text-sm text-white/70 font-medium mb-6 italic"><TranslatedText text="View live environmental vectors and corridor analytics." /></p>
                  <button className="bg-white text-primary-600 px-8 py-3 rounded-full font-black uppercase text-[10px] tracking-widest hover:bg-slate-50 transition-all active:scale-95 shadow-xl"><TranslatedText text="Launch Radar Scan" /></button>
                </div>
                <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full -mr-32 -mt-32 backdrop-blur-3xl group-hover:bg-white/10 transition-colors duration-700"></div>
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full -ml-24 -mb-24 blur-3xl group-hover:bg-white/10 transition-colors duration-700"></div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #E2E8F0;
          border-radius: 10px;
        }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #334155;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #94A3B8;
        }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #475569;
        }
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
};

export default OperationalInsights;
