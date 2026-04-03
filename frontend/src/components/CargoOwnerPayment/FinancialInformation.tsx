import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {

  FaMobileAlt,
  FaWallet,
  FaSave,
  FaEdit,
  FaTimesCircle,
  FaInfoCircle,
  FaCopy,
  FaCheckCircle
} from 'react-icons/fa';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

interface PaymentInfo {
  phoneNumber?: string;
  momoCode?: string;
  accountNumber?: string;
}

interface FinancialInformationProps {
  userId?: string;
  userName?: string;
  readOnly?: boolean;
  showTitle?: boolean;
}

const FinancialInformation: React.FC<FinancialInformationProps> = ({
  userId,
  userName,
  readOnly = false,
  showTitle = true
}) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [paymentInfo, setPaymentInfo] = useState<PaymentInfo>({});
  const [isEditingPaymentInfo, setIsEditingPaymentInfo] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Determine which user's payment info to fetch
  const targetUserId = userId || user?.id;

  // Fetch user profile to get payment information
  const { data: profileData, isLoading: profileLoading } = useQuery({
    queryKey: ['user-profile', targetUserId],
    queryFn: async () => {
      try {
        if (userId && userId !== user?.id) {
          // Fetch another user's profile (for viewing truck owner's info)
          const response = await api.get(`/users/${userId}/profile`);
          return response.data;
        } else {
          // Fetch own profile
          const response = await api.get('/auth/profile');
          return response.data;
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
        return null;
      }
    },
    enabled: !!targetUserId,
  });

  // Load payment information from profile
  useEffect(() => {
    const paymentInfoData =
      profileData?.data?.user?.profile?.preferences?.paymentInfo ||
      profileData?.profile?.preferences?.paymentInfo ||
      profileData?.preferences?.paymentInfo ||
      profileData?.data?.profile?.preferences?.paymentInfo;
    if (paymentInfoData) {
      setPaymentInfo(paymentInfoData);
    }
  }, [profileData]);

  // Save payment information mutation
  const savePaymentInfoMutation = useMutation({
    mutationFn: async (info: PaymentInfo) => {
      const currentPreferences =
        profileData?.data?.user?.profile?.preferences ||
        profileData?.profile?.preferences ||
        profileData?.preferences ||
        profileData?.data?.profile?.preferences || {};
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
      queryClient.invalidateQueries({ queryKey: ['user-profile', targetUserId] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to save payment information');
    },
  });

  const handleSavePaymentInfo = () => {
    if (!paymentInfo.phoneNumber && !paymentInfo.momoCode && !paymentInfo.accountNumber) {
      toast.error('Please provide at least one payment method');
      return;
    }
    savePaymentInfoMutation.mutate(paymentInfo);
  };

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    toast.success('Copied to clipboard');
    setTimeout(() => setCopiedField(null), 2000);
  };

  if (profileLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {showTitle && (
        <div className="mb-6">
          <h3 className="text-2xl font-bold text-gray-900 mb-2">
            {readOnly && userName ? `${userName}'s Payment Information` : 'Payment Methods'}
          </h3>
          <p className="text-sm text-gray-600">
            {readOnly
              ? 'Use this information to make payments to this user'
              : 'Add your payment information to receive payments. You can add one or all payment methods.'}
          </p>
        </div>
      )}

      {!readOnly && !isEditingPaymentInfo && (
        <div className="mb-6 flex justify-end">
          <button
            onClick={() => setIsEditingPaymentInfo(true)}
            className="px-5 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 flex items-center gap-2 shadow-sm hover:shadow-md transition-all duration-200 font-medium"
          >
            <FaEdit className="w-4 h-4" />
            <span>Edit Payment Information</span>
          </button>
        </div>
      )}

      <div className="space-y-5">
        {/* Phone Number */}
        <div className="bg-gray-50 rounded-xl p-5 border border-gray-200 shadow-sm">
          <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <div className="p-2 bg-gray-100 rounded-lg">
              <FaMobileAlt className="w-4 h-4 text-gray-600" />
            </div>
            Phone Number
          </label>
          {readOnly ? (
            <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
              <span className={paymentInfo.phoneNumber ? 'text-gray-900 font-semibold' : 'text-gray-400'}>
                {paymentInfo.phoneNumber || 'Not provided'}
              </span>
              {paymentInfo.phoneNumber && (
                <button
                  onClick={() => handleCopy(paymentInfo.phoneNumber!, 'phoneNumber')}
                  className="ml-2 p-2 text-gray-600 hover:text-primary-600 hover:bg-gray-100 rounded-lg transition-all"
                  title="Copy"
                >
                  {copiedField === 'phoneNumber' ? (
                    <FaCheckCircle className="w-4 h-4 text-gray-600" />
                  ) : (
                    <FaCopy className="w-4 h-4" />
                  )}
                </button>
              )}
            </div>
          ) : (
            <input
              type="tel"
              value={paymentInfo.phoneNumber || ''}
              onChange={(e) => setPaymentInfo({ ...paymentInfo, phoneNumber: e.target.value })}
              disabled={!isEditingPaymentInfo}
              placeholder="Enter your phone number"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-100 disabled:cursor-not-allowed transition-all"
            />
          )}
        </div>

        {/* Mobile Money Code */}
        <div className="bg-gray-50 rounded-xl p-5 border border-gray-200 shadow-sm">
          <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <div className="p-2 bg-gray-100 rounded-lg">
              <FaMobileAlt className="w-4 h-4 text-gray-600" />
            </div>
            Mobile Money (MoMo) Code
          </label>
          {readOnly ? (
            <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
              <span className={paymentInfo.momoCode ? 'text-gray-900 font-semibold' : 'text-gray-400'}>
                {paymentInfo.momoCode || 'Not provided'}
              </span>
              {paymentInfo.momoCode && (
                <button
                  onClick={() => handleCopy(paymentInfo.momoCode!, 'momoCode')}
                  className="ml-2 p-2 text-gray-600 hover:text-primary-600 hover:bg-gray-100 rounded-lg transition-all"
                  title="Copy"
                >
                  {copiedField === 'momoCode' ? (
                    <FaCheckCircle className="w-4 h-4 text-green-600" />
                  ) : (
                    <FaCopy className="w-4 h-4" />
                  )}
                </button>
              )}
            </div>
          ) : (
            <input
              type="text"
              value={paymentInfo.momoCode || ''}
              onChange={(e) => setPaymentInfo({ ...paymentInfo, momoCode: e.target.value })}
              disabled={!isEditingPaymentInfo}
              placeholder="Enter your MoMo code (e.g., MTN, Vodafone, Airtel)"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-100 disabled:cursor-not-allowed transition-all"
            />
          )}
        </div>

        {/* Account Number */}
        <div className="bg-gray-50 rounded-xl p-5 border border-gray-200 shadow-sm">
          <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <div className="p-2 bg-gray-100 rounded-lg">
              <FaWallet className="w-4 h-4 text-gray-600" />
            </div>
            Account Number
          </label>
          {readOnly ? (
            <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
              <span className={paymentInfo.accountNumber ? 'text-gray-900 font-semibold' : 'text-gray-400'}>
                {paymentInfo.accountNumber || 'Not provided'}
              </span>
              {paymentInfo.accountNumber && (
                <button
                  onClick={() => handleCopy(paymentInfo.accountNumber!, 'accountNumber')}
                  className="ml-2 p-2 text-gray-600 hover:text-primary-600 hover:bg-gray-100 rounded-lg transition-all"
                  title="Copy"
                >
                  {copiedField === 'accountNumber' ? (
                    <FaCheckCircle className="w-4 h-4 text-green-600" />
                  ) : (
                    <FaCopy className="w-4 h-4" />
                  )}
                </button>
              )}
            </div>
          ) : (
            <>
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
            </>
          )}
        </div>

        {!readOnly && isEditingPaymentInfo && (
          <div className="flex gap-3 pt-2">
            <button
              onClick={handleSavePaymentInfo}
              disabled={savePaymentInfoMutation.isPending}
              className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md transition-all duration-200 font-medium"
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

        {/* Display saved payment info (read-only view) */}
        {!readOnly && !isEditingPaymentInfo && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="text-sm font-semibold text-gray-900 mb-3">Current Payment Information</h4>
            <div className="space-y-2 text-sm">
              {paymentInfo.phoneNumber && (
                <div className="flex items-center gap-2">
                  <FaMobileAlt className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-600">Phone Number:</span>
                  <span className="font-medium text-gray-900">{paymentInfo.phoneNumber}</span>
                </div>
              )}
              {paymentInfo.momoCode && (
                <div className="flex items-center gap-2">
                  <FaMobileAlt className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-600">MoMo Code:</span>
                  <span className="font-medium text-gray-900">{paymentInfo.momoCode}</span>
                </div>
              )}
              {paymentInfo.accountNumber && (
                <div className="flex items-center gap-2">
                  <FaWallet className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-600">Account Number:</span>
                  <span className="font-medium text-gray-900">
                    {paymentInfo.accountNumber}
                  </span>
                </div>
              )}
              {!paymentInfo.phoneNumber && !paymentInfo.momoCode && !paymentInfo.accountNumber && (
                <div className="flex items-center gap-2 text-gray-500">
                  <FaInfoCircle className="w-4 h-4" />
                  <span>No payment information added yet</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FinancialInformation;

