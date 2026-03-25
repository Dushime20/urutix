import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Fuel, 
  Plus, 
  Calendar, 
  MapPin, 
  DollarSign, 
  Droplets, 
  History,
  TrendingUp,
  CreditCard,
  Truck,
  Sparkles,
  CloudRain,
  ArrowRight
} from 'lucide-react';
import { fuelApi } from '../../services/fuelApi';
import type { CreateFuelLogData } from '../../services/fuelApi';
import { driverApi } from '../../services/driverApi';
import { fleetApi } from '../../services/fleetApi';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { TranslatedText } from '../translated-text';
import { SmartFuelFinder } from './SmartFuelFinder';

interface FuelManagementProps {
  driverId: string;
}

export const FuelManagement: React.FC<FuelManagementProps> = ({ driverId }) => {
  const queryClient = useQueryClient();
  const [showLogForm, setShowLogForm] = useState(false);
  
  // States for the form
  const [formData, setFormData] = useState<Partial<CreateFuelLogData>>({
    fuelDate: new Date().toISOString().split('T')[0],
    gallons: 0,
    pricePerGallon: 0,
    location: '',
    odometer: 0,
    paymentMethod: 'CASH',
  });

  // Fetch driver profile to get assigned truck
  const { data: driverProfile } = useQuery({
    queryKey: ['driver-profile', driverId],
    queryFn: () => driverApi.getDriverProfile(driverId),
    enabled: !!driverId,
  });

  // Automatically set truck ID when driver profile is loaded
  React.useEffect(() => {
    if (driverProfile?.currentTruckId) {
      setFormData(prev => ({ ...prev, truckId: driverProfile.currentTruckId }));
    }
  }, [driverProfile]);

  // Fetch truck details
  const { data: assignedTruck } = useQuery({
    queryKey: ['truck', driverProfile?.currentTruckId],
    queryFn: () => fleetApi.getTruck(driverProfile!.currentTruckId!),
    enabled: !!driverProfile?.currentTruckId,
  });

  // Fetch fuel logs
  const { data: logs, isLoading: logsLoading } = useQuery({
    queryKey: ['driver-fuel-logs', driverId],
    queryFn: () => fuelApi.getFuelLogs({ driverId }),
    enabled: !!driverId,
  });

  // Fetch driver-specific fuel stats
  const { data: driverStats } = useQuery({
    queryKey: ['driver-fuel-stats', driverId],
    queryFn: () => fuelApi.getDriverFuelStatistics(driverId),
    enabled: !!driverId,
  });

  const stats = {
    totalSpend: driverStats?.totalSpend || 0,
    totalVolume: driverStats?.totalVolume || 0,
    avgPrice: driverStats?.avgPricePerGallon || 0,
    efficiencyMpg: driverStats?.efficiencyMpg || 0,
    ecoScore: driverStats?.ecoScore || 0,
    co2Saved: driverStats?.co2Saved || 0,
  };

  const createLogMutation = useMutation({
    mutationFn: (data: CreateFuelLogData) => fuelApi.createFuelLog(data),
    onSuccess: () => {
      toast.success('Fuel log recorded successfully!');
      setShowLogForm(false);
      queryClient.invalidateQueries({ queryKey: ['driver-fuel-logs'] });
    },
    onError: () => {
      toast.error('Failed to record fuel log');
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.truckId) {
      toast.error('Please specify truck ID');
      return;
    }
    createLogMutation.mutate({
      ...formData as CreateFuelLogData,
      driverId,
    });
  };

  const { data: wallet, isLoading: walletLoading } = useQuery({
    queryKey: ['driver-fuel-wallet', driverId],
    queryFn: () => fuelApi.getDriverWallet(driverId),
    enabled: !!driverId,
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="px-3 py-1 bg-amber-50 text-amber-600 text-[10px] font-black uppercase tracking-[0.2em] rounded-lg border border-amber-100">
              Operations
            </span>
          </div>
          <h2 className="text-3xl font-black text-[#0f172a] uppercase tracking-tight">
             <TranslatedText text="Fuel Management" />
          </h2>
          <p className="text-slate-400 font-medium mt-1">
             <TranslatedText text="Track fuel consumption, logs and efficiency metrics for your assigned vehicle" />
          </p>
        </div>

        <div className="flex gap-4">
           <button 
              onClick={() => {
                if (!driverProfile?.currentTruckId) {
                  toast.error('You must have an assigned truck to record fuel logs');
                  return;
                }
                setFormData((prev: any) => ({ ...prev, truckId: driverProfile.currentTruckId }));
                setShowLogForm(true);
              }}
              className="h-14 px-8 bg-[#345E85] text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-3 hover:bg-slate-900 transition-all shadow-lg active:scale-95 shadow-blue-900/10"
            >
              <Plus size={18} />
              <TranslatedText text="Record Fuel Log" />
            </button>
        </div>
      </div>

      {/* Summary Matrix */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <div className="bg-slate-900 rounded-[2rem] p-8 border border-slate-800 shadow-xl shadow-slate-900/10 group transition-all duration-500 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 blur-[80px] rounded-full -mr-16 -mt-16" />
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center mb-6 text-emerald-400">
            <CreditCard size={24} />
          </div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Fuel Wallet Balance</p>
          <h3 className="text-3xl font-black text-emerald-400 tracking-tight">
             {walletLoading ? '...' : formatCurrency(wallet?.balance || 0)}
          </h3>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-2">Available for Refill</p>
        </div>

        <div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-sm group hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-500">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center mb-6 text-[#345E85] transition-transform group-hover:scale-110">
            <DollarSign size={24} />
          </div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Fuel Spend</p>
          <h3 className="text-3xl font-black text-[#0f172a] lowercase tracking-tight">
            {formatCurrency(stats.totalSpend)}
          </h3>
          <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mt-2 flex items-center gap-1">
            <TrendingUp size={12} />
            Updated live
          </p>
        </div>

        <div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-sm group hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-500">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center mb-6 text-amber-600 transition-transform group-hover:scale-110">
            <Droplets size={24} />
          </div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Gallons</p>
          <h3 className="text-3xl font-black text-[#0f172a] tracking-tight">{stats.totalVolume.toFixed(1)} GAL</h3>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">Volume Yield</p>
        </div>

        <div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-sm group hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-500">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center mb-6 text-emerald-600 transition-transform group-hover:scale-110">
            <History size={24} />
          </div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Avg Price / GAL</p>
          <h3 className="text-3xl font-black text-[#0f172a] tracking-tight">{formatCurrency(stats.avgPrice)}</h3>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">Market Rate</p>
        </div>
      </div>

      {/* AI Fuel Advisor & Eco-Score - New Feature */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
      {/* AI Fuel Advisor & Eco-Score - Compact & Bright */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-xl shadow-slate-200/40 relative overflow-hidden"
        >
            <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-br from-emerald-50/40 via-transparent to-transparent pointer-events-none" />
            <div className="relative z-10">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 border border-emerald-100 shadow-sm">
                        <Sparkles size={18} />
                    </div>
                    <div>
                        <h3 className="text-[9px] font-black text-emerald-600 uppercase tracking-[0.3em] mb-0.5">AI Fuel Advisor</h3>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Efficiency Projection</p>
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="p-5 bg-slate-50 border border-slate-100 rounded-2xl hover:bg-white transition-all cursor-default group shadow-inner">
                        <h4 className="text-[9px] font-black text-emerald-600 uppercase tracking-widest mb-2 flex items-center gap-2">
                             <TrendingUp size={12} /> Performance Insight
                        </h4>
                        <p className="text-[11px] font-medium leading-relaxed italic text-slate-600">
                            "Your fuel consumption was <span className="text-emerald-600 font-black underline">5.2% higher</span> on the last Kampala run. Switch to the Bypass route next time to save approx. <span className="text-emerald-600 font-black">$42</span>."
                        </p>
                    </div>
                    
                    <button className="flex items-center justify-between w-full p-5 bg-emerald-600 text-white rounded-2xl group hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-900/10">
                        <div className="text-left">
                            <p className="text-[8px] font-black text-emerald-100 uppercase tracking-widest mb-0.5">Interactive Coaching</p>
                            <p className="text-[10px] font-black uppercase tracking-tight">Unlock "Green Driving" Bonus (+$50)</p>
                        </div>
                        <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                    </button>
                </div>
            </div>
        </motion.div>

        <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-xl shadow-slate-200/40"
        >
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 border border-emerald-100 shadow-sm">
                        <CloudRain size={18} />
                    </div>
                    <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-0.5">Sustainability</p>
                        <h3 className="text-lg font-black text-[#0f172a] uppercase tracking-tight">Eco-Driving Impact</h3>
                    </div>
                </div>
                <div className="text-right">
                    <span className="px-3 py-1 bg-emerald-50 text-emerald-600 text-[8px] font-black uppercase tracking-widest rounded-lg border border-emerald-100">
                        Rank: Silver
                    </span>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100/50">
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1.5">CO2 Saved</p>
                    <p className="text-2xl font-black text-emerald-600 tracking-tighter italic">{stats.co2Saved.toFixed(1)} KG</p>
                    <p className="text-[8px] font-bold text-slate-300 mt-1 uppercase leading-none">Safe Planet Contribution</p>
                </div>
                <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100/50">
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Efficiency Rating</p>
                    <p className="text-2xl font-black text-[#0f172a] tracking-tighter italic">{stats.efficiencyMpg.toFixed(1)} MPG</p>
                    <p className="text-[8px] font-bold text-slate-300 mt-1 uppercase leading-none">Real-time Performance</p>
                </div>
            </div>

            <div className="space-y-3 pt-6 border-t border-slate-100">
                 <div className="flex justify-between items-end text-[9px] font-black uppercase tracking-widest text-slate-400">
                    <span>Performance Score Progress</span>
                    <span className="text-emerald-600 font-black">{stats.ecoScore}%</span>
                 </div>
                 <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${stats.ecoScore}%` }}
                        className="h-full bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.3)]"
                    />
                 </div>
                 <p className="text-[8px] font-bold text-slate-400 uppercase italic opacity-70 px-1">Complete 3 more "Green Missions" to unlock Gold Tier rewards</p>
            </div>
        </motion.div>
      </div>
      </div>

      {/* Form Modal */}
      <AnimatePresence>
        {showLogForm && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={() => setShowLogForm(false)}
              className="absolute inset-0 bg-[#0f172a]/40 backdrop-blur-sm" 
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative w-full max-w-2xl bg-white rounded-[3rem] shadow-2xl overflow-hidden"
            >
              <div className="bg-[#345E85] p-10 text-white">
                <h3 className="text-2xl font-black uppercase tracking-tight">Record Fuel Purchase</h3>
                <p className="text-blue-100/70 text-sm font-medium mt-1">Submit your fuel receipt data for verification</p>
              </div>
              
              <form onSubmit={handleSubmit} className="p-10 space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Current Assigned Truck</label>
                    <div className="relative">
                      <Truck className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 w-5 h-5 pointer-events-none" />
                      <input 
                        type="text" 
                        readOnly
                        className="w-full h-14 bg-slate-100 border border-slate-200 rounded-2xl pl-14 pr-6 font-bold text-slate-500 cursor-not-allowed transition-all"
                        value={assignedTruck ? `${assignedTruck.plateNumber} (${assignedTruck.make} ${assignedTruck.model})` : (driverProfile?.currentTruckId || 'No Assigned Truck')}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Fuel Date</label>
                    <div className="relative">
                      <Calendar className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 w-5 h-5 pointer-events-none" />
                      <input 
                        type="date" 
                        required
                        className="w-full h-14 bg-slate-50 border border-slate-100 rounded-2xl pl-14 pr-6 font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#345E85] transition-all"
                        value={formData.fuelDate}
                        onChange={(e) => setFormData({...formData, fuelDate: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Volume (Gallons)</label>
                    <div className="relative">
                      <Droplets className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 w-5 h-5 pointer-events-none" />
                      <input 
                        type="number" 
                        step="0.01" 
                        required
                        className="w-full h-14 bg-slate-50 border border-slate-100 rounded-2xl pl-14 pr-6 font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#345E85] transition-all"
                        placeholder="0.00"
                        value={formData.gallons || ''}
                        onChange={(e) => setFormData({...formData, gallons: parseFloat(e.target.value)})}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Price Per Gallon</label>
                    <div className="relative">
                      <DollarSign className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 w-5 h-5 pointer-events-none" />
                      <input 
                        type="number" 
                        step="0.001" 
                        required
                        className="w-full h-14 bg-slate-50 border border-slate-100 rounded-2xl pl-14 pr-6 font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#345E85] transition-all"
                        placeholder="0.000"
                        value={formData.pricePerGallon || ''}
                        onChange={(e) => setFormData({...formData, pricePerGallon: parseFloat(e.target.value)})}
                      />
                    </div>
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Purchase Location</label>
                    <div className="relative">
                      <MapPin className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 w-5 h-5 pointer-events-none" />
                      <input 
                        type="text" 
                        required
                        className="w-full h-14 bg-slate-50 border border-slate-100 rounded-2xl pl-14 pr-6 font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#345E85] transition-all"
                        placeholder="Enter City, State or Gas Station Name"
                        value={formData.location || ''}
                        onChange={(e) => setFormData({...formData, location: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Odometer Reading</label>
                    <input 
                      type="number" 
                      className="w-full h-14 bg-slate-50 border border-slate-100 rounded-2xl px-6 font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#345E85] transition-all"
                      placeholder="Current Odometer"
                      value={formData.odometer || ''}
                      onChange={(e) => setFormData({...formData, odometer: parseInt(e.target.value)})}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Payment Method</label>
                    <div className="relative">
                      <CreditCard className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 w-5 h-5 pointer-events-none" />
                      <select 
                        className="w-full h-14 bg-slate-50 border border-slate-100 rounded-2xl pl-14 pr-6 font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#345E85] transition-all appearance-none"
                        value={formData.paymentMethod}
                        onChange={(e) => setFormData({...formData, paymentMethod: e.target.value})}
                      >
                        <option value="CASH">Cash</option>
                        <option value="FUEL_CARD">Fuel Card</option>
                        <option value="CREDIT_CARD">Credit Card</option>
                        <option value="ADVANCE">From Advance</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="flex gap-4 pt-6 border-t border-slate-100">
                  <button 
                    type="button" 
                    onClick={() => setShowLogForm(false)}
                    className="flex-1 h-16 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    disabled={createLogMutation.isPending}
                    className="flex-[2] h-16 bg-[#345E85] text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-blue-900/10 hover:bg-slate-900 transition-all active:scale-95 disabled:opacity-50"
                  >
                    {createLogMutation.isPending ? 'Recording...' : 'Submit Log'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Logs Table & Smart Finder Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="xl:col-span-2 space-y-8">
          <section>
            <div className="flex items-center justify-between mb-8 px-2">
              <div className="flex items-center gap-3">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Fuel Purchase History</h3>
                <span className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-400">
                  {logs?.length || 0}
                </span>
              </div>
            </div>

            {logsLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => <div key={i} className="h-24 bg-slate-50 rounded-[2rem] animate-pulse" />)}
              </div>
            ) : logs && logs.length > 0 ? (
              <div className="grid gap-4">
                {logs.map((log) => (
                  <div 
                    key={log.id} 
                    className="bg-white rounded-[2rem] border border-slate-100 p-8 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 hover:border-blue-100 transition-all duration-300 group"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 items-center">
                      <div className="col-span-1">
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                          <Calendar size={10} />
                          Purchase Date
                        </p>
                        <p className="text-sm font-black text-[#0f172a] uppercase tracking-tight">{new Date(log.fuelDate).toLocaleDateString()}</p>
                        <p className="text-[10px] font-bold text-slate-400 mt-1">{new Date(log.fuelDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                      </div>

                      <div className="col-span-1">
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                          <MapPin size={10} />
                          Location
                        </p>
                        <p className="text-sm font-black text-[#0f172a] uppercase tracking-tight truncate">{log.location}</p>
                        <p className="text-[10px] font-bold text-slate-400 mt-1">Odo: {log.odometer?.toLocaleString() || 'N/A'} km</p>
                      </div>

                      <div className="col-span-1">
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                          <Droplets size={10} />
                          Volume
                        </p>
                        <p className="text-sm font-black text-[#0f172a] uppercase tracking-tight">{log.gallons.toFixed(2)} GAL</p>
                        <p className="text-[10px] font-bold text-slate-400 mt-1">${log.pricePerGallon.toFixed(3)} / GAL</p>
                      </div>

                      <div className="col-span-1">
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                           <DollarSign size={10} />
                           Cost
                        </p>
                        <p className="text-lg font-black text-emerald-600 tracking-tight">{formatCurrency(log.totalCost)}</p>
                        <p className="text-[10px] font-bold text-slate-400 mt-1">{log.paymentMethod?.replace('_', ' ') || 'CASH'}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-[2rem] border border-dashed border-slate-200 p-20 text-center">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100">
                  <Fuel className="text-slate-300" size={32} />
                </div>
                <h4 className="text-lg font-black text-slate-900 uppercase tracking-tight">No Fuel Data</h4>
                <p className="text-sm font-medium text-slate-400 mt-1">Record your first fuel purchase to start tracking</p>
              </div>
            )}
          </section>
        </div>

        <div className="xl:col-span-1">
           <SmartFuelFinder />
        </div>
      </div>
    </div>
  );
};
