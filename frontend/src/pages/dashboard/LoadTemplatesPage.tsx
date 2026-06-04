import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, FileText, Trash2, Play, Calendar, Edit2, Clock, ChevronRight } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { loadTemplatesApi } from '../../services/featuresApi';
import { TranslatedText } from '../../components/translated-text';
import ModernLoader from '../../components/common/ModernLoader';

const FREQUENCIES = ['DAILY', 'WEEKLY', 'MONTHLY'];

const LoadTemplatesPage: React.FC = () => {
  const qc = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [showSchedule, setShowSchedule] = useState<string | null>(null);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [scheduleFreq, setScheduleFreq] = useState('WEEKLY');
  const [scheduleStart, setScheduleStart] = useState('');

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ['load-templates'],
    queryFn: loadTemplatesApi.list,
  });

  const createMutation = useMutation({
    mutationFn: () => loadTemplatesApi.create({ name: newName, description: newDesc, templateData: {} }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['load-templates'] }); setShowCreate(false); setNewName(''); setNewDesc(''); toast.success('Template created'); },
    onError: () => toast.error('Failed to create template'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => loadTemplatesApi.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['load-templates'] }); toast.success('Template deleted'); },
  });

  const instantiateMutation = useMutation({
    mutationFn: (id: string) => loadTemplatesApi.createLoad(id),
    onSuccess: () => { toast.success('Load created from template!'); },
    onError: () => toast.error('Failed to create load'),
  });

  const scheduleMutation = useMutation({
    mutationFn: ({ id }: { id: string }) =>
      loadTemplatesApi.setSchedule(id, { frequency: scheduleFreq as any, startDate: scheduleStart }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['load-templates'] }); setShowSchedule(null); toast.success('Schedule set'); },
  });

  if (isLoading) return <ModernLoader isLoading text="Loading_Templates" />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
            <TranslatedText text="Load Templates" />
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            <TranslatedText text="Save and reuse load configurations. Set recurring schedules to auto-create loads." />
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-bold text-sm transition-all"
        >
          <Plus size={16} /> <TranslatedText text="New Template" />
        </button>
      </div>

      {/* Templates Grid */}
      {templates.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800">
          <FileText size={48} className="mx-auto text-slate-300 dark:text-slate-600 mb-4" />
          <p className="text-slate-500 dark:text-slate-400 font-medium">
            <TranslatedText text="No templates yet. Create your first template to speed up load creation." />
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map((t: any) => (
            <div key={t.id} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-5 hover:shadow-md transition-all group">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center">
                    <FileText size={18} className="text-primary-600 dark:text-primary-400" />
                  </div>
                  <div>
                    <h3 className="font-black text-slate-900 dark:text-white text-sm">{t.name}</h3>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                      Used {t.usageCount} times
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => deleteMutation.mutate(t.id)}
                  className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
                >
                  <Trash2 size={14} />
                </button>
              </div>

              {t.description && (
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 line-clamp-2">{t.description}</p>
              )}

              {t.templateData?._schedule && (
                <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-2.5 py-1.5 rounded-lg mb-3">
                  <Clock size={12} />
                  <span>{t.templateData._schedule.frequency} — starts {new Date(t.templateData._schedule.startDate).toLocaleDateString()}</span>
                </div>
              )}

              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => instantiateMutation.mutate(t.id)}
                  disabled={instantiateMutation.isPending}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-50"
                >
                  <Play size={12} /> <TranslatedText text="Create Load" />
                </button>
                <button
                  onClick={() => { setShowSchedule(t.id); setScheduleStart(''); }}
                  className="flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-all"
                >
                  <Calendar size={12} /> <TranslatedText text="Schedule" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md p-6 border border-slate-100 dark:border-slate-800">
            <h2 className="text-lg font-black text-slate-900 dark:text-white mb-4 uppercase tracking-tight">
              <TranslatedText text="Create Template" />
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5">
                  <TranslatedText text="Template Name" /> *
                </label>
                <input
                  type="text"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  placeholder="e.g. Nairobi → Mombasa Standard"
                  className="w-full px-4 py-2.5 text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5">
                  <TranslatedText text="Description" />
                </label>
                <textarea
                  value={newDesc}
                  onChange={e => setNewDesc(e.target.value)}
                  rows={3}
                  placeholder="Optional description..."
                  className="w-full px-4 py-2.5 text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                />
              </div>
              <p className="text-xs text-slate-400 dark:text-slate-500">
                <TranslatedText text="Template data will be populated from your next load creation. You can also edit it later." />
              </p>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowCreate(false)} className="flex-1 px-4 py-2.5 text-sm font-bold text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all">
                <TranslatedText text="Cancel" />
              </button>
              <button
                onClick={() => createMutation.mutate()}
                disabled={!newName || createMutation.isPending}
                className="flex-1 px-4 py-2.5 text-sm font-bold bg-primary-600 hover:bg-primary-700 text-white rounded-xl transition-all disabled:opacity-50"
              >
                {createMutation.isPending ? '...' : <TranslatedText text="Create" />}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Schedule Modal */}
      {showSchedule && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md p-6 border border-slate-100 dark:border-slate-800">
            <h2 className="text-lg font-black text-slate-900 dark:text-white mb-4 uppercase tracking-tight">
              <TranslatedText text="Set Recurring Schedule" />
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5">
                  <TranslatedText text="Frequency" />
                </label>
                <select
                  value={scheduleFreq}
                  onChange={e => setScheduleFreq(e.target.value)}
                  className="w-full px-4 py-2.5 text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                >
                  {FREQUENCIES.map(f => <option key={f} value={f}>{f}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5">
                  <TranslatedText text="Start Date" />
                </label>
                <input
                  type="date"
                  value={scheduleStart}
                  onChange={e => setScheduleStart(e.target.value)}
                  className="w-full px-4 py-2.5 text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowSchedule(null)} className="flex-1 px-4 py-2.5 text-sm font-bold text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all">
                <TranslatedText text="Cancel" />
              </button>
              <button
                onClick={() => scheduleMutation.mutate({ id: showSchedule })}
                disabled={!scheduleStart || scheduleMutation.isPending}
                className="flex-1 px-4 py-2.5 text-sm font-bold bg-primary-600 hover:bg-primary-700 text-white rounded-xl transition-all disabled:opacity-50"
              >
                {scheduleMutation.isPending ? '...' : <TranslatedText text="Save Schedule" />}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LoadTemplatesPage;
