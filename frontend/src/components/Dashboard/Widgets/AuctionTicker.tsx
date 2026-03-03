import { Gavel, Clock, ChevronRight, Eye, Tag } from 'lucide-react';
import { useState } from 'react';
import BidDetailsModal from './BidDetailsModal';

const AuctionTicker = () => {
    const [activeTab, setActiveTab] = useState<'active' | 'watched'>('active');
    const [selectedAuction, setSelectedAuction] = useState<any>(null);

    const activeAuctions = [
        {
            id: 'BID-9921',
            route: 'Accra -> Kumasi',
            currentBid: 1250,
            currency: 'USD',
            bids: 5,
            timeLeft: '12m 30s',
            status: 'Hot',
            highestBidder: 'Swift Logistics',
            type: 'REVERSE'
        },
        {
            id: 'BID-8842',
            route: 'Lagos -> Ibadan',
            currentBid: 980,
            currency: 'USD',
            bids: 12,
            timeLeft: '45s',
            status: 'Ending',
            highestBidder: 'Mike Trans',
            type: 'FORWARD'
        }
    ];

    const watchedAuctions = [
        {
            id: 'BID-7731',
            route: 'Tema -> Ouagadougou',
            currentBid: 3400,
            currency: 'USD',
            bids: 2,
            timeLeft: '2d 4h',
            status: 'Watching',
            highestBidder: 'Burkina Fret',
            type: 'DUTCH'
        }
    ];

    const auctions = activeTab === 'active' ? activeAuctions : watchedAuctions;

    return (
        <div className="bg-white p-5 md:p-6 rounded-2xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] h-full overflow-hidden relative group flex flex-col">
            {/* Background Gradient */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none"></div>

            <div className="flex items-center justify-between mb-4 relative z-10">
                <div className="flex items-center gap-2">
                    <div className="p-2 bg-amber-100 text-amber-600 rounded-lg">
                        <Gavel size={18} />
                    </div>
                    <h3 className="font-black text-[#0f172a] text-base">Auctions</h3>
                </div>

                {/* Tabs */}
                <div className="flex bg-slate-100 p-0.5 rounded-lg">
                    <button
                        onClick={() => setActiveTab('active')}
                        className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${activeTab === 'active' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                        Active
                    </button>
                    <button
                        onClick={() => setActiveTab('watched')}
                        className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all flex items-center gap-1 ${activeTab === 'watched' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                        <Eye size={10} /> Watched
                    </button>
                </div>
            </div>

            <div className="space-y-3 relative z-10 flex-1">
                {auctions.map((auction) => (
                    <div key={auction.id} className="p-3 rounded-xl bg-slate-50 border border-slate-100 hover:border-amber-300 transition-all cursor-pointer group/item">
                        <div className="flex justify-between items-start mb-2">
                            <div className="flex items-center gap-2">
                                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${auction.type === 'REVERSE' ? 'bg-blue-100 text-blue-600' : auction.type === 'FORWARD' ? 'bg-green-100 text-green-600' : 'bg-purple-100 text-purple-600'}`}>
                                    {auction.type}
                                </span>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">{auction.id}</p>
                            </div>
                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1 ${auction.status === 'Ending' ? 'bg-red-100 text-red-600 animate-pulse' : 'bg-amber-100 text-amber-600'}`}>
                                <Clock size={10} /> {auction.timeLeft}
                            </span>
                        </div>

                        <h4 className="font-bold text-sm text-[#0f172a] mb-1">{auction.route}</h4>

                        <div className="flex items-end justify-between">
                            <div>
                                <p className="text-[10px] text-slate-500">Highest Bid</p>
                                <p className="text-lg font-black text-[#0f172a] flex items-center gap-1">
                                    ${auction.currentBid} <span className="text-[10px] font-normal text-slate-400">{auction.currency}</span>
                                </p>
                            </div>
                            <button
                                onClick={() => setSelectedAuction(auction)}
                                className="px-3 py-1.5 bg-[#0f172a] text-white text-[10px] font-bold rounded-lg hover:bg-amber-500 hover:text-white transition-colors flex items-center gap-1 opacity-0 group-hover/item:opacity-100 transform translate-y-2 group-hover/item:translate-y-0 duration-200"
                            >
                                View <ChevronRight size={12} />
                            </button>
                        </div>
                    </div>
                ))}

                {auctions.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-40 text-slate-400">
                        <Tag size={24} className="mb-2 opacity-50" />
                        <p className="text-xs font-medium">No auctions found</p>
                    </div>
                )}
            </div>

            <button className="w-full mt-4 py-2 text-center text-xs font-bold text-slate-400 hover:text-amber-600 transition-colors flex items-center justify-center gap-1">
                View All {activeTab === 'active' ? 'Auctions' : 'Watchlist'} <ChevronRight size={12} />
            </button>

            {selectedAuction && (
                <BidDetailsModal
                    auction={selectedAuction}
                    onClose={() => setSelectedAuction(null)}
                />
            )}
        </div>
    );
};

export default AuctionTicker;
