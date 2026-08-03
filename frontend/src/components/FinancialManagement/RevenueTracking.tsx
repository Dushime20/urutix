import React, { useState, useEffect, useMemo } from 'react';
import { 
  FaDollarSign, FaChartLine, FaCreditCard, FaWallet, FaTruck, FaMapMarkerAlt,
  FaCalendar, FaClock, FaCheckCircle, FaTimesCircle, FaHourglassHalf, FaDownload,
  FaFilter, FaSearch, FaPlus, FaEye, FaEdit, FaTrash, FaRoute, FaUserTie
} from 'react-icons/fa';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';

import { useCurrencyFormat } from '../../hooks/useCurrencyFormat';
import { StandardDataTable, StatusBadge, type Column, type TableAction } from '../EnliteUI/Tables';
interface Revenue {
  id: string;
  tripId: string;
  tripNumber: string;
  customerName: string;
  customerId: string;
  amount: number;
  date: string;
  status: 'pending' | 'completed' | 'overdue' | 'cancelled';
  paymentMethod: 'credit_card' | 'ach_transfer' | 'wire_transfer' | 'check' | 'cash';
  origin: string;
  destination: string;
  distance: number;
  fuelCost: number;
  tollCost: number;
  maintenanceCost: number;
  driverCost: number;
  netProfit: number;
  profitMargin: number;
  dueDate: string;
  paidDate?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

interface Trip {
  id: string;
  tripNumber: string;
  origin: string;
  destination: string;
  status: 'planned' | 'in_progress' | 'completed' | 'cancelled';
  startDate: string;
  endDate: string;
  driverName: string;
  truckPlate: string;
}

const RevenueTracking: React.FC = () => {
  const { format: formatCurrency, compact: fmtMoney, compactIn: fmtIn } = useCurrencyFormat();
  const [revenues, setRevenues] = useState<Revenue[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [filters, setFilters] = useState({
    status: '',
    customerId: '',
    dateRange: '',
    minAmount: '',
    maxAmount: '',
    paymentMethod: ''
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [showAddModal, setShowAddModal] = useState(false);

  // Mock data - replace with API calls
  useEffect(() => {
    setRevenues([
      {
        id: '1',
        tripId: 'TRP-001',
        tripNumber: 'TRIP-2024-001',
        customerName: 'TechCorp Industries',
        customerId: 'CUST-001',
        amount: 2500.00,
        date: '2024-08-10',
        status: 'completed',
        paymentMethod: 'ach_transfer',
        origin: 'Los Angeles, CA',
        destination: 'New York, NY',
        distance: 2800,
        fuelCost: 450.00,
        tollCost: 85.50,
        maintenanceCost: 120.00,
        driverCost: 800.00,
        netProfit: 1044.50,
        profitMargin: 41.8,
        dueDate: '2024-08-10',
        paidDate: '2024-08-10',
        notes: 'On-time delivery, customer satisfied',
        createdAt: '2024-08-10T10:00:00Z',
        updatedAt: '2024-08-10T10:00:00Z'
      },
      {
        id: '2',
        tripId: 'TRP-002',
        tripNumber: 'TRIP-2024-002',
        customerName: 'MedSupply Corp',
        customerId: 'CUST-002',
        amount: 3200.00,
        date: '2024-08-12',
        status: 'pending',
        paymentMethod: 'credit_card',
        origin: 'Chicago, IL',
        destination: 'Miami, FL',
        distance: 1400,
        fuelCost: 280.00,
        tollCost: 45.00,
        maintenanceCost: 0,
        driverCost: 600.00,
        netProfit: 2275.00,
        profitMargin: 71.1,
        dueDate: '2024-08-19',
        notes: 'Medical supplies delivery, priority shipment',
        createdAt: '2024-08-12T08:00:00Z',
        updatedAt: '2024-08-12T08:00:00Z'
      },
      {
        id: '3',
        tripId: 'TRP-003',
        tripNumber: 'TRIP-2024-003',
        customerName: 'AutoParts Express',
        customerId: 'CUST-003',
        amount: 1800.00,
        date: '2024-08-08',
        status: 'overdue',
        paymentMethod: 'check',
        origin: 'Detroit, MI',
        destination: 'Atlanta, GA',
        distance: 750,
        fuelCost: 150.00,
        tollCost: 25.00,
        maintenanceCost: 0,
        driverCost: 400.00,
        netProfit: 1225.00,
        profitMargin: 68.1,
        dueDate: '2024-08-15',
        notes: 'Payment delayed, following up with customer',
        createdAt: '2024-08-08T12:00:00Z',
        updatedAt: '2024-08-08T12:00:00Z'
      }
    ]);

    setTrips([
      {
        id: 'TRP-001',
        tripNumber: 'TRIP-2024-001',
        origin: 'Los Angeles, CA',
        destination: 'New York, NY',
        status: 'completed',
        startDate: '2024-08-05',
        endDate: '2024-08-10',
        driverName: 'John Smith',
        truckPlate: 'ABC-123'
      },
      {
        id: 'TRP-002',
        tripNumber: 'TRIP-2024-002',
        origin: 'Chicago, IL',
        destination: 'Miami, FL',
        status: 'completed',
        startDate: '2024-08-10',
        endDate: '2024-08-12',
        driverName: 'Mike Johnson',
        truckPlate: 'XYZ-789'
      },
      {
        id: 'TRP-003',
        tripNumber: 'TRIP-2024-003',
        origin: 'Detroit, MI',
        destination: 'Atlanta, GA',
        status: 'completed',
        startDate: '2024-08-03',
        endDate: '2024-08-08',
        driverName: 'John Smith',
        truckPlate: 'ABC-123'
      }
    ]);
  }, []);

  const paymentMethods = [
    { value: 'credit_card', label: 'Credit Card', icon: FaCreditCard },
    { value: 'ach_transfer', label: 'ACH Transfer', icon: FaWallet },
    { value: 'wire_transfer', label: 'Wire Transfer', icon: FaDollarSign },
    { value: 'check', label: 'Check', icon: FaCreditCard },
    { value: 'cash', label: 'Cash', icon: FaDollarSign }
  ];

  const getStatusColor = (status: string) => {
    const colors = {
      pending: 'text-yellow-600 bg-yellow-100',
      completed: 'text-green-600 bg-green-100',
      overdue: 'text-red-600 bg-red-100',
      cancelled: 'text-gray-600 bg-gray-100'
    };
    return colors[status] || 'text-gray-600 bg-gray-100';
  };

  const getStatusIcon = (status: string) => {
    const icons = {
      pending: FaClock,
      completed: FaCheckCircle,
      overdue: FaTimesCircle,
      cancelled: FaTimesCircle
    };
    return icons[status] || FaClock;
  };

  const getPaymentMethodIcon = (method: string) => {
    const paymentMethod = paymentMethods.find(pm => pm.value === method);
    return paymentMethod ? paymentMethod.icon : FaCreditCard;
  };

  // formatCurrency provided by useCurrencyFormat hook

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatDistance = (miles: number) => {
    return `${miles.toLocaleString()} mi`;
  };

  const revenueColumns: Column<Revenue>[] = useMemo(() => [
    {
      key: 'tripNumber',
      label: 'Trip Details',
      sortable: true,
      render: (_v, revenue) => (
        <div className="flex items-center">
          <div className="flex-shrink-0 h-10 w-10">
            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
              <FaTruck className="w-5 h-5 text-blue-600" />
            </div>
          </div>
          <div className="ml-4">
            <div className="text-sm font-medium text-gray-900">{revenue.tripNumber}</div>
            <div className="text-sm text-gray-500">{revenue.customerName}</div>
            <div className="text-xs text-gray-400">
              <FaMapMarkerAlt className="inline w-3 h-3 mr-1" />
              {revenue.origin} → {revenue.destination}
            </div>
            <div className="text-xs text-gray-400">
              {formatDistance(revenue.distance)} • {formatDate(revenue.date)}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: 'amount',
      label: 'Revenue',
      sortable: true,
      render: (_v, revenue) => (
        <div>
          <div className="text-sm font-semibold text-gray-900">{formatCurrency(revenue.amount)}</div>
          <div className="text-sm text-gray-500">Due: {formatDate(revenue.dueDate)}</div>
        </div>
      ),
    },
    {
      key: 'netProfit',
      label: 'Profit',
      sortable: true,
      render: (_v, revenue) => (
        <div>
          <div className="text-sm font-semibold text-green-600">{formatCurrency(revenue.netProfit)}</div>
          <div className="text-sm text-gray-500">{revenue.profitMargin.toFixed(1)}% margin</div>
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (_v, revenue) => {
        const StatusIcon = getStatusIcon(revenue.status);
        return (
          <div className="flex items-center gap-2">
            <StatusIcon className="w-4 h-4" />
            <StatusBadge status={revenue.status} label={revenue.status} />
          </div>
        );
      },
    },
    {
      key: 'paymentMethod',
      label: 'Payment',
      render: (_v, revenue) => {
        const PaymentIcon = getPaymentMethodIcon(revenue.paymentMethod);
        return (
          <div>
            <div className="flex items-center">
              <PaymentIcon className="w-4 h-4 mr-2 text-gray-400" />
              <span className="text-sm text-gray-900 capitalize">
                {revenue.paymentMethod.replace(/_/g, ' ')}
              </span>
            </div>
            {revenue.paidDate && (
              <div className="text-xs text-gray-500">Paid: {formatDate(revenue.paidDate)}</div>
            )}
          </div>
        );
      },
    },
  ], [formatCurrency]);

  const revenueActions: TableAction<Revenue>[] = useMemo(() => [
    { key: 'view', label: 'View', icon: <FaEye className="w-4 h-4" />, onClick: () => {} },
    { key: 'edit', label: 'Edit', icon: <FaEdit className="w-4 h-4" />, onClick: () => {} },
    { key: 'delete', label: 'Delete', icon: <FaTrash className="w-4 h-4" />, variant: 'danger', onClick: () => {} },
  ], []);

  const filteredRevenues = revenues.filter(revenue => {
    const matchesSearch = revenue.tripNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         revenue.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         revenue.origin.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         revenue.destination.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = !filters.status || revenue.status === filters.status;
    const matchesCustomer = !filters.customerId || revenue.customerId === filters.customerId;
    const matchesPaymentMethod = !filters.paymentMethod || revenue.paymentMethod === filters.paymentMethod;
    
    let matchesAmount = true;
    if (filters.minAmount && revenue.amount < parseFloat(filters.minAmount)) matchesAmount = false;
    if (filters.maxAmount && revenue.amount > parseFloat(filters.maxAmount)) matchesAmount = false;

    return matchesSearch && matchesStatus && matchesCustomer && matchesPaymentMethod && matchesAmount;
  });

  const totalRevenue = filteredRevenues.reduce((sum, revenue) => sum + revenue.amount, 0);
  const totalProfit = filteredRevenues.reduce((sum, revenue) => sum + revenue.netProfit, 0);
  const averageProfitMargin = filteredRevenues.length > 0 
    ? filteredRevenues.reduce((sum, revenue) => sum + revenue.profitMargin, 0) / filteredRevenues.length 
    : 0;
  const pendingPayments = filteredRevenues
    .filter(revenue => revenue.status === 'pending')
    .reduce((sum, revenue) => sum + revenue.amount, 0);

  const overduePayments = filteredRevenues
    .filter(revenue => revenue.status === 'overdue')
    .reduce((sum, revenue) => sum + revenue.amount, 0);

  const monthlyRevenue = [4200, 3800, 4500, 5200, 4800, 5700, 6100, 5800, 6500, 7200, 6800, 7500];
  const profitTrend = [1800, 1600, 1900, 2200, 2000, 2400, 2600, 2400, 2800, 3100, 2900, 3300];

  const revenueByStatus = [
    { name: 'Completed', value: revenues.filter(r => r.status === 'completed').reduce((sum, r) => sum + r.amount, 0), color: '#10B981' },
    { name: 'Pending', value: revenues.filter(r => r.status === 'pending').reduce((sum, r) => sum + r.amount, 0), color: '#F59E0B' },
    { name: 'Overdue', value: revenues.filter(r => r.status === 'overdue').reduce((sum, r) => sum + r.amount, 0), color: '#EF4444' },
    { name: 'Cancelled', value: revenues.filter(r => r.status === 'cancelled').reduce((sum, r) => sum + r.amount, 0), color: '#6B7280' }
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Revenue Tracking</h1>
          <p className="text-gray-600 mt-2">Monitor your trip revenue, payments, and profitability</p>
        </div>

        {/* Period Selector */}
        <div className="mb-6">
          <div className="flex items-center space-x-4">
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="quarter">This Quarter</option>
              <option value="year">This Year</option>
            </select>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(totalRevenue)}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <FaDollarSign className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <p className="text-sm text-gray-500 mt-2">{filteredRevenues.length} trips</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Net Profit</p>
                <p className="text-2xl font-bold text-blue-600">{formatCurrency(totalProfit)}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <FaChartLine className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <p className="text-sm text-gray-500 mt-2">{averageProfitMargin.toFixed(1)}% avg margin</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending Payments</p>
                <p className="text-2xl font-bold text-yellow-600">{formatCurrency(pendingPayments)}</p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-full">
                <FaClock className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
            <p className="text-sm text-gray-500 mt-2">
              {revenues.filter(r => r.status === 'pending').length} payments
            </p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Overdue</p>
                <p className="text-2xl font-bold text-red-600">{formatCurrency(overduePayments)}</p>
              </div>
              <div className="p-3 bg-red-100 rounded-full">
                <FaTimesCircle className="w-6 h-6 text-red-600" />
              </div>
            </div>
            <p className="text-sm text-gray-500 mt-2">
              {revenues.filter(r => r.status === 'overdue').length} overdue
            </p>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Revenue Trend */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue & Profit Trend</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyRevenue.map((revenue, index) => ({ 
                month: `Month ${index + 1}`, 
                revenue, 
                profit: profitTrend[index] 
              }))}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                <Line type="monotone" dataKey="revenue" stroke="#10B981" strokeWidth={2} name="Revenue" />
                <Line type="monotone" dataKey="profit" stroke="#3B82F6" strokeWidth={2} name="Profit" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Revenue by Status */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue by Status</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={revenueByStatus}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${formatCurrency(value)}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {revenueByStatus.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatCurrency(Number(value))} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="completed">Completed</option>
                <option value="overdue">Overdue</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Payment Method</label>
              <select
                value={filters.paymentMethod}
                onChange={(e) => setFilters({ ...filters, paymentMethod: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Methods</option>
                {paymentMethods.map(method => (
                  <option key={method.value} value={method.value}>{method.label}</option>
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
                placeholder="10000.00"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="flex items-end">
              <button
                onClick={() => setFilters({
                  status: '', customerId: '', dateRange: '', minAmount: '', maxAmount: '', paymentMethod: ''
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
                placeholder="Search by trip number, customer, origin, or destination..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Revenue Details</h2>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2"
          >
            <FaPlus className="w-4 h-4" />
            <span>Add Revenue</span>
          </button>
        </div>

        {/* Revenue Table */}
        <StandardDataTable
          columns={revenueColumns}
          data={filteredRevenues}
          getRowId={(row) => row.id}
          searchable={false}
          pagination
          columnVisibility
          stickyHeader
          striped
          hoverable
          rowActions={revenueActions}
          emptyMessage="No revenue found"
          ariaLabel="Revenue details"
        />
      </div>

      {/* Add/Edit/View Modals would go here */}
      {/* For now, we'll just show the basic structure */}
    </div>
  );
};

export default RevenueTracking;
