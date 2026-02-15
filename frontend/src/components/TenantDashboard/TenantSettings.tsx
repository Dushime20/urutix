import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    Save, User, Mail, Phone, MapPin, Globe, CreditCard,
    Shield, Bell, Building
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tenantApi, type TenantInfo } from '../../services/tenantApi';
import { toast } from 'react-hot-toast';

interface TenantSettingsProps {
    tenantId: string;
}

const TenantSettings: React.FC<TenantSettingsProps> = ({ tenantId }) => {
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState<'profile' | 'preferences'>('profile');

    const { data: tenant, isLoading } = useQuery({
        queryKey: ['tenantInfo', tenantId],
        queryFn: () => tenantApi.getTenantInfo(tenantId),
    });

    const [formData, setFormData] = useState<Partial<TenantInfo>>({});

    useEffect(() => {
        if (tenant) {
            setFormData({
                name: tenant.name,
                contactInfo: { ...tenant.contactInfo }
            });
        }
    }, [tenant]);

    const updateMutation = useMutation({
        mutationFn: (data: Partial<TenantInfo>) => tenantApi.updateTenantSettings(tenantId, data),
        onSuccess: () => {
            toast.success('Settings updated successfully');
            queryClient.invalidateQueries({ queryKey: ['tenantInfo', tenantId] });
            // Also refresh the header data
            queryClient.invalidateQueries({ queryKey: ['tenant', tenantId] });
        },
        onError: (error: any) => {
            toast.error('Failed to update settings');
        }
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        updateMutation.mutate(formData);
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-white rounded-[24px] border border-gray-100 shadow-sm p-8">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-black text-slate-900 tracking-tight">Tenant Settings</h2>
                        <p className="text-sm font-medium text-slate-500 mt-1">Manage your organization profile and preferences</p>
                    </div>
                    <button
                        onClick={handleSubmit}
                        disabled={updateMutation.isPending}
                        className="flex items-center px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 disabled:opacity-70"
                    >
                        {updateMutation.isPending ? (
                            <span className="animate-pulse">Saving...</span>
                        ) : (
                            <>
                                <Save className="w-4 h-4 mr-2" />
                                Save Changes
                            </>
                        )}
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex space-x-6 mt-8 border-b border-gray-100">
                    <button
                        onClick={() => setActiveTab('profile')}
                        className={`pb-4 text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'profile'
                            ? 'text-indigo-600 border-b-2 border-indigo-600'
                            : 'text-slate-400 hover:text-slate-600'
                            }`}
                    >
                        Organization Profile
                    </button>
                    <button
                        onClick={() => setActiveTab('preferences')}
                        className={`pb-4 text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'preferences'
                            ? 'text-indigo-600 border-b-2 border-indigo-600'
                            : 'text-slate-400 hover:text-slate-600'
                            }`}
                    >
                        Preferences
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Info Card - Always visible */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white rounded-[24px] border border-gray-100 shadow-sm p-6">
                        <div className="flex flex-col items-center py-6">
                            <div className="w-24 h-24 bg-gradient-to-tr from-indigo-600 to-violet-500 rounded-3xl flex items-center justify-center shadow-lg shadow-indigo-100 mb-4">
                                <span className="text-white font-black text-4xl tracking-tighter">
                                    {formData.name?.charAt(0).toUpperCase() || 'T'}
                                </span>
                            </div>
                            <h3 className="text-lg font-black text-slate-900 tracking-tight text-center">{formData.name}</h3>
                            <div className="inline-flex items-center px-3 py-1 rounded-full bg-emerald-50 text-emerald-600 font-bold text-[10px] uppercase tracking-wider mt-2">
                                {tenant?.status || 'Active'}
                            </div>
                        </div>

                        <div className="border-t border-gray-50 pt-6 space-y-4">
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Tenant ID</p>
                                <p className="text-xs font-bold text-slate-700 font-mono">{tenant?.id}</p>
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Plan</p>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-bold text-indigo-600 uppercase">{tenant?.subscription?.plan || 'Standard'}</span>
                                    <span className="text-xs font-medium text-slate-400">
                                        Expires: {tenant?.subscription?.expiresAt ? new Date(tenant.subscription.expiresAt).toLocaleDateString() : 'Never'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Form Content */}
                <div className="lg:col-span-2">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                        className="bg-white rounded-[24px] border border-gray-100 shadow-sm p-8"
                    >
                        {activeTab === 'profile' && (
                            <div className="space-y-6">
                                <div className="grid grid-cols-1 gap-6">
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Organization Name</label>
                                        <div className="relative">
                                            <Building className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                                            <input
                                                type="text"
                                                value={formData.name || ''}
                                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                className="w-full pl-12 pr-4 py-3 bg-slate-50 border-none rounded-xl text-sm font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500/20"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Contact Email</label>
                                        <div className="relative">
                                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                                            <input
                                                type="email"
                                                value={formData.contactInfo?.email || ''}
                                                onChange={(e) => setFormData({
                                                    ...formData,
                                                    contactInfo: { ...formData.contactInfo!, email: e.target.value }
                                                })}
                                                className="w-full pl-12 pr-4 py-3 bg-slate-50 border-none rounded-xl text-sm font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500/20"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Phone Number</label>
                                        <div className="relative">
                                            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                                            <input
                                                type="tel"
                                                value={formData.contactInfo?.phone || ''}
                                                onChange={(e) => setFormData({
                                                    ...formData,
                                                    contactInfo: { ...formData.contactInfo!, phone: e.target.value }
                                                })}
                                                className="w-full pl-12 pr-4 py-3 bg-slate-50 border-none rounded-xl text-sm font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500/20"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Address</label>
                                    <div className="relative">
                                        <MapPin className="absolute left-4 top-3.5 w-4 h-4 text-slate-300" />
                                        <textarea
                                            rows={3}
                                            value={formData.contactInfo?.address || ''}
                                            onChange={(e) => setFormData({
                                                ...formData,
                                                contactInfo: { ...formData.contactInfo!, address: e.target.value }
                                            })}
                                            className="w-full pl-12 pr-4 py-3 bg-slate-50 border-none rounded-xl text-sm font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500/20 resize-none"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'preferences' && (
                            <div className="space-y-8">
                                <div>
                                    <h4 className="text-sm font-black text-slate-900 tracking-tight mb-4">Localization</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Currency</label>
                                            <div className="relative">
                                                <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                                                <select className="w-full pl-12 pr-4 py-3 bg-slate-50 border-none rounded-xl text-sm font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500/20 appearance-none">
                                                    <option>USD ($)</option>
                                                    <option>KES (KSh)</option>
                                                    <option>EUR (€)</option>
                                                </select>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Timezone</label>
                                            <div className="relative">
                                                <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                                                <select className="w-full pl-12 pr-4 py-3 bg-slate-50 border-none rounded-xl text-sm font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500/20 appearance-none">
                                                    <option>Africa/Nairobi (GMT+3)</option>
                                                    <option>UTC (GMT+0)</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <h4 className="text-sm font-black text-slate-900 tracking-tight mb-4">Notifications</h4>
                                    <div className="space-y-4">
                                        {[
                                            { label: 'Trip Status Updates', desc: 'Get notified when trips start, complete, or delay' },
                                            { label: 'Financial Alerts', desc: 'Low credit balance and invoice notifications' },
                                            { label: 'Security Alerts', desc: 'New device logins and permission changes' }
                                        ].map((item, i) => (
                                            <div key={i} className="flex items-center justify-between p-4 border border-gray-50 rounded-xl hover:bg-gray-50 transition-colors">
                                                <div>
                                                    <div className="text-sm font-bold text-slate-700">{item.label}</div>
                                                    <div className="text-xs font-medium text-slate-400">{item.desc}</div>
                                                </div>
                                                <div className="relative inline-flex items-center cursor-pointer">
                                                    <input type="checkbox" className="sr-only peer" defaultChecked />
                                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </motion.div>
                </div>
            </div>
        </div>
    );
};

export default TenantSettings;
