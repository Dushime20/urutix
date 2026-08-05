import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'react-router-dom';
import {
  FaHistory,
  FaFilter,
  FaArrowDown,
  FaArrowUp,
  FaCalendar,
  FaCoins,
  FaTruck
} from 'react-icons/fa';
import AdminPageLayout from '../../components/Admin/AdminPageLayout';
import { TranslatedText } from '../../components/translated-text';
import api from '../../services/api';
import { format } from 'date-fns';
import { StandardDataTable, StatusBadge, type Column } from '../../components/EnliteUI/Tables';

interface CreditTransaction {
  id: string;
  tenantId: string;  // Changed from tenant_id
  creditAccountId: string;  // Changed from credit_account_id
  amount: number;
  type: 'SUBSCRIPTION_GRANT' | 'PURCHASE' | 'CONSUMPTION' | 'REFUND' | 'BONUS' | 'EXPIRY' | 'ADJUSTMENT';
  description: string;
  referenceType?: string;
  referenceId?: string;  // Changed from reference_id
  balanceAfter: number;  // Changed from balance_after
  createdAt: string;  // Changed from created_at
  creditAccount?: {
    id: string;
    tenantId: string;
    tenant?: {
      id: string;
      name: string;
    };
  };
  tenant?: {
    id: string;
    name: string;
  };
}

interface UsageStats {
  totalConsumed: number;
  totalPurchased: number;
  totalBonus: number;
  averageDaily: number;
  topConsumers: Array<{
    tenantId: string;
    tenantName: string;
    consumed: number;
  }>;
}

const CreditUsageHistory: React.FC<{ embedded?: boolean }> = ({ embedded = false }) => {
  const location = useLocation();
  const navigationState = location.state as { tenantId?: string; tenantName?: string } | null;
  
  // Initialize state directly from navigation state
  const [selectedTenant, setSelectedTenant] = useState<string>(
    navigationState?.tenantId || 'all'
  );
  const [transactionType, setTransactionType] = useState<string>('all');
  const [dateRange, setDateRange] = useState<string>('30');
  const [searchTerm, setSearchTerm] = useState(navigationState?.tenantName || '');

  // Fetch transactions
  const { data: transactionsData, isLoading } = useQuery({
    queryKey: ['credit-transactions', selectedTenant, transactionType, dateRange],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedTenant !== 'all') params.append('tenantId', selectedTenant);
      if (transactionType !== 'all') params.append('type', transactionType);
      params.append('days', dateRange);
      params.append('limit', '100');

      const response = await api.get(`/admin/credits/transactions?${params.toString()}`);
      return response.data.data || response.data || [];
    },
  });

  const transactions = Array.isArray(transactionsData) ? transactionsData : [];

  // Fetch tenants for filter
  const { data: tenantsData } = useQuery({
    queryKey: ['tenants-list'],
    queryFn: async () => {
      const response = await api.get('/admin/tenants?limit=100');
      return response.data.data || response.data || [];
    },
  });

  const tenants = Array.isArray(tenantsData) ? tenantsData : [];

  // Calculate statistics
  const stats = useMemo<UsageStats>(() => {
    const consumed = transactions
      .filter((t: CreditTransaction) => t.type === 'CONSUMPTION')
      .reduce((sum: number, t: CreditTransaction) => sum + Number(t.amount), 0);

    const purchased = transactions
      .filter((t: CreditTransaction) => t.type === 'PURCHASE')
      .reduce((sum: number, t: CreditTransaction) => sum + Number(t.amount), 0);

    const bonus = transactions
      .filter((t: CreditTransaction) => t.type === 'BONUS')
      .reduce((sum: number, t: CreditTransaction) => sum + Number(t.amount), 0);

    const days = parseInt(dateRange) || 30;
    const averageDaily = consumed / days;

    // Group by tenant
    const tenantConsumption = transactions
      .filter((t: CreditTransaction) => t.type === 'CONSUMPTION')
      .reduce((acc: any, t: CreditTransaction) => {
        const key = t.tenantId;
        if (!acc[key]) {
          acc[key] = {
            tenantId: t.tenantId,
            tenantName: t.creditAccount?.tenant?.name || t.tenant?.name || 'Unknown',
            consumed: 0,
          };
        }
        acc[key].consumed += Number(t.amount);
        return acc;
      }, {});

    const topConsumers: Array<{
      tenantId: string;
      tenantName: string;
      consumed: number;
    }> = (Object.values(tenantConsumption) as Array<{
      tenantId: string;
      tenantName: string;
      consumed: number;
    }>)
      .sort((a, b) => b.consumed - a.consumed)
      .slice(0, 5);

    return {
      totalConsumed: consumed,
      totalPurchased: purchased,
      totalBonus: bonus,
      averageDaily,
      topConsumers,
    };
  }, [transactions, dateRange]);

  // Search handled by StandardDataTable
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'CONSUMPTION': return <FaArrowDown className="text-red-500" />;
      case 'PURCHASE': return <FaArrowUp className="text-green-500" />;
      case 'BONUS': return <FaCoins className="text-yellow-500" />;
      case 'SUBSCRIPTION_GRANT': return <FaArrowUp className="text-blue-500" />;
      case 'REFUND': return <FaArrowUp className="text-purple-500" />;
      default: return <FaHistory className="text-gray-500" />;
    }
  };

  const typeVariant = (type: string) => {
    switch (type) {
      case 'CONSUMPTION': return 'error' as const;
      case 'PURCHASE': return 'success' as const;
      case 'BONUS': return 'warning' as const;
      case 'SUBSCRIPTION_GRANT': return 'info' as const;
      case 'REFUND': return 'purple' as const;
      default: return 'neutral' as const;
    }
  };

  const exportToCSV = () => {
    const headers = ['Date', 'Tenant', 'Type', 'Amount', 'Description', 'Balance After'];
    const rows = transactions.map((t: CreditTransaction) => [
      t.createdAt ? format(new Date(t.createdAt), 'yyyy-MM-dd HH:mm:ss') : 'N/A',
      t.creditAccount?.tenant?.name || t.tenant?.name || 'Unknown',
      t.type,
      t.amount,
      t.description,
      t.balanceAfter,
    ]);

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `credit-usage-history-${new Date().toISOString()}.csv`;
    a.click();
  };

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Invalid Date';
      return format(date, 'MMM dd, yyyy HH:mm');
    } catch (error) {
      return 'Invalid Date';
    }
  };

  const columns: Column<CreditTransaction>[] = useMemo(() => [
    {
      key: 'createdAt',
      label: 'Date & Time',
      alwaysVisible: true,
      sortable: true,
      render: (_v, t) => (
        <span className="text-sm text-gray-900 dark:text-white whitespace-nowrap">{formatDate(t.createdAt)}</span>
      ),
    },
    {
      key: 'tenantId',
      label: 'Tenant',
      render: (_v, t) => (
        <div>
          <p className="text-sm font-medium text-gray-900 dark:text-white">
            {t.creditAccount?.tenant?.name || t.tenant?.name || 'Unknown'}
          </p>
          <p className="text-xs text-gray-500">
            {t.tenantId ? `${t.tenantId.substring(0, 8)}...` : 'N/A'}
          </p>
        </div>
      ),
    },
    {
      key: 'type',
      label: 'Type',
      render: (_v, t) => (
        <StatusBadge
          variant={typeVariant(t.type)}
          label={t.type.replace('_', ' ')}
          icon={getTypeIcon(t.type)}
        />
      ),
    },
    {
      key: 'description',
      label: 'Description',
      render: (_v, t) => (
        <span className="text-sm text-gray-900 dark:text-white">
          {t.description}
          {t.referenceType && (
            <span className="ml-2 text-xs text-gray-500">({t.referenceType})</span>
          )}
        </span>
      ),
    },
    {
      key: 'amount',
      label: 'Amount',
      sortable: true,
      render: (_v, t) => (
        <span className={`text-sm font-semibold ${
          t.type === 'CONSUMPTION' ? 'text-red-600' : 'text-green-600'
        }`}>
          {t.type === 'CONSUMPTION' ? '-' : '+'}
          {Number(t.amount).toLocaleString()}
        </span>
      ),
    },
    {
      key: 'balanceAfter',
      label: 'Balance After',
      sortable: true,
      render: (_v, t) => (
        <span className="text-sm font-medium text-gray-900 dark:text-white">
          {Number(t.balanceAfter).toLocaleString()}
        </span>
      ),
    },
  ], []);

  const content = (
      <div className="safe-bottom space-y-6">
      {/* Top Consumers */}
      {stats.topConsumers.length > 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-lg p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4"><TranslatedText text="Top Credit Consumers" /></h3>
          <div className="space-y-3">
            {stats.topConsumers.map((consumer: any, index: number) => (
              <div key={consumer.tenantId || index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-800/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <span className="text-lg font-bold text-gray-400">#{index + 1}</span>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{consumer.tenantName}</p>
                    <p className="text-sm text-gray-500">
                      {consumer.tenantId ? `${consumer.tenantId.substring(0, 8)}...` : 'N/A'}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-red-600">{consumer.consumed.toLocaleString()}</p>
                  <p className="text-xs text-gray-500"><TranslatedText text="credits consumed" /></p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Server-side Filters */}
      <div className="bg-white dark:bg-slate-900 rounded-lg p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
              <FaTruck className="inline mr-2" />
              <TranslatedText text="Tenant" />
            </label>
            <select
              value={selectedTenant}
              onChange={(e) => setSelectedTenant(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2c5173] focus:border-[#2c5173]"
            >
              <option value="all"><TranslatedText text="All Tenants" /></option>
              {tenants.map((tenant: any) => (
                <option key={tenant.id} value={tenant.id}>
                  {tenant.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
              <FaFilter className="inline mr-2" />
              <TranslatedText text="Transaction Type" />
            </label>
            <select
              value={transactionType}
              onChange={(e) => setTransactionType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2c5173] focus:border-[#2c5173]"
            >
              <option value="all"><TranslatedText text="All Types" /></option>
              <option value="CONSUMPTION"><TranslatedText text="Consumption" /></option>
              <option value="PURCHASE"><TranslatedText text="Purchase" /></option>
              <option value="BONUS"><TranslatedText text="Bonus" /></option>
              <option value="SUBSCRIPTION_GRANT"><TranslatedText text="Subscription Grant" /></option>
              <option value="REFUND"><TranslatedText text="Refund" /></option>
              <option value="ADJUSTMENT"><TranslatedText text="Adjustment" /></option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
              <FaCalendar className="inline mr-2" />
              <TranslatedText text="Date Range" />
            </label>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2c5173] focus:border-[#2c5173]"
            >
              <option value="7"><TranslatedText text="Last 7 days" /></option>
              <option value="30"><TranslatedText text="Last 30 days" /></option>
              <option value="90"><TranslatedText text="Last 90 days" /></option>
              <option value="365"><TranslatedText text="Last year" /></option>
            </select>
          </div>
        </div>
      </div>

      <StandardDataTable
        title="Transaction History"
        subtitle={`${transactions.length} transactions`}
        icon={<FaHistory className="w-5 h-5" />}
        columns={columns}
        data={transactions}
        loading={isLoading}
        getRowId={(row) => row.id}
        searchPlaceholder="Search transactions..."
        searchKeys={['description', 'type', 'id']}
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        defaultSortKey="createdAt"
        defaultSortDirection="desc"
        onExport={exportToCSV}
        exportLabel="Export CSV"
        emptyMessage="No transactions found"
        ariaLabel="Credit usage history"
      />
      </div>
  );

  if (embedded) return content;
  return <AdminPageLayout>{content}</AdminPageLayout>;
};

export default CreditUsageHistory;
