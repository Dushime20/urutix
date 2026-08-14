import React from 'react';

export type StatusBadgeVariant =
  | 'success'
  | 'warning'
  | 'error'
  | 'info'
  | 'neutral'
  | 'primary'
  | 'purple'
  | 'orange';

const VARIANT_CLASSES: Record<StatusBadgeVariant, string> = {
  success: 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800/50',
  warning: 'bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800/50',
  error: 'bg-rose-50 text-rose-700 border-rose-100 dark:bg-rose-900/30 dark:text-rose-400 dark:border-rose-800/50',
  info: 'bg-sky-50 text-sky-700 border-sky-100 dark:bg-sky-900/30 dark:text-sky-400 dark:border-sky-800/50',
  neutral: 'bg-slate-50 text-slate-600 border-slate-100 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
  primary: 'bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800/50',
  purple: 'bg-violet-50 text-violet-700 border-violet-100 dark:bg-violet-900/30 dark:text-violet-400 dark:border-violet-800/50',
  orange: 'bg-orange-50 text-orange-700 border-orange-100 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800/50',
};

/** Common status string → variant mapping used across dashboards */
export function resolveStatusVariant(status: string): StatusBadgeVariant {
  const s = (status || '').toLowerCase().replace(/[_\s-]+/g, '_');
  if (['active', 'approved', 'completed', 'paid', 'available', 'verified', 'success', 'disbursed', 'repaid', 'cleared', 'accepted', 'delivered'].includes(s)) {
    return 'success';
  }
  if (['pending', 'pending_review', 'in_progress', 'processing', 'scheduled', 'planned', 'awaiting', 'offer_sent', 'in_transit', 'under_review'].includes(s)) {
    return 'warning';
  }
  if (['additional_information_required', 'information_required'].includes(s)) {
    return 'orange';
  }
  if (['rejected', 'failed', 'cancelled', 'canceled', 'defaulted', 'suspended', 'blocked', 'overdue', 'error', 'out_of_service'].includes(s)) {
    return 'error';
  }
  if (['draft', 'inactive', 'unverified', 'maintenance', 'hold', 'on_hold'].includes(s)) {
    return 'neutral';
  }
  if (['appeal_pending', 'counter_offer_sent', 'partial'].includes(s)) {
    return 'orange';
  }
  if (['ready_to_disburse', 'info', 'review'].includes(s)) {
    return 'info';
  }
  return 'primary';
}

export interface StatusBadgeProps {
  label: React.ReactNode;
  variant?: StatusBadgeVariant;
  status?: string;
  icon?: React.ReactNode;
  title?: string;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  label,
  variant,
  status,
  icon,
  title,
  className = '',
}) => {
  const resolved = variant || (status ? resolveStatusVariant(status) : 'neutral');
  return (
    <span
      title={title}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full ui-badge border ${VARIANT_CLASSES[resolved]} ${className}`}
    >
      {icon}
      {label}
    </span>
  );
};

export default StatusBadge;
