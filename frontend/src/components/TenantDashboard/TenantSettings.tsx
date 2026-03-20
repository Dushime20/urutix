import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    Save, User, Mail, Phone, MapPin, Globe, CreditCard,
    Shield, Bell, Building
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tenantApi, type TenantInfo } from '../../services/tenantApi';
import { toast } from 'react-hot-toast';
import { TranslatedText } from '../translated-text';
import { useTranslation } from '../../hooks/useTranslation';

interface TenantSettingsProps {
    tenantId: string;
}

const TenantSettings: React.FC<TenantSettingsProps> = ({ tenantId }) => {
    const { tSync } = useTranslation();
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
            toast.success(tSync('Settings updated successfully'));
            queryClient.invalidateQueries({ queryKey: ['tenantInfo', tenantId] });
            // Also refresh the header data
            queryClient.invalidateQueries({ queryKey: ['tenant', tenantId] });
        },
        onError: (error: any) => {
            toast.error(tSync('Failed to update settings'));
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
            <div className="bg-white dark:bg-slate-900 rounded-[24px] border border-gray-100 dark:border-slate-800 shadow-sm p-8">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight"><TranslatedText text="Tenant Settings" /></h2>
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1"><TranslatedText text="Manage your organization profile and preferences" /></p>
                    </div>
                    <button
                        onClick={handleSubmit}
                        disabled={updateMutation.isPending}
                        className="flex items-center px-6 py-3 bg-indigo-600 dark:bg-indigo-500 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-all shadow-lg shadow-indigo-100 dark:shadow-none disabled:opacity-70"
                    >
                        {updateMutation.isPending ? (
                            <span className="animate-pulse"><TranslatedText text="Saving..." /></span>
                        ) : (
                            <>
                                <Save className="w-4 h-4 mr-2" />
                                <TranslatedText text="Save Changes" />
                            </>
                        )}
                    </button>
                </div>

                 {/* Tabs */}
                <div className="flex space-x-6 mt-8 border-b border-gray-100 dark:border-slate-800">
                    <button
                        onClick={() => setActiveTab('profile')}
                        className={`pb-4 text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'profile'
                            ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400'
                            : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
                            }`}
                    >
                        <TranslatedText text="Organization Profile" />
                    </button>
                    <button
                        onClick={() => setActiveTab('preferences')}
                        className={`pb-4 text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'preferences'
                            ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400'
                            : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
                            }`}
                    >
                        <TranslatedText text="Preferences" />
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                 {/* Info Card - Always visible */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white dark:bg-slate-900 rounded-[24px] border border-gray-100 dark:border-slate-800 shadow-sm p-6">
                        <div className="flex flex-col items-center py-6">
                            <div className="w-24 h-24 bg-gradient-to-tr from-indigo-600 to-violet-500 rounded-3xl flex items-center justify-center shadow-lg shadow-indigo-100 dark:shadow-none mb-4">
                                <span className="text-white font-black text-4xl tracking-tighter">
                                    {formData.name?.charAt(0).toUpperCase() || 'T'}
                                </span>
                            </div>
                            <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight text-center">{formData.name}</h3>
                            <div className="inline-flex items-center px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 font-bold text-[10px] uppercase tracking-wider mt-2">
                                <TranslatedText text={tenant?.status || 'Active'} />
                            </div>
                        </div>

                        <div className="border-t border-gray-50 dark:border-slate-800 pt-6 space-y-4">
                            <div>
                                <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1"><TranslatedText text="Tenant ID" /></p>
                                <p className="text-xs font-bold text-slate-700 dark:text-slate-300 font-mono">{tenant?.id}</p>
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1"><TranslatedText text="Plan" /></p>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400 uppercase">{tenant?.subscription?.plan || 'Standard'}</span>
                                    <span className="text-xs font-medium text-slate-400 dark:text-slate-500">
                                        <TranslatedText text="Expires" />: {tenant?.subscription?.expiresAt ? new Date(tenant.subscription.expiresAt).toLocaleDateString() : tSync('Never')}
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
                        className="bg-white dark:bg-slate-900 rounded-[24px] border border-gray-100 dark:border-slate-800 shadow-sm p-8"
                    >
                        {activeTab === 'profile' && (
                            <div className="space-y-6">
                                <div className="grid grid-cols-1 gap-6">
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2"><TranslatedText text="Organization Name" /></label>
                                        <div className="relative">
                                            <Building className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 dark:text-slate-600" />
                                            <input
                                                type="text"
                                                value={formData.name || ''}
                                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-sm font-bold text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500/20"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2"><TranslatedText text="Contact Email" /></label>
                                        <div className="relative">
                                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 dark:text-slate-600" />
                                            <input
                                                type="email"
                                                value={formData.contactInfo?.email || ''}
                                                onChange={(e) => setFormData({
                                                    ...formData,
                                                    contactInfo: { ...formData.contactInfo!, email: e.target.value }
                                                })}
                                                className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-sm font-bold text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500/20"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2"><TranslatedText text="Phone Number" /></label>
                                        <div className="relative">
                                            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 dark:text-slate-600" />
                                            <input
                                                type="tel"
                                                value={formData.contactInfo?.phone || ''}
                                                onChange={(e) => setFormData({
                                                    ...formData,
                                                    contactInfo: { ...formData.contactInfo!, phone: e.target.value }
                                                })}
                                                className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-sm font-bold text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500/20"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2"><TranslatedText text="Address" /></label>
                                    <div className="relative">
                                        <MapPin className="absolute left-4 top-3.5 w-4 h-4 text-slate-300 dark:text-slate-600" />
                                        <textarea
                                            rows={3}
                                            value={formData.contactInfo?.address || ''}
                                            onChange={(e) => setFormData({
                                                ...formData,
                                                contactInfo: { ...formData.contactInfo!, address: e.target.value }
                                            })}
                                            className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-sm font-bold text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500/20 resize-none"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                         {activeTab === 'preferences' && (
                            <div className="space-y-8">
                                <div>
                                    <h4 className="text-sm font-black text-slate-900 dark:text-white tracking-tight mb-4"><TranslatedText text="Localization" /></h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2"><TranslatedText text="Currency" /></label>
                                            <div className="relative">
                                                <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 dark:text-slate-600" />
                                                <select className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-sm font-bold text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500/20 appearance-none">
                                                    <option>USD ($)</option>
                                                    <option>KES (KSh)</option>
                                                    <option>EUR (€)</option>
                                                    <option>RWF (RWF)</option>
                                                </select>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2"><TranslatedText text="Timezone" /></label>
                                            <div className="relative">
                                                <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 dark:text-slate-600" />
                                                <select className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-sm font-bold text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500/20 appearance-none">
                                                    <option>Africa/Nairobi (GMT+3)</option>
                                                    <option>Africa/Kigali (GMT+2)</option>
                                                    <option>UTC (GMT+0)</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <h4 className="text-sm font-black text-slate-900 dark:text-white tracking-tight mb-4"><TranslatedText text="Notifications" /></h4>
                                    <div className="space-y-4">
                                        {[
                                            { label: 'Trip Status Updates', desc: 'Get notified when trips start, complete, or delay' },
                                            { label: 'Financial Alerts', desc: 'Low credit balance and invoice notifications' },
                                            { label: 'Security Alerts', desc: 'New device logins and permission changes' }
                                        ].map((item, i) => (
                                            <div key={i} className="flex items-center justify-between p-4 border border-gray-50 dark:border-slate-800 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors">
                                                <div>
                                                    <div className="text-sm font-bold text-slate-700 dark:text-slate-200"><TranslatedText text={item.label} /></div>
                                                    <div className="text-xs font-medium text-slate-400 dark:text-slate-500"><TranslatedText text={item.desc} /></div>
                                                </div>
                                                <div className="relative inline-flex items-center cursor-pointer">
                                                    <input type="checkbox" className="sr-only peer" defaultChecked />
                                                    <div className="w-11 h-6 bg-gray-200 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 dark:after:border-slate-600 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600 dark:peer-checked:bg-indigo-500"></div>
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
