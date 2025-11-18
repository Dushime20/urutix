import React, { useState, useEffect } from 'react';
import { FaGift, FaCheckCircle, FaClock, FaTimesCircle, FaCoins, FaCreditCard, FaStar } from 'react-icons/fa';
import { useAuth } from '../contexts/AuthContext';

interface Reward {
  id: string;
  userId: string;
  type: 'transaction_bonus' | 'volume_bonus' | 'loyalty_points' | 'cashback' | 'discount' | 'premium_features';
  amount: number;
  currency: string;
  description: string;
  status: 'pending' | 'active' | 'redeemed' | 'expired';
  validFrom?: string;
  validUntil?: string;
  redeemedAt?: string;
  createdAt: string;
  criteria?: Record<string, any>;
}

interface RewardStats {
  totalRewards: number;
  activeRewards: number;
  redeemedRewards: number;
  totalValue: number;
  pendingValue: number;
  activeValue: number;
}

const UserRewards: React.FC = () => {
  const { user } = useAuth();
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [stats, setStats] = useState<RewardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      loadUserRewards();
      loadRewardStats();
    }
  }, [user?.id]);

  const loadUserRewards = async () => {
    try {
      const response = await fetch(`/api/rewards/user/${user?.id}`);
      if (!response.ok) {
        console.error('Failed to load rewards:', response.status);
        setRewards([]);
        return;
      }
      const data = await response.json();
      // Handle different response structures
      const rewardsArray = Array.isArray(data) 
        ? data 
        : Array.isArray(data?.data) 
        ? data.data 
        : Array.isArray(data?.rewards)
        ? data.rewards
        : [];
      setRewards(rewardsArray);
    } catch (error) {
      console.error('Error loading rewards:', error);
      setRewards([]);
    }
  };

  const loadRewardStats = async () => {
    try {
      const response = await fetch(`/api/rewards/user/${user?.id}/stats`);
      if (!response.ok) {
        console.error('Failed to load reward stats:', response.status);
        setStats({
          totalRewards: 0,
          activeRewards: 0,
          redeemedRewards: 0,
          totalValue: 0,
          pendingValue: 0,
          activeValue: 0,
        });
        return;
      }
      const data = await response.json();
      // Ensure all properties have default values
      setStats({
        totalRewards: data?.totalRewards || 0,
        activeRewards: data?.activeRewards || 0,
        redeemedRewards: data?.redeemedRewards || 0,
        totalValue: data?.totalValue || 0,
        pendingValue: data?.pendingValue || 0,
        activeValue: data?.activeValue || 0,
      });
    } catch (error) {
      console.error('Error loading reward stats:', error);
      setStats({
        totalRewards: 0,
        activeRewards: 0,
        redeemedRewards: 0,
        totalValue: 0,
        pendingValue: 0,
        activeValue: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  const activateReward = async (rewardId: string) => {
    try {
      const response = await fetch(`/api/rewards/reward/${rewardId}/activate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });

      if (response.ok) {
        loadUserRewards();
        loadRewardStats();
      }
    } catch (error) {
      console.error('Error activating reward:', error);
    }
  };

  const redeemReward = async (rewardId: string) => {
    try {
      const response = await fetch(`/api/rewards/reward/${rewardId}/redeem`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });

      if (response.ok) {
        loadUserRewards();
        loadRewardStats();
      }
    } catch (error) {
      console.error('Error redeeming reward:', error);
    }
  };

  const getRewardIcon = (type: string) => {
    switch (type) {
      case 'transaction_bonus':
        return <FaCreditCard className="text-blue-500" />;
      case 'volume_bonus':
        return <FaCoins className="text-yellow-500" />;
      case 'loyalty_points':
        return <FaStar className="text-purple-500" />;
      case 'cashback':
        return <FaGift className="text-green-500" />;
      case 'discount':
        return <FaCheckCircle className="text-orange-500" />;
      case 'premium_features':
        return <FaStar className="text-indigo-500" />;
      default:
        return <FaGift className="text-gray-500" />;
    }
  };

  const getRewardTypeLabel = (type: string) => {
    switch (type) {
      case 'transaction_bonus':
        return 'Transaction Bonus';
      case 'volume_bonus':
        return 'Volume Bonus';
      case 'loyalty_points':
        return 'Loyalty Points';
      case 'cashback':
        return 'Cashback';
      case 'discount':
        return 'Discount';
      case 'premium_features':
        return 'Premium Features';
      default:
        return type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <FaClock className="text-yellow-500" />;
      case 'active':
        return <FaCheckCircle className="text-green-500" />;
      case 'redeemed':
        return <FaCheckCircle className="text-blue-500" />;
      case 'expired':
        return <FaTimesCircle className="text-red-500" />;
      default:
        return <FaClock className="text-gray-500" />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Pending';
      case 'active':
        return 'Active';
      case 'redeemed':
        return 'Redeemed';
      case 'expired':
        return 'Expired';
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Rewards & Benefits</h1>
        <p className="text-gray-600">View and manage your platform rewards and benefits</p>
      </div>

      {/* Reward Statistics */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center mb-4">
              <FaGift className="text-blue-500 text-2xl mr-3" />
              <h3 className="text-lg font-semibold">Total Rewards</h3>
            </div>
            <div className="text-3xl font-bold text-blue-600 mb-2">
              {stats.totalRewards}
            </div>
            <p className="text-sm text-gray-600">Total value: {(stats.totalValue || 0).toLocaleString()} KES</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center mb-4">
              <FaCheckCircle className="text-green-500 text-2xl mr-3" />
              <h3 className="text-lg font-semibold">Active Rewards</h3>
            </div>
            <div className="text-3xl font-bold text-green-600 mb-2">
              {stats.activeRewards}
            </div>
            <p className="text-sm text-gray-600">Available value: {(stats.activeValue || 0).toLocaleString()} KES</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center mb-4">
              <FaCoins className="text-yellow-500 text-2xl mr-3" />
              <h3 className="text-lg font-semibold">Redeemed</h3>
            </div>
            <div className="text-3xl font-bold text-yellow-600 mb-2">
              {stats.redeemedRewards}
            </div>
            <p className="text-sm text-gray-600">Successfully redeemed rewards</p>
          </div>
        </div>
      )}

      {/* Rewards List */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold">Your Rewards</h2>
        </div>
        <div className="p-6">
          {rewards.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No rewards available</p>
          ) : (
            <div className="space-y-4">
              {rewards.map((reward) => (
                <div key={reward.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center mb-2">
                        {getRewardIcon(reward.type)}
                        <span className="ml-2 font-medium text-gray-900">
                          {getRewardTypeLabel(reward.type)}
                        </span>
                        <span className="ml-2 text-sm text-gray-500">
                          {(reward.amount || 0).toLocaleString()} {reward.currency || 'KES'}
                        </span>
                      </div>

                      <p className="text-gray-700 mb-2">{reward.description}</p>

                      <div className="flex items-center text-sm text-gray-600 mb-2">
                        {getStatusIcon(reward.status)}
                        <span className="ml-1">{getStatusLabel(reward.status)}</span>
                        <span className="mx-2">•</span>
                        <span>Created: {new Date(reward.createdAt).toLocaleDateString()}</span>
                        {reward.redeemedAt && (
                          <>
                            <span className="mx-2">•</span>
                            <span>Redeemed: {new Date(reward.redeemedAt).toLocaleDateString()}</span>
                          </>
                        )}
                      </div>

                      {reward.validUntil && (
                        <div className="text-xs text-gray-500">
                          Valid until: {new Date(reward.validUntil).toLocaleDateString()}
                        </div>
                      )}
                    </div>

                    <div className="ml-4">
                      {reward.status === 'pending' && (
                        <button
                          onClick={() => activateReward(reward.id)}
                          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        >
                          Activate
                        </button>
                      )}
                      {reward.status === 'active' && (
                        <button
                          onClick={() => redeemReward(reward.id)}
                          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                        >
                          Redeem
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserRewards; 