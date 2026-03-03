import { TrendingUp, TrendingDown, Activity, Clock } from 'lucide-react';

const TradeIntelligence = () => {
    return (
        <div className="bg-white p-5 md:p-8 rounded-2xl md:rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-teal-500 via-indigo-500 to-teal-500 opacity-20"></div>

            <div className="flex flex-col md:flex-row gap-6 md:gap-8">
                {/* Left - Currency Section */}
                <div className="w-full md:w-1/3">
                    <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg md:text-xl font-black text-[#0f172a]">Trade Intelligence</h3>
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-500"></span>
                        </span>
                    </div>
                    <p className="text-slate-500 text-xs md:text-sm mb-4 md:mb-6 flex items-center gap-1">
                        Live insights. <span className="text-xs text-slate-400 font-medium">Updated 2m ago</span>
                    </p>

                    <div className="space-y-3 md:space-y-4">
                        <div className="p-3 md:p-4 bg-slate-50 rounded-xl md:rounded-2xl border border-slate-100 hover:border-teal-200 transition-colors group cursor-pointer">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-[9px] md:text-[10px] font-bold text-slate-400 uppercase tracking-widest group-hover:text-teal-600 transition-colors">GHS / NGN</span>
                                <span className="text-green-600 text-[10px] md:text-xs font-bold bg-green-100 px-1.5 py-0.5 rounded flex items-center gap-1">
                                    <TrendingUp size={10} /> +0.4%
                                </span>
                            </div>
                            <div className="flex items-baseline gap-2">
                                <span className="text-lg md:text-xl font-black text-[#0f172a]">102.45</span>
                                <span className="text-slate-400 text-[9px] md:text-[10px] font-bold uppercase">NGN per GHS</span>
                            </div>
                        </div>

                        <div className="p-3 md:p-4 bg-slate-50 rounded-xl md:rounded-2xl border border-slate-100 hover:border-red-200 transition-colors group cursor-pointer">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-[9px] md:text-[10px] font-bold text-slate-400 uppercase tracking-widest group-hover:text-red-500 transition-colors">USD / GHS</span>
                                <span className="text-red-600 text-[10px] md:text-xs font-bold bg-red-100 px-1.5 py-0.5 rounded flex items-center gap-1">
                                    <TrendingDown size={10} /> -0.1%
                                </span>
                            </div>
                            <div className="flex items-baseline gap-2">
                                <span className="text-lg md:text-xl font-black text-[#0f172a]">11.92</span>
                                <span className="text-slate-400 text-[9px] md:text-[10px] font-bold uppercase">GHS per USD</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right - Metrics Grid */}
                <div className="w-full md:w-2/3 grid grid-cols-2 gap-3 md:gap-4">
                    {/* Fuel Index */}
                    <div className="p-4 md:p-6 bg-teal-50/30 border border-teal-100 rounded-2xl md:rounded-3xl hover:shadow-lg hover:shadow-teal-500/5 transition-all cursor-pointer group">
                        <div className="flex justify-between items-start mb-1">
                            <p className="text-[9px] md:text-[10px] font-black text-teal-700 uppercase tracking-widest">Fuel Index</p>
                            <Activity size={14} className="text-teal-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                        <h4 className="text-xl md:text-2xl font-black text-[#0f172a]">$1.14<span className="text-xs text-slate-400 ml-1">/L</span></h4>
                        <div className="mt-3 md:mt-4 flex items-center gap-2">
                            <TrendingDown size={14} className="text-green-600" />
                            <span className="text-[9px] md:text-[10px] font-bold text-slate-500 uppercase">Avg across Lagos route</span>
                        </div>
                    </div>

                    {/* Wait Time */}
                    <div className="p-4 md:p-6 bg-indigo-50/30 border border-indigo-100 rounded-2xl md:rounded-3xl hover:shadow-lg hover:shadow-indigo-500/5 transition-all cursor-pointer group">
                        <div className="flex justify-between items-start mb-1">
                            <p className="text-[9px] md:text-[10px] font-black text-indigo-700 uppercase tracking-widest">Wait Time</p>
                            <Clock size={14} className="text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                        <h4 className="text-xl md:text-2xl font-black text-[#0f172a]">14.2<span className="text-xs text-slate-400 ml-1">Hrs</span></h4>
                        <div className="mt-3 md:mt-4 flex items-center gap-2">
                            <TrendingUp size={14} className="text-amber-600" />
                            <span className="text-[9px] md:text-[10px] font-bold text-slate-500 uppercase">Seme border median</span>
                        </div>
                    </div>

                    {/* Route Efficiency Score - Full Width */}
                    <div className="col-span-2 p-4 md:p-6 bg-slate-900 text-white rounded-2xl md:rounded-3xl relative overflow-hidden group cursor-pointer hover:scale-[1.01] transition-transform">
                        <div className="absolute right-0 top-0 p-32 bg-teal-500/10 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-teal-500/20 transition-colors"></div>

                        <div className="relative z-10 flex justify-between items-center">
                            <div>
                                <h4 className="text-base md:text-lg font-bold group-hover:text-teal-200 transition-colors">Route Efficiency Score</h4>
                                <p className="text-white/50 text-[10px] md:text-xs">Based on last 30 shipments</p>
                            </div>
                            <div className="text-right">
                                <span className="text-2xl md:text-3xl font-black text-teal-400 group-hover:text-teal-300 transition-colors">88.5</span>
                                <span className="text-[9px] md:text-[10px] block font-bold text-white/40 uppercase tracking-widest">Optimal</span>
                            </div>
                        </div>
                        <div className="absolute bottom-0 left-0 h-1 bg-white/10 w-full">
                            <div className="h-full bg-teal-500 w-[88.5%] shadow-[0_0_10px_#2dd4bf]"></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TradeIntelligence;
