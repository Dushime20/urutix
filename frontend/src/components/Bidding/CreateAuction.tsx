import React, { useState, useEffect } from 'react';
import { Gavel, Loader2, AlertCircle, CheckCircle2, X, PlusCircle, Info, Calendar, DollarSign, Settings, Truck, ArrowRight } from 'lucide-react';
import { loadsAPI } from '../../services/load';
import { biddingAPI } from '../../services/biddingApi';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

interface Cargo {
  id: string;
  title?: string;
  description?: string;
  origin?: string;
  destination?: string;
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
    auctionType: 'REVERSE',
    auctionStart: '',
    auctionEnd: '',
    reservePrice: '',
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
      // Submit auction creation using biddingAPI
      const auctionData = {
        loadId: formData.loadId,
        auctionType: formData.auctionType as 'REVERSE' | 'FORWARD' | 'DUTCH' | 'SEALED',
        auctionStart: formData.auctionStart,
        auctionEnd: formData.auctionEnd,
        reservePrice: formData.reservePrice ? parseFloat(formData.reservePrice) : undefined,
      };

      await biddingAPI.createAuction(auctionData);

      toast.success('Auction created successfully!');
      setSuccess('Auction created successfully!');
      setFormData({
        loadId: '',
        auctionType: 'REVERSE',
        auctionStart: '',
        auctionEnd: '',
        reservePrice: '',
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
            <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center">
              <PlusCircle className="w-6 h-6 text-[#345E85]" />
            </div>
            <h1 className="text-4xl font-black text-[#0f172a] tracking-tight">Auction Setup</h1>
          </div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest max-w-xl">
            Configure high-velocity auctions and attract elite transportation partners
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-100 p-4 rounded-xl mb-6 flex items-center gap-3 animate-in slide-in-from-top-2">
          <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center shrink-0">
            <AlertCircle className="text-red-600" size={18} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-xs font-black text-red-900 uppercase tracking-tight italic leading-tight">{error}</h3>
          </div>
          <button onClick={() => setError(null)} className="p-1 text-red-400 hover:text-red-600 transition-colors">
            <X size={16} />
          </button>
        </div>
      )}

      {success && (
        <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-xl mb-6 flex items-center gap-3 animate-in slide-in-from-top-2">
          <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center shrink-0">
            <CheckCircle2 className="text-emerald-600" size={18} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-xs font-black text-emerald-900 uppercase tracking-tight italic leading-tight">{success}</h3>
          </div>
          <button onClick={() => setSuccess(null)} className="p-1 text-emerald-400 hover:text-emerald-600 transition-colors">
            <X size={16} />
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="bg-white rounded-[2.5rem] p-10 border border-slate-100 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <div className="md:col-span-2 space-y-3">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Cargo Selection</label>
              {loadingCargos ? (
                <div className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl flex items-center gap-4">
                  <Loader2 className="animate-spin text-[#345E85]" size={18} />
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Scanning manifests...</span>
                </div>
              ) : (
                <div className="relative group">
                  <select
                    value={formData.loadId}
                    onChange={(e) => handleInputChange('loadId', e.target.value)}
                    required
                    className="w-full px-6 py-4 text-sm font-black bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-[#345E85] transition-all appearance-none cursor-pointer uppercase italic h-[60px]"
                  >
                    <option value="">-- Choose Cargo --</option>
                    {cargos.map((cargo) => (
                      <option key={cargo.id} value={cargo.id}>
                        {cargo.title || cargo.description || `CARGO - ${cargo.id.slice(0, 8)} `}
                        {cargo.origin && cargo.destination && ` [${cargo.origin} >> ${cargo.destination}]`}
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 group-hover:text-[#345E85] transition-colors">
                    <Truck size={20} />
                  </div>
                </div>
              )}
              {cargos.length === 0 && !loadingCargos && (
                <div className="flex items-center gap-2 px-2">
                  <Info size={14} className="text-amber-500" />
                  <p className="text-[10px] font-bold text-amber-600 uppercase tracking-widest">
                    No eligible cargos found. Register cargo before setup.
                  </p>
                </div>
              )}
            </div>

            <div className="space-y-3">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Auction Strategy</label>
              <div className="relative group">
                <select
                  value={formData.auctionType}
                  onChange={(e) => handleInputChange('auctionType', e.target.value)}
                  required
                  className="w-full px-6 py-4 text-sm font-black bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-[#345E85] transition-all appearance-none cursor-pointer uppercase italic h-[60px]"
                >
                  <option value="REVERSE">Reverse Auction (Descending)</option>
                  <option value="FORWARD">Forward Auction (Ascending)</option>
                  <option value="DUTCH">Dutch Auction (Fast-Drop)</option>
                  <option value="SEALED">Sealed Bid (Confidential)</option>
                </select>
                <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 group-hover:text-[#345E85] transition-colors">
                  <Settings size={20} />
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Reserve Valuation</label>
              <div className="relative group">
                <input
                  type="number"
                  step="0.01"
                  value={formData.reservePrice}
                  onChange={(e) => handleInputChange('reservePrice', e.target.value)}
                  placeholder="ENTER PRICE"
                  className="w-full px-6 py-4 text-sm font-black bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-[#345E85] transition-all uppercase italic h-[60px] pl-14"
                />
                <div className="absolute left-6 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                  <DollarSign size={20} />
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Timing: Start Bound</label>
              <div className="relative group">
                <input
                  type="datetime-local"
                  value={formData.auctionStart}
                  onChange={(e) => handleInputChange('auctionStart', e.target.value)}
                  required
                  className="w-full px-6 py-4 text-sm font-black bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-[#345E85] transition-all uppercase italic h-[60px] pl-14"
                />
                <div className="absolute left-6 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                  <Calendar size={20} />
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Timing: End Bound</label>
              <div className="relative group">
                <input
                  type="datetime-local"
                  value={formData.auctionEnd}
                  onChange={(e) => handleInputChange('auctionEnd', e.target.value)}
                  required
                  className="w-full px-6 py-4 text-sm font-black bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-[#345E85] transition-all uppercase italic h-[60px] pl-14"
                />
                <div className="absolute left-6 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                  <Calendar size={20} />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-16 pt-10 border-t border-slate-50 flex flex-col sm:flex-row justify-between items-center gap-6">
            <button
              type="button"
              onClick={() => {
                setFormData({
                  loadId: '',
                  auctionType: 'REVERSE',
                  auctionStart: '',
                  auctionEnd: '',
                  reservePrice: '',
                });
                setError(null);
                setSuccess(null);
              }}
              className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] hover:text-[#0f172a] transition-colors"
            >
              Reset parameters
            </button>

            <button
              type="submit"
              disabled={loading}
              className="px-12 py-5 bg-slate-900 text-white rounded-[1.5rem] text-[10px] font-black uppercase tracking-[0.2em] hover:bg-[#345E85] transition-all shadow-xl shadow-slate-900/10 disabled:opacity-50 flex items-center gap-3"
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