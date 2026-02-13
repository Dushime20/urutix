import React from 'react';
import { FaUndo } from 'react-icons/fa';

interface BidFiltersProps {
  selectedStatus: string;
  onStatusChange: (status: string) => void;
  onReset: () => void;
}

const BidFilters: React.FC<BidFiltersProps> = ({
  selectedStatus,
  onStatusChange,
  onReset
}) => {
  const statuses = [
    { value: 'ALL', label: 'All Statuses' },
    { value: 'PENDING', label: 'Pending' },
    { value: 'ACCEPTED', label: 'Accepted' },
    { value: 'REJECTED', label: 'Rejected' },
    { value: 'WITHDRAWN', label: 'Withdrawn' }
  ];

  return (
    <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Status Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Filter by Status
          </label>
          <select
            value={selectedStatus}
            onChange={(e) => onStatusChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {statuses.map((status) => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </select>
        </div>

        {/* Reset Button */}
        <div className="flex items-end">
          <button
            onClick={onReset}
            className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors"
          >
            <FaUndo className="mr-2" />
            Reset Filters
          </button>
        </div>
      </div>

      {/* Active Filters Display */}
      {selectedStatus !== 'ALL' && (
        <div className="mt-3 flex items-center space-x-2">
          <span className="text-sm text-gray-600">Active filters:</span>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            Status: {statuses.find(s => s.value === selectedStatus)?.label}
          </span>
        </div>
      )}
    </div>
  );
};

export default BidFilters;
