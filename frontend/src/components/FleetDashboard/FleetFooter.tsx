import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FaTruck } from 'react-icons/fa';
import { Zap } from 'lucide-react';

export const FleetFooter: React.FC = () => {
    const navigate = useNavigate();

    return (
        <footer className="bg-[#0a101f] text-white pt-16 md:pt-20 pb-8 md:pb-10 border-t border-white/5 mt-auto">
            <div className="max-w-[1536px] mx-auto px-4 md:px-8 lg:px-12 xl:px-20">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 md:gap-12 mb-12 md:mb-16">
                    {/* Brand Section */}
                    <div className="lg:col-span-4">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="size-10 bg-gradient-to-br from-blue-500 to-indigo-700 flex items-center justify-center rounded-xl shadow-lg shadow-blue-500/20">
                                <FaTruck className="size-5 text-white" />
                            </div>
                            <h2 className="text-2xl font-black tracking-tighter text-white">UrutiX<span className="text-blue-400">.</span></h2>
                        </div>
                        <p className="text-slate-400 text-sm leading-relaxed mb-8 max-w-sm">
                            UrutiX Fleet Command is Africa's premier fleet management and logistics platform, empowering fleet owners to optimize operations and maximize profitability.
                        </p>
                        <div className="flex gap-4">
                            <a className="size-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-blue-500 transition-all" href="#">𝕏</a>
                            <a className="size-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-blue-500 transition-all" href="#">in</a>
                            <a className="size-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-blue-500 transition-all" href="#">📸</a>
                        </div>
                    </div>

                    {/* Platform Links */}
                    <div className="lg:col-span-2">
                        <h4 className="text-sm font-black uppercase tracking-widest text-white mb-4 md:mb-6">Fleet</h4>
                        <ul className="space-y-3 md:space-y-4">
                            <li><a className="text-slate-400 text-sm hover:text-blue-400 transition-colors" href="/dashboard/fleet/trucks">Manage Fleet</a></li>
                            <li><a className="text-slate-400 text-sm hover:text-blue-400 transition-colors" href="/dashboard/fleet/drivers">Drivers</a></li>
                            <li><a className="text-slate-400 text-sm hover:text-blue-400 transition-colors" href="/dashboard/fleet/dispatch">Dispatch</a></li>
                            <li><a className="text-slate-400 text-sm hover:text-blue-400 transition-colors" href="/dashboard/fleet/maintenance">Maintenance</a></li>
                        </ul>
                    </div>

                    {/* Support Links */}
                    <div className="lg:col-span-3">
                        <h4 className="text-sm font-black uppercase tracking-widest text-white mb-4 md:mb-6">Support</h4>
                        <ul className="space-y-3 md:space-y-4">
                            <li><a className="text-slate-400 text-sm hover:text-blue-400 transition-colors" href="#">Help Center</a></li>
                            <li><a className="text-slate-400 text-sm hover:text-blue-400 transition-colors flex items-center gap-2" href="#">Live Chat <span className="size-1.5 bg-green-500 rounded-full"></span></a></li>
                            <li><a className="text-slate-400 text-sm hover:text-blue-400 transition-colors" href="#">Route Status</a></li>
                            <li><a className="text-slate-400 text-sm hover:text-blue-400 transition-colors" href="#">API Documentation</a></li>
                        </ul>
                    </div>

                    {/* Legal Links */}
                    <div className="lg:col-span-3">
                        <h4 className="text-sm font-black uppercase tracking-widest text-white mb-4 md:mb-6">Legal</h4>
                        <ul className="space-y-3 md:space-y-4">
                            <li><a className="text-slate-400 text-sm hover:text-blue-400 transition-colors" href="#">Privacy Policy</a></li>
                            <li><a className="text-slate-400 text-sm hover:text-blue-400 transition-colors" href="#">Terms of Service</a></li>
                            <li><a className="text-slate-400 text-sm hover:text-blue-400 transition-colors" href="#">Compliance</a></li>
                            <li><a className="text-slate-400 text-sm hover:text-blue-400 transition-colors" href="#">Driver Safety Policy</a></li>
                        </ul>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="pt-6 md:pt-8 border-t border-white/5 flex flex-col lg:flex-row items-center justify-between gap-6 md:gap-8">
                    <div className="flex flex-col md:flex-row items-center gap-4 md:gap-8">
                        <p className="text-slate-500 text-xs font-bold uppercase tracking-widest text-center md:text-left">
                            © 2026 UrutiX Technologies Inc. All Rights Reserved.
                        </p>
                        <div className="flex items-center gap-4 md:gap-6">
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-lg border border-white/10 cursor-pointer hover:border-blue-500 transition-all">
                                <span className="text-[10px] font-bold uppercase tracking-wider">English</span>
                            </div>
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-lg border border-white/10 cursor-pointer hover:border-blue-500 transition-all">
                                <span className="text-[10px] font-bold uppercase tracking-wider">KES (Ksh)</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        {/* System Status Badge */}
                        <div className="flex items-center gap-3 px-4 py-2 bg-white/5 rounded-xl border border-white/5">
                            <span className="relative flex h-2.5 w-2.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                            </span>
                            <div className="text-left">
                                <p className="text-[9px] font-black uppercase text-white tracking-widest">Systems Online</p>
                                <span className="text-xs font-semibold text-slate-400">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</span>
                            </div>
                        </div>
                        {/* Dispatch Quick Action */}
                        <button
                            onClick={() => navigate('/dashboard/fleet/dispatch')}
                            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold rounded-xl shadow-lg shadow-blue-600/20 transition-all"
                        >
                            <Zap size={16} /> Quick Dispatch
                        </button>
                    </div>
                </div>
            </div>
        </footer>
    );
};
