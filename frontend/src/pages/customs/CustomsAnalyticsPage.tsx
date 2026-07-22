import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BarChart3 } from 'lucide-react';
import { customsApi } from '../../services/customsApi';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts';
import { cn } from '../../utils/cn';

const BRAND = '#2c5173';

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

const CustomsAnalyticsPage: React.FC = () => {
  const [days, setDays] = useState(30);

  const { data, isLoading } = useQuery({
    queryKey: ['customs-analytics-full', days],
    queryFn: () => customsApi.getAnalytics(days),
    refetchInterval: 60000,
  });

  const analytics = data?.data?.data || {};
  const byStatus: any[] = (analytics.byStatus || []).map((s: any) => ({
    name: s.status?.replace(/_/g, ' '),
    value: s.count,
    fill: statusColors[s.status] || '#94a3b8',
  })).filter((s: any) => s.value > 0);

  const byRisk: any[] = (analytics.byRisk || []).map((r: any) => ({
    name: r.risk,
    value: r.count,
    fill: riskColors[r.risk] || '#94a3b8',
  })).filter((r: any) => r.value > 0);

  return (
    <div className="space-y-6 p-6 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: BRAND }}>
            <BarChart3 size={16} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900 dark:text-white">Customs Analytics</h1>
            <p className="text-xs text-slate-400">Inspection trends and performance metrics</p>
          </div>
        </div>
        <div className="flex gap-2">
          {[7, 14, 30, 90].map(d => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={cn(
                'px-3 py-1.5 rounded-xl text-xs font-bold transition-all',
                days === d ? 'text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200',
              )}
              style={days === d ? { background: BRAND } : {}}
            >
              {d}d
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4 animate-pulse">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="h-64 bg-slate-100 dark:bg-slate-800 rounded-2xl" />
            <div className="h-64 bg-slate-100 dark:bg-slate-800 rounded-2xl" />
          </div>
        </div>
      ) : (
        <>
          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Status Bar Chart */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-6">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4">Inspections by Status</h3>
              {byStatus.length === 0 ? (
                <div className="flex items-center justify-center h-48 text-slate-400 text-sm">No data</div>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={byStatus}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="name" tick={{ fontSize: 9, fontWeight: 700 }} />
                    <YAxis tick={{ fontSize: 9 }} />
                    <Tooltip />
                    <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                      {byStatus.map((entry: any, i: number) => <Cell key={i} fill={entry.fill} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Risk Pie Chart */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-6">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4">Risk Level Breakdown</h3>
              {byRisk.length === 0 ? (
                <div className="flex items-center justify-center h-48 text-slate-400 text-sm">No data</div>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={byRisk} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={4}>
                      {byRisk.map((entry: any, i: number) => <Cell key={i} fill={entry.fill} />)}
                    </Pie>
                    <Tooltip />
                    <Legend iconSize={10} formatter={(v: string) => <span style={{ fontSize: 10, fontWeight: 700 }}>{v}</span>} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Summary text */}
          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700 p-5">
            <p className="text-sm font-black text-slate-700 dark:text-white mb-1">Period Summary — Last {days} days</p>
            <p className="text-xs text-slate-500">
              {analytics.total ?? 0} inspections processed · {analytics.clearanceRate ?? 0}% clearance rate ·{' '}
              {(analytics.byStatus || []).find((s: any) => s.status === 'HIGH_RISK')?.count ?? 0} flagged as high risk
            </p>
          </div>
        </>
      )}
    </div>
  );
};

export default CustomsAnalyticsPage;
