import { Truck, FileText, Landmark, Wallet, TrendingUp, TrendingDown } from 'lucide-react';
import { useEffect, useState } from 'react';

interface StatsOverviewProps {
    stats: {
        activeShipments: number;
        pendingOffers: number;
        financingLimit: number;
        walletBalance: number;
    };
}

const StatsOverview: React.FC<StatsOverviewProps> = ({ stats }) => {
    // Simple count up animation hook
    const useCounter = (end: number, duration = 2000) => {
        const [count, setCount] = useState(0);

        useEffect(() => {
            let startTime: number;
            let animationFrame: number;

            const animate = (timestamp: number) => {
                if (!startTime) startTime = timestamp;
                const progress = timestamp - startTime;

                if (progress < duration) {
                    setCount(Math.min(end, Math.floor((progress / duration) * end)));
                    animationFrame = requestAnimationFrame(animate);
                } else {
                    setCount(end);
                }
            };

            animationFrame = requestAnimationFrame(animate);
            return () => cancelAnimationFrame(animationFrame);
        }, [end, duration]);

        return count;
    };

    const activeShipmentsCount = useCounter(stats.activeShipments);
    const pendingOffersCount = useCounter(stats.pendingOffers);
    const financingLimitCount = useCounter(stats.financingLimit);
    const walletBalanceCount = useCounter(stats.walletBalance);

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {/* Active Shipments */}
            <div className="bg-white/[0.04] border border-white/10 backdrop-blur-sm p-4 md:p-6 rounded-2xl group hover:bg-white/10 hover:-translate-y-1 transition-all duration-300 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <TrendingUp size={16} className="text-green-400" />
                </div>
                <div className="flex items-center justify-between mb-4 md:mb-6">
                    <div className="size-10 md:size-12 rounded-2xl bg-blue-500/20 text-blue-400 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                        <Truck size={20} className="md:w-6 md:h-6" />
                    </div>
                    <span className="text-[10px] md:text-[11px] font-bold text-green-400 bg-green-400/10 px-2 md:px-2.5 py-1 rounded-full flex items-center gap-1 animate-pulse">
                        <TrendingUp size={12} /> +2
                    </span>
                </div>
                <p className="text-white/40 text-[10px] md:text-[11px] font-bold uppercase tracking-widest">Active Shipments</p>
                <h3 className="text-2xl md:text-3xl font-black mt-1 text-white">{activeShipmentsCount.toString().padStart(2, '0')}</h3>

                {/* Mini chart line */}
                <div className="h-1 w-full bg-white/5 mt-4 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 w-[65%] rounded-full"></div>
                </div>
            </div>

            {/* Pending Offers */}
            <div className="bg-white/[0.04] border border-white/10 backdrop-blur-sm p-4 md:p-6 rounded-2xl group hover:bg-white/10 hover:-translate-y-1 transition-all duration-300 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <TrendingUp size={16} className="text-amber-400" />
                </div>
                <div className="flex items-center justify-between mb-4 md:mb-6">
                    <div className="size-10 md:size-12 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                        <FileText size={20} className="md:w-6 md:h-6" />
                    </div>
                    <span className="text-[10px] md:text-[11px] font-bold text-amber-400 bg-amber-400/10 px-2 md:px-2.5 py-1 rounded-full flex items-center gap-1">
                        ⏱ 5 New
                    </span>
                </div>
                <p className="text-white/40 text-[10px] md:text-[11px] font-bold uppercase tracking-widest">Pending Offers</p>
                <h3 className="text-2xl md:text-3xl font-black mt-1 text-white">{pendingOffersCount.toString().padStart(2, '0')}</h3>

                {/* Mini chart line */}
                <div className="h-1 w-full bg-white/5 mt-4 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-500 w-[40%] rounded-full"></div>
                </div>
            </div>

            {/* Financing Limit */}
            <div className="bg-white/[0.04] border border-white/10 backdrop-blur-sm p-4 md:p-6 rounded-2xl group hover:bg-white/10 hover:-translate-y-1 transition-all duration-300 relative overflow-hidden">
                <div className="flex items-center justify-between mb-4 md:mb-6">
                    <div className="size-10 md:size-12 rounded-2xl bg-teal-500/20 text-teal-400 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                        <Landmark size={20} className="md:w-6 md:h-6" />
                    </div>
                    <span className="text-[10px] md:text-[11px] font-bold text-white/40 px-2 md:px-2.5 py-1 bg-white/5 rounded-full">
                        25% USED
                    </span>
                </div>
                <p className="text-white/40 text-[10px] md:text-[11px] font-bold uppercase tracking-widest">Financing Limit</p>
                <h3 className="text-2xl md:text-3xl font-black mt-1 text-white">${financingLimitCount.toLocaleString()}</h3>

                {/* Mini chart line */}
                <div className="h-1 w-full bg-white/5 mt-4 rounded-full overflow-hidden">
                    <div className="h-full bg-teal-500 w-[25%] rounded-full"></div>
                </div>
            </div>

            {/* Wallet Balance */}
            <div className="bg-white/[0.04] border border-white/10 backdrop-blur-sm p-4 md:p-6 rounded-2xl group hover:bg-white/10 hover:-translate-y-1 transition-all duration-300 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <TrendingDown size={16} className="text-indigo-400" />
                </div>
                <div className="flex items-center justify-between mb-4 md:mb-6">
                    <div className="size-10 md:size-12 rounded-2xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                        <Wallet size={20} className="md:w-6 md:h-6" />
                    </div>
                    <span className="text-[10px] md:text-[11px] font-bold text-green-400 bg-green-400/10 px-2 md:px-2.5 py-1 rounded-full flex items-center gap-1">
                        <TrendingUp size={12} /> 1.2%
                    </span>
                </div>
                <p className="text-white/40 text-[10px] md:text-[11px] font-bold uppercase tracking-widest">Wallet Balance</p>
                <h3 className="text-2xl md:text-3xl font-black mt-1 text-white">${walletBalanceCount.toLocaleString()}</h3>

                {/* Mini chart line */}
                <div className="h-1 w-full bg-white/5 mt-4 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-500 w-[80%] rounded-full"></div>
                </div>
            </div>
        </div>
    );
};

export default StatsOverview;
