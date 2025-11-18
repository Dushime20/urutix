import React, { useState, useEffect } from 'react';
import { 
  FaPlus, FaEdit, FaTrash, FaEye, FaDownload, FaFilter, FaSearch,
  FaGasPump, FaTools, FaRoad, FaUserTie, FaShieldAlt, FaUniversity, FaReceipt,
  FaCalendar, FaTruck, FaMapMarkerAlt, FaDollarSign, FaCheckCircle, FaTimesCircle, FaClock
} from 'react-icons/fa';

interface Expense {
  id: string;
  type: 'fuel' | 'maintenance' | 'toll' | 'driver' | 'insurance' | 'tax' | 'other';
  category: string;
  amount: number;
  date: string;
  description: string;
  truckId?: string;
  driverId?: string;
  tripId?: string;
  receipt?: string;
  status: 'pending' | 'approved' | 'rejected' | 'paid';
  taxDeductible: boolean;
  allocationPercentage: number;
  location?: string;
  vendor?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

interface Truck {
  id: string;
  plateNumber: string;
  make: string;
  model: string;
}

interface Driver {
  id: string;
  name: string;
  licenseNumber: string;
}

interface Trip {
  id: string;
  tripNumber: string;
  origin: string;
  destination: string;
}

const ExpenseManagement: React.FC = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [trucks, setTrucks] = useState<Truck[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [filters, setFilters] = useState({
    type: '',
    status: '',
    truckId: '',
    dateRange: '',
    minAmount: '',
    maxAmount: ''
  });
  const [searchTerm, setSearchTerm] = useState('');

  // Mock data - replace with API calls
  useEffect(() => {
    setExpenses([
      {
        id: '1',
        type: 'fuel',
        category: 'Diesel',
        amount: 450.00,
        date: '2024-08-10',
        description: 'Fuel refill at Shell Station',
        truckId: 'TRK-001',
        status: 'paid',
        taxDeductible: true,
        allocationPercentage: 100,
        location: 'Shell Station, I-95 Exit 45',
        vendor: 'Shell Oil Company',
        notes: 'Regular fuel stop during trip',
        createdAt: '2024-08-10T10:00:00Z',
        updatedAt: '2024-08-10T10:00:00Z'
      },
      {
        id: '2',
        type: 'maintenance',
        category: 'Oil Change',
        amount: 120.00,
        date: '2024-08-08',
        description: 'Regular oil change and filter replacement',
        truckId: 'TRK-001',
        status: 'paid',
        taxDeductible: true,
        allocationPercentage: 100,
        location: 'Quick Lube Express',
        vendor: 'Quick Lube Express',
        notes: 'Scheduled maintenance',
        createdAt: '2024-08-08T14:30:00Z',
        updatedAt: '2024-08-08T14:30:00Z'
      },
      {
        id: '3',
        type: 'toll',
        category: 'Highway Tolls',
        amount: 85.50,
        date: '2024-08-09',
        description: 'I-95 and I-80 toll charges',
        tripId: 'TRP-001',
        status: 'paid',
        taxDeductible: true,
        allocationPercentage: 100,
        location: 'I-95 & I-80 Interchange',
        vendor: 'State Highway Authority',
        notes: 'Toll charges for trip TRP-001',
        createdAt: '2024-08-09T16:15:00Z',
        updatedAt: '2024-08-09T16:15:00Z'
      }
    ]);

    setTrucks([
      { id: 'TRK-001', plateNumber: 'ABC-123', make: 'Freightliner', model: 'Cascadia' },
      { id: 'TRK-002', plateNumber: 'XYZ-789', make: 'Peterbilt', model: '579' }
    ]);

    setDrivers([
      { id: 'DRV-001', name: 'John Smith', licenseNumber: 'DL123456789' },
      { id: 'DRV-002', name: 'Mike Johnson', licenseNumber: 'DL987654321' }
    ]);

    setTrips([
      { id: 'TRP-001', tripNumber: 'TRIP-2024-001', origin: 'Los Angeles, CA', destination: 'New York, NY' },
      { id: 'TRP-002', tripNumber: 'TRIP-2024-002', origin: 'Chicago, IL', destination: 'Miami, FL' }
    ]);
  }, []);

  const expenseTypes = [
    { value: 'fuel', label: 'Fuel', icon: FaGasPump, color: 'text-blue-600' },
    { value: 'maintenance', label: 'Maintenance', icon: FaTools, color: 'text-orange-600' },
    { value: 'toll', label: 'Tolls', icon: FaRoad, color: 'text-green-600' },
    { value: 'driver', label: 'Driver', icon: FaUserTie, color: 'text-purple-600' },
    { value: 'insurance', label: 'Insurance', icon: FaShieldAlt, color: 'text-red-600' },
    { value: 'tax', label: 'Tax', icon: FaUniversity, color: 'text-indigo-600' },
    { value: 'other', label: 'Other', icon: FaReceipt, color: 'text-gray-600' }
  ];

  const getExpenseIcon = (type: string) => {
    const expenseType = expenseTypes.find(t => t.value === type);
    return expenseType ? expenseType.icon : FaReceipt;
  };

  const getExpenseColor = (type: string) => {
    const expenseType = expenseTypes.find(t => t.value === type);
    return expenseType ? expenseType.color : 'text-gray-600';
  };

  const getStatusColor = (status: string) => {
    const colors = {
      pending: 'text-yellow-600 bg-yellow-100',
      approved: 'text-blue-600 bg-blue-100',
      rejected: 'text-red-600 bg-red-100',
      paid: 'text-green-600 bg-green-100'
    };
    return colors[status] || 'text-gray-600 bg-gray-100';
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const filteredExpenses = expenses.filter(expense => {
    const matchesSearch = expense.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         expense.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         expense.vendor?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = !filters.type || expense.type === filters.type;
    const matchesStatus = !filters.status || expense.status === filters.status;
    const matchesTruck = !filters.truckId || expense.truckId === filters.truckId;
    
    let matchesAmount = true;
    if (filters.minAmount && expense.amount < parseFloat(filters.minAmount)) matchesAmount = false;
    if (filters.maxAmount && expense.amount > parseFloat(filters.maxAmount)) matchesAmount = false;

    return matchesSearch && matchesType && matchesStatus && matchesTruck && matchesAmount;
  });

  const totalExpenses = filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  const taxDeductibleAmount = filteredExpenses
    .filter(expense => expense.taxDeductible)
    .reduce((sum, expense) => sum + expense.amount, 0);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Expense Management</h1>
          <p className="text-gray-600 mt-2">Track and manage all your trucking business expenses</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Expenses</p>
                <p className="text-2xl font-bold text-red-600">{formatCurrency(totalExpenses)}</p>
              </div>
              <div className="p-3 bg-red-100 rounded-full">
                <FaReceipt className="w-6 h-6 text-red-600" />
              </div>
            </div>
            <p className="text-sm text-gray-500 mt-2">{filteredExpenses.length} expenses</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Tax Deductible</p>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(taxDeductibleAmount)}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <FaUniversity className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <p className="text-sm text-gray-500 mt-2">
              {taxDeductibleAmount > 0 ? `${((taxDeductibleAmount / totalExpenses) * 100).toFixed(1)}%` : '0%'} of total
            </p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending Approval</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {formatCurrency(expenses.filter(e => e.status === 'pending').reduce((sum, e) => sum + e.amount, 0))}
                </p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-full">
                <FaClock className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
            <p className="text-sm text-gray-500 mt-2">
              {expenses.filter(e => e.status === 'pending').length} expenses pending
            </p>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
              <select
                value={filters.type}
                onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Types</option>
                {expenseTypes.map(type => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="paid">Paid</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Truck</label>
              <select
                value={filters.truckId}
                onChange={(e) => setFilters({ ...filters, truckId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Trucks</option>
                {trucks.map(truck => (
                  <option key={truck.id} value={truck.id}>{truck.plateNumber}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Min Amount</label>
              <input
                type="number"
                value={filters.minAmount}
                onChange={(e) => setFilters({ ...filters, minAmount: e.target.value })}
                placeholder="0.00"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Max Amount</label>
              <input
                type="number"
                value={filters.maxAmount}
                onChange={(e) => setFilters({ ...filters, maxAmount: e.target.value })}
                placeholder="1000.00"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="flex items-end">
              <button
                onClick={() => setFilters({
                  type: '', status: '', truckId: '', dateRange: '', minAmount: '', maxAmount: ''
                })}
                className="w-full px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
              >
                Clear Filters
              </button>
            </div>
          </div>

          <div className="mt-4">
            <div className="relative">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search expenses by description, category, or vendor..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Expenses</h2>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2"
          >
            <FaPlus className="w-4 h-4" />
            <span>Add Expense</span>
          </button>
        </div>

        {/* Expenses Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Expense</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tax Deductible</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredExpenses.map((expense) => {
                  const IconComponent = getExpenseIcon(expense.type);
                  const iconColor = getExpenseColor(expense.type);
                  
                  return (
                    <tr key={expense.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
                              <IconComponent className={`w-5 h-5 ${iconColor}`} />
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{expense.description}</div>
                            <div className="text-sm text-gray-500">
                              {expense.category} • {expense.vendor}
                            </div>
                            {expense.truckId && (
                              <div className="text-xs text-gray-400">
                                Truck: {trucks.find(t => t.id === expense.truckId)?.plateNumber}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold text-gray-900">{formatCurrency(expense.amount)}</div>
                        <div className="text-sm text-gray-500">{expense.allocationPercentage}% allocated</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(expense.date)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(expense.status)}`}>
                          {expense.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {expense.taxDeductible ? (
                          <FaCheckCircle className="w-5 h-5 text-green-500" />
                        ) : (
                          <FaTimesCircle className="w-5 h-5 text-red-500" />
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => {
                              setSelectedExpense(expense);
                              setShowViewModal(true);
                            }}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            <FaEye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedExpense(expense);
                              setShowEditModal(true);
                            }}
                            className="text-indigo-600 hover:text-indigo-900"
                          >
                            <FaEdit className="w-4 h-4" />
                          </button>
                          <button className="text-red-600 hover:text-red-900">
                            <FaTrash className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Empty State */}
        {filteredExpenses.length === 0 && (
          <div className="text-center py-12">
            <FaReceipt className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No expenses found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || Object.values(filters).some(f => f) 
                ? 'Try adjusting your search or filters.'
                : 'Get started by adding your first expense.'
              }
            </p>
            {!searchTerm && !Object.values(filters).some(f => f) && (
              <div className="mt-6">
                <button
                  onClick={() => setShowAddModal(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  <FaPlus className="-ml-1 mr-2 h-4 w-4" />
                  Add Expense
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add/Edit/View Modals would go here */}
      {/* For now, we'll just show the basic structure */}
    </div>
  );
};

export default ExpenseManagement;
