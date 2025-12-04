import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  FaDollarSign, 
  FaClock, 
  FaCheckCircle, 
  FaExclamationTriangle,
  FaCalendarAlt,
  FaChartLine,
  FaPlus,
  FaEye,
  FaDownload,
  FaFilter,
  FaSearch
} from 'react-icons/fa';
import { paymentsAPI } from '../../services/api';
import toast from 'react-hot-toast';
import AdvancePaymentRequestModal from './AdvancePaymentRequestModal';

interface PaymentForecast {
  id: string;
  tripId: string;
  tripNumber: string;
  amount: number;
  currency: string;
  dueDate: Date;
  status: 'pending' | 'processing' | 'completed' | 'overdue';
  paymentType: 'advance' | 'final';
  cargoOwnerName: string;
  canRequestAdvance: boolean;
}

interface FinancialSummary {
  totalPending: number;
  totalUpcoming: number;
  totalReceived: number;
  overdueAmount: number;
  averagePaymentDelay: number;
  paymentReliability: number;
}

const TruckOwnerFinancialDashboard: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateRange, setDateRange] = useState('30'); // days
  const [advanceModalOpen, setAdvanceModalOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<PaymentForecast | null>(null);

  // Fetch payment forecast
  const { data: forecastData, isLoading: forecastLoading, refetch: refetchForecast } = useQuery({
    queryKey: ['payment-forecast', dateRange],
    queryFn: async () => {
      try {
        const response = await paymentsAPI.getForecast({ days: parseInt(dateRange) });
        console.log('📊 Forecast API Response:', response);
        console.log('📊 Forecast Data:', response?.data?.forecast || response?.forecast);
        return response;
      } catch (error) {
        console.error('Error fetching payment forecast:', error);
        return { forecast: { payments: [], totalUpcoming: 0, totalPending: 0, totalOverdue: 0 } };
      }
    },
  });

  // Fetch payments for detailed view
  const { data: paymentsData, isLoading: paymentsLoading, refetch } = useQuery({
    queryKey: ['truck-owner-payments', statusFilter],
    queryFn: async () => {
      try {
        const response = await paymentsAPI.getAll({ 
          status: statusFilter !== 'all' ? statusFilter : undefined 
        });
        return response;
      } catch (error) {
        console.error('Error fetching payments:', error);
        return { data: { payments: [] } };
      }
    },
  });

  const payments = paymentsData?.data?.payments || [];
  const forecast = forecastData?.data?.forecast || forecastData?.forecast || { payments: [], totalUpcoming: 0, totalPending: 0, totalOverdue: 0 };
  
  // Debug logging
  React.useEffect(() => {
    console.log('💳 Payments:', payments.length);
    console.log('📈 Forecast:', forecast);
    console.log('📈 Forecast Payments:', forecast.payments?.length || 0);
  }, [payments, forecast]);

  // Calculate financial summary
  const calculateSummary = (): FinancialSummary => {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    const pending = payments.filter(p => p.status === 'pending' || p.status === 'processing');
    const completed = payments.filter(p => p.status === 'completed');
    const overdue = payments.filter(p => {
      if (!p.dueDate) return false;
      const due = new Date(p.dueDate);
      return due < now && (p.status === 'pending' || p.status === 'processing');
    });

    const totalPending = pending.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
    const totalReceived = completed.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
    const overdueAmount = overdue.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);

    // Calculate upcoming payments (next 7 days)
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const upcoming = payments.filter(p => {
      if (!p.dueDate) return false;
      const due = new Date(p.dueDate);
      return due >= now && due <= sevenDaysFromNow && (p.status === 'pending' || p.status === 'processing');
    });
    const totalUpcoming = upcoming.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);

    // Calculate average payment delay
    const completedWithDates = completed.filter(p => p.processedAt && p.dueDate);
    let totalDelay = 0;
    completedWithDates.forEach(p => {
      const due = new Date(p.dueDate);
      const processed = new Date(p.processedAt);
      totalDelay += Math.max(0, (processed.getTime() - due.getTime()) / (1000 * 60 * 60 * 24));
    });
    const averagePaymentDelay = completedWithDates.length > 0 
      ? totalDelay / completedWithDates.length 
      : 0;

    // Calculate payment reliability (percentage of on-time payments)
    const onTimePayments = completedWithDates.filter(p => {
      const due = new Date(p.dueDate);
      const processed = new Date(p.processedAt);
      return processed <= due || (processed.getTime() - due.getTime()) / (1000 * 60 * 60 * 24) <= 1;
    }).length;
    const paymentReliability = completedWithDates.length > 0
      ? (onTimePayments / completedWithDates.length) * 100
      : 100;

    return {
      totalPending: forecast.totalPending || totalPending,
      totalUpcoming: forecast.totalUpcoming || totalUpcoming,
      totalReceived,
      overdueAmount: forecast.totalOverdue || overdueAmount,
      averagePaymentDelay: Math.round(averagePaymentDelay * 10) / 10,
      paymentReliability: Math.round(paymentReliability * 10) / 10,
    };
  };

  const summary = calculateSummary();

  // Generate payment forecast from API data
  const generateForecast = (): PaymentForecast[] => {
    // Use the forecast data from API if available
    const forecastData = forecast;
    console.log('🔍 Generating forecast from:', forecastData);
    
    if (forecastData.payments && Array.isArray(forecastData.payments) && forecastData.payments.length > 0) {
      console.log(`✅ Found ${forecastData.payments.length} payments in forecast API`);
      return forecastData.payments.map((p: any) => {
        const paymentType = p.paymentType || 'trip_payment';
        const status = p.status || 'pending';
        // Allow advance request for pending/processing payments that are not already advance payments
        const canRequest = (paymentType !== 'advance' && paymentType !== 'ADVANCE') && 
                          (status === 'pending' || status === 'processing' || status === 'PENDING' || status === 'PROCESSING');
        
        // Handle dueDate - could be Date object or string
        let dueDate: Date;
        if (p.dueDate instanceof Date) {
          dueDate = p.dueDate;
        } else if (typeof p.dueDate === 'string') {
          dueDate = new Date(p.dueDate);
        } else {
          dueDate = new Date();
        }
        
        return {
          id: p.id,
          tripId: p.tripId,
          tripNumber: p.tripNumber || 'N/A',
          amount: p.amount || 0,
          currency: p.currency || 'USD',
          dueDate,
          status: status === 'overdue' ? 'overdue' : status.toLowerCase(),
          paymentType: paymentType === 'advance' || paymentType === 'ADVANCE' ? 'advance' : 'final',
          cargoOwnerName: 'Unknown', // Will be populated from trip data
          canRequestAdvance: canRequest,
        };
      });
    }
    
    console.log('⚠️ No forecast API data, using fallback from payments list');

    // Fallback to generating from payments if forecast API not available
    const fallbackForecast: PaymentForecast[] = [];
    const now = new Date();
    const next30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    payments.forEach(payment => {
      if (!payment.dueDate) return;
      
      const dueDate = new Date(payment.dueDate);
      if (dueDate > next30Days) return;

      const paymentType = payment.paymentType || 'trip_payment';
      const status = payment.status || 'pending';
      const isOverdue = dueDate < now && (status === 'pending' || status === 'processing' || status === 'PENDING' || status === 'PROCESSING');
      
      // Allow advance request for pending/processing payments that are not already advance payments
      const canRequest = (paymentType !== 'advance' && paymentType !== 'ADVANCE') && 
                        (status === 'pending' || status === 'processing' || status === 'PENDING' || status === 'PROCESSING');
      
      fallbackForecast.push({
        id: payment.id,
        tripId: payment.tripId || '',
        tripNumber: payment.trip?.tripNumber || payment.referenceNumber || 'N/A',
        amount: parseFloat(payment.amount) || 0,
        currency: payment.currency || 'USD',
        dueDate,
        status: isOverdue ? 'overdue' : status.toLowerCase(),
        paymentType: paymentType === 'advance' || paymentType === 'ADVANCE' ? 'advance' : 'final',
        cargoOwnerName: payment.trip?.load?.cargoOwner?.name || 'Unknown',
        canRequestAdvance: canRequest,
      });
    });

    return fallbackForecast.sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());
  };

  const paymentForecast = generateForecast();

  // Filter forecast based on search
  const filteredForecast = paymentForecast.filter(p => {
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      return (
        p.tripNumber.toLowerCase().includes(search) ||
        p.cargoOwnerName.toLowerCase().includes(search) ||
        p.amount.toString().includes(search)
      );
    }
    return true;
  });

  const handleRequestAdvance = (payment: PaymentForecast) => {
    setSelectedPayment(payment);
    setAdvanceModalOpen(true);
  };

  const handleAdvanceRequestSuccess = () => {
    refetch();
    refetchForecast();
    setAdvanceModalOpen(false);
    setSelectedPayment(null);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-gray-100 text-gray-700 border-gray-300';
      case 'processing':
        return 'bg-gray-50 text-gray-600 border-gray-200';
      case 'pending':
        return 'bg-gray-50 text-gray-600 border-gray-200';
      case 'overdue':
        return 'bg-red-50 text-red-700 border-red-300';
      default:
        return 'bg-gray-50 text-gray-600 border-gray-200';
    }
  };

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <div className="space-y-4">
      {/* Financial Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Total Pending */}
        <div className="bg-white rounded-md border border-gray-200 p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-gray-600">Total Pending</span>
            <FaClock className="w-3.5 h-3.5 text-gray-500" />
          </div>
          <p className="text-lg font-semibold text-gray-900">
            {formatCurrency(summary.totalPending)}
          </p>
          <p className="text-[10px] text-gray-500 mt-1">
            {payments.filter(p => p.status === 'pending' || p.status === 'processing').length} payments
          </p>
        </div>

        {/* Upcoming (Next 7 Days) */}
        <div className="bg-white rounded-md border border-gray-200 p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-gray-600">Upcoming (7 days)</span>
            <FaCalendarAlt className="w-3.5 h-3.5 text-gray-500" />
          </div>
          <p className="text-lg font-semibold text-gray-900">
            {formatCurrency(summary.totalUpcoming)}
          </p>
          <p className="text-[10px] text-gray-500 mt-1">
            Next 7 days
          </p>
        </div>

        {/* Total Received */}
        <div className="bg-white rounded-md border border-gray-200 p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-gray-600">Total Received</span>
            <FaCheckCircle className="w-3.5 h-3.5 text-gray-500" />
          </div>
          <p className="text-lg font-semibold text-gray-900">
            {formatCurrency(summary.totalReceived)}
          </p>
          <p className="text-[10px] text-gray-500 mt-1">
            Last 30 days
          </p>
        </div>

        {/* Overdue */}
        <div className="bg-white rounded-md border border-gray-200 p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-gray-600">Overdue</span>
            <FaExclamationTriangle className="w-3.5 h-3.5 text-red-500" />
          </div>
          <p className="text-lg font-semibold text-red-700">
            {formatCurrency(summary.overdueAmount)}
          </p>
          <p className="text-[10px] text-gray-500 mt-1">
            Requires attention
          </p>
        </div>
      </div>

      {/* Payment Reliability Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="bg-white rounded-md border border-gray-200 p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-gray-600">Payment Reliability</span>
            <FaChartLine className="w-3.5 h-3.5 text-gray-500" />
          </div>
          <div className="flex items-center space-x-2">
            <div className="flex-1">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full ${
                    summary.paymentReliability >= 90 ? 'bg-gray-600' :
                    summary.paymentReliability >= 70 ? 'bg-gray-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${summary.paymentReliability}%` }}
                />
              </div>
            </div>
            <span className="text-sm font-semibold text-gray-900">
              {summary.paymentReliability}%
            </span>
          </div>
          <p className="text-[10px] text-gray-500 mt-1">
            On-time payment rate
          </p>
        </div>

        <div className="bg-white rounded-md border border-gray-200 p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-gray-600">Avg. Payment Delay</span>
            <FaClock className="w-3.5 h-3.5 text-gray-500" />
          </div>
          <p className="text-lg font-semibold text-gray-900">
            {summary.averagePaymentDelay} days
          </p>
          <p className="text-[10px] text-gray-500 mt-1">
            Average delay from due date
          </p>
        </div>
      </div>

      {/* Payment Forecast */}
      <div className="bg-white rounded-md border border-gray-200">
        <div className="p-3 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Payment Forecast</h3>
            <p className="text-xs text-gray-500 mt-0.5">Upcoming payments for the next 30 days</p>
          </div>
          <div className="flex items-center space-x-2">
            <div className="relative">
              <FaSearch className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3" />
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-7 pr-2 py-1 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500 w-32"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-2 py-1 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="completed">Completed</option>
              <option value="overdue">Overdue</option>
            </select>
          </div>
        </div>

        <div className="divide-y divide-gray-200">
          {(paymentsLoading || forecastLoading) ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-600 mx-auto"></div>
              <p className="text-xs text-gray-500 mt-2">Loading payments...</p>
            </div>
          ) : filteredForecast.length === 0 ? (
            <div className="p-8 text-center">
              <FaCalendarAlt className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-500">No upcoming payments found</p>
            </div>
          ) : (
            filteredForecast.map((payment) => {
              const isOverdue = payment.status === 'overdue';
              const daysUntilDue = Math.ceil(
                (payment.dueDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
              );

              return (
                <div
                  key={payment.id}
                  className={`p-3 hover:bg-gray-50 transition-colors ${
                    isOverdue ? 'bg-red-50/50' : ''
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="text-xs font-semibold text-gray-900">
                          {payment.tripNumber}
                        </span>
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium border ${getStatusColor(payment.status)}`}>
                          {payment.status.toUpperCase()}
                        </span>
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-600 border border-gray-200">
                          {payment.paymentType.toUpperCase()}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-gray-600">
                        <div>
                          <span className="text-gray-500">Amount:</span>{' '}
                          <span className="font-medium text-gray-900">
                            {formatCurrency(payment.amount, payment.currency)}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500">Due:</span>{' '}
                          <span className={`font-medium ${isOverdue ? 'text-red-700' : 'text-gray-900'}`}>
                            {payment.dueDate.toLocaleDateString()}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500">Cargo Owner:</span>{' '}
                          <span className="font-medium text-gray-900">{payment.cargoOwnerName}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">
                            {isOverdue ? 'Overdue by:' : 'Due in:'}
                          </span>{' '}
                          <span className={`font-medium ${isOverdue ? 'text-red-700' : 'text-gray-900'}`}>
                            {isOverdue ? `${Math.abs(daysUntilDue)} days` : `${daysUntilDue} days`}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-1.5 ml-4">
                      {payment.canRequestAdvance && (
                        <button
                          onClick={() => handleRequestAdvance(payment)}
                          className="px-2.5 py-1.5 text-xs font-medium text-white bg-gray-600 hover:bg-gray-700 rounded-md border border-gray-600 transition-colors flex items-center space-x-1"
                          title="Request Advance Payment"
                        >
                          <FaPlus className="w-3 h-3" />
                          <span>Request Advance</span>
                        </button>
                      )}
                      <button
                        className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
                        title="View Details"
                      >
                        <FaEye className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Advance Payment Request Modal */}
      {selectedPayment && (
        <AdvancePaymentRequestModal
          isOpen={advanceModalOpen}
          onClose={() => {
            setAdvanceModalOpen(false);
            setSelectedPayment(null);
          }}
          tripId={selectedPayment.tripId}
          tripNumber={selectedPayment.tripNumber}
          maxAmount={selectedPayment.amount * 0.7} // 70% of total as advance
          currency={selectedPayment.currency}
          onSuccess={handleAdvanceRequestSuccess}
        />
      )}
    </div>
  );
};

export default TruckOwnerFinancialDashboard;

