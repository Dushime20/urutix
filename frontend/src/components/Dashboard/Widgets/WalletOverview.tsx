import { Wallet, Clock, ArrowUpRight, Download, History } from 'lucide-react';

const WalletOverview = () => {
    return (
        <div className="bg-white p-5 md:p-8 rounded-2xl md:rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
            <div>
                <div className="flex items-center justify-between mb-6 md:mb-8">
                    <h3 className="font-extrabold text-[#0f172a] text-base md:text-lg">Wallet Overview</h3>
                    <button className="text-slate-400 hover:text-teal-600 transition-colors bg-slate-50 p-2 rounded-lg">
                        <History size={16} />
                    </button>
                </div>

                <div className="space-y-4 md:space-y-6">
                    {/* Cleared Funds */}
                    <div className="flex items-center justify-between p-4 md:p-5 rounded-2xl md:rounded-3xl bg-slate-50 border border-transparent hover:border-teal-200 transition-all cursor-pointer group relative overflow-hidden">
                        <div className="absolute right-0 bottom-0 opacity-10 translate-y-1/2 translate-x-1/4">
                            <Wallet size={80} />
                        </div>
                        <div className="flex items-center gap-3 md:gap-4 relative z-10">
                            <div className="size-10 md:size-12 rounded-xl md:rounded-2xl bg-teal-100 text-teal-700 flex items-center justify-center group-hover:bg-teal-600 group-hover:text-white transition-colors shadow-sm duration-300">
                                <Wallet size={20} className="md:w-6 md:h-6" />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-[#0f172a]">Cleared Funds</p>
                                <p className="text-[9px] md:text-[10px] text-slate-400 font-medium">Ready for payout</p>
                            </div>
                        </div>
                        <div className="text-right relative z-10">
                            <p className="text-sm md:text-base font-extrabold text-[#0f172a]">$8,151</p>
                            <p className="text-[9px] text-teal-600 font-bold flex items-center justify-end gap-0.5">
                                +$2.4k <ArrowUpRight size={10} />
                            </p>
                        </div>
                    </div>

                    {/* Escrowed */}
                    <div className="flex items-center justify-between p-4 md:p-5 rounded-2xl md:rounded-3xl bg-slate-50 border border-transparent hover:border-amber-200 transition-all cursor-pointer group relative overflow-hidden">
                        <div className="absolute right-0 bottom-0 opacity-10 translate-y-1/2 translate-x-1/4">
                            <Clock size={80} />
                        </div>
                        <div className="flex items-center gap-3 md:gap-4 relative z-10">
                            <div className="size-10 md:size-12 rounded-xl md:rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center group-hover:bg-amber-600 group-hover:text-white transition-colors shadow-sm duration-300">
                                <Clock size={20} className="md:w-6 md:h-6" />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-[#0f172a]">Escrowed</p>
                                <p className="text-[9px] md:text-[10px] text-slate-400 font-medium">In-transit holds</p>
                            </div>
                        </div>
                        <div className="text-right relative z-10">
                            <p className="text-sm md:text-base font-extrabold text-[#0f172a]">$4,389</p>
                            <p className="text-[9px] text-amber-600 font-bold">2 txns pending</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-8">
                <button className="py-3 md:py-4 text-[#0f172a] text-[10px] md:text-[11px] font-bold border border-slate-200 rounded-xl md:rounded-2xl hover:bg-teal-50 hover:border-teal-200 hover:text-teal-700 transition-all uppercase tracking-widest flex items-center justify-center gap-2">
                    <Download size={14} /> Statement
                </button>
                <button className="py-3 md:py-4 bg-[#0f172a] text-white text-[10px] md:text-[11px] font-bold rounded-xl md:rounded-2xl hover:bg-slate-800 transition-all uppercase tracking-widest shadow-lg shadow-slate-900/20 flex items-center justify-center gap-2">
                    Withdraw <ArrowUpRight size={14} />
                </button>
            </div>
        </div>
    );
};

export default WalletOverview;
