import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { disputesAPI } from '../../services/api';
import type { DisputeAnalytics } from '../../types/dispute';
import { CATEGORY_LABELS, PRIORITY_LABELS, STATUS_LABELS } from '../../types/dispute';

interface Props { onBack: () => void; }

const COLORS = ['#2c5173', '#3b82f6', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];

const SupportAnalyticsDashboard: React.FC<Props> = ({ onBack }) => {
  const [period, setPeriod] = useState('month');

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['support-analytics-full', period],
    queryFn: () => disputesAPI.getAnalytics(period).then(r => r.data),
    staleTime: 60_000,
  });

  const analytics: DisputeAnalytics | null = data?.data ?? null;

  const byStatusData = analytics
    ? Object.entries(analytics.byStatus).map(([k, v]) => ({ name: STATUS_LABELS[k as any] ?? k, value: v }))
    : [];

  const byCategoryData = analytics
    ? Object.entries(analytics.byCategory)
        .sort((a, b) => (b[1] as number) - (a[1] as number))
        .slice(0, 8)
        .map(([k, v]) => ({ name: CATEGORY_LABELS[k as any] ?? k, value: v }))
    : [];

  const byPriorityData = analytics
    ? Object.entries(analytics.byPriority).map(([k, v]) => ({ name: PRIORITY_LABELS[k as any] ?? k, value: v }))
    : [];

  const monthlyData = analytics
    ? Object.entries(analytics.monthlyTrend).map(([k, v]) => ({ month: k.slice(5), tickets: v }))
    : [];

  if (isLoading) return (
    <div className="p-6 space-y-5">
      <button onClick={onBack} className="flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-gray-700"><ArrowLeft className="w-4 h-4" /> Back</button>
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-[#2c5173] border-t-transparent rounded-full animate-spin" />
      </div>
    </div>
  );

  return (
    <div className="p-4 md:p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="w-9 h-9 flex items-center justify-center rounded-xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-500 hover:text-gray-700 dark:hover:text-white">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-xl font-black text-gray-900 dark:text-white">Support Analytics</h1>
            <p className="text-xs text-gray-400">Real-time support performance metrics</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <select value={period} onChange={e => setPeriod(e.target.value)}
            className="px-3 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-xs font-bold text-gray-600 dark:text-slate-300 focus:ring-2 focus:ring-[#2c5173]">
            <option value="day">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="year">This Year</option>
          </select>
          <button onClick={() => refetch()} className="w-9 h-9 flex items-center justify-center rounded-xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-500">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {analytics && (
        <>
          {/* Charts row 1 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Monthly trend */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-5">
              <h3 className="text-sm font-black text-gray-900 dark:text-white mb-4">Monthly Ticket Trend</h3>
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12 }} />
                  <Line type="monotone" dataKey="tickets" stroke="#2c5173" strokeWidth={2} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* By Category */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-5">
              <h3 className="text-sm font-black text-gray-900 dark:text-white mb-4">Top Report Categories</h3>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={byCategoryData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 9 }} width={100} />
                  <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12 }} />
                  <Bar dataKey="value" fill="#2c5173" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Charts row 2 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* By Status */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-5">
              <h3 className="text-sm font-black text-gray-900 dark:text-white mb-4">Tickets by Status</h3>
              <div className="flex items-center gap-4">
                <ResponsiveContainer width="50%" height={160}>
                  <PieChart>
                    <Pie data={byStatusData} cx="50%" cy="50%" innerRadius={40} outerRadius={65} dataKey="value">
                      {byStatusData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex-1 space-y-1.5">
                  {byStatusData.map((item, i) => (
                    <div key={item.name} className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                        <span className="text-[11px] text-gray-600 dark:text-slate-400 truncate">{item.name}</span>
                      </div>
                      <span className="text-[11px] font-black text-gray-900 dark:text-white">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* By Priority */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-5">
              <h3 className="text-sm font-black text-gray-900 dark:text-white mb-4">Tickets by Priority</h3>
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={byPriorityData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12 }} />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                    {byPriorityData.map((entry, i) => (
                      <Cell key={i} fill={
                        entry.name === 'Critical' ? '#ef4444' :
                        entry.name === 'High'     ? '#f97316' :
                        entry.name === 'Medium'   ? '#f59e0b' : '#94a3b8'
                      } />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default SupportAnalyticsDashboard;
