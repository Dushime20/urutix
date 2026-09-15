import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Plus, RefreshCw } from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { TranslatedText } from '../../components/translated-text';
import {
  StandardDataTable,
  StatusBadge,
  type Column,
  type StatusBadgeVariant,
} from '../../components/EnliteUI/Tables';

interface CreditTransaction {
  id: string;
  type: string;
  typeGroup: 'CREDIT' | 'DEBIT';
  amount: number;
  balanceAfter?: number;
  balance?: number;
  description: string;
  featureName?: string;
  metadata?: any;
  createdAt: string;
}

/** Normalize API rows (CONSUMPTION/PURCHASE/…) into credit vs debit for the UI. */
function normalizeTransaction(raw: any): CreditTransaction {
  const amount = Number(raw.amount) || 0;
  const debitTypes = new Set(['CONSUMPTION', 'EXPIRY']);
  const isDebit = amount < 0 || debitTypes.has(raw.type);
  const type = isDebit ? 'DEBIT' : raw.type === 'PURCHASE' ? 'PURCHASE' : 'CREDIT';

  return {
    id: raw.id,
    type,
    typeGroup: isDebit ? 'DEBIT' : 'CREDIT',
    amount: Math.abs(amount),
    balanceAfter: raw.balanceAfter,
    balance: raw.balanceAfter ?? raw.balance,
    description: raw.description || 'Transaction',
    featureName: raw.metadata?.featureCode || raw.featureName,
    metadata: raw.metadata,
    createdAt: raw.createdAt,
  };
}

const typeVariant = (type: string): StatusBadgeVariant => {
  if (type === 'DEBIT') return 'error';
  if (type === 'PURCHASE') return 'success';
  return 'info';
};

const TruckOwnerCredits: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [typeFilter, setTypeFilter] = useState('');
  const [dateRange, setDateRange] = useState('30d');

  const {
    data: transactionsData,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery<CreditTransaction[]>({
    queryKey: ['truck-owner-transactions', user?.id],
    queryFn: async () => {
      const response = await api.get('/credits/transactions?limit=100');
      const rows = response.data.data || [];
      return rows.map(normalizeTransaction);
    },
    enabled: !!user?.id,
  });

  const transactions = transactionsData || [];

  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      if (dateRange === 'all') return true;
      const days = parseInt(dateRange, 10);
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - days);
      return new Date(t.createdAt) >= cutoff;
    });
  }, [transactions, dateRange]);

  const columns: Column<CreditTransaction>[] = useMemo(
    () => [
      {
        key: 'createdAt',
        label: 'Date',
        sortable: true,
        render: (_v, row) => (
          <span className="text-xs text-slate-600 dark:text-slate-300 whitespace-nowrap">
            {new Date(row.createdAt).toLocaleString(undefined, {
              dateStyle: 'medium',
              timeStyle: 'short',
            })}
          </span>
        ),
      },
      {
        key: 'description',
        label: 'Description',
        sortable: true,
        render: (_v, row) => (
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-900 dark:text-white truncate max-w-[280px]">
              {row.description}
            </p>
            {row.featureName && (
              <p className="text-xs text-slate-500 mt-0.5">{row.featureName}</p>
            )}
          </div>
        ),
      },
      {
        key: 'type',
        label: 'Type',
        sortable: true,
        render: (_v, row) => (
          <StatusBadge variant={typeVariant(row.type)} label={row.type} />
        ),
      },
      {
        key: 'amount',
        label: 'Amount',
        sortable: true,
        align: 'right',
        render: (_v, row) => (
          <span
            className={`text-sm font-semibold tabular-nums ${
              row.typeGroup === 'DEBIT' ? 'text-rose-600' : 'text-emerald-600'
            }`}
          >
            {row.typeGroup === 'DEBIT' ? '−' : '+'}
            {row.amount.toLocaleString()}
          </span>
        ),
      },
      {
        key: 'balance',
        label: 'Balance',
        sortable: true,
        align: 'right',
        render: (_v, row) => (
          <span className="text-sm font-medium tabular-nums text-slate-700 dark:text-slate-200">
            {(row.balance ?? row.balanceAfter ?? 0).toLocaleString()}
          </span>
        ),
      },
    ],
    [],
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <h1 className="ui-page-title">
            <TranslatedText text="Credits" />
          </h1>
          <p className="ui-body-small mt-1">
            <TranslatedText text="Balance and transaction history for your fleet account" />
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="h-10 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-700 dark:text-slate-200"
            aria-label="Period"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="all">All time</option>
          </select>
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
            onClick={() => navigate('/dashboard/fleet/buy-credits')}
            className="inline-flex items-center gap-2 h-10 px-4 rounded-lg bg-[#345E85] text-white text-sm font-semibold hover:bg-[#2c5173]"
          >
            <Plus className="w-4 h-4" />
            <TranslatedText text="Buy Credits" />
          </button>
        </div>
      </div>

      <StandardDataTable
        title="Transaction history"
        columns={columns}
        data={filteredTransactions}
        loading={isLoading}
        error={isError ? ((error as any)?.message || 'Failed to load transactions') : null}
        onRetry={() => refetch()}
        searchable
        searchPlaceholder="Search description, feature, type…"
        searchKeys={['description', 'featureName', 'type']}
        filters={[
          {
            key: 'typeGroup',
            label: 'Type',
            options: [
              { value: 'CREDIT', label: 'Credits' },
              { value: 'DEBIT', label: 'Debits' },
            ],
          },
        ]}
        filterValues={{ typeGroup: typeFilter || 'all' }}
        onFilterChange={(_key, value) => setTypeFilter(value === 'all' ? '' : value)}
        onRefresh={() => refetch()}
        emptyMessage="No transactions found"
        ariaLabel="Credit transactions"
        getRowId={(row) => row.id}
        defaultSortKey="createdAt"
        defaultSortDirection="desc"
        pagination
        pageSize={20}
      />
    </div>
  );
};

export default TruckOwnerCredits;
