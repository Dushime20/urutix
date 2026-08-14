import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useQuery } from '@tanstack/react-query';
import {
  AlertTriangle as FaExclamationTriangle,
  Download,
  Activity,
  Package,
  Truck,
  CreditCard,
  Shield,
  User,
  CheckCircle,
  Info,
  Clock,
  MapPin,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler,
} from 'chart.js';
import { TranslatedText } from '../translated-text';
import { useTranslation } from '../../hooks/useTranslation';

import DashboardHeader from '../Layout/DashboardHeader';
import PageContainer from '../Layout/PageContainer';
import QuickStats from './QuickStats';
import FleetOverview from './FleetOverview';
import CargoAnalytics from './CargoAnalytics';
import FinancialMetrics from './FinancialMetrics';
import OperationalInsights from './OperationalInsights';
import RecentActivity from './RecentActivity';
import LowCreditPartners from './LowCreditPartners';
import SkeletonDashboard from './SkeletonDashboard';
import TenantUserManagement from './TenantUserManagement';
import ActiveTrips from './ActiveTrips';
import TenantSettings from './TenantSettings';
import TenantBidding from './TenantBidding';
import TruckOwnerBilling from '../../pages/tenant-admin/TruckOwnerBilling';
import PurchaseCredits from '../../pages/subscription/PurchaseCredits';
import BillingDashboard from '../../pages/subscription/BillingDashboard';
import SubscriptionPlans from '../../pages/subscription/SubscriptionPlans';
import Profile from '../../pages/Profile';
import TenantLenderManagementPage from '../../pages/TenantLenderManagementPage';
import TenantCommunication from '../../pages/tenant/TenantCommunication';
import { EnhancedKycVerificationCenter as KycManagementPage } from '../UserKYC';
import TenantSupportCenter from '../../pages/support/TenantSupportCenter';
import { tenantApi } from '../../services/tenantApi';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/Dialog';
import { TripTracker } from '../TripTracker/TripTracker';
import RoutePerformance from './RoutePerformance';
import TruckOwnerPerformance from './TruckOwnerPerformance';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler
);

interface TenantDashboardProps {
  tenantId?: string;
  className?: string;
  defaultView?: 'overview' | 'fleet' | 'cargo' | 'drivers' | 'financial' | 'operations' | 'users' | 'truck-owners' | 'trips' | 'settings' | 'bidding' | 'purchase-credits' | 'billing' | 'subscription-plans' | 'communicate' | 'profile' | 'lenders' | 'kyc' | 'reports';
}

const TenantDashboard: React.FC<TenantDashboardProps> = ({
  tenantId,
  className = '',
  defaultView = 'overview'
}) => {
  const { tSync } = useTranslation();
  const [timeRange, setTimeRange] = useState('7d');
  const [selectedView, setSelectedView] = useState<'overview' | 'fleet' | 'cargo' | 'drivers' | 'financial' | 'operations' | 'users' | 'truck-owners' | 'trips' | 'settings' | 'bidding' | 'purchase-credits' | 'billing' | 'subscription-plans' | 'communicate' | 'profile' | 'lenders' | 'kyc' | 'reports'>(defaultView);
  const [trackingActivity, setTrackingActivity] = useState<any>(null);
  const [isTrackModalOpen, setIsTrackModalOpen] = useState(false);

  const getStatusTheme = (status: string) => {
    switch (status) {
      case 'warning':
      case 'error':
        return {
          bg: 'bg-primary-600',
          lightBg: 'bg-amber-50',
          text: 'text-amber-600',
          icon: FaExclamationTriangle
        };
      case 'success':
      case 'info':
      default:
        return {
          bg: 'bg-primary-600',
          lightBg: 'bg-primary-50',
          text: 'text-primary-600',
          icon: status === 'success' ? CheckCircle : status === 'info' ? Info : Clock
        };
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'shipment': return Package;
      case 'maintenance':
      case 'fleet': return Truck;
      case 'payment': return CreditCard;
      case 'dispute': return Shield;
      case 'driver': return User;
      default: return Activity;
    }
  };

  const handleTrackEvent = (activity: any) => {
    setTrackingActivity(activity);
    setIsTrackModalOpen(true);
  };

  useEffect(() => {
    setSelectedView(defaultView);
  }, [defaultView]);

  // Use React Query for data fetching
  const { data: tenantData, isLoading, error } = useQuery({
    queryKey: ['tenant', tenantId, timeRange],
    queryFn: async () => {
      const summary = await tenantApi.getTenantDashboardSummary(tenantId || 'default-tenant', timeRange);
      return {
        metrics: summary.metrics,
        trends: summary.trends,
        activity: summary.recentActivity,
        lowCreditPartners: summary.lowCreditPartners || []
      };
    },
    enabled: !!tenantId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
    retry: 2,
  });

  // Use real data from API
  const data = tenantData || {
    metrics: {
      totalRevenue: 0,
      totalShipments: 0,
      activeFleet: 0,
      onTimeDelivery: 0,
      customerSatisfaction: 0,
      fuelEfficiency: 0,
      averageLoadUtilization: 0,
      disputeRate: 0,
    },
    trends: {
      revenue: [],
      shipments: [],
      fleetUtilization: [],
      fuelEfficiency: [],
    },
    activity: [],
    lowCreditPartners: []
  };

  const handleNotifyLowCredit = async () => {
    const notifyToast = toast.loading(tSync('Broadcasting alerts to partners...'));
    try {
      await tenantApi.notifyLowCreditPartners(tenantId || 'default-tenant');
      toast.success(tSync('Alerts broadcasted successfully'), { id: notifyToast });
    } catch (error) {
      console.error('Failed to notify partners:', error);
      toast.error(tSync('Failed to broadcast alerts'), { id: notifyToast });
    }
  };

  const handleTimeRangeChange = (range: string) => {
    setTimeRange(range);
  };

  const handleExportData = async (format: 'csv' | 'excel' | 'pdf' = 'csv') => {
    try {
      const blob = await tenantApi.exportTenantData(tenantId || 'default-tenant', format, {
        startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        endDate: new Date().toISOString(),
        dataType: 'dashboard'
      });

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `tenant - dashboard - ${format} -${new Date().toISOString().split('T')[0]}.${format} `;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Export failed:', error);
      // In a real app, you would show a toast notification
    }
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          usePointStyle: true,
          padding: 20,
          font: { size: 12, weight: 'bold' as const }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        titleColor: '#1e293b',
        bodyColor: '#475569',
        borderColor: '#e2e8f0',
        borderWidth: 1,
        cornerRadius: 12,
        padding: 12,
        boxPadding: 6,
        usePointStyle: true,
        displayColors: true
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: { color: 'rgba(0, 0, 0, 0.05)', drawBorder: false },
        ticks: { color: '#94a3b8', font: { size: 10 } }
      },
      x: {
        grid: { display: false },
        ticks: { color: '#94a3b8', font: { size: 10 } }
      }
    }
  };

  // Revenue Gradient Helper
  const revenueGradient = (ctx: CanvasRenderingContext2D) => {
    const gradient = ctx.createLinearGradient(0, 0, 0, 400);
    gradient.addColorStop(0, 'rgba(52, 94, 133, 0.2)');
    gradient.addColorStop(1, 'rgba(52, 94, 133, 0)');
    return gradient;
  };

  // Fleet Gradient Helper
  const fleetGradient = (ctx: CanvasRenderingContext2D) => {
    const gradient = ctx.createLinearGradient(0, 0, 0, 400);
    gradient.addColorStop(0, 'rgba(52, 94, 133, 0.2)');
    gradient.addColorStop(1, 'rgba(52, 94, 133, 0)');
    return gradient;
  };

  // Generate labels dynamically based on actual data length and timeRange
  const buildLabels = (dataArray: number[], range: string): string[] => {
    const len = dataArray?.length || 0;
    if (len === 0) return [];
    const now = new Date();
    return Array.from({ length: len }, (_, i) => {
      const d = new Date(now);
      d.setDate(now.getDate() - (len - 1 - i));
      if (range === '7d') {
        return d.toLocaleDateString('en-US', { weekday: 'short' });
      }
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    });
  };

  const revenueLabels = buildLabels(data.trends.revenue, timeRange);
  const fleetLabels   = buildLabels(data.trends.fleetUtilization, timeRange);

  const revenueData = {
    labels: revenueLabels,
    datasets: [
      {
        label: 'Revenue',
        data: data.trends.revenue,
        borderColor: '#345E85',
        backgroundColor: (context: any) => {
          const chart = context.chart;
          const { ctx, chartArea } = chart;
          if (!chartArea) return 'rgba(52, 94, 133, 0.1)';
          return revenueGradient(ctx);
        },
        borderWidth: 2,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: '#345E85',
        pointBorderColor: 'white',
        pointBorderWidth: 2,
        pointRadius: 0,
        pointHoverRadius: 6,
        pointHoverBackgroundColor: '#345E85',
        pointHoverBorderColor: 'white',
        pointHoverBorderWidth: 3,
      }
    ]
  };

  const fleetUtilizationData = {
    labels: fleetLabels,
    datasets: [
      {
        label: 'Fleet Utilization (%)',
        data: data.trends.fleetUtilization,
        borderColor: '#345E85',
        backgroundColor: (context: any) => {
          const chart = context.chart;
          const { ctx, chartArea } = chart;
          if (!chartArea) return 'rgba(52, 94, 133, 0.1)';
          return fleetGradient(ctx);
        },
        borderWidth: 2,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: '#345E85',
        pointBorderColor: 'white',
        pointBorderWidth: 2,
        pointRadius: 0,
        pointHoverRadius: 6,
        pointHoverBackgroundColor: '#345E85',
        pointHoverBorderColor: 'white',
        pointHoverBorderWidth: 3,
      }
    ]
  };

  return (
    <div className={`min-h-screen bg-[#fafafa] dark:bg-slate-950 ${className}`}>
      <DashboardHeader />

      <PageContainer className="py-6 sm:py-8">
        {/* Loading State - Premium Skeleton */}
        {isLoading && <SkeletonDashboard />}

        {/* Error State */}
        {error && (
          <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/20 rounded-xl p-4 mb-5 flex items-center">
            <div className="p-3 bg-amber-100 dark:bg-amber-900/20 rounded-xl mr-4">
              <FaExclamationTriangle className="text-amber-600 dark:text-amber-500 w-5 h-5" />
            </div>
            <div>
              <h3 className="ui-label mb-0 text-amber-900 dark:text-amber-100"><TranslatedText text="Intelligence Offline" /></h3>
              <p className="ui-body-small text-amber-700 dark:text-amber-400 mt-0.5"><TranslatedText text="Using local backup data. Reconnecting to node..." /></p>
            </div>
          </div>
        )}

        <AnimatePresence mode="wait">
          {!isLoading && selectedView === 'overview' && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
              className="space-y-6"
            >
              {/* 1. KPI strip */}
              <section>
                <div className="flex items-end justify-between mb-3">
                  <div>
                    <p className="ui-label mb-0">
                      <TranslatedText text="At a glance" />
                    </p>
                    <h2 className="ui-section-title normal-case">
                      <TranslatedText text="Operations summary" />
                    </h2>
                  </div>
                </div>
                <QuickStats metrics={data.metrics} />
              </section>

              {/* 2. Priority alerts */}
              {data.lowCreditPartners && data.lowCreditPartners.length > 0 && (
                <section>
                  <LowCreditPartners
                    partners={data.lowCreditPartners}
                    onNotifyAll={handleNotifyLowCredit}
                  />
                </section>
              )}

              {/* 3. Trends + live feed */}
              <section className="grid grid-cols-1 xl:grid-cols-12 gap-4 lg:gap-5">
                <div className="xl:col-span-8 space-y-4 lg:space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-5">
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.08 }}
                      className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm p-5"
                    >
                      <div className="flex items-start justify-between gap-3 mb-5">
                        <div>
                          <p className="ui-label mb-0.5">
                            <TranslatedText text="Revenue" />
                          </p>
                          <h3 className="ui-card-title">
                            <TranslatedText text="Weekly trend" />
                          </h3>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <select
                            value={timeRange}
                            onChange={(e) => handleTimeRangeChange(e.target.value)}
                            className="ui-body text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                          >
                            <option value="7d"><TranslatedText text="Last 7d" /></option>
                            <option value="30d"><TranslatedText text="Last 30d" /></option>
                            <option value="90d"><TranslatedText text="Last 90d" /></option>
                          </select>
                          <button
                            onClick={() => handleExportData('csv')}
                            className="p-1.5 text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
                            title={tSync('Export Data')}
                          >
                            <Download className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      <div className="h-52 relative">
                        {(!data.trends.revenue || data.trends.revenue.length === 0) ? (
                          <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
                            <div className="w-9 h-9 bg-slate-50 dark:bg-slate-800 rounded-xl flex items-center justify-center mb-2.5 border border-slate-100 dark:border-slate-700">
                              <Download className="w-4 h-4 text-slate-300" />
                            </div>
                            <p className="ui-body-small">
                              <TranslatedText text="No revenue data yet" />
                            </p>
                            <p className="ui-caption text-slate-400 mt-1">
                              <TranslatedText text="Complete trips to see revenue trends" />
                            </p>
                          </div>
                        ) : (
                          <Line data={revenueData} options={chartOptions} />
                        )}
                      </div>
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.12 }}
                      className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm p-5"
                    >
                      <div className="flex items-start justify-between gap-3 mb-5">
                        <div>
                          <p className="ui-label mb-0.5">
                            <TranslatedText text="Fleet" />
                          </p>
                          <h3 className="ui-card-title">
                            <TranslatedText text="Utilization" />
                          </h3>
                        </div>
                        <div className="px-2.5 py-1 bg-primary-50 dark:bg-primary-900/20 rounded-lg border border-primary-100 dark:border-primary-900/40">
                          <span className="ui-label mb-0 text-primary-700 dark:text-primary-400">
                            <TranslatedText text="Avg" /> {data.metrics.averageLoadUtilization}%
                          </span>
                        </div>
                      </div>
                      <div className="h-52 relative">
                        {(!data.trends.fleetUtilization || data.trends.fleetUtilization.length === 0) ? (
                          <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
                            <div className="w-9 h-9 bg-slate-50 dark:bg-slate-800 rounded-xl flex items-center justify-center mb-2.5 border border-slate-100 dark:border-slate-700">
                              <Activity className="w-4 h-4 text-slate-300" />
                            </div>
                            <p className="ui-body-small">
                              <TranslatedText text="No fleet data yet" />
                            </p>
                            <p className="ui-caption text-slate-400 mt-1">
                              <TranslatedText text="Assign trucks to trips to see utilization" />
                            </p>
                          </div>
                        ) : (
                          <Line data={fleetUtilizationData} options={chartOptions} />
                        )}
                      </div>
                    </motion.div>
                  </div>

                  <RoutePerformance tenantId={tenantId} />
                </div>

                <div className="xl:col-span-4 flex flex-col gap-4 lg:gap-5">
                  <RecentActivity
                    activities={data.activity}
                    onTrackEvent={handleTrackEvent}
                    maxItems={6}
                    className="h-full min-h-[28rem] xl:min-h-0"
                  />
                  <TruckOwnerPerformance tenantId={tenantId} compact />
                </div>
              </section>
            </motion.div>
          )}

          {!isLoading && selectedView === 'fleet' && (
            <motion.div key="fleet" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <FleetOverview tenantId={tenantId} />
            </motion.div>
          )}

          {!isLoading && selectedView === 'drivers' && (
            <motion.div key="drivers" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <FleetOverview tenantId={tenantId} />
            </motion.div>
          )}

          {!isLoading && selectedView === 'cargo' && (
            <motion.div key="cargo" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <CargoAnalytics tenantId={tenantId} />
            </motion.div>
          )}

          {!isLoading && selectedView === 'financial' && (
            <motion.div key="financial" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <FinancialMetrics tenantId={tenantId} />
            </motion.div>
          )}

          {!isLoading && selectedView === 'operations' && (
            <motion.div key="operations" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <OperationalInsights />
            </motion.div>
          )}

          {!isLoading && selectedView === 'users' && tenantId && (
            <motion.div key="users" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <TenantUserManagement tenantId={tenantId} />
            </motion.div>
          )}

          {!isLoading && selectedView === 'truck-owners' && (
            <motion.div key="truck-owners" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <TruckOwnerBilling />
            </motion.div>
          )}

          {!isLoading && selectedView === 'trips' && tenantId && (
            <motion.div key="trips" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <ActiveTrips 
                tenantId={tenantId} 
                onTrackTrip={handleTrackEvent}
              />
            </motion.div>
          )}

          {!isLoading && selectedView === 'settings' && tenantId && (
            <motion.div key="settings" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <TenantSettings tenantId={tenantId} />
            </motion.div>
          )}

          {!isLoading && selectedView === 'profile' && (
            <motion.div key="profile" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <Profile />
            </motion.div>
          )}

          {!isLoading && selectedView === 'bidding' && tenantId && (
            <motion.div key="bidding" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <TenantBidding tenantId={tenantId} />
            </motion.div>
          )}

          {!isLoading && selectedView === 'purchase-credits' && (
            <motion.div key="purchase-credits" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <PurchaseCredits />
            </motion.div>
          )}

          {!isLoading && selectedView === 'lenders' && (
            <motion.div key="lenders" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <TenantLenderManagementPage />
            </motion.div>
          )}

          {!isLoading && selectedView === 'billing' && (
            <motion.div key="billing" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <BillingDashboard />
            </motion.div>
          )}

          {!isLoading && selectedView === 'subscription-plans' && (
            <motion.div key="subscription-plans" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="w-full min-w-0 overflow-x-hidden">
              <SubscriptionPlans />
            </motion.div>
          )}

          {!isLoading && selectedView === 'communicate' && (
            <motion.div key="communicate" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <TenantCommunication />
            </motion.div>
          )}

          {!isLoading && selectedView === 'kyc' && (
            <motion.div key="kyc" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <KycManagementPage />
            </motion.div>
          )}

          {!isLoading && selectedView === 'reports' && (
            <motion.div key="reports" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <TenantSupportCenter />
            </motion.div>
          )}
        </AnimatePresence>
      </PageContainer>

      {/* Track Event Modal — Enlite Prime Style */}
      <Dialog open={isTrackModalOpen} onOpenChange={setIsTrackModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden p-0 rounded-[32px] border-none shadow-2xl bg-white dark:bg-slate-950 flex flex-col">
          {(() => {
            const theme = getStatusTheme(trackingActivity?.status);
            const TypeIcon = getTypeIcon(trackingActivity?.type);
            const StatusIcon = theme.icon;

            return (
              <>
                <DialogHeader className={`p-10 ${theme.bg} relative overflow-hidden shrink-0`}>
                  {/* Decorative Elements */}
                  <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl" />
                  <div className="absolute bottom-0 left-0 w-32 h-32 bg-black/5 rounded-full translate-y-1/2 -translate-x-1/2 blur-xl" />
                  
                  <div className="relative z-10 flex items-center justify-between">
                    <div className="flex items-center gap-6">
                      <div className="p-4 bg-white/20 backdrop-blur-md rounded-[24px] shadow-lg border border-white/20">
                        <TypeIcon size={32} className="text-white" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="px-2.5 py-0.5 bg-white/20 backdrop-blur-md rounded-full ui-badge text-white border border-white/20">
                           <TranslatedText text={trackingActivity?.type} />
                          </span>
                          <span className="text-white/60 ui-badge">•</span>
                          <span className="flex items-center gap-1.5 text-white ui-badge">
                            <StatusIcon size={12} />
                            <TranslatedText text={trackingActivity?.status} />
                          </span>
                        </div>
                        <DialogTitle className="ui-page-title text-white">
                          <TranslatedText text={trackingActivity?.action} />
                        </DialogTitle>
                        <p className="text-white/80 ui-body mt-1">
                          <TranslatedText text="Reference" />: <TranslatedText text={trackingActivity?.description} />
                        </p>
                      </div>
                    </div>
                  </div>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto bg-gray-50/50 dark:bg-slate-900/50 p-10 custom-scrollbar">
                  {trackingActivity?.metadata?.tripId ? (
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-white dark:bg-slate-900 rounded-[28px] border border-gray-100 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none overflow-hidden"
                    >
                      <TripTracker tripId={trackingActivity.metadata.tripId} />
                    </motion.div>
                  ) : (
                    <div className="space-y-8">
                      <div className="bg-white dark:bg-slate-900 rounded-[28px] border border-gray-100 dark:border-slate-800 shadow-sm p-12 text-center relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-8">
                          <Activity className="text-slate-50 dark:text-slate-800 w-32 h-32" />
                        </div>
                        <div className="relative z-10">
                          <div className={`w-24 h-24 ${theme.lightBg} dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6`}>
                            <StatusIcon className={`w-12 h-12 ${theme.text}`} />
                          </div>
                          <h3 className="ui-page-title mb-3"><TranslatedText text="Activity Details" /></h3>
                          <p className="ui-body text-slate-500 dark:text-slate-400 max-w-sm mx-auto mb-10">
                            <TranslatedText text="We're showing the state of this activity at the time it happened." />
                          </p>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {[
                              { label: 'Category', value: trackingActivity?.type, icon: TypeIcon },
                              { label: 'Current Status', value: trackingActivity?.status, icon: StatusIcon },
                              { label: 'Time', value: trackingActivity?.timestamp, icon: Clock },
                            ].map((item, id) => (
                              <div key={id} className="p-6 bg-slate-50/80 dark:bg-slate-800/50 rounded-[20px] border border-white dark:border-slate-700 flex flex-col items-center text-center group hover:bg-white dark:hover:bg-slate-800 hover:shadow-md transition-all duration-300">
                                <item.icon className="w-5 h-5 text-slate-400 dark:text-slate-500 mb-3 group-hover:scale-110 transition-transform" />
                                <span className="ui-label mb-1"><TranslatedText text={item.label} /></span>
                                <span className="ui-table-body uppercase"><TranslatedText text={item.value} /></span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between px-6 py-4 bg-primary-600 rounded-[20px] text-white">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-white/10 rounded-lg">
                            <MapPin size={18} />
                          </div>
                          <p className="ui-body text-white"><TranslatedText text="Need more details about this event?" /></p>
                        </div>
                        <button className="px-4 py-2 bg-white dark:bg-slate-900 text-primary-600 rounded-xl ui-button hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-lg">
                          <TranslatedText text="Request Full History" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="px-10 py-6 bg-white dark:bg-slate-950 border-t border-gray-50 dark:border-slate-800 flex items-center justify-between shrink-0">
                   <div className="flex items-center gap-2 text-slate-400 dark:text-slate-500">
                      <Clock size={14} />
                      <span className="ui-label mb-0 leading-none mt-0.5"><TranslatedText text="Logged" />: <TranslatedText text={trackingActivity?.timestamp} /></span>
                   </div>
                   <button 
                     onClick={() => setIsTrackModalOpen(false)}
                     className="px-8 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-[18px] ui-button transition-all shadow-inner dark:shadow-none"
                   >
                     <TranslatedText text="Close" />
                   </button>
                </div>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div >
  );
};

export default TenantDashboard;
