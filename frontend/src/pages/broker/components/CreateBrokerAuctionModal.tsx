import React, { useState } from 'react';
import { X, Gavel, Calendar, DollarSign, Clock, TrendingDown, TrendingUp, Zap, Lock, ChevronDown } from 'lucide-react';
import { biddingAPI } from '../../../services/biddingApi';
import toast from 'react-hot-toast';

// ─── auction type meta ────────────────────────────────────────────────────────
const AUCTION_TYPES = [
  {
    value: 'REVERSE',
    label: 'Reverse Auction — Lowest Bid Wins',
    sublabel: 'Carriers bid DOWN from your target price. Most common for standard freight.',
    icon: TrendingDown,
    badgeColor: 'text-blue-700 bg-blue-50 dark:text-blue-300 dark:bg-blue-900/30',
    iconColor: 'text-blue-600 dark:text-blue-400',
    iconBg: 'bg-blue-50 dark:bg-blue-900/20',
    border: 'border-blue-200 dark:border-blue-700',
    activeBg: 'bg-blue-50/60 dark:bg-blue-900/10',
  },
  {
    value: 'FORWARD',
    label: 'Forward Auction — Highest Bid Wins',
    sublabel: 'Carriers bid UP from starting price. Best for premium or urgent cargo.',
    icon: TrendingUp,
    badgeColor: 'text-emerald-700 bg-emerald-50 dark:text-emerald-300 dark:bg-emerald-900/30',
    iconColor: 'text-emerald-600 dark:text-emerald-400',
    iconBg: 'bg-emerald-50 dark:bg-emerald-900/20',
    border: 'border-emerald-200 dark:border-emerald-700',
    activeBg: 'bg-emerald-50/60 dark:bg-emerald-900/10',
  },
  {
    value: 'DUTCH',
    label: 'Dutch Auction — Fast-Drop Price',
    sublabel: 'Price drops automatically at intervals until a carrier accepts.',
    icon: Zap,
    badgeColor: 'text-amber-700 bg-amber-50 dark:text-amber-300 dark:bg-amber-900/30',
    iconColor: 'text-amber-600 dark:text-amber-400',
    iconBg: 'bg-amber-50 dark:bg-amber-900/20',
    border: 'border-amber-200 dark:border-amber-700',
    activeBg: 'bg-amber-50/60 dark:bg-amber-900/10',
  },
  {
    value: 'SEALED',
    label: 'Sealed Bid — Confidential Bids',
    sublabel: 'Blind bidding; all bids revealed only after the deadline closes.',
    icon: Lock,
    badgeColor: 'text-purple-700 bg-purple-50 dark:text-purple-300 dark:bg-purple-900/30',
    iconColor: 'text-purple-600 dark:text-purple-400',
    iconBg: 'bg-purple-50 dark:bg-purple-900/20',
    border: 'border-purple-200 dark:border-purple-700',
    activeBg: 'bg-purple-50/60 dark:bg-purple-900/10',
  },
];

interface CreateBrokerAuctionModalProps {
    isOpen: boolean;
    onClose: () => void;
    loadId: string;
    loadTitle?: string;
    onSuccess?: () => void;
}

export const CreateBrokerAuctionModal: React.FC<CreateBrokerAuctionModalProps> = ({
    isOpen,
    onClose,
    loadId,
    loadTitle,
    onSuccess
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
            const payload = {
                loadId,
                auctionType: formData.auctionType as 'REVERSE' | 'FORWARD' | 'DUTCH' | 'SEALED',
                auctionStart: formData.auctionStart,
                auctionEnd: formData.auctionEnd,
                reservePrice: formData.reservePrice ? parseFloat(formData.reservePrice) : undefined,
            };

            await biddingAPI.createAuction(payload);
            toast.success('Auction created successfully!');
            if (onSuccess) onSuccess();
            onClose();
        } catch (error: any) {
            console.error('Failed to create auction:', error);
            toast.error(error.response?.data?.message || 'Failed to create auction');
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    if (!isOpen) return null;

    const active = AUCTION_TYPES.find(t => t.value === formData.auctionType) ?? AUCTION_TYPES[0];
    const ActiveIcon = active.icon;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[10000]" onClick={onClose}>
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden dark:bg-slate-900" onClick={e => e.stopPropagation()}>

                <div className="p-5 border-b border-gray-100 dark:border-slate-800 flex justify-between items-center">
                    <div>
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <Gavel className="w-5 h-5 text-purple-600" />
                            Create Auction
                        </h2>
                        {loadTitle && <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">For: {loadTitle}</p>}
                    </div>
                    <button onClick={onClose} className="p-1 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                        <X className="w-5 h-5 text-gray-500 dark:text-slate-400" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-5">

                    {/* ── Auction Type select ─────────────────────────────── */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <label className="text-sm font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                                Select Auction Type
                            </label>
                        </div>

                        {/* Select with leading icon */}
                        <div className="relative">
                            <div className={`absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-xl flex items-center justify-center pointer-events-none ${active.iconBg}`}>
                                <ActiveIcon size={15} className={active.iconColor} />
                            </div>
                            <select
                                value={formData.auctionType}
                                onChange={(e) => handleInputChange('auctionType', e.target.value)}
                                className={`w-full pl-14 pr-10 py-3.5 appearance-none border-2 rounded-2xl text-sm font-bold bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none transition-all focus:ring-2 focus:ring-offset-0 ${active.border} ${active.activeBg}`}
                            >
                                {AUCTION_TYPES.map(t => (
                                    <option key={t.value} value={t.value}>{t.label}</option>
                                ))}
                            </select>
                            <ChevronDown size={15} className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 dark:text-slate-500" />
                        </div>

                        {/* Description for selected type */}
                        <div className={`flex items-start gap-3 p-3 rounded-xl border-2 ${active.activeBg} ${active.border}`}>
                            <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${active.iconBg}`}>
                                <ActiveIcon size={14} className={active.iconColor} />
                            </div>
                            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed pt-0.5">
                                {active.sublabel}
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
                                <Calendar className="w-3.5 h-3.5" /> Start Time
                            </label>
                            <input
                                type="datetime-local"
                                required
                                value={formData.auctionStart}
                                onChange={(e) => handleInputChange('auctionStart', e.target.value)}
                                className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none text-sm"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5" /> End Time
                            </label>
                            <input
                                type="datetime-local"
                                required
                                value={formData.auctionEnd}
                                onChange={(e) => handleInputChange('auctionEnd', e.target.value)}
                                className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none text-sm"
                            />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
                            <DollarSign className="w-3.5 h-3.5" /> Reserve Price (Optional)
                        </label>
                        <input
                            type="number"
                            min="0"
                            step="0.01"
                            placeholder="e.g. 50000"
                            value={formData.reservePrice}
                            onChange={(e) => handleInputChange('reservePrice', e.target.value)}
                            className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-all"
                        />
                    </div>

                    <div className="pt-4 flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 px-4 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium transition-colors disabled:opacity-70 flex justify-center items-center"
                        >
                            {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Create Auction'}
                        </button>
                    </div>

                </form>
            </div>
        </div>
    );
};
