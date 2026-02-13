import React from 'react';
import { FaUndo } from 'react-icons/fa';
import { UserRole, UserStatus, ROLE_LABELS, STATUS_LABELS, TENANT_MANAGEABLE_ROLES } from '../../../types/user.types';

interface UserFiltersProps {
  selectedRole: UserRole | 'ALL';
  selectedStatus: UserStatus | 'ALL';
  onRoleChange: (role: UserRole | 'ALL') => void;
  onStatusChange: (status: UserStatus | 'ALL') => void;
  onReset: () => void;
}

const UserFilters: React.FC<UserFiltersProps> = ({
  selectedRole,
  selectedStatus,
  onRoleChange,
  onStatusChange,
  onReset
}) => {
  return (
    <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Role Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Filter by Role
          </label>
          <select
            value={selectedRole}
            onChange={(e) => onRoleChange(e.target.value as UserRole | 'ALL')}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="ALL">All Roles</option>
            {TENANT_MANAGEABLE_ROLES.map((role) => (
              <option key={role} value={role}>
                {ROLE_LABELS[role]}
              </option>
            ))}
          </select>
        </div>

        {/* Status Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Filter by Status
          </label>
          <select
            value={selectedStatus}
            onChange={(e) => onStatusChange(e.target.value as UserStatus | 'ALL')}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="ALL">All Statuses</option>
            {Object.values(UserStatus).map((status) => (
              <option key={status} value={status}>
                {STATUS_LABELS[status]}
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
      {(selectedRole !== 'ALL' || selectedStatus !== 'ALL') && (
        <div className="mt-3 flex items-center space-x-2">
          <span className="text-sm text-gray-600">Active filters:</span>
          {selectedRole !== 'ALL' && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              Role: {ROLE_LABELS[selectedRole]}
            </span>
          )}
          {selectedStatus !== 'ALL' && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
              Status: {STATUS_LABELS[selectedStatus]}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default UserFilters;
