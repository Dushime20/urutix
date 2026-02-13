import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    FaSave, FaSync, FaBell,
    FaGlobe, FaEnvelope, FaSms, FaCode, FaToggleOn
} from 'react-icons/fa';
import axios from 'axios';
import toast from 'react-hot-toast';
import AdminPageLayout from '../../components/Admin/AdminPageLayout';

interface Setting {
    id: string;
    category: string;
    key: string;
    value: any;
    dataType: string;
    description: string;
    isPublic: boolean;
}

const AdvancedSettings: React.FC = () => {
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState<'general' | 'notifications' | 'features' | 'api'>('general');
    const [settings, setSettings] = useState<Record<string, any>>({});
    const [testEmail, setTestEmail] = useState('');
    const [testPhone, setTestPhone] = useState('');

    // Fetch settings by category
    const { data: categorySettings, isLoading } = useQuery({
        queryKey: ['settings', activeTab],
        queryFn: async () => {
            const response = await axios.get(`/api/admin/settings/category/${activeTab}?includePrivate=true`);
            const settingsObj: Record<string, any> = {};
            response.data.forEach((s: Setting) => {
                settingsObj[s.key] = s.value;
            });
            setSettings(settingsObj);
            return response.data;
        },
    });

    // Update settings mutation
    const updateSettingsMutation = useMutation({
        mutationFn: async (data: Record<string, any>) => {
            const response = await axios.put(`/api/admin/settings/category/${activeTab}`, data);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['settings'] });
            toast.success('Settings updated successfully');
        },
        onError: () => {
            toast.error('Failed to update settings');
        },
    });

    // Test email mutation
    const testEmailMutation = useMutation({
        mutationFn: async (email: string) => {
            const response = await axios.post('/api/admin/settings/test/email', { email });
            return response.data;
        },
        onSuccess: (data) => {
            toast.success(data.message);
        },
        onError: () => {
            toast.error('Email test failed');
        },
    });

    // Test SMS mutation
    const testSmsMutation = useMutation({
        mutationFn: async (phone: string) => {
            const response = await axios.post('/api/admin/settings/test/sms', { phone });
            return response.data;
        },
        onSuccess: (data) => {
            toast.success(data.message);
        },
        onError: () => {
            toast.error('SMS test failed');
        },
    });

    const handleSaveSettings = () => {
        updateSettingsMutation.mutate(settings);
    };

    const handleToggle = (key: string) => {
        setSettings({ ...settings, [key]: !settings[key] });
    };

    const handleChange = (key: string, value: any) => {
        setSettings({ ...settings, [key]: value });
    };

    return (
        <AdminPageLayout
            title="System Settings"
            description="Configure platform-wide settings, notifications, and feature flags."
            actions={
                <>
                    <label className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-bold shadow-lg transition-all cursor-pointer">
                        <FaCode size={14} /> Import
                        <input
                            type="file"
                            accept=".json"
                            className="hidden"
                            onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                    const reader = new FileReader();
                                    reader.onload = async (e) => {
                                        try {
                                            const json = JSON.parse(e.target?.result as string);
                                            if (json.settings) {
                                                await axios.post('/api/admin/settings/data/import', json);
                                                toast.success('Settings imported successfully');
                                                queryClient.invalidateQueries({ queryKey: ['settings'] });
                                            } else {
                                                toast.error('Invalid settings file');
                                            }
                                        } catch (err) {
                                            toast.error('Failed to parse settings file');
                                        }
                                    };
                                    reader.readAsText(file);
                                }
                            }}
                        />
                    </label>
                    <button
                        onClick={async () => {
                            try {
                                const response = await axios.get('/api/admin/settings/data/export');
                                const data = JSON.stringify(response.data, null, 2);
                                const blob = new Blob([data], { type: 'application/json' });
                                const url = URL.createObjectURL(blob);
                                const link = document.createElement('a');
                                link.href = url;
                                link.download = `settings-export-${new Date().toISOString().split('T')[0]}.json`;
                                document.body.appendChild(link);
                                link.click();
                                document.body.removeChild(link);
                            } catch (err) {
                                toast.error('Failed to export settings');
                            }
                        }}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-bold shadow-lg transition-all"
                    >
                        <FaCode size={14} /> Export
                    </button>
                    <button
                        onClick={() => queryClient.invalidateQueries({ queryKey: ['settings'] })}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold shadow-lg shadow-blue-600/20 transition-all"
                    >
                        <FaSync size={14} /> Refresh
                    </button>
                    <button
                        onClick={handleSaveSettings}
                        disabled={updateSettingsMutation.isPending}
                        className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold shadow-lg shadow-emerald-600/20 transition-all disabled:opacity-50"
                    >
                        <FaSave size={14} /> Save Changes
                    </button>
                </>
            }
        >
            {/* Tabs */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 mb-6">
                <div className="border-b border-slate-200">
                    <nav className="flex gap-1 px-4">
                        <button
                            onClick={() => setActiveTab('general')}
                            className={`py-3 px-4 border-b-2 font-bold text-sm transition-colors ${activeTab === 'general'
                                ? 'border-indigo-600 text-indigo-600'
                                : 'border-transparent text-slate-500 hover:text-slate-700'
                                }`}
                        >
                            <div className="flex items-center gap-2">
                                <FaGlobe size={16} />
                                General
                            </div>
                        </button>
                        <button
                            onClick={() => setActiveTab('notifications')}
                            className={`py-3 px-4 border-b-2 font-bold text-sm transition-colors ${activeTab === 'notifications'
                                ? 'border-indigo-600 text-indigo-600'
                                : 'border-transparent text-slate-500 hover:text-slate-700'
                                }`}
                        >
                            <div className="flex items-center gap-2">
                                <FaBell size={16} />
                                Notifications
                            </div>
                        </button>
                        <button
                            onClick={() => setActiveTab('features')}
                            className={`py-3 px-4 border-b-2 font-bold text-sm transition-colors ${activeTab === 'features'
                                ? 'border-indigo-600 text-indigo-600'
                                : 'border-transparent text-slate-500 hover:text-slate-700'
                                }`}
                        >
                            <div className="flex items-center gap-2">
                                <FaToggleOn size={16} />
                                Features
                            </div>
                        </button>
                        <button
                            onClick={() => setActiveTab('api')}
                            className={`py-3 px-4 border-b-2 font-bold text-sm transition-colors ${activeTab === 'api'
                                ? 'border-indigo-600 text-indigo-600'
                                : 'border-transparent text-slate-500 hover:text-slate-700'
                                }`}
                        >
                            <div className="flex items-center gap-2">
                                <FaCode size={16} />
                                API
                            </div>
                        </button>
                    </nav>
                </div>

                {/* Settings Content */}
                <div className="p-6">
                    {isLoading ? (
                        <div className="text-center py-12">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
                            <p className="mt-4 text-slate-600">Loading settings...</p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {/* General Settings */}
                            {activeTab === 'general' && (
                                <>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-2">Platform Name</label>
                                            <input
                                                type="text"
                                                value={settings.platform_name || ''}
                                                onChange={(e) => handleChange('platform_name', e.target.value)}
                                                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-2">Default Timezone</label>
                                            <select
                                                value={settings.default_timezone || ''}
                                                onChange={(e) => handleChange('default_timezone', e.target.value)}
                                                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                            >
                                                <option value="Africa/Nairobi">Africa/Nairobi (EAT)</option>
                                                <option value="UTC">UTC</option>
                                                <option value="America/New_York">America/New_York (EST)</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-2">Default Currency</label>
                                            <select
                                                value={settings.default_currency || ''}
                                                onChange={(e) => handleChange('default_currency', e.target.value)}
                                                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                            >
                                                <option value="KES">KES (Kenyan Shilling)</option>
                                                <option value="USD">USD (US Dollar)</option>
                                                <option value="EUR">EUR (Euro)</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-2">Default Language</label>
                                            <select
                                                value={settings.default_language || ''}
                                                onChange={(e) => handleChange('default_language', e.target.value)}
                                                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                            >
                                                <option value="en">English</option>
                                                <option value="sw">Swahili</option>
                                                <option value="fr">French</option>
                                            </select>
                                        </div>
                                    </div>
                                </>
                            )}

                            {/* Notification Settings */}
                            {activeTab === 'notifications' && (
                                <>
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                                            <div>
                                                <h3 className="font-bold text-slate-800">Email Notifications</h3>
                                                <p className="text-sm text-slate-600">Enable email notifications for users</p>
                                            </div>
                                            <button
                                                onClick={() => handleToggle('email_enabled')}
                                                className={`w-12 h-6 rounded-full transition-colors ${settings.email_enabled ? 'bg-green-500' : 'bg-slate-300'
                                                    }`}
                                            >
                                                <div className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform ${settings.email_enabled ? 'translate-x-6' : 'translate-x-1'
                                                    }`} />
                                            </button>
                                        </div>

                                        {settings.email_enabled && (
                                            <div className="ml-4 p-4 border border-slate-200 rounded-lg">
                                                <label className="block text-sm font-medium text-slate-700 mb-2">Test Email Configuration</label>
                                                <div className="flex gap-2">
                                                    <input
                                                        type="email"
                                                        value={testEmail}
                                                        onChange={(e) => setTestEmail(e.target.value)}
                                                        placeholder="Enter test email"
                                                        className="flex-1 px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                                    />
                                                    <button
                                                        onClick={() => testEmailMutation.mutate(testEmail)}
                                                        disabled={!testEmail || testEmailMutation.isPending}
                                                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50"
                                                    >
                                                        <FaEnvelope className="inline mr-2" />
                                                        Test
                                                    </button>
                                                </div>
                                            </div>
                                        )}

                                        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                                            <div>
                                                <h3 className="font-bold text-slate-800">SMS Notifications</h3>
                                                <p className="text-sm text-slate-600">Enable SMS notifications for users</p>
                                            </div>
                                            <button
                                                onClick={() => handleToggle('sms_enabled')}
                                                className={`w-12 h-6 rounded-full transition-colors ${settings.sms_enabled ? 'bg-green-500' : 'bg-slate-300'
                                                    }`}
                                            >
                                                <div className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform ${settings.sms_enabled ? 'translate-x-6' : 'translate-x-1'
                                                    }`} />
                                            </button>
                                        </div>

                                        {settings.sms_enabled && (
                                            <div className="ml-4 p-4 border border-slate-200 rounded-lg">
                                                <label className="block text-sm font-medium text-slate-700 mb-2">Test SMS Configuration</label>
                                                <div className="flex gap-2">
                                                    <input
                                                        type="tel"
                                                        value={testPhone}
                                                        onChange={(e) => setTestPhone(e.target.value)}
                                                        placeholder="Enter test phone number"
                                                        className="flex-1 px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                                    />
                                                    <button
                                                        onClick={() => testSmsMutation.mutate(testPhone)}
                                                        disabled={!testPhone || testSmsMutation.isPending}
                                                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50"
                                                    >
                                                        <FaSms className="inline mr-2" />
                                                        Test
                                                    </button>
                                                </div>
                                            </div>
                                        )}

                                        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                                            <div>
                                                <h3 className="font-bold text-slate-800">Push Notifications</h3>
                                                <p className="text-sm text-slate-600">Enable push notifications for mobile apps</p>
                                            </div>
                                            <button
                                                onClick={() => handleToggle('push_enabled')}
                                                className={`w-12 h-6 rounded-full transition-colors ${settings.push_enabled ? 'bg-green-500' : 'bg-slate-300'
                                                    }`}
                                            >
                                                <div className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform ${settings.push_enabled ? 'translate-x-6' : 'translate-x-1'
                                                    }`} />
                                            </button>
                                        </div>
                                    </div>
                                </>
                            )}

                            {/* Feature Flags */}
                            {activeTab === 'features' && (
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                                        <div>
                                            <h3 className="font-bold text-slate-800">Maintenance Mode</h3>
                                            <p className="text-sm text-slate-600">Put the platform in maintenance mode</p>
                                        </div>
                                        <button
                                            onClick={() => handleToggle('maintenance_mode')}
                                            className={`w-12 h-6 rounded-full transition-colors ${settings.maintenance_mode ? 'bg-red-500' : 'bg-slate-300'
                                                }`}
                                        >
                                            <div className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform ${settings.maintenance_mode ? 'translate-x-6' : 'translate-x-1'
                                                }`} />
                                        </button>
                                    </div>

                                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                                        <div>
                                            <h3 className="font-bold text-slate-800">User Registration</h3>
                                            <p className="text-sm text-slate-600">Allow new users to register</p>
                                        </div>
                                        <button
                                            onClick={() => handleToggle('user_registration')}
                                            className={`w-12 h-6 rounded-full transition-colors ${settings.user_registration ? 'bg-green-500' : 'bg-slate-300'
                                                }`}
                                        >
                                            <div className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform ${settings.user_registration ? 'translate-x-6' : 'translate-x-1'
                                                }`} />
                                        </button>
                                    </div>

                                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                                        <div>
                                            <h3 className="font-bold text-slate-800">Bidding System</h3>
                                            <p className="text-sm text-slate-600">Enable bidding feature for loads</p>
                                        </div>
                                        <button
                                            onClick={() => handleToggle('bidding_enabled')}
                                            className={`w-12 h-6 rounded-full transition-colors ${settings.bidding_enabled ? 'bg-green-500' : 'bg-slate-300'
                                                }`}
                                        >
                                            <div className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform ${settings.bidding_enabled ? 'translate-x-6' : 'translate-x-1'
                                                }`} />
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* API Settings */}
                            {activeTab === 'api' && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-2">Rate Limit (per minute)</label>
                                        <input
                                            type="number"
                                            value={settings.rate_limit_per_minute || ''}
                                            onChange={(e) => handleChange('rate_limit_per_minute', parseInt(e.target.value))}
                                            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                        />
                                        <p className="text-xs text-slate-500 mt-1">Maximum API requests per minute per user</p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-2">Max Upload Size (MB)</label>
                                        <input
                                            type="number"
                                            value={settings.max_upload_size_mb || ''}
                                            onChange={(e) => handleChange('max_upload_size_mb', parseInt(e.target.value))}
                                            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                        />
                                        <p className="text-xs text-slate-500 mt-1">Maximum file upload size in megabytes</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </AdminPageLayout>
    );
};

export default AdvancedSettings;
