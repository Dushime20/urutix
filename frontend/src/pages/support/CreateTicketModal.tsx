import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { X, Headphones, ChevronDown, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import { disputesAPI } from '../../services/api';
import { CATEGORY_LABELS, PRIORITY_LABELS } from '../../types/dispute';

interface Props { onClose: () => void; onCreated: () => void; }

// Auto-priority categories
const CRITICAL_CATS = ['FRAUD_SUSPECTED','SECURITY_CONCERN','CARGO_LOSS','PAYMENT_ISSUE','BILLING_ISSUE'];
const HIGH_CATS     = ['CARGO_DAMAGE','TRUCK_BREAKDOWN','INSURANCE_CLAIM','ACCOUNT_SUSPENSION'];

function getDefaultPriority(cat: string): string {
  if (CRITICAL_CATS.includes(cat)) return 'CRITICAL';
  if (HIGH_CATS.includes(cat))     return 'HIGH';
  if (['DELIVERY_DELAY','DRIVER_MISCONDUCT','BROKER_COMPLAINT','LENDER_COMPLAINT','CONTRACT_VIOLATION'].includes(cat)) return 'MEDIUM';
  return 'LOW';
}

const CreateTicketModal: React.FC<Props> = ({ onClose, onCreated }) => {
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: 'OTHER',
    priority: 'MEDIUM',
    location: '',
    incidentDate: '',
    additionalNotes: '',
    tripId: '',
    contractId: '',
    invoiceId: '',
    auctionId: '',
    paymentId: '',
  });

  const [autoPriority, setAutoPriority] = useState(true);

  const set = (key: string, value: string) => {
    if (key === 'category' && autoPriority) {
      setForm(f => ({ ...f, [key]: value, priority: getDefaultPriority(value) }));
    } else {
      setForm(f => ({ ...f, [key]: value }));
    }
  };

  const createMut = useMutation({
    mutationFn: () => disputesAPI.create({
      title: form.title,
      description: form.description,
      category: form.category,
      priority: form.priority,
      location: form.location || undefined,
      incidentDate: form.incidentDate || undefined,
      additionalNotes: form.additionalNotes || undefined,
      tripId: form.tripId || undefined,
      contractId: form.contractId || undefined,
      invoiceId: form.invoiceId || undefined,
      auctionId: form.auctionId || undefined,
      paymentId: form.paymentId || undefined,
    }),
    onSuccess: (res: any) => {
      toast.success(`Ticket ${res.data?.data?.ticketNumber ?? ''} created successfully`);
      onCreated();
    },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? 'Failed to create ticket'),
  });

  const isValid = form.title.trim().length >= 5 && form.description.trim().length >= 10;

  const priorityColors: Record<string, string> = {
    LOW: 'bg-gray-50 text-gray-500 border-gray-200',
    MEDIUM: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    HIGH: 'bg-orange-50 text-orange-700 border-orange-200',
    CRITICAL: 'bg-red-50 text-red-700 border-red-200',
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-start justify-center z-50 p-3 overflow-y-auto">
      <div className="bg-white dark:bg-slate-800 rounded-[24px] w-full max-w-2xl my-6 border border-gray-100 dark:border-slate-700">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-slate-700">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#2c5173]/10 rounded-xl flex items-center justify-center">
              <Headphones className="w-4 h-4 text-[#2c5173]" />
            </div>
            <div>
              <h2 className="text-sm font-black text-gray-900 dark:text-white">Report an Issue</h2>
              <p className="text-[11px] text-gray-400">Submit a new support ticket</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-400"><X className="w-4 h-4" /></button>
        </div>

        <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Title */}
          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">Title <span className="text-red-400">*</span></label>
            <input value={form.title} onChange={e => set('title', e.target.value)}
              placeholder="Brief description of the issue..."
              className="w-full px-3 py-2.5 border border-gray-200 dark:border-slate-600 rounded-xl text-sm focus:ring-2 focus:ring-[#2c5173] dark:bg-slate-700 dark:text-white" />
          </div>

          {/* Category & Priority row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">Category <span className="text-red-400">*</span></label>
              <div className="relative">
                <select value={form.category} onChange={e => set('category', e.target.value)}
                  className="w-full pl-3 pr-8 py-2.5 border border-gray-200 dark:border-slate-600 rounded-xl text-sm appearance-none focus:ring-2 focus:ring-[#2c5173] dark:bg-slate-700 dark:text-white">
                  {Object.entries(CATEGORY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Priority</label>
                <label className="flex items-center gap-1 text-[10px] text-gray-400 cursor-pointer">
                  <input type="checkbox" checked={autoPriority} onChange={e => setAutoPriority(e.target.checked)} className="w-3 h-3 accent-[#2c5173]" />
                  Auto
                </label>
              </div>
              <div className="relative">
                <select value={form.priority} onChange={e => { setAutoPriority(false); set('priority', e.target.value); }}
                  className={`w-full pl-3 pr-8 py-2.5 border rounded-xl text-sm appearance-none focus:ring-2 focus:ring-[#2c5173] font-bold ${priorityColors[form.priority]} dark:bg-slate-700 dark:text-white dark:border-slate-600`}>
                  {Object.entries(PRIORITY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Auto-priority info */}
          {form.priority === 'CRITICAL' && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-xl p-3 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-red-700 dark:text-red-300">This category is marked <strong>Critical</strong>. Your ticket will be escalated immediately and requires a response within 15 minutes.</p>
            </div>
          )}

          {/* Description */}
          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">Description <span className="text-red-400">*</span></label>
            <textarea value={form.description} onChange={e => set('description', e.target.value)} rows={4}
              placeholder="Provide a detailed description of the issue, what happened, when, and any relevant information..."
              className="w-full px-3 py-2.5 border border-gray-200 dark:border-slate-600 rounded-xl text-sm resize-none focus:ring-2 focus:ring-[#2c5173] dark:bg-slate-700 dark:text-white" />
          </div>

          {/* Location & Incident Date */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">Location (optional)</label>
              <input value={form.location} onChange={e => set('location', e.target.value)}
                placeholder="Where did this occur?"
                className="w-full px-3 py-2 border border-gray-200 dark:border-slate-600 rounded-xl text-sm focus:ring-2 focus:ring-[#2c5173] dark:bg-slate-700 dark:text-white" />
            </div>
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">Incident Date (optional)</label>
              <input type="date" value={form.incidentDate} onChange={e => set('incidentDate', e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 dark:border-slate-600 rounded-xl text-sm focus:ring-2 focus:ring-[#2c5173] dark:bg-slate-700 dark:text-white" />
            </div>
          </div>

          {/* Related entities */}
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Related References (optional)</p>
            <div className="grid grid-cols-2 gap-2">
              {[
                { key: 'tripId', label: 'Trip ID' },
                { key: 'contractId', label: 'Contract ID' },
                { key: 'invoiceId', label: 'Invoice ID' },
                { key: 'auctionId', label: 'Auction ID' },
                { key: 'paymentId', label: 'Payment ID' },
              ].map(({ key, label }) => (
                <div key={key}>
                  <label className="text-[10px] text-gray-400 block mb-0.5">{label}</label>
                  <input value={(form as any)[key]} onChange={e => set(key, e.target.value)}
                    placeholder="UUID..."
                    className="w-full px-2.5 py-2 border border-gray-200 dark:border-slate-600 rounded-xl text-xs focus:ring-2 focus:ring-[#2c5173] dark:bg-slate-700 dark:text-white font-mono" />
                </div>
              ))}
            </div>
          </div>

          {/* Additional Notes */}
          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">Additional Notes (optional)</label>
            <textarea value={form.additionalNotes} onChange={e => set('additionalNotes', e.target.value)} rows={2}
              placeholder="Any other information..."
              className="w-full px-3 py-2 border border-gray-200 dark:border-slate-600 rounded-xl text-sm resize-none focus:ring-2 focus:ring-[#2c5173] dark:bg-slate-700 dark:text-white" />
          </div>
        </div>

        <div className="px-5 py-4 bg-gray-50 dark:bg-slate-700/30 border-t border-gray-100 dark:border-slate-700 flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 border border-gray-200 dark:border-slate-600 rounded-xl text-sm font-bold text-gray-600 dark:text-slate-300 hover:bg-gray-100">Cancel</button>
          <button onClick={() => createMut.mutate()} disabled={!isValid || createMut.isPending}
            className="flex-1 py-2.5 bg-[#2c5173] text-white rounded-xl text-sm font-bold hover:bg-[#1e3a54] disabled:opacity-50 flex items-center justify-center gap-2">
            {createMut.isPending ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Submitting…</> : 'Submit Ticket'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateTicketModal;
