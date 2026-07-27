import React, { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  X, MessageSquare, Paperclip, Scale, CheckCircle, RotateCcw,
  XCircle, AlertTriangle, Clock, FileText, Upload, ChevronDown,
  Send, Eye, Info, Headphones, Hash, ArrowUp, Users, Timer,
  Shield, TrendingUp,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { disputesAPI } from '../../services/api';
import { buildFileUrl } from '../../utils/fileUrl';
import {
  type Dispute, type DisputeMessage, type DisputeAttachment,
  type DisputeResolution, type DisputeTimeline,
  STATUS_LABELS, CATEGORY_LABELS, PRIORITY_LABELS, DECISION_LABELS,
  ASSIGNEE_ROLE_LABELS, ESCALATION_REASON_LABELS,
  getStatusColor, getPriorityColor, getPriorityDot, getSlaStatus,
  getUserDisplayName, formatRelativeTime,
  asArray,
} from '../../types/dispute';
import { useAuth } from '../../contexts/AuthContext';

interface Props { disputeId: string; isAdmin?: boolean; onClose: () => void; }
type Tab = 'overview' | 'messages' | 'attachments' | 'timeline' | 'resolution' | 'assignment';

const RESOLVER_ROLES = ['SUPER_ADMIN', 'TENANT_ADMIN'];
const ELEVATED_ROLES = ['SUPER_ADMIN', 'ADMIN', 'TENANT_ADMIN'];

const SupportTicketDetailModal: React.FC<Props> = ({ disputeId, isAdmin = false, onClose }) => {
  const { user } = useAuth();
  const qc = useQueryClient();
  const isElevated = ELEVATED_ROLES.includes(user?.role ?? '');
  const isResolver = RESOLVER_ROLES.includes(user?.role ?? '');

  const [tab, setTab]               = useState<Tab>('overview');
  const [comment, setComment]       = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const [showResolve, setShowResolve]     = useState(false);
  const [showStatus, setShowStatus]       = useState(false);
  const [showAssign, setShowAssign]       = useState(false);
  const [showEscalate, setShowEscalate]   = useState(false);
  const [resolveDecision, setResolveDecision] = useState('FAVOR_COMPLAINANT');
  const [resolveSummary, setResolveSummary]   = useState('');
  const [resolveNotes, setResolveNotes]       = useState('');
  const [newStatus, setNewStatus]     = useState('');
  const [statusReason, setStatusReason] = useState('');
  const [assigneeId, setAssigneeId]   = useState('');
  const [assigneeRole, setAssigneeRole] = useState('');
  const [assignNotes, setAssignNotes] = useState('');
  const [escReason, setEscReason]     = useState('MANUAL');
  const [escNotes, setEscNotes]       = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const { data: disputeData, isLoading } = useQuery({
    queryKey: ['dispute', disputeId],
    queryFn: () => disputesAPI.getById(disputeId).then(r => r.data),
  });
  const { data: commentsData, refetch: refetchComments } = useQuery({
    queryKey: ['dispute-comments', disputeId],
    queryFn: () => disputesAPI.getComments(disputeId).then(r => r.data),
    enabled: tab === 'messages',
  });
  const { data: attachmentsData } = useQuery({
    queryKey: ['dispute-attachments', disputeId],
    queryFn: () => disputesAPI.getAttachments(disputeId).then(r => r.data),
    enabled: tab === 'attachments',
  });
  const { data: timelineData } = useQuery({
    queryKey: ['dispute-timeline', disputeId],
    queryFn: () => disputesAPI.getTimeline(disputeId).then(r => r.data),
    enabled: tab === 'timeline',
  });
  const { data: resolutionsData } = useQuery({
    queryKey: ['dispute-resolutions', disputeId],
    queryFn: () => disputesAPI.getResolutions(disputeId).then(r => r.data),
    enabled: tab === 'resolution',
  });
  const { data: assignmentsData } = useQuery({
    queryKey: ['dispute-assignments', disputeId],
    queryFn: () => disputesAPI.getAssignments(disputeId).then(r => r.data),
    enabled: tab === 'assignment' && isElevated,
  });

  const dispute: Dispute | null         = disputeData?.data ?? null;
  const comments: DisputeMessage[]      = asArray(commentsData?.data);
  const attachments: DisputeAttachment[] = asArray(attachmentsData?.data);
  const timeline: DisputeTimeline[]     = asArray(timelineData?.data);
  const resolutions: DisputeResolution[] = asArray(resolutionsData?.data);
  const assignments: any[]              = asArray(assignmentsData?.data);

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['dispute', disputeId] });
    qc.invalidateQueries({ queryKey: ['support-admin'] });
    qc.invalidateQueries({ queryKey: ['my-disputes'] });
  };

  const addCommentMut = useMutation({
    mutationFn: () => disputesAPI.addComment(disputeId, { message: comment, isInternal }),
    onSuccess: () => { setComment(''); refetchComments(); toast.success('Comment added'); },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? 'Failed'),
  });
  const uploadMut = useMutation({
    mutationFn: (file: File) => disputesAPI.uploadAttachment(disputeId, file),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['dispute-attachments', disputeId] }); toast.success('File uploaded'); },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? 'Upload failed'),
  });
  const resolveMut  = useMutation({ mutationFn: () => disputesAPI.resolve(disputeId, { decision: resolveDecision, resolutionSummary: resolveSummary, adminNotes: resolveNotes }), onSuccess: () => { setShowResolve(false); invalidate(); toast.success('Ticket resolved'); }, onError: (e: any) => toast.error(e?.response?.data?.message ?? 'Failed') });
  const closeMut    = useMutation({ mutationFn: () => disputesAPI.close(disputeId), onSuccess: () => { invalidate(); toast.success('Ticket closed'); }, onError: (e: any) => toast.error(e?.response?.data?.message ?? 'Failed') });
  const reopenMut   = useMutation({ mutationFn: () => disputesAPI.reopen(disputeId, 'Admin reopened'), onSuccess: () => { invalidate(); toast.success('Ticket reopened'); }, onError: (e: any) => toast.error(e?.response?.data?.message ?? 'Failed') });
  const statusMut   = useMutation({ mutationFn: () => disputesAPI.changeStatus(disputeId, newStatus, statusReason), onSuccess: () => { setShowStatus(false); invalidate(); toast.success('Status updated'); }, onError: (e: any) => toast.error(e?.response?.data?.message ?? 'Failed') });
  const assignMut   = useMutation({ mutationFn: () => disputesAPI.assign(disputeId, { assignedToUserId: assigneeId, assignedRole: assigneeRole || undefined, notes: assignNotes }), onSuccess: () => { setShowAssign(false); invalidate(); toast.success('Ticket assigned'); }, onError: (e: any) => toast.error(e?.response?.data?.message ?? 'Failed') });
  const escalateMut = useMutation({ mutationFn: () => disputesAPI.escalate(disputeId, { reason: escReason, notes: escNotes }), onSuccess: () => { setShowEscalate(false); invalidate(); toast.success('Ticket escalated'); }, onError: (e: any) => toast.error(e?.response?.data?.message ?? 'Failed') });

  const isClosed = dispute && ['CLOSED', 'RESOLVED', 'REJECTED'].includes(dispute.status);

  const TABS: { id: Tab; label: string; icon: React.ReactNode; adminOnly?: boolean }[] = [
    { id: 'overview',    label: 'Overview',    icon: <Info size={13} /> },
    { id: 'messages',    label: 'Messages',    icon: <MessageSquare size={13} /> },
    { id: 'attachments', label: 'Evidence',    icon: <Paperclip size={13} /> },
    { id: 'timeline',    label: 'Activity',    icon: <Clock size={13} /> },
    { id: 'resolution',  label: 'Resolution',  icon: <Scale size={13} /> },
    { id: 'assignment',  label: 'Assignment',  icon: <Users size={13} />, adminOnly: true },
  ];

  if (isLoading || !dispute) return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 flex items-center gap-3">
        <div className="w-5 h-5 border-2 border-[#2c5173] border-t-transparent rounded-full animate-spin" />
        <span className="text-sm font-medium dark:text-white">Loading ticket…</span>
      </div>
    </div>
  );

  const slaStatus = getSlaStatus(dispute);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-start justify-center z-50 p-3 overflow-y-auto">
      <div className="bg-white dark:bg-slate-800 rounded-[24px] w-full max-w-4xl my-6 border border-gray-100 dark:border-slate-700 flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between px-5 py-4 border-b border-gray-100 dark:border-slate-700">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-[#2c5173]/10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5">
              <Headphones className="w-5 h-5 text-[#2c5173]" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-sm font-black text-gray-900 dark:text-white">{dispute.title}</h2>
                <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black border ${getStatusColor(dispute.status)}`}>{STATUS_LABELS[dispute.status]}</span>
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-black border ${getPriorityColor(dispute.priority)}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${getPriorityDot(dispute.priority)}`} />
                  {PRIORITY_LABELS[dispute.priority]}
                </span>
                {slaStatus !== 'ok' && (
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-black border ${slaStatus === 'breached' ? 'bg-red-50 text-red-600 border-red-200' : 'bg-amber-50 text-amber-600 border-amber-200'}`}>
                    <Timer size={10} /> {slaStatus === 'breached' ? 'SLA BREACH' : 'SLA WARNING'}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-gray-400 font-mono mt-0.5">{dispute.ticketNumber ?? dispute.referenceNumber}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-400 flex-shrink-0"><X className="w-4 h-4" /></button>
        </div>

        {/* Admin action bar */}
        {isElevated && (
          <div className="px-5 py-2 border-b border-gray-100 dark:border-slate-700 bg-gray-50/70 dark:bg-slate-700/30 flex flex-wrap gap-1.5">
            {isResolver && !isClosed && (<>
              <button onClick={() => setShowResolve(true)} className="px-2.5 py-1.5 bg-green-600 text-white rounded-lg text-[11px] font-bold hover:bg-green-700 flex items-center gap-1"><CheckCircle size={11} /> Resolve</button>
              <button onClick={() => setShowStatus(true)} className="px-2.5 py-1.5 bg-[#2c5173] text-white rounded-lg text-[11px] font-bold hover:bg-[#1e3a54] flex items-center gap-1"><ChevronDown size={11} /> Status</button>
              <button onClick={() => setShowAssign(true)} className="px-2.5 py-1.5 bg-cyan-600 text-white rounded-lg text-[11px] font-bold hover:bg-cyan-700 flex items-center gap-1"><Users size={11} /> Assign</button>
              <button onClick={() => setShowEscalate(true)} className="px-2.5 py-1.5 bg-orange-500 text-white rounded-lg text-[11px] font-bold hover:bg-orange-600 flex items-center gap-1"><ArrowUp size={11} /> Escalate</button>
              <button onClick={() => closeMut.mutate()} className="px-2.5 py-1.5 bg-gray-600 text-white rounded-lg text-[11px] font-bold hover:bg-gray-700 flex items-center gap-1"><XCircle size={11} /> Close</button>
            </>)}
            {isResolver && isClosed && (
              <button onClick={() => reopenMut.mutate()} className="px-2.5 py-1.5 bg-indigo-600 text-white rounded-lg text-[11px] font-bold hover:bg-indigo-700 flex items-center gap-1"><RotateCcw size={11} /> Reopen</button>
            )}
            {!isResolver && <span className="text-[11px] text-gray-400 italic self-center">View only — Tenant Admin can take action</span>}
          </div>
        )}

        {/* Tabs */}
        <div className="px-5 border-b border-gray-100 dark:border-slate-700 flex gap-0.5 overflow-x-auto">
          {TABS.filter(t => !t.adminOnly || isElevated).map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 px-3 py-3 text-[11px] font-bold border-b-2 transition-colors whitespace-nowrap ${tab === t.id ? 'border-[#2c5173] text-[#2c5173]' : 'border-transparent text-gray-400 hover:text-gray-600 dark:hover:text-slate-300'}`}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-5 flex-1 overflow-y-auto max-h-[60vh]">
          {/* Overview */}
          {tab === 'overview' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {[
                  { label: 'Ticket #',    value: dispute.ticketNumber ?? dispute.referenceNumber },
                  { label: 'Category',    value: CATEGORY_LABELS[dispute.category] },
                  { label: 'Reporter',    value: getUserDisplayName(dispute.complainant) },
                  { label: 'Assigned To', value: getUserDisplayName(dispute.assignedTo) },
                  { label: 'Location',    value: dispute.location ?? '—' },
                  { label: 'Incident',    value: dispute.incidentDate ? new Date(dispute.incidentDate).toLocaleDateString() : '—' },
                  { label: 'Created',     value: formatRelativeTime(dispute.createdAt) },
                  { label: 'Updated',     value: formatRelativeTime(dispute.updatedAt) },
                  { label: 'SLA Due',     value: dispute.slaResolutionDue ? new Date(dispute.slaResolutionDue).toLocaleString() : '—' },
                ].map(({ label, value }) => (
                  <div key={label} className="bg-gray-50 dark:bg-slate-700/50 rounded-xl p-3 border border-gray-100 dark:border-slate-600">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{label}</p>
                    <p className="text-xs font-bold text-gray-900 dark:text-white truncate">{value}</p>
                  </div>
                ))}
              </div>
              <div className="bg-gray-50 dark:bg-slate-700/50 rounded-xl p-4 border border-gray-100 dark:border-slate-600">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Description</p>
                <p className="text-xs text-gray-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">{dispute.description}</p>
              </div>
              {dispute.additionalNotes && (
                <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-4 border border-amber-200 dark:border-amber-700">
                  <p className="text-[10px] font-black uppercase tracking-widest text-amber-600 mb-2">Additional Notes</p>
                  <p className="text-xs text-amber-800 dark:text-amber-200 leading-relaxed">{dispute.additionalNotes}</p>
                </div>
              )}
            </div>
          )}

          {/* Messages */}
          {tab === 'messages' && (
            <div className="space-y-3">
              {comments.length === 0 && <div className="text-center py-10"><MessageSquare className="w-8 h-8 text-gray-200 mx-auto mb-2" /><p className="text-xs text-gray-400">No messages yet.</p></div>}
              {comments.map(msg => (
                <div key={msg.id} className={`flex gap-3 ${msg.isInternal ? 'opacity-90' : ''}`}>
                  <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-[11px] font-black text-slate-600 dark:text-slate-300 flex-shrink-0">
                    {getUserDisplayName(msg.sender).charAt(0).toUpperCase()}
                  </div>
                  <div className={`flex-1 rounded-xl p-3 border ${msg.isInternal ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-700' : 'bg-gray-50 dark:bg-slate-700/50 border-gray-100 dark:border-slate-600'}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[11px] font-black text-gray-900 dark:text-white">{getUserDisplayName(msg.sender)}</span>
                      {msg.isInternal && <span className="text-[9px] bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300 px-1.5 py-0.5 rounded font-black">INTERNAL</span>}
                      <span className="text-[10px] text-gray-400 ml-auto">{formatRelativeTime(msg.createdAt)}</span>
                    </div>
                    <p className="text-xs text-gray-700 dark:text-slate-300">{msg.message}</p>
                  </div>
                </div>
              ))}
              {!isClosed && (
                <div className="border-t border-gray-100 dark:border-slate-700 pt-3 mt-3">
                  <textarea value={comment} onChange={e => setComment(e.target.value)} rows={3} placeholder="Write a reply..."
                    className="w-full px-3 py-2 border border-gray-200 dark:border-slate-600 rounded-xl text-xs resize-none focus:ring-2 focus:ring-[#2c5173] dark:bg-slate-700 dark:text-white" />
                  <div className="flex items-center justify-between mt-2">
                    {isElevated && (
                      <label className="flex items-center gap-2 text-[11px] font-medium text-gray-600 dark:text-slate-300 cursor-pointer">
                        <input type="checkbox" checked={isInternal} onChange={e => setIsInternal(e.target.checked)} className="w-3.5 h-3.5 accent-amber-500" />
                        Internal note (admin only)
                      </label>
                    )}
                    <button onClick={() => addCommentMut.mutate()} disabled={!comment.trim() || addCommentMut.isPending}
                      className="ml-auto px-3 py-2 bg-[#2c5173] text-white rounded-xl text-[11px] font-bold hover:bg-[#1e3a54] flex items-center gap-1.5 disabled:opacity-50">
                      {addCommentMut.isPending ? <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" /> : <Send size={11} />} Send
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Attachments */}
          {tab === 'attachments' && (
            <div className="space-y-3">
              {!isClosed && (
                <div className="border-2 border-dashed border-gray-200 dark:border-slate-600 rounded-xl p-5 text-center">
                  <Upload className="w-7 h-7 text-gray-300 mx-auto mb-2" />
                  <p className="text-xs text-gray-500 dark:text-slate-400 mb-2">Upload evidence (images, PDFs, videos, documents)</p>
                  <input ref={fileRef} type="file" className="hidden" accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.mp4" onChange={e => { if (e.target.files?.[0]) uploadMut.mutate(e.target.files[0]); }} />
                  <button onClick={() => fileRef.current?.click()} className="px-4 py-2 bg-[#2c5173] text-white rounded-xl text-xs font-bold hover:bg-[#1e3a54]">{uploadMut.isPending ? 'Uploading…' : 'Choose File'}</button>
                </div>
              )}
              {attachments.length === 0 && <div className="text-center py-6"><Paperclip className="w-7 h-7 text-gray-200 mx-auto mb-2" /><p className="text-xs text-gray-400">No attachments yet.</p></div>}
              {attachments.map(att => (
                <div key={att.id} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-slate-700/50 rounded-xl border border-gray-100 dark:border-slate-600">
                  <FileText className="w-7 h-7 text-gray-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-gray-900 dark:text-white truncate">{att.fileName}</p>
                    <p className="text-[10px] text-gray-400">{getUserDisplayName(att.uploader)} · {formatRelativeTime(att.createdAt)} {att.fileSize && `· ${(att.fileSize / 1024).toFixed(0)}KB`}</p>
                  </div>
                  <a href={buildFileUrl(att.fileUrl)} target="_blank" rel="noreferrer" className="px-2.5 py-1.5 bg-white dark:bg-slate-600 border border-gray-200 dark:border-slate-500 text-gray-700 dark:text-slate-200 rounded-lg text-[11px] font-bold hover:bg-gray-50 dark:hover:bg-slate-500 flex items-center gap-1">
                    <Eye size={11} /> View
                  </a>
                </div>
              ))}
            </div>
          )}

          {/* Timeline */}
          {tab === 'timeline' && (
            <div className="space-y-3">
              {timeline.length === 0 && <div className="text-center py-10"><Clock className="w-7 h-7 text-gray-200 mx-auto mb-2" /><p className="text-xs text-gray-400">No timeline entries.</p></div>}
              {timeline.map((entry, i) => (
                <div key={i} className="flex gap-3">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${entry.type === 'audit' ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600' : 'bg-green-50 dark:bg-green-900/30 text-green-600'}`}>
                    {entry.type === 'audit' ? <Hash size={12} /> : <MessageSquare size={12} />}
                  </div>
                  <div className="flex-1 bg-gray-50 dark:bg-slate-700/50 rounded-xl p-3 border border-gray-100 dark:border-slate-600">
                    {entry.type === 'audit' ? (
                      <>
                        <p className="text-[11px] font-bold text-gray-900 dark:text-white">{entry.data.action?.replace(/_/g, ' ')}</p>
                        {entry.data.notes && <p className="text-[11px] text-gray-600 dark:text-slate-300 mt-0.5">{entry.data.notes}</p>}
                        {entry.data.actor?.profile && <p className="text-[10px] text-gray-400 mt-0.5">by {getUserDisplayName(entry.data.actor)}</p>}
                      </>
                    ) : (
                      <>
                        <p className="text-[11px] text-gray-700 dark:text-slate-300">{entry.data.message}</p>
                        {entry.data.isInternal && <span className="text-[9px] bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded font-black mt-1 inline-block">INTERNAL</span>}
                      </>
                    )}
                    <p className="text-[10px] text-gray-400 mt-1">{formatRelativeTime(entry.timestamp)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Resolution */}
          {tab === 'resolution' && (
            <div className="space-y-3">
              {resolutions.length === 0 && <div className="text-center py-10"><Scale className="w-7 h-7 text-gray-200 mx-auto mb-2" /><p className="text-xs text-gray-400">No resolution recorded yet.</p></div>}
              {resolutions.map(res => (
                <div key={res.id} className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4 border border-green-200 dark:border-green-700">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="text-xs font-black text-green-800 dark:text-green-300">{DECISION_LABELS[res.decision]}</span>
                    <span className="text-[10px] text-green-500 ml-auto">{formatRelativeTime(res.resolvedAt)}</span>
                  </div>
                  <p className="text-xs text-green-700 dark:text-green-200 mb-2"><span className="font-bold">Summary: </span>{res.resolutionSummary}</p>
                  {res.adminNotes && <p className="text-[11px] text-green-600 dark:text-green-300"><span className="font-bold">Notes: </span>{res.adminNotes}</p>}
                  <p className="text-[10px] text-green-500 mt-2">by {getUserDisplayName(res.resolver)}</p>
                </div>
              ))}
            </div>
          )}

          {/* Assignment */}
          {tab === 'assignment' && isElevated && (
            <div className="space-y-3">
              <div className="bg-gray-50 dark:bg-slate-700/50 rounded-xl p-3 border border-gray-100 dark:border-slate-600">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Currently Assigned To</p>
                <p className="text-xs font-bold text-gray-900 dark:text-white">{dispute.assignedTo ? getUserDisplayName(dispute.assignedTo) : '— Unassigned'}</p>
                {dispute.assignedRole && <p className="text-[10px] text-gray-400 mt-0.5">{ASSIGNEE_ROLE_LABELS[dispute.assignedRole]}</p>}
              </div>
              {assignments.length === 0 && <p className="text-xs text-gray-400 text-center py-4">No assignment history.</p>}
              {assignments.map((a: any) => (
                <div key={a.id} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-slate-700/50 rounded-xl border border-gray-100 dark:border-slate-600">
                  <Users className="w-6 h-6 text-cyan-500 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-bold text-gray-900 dark:text-white">Assigned to {getUserDisplayName(a.assignedTo)}</p>
                    <p className="text-[10px] text-gray-400">by {getUserDisplayName(a.assignedBy)} · {formatRelativeTime(a.createdAt)}</p>
                    {a.notes && <p className="text-[10px] text-gray-500 dark:text-slate-400 mt-0.5 italic">{a.notes}</p>}
                  </div>
                  {a.assignedRole && <span className="text-[10px] bg-cyan-50 text-cyan-700 border border-cyan-200 px-2 py-0.5 rounded-lg font-bold">{ASSIGNEE_ROLE_LABELS[a.assignedRole]}</span>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Resolve Modal */}
      {showResolve && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[70] p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-md border border-gray-100 dark:border-slate-700">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-slate-700">
              <h3 className="text-sm font-black text-gray-900 dark:text-white">Resolve Ticket</h3>
              <button onClick={() => setShowResolve(false)} className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-slate-700"><X size={14} /></button>
            </div>
            <div className="p-5 space-y-3">
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">Decision</label>
                <div className="relative"><select value={resolveDecision} onChange={e => setResolveDecision(e.target.value)} className="w-full px-3 py-2 border border-gray-200 dark:border-slate-600 rounded-xl text-xs font-medium appearance-none focus:ring-2 focus:ring-[#2c5173] dark:bg-slate-700 dark:text-white">
                  <option value="FAVOR_COMPLAINANT">Favor Reporter</option>
                  <option value="FAVOR_RESPONDENT">Favor Respondent</option>
                  <option value="MUTUAL_SETTLEMENT">Mutual Settlement</option>
                </select><ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-3.5 h-3.5 pointer-events-none" /></div>
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">Summary <span className="text-red-400">*</span></label>
                <textarea value={resolveSummary} onChange={e => setResolveSummary(e.target.value)} rows={3} placeholder="Describe the resolution..." className="w-full px-3 py-2 border border-gray-200 dark:border-slate-600 rounded-xl text-xs resize-none focus:ring-2 focus:ring-[#2c5173] dark:bg-slate-700 dark:text-white" />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">Admin Notes (optional)</label>
                <textarea value={resolveNotes} onChange={e => setResolveNotes(e.target.value)} rows={2} placeholder="Internal notes..." className="w-full px-3 py-2 border border-gray-200 dark:border-slate-600 rounded-xl text-xs resize-none focus:ring-2 focus:ring-[#2c5173] dark:bg-slate-700 dark:text-white" />
              </div>
            </div>
            <div className="px-5 py-4 bg-gray-50 dark:bg-slate-700/30 border-t border-gray-100 dark:border-slate-700 flex gap-2">
              <button onClick={() => setShowResolve(false)} className="flex-1 py-2 border border-gray-200 dark:border-slate-600 rounded-xl text-xs font-bold text-gray-600 dark:text-slate-300 hover:bg-gray-100">Cancel</button>
              <button onClick={() => resolveMut.mutate()} disabled={!resolveSummary.trim() || resolveMut.isPending} className="flex-1 py-2 bg-green-600 text-white rounded-xl text-xs font-bold hover:bg-green-700 disabled:opacity-50">{resolveMut.isPending ? 'Saving…' : 'Confirm Resolution'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Assign Modal */}
      {showAssign && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[70] p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-sm border border-gray-100 dark:border-slate-700">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-slate-700">
              <h3 className="text-sm font-black text-gray-900 dark:text-white">Assign Ticket</h3>
              <button onClick={() => setShowAssign(false)} className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-slate-700"><X size={14} /></button>
            </div>
            <div className="p-5 space-y-3">
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">Assignee User ID <span className="text-red-400">*</span></label>
                <input value={assigneeId} onChange={e => setAssigneeId(e.target.value)} placeholder="Paste user UUID..." className="w-full px-3 py-2 border border-gray-200 dark:border-slate-600 rounded-xl text-xs focus:ring-2 focus:ring-[#2c5173] dark:bg-slate-700 dark:text-white" />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">Role</label>
                <div className="relative"><select value={assigneeRole} onChange={e => setAssigneeRole(e.target.value)} className="w-full px-3 py-2 border border-gray-200 dark:border-slate-600 rounded-xl text-xs appearance-none focus:ring-2 focus:ring-[#2c5173] dark:bg-slate-700 dark:text-white">
                  <option value="">— Select Role —</option>
                  {Object.entries(ASSIGNEE_ROLE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select><ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-3.5 h-3.5 pointer-events-none" /></div>
              </div>
              <textarea value={assignNotes} onChange={e => setAssignNotes(e.target.value)} rows={2} placeholder="Notes (optional)..." className="w-full px-3 py-2 border border-gray-200 dark:border-slate-600 rounded-xl text-xs resize-none focus:ring-2 focus:ring-[#2c5173] dark:bg-slate-700 dark:text-white" />
            </div>
            <div className="px-5 py-4 bg-gray-50 dark:bg-slate-700/30 border-t border-gray-100 dark:border-slate-700 flex gap-2">
              <button onClick={() => setShowAssign(false)} className="flex-1 py-2 border border-gray-200 dark:border-slate-600 rounded-xl text-xs font-bold text-gray-600 dark:text-slate-300">Cancel</button>
              <button onClick={() => assignMut.mutate()} disabled={!assigneeId.trim() || assignMut.isPending} className="flex-1 py-2 bg-cyan-600 text-white rounded-xl text-xs font-bold hover:bg-cyan-700 disabled:opacity-50">{assignMut.isPending ? 'Assigning…' : 'Assign'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Escalate Modal */}
      {showEscalate && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[70] p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-sm border border-gray-100 dark:border-slate-700">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-slate-700">
              <h3 className="text-sm font-black text-gray-900 dark:text-white">Escalate Ticket</h3>
              <button onClick={() => setShowEscalate(false)} className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-slate-700"><X size={14} /></button>
            </div>
            <div className="p-5 space-y-3">
              <div className="relative"><select value={escReason} onChange={e => setEscReason(e.target.value)} className="w-full px-3 py-2 border border-gray-200 dark:border-slate-600 rounded-xl text-xs appearance-none focus:ring-2 focus:ring-[#2c5173] dark:bg-slate-700 dark:text-white">
                {Object.entries(ESCALATION_REASON_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select><ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-3.5 h-3.5 pointer-events-none" /></div>
              <textarea value={escNotes} onChange={e => setEscNotes(e.target.value)} rows={3} placeholder="Escalation notes..." className="w-full px-3 py-2 border border-gray-200 dark:border-slate-600 rounded-xl text-xs resize-none focus:ring-2 focus:ring-[#2c5173] dark:bg-slate-700 dark:text-white" />
            </div>
            <div className="px-5 py-4 bg-gray-50 dark:bg-slate-700/30 border-t border-gray-100 dark:border-slate-700 flex gap-2">
              <button onClick={() => setShowEscalate(false)} className="flex-1 py-2 border border-gray-200 dark:border-slate-600 rounded-xl text-xs font-bold text-gray-600 dark:text-slate-300">Cancel</button>
              <button onClick={() => escalateMut.mutate()} disabled={escalateMut.isPending} className="flex-1 py-2 bg-orange-500 text-white rounded-xl text-xs font-bold hover:bg-orange-600 disabled:opacity-50">{escalateMut.isPending ? 'Escalating…' : 'Escalate'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Status change modal */}
      {showStatus && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[70] p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-sm border border-gray-100 dark:border-slate-700">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-slate-700">
              <h3 className="text-sm font-black text-gray-900 dark:text-white">Change Status</h3>
              <button onClick={() => setShowStatus(false)} className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-slate-700"><X size={14} /></button>
            </div>
            <div className="p-5 space-y-3">
              <div className="relative"><select value={newStatus} onChange={e => setNewStatus(e.target.value)} className="w-full px-3 py-2 border border-gray-200 dark:border-slate-600 rounded-xl text-xs appearance-none focus:ring-2 focus:ring-[#2c5173] dark:bg-slate-700 dark:text-white">
                <option value="">Select status…</option>
                {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select><ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-3.5 h-3.5 pointer-events-none" /></div>
              <textarea value={statusReason} onChange={e => setStatusReason(e.target.value)} rows={2} placeholder="Reason (optional)..." className="w-full px-3 py-2 border border-gray-200 dark:border-slate-600 rounded-xl text-xs resize-none focus:ring-2 focus:ring-[#2c5173] dark:bg-slate-700 dark:text-white" />
            </div>
            <div className="px-5 py-4 bg-gray-50 dark:bg-slate-700/30 border-t border-gray-100 dark:border-slate-700 flex gap-2">
              <button onClick={() => setShowStatus(false)} className="flex-1 py-2 border border-gray-200 dark:border-slate-600 rounded-xl text-xs font-bold text-gray-600 dark:text-slate-300">Cancel</button>
              <button onClick={() => statusMut.mutate()} disabled={!newStatus || statusMut.isPending} className="flex-1 py-2 bg-[#2c5173] text-white rounded-xl text-xs font-bold hover:bg-[#1e3a54] disabled:opacity-50">{statusMut.isPending ? 'Saving…' : 'Update'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SupportTicketDetailModal;
