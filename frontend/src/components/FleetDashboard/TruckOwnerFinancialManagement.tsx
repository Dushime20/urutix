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

const TruckOwnerFinancialManagement: React.FC = () => {
  const { format: fmtFull, compact: fmtMoney } = useCurrencyFormat();
  const formatCurrency = (amount: number, _currency?: string) => fmtFull(amount);
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'payment-info' | 'payment-tracking'>('payment-info');
  const [paymentInfo, setPaymentInfo] = useState<PaymentInfo>({});
  const [isEditingPaymentInfo, setIsEditingPaymentInfo] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSource, setFilterSource] = useState<'all' | 'cargo_owner' | 'lender'>('all');
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

  // Fetch all received payments (trip payments + lender disbursements)
  const { data: receivedData, isLoading: receivedLoading } = useQuery({
    queryKey: ['truck-owner-received-payments'],
    queryFn: async () => {
      try {
        const response = await paymentsAPI.getAllReceivedPayments({});
        return response.data?.data || null;
      } catch (error) {
        console.error('Error fetching received payments:', error);
        return null;
      }
    },
  });

  const allPayments: any[] = receivedData?.payments || [];

  // Filter payments
  const filteredPayments = allPayments.filter((p: any) => {
    const matchesSource =
      filterSource === 'all' ||
      (filterSource === 'lender' && p.isLenderPayment) ||
      (filterSource === 'cargo_owner' && !p.isLenderPayment);
    if (!matchesSource) return false;
    if (searchTerm) {
      const s = searchTerm.toLowerCase();
      return (
        p.trip?.tripNumber?.toLowerCase().includes(s) ||
        p.description?.toLowerCase().includes(s) ||
        p.referenceNumber?.toLowerCase().includes(s) ||
        p.lenderName?.toLowerCase().includes(s)
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

  // formatCurrency provided by useCurrencyFormat hook

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Calculate financial summary stats from flat payments list
  const totalPaid = allPayments
    .filter((p: any) => p.status === 'completed' || p.status === 'COMPLETED')
    .reduce((sum: number, p: any) => sum + Number(p.amount), 0);
  const totalRemaining = allPayments
    .filter((p: any) => p.status === 'pending' || p.status === 'processing' || p.status === 'PENDING' || p.status === 'PROCESSING')
    .reduce((sum: number, p: any) => sum + Number(p.amount), 0);
  const totalCargos = new Set(allPayments.map((p: any) => p.tripId).filter(Boolean)).size;
  const completedPayments = allPayments.filter((p: any) => p.status === 'completed' || p.status === 'COMPLETED').length;

  const SummaryCard = ({ title, value, icon: Icon, colorClass, gradient }: { title: string; value: string; icon: any; colorClass: string; gradient: string }) => (
    <motion.div
      whileHover={{ y: -5 }}
      className="flex flex-col items-center group cursor-pointer"
    >
      <div className="relative size-36 lg:size-40 bg-white dark:bg-slate-900 border-[6px] border-gray-50 dark:border-slate-800 rounded-full flex flex-col items-center justify-center transition-all duration-500 hover:border-gray-100 dark:hover:border-slate-700">
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

        <div className={cn("p-2 rounded-xl mb-1 bg-gray-50 dark:bg-slate-800 text-gray-400 dark:text-slate-500 group-hover:bg-white dark:group-hover:bg-slate-700 group-hover:text-inherit transition-all duration-500", gradient)}>
          <Icon size={14} />
        </div>
        <p className="text-xl lg:text-2xl font-black text-gray-900 dark:text-white tracking-tighter group-hover:scale-110 transition-transform duration-500 text-center leading-none">
          {value}
        </p>
      </div>
      <div className="mt-4 text-center">
        <p className="text-[7px] font-black uppercase tracking-[0.2em] text-gray-400 dark:text-gray-500 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
          {title}
        </p>
      </div>
    </motion.div>
  );

  return (
    <div className="space-y-12 transition-colors duration-200">
      {/* Financial Summary Matrix - SUBTLE CIRCULAR DESIGN */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 py-8 bg-gray-50/30 dark:bg-slate-900/50 rounded-lg border border-gray-100/50 dark:border-slate-800 place-items-center transition-colors duration-200">
        <SummaryCard 
          title="Total Received" 
          value={formatCurrency(totalPaid)} 
          icon={CheckCircle2} 
          colorClass="text-emerald-500 dark:text-emerald-400" 
          gradient="bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400"
        />
        <SummaryCard 
          title="Pending Amount" 
          value={formatCurrency(totalRemaining)} 
          icon={Clock} 
          colorClass="text-orange-400 dark:text-orange-500" 
          gradient="bg-orange-50 dark:bg-orange-950/20 text-orange-600 dark:text-orange-400"
        />
        <SummaryCard 
          title="Active Cargos" 
          value={totalCargos.toString()} 
          icon={Box} 
          colorClass="text-blue-400 dark:text-blue-500" 
          gradient="bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400"
        />
        <SummaryCard 
          title="Completed Payments" 
          value={completedPayments.toString()} 
          icon={DollarSign} 
          colorClass="text-purple-400 dark:text-purple-500" 
          gradient="bg-purple-50 dark:bg-purple-950/20 text-purple-600 dark:text-purple-400"
        />
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 overflow-hidden transition-colors duration-200">
        <div className="flex border-b border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-950 transition-colors duration-200">
          <button
            onClick={() => setActiveTab('payment-info')}
            className={`flex-1 px-6 py-4 text-sm font-semibold transition-all duration-200 ${activeTab === 'payment-info'
                ? 'text-blue-500 dark:text-blue-400 border-b-2 border-blue-500 dark:border-blue-400 bg-white dark:bg-slate-900'
                : 'text-gray-600 dark:text-slate-500 hover:text-gray-900 dark:hover:text-slate-300 hover:bg-white/50 dark:hover:bg-slate-800/50'
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
                ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400 bg-white dark:bg-slate-900'
                : 'text-gray-600 dark:text-slate-500 hover:text-gray-900 dark:hover:text-slate-300 hover:bg-white/50 dark:hover:bg-slate-800/50'
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
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 transition-colors duration-200">Payment Methods</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 transition-colors duration-200">
                Add your payment information to receive payments. You can add one or all payment methods.
              </p>
            </div>

            {!isEditingPaymentInfo && (
              <div className="mb-6 flex justify-end">
                <button
                  onClick={() => setIsEditingPaymentInfo(true)}
                  className="px-5 py-2.5 bg-blue-500 dark:bg-blue-600 text-white rounded-lg hover:bg-blue-600 dark:hover:bg-blue-700 flex items-center gap-2 transition-all duration-200"
                >
                  <FaEdit className="w-4 h-4" />
                  <span>Edit Payment Information</span>
                </button>
              </div>
            )}

            <div className="space-y-5">
              {/* Phone Number */}
              <div className="bg-gray-50 dark:bg-slate-800/50 rounded-xl p-5 border border-gray-200 dark:border-slate-800 transition-colors duration-200">
                <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-3 flex items-center gap-2 transition-colors duration-200">
                  <div className="p-2 bg-blue-100 dark:bg-blue-950/40 rounded-lg transition-colors duration-200">
                    <FaMobileAlt className="w-4 h-4 text-blue-600 dark:text-blue-400 transition-colors duration-200" />
                  </div>
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={paymentInfo.phoneNumber || ''}
                  onChange={(e) => setPaymentInfo({ ...paymentInfo, phoneNumber: e.target.value })}
                  disabled={!isEditingPaymentInfo}
                  placeholder="Enter your phone number"
                  className="w-full px-4 py-3 border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 disabled:bg-gray-100 dark:disabled:bg-slate-900/50 disabled:cursor-not-allowed transition-all duration-200"
                />
              </div>

              {/* Mobile Money Code */}
              <div className="bg-gray-50 dark:bg-slate-800/50 rounded-xl p-5 border border-gray-200 dark:border-slate-800 transition-colors duration-200">
                <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-3 flex items-center gap-2 transition-colors duration-200">
                  <div className="p-2 bg-green-100 dark:bg-green-950/40 rounded-lg transition-colors duration-200">
                    <FaMobileAlt className="w-4 h-4 text-green-600 dark:text-green-400 transition-colors duration-200" />
                  </div>
                  Mobile Money (MoMo) Code
                </label>
                <input
                  type="text"
                  value={paymentInfo.momoCode || ''}
                  onChange={(e) => setPaymentInfo({ ...paymentInfo, momoCode: e.target.value })}
                  disabled={!isEditingPaymentInfo}
                  placeholder="Enter your MoMo code (e.g., MTN, Vodafone, Airtel)"
                  className="w-full px-4 py-3 border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 disabled:bg-gray-100 dark:disabled:bg-slate-900/50 disabled:cursor-not-allowed transition-all duration-200"
                />
              </div>

              {/* Account Number */}
              <div className="bg-gray-50 dark:bg-slate-800/50 rounded-xl p-5 border border-gray-200 dark:border-slate-800 transition-colors duration-200">
                <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-3 flex items-center gap-2 transition-colors duration-200">
                  <div className="p-2 bg-purple-100 dark:bg-purple-950/40 rounded-lg transition-colors duration-200">
                    <FaWallet className="w-4 h-4 text-purple-600 dark:text-purple-400 transition-colors duration-200" />
                  </div>
                  Account Number
                </label>
                <input
                  type="text"
                  value={paymentInfo.accountNumber || ''}
                  onChange={(e) => setPaymentInfo({ ...paymentInfo, accountNumber: e.target.value })}
                  disabled={!isEditingPaymentInfo}
                  placeholder="Enter your bank account number"
                  className="w-full px-4 py-3 border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 disabled:bg-gray-100 dark:disabled:bg-slate-900/50 disabled:cursor-not-allowed transition-all duration-200"
                />
                <p className="mt-2 text-xs text-gray-500 dark:text-slate-500 flex items-center gap-1 transition-colors duration-200">
                  <FaInfoCircle className="w-3 h-3" />
                  Account number will be securely stored and encrypted
                </p>
              </div>

              {isEditingPaymentInfo && (
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={handleSavePaymentInfo}
                    disabled={savePaymentInfoMutation.isPending}
                    className="px-6 py-3 bg-blue-500 dark:bg-blue-600 text-white rounded-lg hover:bg-blue-600 dark:hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium"
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
                    className="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 flex items-center gap-2 transition-all duration-200 font-medium"
                  >
                    <FaTimesCircle className="w-4 h-4" />
                    <span>Cancel</span>
                  </button>
                </div>
              )}

              {/* Display saved payment info */}
              {!isEditingPaymentInfo && (
                <div className="mt-6 p-6 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/10 dark:to-blue-800/5 rounded-xl border border-blue-200/50 dark:border-blue-800/30 transition-colors duration-200">
                  <h4 className="text-base font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2 transition-colors duration-200">
                    <FaCheckCircle className="w-5 h-5 text-blue-500 dark:text-blue-400 transition-colors duration-200" />
                    Current Payment Information
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {paymentInfo.phoneNumber && (
                      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 transition-colors duration-200 shadow-sm">
                        <div className="flex items-center gap-2 mb-2">
                          <FaMobileAlt className="w-4 h-4 text-blue-600 dark:text-blue-400 transition-colors duration-200" />
                          <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase transition-colors duration-200">Phone Number</span>
                        </div>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white transition-colors duration-200">{paymentInfo.phoneNumber}</p>
                      </div>
                    )}
                    {paymentInfo.momoCode && (
                      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 shadow-sm">
                        <div className="flex items-center gap-2 mb-2">
                          <FaMobileAlt className="w-4 h-4 text-green-600 dark:text-green-400" />
                          <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">MoMo Code</span>
                        </div>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">{paymentInfo.momoCode}</p>
                      </div>
                    )}
                    {paymentInfo.accountNumber && (
                      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 shadow-sm">
                        <div className="flex items-center gap-2 mb-2">
                          <FaWallet className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                          <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Account Number</span>
                        </div>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">{paymentInfo.accountNumber}</p>
                      </div>
                    )}
                    {!paymentInfo.phoneNumber && !paymentInfo.momoCode && !paymentInfo.accountNumber && (
                      <div className="col-span-full flex items-center gap-3 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                        <FaInfoCircle className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                        <span className="text-sm text-gray-600 dark:text-gray-400">No payment information added yet</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Payment Tracking Tab — All Received Payments */}
        {activeTab === 'payment-tracking' && (
          <div className="p-6">
            <div className="mb-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 transition-colors duration-200">Received Payments</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 transition-colors duration-200">
                All payments received — from cargo owners for trips and from lenders on behalf of borrowers.
              </p>
            </div>

            {/* Filters */}
            <div className="mb-6 flex flex-wrap gap-4 bg-gray-50 dark:bg-slate-900/50 p-4 rounded-xl border border-gray-200 dark:border-slate-800 transition-colors duration-200">
              <div className="flex-1 min-w-[200px]">
                <div className="relative">
                  <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-slate-500 w-4 h-4 transition-colors duration-200" />
                  <input
                    type="text"
                    placeholder="Search trip, reference or description..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 transition-all duration-200"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <FaFilter className="w-4 h-4 text-gray-500 dark:text-slate-400 transition-colors duration-200" />
                <select
                  value={filterSource}
                  onChange={(e) => setFilterSource(e.target.value as any)}
                  className="px-4 py-2 border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 transition-all duration-200"
                >
                  <option value="all">All Sources</option>
                  <option value="cargo_owner">Cargo Owner</option>
                  <option value="lender">Lender</option>
                </select>
              </div>
            </div>

            {/* Loading State */}
            {receivedLoading && (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 dark:border-blue-400"></div>
              </div>
            )}

            {/* Payments flat list */}
            {!receivedLoading && (
              <div className="space-y-3">
                {filteredPayments.length === 0 ? (
                  <div className="text-center py-12 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-dashed border-gray-200 dark:border-gray-700 transition-colors duration-200">
                    <FaDollarSign className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4 transition-colors duration-200" />
                    <p className="text-gray-600 dark:text-gray-400 font-medium transition-colors duration-200">No payments found</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 transition-colors duration-200">Payments from cargo owners and lenders will appear here</p>
                  </div>
                ) : (
                  filteredPayments.map((payment: any) => {
                    const isCompleted = payment.status === 'completed' || payment.status === 'COMPLETED';
                    const isPending = payment.status === 'pending' || payment.status === 'PENDING';
                    const isProcessing = payment.status === 'processing' || payment.status === 'PROCESSING';
                    return (
                      <div
                        key={payment.id}
                        className="flex items-center gap-4 p-4 bg-white dark:bg-slate-900 rounded-xl border border-gray-100 dark:border-slate-800 hover:border-gray-200 dark:hover:border-slate-700 hover:shadow-sm transition-all duration-200"
                      >
                        {/* Status icon */}
                        <div className={`p-2.5 rounded-xl shrink-0 ${isCompleted ? 'bg-emerald-50 dark:bg-emerald-950/30' : isPending || isProcessing ? 'bg-amber-50 dark:bg-amber-950/30' : 'bg-gray-50 dark:bg-slate-800'}`}>
                          {isCompleted
                            ? <FaCheckCircle className="w-5 h-5 text-emerald-500 dark:text-emerald-400" />
                            : <FaDollarSign className={`w-5 h-5 ${isPending || isProcessing ? 'text-amber-500 dark:text-amber-400' : 'text-gray-400 dark:text-slate-500'}`} />
                          }
                        </div>

                        {/* Main info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <span className="text-sm font-bold text-gray-900 dark:text-white">
                              {formatCurrency(payment.amount, payment.currency)}
                            </span>
                            {/* Source badge */}
                            {payment.isLenderPayment ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-violet-100 dark:bg-violet-950/40 text-violet-700 dark:text-violet-400">
                                <FaBuilding className="w-2.5 h-2.5" /> Lender
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400">
                                <FaUser className="w-2.5 h-2.5" /> Cargo Owner
                              </span>
                            )}
                            {/* Status badge */}
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                              isCompleted ? 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400'
                              : isPending ? 'bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400'
                              : isProcessing ? 'bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400'
                              : 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-400'
                            }`}>
                              {payment.status}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 dark:text-slate-400 truncate">
                            {payment.description || (payment.isLenderPayment ? 'Loan disbursement' : 'Trip payment')}
                            {payment.trip?.tripNumber && (
                              <span className="ml-2 font-medium text-gray-700 dark:text-slate-300">· Trip {payment.trip.tripNumber}</span>
                            )}
                            {payment.trip?.load?.title && (
                              <span className="ml-1 text-gray-400 dark:text-slate-500">· {payment.trip.load.title}</span>
                            )}
                          </p>
                          {payment.referenceNumber && (
                            <p className="text-[10px] text-gray-400 dark:text-slate-500 mt-0.5 font-mono">{payment.referenceNumber}</p>
                          )}
                        </div>

                        {/* Date */}
                        <div className="text-right shrink-0">
                          <p className="text-xs font-medium text-gray-500 dark:text-slate-400">
                            {formatDate(payment.processedAt || payment.createdAt)}
                          </p>
                          {payment.isLenderPayment && payment.lenderName && (
                            <p className="text-[10px] text-violet-600 dark:text-violet-400 mt-0.5 font-semibold">{payment.lenderName}</p>
                          )}
                        </div>
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

