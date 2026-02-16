import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Plus, Filter, Search, Eye, CreditCard, DollarSign } from 'lucide-react';
import { paymentsAPI } from '../services/api';
import { TranslatedText } from '../components/translated-text';

const Payments = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const { data: payments, isLoading } = useQuery({
    queryKey: ['payments', searchTerm, statusFilter],
    queryFn: () => paymentsAPI.getAll({ search: searchTerm, status: statusFilter !== 'all' ? statusFilter : undefined }),
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border border-gray-200 px-4 py-3 mb-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-gradient-to-br from-gray-500 to-gray-600">
              <CreditCard className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">
                <TranslatedText text="Payments" />
              </h1>
              <p className="text-xs text-gray-600 mt-0.5">
                <TranslatedText text="Manage your financial transactions" />
              </p>
            </div>
          </div>
          <button 
            className="text-white px-3 py-1.5 text-sm rounded-lg flex items-center gap-1.5 transition-colors"
            style={{ backgroundColor: '#345E85' }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#2A4D6E'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#345E85'}
          >
            <Plus className="w-3.5 h-3.5" />
            <TranslatedText text="New Payment" />
          </button>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg border border-gray-200 p-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400 w-3.5 h-3.5" />
              <input
                type="text"
                placeholder="Search payments..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-2.5 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all"><TranslatedText text="All Status" /></option>
              <option value="completed"><TranslatedText text="Completed" /></option>
              <option value="pending"><TranslatedText text="Pending" /></option>
              <option value="failed"><TranslatedText text="Failed" /></option>
            </select>
            <button className="px-2.5 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-1.5 transition-colors">
              <Filter className="w-3.5 h-3.5" />
              <TranslatedText text="Filters" />
            </button>
          </div>
        </div>
      </div>

      {/* Payments List */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="p-3 border-b border-gray-200">
          <h2 className="text-sm font-semibold text-gray-900">
            <TranslatedText text="All Payments" />
          </h2>
        </div>
        <div className="divide-y divide-gray-200">
          {isLoading ? (
            <div className="p-4 text-center text-xs text-gray-500">
              <TranslatedText text="Loading payments..." />
            </div>
          ) : !payments?.data?.payments?.length ? (
            <div className="p-4 text-center text-xs text-gray-500">
              <TranslatedText text="No payments found" />
            </div>
          ) : (
            payments?.data?.payments?.map((payment: any) => (
              <div key={payment.id} className="p-3 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1.5">
                      <h3 className="text-sm font-medium text-gray-900">
                        {payment.referenceNumber}
                      </h3>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${getStatusColor(payment.status)}`}>
                        {payment.status}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs text-gray-600">
                      <div className="flex items-center space-x-1.5">
                        <DollarSign className="w-3.5 h-3.5" />
                        <span>${payment.amount?.toLocaleString()} {payment.currency}</span>
                      </div>
                      <div className="flex items-center space-x-1.5">
                        <CreditCard className="w-3.5 h-3.5" />
                        <span>{payment.paymentMethod}</span>
                      </div>
                      <div className="flex items-center space-x-1.5">
                        <span>Trip: {payment.trip?.tripNumber || 'N/A'}</span>
                      </div>
                    </div>
                    <div className="mt-1.5 text-xs text-gray-500">
                      <span>Created: {new Date(payment.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <button className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors" title="View Details">
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Payments; 