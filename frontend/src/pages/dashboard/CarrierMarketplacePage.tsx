/**
 * Carrier Marketplace — CARGO_OWNER role
 * Route: /dashboard/carrier-marketplace
 * Layout: DashboardLayout (CargoOwnerLayout)
 */
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Search, Star, Truck, Shield, UserPlus, UserCheck,
  Filter, ChevronDown, Award, TrendingUp, Package
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { carrierMarketplaceApi, carrierTierApi } from '../../services/featuresApi';
import { TranslatedText } from '../../components/translated-text';
import ModernLoader from '../../components/common/ModernLoader';

const TIER_COLORS: Record<string, string> = {
  PLATINUM: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 border-purple-200 dark:border-purple-700',
  GOLD: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300 border-yellow-200 dark:border-yellow-700',
  SILVER: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700',
  BRONZE: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300 border-orange-200 dark:border-orange-700',
};

const TIER_ICONS: Record<string, string> = {
  PLATINUM: '💎', GOLD: '🥇', SILVER: '🥈', BRONZE: '🥉',
};

const CarrierMarketplacePage: React.FC = () => {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [tierFilter, setTierFilter] = useState('');
  const [availableOnly, setAvailableOnly] = useState(false);
  const [selectedCarrier, setSelectedCarrier] = useState<any>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['carrier-marketplace', tierFilter, availableOnly],
    queryFn: () => carrierMarketplaceApi.browse({ tier: tierFilter || undefined, available: availableOnly || undefined }),
  });

  const { data: featured } = useQuery({
    queryKey: ['carrier-marketplace-featured'],
    queryFn: carrierMarketplaceApi.getFeatured,
  });

  const { data: network = [] } = useQuery({
    queryKey: ['carrier-network'],
    queryFn: carrierMarketplaceApi.getNetwork,
  });

  const inviteMutation = useMutation({
    mutationFn: (truckOwnerId: string) => carrierMarketplaceApi.inviteToNetwork(truckOwnerId),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['carrier-network'] }); toast.success('Carrier added to your private network'); },
    onError: () => toast.error('Failed to add carrier'),
  });

  const removeMutation = useMutation({
    mutationFn: (truckOwnerId: string) => carrierMarketplaceApi.removeFromNetwork(truckOwnerId),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['carrier-network'] }); toast.success('Carrier removed from network'); },
  });

  const carriers: any[] = data?.carriers ?? [];
  const networkIds = new Set((network as any[]).map((n: any) => n.truckOwnerId));

  const filtered = carriers.filter(c => {
    if (!search) return true;
    const name = `${c.firstName ?? ''} ${c.lastName ?? ''} ${c.companyName ?? ''}`.toLowerCase();
    return name.includes(search.toLowerCase());
  });

  if (isLoading) return <ModernLoader isLoading text="Loading_Carriers" />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
          <TranslatedText text="Carrier Marketplace" />
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          <TranslatedText text="Discover and vet carriers. Build your private network of trusted partners." />
        </p>
      </div>

      {/* Featured Platinum Carriers */}
      {(featured as any[])?.length > 0 && (
        <div className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-2xl p-5 border border-purple-100 dark:border-purple-800">
          <div className="flex items-center gap-2 mb-3">
            <Award size={18} className="text-purple-600 dark:text-purple-400" />
            <h2 className="font-black text-sm text-purple-700 dark:text-purple-300 uppercase tracking-widest">
              <TranslatedText text="Featured Platinum Carriers" />
            </h2>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-1">
            {(featured as any[]).slice(0, 5).map((f: any) => (
              <div key={f.id} className="flex-shrink-0 bg-white dark:bg-slate-900 rounded-xl px-4 py-3 border border-purple-100 dark:border-purple-800 flex items-center gap-3 min-w-[200px]">
                <div className="w-9 h-9 rounded-full bg-purple-100 dark:bg-purple-900/40 flex items-center justify-center text-lg">💎</div>
                <div>
                  <p className="text-xs font-black text-slate-900 dark:text-white">{f.truckOwnerId?.slice(0, 8)}...</p>
                  <p className="text-[10px] text-purple-600 dark:text-purple-400 font-bold">{f.onTimeRate?.toFixed(1)}% on-time</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-4 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search carriers..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
        <select
          value={tierFilter}
          onChange={e => setTierFilter(e.target.value)}
          className="px-3 py-2 text-xs font-bold border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-primary-500"
        >
          <option value="">All Tiers</option>
          <option value="PLATINUM">💎 Platinum</option>
          <option value="GOLD">🥇 Gold</option>
          <option value="SILVER">🥈 Silver</option>
          <option value="BRONZE">🥉 Bronze</option>
        </select>
        <label className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-400 cursor-pointer">
          <input type="checkbox" checked={availableOnly} onChange={e => setAvailableOnly(e.target.checked)} className="rounded" />
          <TranslatedText text="Available Now" />
        </label>
        <span className="text-xs font-black text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 px-3 py-2 rounded-xl">
          {filtered.length} <TranslatedText text="carriers" />
        </span>
      </div>

      {/* Carrier Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800">
          <Truck size={40} className="mx-auto text-slate-300 dark:text-slate-600 mb-3" />
          <p className="text-slate-500 dark:text-slate-400 font-medium">
            <TranslatedText text="No carriers found matching your filters." />
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((carrier: any) => {
            const inNetwork = networkIds.has(carrier.truckOwnerId);
            const tierColor = TIER_COLORS[carrier.tier] ?? TIER_COLORS.BRONZE;
            const tierIcon = TIER_ICONS[carrier.tier] ?? '🥉';
            return (
              <div
                key={carrier.truckOwnerId}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-5 hover:shadow-md transition-all cursor-pointer group"
                onClick={() => setSelectedCarrier(carrier)}
              >
                {/* Top row */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xl font-black text-slate-600 dark:text-slate-300">
                      {(carrier.companyName ?? carrier.firstName ?? 'C')[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="font-black text-sm text-slate-900 dark:text-white leading-tight">
                        {carrier.companyName ?? (`${carrier.firstName ?? ''} ${carrier.lastName ?? ''}`.trim() || 'Carrier')}
                      </p>
                      {carrier.tier && (
                        <span className={`inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full border mt-1 ${tierColor}`}>
                          {tierIcon} {carrier.tier}
                        </span>
                      )}
                    </div>
                  </div>
                  {inNetwork && (
                    <span className="flex items-center gap-1 text-[10px] font-black text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-1 rounded-lg">
                      <Shield size={10} /> Network
                    </span>
                  )}
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-2 mb-4">
                  <div className="text-center bg-slate-50 dark:bg-slate-800 rounded-xl py-2">
                    <p className="text-sm font-black text-slate-900 dark:text-white">{carrier.totalTrucks}</p>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider">Trucks</p>
                  </div>
                  <div className="text-center bg-slate-50 dark:bg-slate-800 rounded-xl py-2">
                    <p className="text-sm font-black text-slate-900 dark:text-white">{carrier.averageRating?.toFixed(1) ?? '—'}</p>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider">Rating</p>
                  </div>
                  <div className="text-center bg-slate-50 dark:bg-slate-800 rounded-xl py-2">
                    <p className="text-sm font-black text-slate-900 dark:text-white">{carrier.availableTrucks}</p>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider">Available</p>
                  </div>
                </div>

                {carrier.onTimeRate !== undefined && (
                  <div className="mb-4">
                    <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">
                      <span>On-Time Rate</span>
                      <span>{carrier.onTimeRate?.toFixed(1)}%</span>
                    </div>
                    <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full transition-all"
                        style={{ width: `${carrier.onTimeRate ?? 0}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Action */}
                <button
                  onClick={e => {
                    e.stopPropagation();
                    inNetwork ? removeMutation.mutate(carrier.truckOwnerId) : inviteMutation.mutate(carrier.truckOwnerId);
                  }}
                  className={`w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-black transition-all ${
                    inNetwork
                      ? 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600'
                      : 'bg-primary-600 hover:bg-primary-700 text-white'
                  }`}
                >
                  {inNetwork ? <><UserCheck size={12} /> In Network</> : <><UserPlus size={12} /> Add to Network</>}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Carrier Detail Modal */}
      {selectedCarrier && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setSelectedCarrier(null)}>
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-lg p-6 border border-slate-100 dark:border-slate-800" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">
                {selectedCarrier.companyName ?? (`${selectedCarrier.firstName ?? ''} ${selectedCarrier.lastName ?? ''}`.trim() || 'Carrier Profile')}
              </h2>
              <button onClick={() => setSelectedCarrier(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xl font-bold">×</button>
            </div>
            <div className="grid grid-cols-2 gap-4 mb-5">
              {[
                { label: 'Total Trucks', value: selectedCarrier.totalTrucks },
                { label: 'Available', value: selectedCarrier.availableTrucks },
                { label: 'Rating', value: selectedCarrier.averageRating?.toFixed(2) ?? '—' },
                { label: 'Total Trips', value: selectedCarrier.totalTrips ?? '—' },
                { label: 'On-Time Rate', value: selectedCarrier.onTimeRate ? `${selectedCarrier.onTimeRate.toFixed(1)}%` : '—' },
                { label: 'Tier', value: selectedCarrier.tier ?? 'BRONZE' },
              ].map(({ label, value }) => (
                <div key={label} className="bg-slate-50 dark:bg-slate-800 rounded-xl p-3">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
                  <p className="text-sm font-black text-slate-900 dark:text-white mt-0.5">{value}</p>
                </div>
              ))}
            </div>
            {selectedCarrier.trucks?.length > 0 && (
              <div>
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Fleet Sample</p>
                <div className="space-y-2">
                  {selectedCarrier.trucks.slice(0, 3).map((t: any) => (
                    <div key={t.id} className="flex items-center justify-between bg-slate-50 dark:bg-slate-800 rounded-xl px-3 py-2">
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{t.truckType}</span>
                      <span className="text-xs text-slate-400">{t.plateNumber}</span>
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${t.status === 'AVAILABLE' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-slate-200 text-slate-500 dark:bg-slate-700 dark:text-slate-400'}`}>
                        {t.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CarrierMarketplacePage;
