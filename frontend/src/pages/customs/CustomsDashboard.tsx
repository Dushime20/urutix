import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  ShieldCheck, AlertTriangle, Clock, CheckCircle, XCircle,
  TrendingUp, Search, FileText, Flag, Archive, Activity,
  MapPin, BarChart3, Eye, Plus,
} from 'lucide-react';
import { customsApi } from '../../services/customsApi';
import { cn } from '../../utils/cn';
import { StatCard as SharedStatCard } from '@/components/EnliteUI/Cards/StatCard';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

const BRAND = '#345E85';

const statusColors: Record<string, string> = {
  PENDING:     '#f59e0b',
  IN_PROGRESS: '#3b82f6',
  CLEARED:     '#10b981',
  REJECTED:    '#ef4444',
  ON_HOLD:     '#8b5cf6',
  HIGH_RISK:   '#dc2626',
};

const riskColors: Record<string, string> = {
  LOW:      '#10b981',
  MEDIUM:   '#f59e0b',
  HIGH:     '#ef4444',
  CRITICAL: '#7f1d1d',
};

const StatCard: React.FC<{
  label: string;
  value: number | string;
  sub?: string;
  icon: React.ElementType;
  statColor?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info' | 'purple' | 'emerald';
  onClick?: () => void;
}> = ({ label, value, sub, icon: Icon, statColor, onClick }) => (
  <SharedStatCard
    title={label}
    value={value}
    icon={<Icon size={18} />}
    subtitle={sub}
    color={statColor || 'primary'}
    variant="classic"
    onClick={onClick}
  />
);

const CustomsDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ['customs-stats'],
    queryFn: () => customsApi.getDashboardStats(),
    refetchInterval: 30000,
  });

  const { data: analyticsData } = useQuery({
    queryKey: ['customs-analytics'],
    queryFn: () => customsApi.getAnalytics(30),
    refetchInterval: 60000,
  });

  const { data: recentData } = useQuery({
    queryKey: ['customs-recent'],
    queryFn: () => customsApi.getInspections({ limit: 6 }),
    refetchInterval: 30000,
  });

  const stats = statsData?.data?.data || {};
  const analytics = analyticsData?.data?.data || {};
  const recent: any[] = recentData?.data?.data || [];

  const statCards = [
    { label: 'Total Inspections', value: stats.totalInspections ?? 0, sub: 'All time', icon: ShieldCheck, statColor: 'primary' as const },
    { label: 'Pending', value: stats.pending ?? 0, sub: 'Awaiting inspection', icon: Clock, statColor: 'primary' as const },
    { label: 'Cleared Today', value: stats.clearedToday ?? 0, sub: 'Today', icon: CheckCircle, statColor: 'primary' as const },
    { label: 'Rejected', value: stats.rejected ?? 0, sub: 'All time', icon: XCircle, statColor: 'primary' as const },
    { label: 'Flagged / High Risk', value: (stats.flagged ?? 0) + (stats.highRisk ?? 0), sub: 'Require attention', icon: Flag, statColor: 'primary' as const },
    { label: 'On Hold', value: stats.onHold ?? 0, sub: 'Under investigation', icon: AlertTriangle, statColor: 'primary' as const },
    { label: 'Cleared Total', value: stats.cleared ?? 0, sub: 'All time', icon: Archive, statColor: 'primary' as const },
    { label: 'Clearance Rate', value: `${analytics.clearanceRate ?? 0}%`, sub: 'Last 30 days', icon: TrendingUp, statColor: 'primary' as const },
  ];

  const pieData = (analytics.byStatus || []).filter((s: any) => s.count > 0).map((s: any) => ({
    name: s.status, value: s.count, fill: statusColors[s.status] || '#94a3b8',
  }));

  const riskPieData = (analytics.byRisk || []).filter((r: any) => r.count > 0).map((r: any) => ({
    name: r.risk, value: r.count, fill: riskColors[r.risk] || '#94a3b8',
  }));

  const quickLinks = [
    { label: 'Search Truck', icon: Search, path: '/dashboard/customs/search', color: 'text-[#345E85]', bg: 'bg-blue-50 hover:bg-blue-100' },
    { label: 'New Inspection', icon: Plus, path: '/dashboard/customs/inspections/new', color: 'text-emerald-700', bg: 'bg-emerald-50 hover:bg-emerald-100' },
    { label: 'All Inspections', icon: ShieldCheck, path: '/dashboard/customs/inspections', color: 'text-slate-700', bg: 'bg-slate-50 hover:bg-slate-100' },
    { label: 'Flagged Cargo', icon: Flag, path: '/dashboard/customs/flagged', color: 'text-rose-700', bg: 'bg-rose-50 hover:bg-rose-100' },
    { label: 'Reports', icon: FileText, path: '/dashboard/customs/reports', color: 'text-violet-700', bg: 'bg-violet-50 hover:bg-violet-100' },
    { label: 'Audit Logs', icon: Activity, path: '/dashboard/customs/audit', color: 'text-amber-700', bg: 'bg-amber-50 hover:bg-amber-100' },
    { label: 'Checkpoints', icon: MapPin, path: '/dashboard/customs/checkpoints', color: 'text-teal-700', bg: 'bg-teal-50 hover:bg-teal-100' },
    { label: 'Analytics', icon: BarChart3, path: '/dashboard/customs/analytics', color: 'text-indigo-700', bg: 'bg-indigo-50 hover:bg-indigo-100' },
  ];

  const statusBadge: Record<string, string> = {
    PENDING:     'bg-amber-100 text-amber-700',
    IN_PROGRESS: 'bg-blue-100 text-blue-700',
    CLEARED:     'bg-emerald-100 text-emerald-700',
    REJECTED:    'bg-rose-100 text-rose-700',
    ON_HOLD:     'bg-purple-100 text-purple-700',
    HIGH_RISK:   'bg-red-100 text-red-700',
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/dashboard/customs/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <div className="space-y-8 p-6 max-w-[1600px] mx-auto">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: BRAND }}>
              <ShieldCheck size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Customs Officer Portal</h1>
              <p className="text-xs text-slate-400 font-medium">Cargo inspection & clearance management</p>
            </div>
          </div>
        </div>

        {/* Quick Search */}
        <form onSubmit={handleSearch} className="flex gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search plate, shipment ref, container..."
              className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#345E85]/30"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2.5 rounded-xl text-white text-sm font-bold transition-opacity hover:opacity-90"
            style={{ background: BRAND }}
          >
            Search
          </button>
        </form>
      </div>

      {/* KPI Cards */}
      {statsLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-slate-100 dark:bg-slate-800 rounded-2xl h-28 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 gap-4">
          {statCards.map(card => (
            <StatCard key={card.label} {...card} />
          ))}
        </div>
      )}

      {/* Quick Links */}
      <div>
        <h2 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-3">Quick Actions</h2>
        <div className="grid grid-cols-4 sm:grid-cols-8 gap-3">
          {quickLinks.map(({ label, icon: Icon, path, color, bg }) => (
            <button
              key={label}
              onClick={() => navigate(path)}
              className={cn(
                'flex flex-col items-center gap-2 p-4 rounded-2xl border border-transparent transition-all hover:border-slate-200 hover:shadow-sm',
                bg,
              )}
            >
              <Icon size={20} className={color} />
              <span className={cn('text-[10px] font-black uppercase tracking-wide text-center leading-tight', color)}>{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Status Distribution */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-6">
          <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider mb-4">Status Distribution</h3>
          {pieData.length === 0 ? (
            <div className="flex items-center justify-center h-40 text-slate-400 text-sm">No data yet</div>
          ) : (
            <div className="flex items-center gap-6">
              <ResponsiveContainer width={160} height={160}>
                <PieChart>
                  <Pie data={pieData} dataKey="value" innerRadius={45} outerRadius={75} paddingAngle={3}>
                    {pieData.map((entry: {name:string;value:number;fill:string}, i: number) => <Cell key={i} fill={entry.fill} />)}
                  </Pie>
                  <Tooltip formatter={(v: any, name: any) => [v, name]} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-2">
                {pieData.map((entry: {name:string;value:number;fill:string}) => (
                  <div key={entry.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ background: entry.fill }} />
                      <span className="text-xs font-bold text-slate-600 dark:text-slate-400 capitalize">{entry.name.replace(/_/g, ' ')}</span>
                    </div>
                    <span className="text-xs font-black text-slate-800 dark:text-white">{entry.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Risk Level Distribution */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-6">
          <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider mb-4">Risk Level Distribution</h3>
          {riskPieData.length === 0 ? (
            <div className="flex items-center justify-center h-40 text-slate-400 text-sm">No data yet</div>
          ) : (
            <div className="flex items-center gap-6">
              <ResponsiveContainer width={160} height={160}>
                <PieChart>
                  <Pie data={riskPieData} dataKey="value" innerRadius={45} outerRadius={75} paddingAngle={3}>
                    {riskPieData.map((entry: {name:string;value:number;fill:string}, i: number) => <Cell key={i} fill={entry.fill} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-2">
                {riskPieData.map((entry: {name:string;value:number;fill:string}) => (
                  <div key={entry.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ background: entry.fill }} />
                      <span className="text-xs font-bold text-slate-600 dark:text-slate-400">{entry.name}</span>
                    </div>
                    <span className="text-xs font-black text-slate-800 dark:text-white">{entry.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Recent Inspections */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">Recent Inspections</h3>
          <button
            onClick={() => navigate('/dashboard/customs/inspections')}
            className="text-xs font-bold text-[#345E85] hover:underline flex items-center gap-1"
          >
            View All <Eye size={12} />
          </button>
        </div>
        <table className="min-w-full divide-y divide-slate-50 dark:divide-slate-800">
          <thead className="bg-slate-50 dark:bg-slate-800/50">
            <tr>
              {['Plate / Ref', 'Cargo', 'Route', 'Officer', 'Status', 'Risk', 'Date'].map(h => (
                <th key={h} className="px-5 py-3 text-left text-[9px] font-black text-slate-500 uppercase tracking-widest">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
            {recent.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-sm text-slate-400 font-bold">No inspections yet</td>
              </tr>
            ) : recent.map((ins: any) => (
              <tr
                key={ins.id}
                className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors cursor-pointer"
                onClick={() => navigate(`/dashboard/customs/inspections/${ins.id}`)}
              >
                <td className="px-5 py-4">
                  <p className="text-sm font-bold text-slate-800 dark:text-white">{ins.plateNumber || '—'}</p>
                  <p className="text-[10px] text-slate-400 font-mono">{ins.shipmentReference || ins.containerNumber || '—'}</p>
                </td>
                <td className="px-5 py-4 text-xs text-slate-600 dark:text-slate-300">{ins.cargoType || '—'}</td>
                <td className="px-5 py-4 text-xs text-slate-600 dark:text-slate-300">
                  {ins.originCountry && ins.destinationCountry
                    ? `${ins.originCountry} → ${ins.destinationCountry}`
                    : ins.originCountry || ins.destinationCountry || '—'}
                </td>
                <td className="px-5 py-4 text-xs text-slate-500">{ins.officer?.email?.split('@')[0] || '—'}</td>
                <td className="px-5 py-4">
                  <span className={cn('text-[9px] font-black px-2 py-0.5 rounded-lg uppercase tracking-wide', statusBadge[ins.status] || 'bg-slate-100 text-slate-600')}>
                    {ins.status?.replace(/_/g, ' ')}
                  </span>
                </td>
                <td className="px-5 py-4">
                  <span className={cn('text-[9px] font-bold px-2 py-0.5 rounded-lg uppercase', {
                    'bg-emerald-100 text-emerald-700': ins.riskLevel === 'LOW',
                    'bg-amber-100 text-amber-700': ins.riskLevel === 'MEDIUM',
                    'bg-rose-100 text-rose-700': ins.riskLevel === 'HIGH',
                    'bg-red-900 text-white': ins.riskLevel === 'CRITICAL',
                  })}>
                    {ins.riskLevel}
                  </span>
                </td>
                <td className="px-5 py-4 text-xs text-slate-400 whitespace-nowrap">
                  {new Date(ins.createdAt).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CustomsDashboard;
