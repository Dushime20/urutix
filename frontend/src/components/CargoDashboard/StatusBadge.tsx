import React from 'react';

const statusColors: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-800',
  CREATED: 'bg-blue-100 text-blue-800',
  PUBLISHED: 'bg-green-100 text-green-800',
  IN_TRANSIT: 'bg-blue-100 text-blue-800',
  delivered: 'bg-green-100 text-green-800',
  delayed: 'bg-yellow-100 text-yellow-800',
  cancelled: 'bg-red-100 text-red-800',
  pending: 'bg-gray-100 text-gray-800',
};

export const StatusBadge = ({ status }: { status: string }) => (
  <span className={`px-2 py-1 rounded text-xs font-semibold ${statusColors[status] || 'bg-gray-100 text-gray-800'}`}
    aria-label={`Status: ${status}`}
    role="status"
  >
    {status.replace('_', ' ').toUpperCase()}
  </span>
);
