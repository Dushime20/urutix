import { DashboardSkeleton } from '../../components/common/LoadingSkeletons';
import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { brokerAPI, type BrokerCommission } from '../../services/brokerApi';
import {
  DollarSign,
  ArrowUpRight,
} from 'lucide-react';
import { useCurrencyFormat } from '../../hooks/useCurrencyFormat';
import {
  StandardDataTable,
  StatusBadge,
  type Column,
} from '../../components/EnliteUI/Tables';

const CommissionsPage: React.FC = () => {
  const { format: fmtFull, compact: fmtMoney } = useCurrencyFormat();
  const { user } = useAuth();
  const [commissions, setCommissions] = useState<BrokerCommission[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: '',
    startDate: '',
    endDate: '',
  });
  const [stats, setStats] = useState({
    totalEarned: 0,
  });

  useEffect(() => {
    if (user && user.role === 'BROKER') {
      loadCommissions();
    }
  }, [user, filters]);

  const loadCommissions = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (filters.status) params.status = filters.status;
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;

      const response = await brokerAPI.getBrokerCommissions(user!.id, params);
      const responseData = response.data || response || {};
      const commissionsData = responseData.commissions || [];
      setCommissions(Array.isArray(commissionsData) ? commissionsData : []);
      setStats({
        totalEarned: responseData.totalEarned || 0,
      });
    } catch (err: any) {
      console.error('Failed to load commissions:', err);
    } finally {
      setLoading(false);
    }
  };

  const columns: Column<BrokerCommission>[] = useMemo(() => [
    {
      key: 'loadId',
      label: 'Ref Node',
      sortable: true,
      alwaysVisible: true,
      render: (value: string) => (
        <p className="text-sm font-bold text-slate-900 uppercase italic dark:text-white">
          #{value.substring(0, 10).toUpperCase()}
        </p>
      ),
    },
    {
      key: 'loadAmount',
      label: 'Base Value',
      sortable: true,
      render: (value: number) => (
        <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{fmtFull(value)}</span>
      ),
    },
    {
      key: 'commissionRate',
      label: 'Yield Factor',
      sortable: true,
      render: (value: number) => (
        <span className="text-xs font-bold text-primary-500 bg-primary-50 px-3 py-1 rounded-lg border border-primary-100">
          {value}%
        </span>
      ),
    },
    {
      key: 'commissionAmount',
      label: 'Net Amount',
      sortable: true,
      render: (value: number) => (
        <p className="text-xl font-bold text-slate-900 dark:text-white">{fmtFull(value)}</p>
      ),
    },
    {
      key: 'status',
      label: 'State',
      sortable: true,
      render: (value: string) => <StatusBadge status={value} label={value} />,
    },
    {
      key: 'createdAt',
      label: 'Timestamp',
      sortable: true,
      align: 'right',
      render: (value: string) => (
        <p className="text-xs font-bold text-slate-900 uppercase dark:text-white">
          {new Date(value).toLocaleDateString()}
        </p>
      ),
    },
  ], [fmtFull]);

  if (loading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="max-w-[1400px] mx-auto space-y-12 animate-fade-in pb-24">
      <div className="relative overflow-hidden bg-white dark:bg-slate-900 rounded-[2rem] p-6 shadow-sm border border-slate-100 dark:border-slate-800 flex items-center justify-between group">
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-slate-100/60 dark:bg-primary-600/10 rounded-full -mr-48 -mt-48 blur-[80px]"></div>

        <div className="relative z-10 flex items-center gap-6">
          <div className="w-14 h-14 rounded-2xl bg-[#345E85]/10 dark:bg-white/10 border border-[#345E85]/20 dark:border-white/20 flex items-center justify-center">
            <DollarSign size={24} className="text-[#345E85] dark:text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight leading-none mb-1 text-slate-900 dark:text-white">Yields</h1>
            <p className="text-slate-400 text-sm font-bold uppercase">Financial Audit</p>
          </div>
        </div>

        <div className="relative z-10 flex items-center gap-12 mr-4">
          <div className="text-center hidden md:block">
            <p className="text-xl font-bold leading-none text-emerald-400">{fmtMoney(stats.totalEarned)}</p>
            <p className="text-xs font-bold text-slate-500 uppercase mt-0.5 dark:text-slate-400">Revenue</p>
          </div>
          <div className="flex gap-4">
            <button className="px-8 py-4 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-white rounded-2xl text-sm font-bold uppercase hover:bg-slate-100 dark:hover:bg-white/10 transition-all">Export</button>
            <button onClick={() => window.location.href = '/dashboard/broker/payouts'} className="px-8 py-4 bg-primary-600 text-white rounded-2xl text-sm font-bold uppercase shadow-xl shadow-primary-900/10 hover:scale-105 active:scale-95 transition-all flex items-center gap-3">
              <ArrowUpRight size={14} /> Payout
            </button>
          </div>
        </div>
      </div>

      <StandardDataTable<BrokerCommission>
        title="Transaction Ledger"
        subtitle={`Records: ${commissions.length}`}
        icon={<DollarSign className="w-5 h-5" />}
        columns={columns}
        data={commissions}
        getRowId={(row) => row.id}
        searchable
        searchPlaceholder="Search commissions…"
        searchKeys={['loadId', 'status']}
        filters={[
          {
            key: 'status',
            label: 'Stage',
            options: [
              { value: 'PENDING', label: 'Awaiting' },
              { value: 'APPROVED', label: 'Verified' },
              { value: 'PAID', label: 'Closed' },
            ],
          },
        ]}
        filterValues={{ status: filters.status || 'all' }}
        onFilterChange={(_, value) => {
          setFilters((prev) => ({ ...prev, status: value === 'all' ? '' : value }));
        }}
        toolbarExtra={
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
              aria-label="Start date"
              className="px-3 py-2 text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-200"
            />
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
              aria-label="End date"
              className="px-3 py-2 text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-200"
            />
          </div>
        }
        pagination
        pageSize={10}
        columnVisibility
        stickyHeader
        striped
        hoverable
        onRefresh={loadCommissions}
        emptyMessage="No commission records match your current filters"
        ariaLabel="Commission ledger"
      />
    </div>
  );
};

export default CommissionsPage;
