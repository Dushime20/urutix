import React from 'react';
import { 
  FaTimes, FaUser, FaEnvelope, FaPhone, FaBuilding, 
  FaCalendar, FaEdit, FaTrash, FaCheckCircle, FaTimesCircle,
  FaClock, FaIdBadge
} from 'react-icons/fa';
import type { User } from '../../../types/user.types';
import { ROLE_LABELS, STATUS_LABELS } from '../../../types/user.types';

interface UserDetailsDrawerProps {
  user: User;
  onClose: () => void;
  onEdit: (user: User) => void;
  onDelete: (user: User) => void;
}

const UserDetailsDrawer: React.FC<UserDetailsDrawerProps> = ({
  user,
  onClose,
  onEdit,
  onDelete
}) => {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <FaCheckCircle className="text-green-500" />;
      case 'INACTIVE':
        return <FaClock className="text-gray-500" />;
      case 'SUSPENDED':
        return <FaTimesCircle className="text-red-500" />;
      default:
        return <FaClock className="text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800';
      case 'INACTIVE':
        return 'bg-gray-100 text-gray-800';
      case 'SUSPENDED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (date: string | Date | undefined) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity"
        onClick={onClose}
      ></div>

      {/* Drawer */}
      <div className="fixed right-0 top-0 h-full w-full sm:w-96 bg-white shadow-xl z-50 overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4 sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold text-white flex items-center">
              <FaUser className="mr-2" />
              User Details
            </h3>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 transition-colors"
            >
              <FaTimes className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* User Avatar and Name */}
          <div className="text-center mb-6">
            <div className="w-24 h-24 mx-auto bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-3xl font-bold mb-4">
              {user.profile?.firstName?.[0]}{user.profile?.lastName?.[0]}
            </div>
            <h4 className="text-xl font-bold text-gray-900">
              {user.profile?.firstName} {user.profile?.lastName}
            </h4>
            <p className="text-gray-600">{user.email}</p>
            
            {/* Status Badge */}
            <div className="mt-3 flex items-center justify-center">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(user.status)}`}>
                {getStatusIcon(user.status)}
                <span className="ml-2">{STATUS_LABELS[user.status]}</span>
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 mb-6">
            <button
              onClick={() => onEdit(user)}
              className="flex-1 flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <FaEdit className="mr-2" />
              Edit
            </button>
            <button
              onClick={() => onDelete(user)}
              className="flex-1 flex items-center justify-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <FaTrash className="mr-2" />
              Delete
            </button>
          </div>

          {/* Details Sections */}
          <div className="space-y-6">
            {/* Basic Information */}
            <div>
              <h5 className="text-sm font-semibold text-gray-500 uppercase mb-3">
                Basic Information
              </h5>
              <div className="space-y-3">
                <div className="flex items-start">
                  <FaIdBadge className="text-gray-400 mt-1 mr-3" />
                  <div className="flex-1">
                    <p className="text-xs text-gray-500">User ID</p>
                    <p className="text-sm text-gray-900 font-mono">{user.id}</p>
                  </div>
                </div>

                <div className="flex items-start">
                  <FaEnvelope className="text-gray-400 mt-1 mr-3" />
                  <div className="flex-1">
                    <p className="text-xs text-gray-500">Email</p>
                    <p className="text-sm text-gray-900">{user.email}</p>
                  </div>
                </div>

                {user.phone && (
                  <div className="flex items-start">
                    <FaPhone className="text-gray-400 mt-1 mr-3" />
                    <div className="flex-1">
                      <p className="text-xs text-gray-500">Phone</p>
                      <p className="text-sm text-gray-900">{user.phone}</p>
                    </div>
                  </div>
                )}

                {user.profile?.companyName && (
                  <div className="flex items-start">
                    <FaBuilding className="text-gray-400 mt-1 mr-3" />
                    <div className="flex-1">
                      <p className="text-xs text-gray-500">Company</p>
                      <p className="text-sm text-gray-900">{user.profile.companyName}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Role Information */}
            <div>
              <h5 className="text-sm font-semibold text-gray-500 uppercase mb-3">
                Role & Permissions
              </h5>
              <div className="bg-blue-50 rounded-lg p-4">
                <p className="text-sm font-medium text-blue-900">
                  {ROLE_LABELS[user.role]}
                </p>
                <p className="text-xs text-blue-700 mt-1">
                  {user.role === 'CARGO_OWNER' && 'Can create and manage loads'}
                  {user.role === 'TRUCK_OWNER' && 'Can manage trucks and drivers'}
                  {user.role === 'DRIVER' && 'Can view and accept loads'}
                  {user.role === 'BROKER' && 'Can facilitate load matching'}
                  {user.role === 'LENDER' && 'Can manage financing'}
                </p>
              </div>
            </div>

            {/* Account Dates */}
            <div>
              <h5 className="text-sm font-semibold text-gray-500 uppercase mb-3">
                Account Information
              </h5>
              <div className="space-y-3">
                <div className="flex items-start">
                  <FaCalendar className="text-gray-400 mt-1 mr-3" />
                  <div className="flex-1">
                    <p className="text-xs text-gray-500">Created At</p>
                    <p className="text-sm text-gray-900">{formatDate(user.createdAt)}</p>
                  </div>
                </div>

                <div className="flex items-start">
                  <FaCalendar className="text-gray-400 mt-1 mr-3" />
                  <div className="flex-1">
                    <p className="text-xs text-gray-500">Last Updated</p>
                    <p className="text-sm text-gray-900">{formatDate(user.updatedAt)}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Additional Info */}
            {user.profile && Object.keys(user.profile).length > 0 && (
              <div>
                <h5 className="text-sm font-semibold text-gray-500 uppercase mb-3">
                  Additional Information
                </h5>
                <div className="bg-gray-50 rounded-lg p-4">
                  <pre className="text-xs text-gray-700 whitespace-pre-wrap">
                    {JSON.stringify(user.profile, null, 2)}
                  </pre>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default UserDetailsDrawer;
