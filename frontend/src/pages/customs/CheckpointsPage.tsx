import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { MapPin, Plus, Inbox } from 'lucide-react';
import { customsApi } from '../../services/customsApi';
import { cn } from '../../utils/cn';

const BRAND = '#2c5173';
const inputCls = "w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2c5173]/30";

const TYPES = ['BORDER', 'PORT', 'WAREHOUSE', 'INLAND', 'AIRPORT'];

const typeColors: Record<string, string> = {
  BORDER:    'bg-blue-100 text-blue-700',
  PORT:      'bg-cyan-100 text-cyan-700',
  WAREHOUSE: 'bg-amber-100 text-amber-700',
  INLAND:    'bg-slate-100 text-slate-700',
  AIRPORT:   'bg-indigo-100 text-indigo-700',
};

const CheckpointsPage: React.FC = () => {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', code: '', type: 'BORDER', country: '', city: '', address: '' });

  const { data, isLoading } = useQuery({
    queryKey: ['customs-checkpoints-page'],
    queryFn: () => customsApi.getCheckpoints(),
  });
  const checkpoints: any[] = data?.data?.data || [];

  const mutation = useMutation({
    mutationFn: (d: any) => customsApi.createCheckpoint(d),
    onSuccess: () => {
      toast.success('Checkpoint created');
      qc.invalidateQueries({ queryKey: ['customs-checkpoints-page'] });
      qc.invalidateQueries({ queryKey: ['customs-checkpoints'] });
      setShowForm(false);
      setForm({ name: '', code: '', type: 'BORDER', country: '', city: '', address: '' });
    },
    onError: () => toast.error('Failed to create checkpoint'),
  });

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div className="space-y-6 p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: BRAND }}>
            <MapPin size={16} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900 dark:text-white">Border Checkpoints</h1>
            <p className="text-xs text-slate-400">{checkpoints.length} active checkpoints</p>
          </div>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-5 py-2.5 rounded-xl text-white text-sm font-bold flex items-center gap-2 hover:opacity-90 transition-opacity"
          style={{ background: BRAND }}
        >
          <Plus size={15} /> Add Checkpoint
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4">New Checkpoint</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">Name *</label>
              <input className={inputCls} value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Beitbridge Border Post" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">Code</label>
              <input className={inputCls} value={form.code} onChange={e => set('code', e.target.value)} placeholder="e.g. BBP-001" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">Type</label>
              <select className={inputCls} value={form.type} onChange={e => set('type', e.target.value)}>
                {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">Country</label>
              <input className={inputCls} value={form.country} onChange={e => set('country', e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">City</label>
              <input className={inputCls} value={form.city} onChange={e => set('city', e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">Address</label>
              <input className={inputCls} value={form.address} onChange={e => set('address', e.target.value)} />
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-4">
            <button onClick={() => setShowForm(false)} className="px-4 py-2 rounded-xl border text-sm font-bold text-slate-600">Cancel</button>
            <button
              onClick={() => { if (!form.name.trim()) { toast.error('Name required'); return; } mutation.mutate(form); }}
              disabled={mutation.isPending}
              className="px-6 py-2 rounded-xl text-white text-sm font-bold hover:opacity-90 disabled:opacity-60"
              style={{ background: BRAND }}
            >
              {mutation.isPending ? 'Creating...' : 'Create'}
            </button>
          </div>
        </div>
      )}

      {/* List */}
      {isLoading ? (
        <div className="space-y-3 animate-pulse">
          {[1,2,3,4].map(i => <div key={i} className="h-16 bg-slate-100 dark:bg-slate-800 rounded-2xl" />)}
        </div>
      ) : checkpoints.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-3">
          <Inbox className="w-12 h-12 text-slate-200" />
          <p className="text-sm font-bold">No checkpoints configured</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {checkpoints.map((cp: any) => (
            <div key={cp.id} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-5">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="text-sm font-black text-slate-900 dark:text-white">{cp.name}</p>
                  {cp.code && <p className="text-xs font-mono text-slate-400">{cp.code}</p>}
                </div>
                <span className={cn('text-[9px] font-black px-2 py-0.5 rounded-lg uppercase', typeColors[cp.type] || 'bg-slate-100 text-slate-600')}>
                  {cp.type}
                </span>
              </div>
              {(cp.city || cp.country) && (
                <div className="flex items-center gap-1 text-xs text-slate-500">
                  <MapPin size={11} />
                  {[cp.city, cp.country].filter(Boolean).join(', ')}
                </div>
              )}
              {cp.address && <p className="text-xs text-slate-400 mt-0.5">{cp.address}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CheckpointsPage;
