import React, { useState } from 'react';
import { X, Gavel, Calendar, DollarSign, Clock } from 'lucide-react';
import { biddingAPI } from '../../../services/biddingApi'; // Assuming this exists based on CreateAuction.tsx
import toast from 'react-hot-toast';

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

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[10000]" onClick={onClose}>
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden" onClick={e => e.stopPropagation()}>

                <div className="p-5 border-b border-gray-100 flex justify-between items-center">
                    <div>
                        <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                            <Gavel className="w-5 h-5 text-purple-600" />
                            Create Auction
                        </h2>
                        {loadTitle && <p className="text-sm text-gray-500 mt-1">For: {loadTitle}</p>}
                    </div>
                    <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full transition-colors">
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">

                    <div className="space-y-1">
                        <label className="text-sm font-medium text-gray-700">Auction Type</label>
                        <select
                            value={formData.auctionType}
                            onChange={(e) => handleInputChange('auctionType', e.target.value)}
                            className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-all"
                        >
                            <option value="REVERSE">Reverse Auction (Lowest Bid Wins)</option>
                            <option value="FORWARD">Forward Auction</option>
                            <option value="DUTCH">Dutch Auction</option>
                            <option value="SEALED">Sealed Bid</option>
                        </select>
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
