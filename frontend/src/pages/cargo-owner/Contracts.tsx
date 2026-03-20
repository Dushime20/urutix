import { useState } from 'react';
import { FileText, Search, Filter, Download, Eye } from 'lucide-react';
import { TranslatedText } from '../../components/translated-text';
import { useTranslation } from '../../hooks/useTranslation';

interface Contract {
  id: string;
  contractNumber: string;
  cargoDescription: string;
  truckOwner: string;
  status: 'active' | 'completed' | 'pending' | 'cancelled';
  startDate: string;
  endDate: string;
  amount: number;
}

const Contracts = () => {
  const { tSync } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Mock data - replace with actual API call
  const contracts: Contract[] = [
    {
      id: '1',
      contractNumber: 'CNT-2024-001',
      cargoDescription: 'Electronics - 5 tons',
      truckOwner: 'ABC Transport Ltd',
      status: 'active',
      startDate: '2024-01-15',
      endDate: '2024-01-20',
      amount: 150000,
    },
    {
      id: '2',
      contractNumber: 'CNT-2024-002',
      cargoDescription: 'Construction Materials - 10 tons',
      truckOwner: 'XYZ Logistics',
      status: 'completed',
      startDate: '2024-01-10',
      endDate: '2024-01-15',
      amount: 250000,
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredContracts = contracts.filter((contract) => {
    const matchesSearch =
      contract.contractNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contract.cargoDescription.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contract.truckOwner.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || contract.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2"><TranslatedText text="My Contracts" /></h1>
        <p className="text-gray-600"><TranslatedText text="View and manage your cargo transportation contracts" /></p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder={tSync('Search contracts...')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          {/* Status Filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent appearance-none"
            >
              <option value="all"><TranslatedText text="All Status" /></option>
              <option value="active"><TranslatedText text="Active" /></option>
              <option value="completed"><TranslatedText text="Completed" /></option>
              <option value="pending"><TranslatedText text="Pending" /></option>
              <option value="cancelled"><TranslatedText text="Cancelled" /></option>
            </select>
          </div>
        </div>
      </div>

      {/* Contracts List */}
      <div className="space-y-4">
        {filteredContracts.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2"><TranslatedText text="No contracts found" /></h3>
            <p className="text-gray-600">
              {searchTerm || statusFilter !== 'all'
                ? <TranslatedText text="Try adjusting your filters" />
                : <TranslatedText text="Your contracts will appear here once you book cargo shipments" />}
            </p>
          </div>
        ) : (
          filteredContracts.map((contract) => (
            <div key={contract.id} className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{contract.contractNumber}</h3>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(contract.status)}`}>
                      <TranslatedText text={contract.status.charAt(0).toUpperCase() + contract.status.slice(1)} />
                    </span>
                  </div>
                  <p className="text-gray-600 mb-1">{contract.cargoDescription}</p>
                  <p className="text-sm text-gray-500"><TranslatedText text="Truck Owner" />: {contract.truckOwner}</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-gray-900">RWF {contract.amount.toLocaleString()}</p>
                  <p className="text-sm text-gray-500">
                    {new Date(contract.startDate).toLocaleDateString()} - {new Date(contract.endDate).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div className="flex gap-2 pt-4 border-t border-gray-200">
                <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-primary-600 hover:bg-primary-50 rounded-lg transition-colors">
                  <Eye className="w-4 h-4" />
                  <TranslatedText text="View Details" />
                </button>
                <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                  <Download className="w-4 h-4" />
                  <TranslatedText text="Download PDF" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Contracts;
