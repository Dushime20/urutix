import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import {
  Bell, Search, CheckCircle, Trash2, RefreshCw, AlertTriangle,
  Clock, Filter, ChevronDown, X, Package,
  Truck, CreditCard, Settings, Shield, Activity,
} from 'lucide-react';
import toast from 'react-hot-toast';
import AdminPageLayout from '../../components/Admin/AdminPageLayout';
import { TranslatedText } from '../../components/translated-text';
import { notificationApi } from '../../services/notifications/notificationApi';
import type { Notification } from '../../services/notifications/notificationApi';
import { StandardDataTable, type Column, type TableAction } from '../../components/EnliteUI/Tables';

// ── helpers ────────────────────────────────────────────────────────────────────

const CATEGORY_CFG: Record<string, { label: string; icon: React.ReactNode; dot: string }> = {
  SYSTEM:     { label: 'System',     icon: <Settings size={13} />,    dot: 'bg-gray-500' },
  CARGO:      { label: 'Cargo',      icon: <Package size={13} />,     dot: 'bg-blue-500' },
  TRIP:       { label: 'Trip',       icon: <Truck size={13} />,       dot: 'bg-green-500' },
  FINANCIAL:  { label: 'Financial',  icon: <CreditCard size={13} />,  dot: 'bg-purple-500' },
  DRIVER:     { label: 'Driver',     icon: <Truck size={13} />,       dot: 'bg-orange-500' },
  VEHICLE:    { label: 'Vehicle',    icon: <Truck size={13} />,       dot: 'bg-red-500' },
  COMPLIANCE: { label: 'Compliance', icon: <Shield size={13} />,      dot: 'bg-yellow-500' },
  USER:       { label: 'Users',      icon: <Activity size={13} />,    dot: 'bg-indigo-500' },
  BUSINESS:   { label: 'Business',   icon: <Settings size={13} />,    dot: 'bg-slate-500' },
  LOAN:       { label: 'Loans',      icon: <CreditCard size={13} />,  dot: 'bg-emerald-500' },
  DISPUTE:    { label: 'Disputes',   icon: <AlertTriangle size={13} />, dot: 'bg-rose-500' },
};

const STATUS_CFG: Record<string, { label: string; cls: string }> = {
  PENDING:   { label: 'Pending',   cls: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
  SENT:      { label: 'Sent',      cls: 'bg-blue-50 text-blue-700 border-blue-200' },
  DELIVERED: { label: 'Delivered', cls: 'bg-green-50 text-green-700 border-green-200' },
  READ:      { label: 'Read',      cls: 'bg-gray-50 text-gray-600 border-gray-200' },
  FAILED:    { label: 'Failed',    cls: 'bg-red-50 text-red-700 border-red-200' },
  CANCELLED: { label: 'Cancelled', cls: 'bg-gray-50 text-gray-500 border-gray-200' },
};

const PRIORITY_CFG: Record<string, { label: string; cls: string }> = {
  LOW:      { label: 'Low',      cls: 'bg-gray-50 text-gray-500 border-gray-200' },
  NORMAL:   { label: 'Normal',   cls: 'bg-blue-50 text-blue-600 border-blue-200' },
  HIGH:     { label: 'High',     cls: 'bg-orange-50 text-orange-700 border-orange-200' },
  URGENT:   { label: 'Urgent',   cls: 'bg-red-50 text-red-700 border-red-200' },
  CRITICAL: { label: 'Critical', cls: 'bg-red-100 text-red-800 border-red-300' },
};

const fmtTime = (ts: string) => {
  const d = new Date(ts);
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60000);
  const hrs  = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 1)  return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  if (hrs  < 24) return `${hrs}h ago`;
  if (days < 7)  return `${days}d ago`;
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
};

// ── detail modal ───────────────────────────────────────────────────────────────
const DetailModal: React.FC<{ n: Notification; onClose: () => void }> = ({ n, onClose }) => {
  const statusCfg  = STATUS_CFG[n.status]   ?? { label: n.status,   cls: 'bg-gray-50 text-gray-600 border-gray-200' };
  const priorityCfg = PRIORITY_CFG[n.priority] ?? { label: n.priority, cls: 'bg-gray-50 text-gray-500 border-gray-200' };
  const catCfg = CATEGORY_CFG[n.category] ?? { label: n.category, icon: <Bell size={13} />, dot: 'bg-gray-400' };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-900 rounded-[24px] w-full max-w-lg border border-gray-100 dark:border-slate-800 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-[#2c5173]/10 rounded-xl flex items-center justify-center">
              <Bell className="w-4 h-4 text-[#2c5173]" />
            </div>
            <div>
              <p className="text-sm font-black text-gray-900 dark:text-white">{n.title}</p>
              <p className="text-[10px] text-gray-400 font-mono">{n.id.slice(0, 20)}…</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* badges row */}
          <div className="flex flex-wrap gap-2">
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-black border ${statusCfg.cls}`}>
              {statusCfg.label}
            </span>
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-black border ${priorityCfg.cls}`}>
              {priorityCfg.label}
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-black border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/50 text-gray-600 dark:text-slate-300">
              <span className={`w-1.5 h-1.5 rounded-full ${catCfg.dot}`} />
              {catCfg.label}
            </span>
            {n.requiresAction && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-black border border-amber-200 bg-amber-50 text-amber-700">
                <AlertTriangle size={10} /> Action Required
              </span>
            )}
          </div>

          {/* message */}
          <div className="bg-gray-50 dark:bg-slate-800/50 rounded-xl p-4 border border-gray-100 dark:border-slate-800">
            <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2">Message</p>
            <p className="text-sm text-gray-700 dark:text-slate-300 leading-relaxed">{n.message}</p>
          </div>

          {/* metadata grid */}
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: 'Type',      value: n.notificationType },
              { label: 'Channels',  value: n.channels?.join(', ') || '—' },
              { label: 'Sent',      value: n.sentAt      ? fmtTime(n.sentAt)      : '—' },
              { label: 'Delivered', value: n.deliveredAt ? fmtTime(n.deliveredAt) : '—' },
              { label: 'Read',      value: n.readAt      ? fmtTime(n.readAt)      : 'Not read' },
              { label: 'Created',   value: fmtTime(n.createdAt) },
            ].map(({ label, value }) => (
              <div key={label} className="bg-gray-50 dark:bg-slate-800/50 rounded-xl p-3 border border-gray-100 dark:border-slate-800">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-0.5">{label}</p>
                <p className="text-xs font-bold text-gray-800 truncate">{value}</p>
              </div>
            ))}
          </div>

          {n.actionUrl && (
            <a href={n.actionUrl} target="_blank" rel="noreferrer"
              className="block w-full text-center px-4 py-2.5 bg-[#2c5173] text-white rounded-xl text-sm font-bold hover:bg-[#1e3a54]">
              {n.actionText || 'Take Action'}
            </a>
          )}
        </div>
      </div>
    </div>
  );
};

// ── main component ─────────────────────────────────────────────────────────────
const AdminNotificationsHub: React.FC = () => {
  const qc = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();

  const [search,   setSearch]   = useState('');
  const [category, setCategory] = useState(searchParams.get('category') ?? '');
  const [status,   setStatus]   = useState(searchParams.get('status')   ?? '');
  const [priority, setPriority] = useState('');
  const [isRead,   setIsRead]   = useState<string>('');
  const [page,     setPage]     = useState(1);
  const [selected, setSelected] = useState<string[]>([]);
  const [detail,   setDetail]   = useState<Notification | null>(null);

  const filters = {
    ...(search   ? { search }   : {}),
    ...(category ? { category } : {}),
    ...(status   ? { status }   : {}),
    ...(priority ? { priority } : {}),
    ...(isRead !== '' ? { isRead: isRead === 'true' } : {}),
    page,
    limit: 25,
  };

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['admin-notifications', filters],
    queryFn: () => notificationApi.getNotifications(filters),
    staleTime: 30_000,
    retry: 1,
  });

  const notifications: Notification[] = data?.notifications ?? [];
  const total      = data?.total ?? 0;

  const markReadMut = useMutation({
    mutationFn: (id: string) => notificationApi.markAsRead(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-notifications'] });
      qc.invalidateQueries({ queryKey: ['admin-notifications-unread'] });
      toast.success('Marked as read');
    },
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => notificationApi.deleteNotification(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-notifications'] });
      toast.success('Notification deleted');
    },
  });

  const bulkReadMut = useMutation({
    mutationFn: (ids: string[]) => notificationApi.bulkMarkAsRead(ids),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-notifications'] });
      qc.invalidateQueries({ queryKey: ['admin-notifications-unread'] });
      setSelected([]);
      toast.success('Marked as read');
    },
  });

  const clearFilter = () => {
    setSearch(''); setCategory(''); setStatus('');
    setPriority(''); setIsRead(''); setPage(1);
    setSearchParams({});
  };

  const hasFilter = !!(search || category || status || priority || isRead);

  return (
    <AdminPageLayout
      title={<TranslatedText text="Notifications Hub" />}
      description={<TranslatedText text="All platform notifications received by super admin" />}
      actions={
        <div className="flex gap-2">
          {hasFilter && (
            <button onClick={clearFilter}
              className="flex items-center gap-1.5 px-3 py-2 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-300 rounded-xl text-sm font-bold hover:bg-gray-50 dark:hover:bg-slate-800">
              <X size={13} /> Clear Filters
            </button>
          )}
          <button onClick={() => refetch()}
            className="flex items-center gap-1.5 px-3 py-2 bg-[#2c5173] text-white rounded-xl text-sm font-bold hover:bg-[#1e3a54]">
            <RefreshCw size={13} /> Refresh
          </button>
        </div>
      }
    >
      <div className="safe-bottom space-y-5">

        {/* ── Filters ──────────────────────────────────────────────────── */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 p-4">
          <div className="flex flex-wrap gap-3">
            {/* search */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-3.5 h-3.5" />
              <input type="text" placeholder="Search by title, message…"
                value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
                className="w-full pl-9 pr-4 py-2 bg-gray-50 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-[#2c5173]" />
            </div>
            {/* selects */}
            {[
              { label: 'All Categories', value: category, setter: setCategory, options: Object.entries(CATEGORY_CFG).map(([k, v]) => [k, v.label]) },
              { label: 'All Statuses',   value: status,   setter: setStatus,   options: Object.entries(STATUS_CFG).map(([k, v]) => [k, v.label]) },
              { label: 'All Priorities', value: priority, setter: setPriority, options: Object.entries(PRIORITY_CFG).map(([k, v]) => [k, v.label]) },
              { label: 'Read?',          value: isRead,   setter: setIsRead,   options: [['true', 'Read'], ['false', 'Unread']] },
            ].map(({ label, value, setter, options }) => (
              <div key={label} className="relative">
                <select value={value} onChange={e => { (setter as any)(e.target.value); setPage(1); }}
                  className="pl-3 pr-8 py-2 bg-gray-50 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 rounded-xl text-xs font-medium appearance-none cursor-pointer focus:ring-2 focus:ring-[#2c5173]">
                  <option value="">{label}</option>
                  {(options as [string, string][]).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 w-3.5 h-3.5 pointer-events-none" />
              </div>
            ))}
            <span className="px-3 py-2 bg-slate-100 text-[#2c5173] rounded-xl text-xs font-bold self-center whitespace-nowrap">
              {total} notifications
            </span>
          </div>
        </div>

        {/* ── Bulk action bar ───────────────────────────────────────────── */}
        {selected.length > 0 && (
          <div className="flex items-center gap-3 px-4 py-3 bg-[#2c5173]/5 border border-[#2c5173]/20 rounded-2xl">
            <span className="text-xs font-bold text-[#2c5173]">{selected.length} selected</span>
            <button onClick={() => bulkReadMut.mutate(selected)} disabled={bulkReadMut.isPending}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-bold hover:bg-green-700 disabled:opacity-50">
              <CheckCircle size={11} /> Mark all read
            </button>
            <button onClick={() => setSelected([])}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-300 rounded-lg text-xs font-bold hover:bg-gray-50 dark:hover:bg-slate-800">
              <X size={11} /> Clear
            </button>
          </div>
        )}

        {/* ── Table ─────────────────────────────────────────────────────── */}
        <StandardDataTable
          embedded
          loading={isLoading}
          data={notifications}
          getRowId={(n) => n.id}
          searchable={false}
          selectable
          selectedIds={selected}
          onSelectionChange={setSelected}
          pagination
          pageSize={25}
          totalItems={total}
          page={page}
          onPageChange={setPage}
          emptyMessage={hasFilter ? 'No notifications found. Try clearing filters.' : 'No notifications found'}
          columns={[
            {
              key: 'title',
              label: 'Notification',
              render: (_: any, n: Notification) => {
                const isUnread = !n.readAt;
                return (
                  <div className="flex items-start gap-2.5 max-w-[260px]">
                    {isUnread && <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 flex-shrink-0" />}
                    <div className="min-w-0">
                      <p className={`text-xs truncate ${isUnread ? 'font-black text-gray-900 dark:text-white' : 'font-medium text-gray-700 dark:text-slate-300'}`}>{n.title}</p>
                      <p className="text-[11px] text-gray-400 mt-0.5 truncate max-w-[220px]">
                        {n.shortMessage || n.message}
                      </p>
                      {n.requiresAction && (
                        <span className="inline-flex items-center gap-1 mt-1 px-1.5 py-0.5 rounded text-[9px] font-black bg-amber-50 text-amber-700 border border-amber-200">
                          <AlertTriangle size={8} /> Action Required
                        </span>
                      )}
                    </div>
                  </div>
                );
              },
            },
            {
              key: 'category',
              label: 'Category',
              render: (cat: string) => {
                const catCfg = CATEGORY_CFG[cat] ?? { label: cat, icon: <Bell size={11} />, dot: 'bg-gray-400' };
                return (
                  <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-gray-600 dark:text-slate-300">
                    <span className={`w-1.5 h-1.5 rounded-full ${catCfg.dot}`} />
                    {catCfg.label}
                  </span>
                );
              },
            },
            {
              key: 'priority',
              label: 'Priority',
              render: (p: string) => {
                const priorityCfg = PRIORITY_CFG[p] ?? { label: p, cls: 'bg-gray-50 text-gray-500 border-gray-200' };
                return (
                  <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black border ${priorityCfg.cls}`}>
                    {priorityCfg.label}
                  </span>
                );
              },
            },
            {
              key: 'status',
              label: 'Status',
              render: (s: string) => {
                const statusCfg = STATUS_CFG[s] ?? { label: s, cls: 'bg-gray-50 text-gray-600 border-gray-200' };
                return (
                  <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black border ${statusCfg.cls}`}>
                    {statusCfg.label}
                  </span>
                );
              },
            },
            {
              key: 'channels',
              label: 'Channels',
              render: (channels: string[]) => (
                <div className="flex gap-0.5">
                  {(channels ?? []).map((ch: string) => (
                    <span key={ch} title={ch} className="text-sm">{notificationApi.getChannelIcon(ch)}</span>
                  ))}
                </div>
              ),
            },
            {
              key: 'createdAt',
              label: 'Sent',
              render: (ts: string) => (
                <div className="flex items-center gap-1 text-[11px] text-gray-400 whitespace-nowrap">
                  <Clock size={10} /> {fmtTime(ts)}
                </div>
              ),
            },
          ] as Column<Notification>[]}
          rowActions={[
            {
              label: 'View',
              icon: <Activity size={13} />,
              onClick: (n) => setDetail(n),
            },
            {
              label: 'Mark read',
              icon: <CheckCircle size={13} />,
              onClick: (n) => markReadMut.mutate(n.id),
              hidden: (n) => !!n.readAt,
            },
            {
              label: 'Delete',
              icon: <Trash2 size={13} />,
              onClick: (n) => deleteMut.mutate(n.id),
              variant: 'danger',
            },
          ] as TableAction<Notification>[]}
          rowClassName={(n) => (!n.readAt ? 'bg-blue-50/30' : '')}
        />
      </div>

      {detail && <DetailModal n={detail} onClose={() => setDetail(null)} />}
    </AdminPageLayout>
  );
};

export default AdminNotificationsHub;
