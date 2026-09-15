import React, { useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'react-router-dom';
import {
  Headphones,
  Plus,
  Eye,
  Clock,
  CheckCircle,
  Flag,
  Timer,
  RefreshCw,
} from 'lucide-react';
import { disputesAPI } from '../../services/api';
import {
  type Dispute,
  STATUS_LABELS,
  CATEGORY_LABELS,
  PRIORITY_LABELS,
  getSlaStatus,
  getUserDisplayName,
  formatRelativeTime,
  asDisputeList,
} from '../../types/dispute';
import CreateTicketModal from './CreateTicketModal';
import SupportTicketDetailModal from './SupportTicketDetailModal';
import { TranslatedText } from '../../components/translated-text';
import { StatCard } from '../../components/EnliteUI/Cards/StatCard';
import {
  StandardDataTable,
  StatusBadge,
  type Column,
  type TableAction,
  type StatusBadgeVariant,
} from '../../components/EnliteUI/Tables';

const priorityVariant = (priority?: string): StatusBadgeVariant => {
  const p = String(priority || '').toUpperCase();
  if (p === 'CRITICAL' || p === 'HIGH') return 'error';
  if (p === 'MEDIUM') return 'warning';
  return 'neutral';
};

const UserSupportPage: React.FC = () => {
  const qc = useQueryClient();
  const location = useLocation();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatus] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(location.pathname.endsWith('/new'));

  const { data, isLoading, isError, refetch, error } = useQuery({
    queryKey: ['my-disputes', statusFilter, search],
    queryFn: () =>
      disputesAPI
        .getAll({
          status: statusFilter || undefined,
          search: search || undefined,
          limit: 50,
        })
        .then((r) => r.data),
    staleTime: 30_000,
  });

  const disputes: Dispute[] = asDisputeList(data);
  const openCount = disputes.filter((d) => ['OPEN', 'REOPENED'].includes(d.status)).length;
  const pendingCount = disputes.filter((d) =>
    ['UNDER_REVIEW', 'ASSIGNED', 'INVESTIGATING', 'AWAITING_INFORMATION'].includes(d.status),
  ).length;
  const resolvedCount = disputes.filter((d) => ['RESOLVED', 'CLOSED'].includes(d.status)).length;
  const escalatedCount = disputes.filter((d) => d.status === 'ESCALATED').length;

  const columns: Column<Dispute>[] = useMemo(
    () => [
      {
        key: 'ticketNumber',
        label: 'Ticket',
        sortable: true,
        render: (_v, row) => (
          <div className="min-w-0">
            <p className="text-xs font-mono font-semibold text-[#345E85]">
              {row.ticketNumber ?? row.referenceNumber}
            </p>
            <p className="text-sm font-semibold text-slate-900 dark:text-white truncate max-w-[240px]">
              {row.title}
            </p>
          </div>
        ),
      },
      {
        key: 'category',
        label: 'Category',
        sortable: true,
        render: (_v, row) => (
          <span className="text-xs text-slate-600 dark:text-slate-300">
            {CATEGORY_LABELS[row.category] || row.category}
          </span>
        ),
      },
      {
        key: 'priority',
        label: 'Priority',
        sortable: true,
        render: (_v, row) => (
          <StatusBadge
            variant={priorityVariant(row.priority)}
            label={PRIORITY_LABELS[row.priority] || row.priority}
          />
        ),
      },
      {
        key: 'status',
        label: 'Status',
        sortable: true,
        render: (_v, row) => {
          const sla = getSlaStatus(row);
          return (
            <div className="flex flex-wrap items-center gap-1.5">
              <StatusBadge status={row.status} label={STATUS_LABELS[row.status] || row.status} />
              {sla !== 'ok' && (
                <StatusBadge
                  variant={sla === 'breached' ? 'error' : 'warning'}
                  icon={<Timer className="w-3 h-3" />}
                  label={sla === 'breached' ? 'SLA breach' : 'SLA warn'}
                />
              )}
            </div>
          );
        },
      },
      {
        key: 'assignedTo',
        label: 'Assigned',
        render: (_v, row) => (
          <span className="text-xs text-slate-500">
            {row.assignedTo ? getUserDisplayName(row.assignedTo) : '—'}
          </span>
        ),
      },
      {
        key: 'createdAt',
        label: 'Opened',
        sortable: true,
        render: (_v, row) => (
          <span className="text-xs text-slate-500 whitespace-nowrap">
            {formatRelativeTime(row.createdAt)}
          </span>
        ),
      },
    ],
    [],
  );

  const rowActions: TableAction<Dispute>[] = useMemo(
    () => [
      {
        key: 'view',
        label: 'View',
        icon: <Eye size={16} />,
        onClick: (row) => setSelectedId(row.id),
      },
    ],
    [],
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <h1 className="ui-page-title">
            <TranslatedText text="Support" />
          </h1>
          <p className="ui-body-small mt-1">
            <TranslatedText text="Report issues and track your requests" />
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => refetch()}
            className="size-10 inline-flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:border-[#345E85] hover:text-[#345E85]"
            aria-label="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setShowCreate(true)}
            className="inline-flex items-center gap-2 h-10 px-4 rounded-lg bg-[#345E85] text-white text-sm font-semibold hover:bg-[#2c5173]"
          >
            <Plus className="w-4 h-4" />
            <TranslatedText text="Report Issue" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          title="Open"
          value={openCount}
          color="primary"
          variant="modern"
          icon={<Flag className="w-5 h-5" />}
          loading={isLoading}
          onClick={() => setStatus('OPEN')}
        />
        <StatCard
          title="In Progress"
          value={pendingCount}
          color="warning"
          variant="modern"
          icon={<Clock className="w-5 h-5" />}
          loading={isLoading}
          onClick={() => setStatus('UNDER_REVIEW')}
        />
        <StatCard
          title="Escalated"
          value={escalatedCount}
          color="error"
          variant="modern"
          icon={<Headphones className="w-5 h-5" />}
          loading={isLoading}
          onClick={() => setStatus('ESCALATED')}
        />
        <StatCard
          title="Resolved"
          value={resolvedCount}
          color="success"
          variant="modern"
          icon={<CheckCircle className="w-5 h-5" />}
          loading={isLoading}
          onClick={() => setStatus('RESOLVED')}
        />
      </div>

      <StandardDataTable
        title="Your tickets"
        columns={columns}
        data={disputes}
        loading={isLoading}
        error={isError ? ((error as any)?.message || 'Failed to load tickets') : null}
        onRetry={() => refetch()}
        searchable
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search tickets…"
        filters={[
          {
            key: 'status',
            label: 'Status',
            options: Object.entries(STATUS_LABELS).map(([value, label]) => ({ value, label })),
          },
        ]}
        filterValues={{ status: statusFilter || 'all' }}
        onFilterChange={(_key, value) => setStatus(value === 'all' ? '' : value)}
        rowActions={rowActions}
        onRowClick={(row) => setSelectedId(row.id)}
        onRefresh={() => refetch()}
        emptyMessage="No tickets yet. Report an issue to get started."
        ariaLabel="Support tickets"
        getRowId={(row) => row.id}
        defaultSortKey="createdAt"
        defaultSortDirection="desc"
      />

      {selectedId && (
        <SupportTicketDetailModal
          disputeId={selectedId}
          isAdmin={false}
          onClose={() => {
            setSelectedId(null);
            qc.invalidateQueries({ queryKey: ['my-disputes'] });
          }}
        />
      )}
      {showCreate && (
        <CreateTicketModal
          onClose={() => setShowCreate(false)}
          onCreated={() => {
            setShowCreate(false);
            qc.invalidateQueries({ queryKey: ['my-disputes'] });
          }}
        />
      )}
    </div>
  );
};

export default UserSupportPage;
