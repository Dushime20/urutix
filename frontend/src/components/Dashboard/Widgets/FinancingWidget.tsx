import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { CreditCard, ArrowRight, Zap } from 'lucide-react';

import { useState } from 'react';
import QuickLoanModal from './QuickLoanModal';

const FinancingWidget = () => {
    const [isLoanModalOpen, setIsLoanModalOpen] = useState(false);

    const chartData = [
        { name: 'Used', value: 25 },
        { name: 'Available', value: 75 }
    ];

    const CHART_COLORS = ['#2DD4BF', '#374151'];

    return (
        <div className="bg-gradient-to-br from-[#0f172a] to-[#1e293b] text-white p-5 md:p-8 rounded-2xl md:rounded-3xl shadow-2xl relative overflow-hidden group">
            <div className="absolute -right-8 -top-8 size-40 bg-teal-500/10 rounded-full blur-3xl group-hover:bg-teal-500/20 transition-colors duration-500"></div>

            <div className="relative z-10">
                <div className="flex justify-between items-start mb-8 md:mb-10">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <p className="text-white/40 text-[10px] md:text-[11px] font-bold uppercase tracking-widest">Total Limit</p>
                            <span className="bg-teal-500/20 text-teal-300 text-[9px] font-bold px-1.5 rounded flex items-center gap-1">
                                <Zap size={8} fill="currentColor" /> Pre-approved
                            </span>
                        </div>
                        <h2 className="text-3xl md:text-4xl font-black tracking-tighter text-white">$50,000</h2>

                        <div className="mt-2 flex items-center gap-2 opacity-80">
                            <CreditCard size={12} className="text-teal-400" />
                            <span className="text-[10px] font-bold tracking-wider">•••• 4582</span>
                            <span className="text-[10px] text-green-400 font-bold ml-2">Score: 785 (Excellent)</span>
                        </div>
                    </div>

                    {/* Donut Chart with animation */}
                    <div className="relative size-16 md:size-20">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={chartData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius="60%"
                                    outerRadius="90%"
                                    fill="#8884d8"
                                    paddingAngle={5}
                                    dataKey="value"
                                    startAngle={90}
                                    endAngle={-270}
                                    stroke="none"
                                >
                                    {chartData.map((_, index) => (
                                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                                    ))}
                                </Pie>
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute inset-0 flex items-center justify-center text-[10px] md:text-xs font-black animate-in fade-in zoom-in duration-1000">25%</div>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3 md:gap-4 mb-6 md:mb-8">
                    <div className="bg-white/5 p-3 md:p-4 rounded-xl md:rounded-2xl border border-white/5 hover:bg-white/10 transition-colors">
                        <p className="text-[9px] md:text-[10px] font-bold text-white/40 uppercase mb-1">Available</p>
                        <p className="text-base md:text-lg font-bold text-teal-300">$37,500</p>
                    </div>
                    <div className="bg-white/5 p-3 md:p-4 rounded-xl md:rounded-2xl border border-white/5 hover:bg-white/10 transition-colors">
                        <div className="flex justify-between items-center mb-1">
                            <p className="text-[9px] md:text-[10px] font-bold text-white/40 uppercase">Utilized</p>
                            <span className="size-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                        </div>
                        <p className="text-base md:text-lg font-bold">$12,500</p>
                    </div>
                </div>

                <button
                    onClick={() => setIsLoanModalOpen(true)}
                    className="w-full py-3 md:py-4 bg-white text-[#0f172a] font-extrabold rounded-xl md:rounded-2xl hover:bg-teal-50 hover:text-teal-900 transition-all shadow-xl hover:shadow-2xl hover:shadow-white/10 text-sm md:text-base flex items-center justify-center gap-2 group"
                >
                    Request Cash Advance
                    <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </button>
            </div>

            <QuickLoanModal isOpen={isLoanModalOpen} onClose={() => setIsLoanModalOpen(false)} />
        </div>
    );
};

export default FinancingWidget;
