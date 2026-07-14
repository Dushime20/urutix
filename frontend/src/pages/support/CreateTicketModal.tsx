import React, { useState, useRef, useCallback } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  X, Headphones, ChevronDown, AlertTriangle, Upload, FileText,
  Paperclip, Check, Loader2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { disputesAPI, tripsAPI, paymentsAPI, financialAPI } from '../../services/api';
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

// Compact searchable select for reference fields
interface RefSelectProps {
  label: string;
  value: string;
  onChange: (id: string) => void;
  options: { id: string; label: string; sub?: string }[];
  loading?: boolean;
  placeholder?: string;
}
const RefSelect: React.FC<RefSelectProps> = ({ label, value, onChange, options, loading, placeholder }) => {
  const [open, setOpen] = useState(false);
  const selected = options.find(o => o.id === value);
  return (
    <div className="relative">
      <label className="text-[10px] text-gray-400 block mb-0.5">{label}</label>
      <button type="button" onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-2.5 py-2 border border-gray-200 dark:border-slate-600 rounded-xl text-xs bg-white dark:bg-slate-700 hover:border-[#2c5173]/40 focus:ring-2 focus:ring-[#2c5173] transition-colors">
        {loading ? (
          <span className="flex items-center gap-1.5 text-gray-400"><Loader2 className="w-3 h-3 animate-spin" /> Loading…</span>
        ) : selected ? (
          <span className="flex items-center gap-1.5 font-medium text-gray-800 dark:text-white truncate">
            <Check className="w-3 h-3 text-[#2c5173] flex-shrink-0" />
            <span className="truncate">{selected.label}</span>
          </span>
        ) : (
          <span className="text-gray-400 dark:text-slate-400">{placeholder ?? `Select ${label}`}</span>
        )}
        <ChevronDown className={`w-3 h-3 text-gray-400 flex-shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute z-20 left-0 right-0 mt-1 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-xl shadow-lg max-h-44 overflow-y-auto">
          <button type="button" onClick={() => { onChange(''); setOpen(false); }}
            className="w-full text-left px-3 py-2 text-xs text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-700 border-b border-gray-100 dark:border-slate-700">
            — None —
          </button>
          {options.length === 0 && !loading && (
            <div className="px-3 py-2 text-xs text-gray-400 text-center">No records found</div>
          )}
          {options.map(o => (
            <button key={o.id} type="button" onClick={() => { onChange(o.id); setOpen(false); }}
              className={`w-full text-left px-3 py-2 hover:bg-[#2c5173]/5 dark:hover:bg-slate-700 transition-colors ${value === o.id ? 'bg-[#2c5173]/5' : ''}`}>
              <p className="text-xs font-semibold text-gray-800 dark:text-white truncate">{o.label}</p>
              {o.sub && <p className="text-[10px] text-gray-400 truncate">{o.sub}</p>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const CreateTicketModal: React.FC<Props> = ({ onClose, onCreated }) => {
  const [form, setForm] = useState({
    title: '', description: '', category: 'OTHER', priority: 'MEDIUM',
    location: '', incidentDate: '', additionalNotes: '',
    tripId: '', invoiceId: '', paymentId: '',
  });
  const [autoPriority, setAutoPriority] = useState(true);
  const [attachments, setAttachments] = useState<File[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  const set = (key: string, value: string) => {
    if (key === 'category' && autoPriority) {
      setForm(f => ({ ...f, [key]: value, priority: getDefaultPriority(value) }));
    } else {
      setForm(f => ({ ...f, [key]: value }));
    }
  };

  // Fetch user's trips
  const { data: tripsData, isLoading: tripsLoading } = useQuery({
    queryKey: ['my-trips-for-dispute'],
    queryFn: () => tripsAPI.getAll({ limit: 100 }).then(r => r.data),
    staleTime: 60_000,
  });
  const trips = (tripsData?.data ?? tripsData ?? []) as any[];
  const tripOptions = trips.map((t: any) => ({
    id: t.id,
    label: t.tripNumber ?? t.id.slice(0, 8),
    sub: [t.origin, t.destination].filter(Boolean).join(' → ') || t.status,
  }));

  // Fetch user's invoices
  const { data: invoicesData, isLoading: invoicesLoading } = useQuery({
    queryKey: ['my-invoices-for-dispute'],
    queryFn: () => financialAPI.getInvoices({ limit: 100 }).then(r => r.data),
    staleTime: 60_000,
  });
  const invoices = (invoicesData?.data ?? invoicesData ?? []) as any[];
  const invoiceOptions = invoices.map((inv: any) => ({
    id: inv.id,
    label: inv.invoiceNumber ?? inv.referenceNumber ?? inv.id.slice(0, 8),
    sub: inv.amount != null ? `${inv.currency ?? ''} ${inv.amount}`.trim() : inv.status,
  }));

  // Fetch user's payments
  const { data: paymentsData, isLoading: paymentsLoading } = useQuery({
    queryKey: ['my-payments-for-dispute'],
    queryFn: () => paymentsAPI.getAll({ limit: 100 }).then(r => r.data),
    staleTime: 60_000,
  });
  const payments = (paymentsData?.data ?? paymentsData ?? []) as any[];
  const paymentOptions = payments.map((p: any) => ({
    id: p.id,
    label: p.referenceNumber ?? p.id.slice(0, 8),
    sub: p.amount != null ? `${p.currency ?? ''} ${p.amount} — ${p.status ?? ''}`.trim() : p.status,
  }));

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    setAttachments(prev => {
      const all = [...prev, ...files];
      // max 5 files, 10MB each
      return all.filter(f => f.size <= 10 * 1024 * 1024).slice(0, 5);
    });
    if (fileRef.current) fileRef.current.value = '';
  }, []);

  const removeFile = (idx: number) => setAttachments(prev => prev.filter((_, i) => i !== idx));

  const createMut = useMutation({
    mutationFn: async () => {
      // 1. Create the ticket
      const res = await disputesAPI.create({
        title: form.title,
        description: form.description,
        category: form.category,
        priority: form.priority,
        location: form.location || undefined,
        incidentDate: form.incidentDate || undefined,
        additionalNotes: form.additionalNotes || undefined,
        tripId: form.tripId || undefined,
        invoiceId: form.invoiceId || undefined,
        paymentId: form.paymentId || undefined,
      });
      const disputeId = res.data?.data?.id;
      // 2. Upload attachments if any
      if (disputeId && attachments.length > 0) {
        await Promise.all(
          attachments.map(file => disputesAPI.uploadAttachment(disputeId, file))
        );
      }
      return res;
    },
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

  const formatBytes = (b: number) => b < 1024 * 1024 ? `${(b / 1024).toFixed(0)} KB` : `${(b / (1024 * 1024)).toFixed(1)} MB`;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-start justify-center z-50 p-3 overflow-y-auto">
      <div className="bg-white dark:bg-slate-800 rounded-[24px] w-full max-w-2xl my-6 border border-gray-100 dark:border-slate-700">

        {/* Header */}
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
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-400">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">

          {/* Title */}
          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">Title <span className="text-red-400">*</span></label>
            <input value={form.title} onChange={e => set('title', e.target.value)}
              placeholder="Brief description of the issue..."
              className="w-full px-3 py-2.5 border border-gray-200 dark:border-slate-600 rounded-xl text-sm focus:ring-2 focus:ring-[#2c5173] dark:bg-slate-700 dark:text-white" />
          </div>

          {/* Category & Priority */}
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

          {/* Critical banner */}
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

          {/* Related References — smart dropdowns */}
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Related References <span className="font-normal normal-case tracking-normal text-gray-400">(optional — select from your records)</span></p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <RefSelect
                label="Trip"
                value={form.tripId}
                onChange={v => set('tripId', v)}
                options={tripOptions}
                loading={tripsLoading}
                placeholder="Select a trip"
              />
              <RefSelect
                label="Invoice"
                value={form.invoiceId}
                onChange={v => set('invoiceId', v)}
                options={invoiceOptions}
                loading={invoicesLoading}
                placeholder="Select an invoice"
              />
              <RefSelect
                label="Payment"
                value={form.paymentId}
                onChange={v => set('paymentId', v)}
                options={paymentOptions}
                loading={paymentsLoading}
                placeholder="Select a payment"
              />
            </div>
          </div>

          {/* Proof / Document upload */}
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Supporting Documents <span className="font-normal normal-case tracking-normal text-gray-400">(optional — max 5 files, 10 MB each)</span></p>
            <div
              onClick={() => fileRef.current?.click()}
              className="border-2 border-dashed border-gray-200 dark:border-slate-600 rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer hover:border-[#2c5173]/40 hover:bg-[#2c5173]/5 transition-colors group"
            >
              <Upload className="w-5 h-5 text-gray-300 group-hover:text-[#2c5173] transition-colors mb-1.5" />
              <p className="text-xs text-gray-400 group-hover:text-[#2c5173] transition-colors font-medium">Click to upload proof documents</p>
              <p className="text-[10px] text-gray-300 mt-0.5">Images, PDFs, Word docs accepted</p>
            </div>
            <input ref={fileRef} type="file" multiple accept="image/*,.pdf,.doc,.docx" className="hidden" onChange={handleFileChange} />
            {attachments.length > 0 && (
              <div className="mt-2 space-y-1.5">
                {attachments.map((f, i) => (
                  <div key={i} className="flex items-center gap-2 bg-gray-50 dark:bg-slate-700 rounded-xl px-3 py-2">
                    <FileText className="w-3.5 h-3.5 text-[#2c5173] flex-shrink-0" />
                    <span className="text-xs text-gray-700 dark:text-slate-200 truncate flex-1">{f.name}</span>
                    <span className="text-[10px] text-gray-400 flex-shrink-0">{formatBytes(f.size)}</span>
                    <button type="button" onClick={() => removeFile(i)} className="text-gray-300 hover:text-red-500 transition-colors ml-1">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Additional Notes */}
          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">Additional Notes (optional)</label>
            <textarea value={form.additionalNotes} onChange={e => set('additionalNotes', e.target.value)} rows={2}
              placeholder="Any other information..."
              className="w-full px-3 py-2 border border-gray-200 dark:border-slate-600 rounded-xl text-sm resize-none focus:ring-2 focus:ring-[#2c5173] dark:bg-slate-700 dark:text-white" />
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 bg-gray-50 dark:bg-slate-700/30 border-t border-gray-100 dark:border-slate-700 flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 border border-gray-200 dark:border-slate-600 rounded-xl text-sm font-bold text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700">
            Cancel
          </button>
          <button onClick={() => createMut.mutate()} disabled={!isValid || createMut.isPending}
            className="flex-1 py-2.5 bg-[#2c5173] text-white rounded-xl text-sm font-bold hover:bg-[#1e3a54] disabled:opacity-50 flex items-center justify-center gap-2">
            {createMut.isPending ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> {attachments.length > 0 ? 'Uploading…' : 'Submitting…'}</>
            ) : (
              <><Paperclip className="w-4 h-4" /> Submit Ticket{attachments.length > 0 ? ` + ${attachments.length} file${attachments.length > 1 ? 's' : ''}` : ''}</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateTicketModal;
