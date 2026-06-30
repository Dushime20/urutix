import React, { useState } from 'react';
import { X, Gavel, Calendar, DollarSign, Clock, ChevronDown } from 'lucide-react';
import { biddingAPI } from '../../../services/biddingApi';
import toast from 'react-hot-toast';

const AUCTION_TYPES = [
  { value: 'REVERSE', label: 'Reverse Auction', sublabel: 'Carriers bid down — lowest bid wins. Most common for standard freight.' },
  { value: 'FORWARD', label: 'Forward Auction',  sublabel: 'Carriers bid up — highest bid wins. Best for premium or urgent cargo.' },
  { value: 'DUTCH',   label: 'Dutch Auction',    sublabel: 'Price drops automatically at set intervals until a carrier accepts.' },
  { value: 'SEALED',  label: 'Sealed Bid',       sublabel: 'Blind bids submitted privately, revealed only after the deadline.' },
];

interface CreateBrokerAuctionModalProps {
  isOpen: boolean;
  onClose: () => void;
  loadId: string;
  loadTitle?: string;
  onSuccess?: () => void;
}

export const CreateBrokerAuctionModal: React.FC<CreateBrokerAuctionModalProps> = ({
  isOpen, onClose, loadId, loadTitle, onSuccess,
}) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    auctionType: 'REVERSE',
    auctionStart: '',
    auctionEnd: '',
    reservePrice: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Convert datetime-local strings (which have no timezone) to UTC ISO strings
      // so the backend always receives an unambiguous timestamp.
      const toUTC = (localStr: string): string => {
        if (!localStr) return localStr;
        return new Date(localStr).toISOString();
      };

      await biddingAPI.createAuction({
        loadId,
        auctionType: formData.auctionType as 'REVERSE' | 'FORWARD' | 'DUTCH' | 'SEALED',
        auctionStart: toUTC(formData.auctionStart),
        auctionEnd: toUTC(formData.auctionEnd),
        reservePrice: formData.reservePrice ? parseFloat(formData.reservePrice) : undefined,
      });
      toast.success('Auction created successfully!');
      onSuccess?.();
      onClose();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create auction');
    } finally {
      setLoading(false);
    }
  };

  const set = (field: string, value: string) =>
    setFormData(prev => ({ ...prev, [field]: value }));

  if (!isOpen) return null;

  const active = AUCTION_TYPES.find(t => t.value === formData.auctionType) ?? AUCTION_TYPES[0];

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-[10000]"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-800 flex justify-between items-center">
          <div>
            <h2 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Gavel className="w-4 h-4 text-[#345E85]" />
              Create Auction
            </h2>
            {loadTitle && (
              <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">For: {loadTitle}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-4 h-4 text-gray-400 dark:text-slate-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">

          {/* Auction Type */}
          <div className="space-y-1.5">
            <label className="block text-xs font-black text-slate-600 dark:text-slate-400 uppercase tracking-wider">
              Auction Type
            </label>
            <div className="relative">
              <select
                value={formData.auctionType}
                onChange={e => set('auctionType', e.target.value)}
                className="w-full px-4 py-3 pr-9 appearance-none rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-medium text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-[#345E85] focus:border-[#345E85] transition-all"
              >
                {AUCTION_TYPES.map(t => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
              <ChevronDown
                size={15}
                className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400"
              />
            </div>
            {/* Plain description line — no colour theatrics */}
            <p className="text-xs text-slate-400 dark:text-slate-500">{active.sublabel}</p>
          </div>

          {/* Start / End time */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="block text-xs font-black text-slate-600 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <Calendar className="w-3 h-3" /> Start
              </label>
              <input
                type="datetime-local"
                required
                value={formData.auctionStart}
                onChange={e => set('auctionStart', e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-[#345E85] focus:border-[#345E85] transition-all"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-black text-slate-600 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <Clock className="w-3 h-3" /> End
              </label>
              <input
                type="datetime-local"
                required
                value={formData.auctionEnd}
                onChange={e => set('auctionEnd', e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-[#345E85] focus:border-[#345E85] transition-all"
              />
            </div>
          </div>

          {/* Reserve Price */}
          <div className="space-y-1.5">
            <label className="block text-xs font-black text-slate-600 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <DollarSign className="w-3 h-3" /> Reserve Price
              <span className="normal-case font-medium text-slate-400">(optional)</span>
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              placeholder="e.g. 50 000"
              value={formData.reservePrice}
              onChange={e => set('reservePrice', e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-[#345E85] focus:border-[#345E85] transition-all"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-xl text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2.5 bg-[#345E85] hover:bg-[#2c5173] text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-60 flex items-center justify-center"
            >
              {loading
                ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                : 'Create Auction'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
