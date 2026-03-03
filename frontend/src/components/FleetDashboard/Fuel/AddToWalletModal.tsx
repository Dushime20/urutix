import React, { useState, useEffect } from 'react';
import {
  DollarSign,
  X,
  Save,
  Fuel,
  Calendar,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { fuelApi } from '../../../services/fuelApi';
import { motion } from 'framer-motion';

interface AddToWalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  walletId?: string;
  onSuccess?: () => void;
}

const RWANDA_PETROL_STATIONS = [
  'SP (Société Pétrolière)',
  'Engen',
  'Shell (Vivo Energy)',
  'TotalEnergies',
  'Kobil',
  'Hashi Energy',
  'Mount Meru Petroleum',
  'Tosha Petroleum',
  'RubisFla Energy',
  'Delta Petroleum',
  'Lake Gas',
  'Meru Energy',
  'ONE Petroleum',
  'Gulf Energy',
  'Oryx Energies',
  'CityOil',
  'Other',
];

export const AddToWalletModal: React.FC<AddToWalletModalProps> = ({
  isOpen,
  onClose,
  walletId,
  onSuccess,
}) => {
  const [amount, setAmount] = useState('');
  const [petrolStation, setPetrolStation] = useState('');
  const [transactionDate, setTransactionDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setAmount('');
      setPetrolStation('');
      setTransactionDate(new Date().toISOString().split('T')[0]);
      setNotes('');
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!amount || parseFloat(amount) <= 0) {
      toast.error('Amount must be greater than 0');
      return;
    }

    if (!petrolStation) {
      toast.error('Please select a petrol station');
      return;
    }

    setLoading(true);

    try {
      // If no walletId provided, get or create the wallet first
      let targetWalletId = walletId;
      if (!targetWalletId) {
        console.log('No walletId, fetching/creating wallet...');
        const walletData = await fuelApi.getMyWallet();
        targetWalletId = walletData?.id;
        if (!targetWalletId) {
          toast.error('Could not create wallet. Please try again.');
          setLoading(false);
          return;
        }
      }

      const metadata = {
        petrolStation,
        transactionDate,
      };

      const description = notes || `Fuel purchase at ${petrolStation}`;

      await fuelApi.addWalletCredit(
        targetWalletId,
        parseFloat(amount),
        description,
        metadata
      );

      toast.success('Credit added to wallet successfully!');
      onSuccess?.();
      onClose();
    } catch (error: any) {
      console.error('Error adding credit:', error);
      toast.error(error?.response?.data?.message || 'Failed to add credit to wallet');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[200] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white rounded-[2.5rem] w-full max-w-2xl overflow-hidden border border-slate-100 flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="p-8 pb-4 flex items-center justify-between border-b border-slate-50">
          <div className="flex items-center gap-5">
            <div className="size-14 bg-primary-50 rounded-[22px] flex items-center justify-center text-primary-500">
              <DollarSign size={28} />
            </div>
            <div>
              <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-primary-500 mb-1">Fuel Wallet</h2>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">Add Credit</h1>
            </div>
          </div>
          <button onClick={onClose} className="size-10 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-all">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 pb-10 space-y-8 overflow-y-auto">

          {/* Amount */}
          <div className="p-8 bg-slate-50/50 rounded-[32px] border border-slate-100 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-[0.02] pointer-events-none">
              <DollarSign size={80} />
            </div>
            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Amount</label>
              <div className="relative group">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 font-black group-focus-within:text-emerald-500 transition-colors">$</span>
                <input
                  type="number" step="any" required placeholder="0.00"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  className="w-full h-14 pl-10 pr-4 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-500 transition-all text-xl font-black text-slate-900"
                />
              </div>
            </div>
          </div>

          {/* Petrol Station */}
          <div className="space-y-3">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Petrol Station</label>
            <div className="relative group">
              <Fuel size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary-500 transition-colors" />
              <select
                required
                value={petrolStation}
                onChange={e => setPetrolStation(e.target.value)}
                className="w-full h-14 pl-12 pr-4 bg-slate-50 border border-slate-200 rounded-[20px] outline-none focus:ring-4 focus:ring-primary-500/5 focus:bg-white focus:border-primary-500 transition-all text-xs font-black uppercase tracking-widest appearance-none cursor-pointer"
              >
                <option value="">SELECT PETROL STATION...</option>
                {RWANDA_PETROL_STATIONS.map(station => (
                  <option key={station} value={station}>{station}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Transaction Date */}
          <div className="space-y-3">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Transaction Date</label>
            <div className="relative group">
              <Calendar size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary-500 transition-colors" />
              <input
                type="date" required
                value={transactionDate}
                onChange={e => setTransactionDate(e.target.value)}
                className="w-full h-14 pl-12 pr-4 bg-slate-50 border border-slate-200 rounded-[20px] outline-none focus:ring-4 focus:ring-primary-500/5 focus:bg-white focus:border-primary-500 transition-all text-xs font-black uppercase tracking-widest"
              />
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-3">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Notes (Optional)</label>
            <textarea
              placeholder="Enter any notes about this transaction..."
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="w-full h-24 p-5 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:bg-white focus:border-primary-500 transition-all text-xs font-medium resize-none"
            />
          </div>

          {/* Buttons */}
          <div className="flex items-center gap-6 pt-10 border-t border-slate-50">
            <button
              type="button" onClick={onClose}
              className="flex-1 h-14 bg-slate-100 hover:bg-slate-200 text-slate-600 font-black text-[10px] uppercase tracking-widest rounded-[22px] transition-all active:scale-95"
            >
              Cancel
            </button>
            <button
              type="submit" disabled={loading}
              className="flex-[2] h-14 bg-primary-500 text-white font-black text-[10px] uppercase tracking-widest rounded-[22px] hover:bg-primary-600 transition-all flex items-center justify-center gap-3 active:scale-[0.98] group"
            >
              {loading ? 'PROCESSING...' : (
                <>
                  <Save size={16} className="group-hover:translate-x-1 transition-transform" />
                  Add Credit to Wallet
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
