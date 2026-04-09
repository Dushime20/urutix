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
    <div className="fixed inset-0 bg-slate-900/60 dark:bg-black/80 backdrop-blur-md z-[200] flex items-center justify-center p-4 transition-colors">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white dark:bg-slate-900 rounded-[2.5rem] w-full max-w-2xl overflow-hidden border border-slate-100 dark:border-slate-800 flex flex-col max-h-[90vh] transition-colors"
      >
        {/* Header */}
        <div className="p-8 pb-4 flex items-center justify-between border-b border-slate-50 dark:border-slate-800 transition-colors">
          <div className="flex items-center gap-5">
            <div className="size-14 bg-primary-50 dark:bg-blue-900/20 rounded-[22px] flex items-center justify-center text-primary-500 dark:text-blue-400">
              <DollarSign size={28} />
            </div>
            <div>
              <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-primary-500 dark:text-blue-400 mb-1">Fuel Wallet</h2>
              <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Add Credit</h1>
            </div>
          </div>
          <button onClick={onClose} className="size-10 flex items-center justify-center text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-all">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 pb-10 space-y-8 overflow-y-auto custom-scrollbar">

          {/* Amount */}
          <div className="p-10 bg-[#fafafa] dark:bg-slate-950/40 rounded-[3rem] border border-gray-100 dark:border-slate-800 relative overflow-hidden transition-colors shadow-sm">
            <div className="absolute top-0 right-0 p-10 opacity-[0.03] dark:opacity-[0.05] pointer-events-none text-blue-600">
              <DollarSign size={120} />
            </div>
            <div className="space-y-4">
              <label className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-2">Deposit Amount</label>
              <div className="relative group">
                <span className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 dark:text-slate-600 font-black group-focus-within:text-emerald-500 dark:group-focus-within:text-emerald-400 transition-colors text-xl">$</span>
                <input
                  type="number" step="any" required placeholder="0.00"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  className="w-full h-16 pl-12 pr-6 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:ring-8 focus:ring-emerald-500/5 dark:focus:ring-emerald-400/5 focus:border-emerald-500 dark:focus:border-emerald-500 transition-all text-2xl font-black text-slate-900 dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* Form Fields Group */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Petrol Station */}
            <div className="space-y-4">
              <label className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-2">Petrol Station</label>
              <div className="relative group">
                <Fuel size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 group-focus-within:text-blue-500 dark:group-focus-within:text-blue-400 transition-colors" />
                <select
                  required
                  value={petrolStation}
                  onChange={e => setPetrolStation(e.target.value)}
                  className="w-full h-14 pl-14 pr-6 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-2xl outline-none focus:ring-8 focus:ring-blue-500/5 dark:focus:ring-blue-400/5 focus:bg-white dark:focus:bg-slate-900 focus:border-blue-500 dark:focus:border-blue-500 transition-all text-[11px] font-black uppercase tracking-widest appearance-none cursor-pointer text-slate-900 dark:text-white"
                >
                  <option value="" className="bg-white dark:bg-slate-900 text-slate-400">SELECT STATION...</option>
                  {RWANDA_PETROL_STATIONS.map(station => (
                    <option key={station} value={station} className="bg-white dark:bg-slate-900">{station}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Transaction Date */}
            <div className="space-y-4">
              <label className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-2">Transaction Date</label>
              <div className="relative group">
                <Calendar size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 group-focus-within:text-blue-500 dark:group-focus-within:text-blue-400 transition-colors" />
                <input
                  type="date" required
                  value={transactionDate}
                  onChange={e => setTransactionDate(e.target.value)}
                  className="w-full h-14 pl-14 pr-6 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-2xl outline-none focus:ring-8 focus:ring-blue-500/5 dark:focus:ring-blue-400/5 focus:bg-white dark:focus:bg-slate-900 focus:border-blue-500 dark:focus:border-blue-500 transition-all text-xs font-black uppercase tracking-widest text-slate-900 dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-4">
            <label className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-2">Internal Notes (Optional)</label>
            <textarea
              placeholder="Enter any administrative notes about this wallet credit..."
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="w-full h-28 p-6 bg-[#fafafa] dark:bg-slate-950 border border-gray-100 dark:border-slate-800 rounded-[2rem] outline-none focus:bg-white dark:focus:bg-slate-900 focus:border-blue-500 dark:focus:border-blue-500 transition-all text-xs font-medium resize-none text-slate-700 dark:text-slate-300 leading-relaxed"
            />
          </div>

          {/* Buttons */}
          <div className="flex items-center gap-6 pt-10 border-t border-slate-50 dark:border-slate-800 transition-colors">
            <button
              type="button" onClick={onClose}
              className="flex-1 h-14 bg-white dark:bg-slate-950 hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-500 dark:text-slate-500 font-black text-[11px] uppercase tracking-[0.2em] rounded-2xl transition-all active:scale-95 border border-slate-100 dark:border-slate-800"
            >
              CLOSE
            </button>
            <button
              type="submit" disabled={loading}
              className="flex-[2] h-14 bg-blue-600 text-white font-black text-[11px] uppercase tracking-[0.3em] rounded-2xl hover:bg-blue-700 transition-all flex items-center justify-center gap-4 active:scale-[0.98] group shadow-xl shadow-blue-500/10"
            >
              {loading ? 'PROCESSING...' : (
                <>
                  <Save size={18} className="group-hover:scale-125 transition-transform" />
                  FINALIZE DEPOSIT
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
