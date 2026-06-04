/**
 * White-Label Branding Settings — TENANT_ADMIN role
 * Route: /tenant-admin/branding
 * Layout: DashboardLayout (TenantAdminLayout)
 */
import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Palette, Upload, Eye, Save, RefreshCw } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { brandingApi } from '../../services/featuresApi';
import { useAuth } from '../../contexts/AuthContext';
import { TranslatedText } from '../../components/translated-text';
import ModernLoader from '../../components/common/ModernLoader';

const DEFAULT_BRANDING = {
  logoUrl: '',
  primaryColor: '#2563eb',
  secondaryColor: '#1e40af',
  fontFamily: 'Inter',
  faviconUrl: '',
  companyName: '',
};

const FONT_OPTIONS = ['Inter', 'Roboto', 'Poppins', 'Nunito', 'Open Sans', 'Lato', 'Montserrat'];

const BrandingSettingsPage: React.FC = () => {
  const { user } = useAuth();
  const tenantId = user?.tenantId ?? '';
  const [form, setForm] = useState(DEFAULT_BRANDING);
  const [preview, setPreview] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['tenant-branding', tenantId],
    queryFn: () => brandingApi.get(tenantId),
    enabled: !!tenantId,
  });

  useEffect(() => {
    if (data?.data) {
      setForm({ ...DEFAULT_BRANDING, ...data.data });
    }
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: () => brandingApi.update(tenantId, form),
    onSuccess: () => toast.success('Branding saved successfully'),
    onError: () => toast.error('Failed to save branding'),
  });

  const set = (key: keyof typeof form, value: string) => setForm(f => ({ ...f, [key]: value }));

  if (isLoading) return <ModernLoader isLoading text="Loading_Branding" />;

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
            <TranslatedText text="Branding & White-Label" />
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            <TranslatedText text="Customise your platform appearance. Changes apply to your tenant's instance and email templates." />
          </p>
        </div>
        <button
          onClick={() => setPreview(!preview)}
          className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-black transition-all"
        >
          <Eye size={14} /> <TranslatedText text={preview ? 'Hide Preview' : 'Show Preview'} />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Form */}
        <div className="space-y-5">
          {/* Company Name */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-5">
            <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">
              <TranslatedText text="Company Identity" />
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
                  <TranslatedText text="Company Name" />
                </label>
                <input
                  type="text"
                  value={form.companyName}
                  onChange={e => set('companyName', e.target.value)}
                  placeholder="Your Company Name"
                  className="w-full px-4 py-2.5 text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
                  <TranslatedText text="Logo URL" />
                </label>
                <input
                  type="url"
                  value={form.logoUrl}
                  onChange={e => set('logoUrl', e.target.value)}
                  placeholder="https://your-cdn.com/logo.png"
                  className="w-full px-4 py-2.5 text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                />
                {form.logoUrl && (
                  <div className="mt-2 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                    <img src={form.logoUrl} alt="Logo preview" className="h-10 object-contain" onError={e => (e.currentTarget.style.display = 'none')} />
                  </div>
                )}
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
                  <TranslatedText text="Favicon URL" />
                </label>
                <input
                  type="url"
                  value={form.faviconUrl}
                  onChange={e => set('faviconUrl', e.target.value)}
                  placeholder="https://your-cdn.com/favicon.ico"
                  className="w-full px-4 py-2.5 text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>
          </div>

          {/* Colors */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-5">
            <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">
              <TranslatedText text="Colour Palette" />
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
                  <TranslatedText text="Primary Colour" />
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={form.primaryColor}
                    onChange={e => set('primaryColor', e.target.value)}
                    className="w-12 h-10 rounded-xl border border-slate-200 dark:border-slate-700 cursor-pointer p-0.5"
                  />
                  <input
                    type="text"
                    value={form.primaryColor}
                    onChange={e => set('primaryColor', e.target.value)}
                    className="flex-1 px-3 py-2 text-xs font-mono border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
                  <TranslatedText text="Secondary Colour" />
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={form.secondaryColor}
                    onChange={e => set('secondaryColor', e.target.value)}
                    className="w-12 h-10 rounded-xl border border-slate-200 dark:border-slate-700 cursor-pointer p-0.5"
                  />
                  <input
                    type="text"
                    value={form.secondaryColor}
                    onChange={e => set('secondaryColor', e.target.value)}
                    className="flex-1 px-3 py-2 text-xs font-mono border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Font */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-5">
            <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">
              <TranslatedText text="Typography" />
            </h2>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
                <TranslatedText text="Font Family" />
              </label>
              <select
                value={form.fontFamily}
                onChange={e => set('fontFamily', e.target.value)}
                className="w-full px-4 py-2.5 text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                style={{ fontFamily: form.fontFamily }}
              >
                {FONT_OPTIONS.map(f => <option key={f} value={f} style={{ fontFamily: f }}>{f}</option>)}
              </select>
            </div>
          </div>

          {/* Save */}
          <button
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending}
            className="w-full flex items-center justify-center gap-2 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-black text-sm transition-all disabled:opacity-50"
          >
            {saveMutation.isPending
              ? <><RefreshCw size={16} className="animate-spin" /> <TranslatedText text="Saving..." /></>
              : <><Save size={16} /> <TranslatedText text="Save Branding" /></>}
          </button>
        </div>

        {/* Live Preview */}
        {preview && (
          <div className="space-y-4">
            <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest">
              <TranslatedText text="Live Preview" />
            </h2>
            <div
              className="rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-lg"
              style={{ fontFamily: form.fontFamily }}
            >
              {/* Mock header */}
              <div className="px-5 py-3 flex items-center justify-between" style={{ backgroundColor: form.primaryColor }}>
                {form.logoUrl ? (
                  <img src={form.logoUrl} alt="Logo" className="h-8 object-contain" onError={e => (e.currentTarget.style.display = 'none')} />
                ) : (
                  <span className="text-white font-black text-sm">{form.companyName || 'Your Company'}</span>
                )}
                <div className="flex gap-2">
                  {['Dashboard', 'Loads', 'Fleet'].map(item => (
                    <span key={item} className="text-white/80 text-xs font-bold">{item}</span>
                  ))}
                </div>
              </div>
              {/* Mock content */}
              <div className="p-5 bg-slate-50 dark:bg-slate-900">
                <div className="grid grid-cols-3 gap-3 mb-4">
                  {['Active Trips', 'Pending Loads', 'Revenue'].map((label, i) => (
                    <div key={label} className="bg-white dark:bg-slate-800 rounded-xl p-3 border border-slate-100 dark:border-slate-700">
                      <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">{label}</p>
                      <p className="text-lg font-black" style={{ color: form.primaryColor }}>{[12, 5, 'KES 45K'][i]}</p>
                    </div>
                  ))}
                </div>
                <button
                  className="px-4 py-2 text-white text-xs font-black rounded-xl"
                  style={{ backgroundColor: form.primaryColor }}
                >
                  Create New Load
                </button>
              </div>
            </div>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 text-center">
              <TranslatedText text="Preview only — save to apply changes" />
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default BrandingSettingsPage;
