import React, { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  FileCheck, CheckCircle2, Clock, AlertTriangle, Download,
  Image, PenTool, User, MapPin, FileText, ChevronDown, ChevronUp,
  Loader2, Receipt,
} from 'lucide-react';
import { tripsAPI } from '../../services/api';
import toast from 'react-hot-toast';
import { StandardDataTable, type Column } from '../EnliteUI/Tables';

interface EpodViewerProps {
  tripId: string;
  tripNumber?: string;
  canConfirm?: boolean; // cargo owner can confirm
}

const statusConfig = {
  PENDING:   { label: 'Awaiting Confirmation', color: 'text-amber-600 bg-amber-50 border-amber-200', icon: Clock },
  CONFIRMED: { label: 'Confirmed',             color: 'text-emerald-600 bg-emerald-50 border-emerald-200', icon: CheckCircle2 },
  DISPUTED:  { label: 'Disputed',              color: 'text-red-600 bg-red-50 border-red-200', icon: AlertTriangle },
};

const invoiceStatusConfig = {
  draft:    { label: 'Draft',    color: 'text-slate-600 bg-slate-50 border-slate-200' },
  sent:     { label: 'Sent',     color: 'text-blue-600 bg-blue-50 border-blue-200' },
  paid:     { label: 'Paid',     color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
  overdue:  { label: 'Overdue',  color: 'text-red-600 bg-red-50 border-red-200' },
  cancelled:{ label: 'Cancelled',color: 'text-slate-400 bg-slate-50 border-slate-200' },
};

interface InvoiceLineItem {
  id: string;
  description: string;
  totalPrice: number;
}

export const EpodViewer: React.FC<EpodViewerProps> = ({ tripId, tripNumber, canConfirm = false }) => {
  const queryClient = useQueryClient();
  const [showInvoice, setShowInvoice] = useState(false);
  const [lightboxPhoto, setLightboxPhoto] = useState<string | null>(null);

  const { data: epodRes, isLoading: epodLoading, error: epodError } = useQuery({
    queryKey: ['epod', tripId],
    queryFn: () => tripsAPI.getEpod(tripId).then(r => r.data),
    retry: false,
  });

  const { data: invoiceRes, isLoading: invoiceLoading } = useQuery({
    queryKey: ['invoice', tripId],
    queryFn: () => tripsAPI.getInvoice(tripId).then(r => r.data),
    retry: false,
    enabled: !!epodRes?.data,
  });

  const confirmMutation = useMutation({
    mutationFn: () => tripsAPI.confirmEpod(tripId),
    onSuccess: () => {
      toast.success('ePOD confirmed successfully!');
      queryClient.invalidateQueries({ queryKey: ['epod', tripId] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to confirm ePOD');
    },
  });

  const invoice = invoiceRes?.data;

  const invoiceLineItemColumns = useMemo<Column<InvoiceLineItem>[]>(() => [
    {
      key: 'description',
      label: 'Description',
      render: (_value, row) => <span className="text-slate-700">{row.description}</span>,
    },
    {
      key: 'totalPrice',
      label: 'Amount',
      align: 'right',
      render: (_value, row) => (
        <span className="font-semibold text-slate-800">
          {invoice?.currency}{' '}
          {Number(row.totalPrice).toLocaleString('en-US', { minimumFractionDigits: 2 })}
        </span>
      ),
    },
  ], [invoice?.currency]);

  if (epodLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
      </div>
    );
  }

  if (epodError || !epodRes?.data) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center mb-4">
          <FileCheck className="w-7 h-7 text-slate-400" />
        </div>
        <p className="text-sm font-semibold text-slate-600">No ePOD submitted yet</p>
        <p className="text-xs text-slate-400 mt-1">The driver hasn't submitted proof of delivery for this trip.</p>
      </div>
    );
  }

  const epod = epodRes.data;
  const statusCfg = statusConfig[epod.status as keyof typeof statusConfig] || statusConfig.PENDING;
  const StatusIcon = statusCfg.icon;

  const apiBase = (import.meta as any).env?.VITE_API_BASE_URL?.replace('/api', '') || 'http://localhost:3005';

  return (
    <div className="space-y-4">
      {/* ePOD Header */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <FileCheck size={18} />
            </div>
            <div>
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Electronic Proof of Delivery</p>
              <p className="text-sm font-bold text-slate-800">{tripNumber || `Trip ${tripId.slice(0, 8)}`}</p>
            </div>
          </div>
          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${statusCfg.color}`}>
            <StatusIcon size={12} />
            {statusCfg.label}
          </span>
        </div>

        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Recipient */}
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center flex-shrink-0">
              <User size={15} className="text-slate-500" />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Recipient</p>
              <p className="text-sm font-semibold text-slate-800">{epod.recipientName}</p>
              {epod.recipientPhone && <p className="text-xs text-slate-500">{epod.recipientPhone}</p>}
            </div>
          </div>

          {/* Submitted at */}
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center flex-shrink-0">
              <Clock size={15} className="text-slate-500" />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Submitted</p>
              <p className="text-sm font-semibold text-slate-800">
                {new Date(epod.submittedAt).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}
              </p>
            </div>
          </div>

          {/* Location */}
          {epod.deliveryCoordinates && (
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center flex-shrink-0">
                <MapPin size={15} className="text-slate-500" />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">GPS Location</p>
                <p className="text-sm font-semibold text-slate-800">
                  {epod.deliveryCoordinates.latitude.toFixed(5)}, {epod.deliveryCoordinates.longitude.toFixed(5)}
                </p>
                <a
                  href={`https://maps.google.com/?q=${epod.deliveryCoordinates.latitude},${epod.deliveryCoordinates.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[10px] text-blue-600 hover:underline"
                >
                  View on map →
                </a>
              </div>
            </div>
          )}

          {/* Odometer */}
          {epod.odometerReading && (
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-black text-slate-500">km</span>
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Odometer</p>
                <p className="text-sm font-semibold text-slate-800">{epod.odometerReading}</p>
              </div>
            </div>
          )}
        </div>

        {/* Notes */}
        {epod.deliveryNotes && (
          <div className="px-6 pb-4">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Delivery Notes</p>
            <p className="text-sm text-slate-600 bg-slate-50 rounded-xl p-3 border border-slate-100">{epod.deliveryNotes}</p>
          </div>
        )}

        {/* Signature */}
        {epod.signatureFileUrl && (
          <div className="px-6 pb-4">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
              <PenTool size={11} /> Recipient Signature
            </p>
            <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 inline-block">
              <img
                src={`${apiBase}${epod.signatureFileUrl}`}
                alt="Recipient signature"
                className="max-h-24 object-contain"
              />
            </div>
          </div>
        )}

        {/* Photos */}
        {epod.photoUrls?.length > 0 && (
          <div className="px-6 pb-4">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
              <Image size={11} /> Delivery Photos ({epod.photoUrls.length})
            </p>
            <div className="flex gap-2 flex-wrap">
              {epod.photoUrls.map((url: string, i: number) => (
                <button
                  key={i}
                  onClick={() => setLightboxPhoto(`${apiBase}${url}`)}
                  className="w-20 h-20 rounded-xl overflow-hidden border border-slate-100 hover:border-blue-300 transition-colors"
                >
                  <img src={`${apiBase}${url}`} alt={`Photo ${i + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Confirm button */}
        {canConfirm && epod.status === 'PENDING' && (
          <div className="px-6 pb-6">
            <button
              onClick={() => confirmMutation.mutate()}
              disabled={confirmMutation.isPending}
              className="w-full h-11 rounded-xl bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-700 transition-all flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {confirmMutation.isPending ? (
                <><Loader2 size={15} className="animate-spin" /> Confirming...</>
              ) : (
                <><CheckCircle2 size={15} /> Confirm Delivery Receipt</>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Invoice section */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <button
          onClick={() => setShowInvoice(v => !v)}
          className="w-full flex items-center justify-between px-6 py-4 hover:bg-slate-50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Receipt size={18} />
            </div>
            <div className="text-left">
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Auto-Generated Invoice</p>
              {invoice ? (
                <p className="text-sm font-bold text-slate-800">{invoice.invoiceNumber}</p>
              ) : (
                <p className="text-sm text-slate-400">{invoiceLoading ? 'Loading...' : 'Not yet generated'}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            {invoice && (
              <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border ${
                invoiceStatusConfig[invoice.status as keyof typeof invoiceStatusConfig]?.color || 'text-slate-500 bg-slate-50 border-slate-200'
              }`}>
                {invoiceStatusConfig[invoice.status as keyof typeof invoiceStatusConfig]?.label || invoice.status}
              </span>
            )}
            {showInvoice ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
          </div>
        </button>

        {showInvoice && invoice && (
          <div className="border-t border-slate-50 p-6 space-y-4">
            {/* Invoice header */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Bill To</p>
                <p className="font-semibold text-slate-800">{invoice.customerName}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Due Date</p>
                <p className="font-semibold text-slate-800">
                  {new Date(invoice.dueDate).toLocaleDateString('en-US', { dateStyle: 'medium' })}
                </p>
              </div>
            </div>

            {/* Line items */}
            <div className="bg-slate-50 rounded-xl overflow-hidden border border-slate-100">
              <StandardDataTable<InvoiceLineItem>
                embedded
                dense
                searchable={false}
                pagination={false}
                sortable={false}
                columnVisibility={false}
                columns={invoiceLineItemColumns}
                data={invoice.items ?? []}
                getRowId={(row) => row.id}
                emptyMessage="No line items"
                ariaLabel="Invoice line items"
                hoverable={false}
              />
              <div className="border-t border-slate-100 bg-white text-sm">
                {invoice.taxAmount > 0 && (
                  <div className="flex justify-between px-4 py-2.5 text-xs text-slate-500 border-b border-slate-100">
                    <span>Tax</span>
                    <span className="text-slate-600">
                      {invoice.currency}{' '}
                      {Number(invoice.taxAmount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                )}
                <div className="flex justify-between px-4 py-3 border-t-2 border-slate-200">
                  <span className="font-black text-slate-900">Total</span>
                  <span className="font-black text-blue-600 text-base">
                    {invoice.currency}{' '}
                    {Number(invoice.totalAmount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>

            {invoice.notes && (
              <p className="text-xs text-slate-500 bg-slate-50 rounded-xl p-3 border border-slate-100">{invoice.notes}</p>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => window.print()}
                className="flex-1 h-10 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
              >
                <Download size={14} /> Download / Print
              </button>
            </div>
          </div>
        )}

        {showInvoice && !invoice && !invoiceLoading && (
          <div className="border-t border-slate-50 px-6 py-8 text-center">
            <p className="text-sm text-slate-400">Invoice will be generated automatically when the ePOD is submitted.</p>
          </div>
        )}
      </div>

      {/* Photo lightbox */}
      {lightboxPhoto && (
        <div
          className="fixed inset-0 z-[9999] bg-black/90 flex items-center justify-center p-4"
          onClick={() => setLightboxPhoto(null)}
        >
          <img src={lightboxPhoto} alt="Delivery photo" className="max-w-full max-h-full rounded-xl object-contain" />
        </div>
      )}
    </div>
  );
};
