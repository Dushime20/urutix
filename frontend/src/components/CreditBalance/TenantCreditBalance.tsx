import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Wallet, AlertCircle } from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

interface CreditBalanceData {
  currentBalance: number;
  purchasedCredits: number;
  bonusCredits: number;
  totalSpent: number;
}

const TenantCreditBalance: React.FC = () => {
  const { user } = useAuth();

  const { data: balanceData, isLoading, error } = useQuery<{ success: boolean; data: CreditBalanceData }>({
    queryKey: ['tenant-credit-balance'],
    queryFn: async () => {
      const response = await api.get('/credits/balance');
      return response.data;
    },
    enabled: user?.role === 'TENANT_ADMIN',
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  if (!user || user.role !== 'TENANT_ADMIN') {
    return null;
  }

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg animate-pulse">
        <Wallet className="w-4 h-4 text-gray-400" />
        <span className="text-sm text-gray-500">Loading...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-red-50 rounded-lg">
        <AlertCircle className="w-4 h-4 text-red-500" />
        <span className="text-sm text-red-600">Error loading balance</span>
      </div>
    );
  }

  const balance = balanceData?.data?.currentBalance || 0;
  const isLowBalance = balance < 100;

  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
      isLowBalance 
        ? 'bg-amber-50 border border-amber-200' 
        : 'bg-primary-50 border border-primary-200'
    }`}>
      <Wallet className={`w-4 h-4 ${isLowBalance ? 'text-amber-600' : 'text-primary-600'}`} />
      <div className="flex flex-col">
        <span className="text-xs font-medium text-gray-600">Available Credits</span>
        <span className={`text-sm font-bold ${isLowBalance ? 'text-amber-700' : 'text-primary-700'}`}>
          {balance.toLocaleString()} TRX
        </span>
      </div>
      {isLowBalance && (
        <AlertCircle className="w-3 h-3 text-amber-500" />
      )}
    </div>
  );
};

export default TenantCreditBalance;