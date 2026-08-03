import React, { useState, useMemo } from 'react';
import {
  Activity, AlertTriangle, CheckCircle, Clock,
  Users, Server, Database, Cpu,
  RefreshCw, Bell,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { TranslatedText } from '../../components/translated-text';
import AdminPageLayout from '../../components/Admin/AdminPageLayout';
import ModernLoader from '../../components/common/ModernLoader';
import { adminAPI } from '../../services/adminApi';
import { StandardDataTable, StatusBadge, type Column } from '../../components/EnliteUI/Tables';

// ── helpers ────────────────────────────────────────────────────────────────────

const statusColor = (s: string) => {
  if (['healthy', 'connected', 'operational', 'ok', 'success'].includes(s?.toLowerCase()))
    return { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200', dot: 'bg-green-500' };
  if (['warning', 'degraded'].includes(s?.toLowerCase()))
    return { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', dot: 'bg-amber-500' };
  return { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', dot: 'bg-red-500' };
};

const fmtBytes = (mb: number) => (mb >= 1024 ? `${(mb / 1024).toFixed(1)} GB` : `${mb} MB`);
const fmtUptime = (s: number) => {
  const d = Math.floor(s / 86400), h = Math.floor((s % 86400) / 3600), m = Math.floor((s % 3600) / 60);
  return [d && `${d}d`, h && `${h}h`, `${m}m`].filter(Boolean).join(' ');
};
const fmtNum = (n: number) => n?.toLocaleString() ?? '—';

// ── service row ────────────────────────────────────────────────────────────────
const ServiceRow: React.FC<{ label: string; status: string; detail?: string }> = ({ label, status, detail }) => {
  const c = statusColor(status);
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0">
      <div className="flex items-center gap-2.5">
        <span className={`w-2 h-2 rounded-full ${c.dot}`} />
        <span className="text-sm font-medium text-gray-700">{label}</span>
      </div>
      <div className="flex items-center gap-2">
        {detail && <span className="text-xs text-gray-400">{detail}</span>}
        <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase border ${c.bg} ${c.text} ${c.border}`}>{status}</span>
      </div>
    </div>
  );
};

// ── progress bar ───────────────────────────────────────────────────────────────
const ProgressBar: React.FC<{ label: string; value: number; max?: number; color?: string }> = ({
  label, value, max = 100, color = 'bg-[#2c5173]',
}) => {
  const pct = Math.min(Math.round((value / max) * 100), 100);
  const barColor = pct > 80 ? 'bg-red-500' : pct > 60 ? 'bg-amber-500' : color;
  return (
    <div>
      <div className="flex justify-between mb-1">
        <span className="text-xs font-medium text-gray-600">{label}</span>
        <span className="text-xs font-bold text-gray-900">{pct}%</span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${barColor}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
};

// ── main component ─────────────────────────────────────────────────────────────
const MonitoringDashboard: React.FC = () => {
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [logPage, setLogPage]         = useState(1);
  const INTERVAL = 30_000;

  // ── queries ────────────────────────────────────────────────────────────────
  const healthQ = useQuery({
    queryKey: ['mon-health'],
    queryFn: () => adminAPI.getSystemHealth().then(r => r.data),
    refetchInterval: autoRefresh ? INTERVAL : false,
    retry: 1,
  });

  const metricsQ = useQuery({
    queryKey: ['mon-metrics'],
    queryFn: () => adminAPI.getPerformanceMetrics().then(r => r.data),
    refetchInterval: autoRefresh ? INTERVAL : false,
    retry: 1,
  });

  const userActivityQ = useQuery({
    queryKey: ['mon-user-activity'],
    queryFn: () => adminAPI.getUserActivityMetrics().then(r => r.data),
    refetchInterval: autoRefresh ? INTERVAL : false,
    retry: 1,
  });

  const dbStatsQ = useQuery({
    queryKey: ['mon-db-stats'],
    queryFn: () => adminAPI.getDatabaseStats().then(r => r.data),
    refetchInterval: autoRefresh ? INTERVAL * 2 : false,
    retry: 1,
  });

  const vitalsQ = useQuery({
    queryKey: ['mon-vitals'],
    queryFn: () => adminAPI.getSystemVitals().then(r => r.data),
    refetchInterval: autoRefresh ? INTERVAL : false,
    retry: 1,
  });

  const logsQ = useQuery({
    queryKey: ['mon-audit-logs', logPage],
    queryFn: () => adminAPI.getMonitoringAuditLogs({ page: logPage, limit: 15 }).then(r => r.data),
    refetchInterval: autoRefresh ? INTERVAL : false,
    retry: 1,
  });

  const refetchAll = () => {
    healthQ.refetch(); metricsQ.refetch(); userActivityQ.refetch();
    dbStatsQ.refetch(); vitalsQ.refetch(); logsQ.refetch();
  };

  // ── derived data ───────────────────────────────────────────────────────────
  const health   = healthQ.data;
  const metrics  = metricsQ.data;
  const activity = userActivityQ.data;
  const db       = dbStatsQ.data;
  const vitals   = vitalsQ.data;
  const logs     = logsQ.data?.data ?? [];
  const logsPagination = logsQ.data?.pagination;

  const overallStatus = health?.status ?? 'unknown';
  const c = statusColor(overallStatus);

  const memPct  = health?.resources?.memory?.system?.usagePercent ?? 0;
  const heapPct = metrics ? Math.round((metrics.memory?.heapUsed / metrics.memory?.heapTotal) * 100) : 0;

  // Filter logs client-side by search is handled by StandardDataTable
  const auditColumns: Column<any>[] = useMemo(() => [
    {
      key: 'created_at',
      label: 'Time',
      alwaysVisible: true,
      render: (_v, log) => (
        <div className="flex items-center gap-1.5 text-xs text-gray-500">
          <Clock size={11} className="text-gray-300" />
          {new Date(log.created_at).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
        </div>
      ),
    },
    {
      key: 'user_email',
      label: 'User',
      render: (_v, log) => (
        <span className="text-xs text-gray-700 whitespace-nowrap">
          {log.user_email ?? log.admin_email ?? log.user_id?.slice(0, 12) ?? 'System'}
        </span>
      ),
    },
    {
      key: 'action',
      label: 'Action',
      render: (_v, log) => (
        <StatusBadge
          variant={log.action === 'GRANT' ? 'success' : log.action === 'REVOKE' ? 'error' : 'neutral'}
          label={log.action ?? '—'}
        />
      ),
    },
    {
      key: 'permission',
      label: 'Permission',
      render: (v) => <span className="text-xs font-mono text-gray-500 max-w-[180px] truncate block">{v ?? '—'}</span>,
    },
    {
      key: 'reason',
      label: 'Reason',
      render: (v) => <span className="text-xs text-gray-500 max-w-[200px] truncate block">{v ?? '—'}</span>,
    },
  ], []);

  if (healthQ.isLoading && !health) {
    return (
      <AdminPageLayout
        title={<TranslatedText text="Network Monitoring" />}
        description={<TranslatedText text="Real-time system health and activity monitoring" />}
      >
        <ModernLoader isLoading type="page" />
      </AdminPageLayout>
    );
  }

  return (
    <AdminPageLayout
      title={<TranslatedText text="Network Monitoring" />}
      description={<TranslatedText text="Real-time system health and activity monitoring" />}
      actions={
        <div className="flex gap-2">
          <button
            onClick={() => setAutoRefresh(v => !v)}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-bold transition-all ${
              autoRefresh ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'
            }`}
          >
            <RefreshCw size={13} className={autoRefresh ? 'animate-spin' : ''} />
            <span className="hidden sm:inline">{autoRefresh ? 'Live' : 'Paused'}</span>
          </button>
          <button
            onClick={refetchAll}
            className="flex items-center gap-2 px-3 py-2 bg-[#2c5173] text-white rounded-xl text-sm font-bold hover:bg-[#1e3a54]"
          >
            <RefreshCw size={13} /> Refresh Now
          </button>
        </div>
      }
    >
      <div className="safe-bottom space-y-5">

        {/* ── Overall Status Banner ─────────────────────────────────────── */}
        <div className={`flex items-center gap-4 p-4 rounded-2xl border ${c.bg} ${c.border}`}>
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${c.bg}`}>
            {overallStatus === 'healthy' || overallStatus === 'operational'
              ? <CheckCircle className={`w-5 h-5 ${c.text}`} />
              : <AlertTriangle className={`w-5 h-5 ${c.text}`} />}
          </div>
          <div className="flex-1 min-w-0">
            <p className={`text-sm font-black uppercase tracking-widest ${c.text}`}>
              System {overallStatus}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">
              Uptime: <span className="font-bold text-gray-700">
                {health?.uptime?.formatted ?? fmtUptime(Math.round(vitals?.system?.uptime ?? 0))}
              </span>
              {health?.services?.database?.responseTime && (
                <> &nbsp;·&nbsp; DB response: <span className="font-bold text-gray-700">{health.services.database.responseTime}</span></>
              )}
              {health?.platform?.nodeVersion && (
                <> &nbsp;·&nbsp; Node {health.platform.nodeVersion}</>
              )}
            </p>
          </div>
          <div className="text-[10px] text-gray-400 whitespace-nowrap hidden sm:block">
            {health?.timestamp ? new Date(health.timestamp).toLocaleTimeString() : '—'}
          </div>
        </div>

        {/* ── Services + Resources row ──────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Services */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-2">
              <Server size={13} /> Services
            </h3>
            <ServiceRow
              label="Database"
              status={health?.services?.database?.status ?? vitals?.database?.status ?? 'unknown'}
              detail={health?.services?.database?.responseTime}
            />
            <ServiceRow
              label="API Server"
              status={health?.services?.api?.status ?? 'healthy'}
              detail={health?.uptime?.formatted ? `up ${health.uptime.formatted}` : undefined}
            />
            <ServiceRow
              label="SSL / Security"
              status={vitals?.security?.sslActive ? 'healthy' : 'warning'}
              detail={vitals?.security?.threatLevel ? `Threat: ${vitals.security.threatLevel}` : undefined}
            />
            <ServiceRow
              label="Node Harmony"
              status={vitals?.security?.nodeHarmony >= 95 ? 'healthy' : vitals?.security?.nodeHarmony >= 80 ? 'warning' : 'critical'}
              detail={vitals?.security?.nodeHarmony != null ? `${vitals.security.nodeHarmony}%` : undefined}
            />
          </div>

          {/* Memory & CPU */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <Cpu size={13} /> Resources
            </h3>
            <ProgressBar label="System Memory" value={memPct} />
            <ProgressBar label="Heap Used" value={heapPct} color="bg-purple-500" />
            {health?.resources?.memory?.system && (
              <div className="grid grid-cols-3 gap-2 pt-1">
                {(['total', 'used', 'free'] as const).map(k => (
                  <div key={k} className="text-center bg-gray-50 rounded-xl p-2 border border-gray-100">
                    <p className="text-sm font-black text-gray-800">{health.resources.memory.system[k]} GB</p>
                    <p className="text-[10px] text-slate-400 capitalize">{k}</p>
                  </div>
                ))}
              </div>
            )}
            {health?.resources?.cpu && (
              <div className="text-xs text-gray-500">
                <span className="font-bold text-gray-700">{health.resources.cpu.cores}</span> cores
                &nbsp;·&nbsp; Load: <span className="font-bold text-gray-700">{health.resources.cpu.loadAverage?.[0]}</span>
              </div>
            )}
          </div>

          {/* Database stats */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-3">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <Database size={13} /> Database
            </h3>
            {db ? (
              <>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: 'Size', value: db.database?.size ?? '—' },
                    { label: 'Active', value: db.connections?.active ?? '—' },
                    { label: 'Idle', value: db.connections?.idle ?? '—' },
                  ].map(item => (
                    <div key={item.label} className="text-center bg-gray-50 rounded-xl p-2 border border-gray-100">
                      <p className="text-sm font-black text-gray-800">{item.value}</p>
                      <p className="text-[10px] text-slate-400">{item.label}</p>
                    </div>
                  ))}
                </div>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {(db.tables ?? []).slice(0, 8).map((t: any) => (
                    <div key={t.table} className="flex justify-between text-xs py-0.5">
                      <span className="text-gray-600 font-mono truncate max-w-[140px]">{t.table}</span>
                      <span className="text-gray-400 flex-shrink-0">{t.size}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p className="text-xs text-gray-400">{dbStatsQ.isLoading ? 'Loading…' : 'No data'}</p>
            )}
          </div>
        </div>

        {/* ── User activity by role ─────────────────────────────────────── */}
        {activity && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Users by role */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-2">
                <Users size={13} /> Users by Role
              </h3>
              <div className="space-y-2">
                {(activity.usersByRole ?? []).map((r: any) => (
                  <div key={r.role} className="flex items-center gap-3">
                    <span className="text-xs font-mono text-gray-500 w-36 truncate">{r.role.replace(/_/g, ' ')}</span>
                    <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#2c5173] rounded-full"
                        style={{ width: `${Math.min((r.count / (activity.usersByRole[0]?.count || 1)) * 100, 100)}%` }}
                      />
                    </div>
                    <span className="text-xs font-bold text-gray-700 w-8 text-right">{r.count}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Users by status + new signups */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-2">
                <Activity size={13} /> User Status &amp; Growth
              </h3>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div className="bg-gray-50 rounded-xl p-3 border border-gray-100 text-center">
                  <p className="text-xl font-black text-gray-900">{fmtNum(activity.activeUsers?.last7d)}</p>
                  <p className="text-[10px] text-slate-400 uppercase tracking-widest">Active 7d</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3 border border-gray-100 text-center">
                  <p className="text-xl font-black text-gray-900">{fmtNum(activity.newUsers?.last30d)}</p>
                  <p className="text-[10px] text-slate-400 uppercase tracking-widest">New 30d</p>
                </div>
              </div>
              <div className="space-y-1.5">
                {(activity.usersByStatus ?? []).map((s: any) => {
                  const col = statusColor(s.status === 'ACTIVE' ? 'healthy' : s.status === 'SUSPENDED' ? 'critical' : 'warning');
                  return (
                    <div key={s.status} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${col.dot}`} />
                        <span className="text-xs text-gray-600">{s.status}</span>
                      </div>
                      <span className="text-xs font-bold text-gray-800">{fmtNum(s.count)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ── Audit Logs ────────────────────────────────────────────────── */}
        <StandardDataTable
          title={<TranslatedText text="Audit Logs" />}
          subtitle={logsPagination ? `${fmtNum(logsPagination.total)} total` : undefined}
          icon={<Bell size={15} />}
          headerColor="primary"
          columns={auditColumns}
          data={logs}
          loading={logsQ.isLoading}
          getRowId={(row) => row.id}
          searchPlaceholder="Filter by action, user, permission…"
          searchKeys={['action', 'user_email', 'admin_email', 'permission', 'reason']}
          pagination
          pageSize={15}
          totalItems={logsPagination?.total}
          page={logPage}
          onPageChange={setLogPage}
          emptyMessage="No audit logs found"
          stickyHeader
          columnVisibility
          ariaLabel="Audit logs"
        />
      </div>
    </AdminPageLayout>
  );
};

export default MonitoringDashboard;
