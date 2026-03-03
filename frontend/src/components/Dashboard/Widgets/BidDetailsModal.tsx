import { X, Check, XCircle, User, Clock, DollarSign } from 'lucide-react';

interface Bid {
    id: string;
    bidderName: string;
    amount: number;
    time: string;
    rating: number;
    status: 'pending' | 'accepted' | 'rejected';
}

interface Auction {
    id: string;
    route: string;
    currentBid: number;
    currency: string;
    status: string;
}

interface BidDetailsModalProps {
    auction: Auction;
    onClose: () => void;
}

const BidDetailsModal: React.FC<BidDetailsModalProps> = ({ auction, onClose }) => {
    // Mock bids data
    const bids: Bid[] = [
        { id: '1', bidderName: 'Swift Logistics', amount: 1250, time: '2m ago', rating: 4.8, status: 'pending' },
        { id: '2', bidderName: 'Global Haulage', amount: 1200, time: '15m ago', rating: 4.5, status: 'rejected' },
        { id: '3', bidderName: 'Kofi Trans', amount: 1150, time: '1h ago', rating: 4.2, status: 'pending' },
    ];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden scale-100 animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="p-4 md:p-6 border-b border-slate-100 flex justify-between items-start bg-slate-50/50">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-700 uppercase tracking-wide">
                                {auction.status}
                            </span>
                            <span className="text-xs text-slate-400 font-mono">#{auction.id}</span>
                        </div>
                        <h3 className="text-lg md:text-xl font-black text-[#0f172a]">{auction.route}</h3>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 -mr-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-all"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 divide-x divide-slate-100 border-b border-slate-100 bg-white">
                    <div className="p-4 text-center">
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Highest Bid</p>
                        <p className="text-lg font-black text-teal-600">${auction.currentBid}</p>
                    </div>
                    <div className="p-4 text-center">
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total Bids</p>
                        <p className="text-lg font-black text-[#0f172a]">{bids.length}</p>
                    </div>
                    <div className="p-4 text-center">
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Time Left</p>
                        <p className="text-lg font-black text-[#0f172a]">12m 30s</p>
                    </div>
                </div>

                {/* Bids List */}
                <div className="max-h-[300px] overflow-y-auto p-4 md:p-6 space-y-3">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Bid History</h4>

                    {bids.map((bid) => (
                        <div key={bid.id} className="flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:border-teal-100 hover:bg-teal-50/30 transition-all group">
                            <div className="flex items-center gap-3">
                                <div className="size-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 font-bold text-xs">
                                    {bid.bidderName.substring(0, 2).toUpperCase()}
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <p className="text-sm font-bold text-[#0f172a]">{bid.bidderName}</p>
                                        <span className="text-[10px] font-bold text-slate-400 flex items-center gap-0.5">
                                            ★ {bid.rating}
                                        </span>
                                    </div>
                                    <p className="text-[10px] text-slate-400 flex items-center gap-1">
                                        <Clock size={10} /> {bid.time}
                                    </p>
                                </div>
                            </div>

                            <div className="text-right">
                                <p className="text-sm font-black text-[#0f172a]">${bid.amount}</p>
                                {bid.status === 'pending' && (
                                    <div className="flex items-center gap-1 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button className="p-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-500" title="Reject">
                                            <X size={12} />
                                        </button>
                                        <button className="p-1 rounded bg-teal-500 hover:bg-teal-600 text-white shadow-sm shadow-teal-500/30" title="Accept">
                                            <Check size={12} />
                                        </button>
                                    </div>
                                )}
                                {bid.status === 'rejected' && (
                                    <span className="text-[10px] font-bold text-slate-300">Rejected</span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Footer Action */}
                <div className="p-4 bg-slate-50 border-t border-slate-100 text-center">
                    <button className="text-xs font-bold text-teal-600 hover:text-teal-700 flex items-center justify-center gap-1">
                        View Full Auction Analytics
                    </button>
                </div>
            </div>
        </div>
    );
};

export default BidDetailsModal;
