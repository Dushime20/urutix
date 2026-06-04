/**
 * Carrier Tier & Leaderboard — TRUCK_OWNER role
 * Route: /dashboard/fleet/tier
 * Layout: DashboardLayout (FleetOwnerLayout)
 */
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Award, TrendingUp, Star, ChevronRight, Trophy } from 'lucide-react';
import { carrierTierApi } from '../../../services/featuresApi';
import { TranslatedText } from '../../../components/translated-text';
import ModernLoader from '../../../components/common/ModernLoader';

const TIER_CONFIG: Record<string, { icon: string; color: string; bg: string; border: string; label: string }> = {
  PLATINUM: { icon: '💎', color: 'text-purple-700 dark:text-purple-300', bg: 'bg-purple-50 dark:bg-purple-900/20', border: 'border-purple-200 dark:border-purple-700', label: 'Platinum' },
  GOLD:     { icon: '🥇', color: 'text-yellow-700 dark:text-yellow-300', bg: 'bg-yellow-50 dark:bg-yellow-900/20', border: 'border-yellow-200 dark:border-yellow-700', label: 'Gold' },
  SILVER:   { icon: '🥈', color: 'text-slate-600 dark:text-slate-300',   bg: 'bg-slate-50 dark:bg-slate-800',       border: 'border-slate-200 dark:border-slate-700',   label: 'Silver' },
  BRONZE:   { icon: '🥉', color: 'text-orange-700 dark:text-orange-300', bg: 'bg-orange-50 dark:bg-orange-900/20', border: 'border-orange-200 dark:border-orange-700', label: 'Bronze' },
};

const TIER_ORDER = ['BRONZE', 'SILVER', 'GOLD', 'PLATINUM'];

const CarrierTierPage: React.FC = () => {
  const { data: myTier, isLoading: myLoading } = useQuery({
    queryKey: ['my-carrier-tier'],
    queryFn: carrierTierApi.getMyTier,
  });

  const { data: leaderboard = [], isLoading: lbLoading } = useQuery({
    queryKey: ['carrier-tier-leaderboard'],
    queryFn: carrierTierApi.getLeaderboard,
  });

  if (myLoading) return <ModernLoader isLoading text="Loading_Tier" />;

  const current = myTier?.currentTier ?? 'BRONZE';
  const next = myTier?.nextTier;
  const cfg = TIER_CONFIG[current] ?? TIER_CONFIG.BRONZE;
  const nextCfg = next ? TIER_CONFIG[next] : null;
  const stats = myTier?.currentStats ?? { onTimeRate: 0, damageRate: 0, totalTrips: 0 };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
          <TranslatedText text="Carrier Tier & Leaderboard" />
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          <TranslatedText text="Your performance tier is recalculated monthly based on on-time rate, damage rate, and trip volume." />
        </p>
      </div>

      {/* My Tier Card */}
      <div className={`rounded-2xl border p-6 ${cfg.bg} ${cfg.border}`}>
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-4">
            <div className="text-5xl">{cfg.icon}</div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                <TranslatedText text="Your Current Tier" />
              </p>
              <h2 className={`text-3xl font-black uppercase tracking-tight ${cfg.color}`}>
                {cfg.label}
              </h2>
            </div>
          </div>
          {next && nextCfg && (
            <div className="text-right">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                <TranslatedText text="Next Tier" />
              </p>
              <div className="flex items-center gap-1.5">
                <span className="text-xl">{nextCfg.icon}</span>
                <span className={`font-black text-sm ${nextCfg.color}`}>{nextCfg.label}</span>
              </div>
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-5">
          {[
            { label: 'On-Time Rate', value: `${stats.onTimeRate?.toFixed(1) ?? 0}%`, good: stats.onTimeRate >= 80 },
            { label: 'Damage Rate', value: `${stats.damageRate?.toFixed(1) ?? 0}%`, good: stats.damageRate <= 5 },
            { label: 'Total Trips', value: stats.totalTrips ?? 0, good: true },
          ].map(({ label, value, good }) => (
            <div key={label} className="bg-white/60 dark:bg-slate-900/40 rounded-xl p-3 text-center">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                <TranslatedText text={label} />
              </p>
              <p className={`text-lg font-black ${good ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                {value}
              </p>
            </div>
          ))}
        </div>

        {/* Progress to next tier */}
        {next && (
          <div className="bg-white/60 dark:bg-slate-900/40 rounded-xl p-4">
            <p className="text-xs font-black text-slate-600 dark:text-slate-400 mb-3 uppercase tracking-widest">
              <TranslatedText text="Progress to" /> {nextCfg?.label}
            </p>
            <div className="space-y-2">
              {myTier.tripsNeeded > 0 && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-600 dark:text-slate-400 font-bold">
                    <TranslatedText text="Trips needed" />
                  </span>
                  <span className="font-black text-slate-900 dark:text-white">{myTier.tripsNeeded} more</span>
                </div>
              )}
              {myTier.onTimeRateNeeded > 0 && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-600 dark:text-slate-400 font-bold">
                    <TranslatedText text="On-time rate needed" />
                  </span>
                  <span className="font-black text-slate-900 dark:text-white">+{myTier.onTimeRateNeeded.toFixed(1)}%</span>
                </div>
              )}
              {myTier.tripsNeeded === 0 && myTier.onTimeRateNeeded === 0 && (
                <p className="text-xs text-emerald-600 dark:text-emerald-400 font-black">
                  🎉 <TranslatedText text="You meet the requirements! Tier updates on the 1st of next month." />
                </p>
              )}
            </div>
          </div>
        )}

        {current === 'PLATINUM' && (
          <div className="bg-white/60 dark:bg-slate-900/40 rounded-xl p-4 text-center">
            <p className="text-sm font-black text-purple-700 dark:text-purple-300">
              💎 <TranslatedText text="You've reached the highest tier! Maintain your performance to keep Platinum status." />
            </p>
          </div>
        )}
      </div>

      {/* Tier Requirements */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-6">
        <div className="flex items-center gap-3 mb-5">
          <Award size={18} className="text-primary-600 dark:text-primary-400" />
          <h2 className="font-black text-slate-900 dark:text-white text-sm uppercase tracking-tight">
            <TranslatedText text="Tier Requirements" />
          </h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { tier: 'BRONZE', onTime: '0%+', damage: 'Any', trips: '0+' },
            { tier: 'SILVER', onTime: '80%+', damage: '<5%', trips: '10+' },
            { tier: 'GOLD', onTime: '90%+', damage: '<2%', trips: '20+' },
            { tier: 'PLATINUM', onTime: '95%+', damage: '<1%', trips: '50+' },
          ].map(({ tier, onTime, damage, trips }) => {
            const c = TIER_CONFIG[tier];
            const isCurrentTier = tier === current;
            return (
              <div key={tier} className={`rounded-xl p-4 border ${c.bg} ${c.border} ${isCurrentTier ? 'ring-2 ring-primary-500' : ''}`}>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xl">{c.icon}</span>
                  <span className={`text-xs font-black uppercase ${c.color}`}>{c.label}</span>
                  {isCurrentTier && <span className="ml-auto text-[9px] font-black text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/30 px-1.5 py-0.5 rounded">YOU</span>}
                </div>
                <div className="space-y-1 text-[10px] text-slate-600 dark:text-slate-400">
                  <div className="flex justify-between"><span>On-Time</span><span className="font-black">{onTime}</span></div>
                  <div className="flex justify-between"><span>Damage</span><span className="font-black">{damage}</span></div>
                  <div className="flex justify-between"><span>Trips</span><span className="font-black">{trips}</span></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Leaderboard */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3">
          <Trophy size={16} className="text-yellow-500" />
          <h2 className="font-black text-slate-900 dark:text-white text-sm uppercase tracking-tight">
            <TranslatedText text="Tenant Leaderboard" />
          </h2>
        </div>
        {lbLoading ? (
          <div className="p-6"><ModernLoader isLoading type="table" rows={5} columns={4} /></div>
        ) : (leaderboard as any[]).length === 0 ? (
          <div className="p-10 text-center text-slate-400 dark:text-slate-500 text-sm">
            <TranslatedText text="No leaderboard data yet." />
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {(leaderboard as any[]).map((entry: any, idx: number) => {
              const c = TIER_CONFIG[entry.tier] ?? TIER_CONFIG.BRONZE;
              return (
                <div key={entry.id} className="flex items-center gap-4 px-6 py-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-sm ${idx === 0 ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300' : idx === 1 ? 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300' : idx === 2 ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300' : 'bg-slate-50 text-slate-400 dark:bg-slate-800/50 dark:text-slate-500'}`}>
                    {idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-black text-slate-900 dark:text-white truncate">
                      {entry.truckOwnerId?.slice(0, 12)}...
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={`text-[10px] font-black ${c.color}`}>{c.icon} {c.label}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-black text-emerald-600 dark:text-emerald-400">{entry.onTimeRate?.toFixed(1)}%</p>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500">{entry.totalTrips} trips</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default CarrierTierPage;
