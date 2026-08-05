import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { FaWallet, FaArrowRight, FaSpinner, FaExclamationTriangle, FaBell } from 'react-icons/fa';
import { fetchEnrichedTenants } from '../../../services/adminApi';
import { TranslatedText } from '../../translated-text';

const LowCreditTenantsWidget: React.FC = () => {
    const navigate = useNavigate();

    const { data: enrichedData, isLoading } = useQuery({
        queryKey: ['admin-low-credit-tenants'],
        queryFn: () => fetchEnrichedTenants({ hasLowBalance: true }),
        refetchInterval: 60000,
    });

    // Handle different response structures
    const tenantsArray = enrichedData?.data || enrichedData?.tenants || [];
    
    // Sort by balance (lowest first) and take top 5
    const lowCreditTenants = [...tenantsArray]
        .filter(t => t.credits?.balance !== undefined)
        .sort((a, b) => (a.credits?.balance || 0) - (b.credits?.balance || 0))
        .slice(0, 5);

    return (
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 p-6 hover:shadow-md transition-all duration-300">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-rose-50 rounded-xl flex items-center justify-center">
                        <FaWallet className="text-rose-600" size={18} />
                    </div>
                    <div>
                        <h3 className="font-black text-slate-800 dark:text-slate-100 uppercase tracking-tight text-sm">
                            <TranslatedText text="Low Credit Alerts" />
                        </h3>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            <TranslatedText text="Tenants requiring top-up" />
                        </p>
                    </div>
                </div>
                <button
                    onClick={() => navigate('/admin/tenants')}
                    className="text-[10px] font-black text-primary-600 hover:text-primary-700 flex items-center gap-1 uppercase tracking-widest"
                >
                    <TranslatedText text="Manage" /> <FaArrowRight size={10} />
                </button>
            </div>

            {isLoading ? (
                <div className="flex items-center justify-center h-48">
                    <FaSpinner className="animate-spin text-primary-600" size={24} />
                </div>
            ) : lowCreditTenants.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
                    <FaBell className="text-slate-300 mb-2" size={24} />
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                        <TranslatedText text="No critical alerts" />
                    </p>
                </div>
            ) : (
                <div className="space-y-3">
                    {lowCreditTenants.map((tenant: any, idx: number) => {
                        const balance = tenant.credits?.balance || 0;
                        const isCritical = balance < 1000;
                        
                        return (
                            <div
                                key={tenant.id || idx}
                                className="flex items-center justify-between p-3 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-2xl transition-all border border-transparent hover:border-slate-100 dark:border-slate-800 group"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-500 text-xs font-black uppercase group-hover:bg-white dark:bg-slate-900 group-hover:shadow-sm transition-all">
                                        {tenant.name?.[0]}
                                    </div>
                                    <div>
                                        <div className="text-xs font-black text-slate-800 dark:text-slate-100 uppercase tracking-tight">
                                            {tenant.name}
                                        </div>
                                        <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                            {tenant.subdomain}.urutix.com
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="text-right">
                                    <div className={`text-xs font-black flex items-center justify-end gap-1 ${isCritical ? 'text-rose-600' : 'text-amber-600'}`}>
                                        {isCritical && <FaExclamationTriangle size={10} />}
                                        {balance.toLocaleString()} 
                                        <span className="text-[9px] font-bold text-slate-400 uppercase ml-0.5">TRX</span>
                                    </div>
                                    <div className="text-[9px] font-black text-slate-300 uppercase tracking-widest mt-0.5">
                                        {isCritical ? <TranslatedText text="Critical" /> : <TranslatedText text="Low Balance" />}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
            
            {lowCreditTenants.length > 0 && (
                <button
                    onClick={() => navigate('/admin/financial')}
                    className="w-full mt-6 py-3 bg-primary-600 hover:bg-primary-500 text-white rounded-xl font-black text-[10px] uppercase tracking-[0.2em] flex items-center justify-center gap-2 transition-all shadow-lg shadow-primary-100"
                >
                    <TranslatedText text="Resolve All Alerts" />
                </button>
            )}
        </div>
    );
};

export default LowCreditTenantsWidget;
