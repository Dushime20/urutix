

const statusColors: Record<string, string> = {
  DRAFT: 'bg-slate-100 text-slate-800',
  CREATED: 'bg-primary-50 text-primary-600',
  PUBLISHED: 'bg-emerald-100 text-emerald-800',
  IN_TRANSIT: 'bg-primary-50 text-primary-600',
  delivered: 'bg-emerald-100 text-emerald-800',
  delayed: 'bg-amber-100 text-amber-800',
  cancelled: 'bg-rose-100 text-rose-800',
  pending: 'bg-amber-100 text-amber-800',
};

export const StatusBadge = ({ status }: { status: string }) => (
  <span className={`px-2 py-1 rounded text-xs font-semibold ${statusColors[status] || 'bg-gray-100 text-gray-800'}`}
    aria-label={`Status: ${status}`}
    role="status"
  >
    {status.replace('_', ' ').toUpperCase()}
  </span>
);
