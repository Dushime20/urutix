import React, { useState, useEffect } from 'react';
import {
  Gift,
  CheckCircle,
  Coins,
  CreditCard,
  Star,
  TrendingUp,
  Award,
  Zap,
  Ticket
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import StatCard from '../components/EnliteUI/Cards/StatCard';
import DataCard from '../components/EnliteUI/Cards/DataCard';
import ModernLoader from '../components/common/ModernLoader';

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
        setRewards([]);
        return;
      }
      const data = await response.json();
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
      setStats({
        totalRewards: data?.totalRewards || 0,
        activeRewards: data?.activeRewards || 0,
        redeemedRewards: data?.redeemedRewards || 0,
        totalValue: data?.totalValue || 0,
        pendingValue: data?.pendingValue || 0,
        activeValue: data?.activeValue || 0,
      });
    } catch (error) {
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
        return <CreditCard className="text-primary-500" size={20} />;
      case 'volume_bonus':
        return <Coins className="text-amber-500" size={20} />;
      case 'loyalty_points':
        return <Star className="text-purple-500" size={20} />;
      case 'cashback':
        return <Gift className="text-emerald-500" size={20} />;
      case 'discount':
        return <Ticket className="text-orange-500" size={20} />;
      case 'premium_features':
        return <Zap className="text-primary-500" size={20} />;
      default:
        return <Award className="text-slate-500" size={20} />;
    }
  };

  const getRewardTypeLabel = (type: string) => {
    return type.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-amber-50 text-amber-700 border border-amber-200';
      case 'active': return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
      case 'redeemed': return 'bg-primary-50 text-blue-700 border border-primary-200';
      case 'expired': return 'bg-rose-50 text-rose-700 border border-rose-200';
      default: return 'bg-slate-50 text-slate-600 border border-slate-200';
    }
  };

  if (loading) {
    return <ModernLoader isLoading={true} type="page" showStats={true} />;
  }

  return (
    <div className="space-y-8">
      {/* Header handled by parent or just internal spacing */}
      <div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-2">Rewards & Benefits</h1>
        <p className="text-slate-500 font-medium">Unlock exclusive perks, manage bonuses, and track your loyalty progress.</p>
      </div>

      {/* Stats Matrix */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard
            title="Total Rewards"
            value={stats.totalRewards}
            icon={<Award />}
            color="primary"
            subtitle={`Total Value: ${(stats.totalValue || 0).toLocaleString()} KES`}
          />
          <StatCard
            title="Active Rewards"
            value={stats.activeRewards}
            icon={<CheckCircle />}
            color="success"
            subtitle={`Available: ${(stats.activeValue || 0).toLocaleString()} KES`}
          />
          <StatCard
            title="Redeemed"
            value={stats.redeemedRewards}
            icon={<Coins />}
            color="accent"
            subtitle="Successfully Claimed"
          />
        </div>
      )}

      {/* Rewards List */}
      <DataCard
        title="Your Rewards"
        icon={<Gift />}
        headerColor="primary"
        actions={
          <button className="text-[10px] font-black uppercase tracking-wider text-primary-500 hover:underline">
            View History
          </button>
        }
      >
        <div className="p-6">
          {rewards.length === 0 ? (
            <div className="text-center py-12">
              <div className="h-16 w-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Gift className="text-slate-300" size={32} />
              </div>
              <p className="text-slate-500 font-medium">No rewards available yet.</p>
              <p className="text-xs text-slate-400 mt-1">Keep using the platform to earn more!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {rewards.map((reward) => (
                <div
                  key={reward.id}
                  className="group relative bg-white border border-slate-100 rounded-2xl p-5 hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-4">
                    <div className="h-12 w-12 rounded-xl bg-slate-50 flex items-center justify-center shrink-0 group-hover:bg-primary-50 transition-colors">
                      {getRewardIcon(reward.type)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-slate-900">{getRewardTypeLabel(reward.type)}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${getStatusColor(reward.status)}`}>
                          {reward.status}
                        </span>
                      </div>
                      <p className="text-sm text-slate-600 mb-1">{reward.description}</p>
                      <div className="flex items-center gap-3 text-xs text-slate-400 font-medium">
                        <span className="flex items-center gap-1">
                          <TrendingUp size={12} />
                          {(reward.amount || 0).toLocaleString()} {reward.currency || 'KES'}
                        </span>
                        <span>•</span>
                        <span>{new Date(reward.createdAt).toLocaleDateString()}</span>
                        {reward.validUntil && (
                          <>
                            <span>•</span>
                            <span className="text-amber-500">Exp: {new Date(reward.validUntil).toLocaleDateString()}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-end md:self-center">
                    {reward.status === 'pending' && (
                      <button
                        onClick={() => activateReward(reward.id)}
                        className="px-5 py-2 bg-primary-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-primary-600 transition-colors shadow-sm"
                      >
                        Activate
                      </button>
                    )}
                    {reward.status === 'active' && (
                      <button
                        onClick={() => redeemReward(reward.id)}
                        className="px-5 py-2 bg-emerald-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 transition-colors shadow-sm flex items-center gap-2"
                      >
                        <CheckCircle size={14} />
                        Redeem
                      </button>
                    )}
                    {reward.status === 'redeemed' && (
                      <span className="flex items-center gap-1.5 text-xs font-bold text-slate-400 uppercase tracking-wider">
                        <CheckCircle size={14} /> Claimed
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </DataCard>
    </div>
  );
};

export default UserRewards;
