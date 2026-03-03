import React from 'react';
import QuickActions from '../Widgets/QuickActions';

interface DashboardFooterProps {
    onCreateClick?: () => void;
}

const DashboardFooter: React.FC<DashboardFooterProps> = ({ onCreateClick }) => {
    return (
        <footer className="bg-[#0a101f] text-white pt-16 md:pt-20 pb-8 md:pb-10 border-t border-white/5">
            <div className="max-w-[1536px] mx-auto px-4 md:px-8 lg:px-12 xl:px-20">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 md:gap-12 mb-12 md:mb-16">
                    <div className="lg:col-span-4">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="size-10 bg-gradient-to-br from-teal-500 to-teal-700 flex items-center justify-center rounded-xl shadow-lg shadow-teal-500/20">
                                <svg className="size-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                                </svg>
                            </div>
                            <h2 className="text-2xl font-black tracking-tighter text-white">UrutiX<span className="text-teal-400">.</span></h2>
                        </div>
                        <p className="text-slate-400 text-sm leading-relaxed mb-8 max-w-sm">
                            UrutiX is Africa's premier smart cargo matching and trade financing platform, dedicated to digitizing trade corridors and empowering businesses.
                        </p>
                        <div className="flex gap-4">
                            <a className="size-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-teal-500 transition-all" href="#">𝕏</a>
                            <a className="size-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-teal-500 transition-all" href="#">in</a>
                            <a className="size-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-teal-500 transition-all" href="#">📸</a>
                        </div>
                    </div>

                    <div className="lg:col-span-2">
                        <h4 className="text-sm font-black uppercase tracking-widest text-white mb-4 md:mb-6">Platform</h4>
                        <ul className="space-y-3 md:space-y-4">
                            <li><a className="text-slate-400 text-sm hover:text-teal-400 transition-colors" href="#">Post Cargo</a></li>
                            <li><a className="text-slate-400 text-sm hover:text-teal-400 transition-colors" href="#">Live Track</a></li>
                            <li><a className="text-slate-400 text-sm hover:text-teal-400 transition-colors" href="#">Financing</a></li>
                            <li><a className="text-slate-400 text-sm hover:text-teal-400 transition-colors" href="#">Wallet</a></li>
                        </ul>
                    </div>

                    <div className="lg:col-span-3">
                        <h4 className="text-sm font-black uppercase tracking-widest text-white mb-4 md:mb-6">Support</h4>
                        <ul className="space-y-3 md:space-y-4">
                            <li><a className="text-slate-400 text-sm hover:text-teal-400 transition-colors" href="#">Help Center</a></li>
                            <li><a className="text-slate-400 text-sm hover:text-teal-400 transition-colors flex items-center gap-2" href="#">Live Chat <span className="size-1.5 bg-green-500 rounded-full"></span></a></li>
                            <li><a className="text-slate-400 text-sm hover:text-teal-400 transition-colors" href="#">Corridor Status</a></li>
                            <li><a className="text-slate-400 text-sm hover:text-teal-400 transition-colors" href="#">API Documentation</a></li>
                        </ul>
                    </div>

                    <div className="lg:col-span-3">
                        <h4 className="text-sm font-black uppercase tracking-widest text-white mb-4 md:mb-6">Legal</h4>
                        <ul className="space-y-3 md:space-y-4">
                            <li><a className="text-slate-400 text-sm hover:text-teal-400 transition-colors" href="#">Privacy Policy</a></li>
                            <li><a className="text-slate-400 text-sm hover:text-teal-400 transition-colors" href="#">Terms of Service</a></li>
                            <li><a className="text-slate-400 text-sm hover:text-teal-400 transition-colors" href="#">Compliance</a></li>
                            <li><a className="text-slate-400 text-sm hover:text-teal-400 transition-colors" href="#">KYC/AML Policy</a></li>
                        </ul>
                    </div>
                </div>

                <div className="pt-6 md:pt-8 border-t border-white/5 flex flex-col lg:flex-row items-center justify-between gap-6 md:gap-8">
                    <div className="flex flex-col md:flex-row items-center gap-4 md:gap-8">
                        <p className="text-slate-500 text-xs font-bold uppercase tracking-widest text-center md:text-left">
                            © 2023 UrutiX Technologies Inc. All Rights Reserved.
                        </p>
                        <div className="flex items-center gap-4 md:gap-6">
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-lg border border-white/10 cursor-pointer hover:border-teal-500 transition-all">
                                <span className="text-[10px] font-bold uppercase tracking-wider">English</span>
                            </div>
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-lg border border-white/10 cursor-pointer hover:border-teal-500 transition-all">
                                <span className="text-[10px] font-bold uppercase tracking-wider">USD ($)</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-3 px-4 py-2 bg-white/5 rounded-xl border border-white/5">
                            <span className="text-teal-400 text-xl">🛡️</span>
                            <div className="text-left">
                                <p className="text-[9px] font-black uppercase text-white tracking-widest">ISO 27001</p>
                                <span className="text-xs font-semibold text-slate-400">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</span>
                            </div>
                        </div>
                        <QuickActions onCreateClick={onCreateClick} />
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default DashboardFooter;
