import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  FaDollarSign,
  FaCreditCard,
  FaMobileAlt,
  FaWallet,
  FaSave,
  FaEdit,
  FaCheckCircle,
  FaTimesCircle,
  FaUser,
  FaBuilding,
  FaFilter,
  FaSearch,
  FaArrowDown,
  FaArrowUp,
  FaInfoCircle
} from 'react-icons/fa';
import { paymentsAPI } from '../../services/api';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { cn } from '@/utils/cn';
import { 
  CheckCircle2, 
  Clock, 
  Box, 
  DollarSign 
} from 'lucide-react';

interface PaymentInfo {
  phoneNumber?: string;
  momoCode?: string;
  accountNumber?: string;
}

interface CargoPayment {
  id: string;
  cargoId: string;
  cargoName: string;
  totalAmount: number;
  advancePaid: number;
  remainingAmount: number;
  currency: string;
  payments: Array<{
    id: string;
    amount: number;
    paymentType: 'advance' | 'final';
    status: string;
    paidBy: 'cargo_owner' | 'lender';
    paidByName: string;
    paymentDate: string;
    paymentMethod?: string;
  }>;
  tripId?: string;
  tripNumber?: string;
}

interface PaymentGroup {
  source: 'cargo_owner' | 'lender';
  sourceName: string;
  totalPaid: number;
  totalRemaining: number;
  cargos: CargoPayment[];
}

const TruckOwnerFinancialManagement: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'payment-info' | 'payment-tracking'>('payment-info');
  const [paymentInfo, setPaymentInfo] = useState<PaymentInfo>({});
  const [isEditingPaymentInfo, setIsEditingPaymentInfo] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSource, setFilterSource] = useState<'all' | 'cargo_owner' | 'lender'>('all');
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  // Fetch user profile to get payment information
  const { data: profileData } = useQuery({
    queryKey: ['user-profile', user?.id],
    queryFn: async () => {
      try {
        const response = await api.get('/auth/profile');
        return response.data;
      } catch (error) {
        console.error('Error fetching profile:', error);
        return null;
      }
    },
    enabled: !!user?.id,
  });

  // Load payment information from profile
  useEffect(() => {
    const paymentInfoData = profileData?.profile?.preferences?.paymentInfo ||
      profileData?.preferences?.paymentInfo ||
      profileData?.data?.profile?.preferences?.paymentInfo;
    if (paymentInfoData) {
      setPaymentInfo(paymentInfoData);
    }
  }, [profileData]);

  // Save payment information mutation
  const savePaymentInfoMutation = useMutation({
    mutationFn: async (info: PaymentInfo) => {
      const currentPreferences = profileData?.profile?.preferences || profileData?.preferences || profileData?.data?.profile?.preferences || {};
      // Update through auth profile endpoint
      const response = await api.patch('/auth/profile', {
        preferences: {
          ...currentPreferences,
          paymentInfo: info,
        },
      });
      return response.data;
    },
    onSuccess: () => {
      toast.success('Payment information saved successfully');
      setIsEditingPaymentInfo(false);
      queryClient.invalidateQueries({ queryKey: ['user-profile', user?.id] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to save payment information');
    },
  });

  // Fetch trips and payments
  const { data: tripsData, isLoading: tripsLoading } = useQuery({
    queryKey: ['truck-owner-trips'],
    queryFn: async () => {
      try {
        const response = await api.get('/trips', {
          params: {
            status: 'all',
          },
        });
        return response.data?.data || response.data || [];
      } catch (error) {
        console.error('Error fetching trips:', error);
        return [];
      }
    },
  });

  // Fetch all payments
  const { data: paymentsData, isLoading: paymentsLoading } = useQuery({
    queryKey: ['truck-owner-payments'],
    queryFn: async () => {
      try {
        const response = await paymentsAPI.getAll({});
        return response.data?.payments || response.data?.data?.payments || [];
      } catch (error) {
        console.error('Error fetching payments:', error);
        return [];
      }
    },
  });

  // Process cargo payments from trips and payments data
  const processCargoPayments = (): CargoPayment[] => {
    if (!tripsData || !paymentsData) return [];

    const cargoMap = new Map<string, CargoPayment>();

    // Process each trip
    tripsData.forEach((trip: any) => {
      const load = trip.load || trip.cargo;
      if (!load) return;

      const cargoId = load.id;
      const cargoName = load.title || load.cargoType || 'Cargo';
      const totalAmount = trip.totalAmount || trip.amount || load.value || 0;
      const currency = trip.currency || load.currency || 'USD';

      if (!cargoMap.has(cargoId)) {
        cargoMap.set(cargoId, {
          id: cargoId,
          cargoId,
          cargoName,
          totalAmount,
          advancePaid: 0,
          remainingAmount: totalAmount,
          currency,
          payments: [],
          tripId: trip.id,
          tripNumber: trip.tripNumber || trip.id.substring(0, 8),
        });
      }
    });

    // Process payments
    paymentsData.forEach((payment: any) => {
      const trip = payment.trip || tripsData.find((t: any) => t.id === payment.tripId);
      if (!trip) return;

      const load = trip.load || trip.cargo;
      if (!load) return;

      const cargoId = load.id;
      const cargo = cargoMap.get(cargoId);
      if (!cargo) return;

      // Determine payment source
      const payerId = payment.payerId;
      const cargoOwnerId = load.cargoOwnerId || load.cargoOwner?.id;
      const isLender = payment.metadata?.financedAmount || payment.metadata?.lenderId;

      const paidBy: 'cargo_owner' | 'lender' = isLender ? 'lender' :
        (payerId === cargoOwnerId ? 'cargo_owner' : 'cargo_owner');

      const paidByName = isLender
        ? (payment.metadata?.lenderName || 'Lender')
        : (load.cargoOwner?.profile?.firstName + ' ' + load.cargoOwner?.profile?.lastName ||
          load.cargoOwner?.companyName || 'Cargo Owner');

      const paymentAmount = parseFloat(payment.amount) || 0;
      const paymentType = payment.paymentType === 'advance' || payment.paymentType === 'ADVANCE'
        ? 'advance'
        : 'final';

      cargo.payments.push({
        id: payment.id,
        amount: paymentAmount,
        paymentType,
        status: payment.status,
        paidBy,
        paidByName,
        paymentDate: payment.processedAt || payment.createdAt,
        paymentMethod: payment.paymentMethod,
      });

      // Update advance paid and remaining
      if (payment.status === 'completed' || payment.status === 'COMPLETED') {
        cargo.advancePaid += paymentAmount;
        cargo.remainingAmount = Math.max(0, cargo.totalAmount - cargo.advancePaid);
      }
    });

    return Array.from(cargoMap.values());
  };

  const cargoPayments = processCargoPayments();

  // Group payments by source
  const groupedPayments = (): PaymentGroup[] => {
    const groups = new Map<'cargo_owner' | 'lender', PaymentGroup>();

    cargoPayments.forEach((cargo) => {
      const cargoOwnerPayments = cargo.payments.filter(p => p.paidBy === 'cargo_owner');
      const lenderPayments = cargo.payments.filter(p => p.paidBy === 'lender');

      // Cargo Owner group
      if (cargoOwnerPayments.length > 0 || cargo.remainingAmount > 0) {
        if (!groups.has('cargo_owner')) {
          groups.set('cargo_owner', {
            source: 'cargo_owner',
            sourceName: 'Cargo Owner Payments',
            totalPaid: 0,
            totalRemaining: 0,
            cargos: [],
          });
        }
        const group = groups.get('cargo_owner')!;
        const totalPaid = cargoOwnerPayments
          .filter(p => p.status === 'completed' || p.status === 'COMPLETED')
          .reduce((sum, p) => sum + p.amount, 0);
        group.totalPaid += totalPaid;
        group.totalRemaining += cargo.remainingAmount;
        group.cargos.push(cargo);
      }

      // Lender group
      if (lenderPayments.length > 0) {
        if (!groups.has('lender')) {
          groups.set('lender', {
            source: 'lender',
            sourceName: 'Lender Payments',
            totalPaid: 0,
            totalRemaining: 0,
            cargos: [],
          });
        }
        const group = groups.get('lender')!;
        const totalPaid = lenderPayments
          .filter(p => p.status === 'completed' || p.status === 'COMPLETED')
          .reduce((sum, p) => sum + p.amount, 0);
        group.totalPaid += totalPaid;
        group.cargos.push(cargo);
      }
    });

    return Array.from(groups.values());
  };

  const paymentGroups = groupedPayments();

  // Filter groups
  const filteredGroups = paymentGroups.filter(group => {
    if (filterSource !== 'all' && group.source !== filterSource) return false;

    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      return group.cargos.some(cargo =>
        cargo.cargoName.toLowerCase().includes(search) ||
        cargo.tripNumber?.toLowerCase().includes(search)
      );
    }

    return true;
  });

  const handleSavePaymentInfo = () => {
    if (!paymentInfo.phoneNumber && !paymentInfo.momoCode && !paymentInfo.accountNumber) {
      toast.error('Please provide at least one payment method');
      return;
    }
    savePaymentInfoMutation.mutate(paymentInfo);
  };

  const toggleGroup = (source: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(source)) {
      newExpanded.delete(source);
    } else {
      newExpanded.add(source);
    }
    setExpandedGroups(newExpanded);
  };

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Calculate financial summary stats
  const totalPaid = paymentGroups.reduce((sum, group) => sum + group.totalPaid, 0);
  const totalRemaining = paymentGroups.reduce((sum, group) => sum + group.totalRemaining, 0);
  const totalCargos = paymentGroups.reduce((sum, group) => sum + group.cargos.length, 0);
  const completedPayments = cargoPayments.reduce((sum, cargo) => {
    const cargoCompleted = cargo.payments.filter(p => p.status === 'completed' || p.status === 'COMPLETED').length;
    return sum + cargoCompleted;
  }, 0);

  const SummaryCard = ({ title, value, icon: Icon, colorClass, gradient }: { title: string; value: string; icon: any; colorClass: string; gradient: string }) => (
    <motion.div
      whileHover={{ y: -5 }}
      className="flex flex-col items-center group cursor-pointer"
    >
      <div className="relative size-36 lg:size-40 bg-white border-[6px] border-slate-50 rounded-full flex flex-col items-center justify-center transition-all duration-500 hover:border-slate-100 hover:shadow-xl hover:shadow-slate-200/50">
        <svg className="absolute inset-0 w-full h-full -rotate-90 scale-[1.05]">
          <circle
            cx="50%"
            cy="50%"
            r="46%"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeDasharray="414"
            strokeDashoffset="300"
            className={cn("opacity-10 transition-all duration-1000 group-hover:opacity-30", colorClass)}
          />
        </svg>

        <div className={cn("p-2 rounded-xl mb-1 bg-slate-50 text-slate-400 group-hover:bg-white group-hover:text-inherit transition-all duration-500 shadow-sm", gradient)}>
          <Icon size={14} />
        </div>
        <p className="text-xl lg:text-2xl font-black text-[#0f172a] tracking-tighter group-hover:scale-110 transition-transform duration-500 text-center leading-none">
          {value}
        </p>
      </div>
      <div className="mt-4 text-center">
        <p className="text-[7px] font-black uppercase tracking-[0.2em] text-slate-400 group-hover:text-blue-600 transition-colors">
          {title}
        </p>
      </div>
    </motion.div>
  );

  return (
    <div className="space-y-12">
      {/* Financial Summary Matrix - SUBTLE CIRCULAR DESIGN */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 py-8 bg-slate-50/30 rounded-[3rem] border border-slate-100/50 place-items-center">
        <SummaryCard 
          title="Total Received" 
          value={formatCurrency(totalPaid)} 
          icon={CheckCircle2} 
          colorClass="text-emerald-500" 
          gradient="bg-emerald-50 text-emerald-600"
        />
        <SummaryCard 
          title="Pending Amount" 
          value={formatCurrency(totalRemaining)} 
          icon={Clock} 
          colorClass="text-orange-400" 
          gradient="bg-orange-50 text-orange-600"
        />
        <SummaryCard 
          title="Active Cargos" 
          value={totalCargos.toString()} 
          icon={Box} 
          colorClass="text-blue-400" 
          gradient="bg-blue-50 text-blue-600"
        />
        <SummaryCard 
          title="Completed Payments" 
          value={completedPayments.toString()} 
          icon={DollarSign} 
          colorClass="text-purple-400" 
          gradient="bg-purple-50 text-purple-600"
        />
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200/60 overflow-hidden">
        <div className="flex border-b border-gray-200 bg-gray-50/50">
          <button
            onClick={() => setActiveTab('payment-info')}
            className={`flex-1 px-6 py-4 text-sm font-semibold transition-all duration-200 ${activeTab === 'payment-info'
                ? 'text-primary-500 border-b-2 border-primary-500 bg-white shadow-sm'
                : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
              }`}
          >
            <div className="flex items-center justify-center gap-2">
              <FaCreditCard className="w-4 h-4" />
              <span>Payment Information</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('payment-tracking')}
            className={`flex-1 px-6 py-4 text-sm font-semibold transition-all duration-200 ${activeTab === 'payment-tracking'
                ? 'text-primary-600 border-b-2 border-primary-600 bg-white shadow-sm'
                : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
              }`}
          >
            <div className="flex items-center justify-center gap-2">
              <FaDollarSign className="w-4 h-4" />
              <span>Payment Tracking</span>
            </div>
          </button>
        </div>

        {/* Payment Information Tab */}
        {activeTab === 'payment-info' && (
          <div className="p-6">
            <div className="mb-6">
              <h3 className="text-xl font-bold text-gray-900 mb-2">Payment Methods</h3>
              <p className="text-sm text-gray-600">
                Add your payment information to receive payments. You can add one or all payment methods.
              </p>
            </div>

            {!isEditingPaymentInfo && (
              <div className="mb-6 flex justify-end">
                <button
                  onClick={() => setIsEditingPaymentInfo(true)}
                  className="px-5 py-2.5 bg-primary-500 text-white rounded-lg hover:bg-primary-600 flex items-center gap-2 shadow-sm hover:shadow-md transition-all duration-200"
                >
                  <FaEdit className="w-4 h-4" />
                  <span>Edit Payment Information</span>
                </button>
              </div>
            )}

            <div className="space-y-5">
              {/* Phone Number */}
              <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
                <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <FaMobileAlt className="w-4 h-4 text-blue-600" />
                  </div>
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={paymentInfo.phoneNumber || ''}
                  onChange={(e) => setPaymentInfo({ ...paymentInfo, phoneNumber: e.target.value })}
                  disabled={!isEditingPaymentInfo}
                  placeholder="Enter your phone number"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-100 disabled:cursor-not-allowed transition-all"
                />
              </div>

              {/* Mobile Money Code */}
              <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
                <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <FaMobileAlt className="w-4 h-4 text-green-600" />
                  </div>
                  Mobile Money (MoMo) Code
                </label>
                <input
                  type="text"
                  value={paymentInfo.momoCode || ''}
                  onChange={(e) => setPaymentInfo({ ...paymentInfo, momoCode: e.target.value })}
                  disabled={!isEditingPaymentInfo}
                  placeholder="Enter your MoMo code (e.g., MTN, Vodafone, Airtel)"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-100 disabled:cursor-not-allowed transition-all"
                />
              </div>

              {/* Account Number */}
              <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
                <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <FaWallet className="w-4 h-4 text-purple-600" />
                  </div>
                  Account Number
                </label>
                <input
                  type="text"
                  value={paymentInfo.accountNumber || ''}
                  onChange={(e) => setPaymentInfo({ ...paymentInfo, accountNumber: e.target.value })}
                  disabled={!isEditingPaymentInfo}
                  placeholder="Enter your bank account number"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-100 disabled:cursor-not-allowed transition-all"
                />
                <p className="mt-2 text-xs text-gray-500 flex items-center gap-1">
                  <FaInfoCircle className="w-3 h-3" />
                  Account number will be securely stored and encrypted
                </p>
              </div>

              {isEditingPaymentInfo && (
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={handleSavePaymentInfo}
                    disabled={savePaymentInfoMutation.isPending}
                    className="px-6 py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md transition-all duration-200 font-medium"
                  >
                    <FaSave className="w-4 h-4" />
                    <span>Save Payment Information</span>
                  </button>
                  <button
                    onClick={() => {
                      setIsEditingPaymentInfo(false);
                      // Reset to original values
                      const paymentInfoData = profileData?.profile?.preferences?.paymentInfo ||
                        profileData?.preferences?.paymentInfo ||
                        profileData?.data?.profile?.preferences?.paymentInfo;
                      if (paymentInfoData) {
                        setPaymentInfo(paymentInfoData);
                      } else {
                        setPaymentInfo({});
                      }
                    }}
                    className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 flex items-center gap-2 shadow-sm hover:shadow-md transition-all duration-200 font-medium"
                  >
                    <FaTimesCircle className="w-4 h-4" />
                    <span>Cancel</span>
                  </button>
                </div>
              )}

              {/* Display saved payment info */}
              {!isEditingPaymentInfo && (
                <div className="mt-6 p-6 bg-gradient-to-br from-primary-50 to-blue-50 rounded-xl border border-primary-200/50">
                  <h4 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <FaCheckCircle className="w-5 h-5 text-primary-500" />
                    Current Payment Information
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {paymentInfo.phoneNumber && (
                      <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
                        <div className="flex items-center gap-2 mb-2">
                          <FaMobileAlt className="w-4 h-4 text-blue-600" />
                          <span className="text-xs font-medium text-gray-500 uppercase">Phone Number</span>
                        </div>
                        <p className="text-sm font-semibold text-gray-900">{paymentInfo.phoneNumber}</p>
                      </div>
                    )}
                    {paymentInfo.momoCode && (
                      <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
                        <div className="flex items-center gap-2 mb-2">
                          <FaMobileAlt className="w-4 h-4 text-green-600" />
                          <span className="text-xs font-medium text-gray-500 uppercase">MoMo Code</span>
                        </div>
                        <p className="text-sm font-semibold text-gray-900">{paymentInfo.momoCode}</p>
                      </div>
                    )}
                    {paymentInfo.accountNumber && (
                      <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
                        <div className="flex items-center gap-2 mb-2">
                          <FaWallet className="w-4 h-4 text-purple-600" />
                          <span className="text-xs font-medium text-gray-500 uppercase">Account Number</span>
                        </div>
                        <p className="text-sm font-semibold text-gray-900">{paymentInfo.accountNumber}</p>
                      </div>
                    )}
                    {!paymentInfo.phoneNumber && !paymentInfo.momoCode && !paymentInfo.accountNumber && (
                      <div className="col-span-full flex items-center gap-3 p-4 bg-white rounded-lg border border-gray-200">
                        <FaInfoCircle className="w-5 h-5 text-gray-400" />
                        <span className="text-sm text-gray-600">No payment information added yet</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Payment Tracking Tab */}
        {activeTab === 'payment-tracking' && (
          <div className="p-6">
            <div className="mb-6">
              <h3 className="text-xl font-bold text-gray-900 mb-2">Payment Tracking</h3>
              <p className="text-sm text-gray-600">
                Track payments made for goods you've transported, showing advance payments and remaining amounts.
              </p>
            </div>

            {/* Filters */}
            <div className="mb-6 flex flex-wrap gap-4 bg-gray-50 p-4 rounded-xl border border-gray-200">
              <div className="flex-1 min-w-[200px]">
                <div className="relative">
                  <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search cargo or trip number..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <FaFilter className="w-4 h-4 text-gray-500" />
                <select
                  value={filterSource}
                  onChange={(e) => setFilterSource(e.target.value as any)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="all">All Sources</option>
                  <option value="cargo_owner">Cargo Owner</option>
                  <option value="lender">Lender</option>
                </select>
              </div>
            </div>

            {/* Loading State */}
            {(tripsLoading || paymentsLoading) && (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
              </div>
            )}

            {/* Payment Groups */}
            {!tripsLoading && !paymentsLoading && (
              <div className="space-y-4">
                {filteredGroups.length === 0 ? (
                  <div className="text-center py-12 bg-gray-50 rounded-lg">
                    <FaDollarSign className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-600">No payments found</p>
                  </div>
                ) : (
                  filteredGroups.map((group) => {
                    const isExpanded = expandedGroups.has(group.source);
                    return (
                      <div key={group.source} className="bg-white rounded-xl shadow-sm border border-gray-200/60 overflow-hidden hover:shadow-md transition-all duration-200">
                        {/* Group Header */}
                        <button
                          onClick={() => toggleGroup(group.source)}
                          className="w-full p-5 bg-gradient-to-r from-gray-50 to-white hover:from-gray-100 hover:to-gray-50 transition-all duration-200 flex items-center justify-between border-b border-gray-200"
                        >
                          <div className="flex items-center gap-4">
                            <div className={`p-3 rounded-xl ${group.source === 'cargo_owner'
                                ? 'bg-primary-50'
                                : 'bg-blue-100'
                              }`}>
                              {group.source === 'cargo_owner' ? (
                                <FaUser className="w-6 h-6 text-primary-500" />
                              ) : (
                                <FaBuilding className="w-6 h-6 text-blue-600" />
                              )}
                            </div>
                            <div className="text-left">
                              <h4 className="text-lg font-bold text-gray-900">{group.sourceName}</h4>
                              <p className="text-sm text-gray-500 mt-0.5">
                                {group.cargos.length} cargo{group.cargos.length !== 1 ? 's' : ''}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-8">
                            <div className="text-right">
                              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Total Paid</p>
                              <p className="text-xl font-bold text-gray-900 mt-1">
                                {formatCurrency(group.totalPaid, 'USD')}
                              </p>
                            </div>
                            {group.totalRemaining > 0 && (
                              <div className="text-right">
                                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Remaining</p>
                                <p className="text-xl font-bold text-orange-600 mt-1">
                                  {formatCurrency(group.totalRemaining, 'USD')}
                                </p>
                              </div>
                            )}
                            <div className={`p-2 rounded-lg transition-all ${isExpanded ? 'bg-primary-50 text-primary-500' : 'bg-gray-100 text-gray-500'
                              }`}>
                              {isExpanded ? (
                                <FaArrowUp className="w-4 h-4" />
                              ) : (
                                <FaArrowDown className="w-4 h-4" />
                              )}
                            </div>
                          </div>
                        </button>

                        {/* Group Content */}
                        {isExpanded && (
                          <div className="divide-y divide-gray-100 bg-white">
                            {group.cargos.map((cargo) => (
                              <div key={cargo.id} className="p-5 hover:bg-gray-50/50 transition-colors">
                                <div className="flex items-start justify-between mb-4">
                                  <div className="flex-1">
                                    <h5 className="text-lg font-bold text-gray-900 mb-1">{cargo.cargoName}</h5>
                                    <p className="text-sm text-gray-500 flex items-center gap-2">
                                      <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-md text-xs font-medium">
                                        Trip: {cargo.tripNumber || 'N/A'}
                                      </span>
                                    </p>
                                  </div>
                                  <div className="text-right ml-4">
                                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Total Amount</p>
                                    <p className="text-lg font-bold text-gray-900 mt-1">
                                      {formatCurrency(cargo.totalAmount, cargo.currency)}
                                    </p>
                                  </div>
                                </div>

                                {/* Payment Progress */}
                                <div className="mb-3">
                                  <div className="flex items-center justify-between text-sm mb-1">
                                    <span className="text-gray-600">Payment Progress</span>
                                    <span className="font-medium text-gray-900">
                                      {formatCurrency(cargo.advancePaid, cargo.currency)} / {formatCurrency(cargo.totalAmount, cargo.currency)}
                                    </span>
                                  </div>
                                  <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div
                                      className="bg-primary-500 h-2 rounded-full transition-all"
                                      style={{
                                        width: `${Math.min(100, (cargo.advancePaid / cargo.totalAmount) * 100)}%`,
                                      }}
                                    />
                                  </div>
                                </div>

                                {/* Payment Breakdown */}
                                <div className="grid grid-cols-3 gap-4 mb-4">
                                  <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-xl border border-green-200 shadow-sm">
                                    <p className="text-xs font-medium text-gray-600 uppercase tracking-wide mb-2">Advance Paid</p>
                                    <p className="text-lg font-bold text-green-700">
                                      {formatCurrency(cargo.advancePaid, cargo.currency)}
                                    </p>
                                  </div>
                                  <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-4 rounded-xl border border-orange-200 shadow-sm">
                                    <p className="text-xs font-medium text-gray-600 uppercase tracking-wide mb-2">Remaining</p>
                                    <p className="text-lg font-bold text-orange-700">
                                      {formatCurrency(cargo.remainingAmount, cargo.currency)}
                                    </p>
                                  </div>
                                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl border border-blue-200 shadow-sm">
                                    <p className="text-xs font-medium text-gray-600 uppercase tracking-wide mb-2">Total Amount</p>
                                    <p className="text-lg font-bold text-blue-700">
                                      {formatCurrency(cargo.totalAmount, cargo.currency)}
                                    </p>
                                  </div>
                                </div>

                                {/* Payment History */}
                                {cargo.payments.length > 0 && (
                                  <div className="mt-4 pt-4 border-t border-gray-200">
                                    <p className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                                      <FaDollarSign className="w-4 h-4 text-primary-500" />
                                      Payment History
                                    </p>
                                    <div className="space-y-2">
                                      {cargo.payments.map((payment) => (
                                        <div
                                          key={payment.id}
                                          className="flex items-center justify-between p-3 bg-gradient-to-r from-gray-50 to-white rounded-lg text-sm border border-gray-200 hover:shadow-sm transition-all"
                                        >
                                          <div className="flex items-center gap-3">
                                            <div className={`p-2 rounded-lg ${payment.status === 'completed' || payment.status === 'COMPLETED'
                                                ? 'bg-green-100'
                                                : 'bg-yellow-100'
                                              }`}>
                                              {payment.status === 'completed' || payment.status === 'COMPLETED' ? (
                                                <FaCheckCircle className="w-4 h-4 text-green-600" />
                                              ) : (
                                                <FaTimesCircle className="w-4 h-4 text-yellow-600" />
                                              )}
                                            </div>
                                            <div>
                                              <span className="font-bold text-gray-900">
                                                {formatCurrency(payment.amount, cargo.currency)}
                                              </span>
                                              <span className="ml-2 text-xs px-2 py-0.5 bg-gray-200 text-gray-700 rounded-md font-medium">
                                                {payment.paymentType === 'advance' ? 'Advance' : 'Final'}
                                              </span>
                                            </div>
                                          </div>
                                          <div className="flex items-center gap-4 text-gray-600">
                                            <span className="font-medium">{payment.paidByName}</span>
                                            <span className="text-xs">{formatDate(payment.paymentDate)}</span>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default TruckOwnerFinancialManagement;

