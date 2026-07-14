import React, { useState, useRef, useCallback } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { X, ChevronDown, Gavel, Upload, FileText, Check, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { disputesAPI, tripsAPI, paymentsAPI, financialAPI } from '../../../services/api';
import { CATEGORY_LABELS, PRIORITY_LABELS } from '../../../types/dispute';

interface Props {
  onClose: () => void;
  onCreated: () => void;
}

const CreateDisputeModal: React.FC<Props> = ({ onClose, onCreated }) => {
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: 'OTHER',
    priority: 'MEDIUM',
    respondentUserId: '',
    tripId: '',
  });

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(prev => ({ ...prev, [k]: e.target.value }));

  const createMut = useMutation({
    mutationFn: () => disputesAPI.create({
      title: form.title,
      description: form.description,
      category: form.category,
      priority: form.priority,
      respondentUserId: form.respondentUserId || undefined,
      tripId: form.tripId || undefined,
    }),
    onSuccess: () => { toast.success('Dispute created'); onCreated(); },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? 'Failed to create dispute'),
  });

  const isValid = form.title.trim().length >= 5 && form.description.trim().length >= 10;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-[24px] w-full max-w-lg border border-gray-100">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-red-50 rounded-xl flex items-center justify-center">
              <Gavel className="w-4 h-4 text-red-500" />
            </div>
            <h3 className="text-base font-black text-gray-900">Raise a Dispute</h3>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1.5">Title <span className="text-red-400">*</span></label>
            <input value={form.title} onChange={set('title')} placeholder="Brief title of the dispute"
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#2c5173] focus:border-transparent" />
          </div>

          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1.5">Description <span className="text-red-400">*</span></label>
            <textarea value={form.description} onChange={set('description')} rows={4}
              placeholder="Describe the dispute in detail…"
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm resize-none focus:ring-2 focus:ring-[#2c5173] focus:border-transparent" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1.5">Category</label>
              <div className="relative">
                <select value={form.category} onChange={set('category')}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm font-medium appearance-none focus:ring-2 focus:ring-[#2c5173]">
                  {Object.entries(CATEGORY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
              </div>
            </div>
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1.5">Priority</label>
              <div className="relative">
                <select value={form.priority} onChange={set('priority')}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm font-medium appearance-none focus:ring-2 focus:ring-[#2c5173]">
                  {Object.entries(PRIORITY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
              </div>
            </div>
          </div>

          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1.5">Trip ID (optional)</label>
            <input value={form.tripId} onChange={set('tripId')} placeholder="Related trip UUID"
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#2c5173] focus:border-transparent" />
          </div>

          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1.5">Respondent User ID (optional)</label>
            <input value={form.respondentUserId} onChange={set('respondentUserId')} placeholder="UUID of the other party"
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#2c5173] focus:border-transparent" />
          </div>
        </div>

        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-100 transition-colors">Cancel</button>
          <button onClick={() => createMut.mutate()} disabled={!isValid || createMut.isPending}
            className="flex-1 py-2.5 bg-[#2c5173] text-white rounded-xl text-sm font-bold hover:bg-[#1e3a54] transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
            {createMut.isPending ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Gavel className="w-4 h-4" />}
            Raise Dispute
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateDisputeModal;
