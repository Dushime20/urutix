import React from 'react';
import { 
  FaEdit, FaTrash, FaEye, FaChevronLeft, FaChevronRight,
  FaCheckCircle, FaTimesCircle, FaClock
} from 'react-icons/fa';
import type { User } from '../../../types/user.types';
import { UserRole, UserStatus, ROLE_LABELS, STATUS_LABELS } from '../../../types/user.types';

interface UserListProps {
  users: User[];
  onEdit: (user: User) => void;
  onDelete: (user: User) => void;
  onViewDetails: (user: User) => void;
  currentPage: number;
  pageSize: number;
  totalUsers: number;
  onPageChange: (page: number) => void;
}

const UserList: React.FC<UserListProps> = ({
  users,
  onEdit,
  onDelete,
  onViewDetails,
  currentPage,
  pageSize,
  totalUsers,
  onPageChange
}) => {
  const totalPages = Math.ceil(totalUsers / pageSize);

  const getStatusBadge = (status: UserStatus) => {
    const styles = {
      [UserStatus.ACTIVE]: 'bg-green-100 text-green-800 border-green-200',
      [UserStatus.INACTIVE]: 'bg-gray-100 text-gray-800 border-gray-200',
      [UserStatus.SUSPENDED]: 'bg-red-100 text-red-800 border-red-200',
      [UserStatus.PENDING]: 'bg-yellow-100 text-yellow-800 border-yellow-200'
    };

    const icons = {
      [UserStatus.ACTIVE]: <FaCheckCircle className="mr-1" />,
      [UserStatus.INACTIVE]: <FaClock className="mr-1" />,
      [UserStatus.SUSPENDED]: <FaTimesCircle className="mr-1" />,
      [UserStatus.PENDING]: <FaClock className="mr-1" />
    };

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${styles[status]}`}>
        {icons[status]}
        {STATUS_LABELS[status]}
      </span>
    );
  };

  const getRoleBadge = (role: UserRole) => {
    const styles = {
      [UserRole.CARGO_OWNER]: 'bg-blue-100 text-blue-800 border-blue-200',
      [UserRole.TRUCK_OWNER]: 'bg-purple-100 text-purple-800 border-purple-200',
      [UserRole.DRIVER]: 'bg-indigo-100 text-indigo-800 border-indigo-200',
      [UserRole.AGENT]: 'bg-orange-100 text-orange-800 border-orange-200',
      [UserRole.LENDER]: 'bg-pink-100 text-pink-800 border-pink-200',
      [UserRole.BROKER]: 'bg-teal-100 text-teal-800 border-teal-200',
      [UserRole.TENANT_ADMIN]: 'bg-red-100 text-red-800 border-red-200',
      [UserRole.SUPER_ADMIN]: 'bg-gray-900 text-white border-gray-900'
    };

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${styles[role]}`}>
        {ROLE_LABELS[role]}
      </span>
    );
  };

  const getInitials = (firstName?: string, lastName?: string) => {
    if (!firstName && !lastName) return '?';
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (users.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 mb-4">
          <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-1">No users found</h3>
        <p className="text-sm text-gray-500">Get started by creating a new user.</p>
      </div>
    );
  }

  return (
    <div>
      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                User
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Email
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Role
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Created
              </th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                        {getInitials(user.profile?.firstName, user.profile?.lastName)}
                      </div>
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">
                        {user.profile?.firstName} {user.profile?.lastName}
                      </div>
                      {user.profile?.companyName && (
                        <div className="text-sm text-gray-500">
                          {user.profile.companyName}
                        </div>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{user.email}</div>
                  {user.phone && (
                    <div className="text-sm text-gray-500">{user.phone}</div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {getRoleBadge(user.role)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {getStatusBadge(user.status)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatDate(user.createdAt)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex items-center justify-end space-x-2">
                    <button
                      onClick={() => onViewDetails(user)}
                      className="text-blue-600 hover:text-blue-900 p-2 hover:bg-blue-50 rounded transition-colors"
                      title="View details"
                    >
                      <FaEye />
                    </button>
                    <button
                      onClick={() => onEdit(user)}
                      className="text-indigo-600 hover:text-indigo-900 p-2 hover:bg-indigo-50 rounded transition-colors"
                      title="Edit user"
                    >
                      <FaEdit />
                    </button>
                    <button
                      onClick={() => onDelete(user)}
                      className="text-red-600 hover:text-red-900 p-2 hover:bg-red-50 rounded transition-colors"
                      title="Delete user"
                    >
                      <FaTrash />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6 mt-4">
          <div className="flex-1 flex justify-between sm:hidden">
            <button
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Showing <span className="font-medium">{(currentPage - 1) * pageSize + 1}</span> to{' '}
                <span className="font-medium">{Math.min(currentPage * pageSize, totalUsers)}</span> of{' '}
                <span className="font-medium">{totalUsers}</span> results
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                <button
                  onClick={() => onPageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="sr-only">Previous</span>
                  <FaChevronLeft className="h-5 w-5" />
                </button>
                {[...Array(totalPages)].map((_, index) => {
                  const page = index + 1;
                  if (
                    page === 1 ||
                    page === totalPages ||
                    (page >= currentPage - 1 && page <= currentPage + 1)
                  ) {
                    return (
                      <button
                        key={page}
                        onClick={() => onPageChange(page)}
                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                          page === currentPage
                            ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                            : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        {page}
                      </button>
                    );
                  } else if (page === currentPage - 2 || page === currentPage + 2) {
                    return (
                      <span
                        key={page}
                        className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700"
                      >
                        ...
                      </span>
                    );
                  }
                  return null;
                })}
                <button
                  onClick={() => onPageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="sr-only">Next</span>
                  <FaChevronRight className="h-5 w-5" />
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserList;
