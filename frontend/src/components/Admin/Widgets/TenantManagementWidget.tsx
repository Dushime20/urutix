import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Building2, Plus, ArrowRight, Loader2, Star, Trophy, Crown } from 'lucide-react';
import { fetchTenants } from '../../../services/adminApi';
import { DataCard } from '../../EnliteUI';
import { TranslatedText } from '../../translated-text';

const TenantManagementWidget: React.FC = () => {
    const navigate = useNavigate();

    const { data: tenantsData, isLoading } = useQuery({
        queryKey: ['admin-tenants-widget'],
        queryFn: () => fetchTenants(),
        refetchInterval: 30000,
    });

    const tenantsArray = tenantsData?.data || tenantsData?.tenants || [];

    const stats = {
        total: tenantsArray.length || 0,
        active: tenantsArray.filter((t: any) => t.status === 'active' || t.status === 'ACTIVE').length || 0,
        free: tenantsArray.filter((t: any) => t.subscriptionPlan === 'FREE' || t.subscriptionPlan === 'STARTER').length || 0,
        pro: tenantsArray.filter((t: any) => t.subscriptionPlan === 'PRO' || t.subscriptionPlan === 'PROFESSIONAL').length || 0,
        enterprise: tenantsArray.filter((t: any) => t.subscriptionPlan === 'ENTERPRISE').length || 0,
    };

    const getPlanIcon = (plan: string) => {
        const p = plan?.toUpperCase();
        switch (p) {
            case 'FREE':
            case 'STARTER': return <Star className="text-slate-400" size={14} />;
            case 'PRO':
            case 'PROFESSIONAL': return <Trophy className="text-amber-500" size={14} />;
            case 'ENTERPRISE': return <Crown className="text-purple-500" size={14} />;
            default: return <Star className="text-slate-400" size={14} />;
        }
    };

    const recentTenants = tenantsArray.slice(0, 3) || [];

    return (
        <DataCard
            title={<TranslatedText text="Tenant Management" />}
            subtitle={<TranslatedText text="Organizations & Infrastructure" />}
            headerColor="secondary"
            icon={<Building2 size={20} />}
            actions={
                <button
                    onClick={() => navigate('/admin/tenants')}
                    className="text-[10px] font-black text-white hover:text-primary-200 flex items-center gap-1 uppercase tracking-widest transition-all"
                >
                    <TranslatedText text="View All" /> <ArrowRight size={10} />
                </button>
            }
        >
            {isLoading ? (
                <div className="flex items-center justify-center h-48">
                    <Loader2 className="animate-spin text-primary-600" size={24} />
                </div>
            ) : (
                <div className="space-y-6">
                    {/* Stats Grid */}
                    <div className="grid grid-cols-3 gap-4">
                        {[
                            { label: 'Total', value: stats.total, color: 'text-slate-800', bg: 'bg-slate-50' },
                            { label: 'Live', value: stats.active, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                            { label: 'Pro', value: stats.pro + stats.enterprise, color: 'text-amber-600', bg: 'bg-amber-50' }
                        ].map((stat, i) => (
                            <div key={i} className={`text-center p-3 ${stat.bg} rounded-2xl border border-transparent hover:border-slate-200 dark:border-slate-700 transition-all`}>
                                <div className={`text-2xl font-black ${stat.color} leading-none mb-1`}>{stat.value}</div>
                                <div className="text-[9px] text-slate-500 font-black uppercase tracking-widest">{stat.label}</div>
                            </div>
                        ))}
                    </div>

                    {/* Recent Tenants */}
                    <div>
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">
                            Recent Org Allocations
                        </h4>
                        <div className="space-y-3">
                            {recentTenants.map((tenant: any, idx: number) => (
                                <div
                                    key={idx}
                                    className="flex items-center justify-between p-3 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-2xl transition-all border border-transparent hover:border-slate-100 dark:border-slate-800 group"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl flex items-center justify-center text-white text-[10px] font-black group-hover:scale-105 transition-transform">
                                            {tenant.name?.[0]}
                                        </div>
                                        <div>
                                            <div className="text-xs font-black text-slate-800 dark:text-slate-100 uppercase tracking-tight">
                                                {tenant.name}
                                            </div>
                                            <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{tenant.subdomain}</div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {getPlanIcon(tenant.subscriptionPlan)}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Quick Action */}
                    <button
                        onClick={() => navigate('/admin/tenants')}
                        className="w-full mt-4 py-3 bg-primary-600 hover:bg-primary-500 text-white rounded-xl font-black text-[10px] uppercase tracking-[0.2em] flex items-center justify-center gap-2 transition-all shadow-lg shadow-primary-100 group"
                    >
                        <Plus size={14} className="group-hover:scale-110 transition-transform" /> 
                        <TranslatedText text="Provision New Org" />
                    </button>
                </div>
            )}
        </DataCard>
    );
};

export default TenantManagementWidget;
