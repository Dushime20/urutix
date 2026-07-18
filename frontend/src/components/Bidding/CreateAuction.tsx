import React, { useState, useEffect } from 'react';
import { Gavel, Loader2, AlertCircle, CheckCircle2, X, PlusCircle, Info, Calendar, DollarSign, Settings, Truck, ArrowRight, TrendingDown, Clock, Zap } from 'lucide-react';
import { loadsAPI } from '../../services/load';
import { biddingAPI } from '../../services/biddingApi';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';
import AuctionTypeSelector, { AuctionType } from './AuctionTypeSelector';
import { formatLocation } from '../../utils/formatLocation';

interface Cargo {
  id: string;
  title?: string;
  description?: string;
  origin?: string | Record<string, unknown>;
  destination?: string | Record<string, unknown>;
  status?: string;
  brokerId?: string;
  broker?: {
    id: string;
    email: string;
  };
}

const CreateAuction: React.FC = () => {
  const { user } = useAuth();
  const [cargos, setCargos] = useState<Cargo[]>([]);
  const [loadingCargos, setLoadingCargos] = useState(false);
  const [formData, setFormData] = useState({
    loadId: '',
    auctionType: 'REVERSE' as AuctionType,
    auctionStart: '',
    auctionEnd: '',
    reservePrice: '',
    // REVERSE auction fields
    targetPrice: '',
    maxBudget: '',
    minimumBidDecrement: '',
    // FORWARD auction fields
    startingPrice: '',
    minimumBidIncrement: '',
    // DUTCH auction fields
    dropInterval: '60',
    dropAmount: '',
    // SEALED auction fields
    bidVisibility: 'HIDDEN',
    allowBidRevision: false,
    selectionCriteria: 'LOWEST_BID',
    // Common fields
    marketRate: '',
    autoExtend: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    loadCargos();
  }, [user]);

  const loadCargos = async () => {
    if (!user) return;

    setLoadingCargos(true);
    try {
      const response = await loadsAPI.getAll();

      // Fetch existing auctions to filter out cargos that are already being auctioned
      const activeAuctionLoadIds = new Set<string>();
      try {
        const auctionsResponse = await biddingAPI.getAuctions({ limit: 1000 });
        const auctions = auctionsResponse.data || [];
        // Filter for auctions that are active, scheduled, or paused
        // We assume CLOSED or CANCELLED auctions allow the cargo to be re-auctioned if the load status permits
        auctions.forEach((auction: any) => {
          if (['ACTIVE', 'SCHEDULED', 'PAUSED'].includes(auction.status)) {
            activeAuctionLoadIds.add(auction.loadId);
          }
        });
      } catch (err) {
        console.error('Error loading auctions for filtering:', err);
        // Continue without filtering if auctions fail to load, or handle error?
        // Ideally we should warn, but for now we proceed.
      }

      // Handle different response structures
      let cargosList: Cargo[] = [];
      if (response.data?.items) {
        cargosList = response.data.items;
      } else if (response.data?.cargos) {
        cargosList = response.data.cargos;
      } else if (Array.isArray(response.data)) {
        cargosList = response.data;
      } else if (Array.isArray(response)) {
        cargosList = response;
      }

      // Filter cargos that can be auctioned (CREATED, PUBLISHED status)
      // Logic depends on user role:
      // - Brokers should see loads assigned to them
      // - Cargo Owners should see loads NOT assigned to a broker (broker manages those)
      const availableCargos = cargosList.filter((cargo: Cargo) => {
        // First check if cargo is already being auctioned
        if (activeAuctionLoadIds.has(cargo.id)) return false;

        const validStatus = cargo.status === 'CREATED' || cargo.status === 'PUBLISHED' || !cargo.status;

        if (!validStatus) return false;

        // Check user role (assuming 'BROKER' is the value)
        if (user?.role === 'BROKER') {
          // Broker sees loads where they are the assigned broker
          return cargo.brokerId === user.id || cargo.broker?.id === user.id;
        } else {
          // Cargo Owner (or others) sees loads NOT assigned to a broker
          return !cargo.brokerId && !cargo.broker;
        }
      });

      setCargos(availableCargos);
    } catch (err: any) {
      console.error('Error loading cargos:', err);
      toast.error('Failed to load cargos. Please try again.');
      setCargos([]);
    } finally {
      setLoadingCargos(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    if (!formData.loadId) {
      setError('Please select a cargo');
      setLoading(false);
      return;
    }

    try {
      // Convert datetime-local values (which are in local time, no timezone) to proper ISO strings.
      // new Date() on a datetime-local string treats it as UTC, which causes wrong status
      // assignment on the backend. We must convert to UTC-aware ISO strings explicitly.
      const toISOString = (localDatetime: string): string => {
        if (!localDatetime) return '';
        // datetime-local format: "YYYY-MM-DDTHH:mm" — no timezone
        // Create a Date using the local interpretation, then convert to ISO (UTC)
        return new Date(localDatetime).toISOString();
      };

      const auctionData: any = {
        loadId: formData.loadId,
        auctionType: formData.auctionType,
        auctionStart: toISOString(formData.auctionStart),
        auctionEnd: toISOString(formData.auctionEnd),
        reservePrice: formData.reservePrice ? parseFloat(formData.reservePrice) : undefined,
      };

      // Add type-specific fields
      if (formData.auctionType === 'REVERSE') {
        if (formData.targetPrice) auctionData.targetPrice = parseFloat(formData.targetPrice);
        if (formData.maxBudget) auctionData.maxBudget = parseFloat(formData.maxBudget);
        if (formData.minimumBidDecrement) auctionData.minimumBidDecrement = parseFloat(formData.minimumBidDecrement);
      } else if (formData.auctionType === 'FORWARD') {
        if (formData.startingPrice) auctionData.startingPrice = parseFloat(formData.startingPrice);
        if (formData.minimumBidIncrement) auctionData.minimumBidIncrement = parseFloat(formData.minimumBidIncrement);
      } else if (formData.auctionType === 'DUTCH') {
        if (formData.startingPrice) auctionData.startingPrice = parseFloat(formData.startingPrice);
        if (formData.dropInterval) auctionData.dropInterval = parseInt(formData.dropInterval);
        if (formData.dropAmount) auctionData.dropAmount = parseFloat(formData.dropAmount);
      } else if (formData.auctionType === 'SEALED') {
        auctionData.bidVisibility = formData.bidVisibility;
        auctionData.allowBidRevision = formData.allowBidRevision;
        auctionData.selectionCriteria = formData.selectionCriteria;
      }

      // Add common optional fields
      if (formData.marketRate) auctionData.marketRate = parseFloat(formData.marketRate);
      auctionData.autoExtend = formData.autoExtend;

      await biddingAPI.createAuction(auctionData);

      toast.success('Auction created successfully!');
      setSuccess('Auction created successfully!');
      setFormData({
        loadId: '',
        auctionType: 'REVERSE' as AuctionType,
        auctionStart: '',
        auctionEnd: '',
        reservePrice: '',
        targetPrice: '',
        maxBudget: '',
        minimumBidDecrement: '',
        startingPrice: '',
        minimumBidIncrement: '',
        dropInterval: '60',
        dropAmount: '',
        bidVisibility: 'HIDDEN',
        allowBidRevision: false,
        selectionCriteria: 'LOWEST_BID',
        marketRate: '',
        autoExtend: false,
      });

      // Reload cargos to refresh the list
      await loadCargos();
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || 'Failed to create auction. Please try again.';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-900/10 flex items-center justify-center">
              <PlusCircle className="w-6 h-6 text-[#345E85] dark:text-blue-400" />
            </div>
            <h1 className="text-4xl font-black text-[#0f172a] dark:text-slate-100 tracking-tight">Auction Setup</h1>
          </div>
          <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest max-w-xl">
            Configure high-velocity auctions and attract elite transportation partners
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 p-4 rounded-xl mb-6 flex items-center gap-3 animate-in slide-in-from-top-2">
          <div className="w-8 h-8 bg-red-100 dark:bg-red-950 rounded-lg flex items-center justify-center shrink-0">
            <AlertCircle className="text-red-600 dark:text-red-500" size={18} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-xs font-black text-red-900 dark:text-red-400 uppercase tracking-tight italic leading-tight">{error}</h3>
          </div>
          <button onClick={() => setError(null)} className="p-1 text-red-400 dark:text-red-600 hover:text-red-600 dark:hover:text-red-500 transition-colors">
            <X size={16} />
          </button>
        </div>
      )}

      {success && (
        <div className="bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900/30 p-4 rounded-xl mb-6 flex items-center gap-3 animate-in slide-in-from-top-2">
          <div className="w-8 h-8 bg-emerald-100 dark:bg-emerald-950 rounded-lg flex items-center justify-center shrink-0">
            <CheckCircle2 className="text-emerald-600 dark:text-emerald-500" size={18} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-xs font-black text-emerald-900 dark:text-emerald-400 uppercase tracking-tight italic leading-tight">{success}</h3>
          </div>
          <button onClick={() => setSuccess(null)} className="p-1 text-emerald-400 dark:text-emerald-600 hover:text-emerald-600 dark:hover:text-emerald-500 transition-colors">
            <X size={16} />
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-10 border border-slate-100 dark:border-slate-800 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <div className="md:col-span-2 space-y-3">
              <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] ml-1">Cargo Selection</label>
              {loadingCargos ? (
                <div className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-2xl flex items-center gap-4">
                  <Loader2 className="animate-spin text-[#345E85] dark:text-blue-400" size={18} />
                  <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Scanning manifests...</span>
                </div>
              ) : (
                <div className="relative group">
                   <select
                    value={formData.loadId}
                    onChange={(e) => handleInputChange('loadId', e.target.value)}
                    required
                    className="w-full px-6 py-4 text-sm font-black bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 text-gray-900 dark:text-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-[#345E85] dark:focus:border-blue-900 transition-all appearance-none cursor-pointer uppercase italic h-[60px]"
                  >
                    <option value="" className="dark:bg-slate-900">-- Choose Cargo --</option>
                    {cargos.map((cargo) => (
                      <option key={cargo.id} value={cargo.id} className="dark:bg-slate-900">
                        {cargo.title || cargo.description || `CARGO - ${cargo.id.slice(0, 8)} `}
                        {cargo.origin && cargo.destination && ` [${formatLocation(cargo.origin)} >> ${formatLocation(cargo.destination)}]`}
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 dark:text-slate-600 group-hover:text-[#345E85] dark:group-hover:text-blue-400 transition-colors">
                    <Truck size={20} />
                  </div>
                </div>
              )}
               {cargos.length === 0 && !loadingCargos && (
                <div className="flex items-center gap-2 px-2">
                  <Info size={14} className="text-amber-500 dark:text-amber-400" />
                  <p className="text-[10px] font-bold text-amber-600 dark:text-amber-500 uppercase tracking-widest">
                    No eligible cargos found. Register cargo before setup.
                  </p>
                </div>
              )}
            </div>

            {/* Auction Type Selector */}
            <div className="md:col-span-2 space-y-6">
              <AuctionTypeSelector
                selected={formData.auctionType}
                onChange={(type) => handleInputChange('auctionType', type)}
              />
            </div>

            {/* REVERSE Auction Fields */}
            {formData.auctionType === 'REVERSE' && (
              <>
                <div className="space-y-3">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">
                    Reserve Price (Minimum) *
                  </label>
                  <div className="relative group">
                    <input
                      type="number"
                      step="0.01"
                      value={formData.reservePrice}
                      onChange={(e) => handleInputChange('reservePrice', e.target.value)}
                      placeholder="MINIMUM ACCEPTABLE"
                      required
                      className="w-full px-6 py-4 text-sm font-black bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 text-gray-900 dark:text-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-[#345E85] dark:focus:border-blue-900 transition-all uppercase italic h-[60px] pl-14 placeholder:text-slate-300 dark:placeholder:text-slate-700"
                    />
                    <div className="absolute left-6 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 dark:text-slate-600">
                      <DollarSign size={20} />
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">
                    Target Price (Your Goal) *
                  </label>
                  <div className="relative group">
                    <input
                      type="number"
                      step="0.01"
                      value={formData.targetPrice}
                      onChange={(e) => handleInputChange('targetPrice', e.target.value)}
                      placeholder="YOUR GOAL PRICE"
                      required
                      className="w-full px-6 py-4 text-sm font-black bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 text-gray-900 dark:text-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-[#345E85] dark:focus:border-blue-900 transition-all uppercase italic h-[60px] pl-14 placeholder:text-slate-300 dark:placeholder:text-slate-700"
                    />
                    <div className="absolute left-6 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 dark:text-slate-600">
                      <TrendingDown size={20} />
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">
                    Max Budget (Hidden)
                  </label>
                  <div className="relative group">
                    <input
                      type="number"
                      step="0.01"
                      value={formData.maxBudget}
                      onChange={(e) => handleInputChange('maxBudget', e.target.value)}
                      placeholder="MAXIMUM YOU CAN PAY"
                      className="w-full px-6 py-4 text-sm font-black bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 text-gray-900 dark:text-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-[#345E85] dark:focus:border-blue-900 transition-all uppercase italic h-[60px] pl-14 placeholder:text-slate-300 dark:placeholder:text-slate-700"
                    />
                    <div className="absolute left-6 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 dark:text-slate-600">
                      <DollarSign size={20} />
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">
                    Min Bid Decrement
                  </label>
                  <div className="relative group">
                    <input
                      type="number"
                      step="0.01"
                      value={formData.minimumBidDecrement}
                      onChange={(e) => handleInputChange('minimumBidDecrement', e.target.value)}
                      placeholder="MINIMUM DECREASE"
                      className="w-full px-6 py-4 text-sm font-black bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 text-gray-900 dark:text-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-[#345E85] dark:focus:border-blue-900 transition-all uppercase italic h-[60px] pl-14 placeholder:text-slate-300 dark:placeholder:text-slate-700"
                    />
                    <div className="absolute left-6 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 dark:text-slate-600">
                      <DollarSign size={20} />
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* FORWARD Auction Fields */}
            {formData.auctionType === 'FORWARD' && (
              <>
                <div className="space-y-3">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">
                    Starting Price (Entry Point) *
                  </label>
                  <div className="relative group">
                    <input
                      type="number"
                      step="0.01"
                      value={formData.startingPrice}
                      onChange={(e) => handleInputChange('startingPrice', e.target.value)}
                      placeholder="STARTING BID"
                      required
                      className="w-full px-6 py-4 text-sm font-black bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 text-gray-900 dark:text-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-[#345E85] dark:focus:border-blue-900 transition-all uppercase italic h-[60px] pl-14 placeholder:text-slate-300 dark:placeholder:text-slate-700"
                    />
                    <div className="absolute left-6 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 dark:text-slate-600">
                      <DollarSign size={20} />
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">
                    Reserve Price (Min to Win) *
                  </label>
                  <div className="relative group">
                    <input
                      type="number"
                      step="0.01"
                      value={formData.reservePrice}
                      onChange={(e) => handleInputChange('reservePrice', e.target.value)}
                      placeholder="MINIMUM TO WIN"
                      required
                      className="w-full px-6 py-4 text-sm font-black bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 text-gray-900 dark:text-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-[#345E85] dark:focus:border-blue-900 transition-all uppercase italic h-[60px] pl-14 placeholder:text-slate-300 dark:placeholder:text-slate-700"
                    />
                    <div className="absolute left-6 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 dark:text-slate-600">
                      <DollarSign size={20} />
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">
                    Min Bid Increment
                  </label>
                  <div className="relative group">
                    <input
                      type="number"
                      step="0.01"
                      value={formData.minimumBidIncrement}
                      onChange={(e) => handleInputChange('minimumBidIncrement', e.target.value)}
                      placeholder="MINIMUM INCREASE"
                      className="w-full px-6 py-4 text-sm font-black bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 text-gray-900 dark:text-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-[#345E85] dark:focus:border-blue-900 transition-all uppercase italic h-[60px] pl-14 placeholder:text-slate-300 dark:placeholder:text-slate-700"
                    />
                    <div className="absolute left-6 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 dark:text-slate-600">
                      <DollarSign size={20} />
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* DUTCH Auction Fields */}
            {formData.auctionType === 'DUTCH' && (
              <>
                <div className="space-y-3">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">
                    Starting Price (High) *
                  </label>
                  <div className="relative group">
                    <input
                      type="number"
                      step="0.01"
                      value={formData.startingPrice}
                      onChange={(e) => handleInputChange('startingPrice', e.target.value)}
                      placeholder="HIGH START PRICE"
                      required
                      className="w-full px-6 py-4 text-sm font-black bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 text-gray-900 dark:text-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-[#345E85] dark:focus:border-blue-900 transition-all uppercase italic h-[60px] pl-14 placeholder:text-slate-300 dark:placeholder:text-slate-700"
                    />
                    <div className="absolute left-6 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 dark:text-slate-600">
                      <DollarSign size={20} />
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">
                    Reserve Price (Floor) *
                  </label>
                  <div className="relative group">
                    <input
                      type="number"
                      step="0.01"
                      value={formData.reservePrice}
                      onChange={(e) => handleInputChange('reservePrice', e.target.value)}
                      placeholder="FLOOR PRICE"
                      required
                      className="w-full px-6 py-4 text-sm font-black bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 text-gray-900 dark:text-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-[#345E85] dark:focus:border-blue-900 transition-all uppercase italic h-[60px] pl-14 placeholder:text-slate-300 dark:placeholder:text-slate-700"
                    />
                    <div className="absolute left-6 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 dark:text-slate-600">
                      <DollarSign size={20} />
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">
                    Drop Interval (Seconds) *
                  </label>
                  <div className="relative group">
                    <input
                      type="number"
                      value={formData.dropInterval}
                      onChange={(e) => handleInputChange('dropInterval', e.target.value)}
                      placeholder="60"
                      required
                      className="w-full px-6 py-4 text-sm font-black bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 text-gray-900 dark:text-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-[#345E85] dark:focus:border-blue-900 transition-all uppercase italic h-[60px] pl-14 placeholder:text-slate-300 dark:placeholder:text-slate-700"
                    />
                    <div className="absolute left-6 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 dark:text-slate-600">
                      <Clock size={20} />
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">
                    Drop Amount *
                  </label>
                  <div className="relative group">
                    <input
                      type="number"
                      step="0.01"
                      value={formData.dropAmount}
                      onChange={(e) => handleInputChange('dropAmount', e.target.value)}
                      placeholder="AMOUNT PER DROP"
                      required
                      className="w-full px-6 py-4 text-sm font-black bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 text-gray-900 dark:text-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-[#345E85] dark:focus:border-blue-900 transition-all uppercase italic h-[60px] pl-14 placeholder:text-slate-300 dark:placeholder:text-slate-700"
                    />
                    <div className="absolute left-6 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 dark:text-slate-600">
                      <Zap size={20} />
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* SEALED Auction Fields */}
            {formData.auctionType === 'SEALED' && (
              <>
                <div className="space-y-3">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">
                    Reserve Price (Minimum) *
                  </label>
                  <div className="relative group">
                    <input
                      type="number"
                      step="0.01"
                      value={formData.reservePrice}
                      onChange={(e) => handleInputChange('reservePrice', e.target.value)}
                      placeholder="MINIMUM ACCEPTABLE"
                      required
                      className="w-full px-6 py-4 text-sm font-black bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 text-gray-900 dark:text-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-[#345E85] dark:focus:border-blue-900 transition-all uppercase italic h-[60px] pl-14 placeholder:text-slate-300 dark:placeholder:text-slate-700"
                    />
                    <div className="absolute left-6 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 dark:text-slate-600">
                      <DollarSign size={20} />
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">
                    Bid Visibility
                  </label>
                  <div className="relative group">
                    <select
                      value={formData.bidVisibility}
                      onChange={(e) => handleInputChange('bidVisibility', e.target.value)}
                      className="w-full px-6 py-4 text-sm font-black bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 text-gray-900 dark:text-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-[#345E85] dark:focus:border-blue-900 transition-all appearance-none cursor-pointer uppercase italic h-[60px]"
                    >
                      <option value="HIDDEN">Hidden Until Deadline</option>
                      <option value="VISIBLE_AFTER_DEADLINE">Visible After Deadline</option>
                      <option value="VISIBLE">Visible to All</option>
                    </select>
                    <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 dark:text-slate-600">
                      <Settings size={20} />
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">
                    Selection Criteria
                  </label>
                  <div className="relative group">
                    <select
                      value={formData.selectionCriteria}
                      onChange={(e) => handleInputChange('selectionCriteria', e.target.value)}
                      className="w-full px-6 py-4 text-sm font-black bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 text-gray-900 dark:text-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-[#345E85] dark:focus:border-blue-900 transition-all appearance-none cursor-pointer uppercase italic h-[60px]"
                    >
                      <option value="LOWEST_BID">Lowest Bid</option>
                      <option value="BEST_VALUE">Best Value</option>
                      <option value="WEIGHTED_SCORE">Weighted Score</option>
                    </select>
                    <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 dark:text-slate-600">
                      <Settings size={20} />
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.allowBidRevision}
                      onChange={(e) => setFormData(prev => ({ ...prev, allowBidRevision: e.target.checked }))}
                      className="w-5 h-5 rounded border-slate-300 dark:border-slate-700 text-[#345E85] focus:ring-[#345E85]"
                    />
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                      Allow Bid Revision
                    </span>
                  </label>
                </div>
              </>
            )}

            {/* Common Fields - Timing */}
            <div className="space-y-3">
              <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] ml-1">Timing: Start Bound *</label>
              <div className="relative group">
                <input
                  type="datetime-local"
                  value={formData.auctionStart}
                  onChange={(e) => handleInputChange('auctionStart', e.target.value)}
                  required
                  className="w-full px-6 py-4 text-sm font-black bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 text-gray-900 dark:text-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-[#345E85] dark:focus:border-blue-900 transition-all uppercase italic h-[60px] pl-14"
                />
                <div className="absolute left-6 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 dark:text-slate-600">
                  <Calendar size={20} />
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] ml-1">Timing: End Bound *</label>
              <div className="relative group">
                <input
                  type="datetime-local"
                  value={formData.auctionEnd}
                  onChange={(e) => handleInputChange('auctionEnd', e.target.value)}
                  required
                  className="w-full px-6 py-4 text-sm font-black bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 text-gray-900 dark:text-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-[#345E85] dark:focus:border-blue-900 transition-all uppercase italic h-[60px] pl-14"
                />
                <div className="absolute left-6 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 dark:text-slate-600">
                  <Calendar size={20} />
                </div>
              </div>
            </div>

            {/* Auto-Extend Option */}
            <div className="md:col-span-2 space-y-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.autoExtend}
                  onChange={(e) => setFormData(prev => ({ ...prev, autoExtend: e.target.checked }))}
                  className="w-5 h-5 rounded border-slate-300 dark:border-slate-700 text-[#345E85] focus:ring-[#345E85]"
                />
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                  Auto-Extend Auction on Late Bids
                </span>
              </label>
            </div>
          </div>

          <div className="mt-16 pt-10 border-t border-slate-50 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-6">
            <button
              type="button"
              onClick={() => {
                setFormData({
                  loadId: '',
                  auctionType: 'REVERSE' as AuctionType,
                  auctionStart: '',
                  auctionEnd: '',
                  reservePrice: '',
                  targetPrice: '',
                  maxBudget: '',
                  minimumBidDecrement: '',
                  startingPrice: '',
                  minimumBidIncrement: '',
                  dropInterval: '60',
                  dropAmount: '',
                  bidVisibility: 'HIDDEN',
                  allowBidRevision: false,
                  selectionCriteria: 'LOWEST_BID',
                  marketRate: '',
                  autoExtend: false,
                });
                setError(null);
                setSuccess(null);
              }}
              className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] hover:text-[#0f172a] dark:hover:text-slate-100 transition-colors"
            >
              Reset parameters
            </button>

            <button
              type="submit"
              disabled={loading}
              className="px-12 py-5 bg-slate-900 dark:bg-blue-600 text-white rounded-[1.5rem] text-[10px] font-black uppercase tracking-[0.2em] hover:bg-[#345E85] dark:hover:bg-blue-700 transition-all shadow-xl shadow-slate-900/10 dark:shadow-blue-500/20 disabled:opacity-50 flex items-center gap-3"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={16} />
                  Initializing...
                </>
              ) : (
                <>
                  <Gavel size={16} />
                  Initialize Auction
                  <ArrowRight size={14} />
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default CreateAuction;