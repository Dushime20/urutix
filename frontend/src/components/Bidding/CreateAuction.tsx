import React, { useState, useEffect } from 'react';
import { Gavel, Loader2, AlertCircle, CheckCircle2, X, PlusCircle, Info, Calendar, DollarSign, Settings, Truck } from 'lucide-react';
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
      const availableCargos = cargosList.filter(
        (cargo: Cargo) =>
          cargo.status === 'CREATED' ||
          cargo.status === 'PUBLISHED' ||
          !cargo.status // Include cargos without status if needed
      );

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
    <div className="create-auction space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="bg-white rounded-3xl border border-gray-200 p-8 relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform">
          <Gavel size={160} className="text-gray-900" />
        </div>
        <div className="relative">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-gray-900 rounded-xl flex items-center justify-center shadow-lg">
              <PlusCircle className="text-white" size={20} />
            </div>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight italic uppercase">Creation Nexus</h1>
          </div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest max-w-lg italic">
            Initialize high-velocity auctions for your cargo ecosystem and attract elite transportation partners
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
        <div className="bg-white rounded-3xl border border-gray-200 p-8 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="md:col-span-2">
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Select Cargo Ecosystem *</label>
              {loadingCargos ? (
                <div className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl flex items-center gap-3">
                  <Loader2 className="animate-spin text-gray-400" size={16} />
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Accessing Cargo Manifest...</span>
                </div>
              ) : (
                <div className="relative group">
                  <select
                    value={formData.loadId}
                    onChange={(e) => handleInputChange('loadId', e.target.value)}
                    required
                    className="w-full px-4 py-3 text-sm font-black bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900/5 focus:border-gray-900 transition-all appearance-none cursor-pointer uppercase italic h-[48px]"
                  >
                    <option value="">-- Choose Cargo to Auction --</option>
                    {cargos.map((cargo) => (
                      <option key={cargo.id} value={cargo.id}>
                        {cargo.title || cargo.description || `CARGO - ${cargo.id.slice(0, 8)} `}
                        {cargo.origin && cargo.destination && ` [${cargo.origin} >> ${cargo.destination}]`}
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 group-hover:text-gray-900 transition-colors">
                    <Truck size={16} />
                  </div>
                </div>
              )}
              {cargos.length === 0 && !loadingCargos && (
                <div className="mt-2 flex items-center gap-2 px-1">
                  <Info size={12} className="text-amber-500" />
                  <p className="text-[10px] font-bold text-amber-600 uppercase tracking-widest italic">
                    No eligible cargos found. Please register cargo before initialization.
                  </p>
                </div>
              )}
            </div>

            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Auction Strategy *</label>
              <div className="relative group">
                <select
                  value={formData.auctionType}
                  onChange={(e) => handleInputChange('auctionType', e.target.value)}
                  required
                  className="w-full px-4 py-3 text-sm font-black bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900/5 focus:border-gray-900 transition-all appearance-none cursor-pointer uppercase italic h-[48px]"
                >
                  <option value="REVERSE">Reverse Auction (Descending)</option>
                  <option value="FORWARD">Forward Auction (Ascending)</option>
                  <option value="DUTCH">Dutch Auction (Fast-Drop)</option>
                  <option value="SEALED">Sealed Bid (Confidential)</option>
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 group-hover:text-gray-900 transition-colors">
                  <Settings size={16} />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Reserve Value Threshold</label>
              <div className="relative group">
                <input
                  type="number"
                  step="0.01"
                  value={formData.reservePrice}
                  onChange={(e) => handleInputChange('reservePrice', e.target.value)}
                  placeholder="ENTER PRICE"
                  className="w-full px-4 py-3 text-sm font-black bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900/5 focus:border-gray-900 transition-all uppercase italic h-[48px] pl-10"
                />
                <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                  <DollarSign size={16} />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Temporal Start Bound *</label>
              <div className="relative group">
                <input
                  type="datetime-local"
                  value={formData.auctionStart}
                  onChange={(e) => handleInputChange('auctionStart', e.target.value)}
                  required
                  className="w-full px-4 py-3 text-sm font-black bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900/5 focus:border-gray-900 transition-all uppercase italic h-[48px] pl-10"
                />
                <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                  <Calendar size={16} />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Temporal End Bound *</label>
              <div className="relative group">
                <input
                  type="datetime-local"
                  value={formData.auctionEnd}
                  onChange={(e) => handleInputChange('auctionEnd', e.target.value)}
                  required
                  className="w-full px-4 py-3 text-sm font-black bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900/5 focus:border-gray-900 transition-all uppercase italic h-[48px] pl-10"
                />
                <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                  <Calendar size={16} />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-12 flex flex-col sm:flex-row justify-end gap-4">
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
              className="px-8 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest bg-gray-50 border border-gray-100 rounded-xl hover:bg-gray-100 transition-all"
            >
              Reset Parameters
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-8 py-4 text-[10px] font-black text-white uppercase tracking-widest bg-gray-900 rounded-xl hover:bg-black transition-all shadow-xl shadow-gray-200 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={14} />
                  Initializing...
                </>
              ) : (
                <>
                  <Gavel size={14} />
                  Finalize & Create Auction
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