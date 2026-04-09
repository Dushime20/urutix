import React, { useState, useEffect } from 'react';
import { DollarSign, Calendar, Truck, TrendingUp, Info, ShieldCheck, AlertCircle, X, ChevronRight } from 'lucide-react';
import { fleetApi, type Truck as FleetTruck } from '../../services/fleetApi';

interface Auction {
  id: string;
  loadId: string;
  auctionType: string;
  status: string;
  reservePrice?: number;
  minimumBidIncrement?: number;
  currentHighestBid?: number;
  load: {
    title: string;
    weight: number;
    loadValue: number;
    pickupDate: string;
    deliveryDate: string;
  };
}

interface BidFormProps {
  auction: Auction;
  onSubmit: (bidData: any) => void;
  onCancel: () => void;
}

const BidForm: React.FC<BidFormProps> = ({ auction, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    bidAmount: '',
    bidCurrency: 'USD',
    proposedPickupDate: '',
    proposedDeliveryDate: '',
    bidNotes: '',
    bidDetails: {
      truckSpecifications: {
        truckId: '',
        capacityWeight: '',
        capacityVolume: '',
        truckType: '',
        hasRefrigeration: false,
        hasHazmatPermit: false,
      },
      driverInfo: {
        driverId: '',
        experience: '',
        rating: '',
        certifications: [],
      },
      routeOptimization: {
        estimatedDistance: '',
        estimatedFuelCost: '',
        estimatedTime: '',
      },
      additionalServices: {
        insurance: false,
        tracking: false,
        loadingAssistance: false,
        unloadingAssistance: false,
      },
    },
    isAutoBid: false,
    isCounterOffer: false,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successProbability, setSuccessProbability] = useState<number>(0);
  const [availableTrucks, setAvailableTrucks] = useState<FleetTruck[]>([]);

  useEffect(() => {
    const fetchTrucks = async () => {
      try {
        const trucks = await fleetApi.getTrucks();
        setAvailableTrucks(trucks);
      } catch (err) {
        console.error('Failed to fetch trucks', err);
      }
    };
    fetchTrucks();
  }, []);

  useEffect(() => {
    // Set default dates based on load requirements
    if (auction.load.pickupDate) {
      setFormData(prev => ({
        ...prev,
        proposedPickupDate: auction.load.pickupDate.split('T')[0],
        proposedDeliveryDate: auction.load.deliveryDate.split('T')[0],
      }));
    }
  }, [auction]);

  useEffect(() => {
    // Calculate success probability based on bid amount
    if (formData.bidAmount && auction.currentHighestBid) {
      const bidAmount = parseFloat(formData.bidAmount);
      const currentBid = auction.currentHighestBid;
      const loadValue = auction.load.loadValue;

      let probability = 50; // Base probability

      if (bidAmount < currentBid) {
        probability += 30; // Higher chance if bidding lower
      } else if (bidAmount < loadValue * 0.8) {
        probability += 20; // Good value proposition
      }

      setSuccessProbability(Math.min(probability, 95));
    }
  }, [formData.bidAmount, auction.currentHighestBid, auction.load.loadValue]);

  const handleInputChange = (field: string, value: any) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...(prev[parent as keyof typeof prev] as object),
          [child]: value,
        },
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value,
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Validate bid amount
      const bidAmount = parseFloat(formData.bidAmount);
      if (isNaN(bidAmount) || bidAmount <= 0) {
        throw new Error('Please enter a valid bid amount');
      }

      if (auction.minimumBidIncrement && auction.currentHighestBid) {
        const minBid = auction.currentHighestBid + auction.minimumBidIncrement;
        if (bidAmount < minBid) {
          throw new Error(`Minimum bid amount is ${minBid.toFixed(2)}`);
        }
      }

      await onSubmit(formData);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to submit bid');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const renderAuctionSummary = () => (
    <div className="bg-gray-50/50 dark:bg-slate-950/50 rounded-2xl border border-gray-100 dark:border-slate-800 p-6 mb-8 relative overflow-hidden group">
      <div className="absolute -right-4 -top-4 opacity-5 dark:opacity-10 group-hover:scale-110 transition-transform">
        <Truck size={100} className="text-gray-900 dark:text-slate-100" />
      </div>
      <div className="relative">
        <h6 className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
          <Info size={12} className="text-indigo-600 dark:text-indigo-400" />
          Auction Overview
        </h6>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-4">
            <div>
              <p className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-1 leading-none">Load Title</p>
              <p className="text-sm font-black text-gray-900 dark:text-slate-100">{auction.load.title}</p>
            </div>
          </div>
          <div className="space-y-4 border-l border-gray-100 dark:border-slate-800 pl-6">
            <div>
              <p className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-1 leading-none">Weight & Value</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="px-2 py-0.5 bg-gray-900 dark:bg-slate-800 text-white dark:text-slate-200 text-[10px] font-black rounded">{auction.load.weight.toLocaleString()} kg</span>
                <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">{formatCurrency(auction.load.loadValue)}</span>
              </div>
            </div>
          </div>
          <div className="space-y-4 border-l border-gray-100 dark:border-slate-800 pl-6">
            <div>
              <p className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-1 leading-none">Auction Type</p>
              <span className="inline-block px-2 py-0.5 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 ring-1 ring-indigo-100 dark:ring-indigo-900/50 text-[10px] font-black uppercase tracking-wider rounded-md mt-1">
                {auction.auctionType}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderBidDetails = () => (
    <div className="space-y-8 mb-8">
      <div className="flex items-center gap-4 mb-6">
        <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-xl flex items-center justify-center shrink-0 shadow-sm ring-1 ring-indigo-100 dark:ring-indigo-900/50">
          <DollarSign size={20} />
        </div>
        <div>
          <h4 className="text-sm font-black text-gray-900 dark:text-slate-100 uppercase tracking-tight italic">Pricing & Logistics</h4>
          <p className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest italic">Set your bid amount and dates</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1.5 ml-1">Bid Amount *</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <span className="text-gray-400 font-black text-sm">$</span>
              </div>
              <input
                type="number"
                step="0.01"
                value={formData.bidAmount}
                onChange={(e) => handleInputChange('bidAmount', e.target.value)}
                placeholder="0.00"
                required
                className="w-full pl-8 pr-4 py-2.5 text-sm font-black bg-gray-50 dark:bg-slate-950 border border-gray-100 dark:border-slate-800 text-gray-900 dark:text-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900/5 dark:focus:ring-blue-900/10 focus:border-gray-900 dark:focus:border-blue-900 transition-all placeholder:text-gray-400 dark:placeholder:text-slate-700"
              />
            </div>
            {auction.currentHighestBid && (
              <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase mt-1 ml-1 tracking-tight">
                Current highest: {formatCurrency(auction.currentHighestBid)}
              </p>
            )}
          </div>
          <div>
            <label className="block text-[10px] font-black text-gray-500 dark:text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Currency</label>
            <select
              value={formData.bidCurrency}
              onChange={(e) => handleInputChange('bidCurrency', e.target.value)}
              className="w-full px-4 py-2.5 text-xs font-black bg-gray-50 dark:bg-slate-950 border border-gray-100 dark:border-slate-800 text-gray-900 dark:text-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900/5 dark:focus:ring-blue-900/10 focus:border-gray-900 dark:focus:border-blue-900 transition-all appearance-none cursor-pointer"
            >
              <option value="USD" className="dark:bg-slate-900">USD - US Dollar</option>
              <option value="EUR" className="dark:bg-slate-900">EUR - Euro</option>
              <option value="GBP" className="dark:bg-slate-900">GBP - British Pound</option>
            </select>
          </div>
        </div>

         <div className="space-y-4">
          <div>
            <label className="block text-[10px] font-black text-gray-500 dark:text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Proposed Pickup Date</label>
            <div className="relative">
              <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-600" size={16} />
              <input
                type="date"
                value={formData.proposedPickupDate}
                onChange={(e) => handleInputChange('proposedPickupDate', e.target.value)}
                className="w-full pl-12 pr-4 py-2.5 text-sm font-black bg-gray-50 dark:bg-slate-950 border border-gray-100 dark:border-slate-800 text-gray-900 dark:text-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900/5 dark:focus:ring-blue-900/10 focus:border-gray-900 dark:focus:border-blue-900 transition-all custom-calendar-picker"
              />
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-black text-gray-500 dark:text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Proposed Delivery Date</label>
            <div className="relative">
              <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-600" size={16} />
              <input
                type="date"
                value={formData.proposedDeliveryDate}
                onChange={(e) => handleInputChange('proposedDeliveryDate', e.target.value)}
                className="w-full pl-12 pr-4 py-2.5 text-sm font-black bg-gray-50 dark:bg-slate-950 border border-gray-100 dark:border-slate-800 text-gray-900 dark:text-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900/5 dark:focus:ring-blue-900/10 focus:border-gray-900 dark:focus:border-blue-900 transition-all custom-calendar-picker"
              />
            </div>
          </div>
        </div>
      </div>

      <div>
        <label className="block text-[10px] font-black text-gray-500 dark:text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Additional Notes & Terms</label>
        <textarea
          rows={3}
          value={formData.bidNotes}
          onChange={(e) => handleInputChange('bidNotes', e.target.value)}
          placeholder="Describe your service level, insurance details, or specific terms..."
          className="w-full px-4 py-3 text-xs font-black bg-gray-50 dark:bg-slate-950 border border-gray-100 dark:border-slate-800 text-gray-900 dark:text-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900/5 dark:focus:ring-blue-900/10 focus:border-gray-900 dark:focus:border-blue-900 transition-all resize-none placeholder:text-gray-400 dark:placeholder:text-slate-700"
        />
      </div>

      <div className="flex flex-wrap gap-4 pt-4">
        <label className="flex items-center gap-3 cursor-pointer group">
          <div className="relative flex items-center justify-center">
            <input
              type="checkbox"
              checked={formData.isAutoBid}
              onChange={(e) => handleInputChange('isAutoBid', e.target.checked)}
              className="peer appearance-none w-5 h-5 border-2 border-gray-200 dark:border-slate-800 rounded-lg checked:bg-gray-900 dark:checked:bg-blue-600 checked:border-gray-900 dark:checked:border-blue-600 transition-all"
            />
            <div className="absolute text-white opacity-0 peer-checked:opacity-100 transition-opacity">
              <ShieldCheck size={12} />
            </div>
          </div>
          <span className="text-[11px] font-black text-gray-500 dark:text-slate-500 uppercase tracking-tight group-hover:text-gray-900 dark:group-hover:text-slate-100 transition-colors">Auto-bid System</span>
        </label>
        <label className="flex items-center gap-3 cursor-pointer group">
          <div className="relative flex items-center justify-center">
            <input
              type="checkbox"
              checked={formData.isCounterOffer}
              onChange={(e) => handleInputChange('isCounterOffer', e.target.checked)}
              className="peer appearance-none w-5 h-5 border-2 border-gray-200 dark:border-slate-800 rounded-lg checked:bg-indigo-600 dark:checked:bg-indigo-500 checked:border-indigo-600 dark:checked:border-indigo-500 transition-all"
            />
            <div className="absolute text-white opacity-0 peer-checked:opacity-100 transition-opacity">
              <TrendingUp size={12} />
            </div>
          </div>
          <span className="text-[11px] font-black text-gray-500 dark:text-slate-500 uppercase tracking-tight group-hover:text-gray-900 dark:group-hover:text-slate-100 transition-colors">Counter-offer Mode</span>
        </label>
      </div>
    </div>
  );

  const renderTruckSpecifications = () => (
    <div className="space-y-8 mb-8 pt-8 border-t border-gray-100 dark:border-slate-800">
      <div className="flex items-center gap-4 mb-6">
        <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-xl flex items-center justify-center shrink-0 shadow-sm ring-1 ring-indigo-100 dark:ring-indigo-900/50">
          <Truck size={20} />
        </div>
        <div>
          <h4 className="text-sm font-black text-gray-900 dark:text-slate-100 uppercase tracking-tight italic">Truck Specifications</h4>
          <p className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest italic">Provide vehicle and capacity details</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
         <div className="space-y-4">
          <div>
            <label className="block text-[10px] font-black text-gray-500 dark:text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Truck ID</label>
            <select
              value={formData.bidDetails.truckSpecifications.truckId}
              onChange={(e) => {
                const selectedTruck = availableTrucks.find(t => t.id === e.target.value);
                if (selectedTruck) {
                  handleInputChange('bidDetails.truckSpecifications.truckId', selectedTruck.id);
                  handleInputChange('bidDetails.truckSpecifications.capacityWeight', selectedTruck.capacityWeight || '');
                  handleInputChange('bidDetails.truckSpecifications.capacityVolume', selectedTruck.capacityVolume || '');
                  handleInputChange('bidDetails.truckSpecifications.truckType', selectedTruck.truckType || '');
                } else {
                  handleInputChange('bidDetails.truckSpecifications.truckId', e.target.value);
                }
              }}
              className="w-full px-4 py-2.5 text-sm font-black bg-gray-50 dark:bg-slate-950 border border-gray-100 dark:border-slate-800 text-gray-900 dark:text-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900/5 dark:focus:ring-blue-900/10 focus:border-gray-900 dark:focus:border-blue-900 transition-all appearance-none cursor-pointer"
            >
              <option value="" className="dark:bg-slate-900">Select available truck</option>
              {availableTrucks.map(truck => (
                <option key={truck.id} value={truck.id} className="dark:bg-slate-900">
                  {truck.plateNumber} ({truck.truckType})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-black text-gray-500 dark:text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Capacity Weight (kg)</label>
            <input
              type="number"
              value={formData.bidDetails.truckSpecifications.capacityWeight}
              onChange={(e) => handleInputChange('bidDetails.truckSpecifications.capacityWeight', e.target.value)}
              placeholder="0"
              className="w-full px-4 py-2.5 text-sm font-black bg-gray-50 dark:bg-slate-950 border border-gray-100 dark:border-slate-800 text-gray-900 dark:text-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900/5 dark:focus:ring-blue-900/10 focus:border-gray-900 dark:focus:border-blue-900 transition-all placeholder:text-gray-400 dark:placeholder:text-slate-700"
            />
          </div>
        </div>

         <div className="space-y-4">
          <div>
            <label className="block text-[10px] font-black text-gray-500 dark:text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Truck Type</label>
            <select
              value={formData.bidDetails.truckSpecifications.truckType}
              onChange={(e) => handleInputChange('bidDetails.truckSpecifications.truckType', e.target.value)}
              className="w-full px-4 py-2.5 text-xs font-black bg-gray-50 dark:bg-slate-950 border border-gray-100 dark:border-slate-800 text-gray-900 dark:text-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900/5 dark:focus:ring-blue-900/10 focus:border-gray-900 dark:focus:border-blue-900 transition-all appearance-none cursor-pointer"
            >
              <option value="" className="dark:bg-slate-900">Select truck type</option>
              <option value="FLATBED" className="dark:bg-slate-900">Flatbed</option>
              <option value="REEFER" className="dark:bg-slate-900">Reefer</option>
              <option value="DRY_VAN" className="dark:bg-slate-900">Dry Van</option>
              <option value="POWER_ONLY" className="dark:bg-slate-900">Power Only</option>
              <option value="STEP_DECK" className="dark:bg-slate-900">Step Deck</option>
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-black text-gray-500 dark:text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Capacity Volume (m³)</label>
            <input
              type="number"
              value={formData.bidDetails.truckSpecifications.capacityVolume}
              onChange={(e) => handleInputChange('bidDetails.truckSpecifications.capacityVolume', e.target.value)}
              placeholder="0"
              className="w-full px-4 py-2.5 text-sm font-black bg-gray-50 dark:bg-slate-950 border border-gray-100 dark:border-slate-800 text-gray-900 dark:text-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900/5 dark:focus:ring-blue-900/10 focus:border-gray-900 dark:focus:border-blue-900 transition-all placeholder:text-gray-400 dark:placeholder:text-slate-700"
            />
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-4 pt-4">
        <label className="flex items-center gap-3 cursor-pointer group">
          <div className="relative flex items-center justify-center">
            <input
              type="checkbox"
              checked={formData.bidDetails.truckSpecifications.hasRefrigeration}
              onChange={(e) => handleInputChange('bidDetails.truckSpecifications.hasRefrigeration', e.target.checked)}
              className="peer appearance-none w-5 h-5 border-2 border-gray-200 dark:border-slate-800 rounded-lg checked:bg-indigo-600 dark:checked:bg-indigo-500 checked:border-indigo-600 dark:checked:border-indigo-500 transition-all"
            />
            <Info size={10} className="absolute text-white opacity-0 peer-checked:opacity-100 transition-opacity" />
          </div>
          <span className="text-[11px] font-black text-gray-500 dark:text-slate-500 uppercase tracking-tight group-hover:text-gray-900 dark:group-hover:text-slate-100 transition-colors">Refrigeration</span>
        </label>
        <label className="flex items-center gap-3 cursor-pointer group">
          <div className="relative flex items-center justify-center">
            <input
              type="checkbox"
              checked={formData.bidDetails.truckSpecifications.hasHazmatPermit}
              onChange={(e) => handleInputChange('bidDetails.truckSpecifications.hasHazmatPermit', e.target.checked)}
              className="peer appearance-none w-5 h-5 border-2 border-gray-200 dark:border-slate-800 rounded-lg checked:bg-amber-600 dark:checked:bg-amber-500 checked:border-amber-600 dark:checked:border-amber-500 transition-all"
            />
            <AlertCircle size={10} className="absolute text-white opacity-0 peer-checked:opacity-100 transition-opacity" />
          </div>
          <span className="text-[11px] font-black text-gray-500 dark:text-slate-500 uppercase tracking-tight group-hover:text-gray-900 dark:group-hover:text-slate-100 transition-colors">Has Hazmat Permit</span>
        </label>
      </div>
    </div>
  );
   const renderSuccessProbability = () => (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 p-8 mb-8 text-center relative overflow-hidden group shadow-sm transition-all hover:shadow-lg hover:shadow-slate-200/50 dark:hover:shadow-blue-500/10">
      <div className="absolute inset-0 bg-gradient-to-br from-gray-50/50 dark:from-slate-950/20 to-transparent transition-opacity"></div>
      <div className="relative">
        <h6 className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-6">Market Analysis</h6>

        <div className="flex flex-col items-center">
          <div className="relative w-32 h-32 mb-6">
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="64"
                cy="64"
                r="58"
                stroke="currentColor"
                strokeWidth="12"
                fill="transparent"
                className="text-gray-100 dark:text-slate-800"
              />
              <circle
                cx="64"
                cy="64"
                r="58"
                stroke="currentColor"
                strokeWidth="12"
                fill="transparent"
                strokeDasharray={364.4}
                strokeDashoffset={364.4 * (1 - successProbability / 100)}
                className={`transition-all duration-1000 ${successProbability > 70 ? 'text-emerald-500' :
                    successProbability > 40 ? 'text-amber-500' : 'text-red-500'
                  }`}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-black text-gray-900 dark:text-slate-100 leading-none">{successProbability}%</span>
              <span className="text-[8px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-tighter mt-1 italic">Score</span>
            </div>
          </div>

          <h4 className="text-sm font-black text-gray-900 dark:text-slate-100 uppercase tracking-tight italic mb-2">
            Success Probability: <span className={
              successProbability > 70 ? 'text-emerald-600 dark:text-emerald-400' :
                successProbability > 40 ? 'text-amber-600 dark:text-amber-400' : 'text-red-600 dark:text-red-400'
            }>{successProbability > 70 ? 'Excellent' : successProbability > 40 ? 'Moderate' : 'Low'}</span>
          </h4>
          <p className="text-[10px] font-bold text-gray-500 dark:text-slate-500 leading-relaxed max-w-xs">
            Based on current bid intensity, load value, and historical success rates for similar routes.
          </p>
        </div>
      </div>
    </div>
  );


  return (
    <div className="bid-form">
      {renderAuctionSummary()}

      <form onSubmit={handleSubmit}>
        {renderBidDetails()}
        {renderTruckSpecifications()}
        {renderSuccessProbability()}

        {error && (
          <div className="bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 p-4 rounded-xl mb-8 flex items-center gap-3">
            <div className="w-8 h-8 bg-red-100 dark:bg-red-950 rounded-lg flex items-center justify-center shrink-0">
              <AlertCircle className="text-red-600 dark:text-red-500" size={18} />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-xs font-black text-red-900 dark:text-red-400 uppercase tracking-tight italic">{error}</h3>
            </div>
            <button
              onClick={() => setError(null)}
              className="p-1 text-red-400 dark:text-red-600 hover:text-red-600 dark:hover:text-red-500 rounded-lg transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        )}

        <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-100 dark:border-slate-800 mt-8">
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2.5 text-[10px] font-black text-gray-500 dark:text-slate-400 uppercase tracking-widest bg-gray-50 dark:bg-slate-950 border border-gray-100 dark:border-slate-800 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-900 transition-all"
          >
            Discard
          </button>
          <button
            type="submit"
            disabled={loading || !formData.bidAmount}
            className="flex items-center gap-2 px-8 py-2.5 bg-gray-900 dark:bg-blue-600 text-white rounded-xl hover:bg-black dark:hover:bg-blue-700 transition-all font-black text-[10px] uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-gray-100 dark:shadow-blue-500/10 group"
          >
            {loading ? 'Processing...' : (
              <>
                Confirm Bid
                <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default BidForm; 