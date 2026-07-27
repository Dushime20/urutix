import React, { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  X, MessageSquare, Paperclip, Clock, FileText,
  Upload, Send, Eye, Info, Scale, Hash, Gavel,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { disputesAPI } from '../../../services/api';
import { buildFileUrl } from '../../../utils/fileUrl';
import {
  type Dispute, type DisputeMessage, type DisputeAttachment,
  type DisputeResolution, type DisputeTimeline,
  STATUS_LABELS, CATEGORY_LABELS, PRIORITY_LABELS, DECISION_LABELS,
  getStatusColor, getPriorityColor,   getUserDisplayName, formatRelativeTime,
  asArray,
} from '../../../types/dispute';

interface Props { disputeId: string; onClose: () => void; }

type Tab = 'overview' | 'messages' | 'attachments' | 'timeline' | 'resolution';

const UserDisputeDetailModal: React.FC<Props> = ({ disputeId, onClose }) => {
  const qc = useQueryClient();
  const [tab, setTab] = useState<Tab>('overview');
  const [comment, setComment] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const { data: disputeData, isLoading } = useQuery({
    queryKey: ['dispute-user', disputeId],
    queryFn: () => disputesAPI.getById(disputeId).then(r => r.data),
  });
  const { data: commentsData } = useQuery({
    queryKey: ['dispute-comments-user', disputeId],
    queryFn: () => disputesAPI.getComments(disputeId).then(r => r.data),
    enabled: tab === 'messages',
  });
  const { data: attachmentsData } = useQuery({
    queryKey: ['dispute-attachments-user', disputeId],
    queryFn: () => disputesAPI.getAttachments(disputeId).then(r => r.data),
    enabled: tab === 'attachments',
  });
  const { data: timelineData } = useQuery({
    queryKey: ['dispute-timeline-user', disputeId],
    queryFn: () => disputesAPI.getTimeline(disputeId).then(r => r.data),
    enabled: tab === 'timeline',
  });
  const { data: resolutionsData } = useQuery({
    queryKey: ['dispute-resolutions-user', disputeId],
    queryFn: () => disputesAPI.getResolutions(disputeId).then(r => r.data),
    enabled: tab === 'resolution',
  });

  const dispute: Dispute | null         = disputeData?.data  ?? null;
  const comments: DisputeMessage[]      = asArray(commentsData?.data);
  const attachments: DisputeAttachment[] = asArray(attachmentsData?.data);
  const timeline: DisputeTimeline[]     = asArray(timelineData?.data);
  const resolutions: DisputeResolution[] = asArray(resolutionsData?.data);

  const addCommentMut = useMutation({
    mutationFn: () => disputesAPI.addComment(disputeId, { message: comment }),
    onSuccess: () => { setComment(''); qc.invalidateQueries({ queryKey: ['dispute-comments-user', disputeId] }); toast.success('Comment sent'); },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? 'Failed to send'),
  });

  const uploadMut = useMutation({
    mutationFn: (file: File) => disputesAPI.uploadAttachment(disputeId, file),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['dispute-attachments-user', disputeId] }); toast.success('File uploaded'); },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? 'Upload failed'),
  });

  const isClosed = dispute && ['CLOSED', 'RESOLVED', 'REJECTED'].includes(dispute.status);

  const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'overview',    label: 'Overview',   icon: <Info size={13} /> },
    { id: 'messages',    label: 'Messages',   icon: <MessageSquare size={13} /> },
    { id: 'attachments', label: 'Evidence',   icon: <Paperclip size={13} /> },
    { id: 'timeline',    label: 'Timeline',   icon: <Clock size={13} /> },
    { id: 'resolution',  label: 'Resolution', icon: <Scale size={13} /> },
  ];

  if (isLoading || !dispute) return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-8 flex items-center gap-3">
        <div className="w-5 h-5 border-2 border-[#2c5173] border-t-transparent rounded-full animate-spin" />
        <span className="text-sm font-medium">Loading…</span>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-start justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-[24px] w-full max-w-2xl my-8 border border-gray-100">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-red-50 rounded-xl flex items-center justify-center">
              <Gavel className="w-4 h-4 text-red-500" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-sm font-black text-gray-900">{dispute.title}</h2>
                <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black border ${getStatusColor(dispute.status)}`}>{STATUS_LABELS[dispute.status]}</span>
              </div>
              <p className="text-[10px] text-gray-400 font-mono mt-0.5">{dispute.referenceNumber}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tabs */}
        <div className="px-6 border-b border-gray-100 flex gap-1 overflow-x-auto">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 px-4 py-3 text-xs font-bold border-b-2 transition-colors whitespace-nowrap
                ${tab === t.id ? 'border-[#2c5173] text-[#2c5173]' : 'border-transparent text-gray-400 hover:text-gray-600'}`}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {tab === 'overview' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Category', value: CATEGORY_LABELS[dispute.category] },
                  { label: 'Priority',  value: PRIORITY_LABELS[dispute.priority] },
                  { label: 'Trip',      value: dispute.trip?.tripNumber ?? 'N/A' },
                  { label: 'Created',   value: formatRelativeTime(dispute.createdAt) },
                ].map(({ label, value }) => (
                  <div key={label} className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-0.5">{label}</p>
                    <p className="text-sm font-bold text-gray-900">{value}</p>
                  </div>
                ))}
              </div>
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Description</p>
                <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{dispute.description}</p>
              </div>
              {isClosed && (
                <div className="bg-amber-50 rounded-xl p-3 border border-amber-200 text-xs text-amber-800 font-medium">
                  This dispute is {STATUS_LABELS[dispute.status].toLowerCase()}. No further actions can be taken.
                </div>
              )}
            </div>
          )}

          {tab === 'messages' && (
            <div className="space-y-3">
              {comments.length === 0 && <p className="text-sm text-gray-400 text-center py-8">No messages yet. Start the conversation.</p>}
              {comments.map(msg => (
                <div key={msg.id} className="flex gap-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-600 flex-shrink-0">
                    {getUserDisplayName(msg.sender).charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 bg-gray-50 rounded-xl p-3 border border-gray-100">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold text-gray-900">{getUserDisplayName(msg.sender)}</span>
                      <span className="text-[10px] text-gray-400 ml-auto">{formatRelativeTime(msg.createdAt)}</span>
                    </div>
                    <p className="text-sm text-gray-700">{msg.message}</p>
                  </div>
                </div>
              ))}
              {!isClosed && (
                <div className="border-t border-gray-100 pt-4 mt-4">
                  <textarea value={comment} onChange={e => setComment(e.target.value)} rows={3}
                    placeholder="Write a message or response…"
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm resize-none focus:ring-2 focus:ring-[#2c5173] focus:border-transparent" />
                  <div className="flex justify-end mt-2">
                    <button onClick={() => addCommentMut.mutate()} disabled={!comment.trim() || addCommentMut.isPending}
                      className="px-4 py-2 bg-[#2c5173] text-white rounded-xl text-xs font-bold hover:bg-[#1e3a54] flex items-center gap-2 disabled:opacity-50">
                      {addCommentMut.isPending ? <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" /> : <Send size={12} />}
                      Send
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {tab === 'attachments' && (
            <div className="space-y-3">
              {!isClosed && (
                <div className="border-2 border-dashed border-gray-200 rounded-xl p-5 text-center">
                  <Upload className="w-7 h-7 text-gray-300 mx-auto mb-2" />
                  <p className="text-xs text-gray-500 mb-3">Upload photos, PDFs, or documents as evidence</p>
                  <input ref={fileRef} type="file" className="hidden" onChange={e => { if (e.target.files?.[0]) uploadMut.mutate(e.target.files[0]); }} />
                  <button onClick={() => fileRef.current?.click()} className="px-4 py-2 bg-[#2c5173] text-white rounded-xl text-xs font-bold hover:bg-[#1e3a54]">
                    {uploadMut.isPending ? 'Uploading…' : 'Choose File'}
                  </button>
                </div>
              )}
              {attachments.length === 0 && <p className="text-xs text-gray-400 text-center py-4">No files uploaded yet.</p>}
              {attachments.map(att => (
                <div key={att.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <FileText className="w-7 h-7 text-gray-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-900 truncate">{att.fileName}</p>
                    <p className="text-[10px] text-gray-400">{formatRelativeTime(att.createdAt)}</p>
                  </div>
                  <a href={buildFileUrl(att.fileUrl)} target="_blank" rel="noreferrer"
                    className="px-3 py-1.5 bg-white border border-gray-200 text-gray-700 rounded-lg text-xs font-bold hover:bg-gray-50 flex items-center gap-1">
                    <Eye size={11} /> View
                  </a>
                </div>
              ))}
            </div>
          )}

          {tab === 'timeline' && (
            <div className="space-y-3">
              {timeline.length === 0 && <p className="text-sm text-gray-400 text-center py-8">No timeline yet.</p>}
              {timeline.map((entry, i) => (
                <div key={i} className="flex gap-3">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${entry.type === 'audit' ? 'bg-blue-50 text-blue-600' : 'bg-green-50 text-green-600'}`}>
                    {entry.type === 'audit' ? <Hash size={12} /> : <MessageSquare size={12} />}
                  </div>
                  <div className="flex-1 bg-gray-50 rounded-xl p-3 border border-gray-100">
                    {entry.type === 'audit'
                      ? <p className="text-xs font-bold text-gray-900">{entry.data.action?.replace(/_/g, ' ')}</p>
                      : <p className="text-xs text-gray-700">{entry.data.message}</p>}
                    <p className="text-[10px] text-gray-400 mt-1">{formatRelativeTime(entry.timestamp)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {tab === 'resolution' && (
            <div className="space-y-4">
              {resolutions.length === 0 ? (
                <div className="text-center py-8">
                  <Scale className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                  <p className="text-sm text-gray-400">No resolution yet. The Tenant Admin will review and resolve this dispute.</p>
                </div>
              ) : resolutions.map(res => (
                <div key={res.id} className="bg-green-50 rounded-xl p-4 border border-green-200">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-sm font-black text-green-800">{DECISION_LABELS[res.decision]}</span>
                    <span className="text-[10px] text-green-600 ml-auto">{formatRelativeTime(res.resolvedAt)}</span>
                  </div>
                  <p className="text-sm text-green-700">{res.resolutionSummary}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserDisputeDetailModal;
