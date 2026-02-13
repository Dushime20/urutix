import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { FaBuilding, FaPlus, FaArrowRight, FaSpinner, FaCrown, FaStar, FaGem } from 'react-icons/fa';
import { fetchTenants } from '../../../services/adminApi';

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
        active: tenantsArray.filter((t: any) => t.status === 'active').length || 0,
        free: tenantsArray.filter((t: any) => t.subscriptionPlan === 'FREE').length || 0,
        pro: tenantsArray.filter((t: any) => t.subscriptionPlan === 'PRO').length || 0,
        enterprise: tenantsArray.filter((t: any) => t.subscriptionPlan === 'ENTERPRISE').length || 0,
    };

    const getPlanIcon = (plan: string) => {
        switch (plan) {
            case 'FREE': return <FaStar className="text-slate-500" size={12} />;
            case 'PRO': return <FaCrown className="text-amber-500" size={12} />;
            case 'ENTERPRISE': return <FaGem className="text-purple-500" size={12} />;
            default: return null;
        }
    };

    const recentTenants = tenantsArray.slice(0, 3) || [];

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center">
                        <FaBuilding className="text-indigo-600" size={20} />
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-800">Tenant Management</h3>
                        <p className="text-xs text-slate-500">Organizations overview</p>
                    </div>
                </div>
                <button
                    onClick={() => navigate('/admin/tenants')}
                    className="text-sm font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                >
                    View All <FaArrowRight size={12} />
                </button>
            </div>

            {isLoading ? (
                <div className="flex items-center justify-center h-32">
                    <FaSpinner className="animate-spin text-indigo-600" size={24} />
                </div>
            ) : (
                <>
                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className="col-span-2 text-center p-3 bg-slate-50 rounded-lg">
                            <div className="text-2xl font-black text-slate-800">{stats.total}</div>
                            <div className="text-xs text-slate-500 font-medium mt-1">Total Tenants</div>
                        </div>
                        <div className="text-center p-3 bg-emerald-50 rounded-lg">
                            <div className="text-xl font-black text-emerald-600">{stats.active}</div>
                            <div className="text-xs text-emerald-600 font-medium mt-1">Active</div>
                        </div>
                        <div className="text-center p-3 bg-slate-50 rounded-lg">
                            <div className="text-xl font-black text-slate-600">{stats.free}</div>
                            <div className="text-xs text-slate-600 font-medium mt-1">Free Plan</div>
                        </div>
                    </div>

                    {/* Subscription Distribution */}
                    <div className="mb-6">
                        <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-3">
                            Subscription Plans
                        </h4>
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <FaStar className="text-slate-500" size={12} />
                                    <span className="text-sm font-medium text-slate-700">Free</span>
                                </div>
                                <span className="text-sm font-bold text-slate-800">{stats.free}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <FaCrown className="text-amber-500" size={12} />
                                    <span className="text-sm font-medium text-slate-700">Pro</span>
                                </div>
                                <span className="text-sm font-bold text-slate-800">{stats.pro}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <FaGem className="text-purple-500" size={12} />
                                    <span className="text-sm font-medium text-slate-700">Enterprise</span>
                                </div>
                                <span className="text-sm font-bold text-slate-800">{stats.enterprise}</span>
                            </div>
                        </div>
                    </div>

                    {/* Recent Tenants */}
                    <div>
                        <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-3">
                            Recent Tenants
                        </h4>
                        <div className="space-y-2">
                            {recentTenants.map((tenant: any, idx: number) => (
                                <div
                                    key={idx}
                                    className="flex items-center justify-between p-2 hover:bg-slate-50 rounded-lg transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center text-white text-xs font-bold">
                                            {tenant.name?.[0]}
                                        </div>
                                        <div>
                                            <div className="text-sm font-semibold text-slate-800">
                                                {tenant.name}
                                            </div>
                                            <div className="text-xs text-slate-500">{tenant.subdomain}</div>
                                        </div>
                                    </div>
                                    {getPlanIcon(tenant.subscriptionPlan)}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Quick Action */}
                    <button
                        onClick={() => navigate('/admin/tenants')}
                        className="w-full mt-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-colors"
                    >
                        <FaPlus size={14} /> Create New Tenant
                    </button>
                </>
            )}
        </div>
    );
};

export default TenantManagementWidget;
