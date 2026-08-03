/**
 * Revenue Dashboard — SUPER_ADMIN role
 * Route: /admin/revenue
 * Layout: AdminPageLayout (AdminLayout)
 */
import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Building2, BarChart3, Calendar } from 'lucide-react';
import { revenueApi } from '../../services/featuresApi';
import AdminPageLayout from '../../components/Admin/AdminPageLayout';
import { TranslatedText } from '../../components/translated-text';
import ModernLoader from '../../components/common/ModernLoader';
import { useCurrencyFormat } from '../../hooks/useCurrencyFormat';
import { StandardDataTable, type Column } from '../../components/EnliteUI/Tables';

interface TenantRevenueRow {
  tenantId: string;
  gmv: number;
  fees: number;
}

const RevenueDashboard: React.FC = () => {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['revenue-summary', from, to],
    queryFn: () => revenueApi.getSummary(from || undefined, to || undefined),
  });

  const { format: fmt } = useCurrencyFormat();

  const tenantRows: TenantRevenueRow[] = Array.isArray(data?.byTenant) ? data.byTenant : [];

  const columns: Column<TenantRevenueRow>[] = useMemo(() => [
    {
      key: 'tenantId',
      label: 'Tenant ID',
      alwaysVisible: true,
      render: (_v, t) => (
        <span className="font-mono text-xs text-slate-500 dark:text-slate-400">
          {t.tenantId?.slice(0, 16)}...
        </span>
      ),
    },
    {
      key: 'gmv',
      label: 'GMV',
      sortable: true,
      render: (_v, t) => (
        <span className="font-black text-slate-900 dark:text-white text-xs">{fmt(t.gmv)}</span>
      ),
    },
    {
      key: 'fees',
      label: 'Platform Fees',
      sortable: true,
      render: (_v, t) => (
        <span className="font-black text-primary-600 dark:text-primary-400 text-xs">{fmt(t.fees)}</span>
      ),
    },
    {
      key: 'feeRate',
      label: 'Fee Rate',
      render: (_v, t) => (
        <span className="bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 px-2 py-0.5 rounded-lg font-black text-xs">
          {t.gmv > 0 ? `${((t.fees / t.gmv) * 100).toFixed(2)}%` : '—'}
        </span>
      ),
    },
  ], [fmt]);

  return (
    <AdminPageLayout
      title={<TranslatedText text="Revenue & Commission Engine" />}
      description={<TranslatedText text="Platform-wide GMV, fees collected, and broker commissions across all tenants." />}
    >
      <div className="safe-bottom">
      {/* Date Filter */}
      <div className="flex flex-wrap gap-3 items-center mb-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-4">
        <div className="flex items-center gap-2">
          <Calendar size={14} className="text-slate-400" />
          <span className="text-xs font-black text-slate-400 uppercase tracking-widest">
            <TranslatedText text="Date Range" />
          </span>
        </div>
        <input
          type="date"
          value={from}
          onChange={e => setFrom(e.target.value)}
          className="px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500"
        />
        <span className="text-slate-400 text-sm">→</span>
        <input
          type="date"
          value={to}
          onChange={e => setTo(e.target.value)}
          className="px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500"
        />
        <button
          onClick={() => refetch()}
          className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-xs font-black transition-all"
        >
          <TranslatedText text="Apply" />
        </button>
        {(from || to) && (
          <button
            onClick={() => { setFrom(''); setTo(''); }}
            className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 rounded-xl text-xs font-black transition-all"
          >
            <TranslatedText text="Clear" />
          </button>
        )}
      </div>

      {isLoading ? (
        <ModernLoader isLoading text="Loading_Revenue" />
      ) : (
        <div className="space-y-6">

          {/* Summary Row */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-5">
            <div className="flex items-center gap-3 mb-4">
              <BarChart3 size={18} className="text-primary-600 dark:text-primary-400" />
              <h2 className="font-black text-slate-900 dark:text-white text-sm uppercase tracking-tight">
                <TranslatedText text="Settlement Summary" />
              </h2>
              <span className="ml-auto text-xs font-black text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-lg">
                {data?.recordCount ?? 0} <TranslatedText text="records" />
              </span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Avg Fee Rate', value: data?.totalGMV > 0 ? `${((data.totalPlatformFees / data.totalGMV) * 100).toFixed(2)}%` : '—' },
                { label: 'Avg Settlement', value: data?.recordCount > 0 ? fmt(data.totalGMV / data.recordCount) : '—' },
                { label: 'Broker Share', value: data?.totalGMV > 0 ? `${((data.totalBrokerCommissions / data.totalGMV) * 100).toFixed(2)}%` : '—' },
                { label: 'Net Payout Rate', value: data?.totalGMV > 0 ? `${((data.totalNetPayouts / data.totalGMV) * 100).toFixed(2)}%` : '—' },
              ].map(({ label, value }) => (
                <div key={label} className="bg-slate-50 dark:bg-slate-800 rounded-xl p-3 text-center">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                    <TranslatedText text={label} />
                  </p>
                  <p className="text-sm font-black text-slate-900 dark:text-white">{value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Per-Tenant Breakdown */}
          {tenantRows.length > 0 && (
            <StandardDataTable
              title={<TranslatedText text="Revenue by Tenant" />}
              icon={<Building2 size={16} className="text-primary-600 dark:text-primary-400" />}
              columns={columns}
              data={tenantRows}
              getRowId={(row) => row.tenantId}
              searchable
              searchPlaceholder="Search tenants..."
              searchKeys={['tenantId']}
              pagination
              columnVisibility
              stickyHeader
              emptyMessage="No tenant revenue data"
              ariaLabel="Revenue by tenant"
            />
          )}
        </div>
      )}
      </div>
    </AdminPageLayout>
  );
};

export default RevenueDashboard;
