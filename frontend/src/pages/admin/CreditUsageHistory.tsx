import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'react-router-dom';
import { 
  FaHistory, FaChartLine, FaDownload, FaFilter, FaSearch,
  FaArrowDown, FaArrowUp, FaCalendar, FaCoins, FaTruck
} from 'react-icons/fa';
import AdminPageLayout from '../../components/Admin/AdminPageLayout';
import { TranslatedText } from '../../components/translated-text';
import api from '../../services/api';
import { format } from 'date-fns';

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

const CreditUsageHistory: React.FC = () => {
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

  // Filter transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter((t: CreditTransaction) => {
      const matchesSearch = 
        t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.tenant?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.id.toLowerCase().includes(searchTerm.toLowerCase());
      
      return matchesSearch;
    });
  }, [transactions, searchTerm]);

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

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'CONSUMPTION': return 'text-red-600 bg-red-50';
      case 'PURCHASE': return 'text-green-600 bg-green-50';
      case 'BONUS': return 'text-yellow-600 bg-yellow-50';
      case 'SUBSCRIPTION_GRANT': return 'text-blue-600 bg-blue-50';
      case 'REFUND': return 'text-purple-600 bg-purple-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const exportToCSV = () => {
    const headers = ['Date', 'Tenant', 'Type', 'Amount', 'Description', 'Balance After'];
    const rows = filteredTransactions.map((t: CreditTransaction) => [
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

  return (
    <AdminPageLayout
      title={<TranslatedText text="Credit Usage History" />}
      description={<TranslatedText text="Track and analyze credit consumption across all tenants" />}
      actions={
        <button
          onClick={exportToCSV}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <FaDownload />
          <TranslatedText text="Export CSV" />
        </button>
      }
    >
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600"><TranslatedText text="Total Consumed" /></p>
              <p className="text-2xl font-bold text-red-600 mt-1">
                {stats.totalConsumed.toLocaleString()}
              </p>
              <p className="text-xs text-gray-500 mt-1"><TranslatedText text="Last" /> {dateRange} <TranslatedText text="days" /></p>
            </div>
            <div className="p-3 bg-red-50 rounded-lg">
              <FaArrowDown className="text-2xl text-red-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600"><TranslatedText text="Total Purchased" /></p>
              <p className="text-2xl font-bold text-green-600 mt-1">
                {stats.totalPurchased.toLocaleString()}
              </p>
              <p className="text-xs text-gray-500 mt-1"><TranslatedText text="Last" /> {dateRange} <TranslatedText text="days" /></p>
            </div>
            <div className="p-3 bg-green-50 rounded-lg">
              <FaArrowUp className="text-2xl text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600"><TranslatedText text="Bonus Credits" /></p>
              <p className="text-2xl font-bold text-yellow-600 mt-1">
                {stats.totalBonus.toLocaleString()}
              </p>
              <p className="text-xs text-gray-500 mt-1"><TranslatedText text="Last" /> {dateRange} <TranslatedText text="days" /></p>
            </div>
            <div className="p-3 bg-yellow-50 rounded-lg">
              <FaCoins className="text-2xl text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600"><TranslatedText text="Daily Average" /></p>
              <p className="text-2xl font-bold text-blue-600 mt-1">
                {stats.averageDaily.toFixed(1)}
              </p>
              <p className="text-xs text-gray-500 mt-1"><TranslatedText text="Credits per day" /></p>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg">
              <FaChartLine className="text-2xl text-blue-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Top Consumers */}
      {stats.topConsumers.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4"><TranslatedText text="Top Credit Consumers" /></h3>
          <div className="space-y-3">
            {stats.topConsumers.map((consumer: any, index: number) => (
              <div key={consumer.tenantId || index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <span className="text-lg font-bold text-gray-400">#{index + 1}</span>
                  <div>
                    <p className="font-medium text-gray-900">{consumer.tenantName}</p>
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

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <FaSearch className="inline mr-2" />
              <TranslatedText text="Search" />
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search transactions..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Tenant Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <FaTruck className="inline mr-2" />
              <TranslatedText text="Tenant" />
            </label>
            <select
              value={selectedTenant}
              onChange={(e) => setSelectedTenant(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all"><TranslatedText text="All Tenants" /></option>
              {tenants.map((tenant: any) => (
                <option key={tenant.id} value={tenant.id}>
                  {tenant.name}
                </option>
              ))}
            </select>
          </div>

          {/* Type Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <FaFilter className="inline mr-2" />
              <TranslatedText text="Transaction Type" />
            </label>
            <select
              value={transactionType}
              onChange={(e) => setTransactionType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
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

          {/* Date Range */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <FaCalendar className="inline mr-2" />
              <TranslatedText text="Date Range" />
            </label>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="7"><TranslatedText text="Last 7 days" /></option>
              <option value="30"><TranslatedText text="Last 30 days" /></option>
              <option value="90"><TranslatedText text="Last 90 days" /></option>
              <option value="365"><TranslatedText text="Last year" /></option>
            </select>
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            <TranslatedText text="Transaction History" />
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            <TranslatedText text="Showing" /> {filteredTransactions.length} <TranslatedText text="of" /> {transactions.length} <TranslatedText text="transactions" />
          </p>
        </div>

        {isLoading ? (
          <div className="p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600"><TranslatedText text="Loading transactions..." /></p>
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="p-12 text-center">
            <FaHistory className="mx-auto text-4xl text-gray-400 mb-4" />
            <p className="text-gray-600"><TranslatedText text="No transactions found" /></p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <TranslatedText text="Date & Time" />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <TranslatedText text="Tenant" />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <TranslatedText text="Type" />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <TranslatedText text="Description" />
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <TranslatedText text="Amount" />
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <TranslatedText text="Balance After" />
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredTransactions.map((transaction: CreditTransaction) => (
                  <tr key={transaction.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(transaction.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {transaction.creditAccount?.tenant?.name || transaction.tenant?.name || 'Unknown'}
                        </p>
                        <p className="text-xs text-gray-500">
                          {transaction.tenantId ? `${transaction.tenantId.substring(0, 8)}...` : 'N/A'}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${getTypeColor(transaction.type)}`}>
                        {getTypeIcon(transaction.type)}
                        {transaction.type.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {transaction.description}
                      {transaction.referenceType && (
                        <span className="ml-2 text-xs text-gray-500">
                          ({transaction.referenceType})
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <span className={`text-sm font-semibold ${
                        transaction.type === 'CONSUMPTION' ? 'text-red-600' : 'text-green-600'
                      }`}>
                        {transaction.type === 'CONSUMPTION' ? '-' : '+'}
                        {Number(transaction.amount).toLocaleString()}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-gray-900">
                      {Number(transaction.balanceAfter).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminPageLayout>
  );
};

export default CreditUsageHistory;
