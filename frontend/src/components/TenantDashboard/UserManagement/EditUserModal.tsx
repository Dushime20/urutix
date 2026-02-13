import React, { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { FaTimes, FaUser, FaPhone, FaBuilding, FaExclamationTriangle } from 'react-icons/fa';
import { userApi } from '../../../services/userApi';
import type { User } from '../../../types/user.types';
import { UserRole, UserStatus, ROLE_LABELS, STATUS_LABELS, TENANT_MANAGEABLE_ROLES } from '../../../types/user.types';
import toast from 'react-hot-toast';

interface EditUserModalProps {
  user: User;
  onClose: () => void;
  onSuccess: () => void;
}

const EditUserModal: React.FC<EditUserModalProps> = ({
  user,
  onClose,
  onSuccess
}) => {
  const [formData, setFormData] = useState({
    firstName: user.profile?.firstName || '',
    lastName: user.profile?.lastName || '',
    phoneNumber: user.phone || '',
    companyName: user.profile?.companyName || '',
    role: user.role,
    status: user.status
  });

  const [showRoleConfirm, setShowRoleConfirm] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const updateUserMutation = useMutation({
    mutationFn: () => userApi.updateTenantUser(user.id, {
      firstName: formData.firstName,
      lastName: formData.lastName,
      phoneNumber: formData.phoneNumber || undefined,
      companyName: formData.companyName || undefined,
      role: formData.role,
      status: formData.status
    }),
    onSuccess: () => {
      toast.success('User updated successfully!');
      onSuccess();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update user');
    }
  });

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.firstName) newErrors.firstName = 'First name is required';
    if (!formData.lastName) newErrors.lastName = 'Last name is required';

    if (formData.phoneNumber && !/^\+?[\d\s-()]+$/.test(formData.phoneNumber)) {
      newErrors.phoneNumber = 'Invalid phone number format';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check if role changed
    if (formData.role !== user.role && !showRoleConfirm) {
      setShowRoleConfirm(true);
      return;
    }

    if (validateForm()) {
      updateUserMutation.mutate();
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleRoleChange = (newRole: UserRole) => {
    setFormData(prev => ({ ...prev, role: newRole }));
    setShowRoleConfirm(false);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div 
          className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
          onClick={onClose}
        ></div>

        {/* Modal panel */}
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold text-white flex items-center">
                <FaUser className="mr-2" />
                Edit User
              </h3>
              <button
                onClick={onClose}
                className="text-white hover:text-gray-200 transition-colors"
              >
                <FaTimes className="h-6 w-6" />
              </button>
            </div>
          </div>

          {/* Role Change Confirmation */}
          {showRoleConfirm && (
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mx-6 mt-4">
              <div className="flex">
                <FaExclamationTriangle className="text-yellow-400 mt-1 mr-3" />
                <div>
                  <h4 className="text-sm font-medium text-yellow-800">
                    Confirm Role Change
                  </h4>
                  <p className="text-sm text-yellow-700 mt-1">
                    You are changing the user's role from <strong>{ROLE_LABELS[user.role]}</strong> to{' '}
                    <strong>{ROLE_LABELS[formData.role]}</strong>. This will change their permissions.
                  </p>
                  <div className="mt-3 flex space-x-3">
                    <button
                      onClick={() => setShowRoleConfirm(false)}
                      className="text-sm px-3 py-1 bg-yellow-600 text-white rounded hover:bg-yellow-700"
                    >
                      Confirm
                    </button>
                    <button
                      onClick={() => {
                        setFormData(prev => ({ ...prev, role: user.role }));
                        setShowRoleConfirm(false);
                      }}
                      className="text-sm px-3 py-1 bg-white text-yellow-800 border border-yellow-300 rounded hover:bg-yellow-50"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="px-6 py-4">
            <div className="space-y-4">
              {/* Role Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  User Role <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => handleRoleChange(e.target.value as UserRole)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {TENANT_MANAGEABLE_ROLES.map((role) => (
                    <option key={role} value={role}>
                      {ROLE_LABELS[role]}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => handleChange('status', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {Object.values(UserStatus).map((status) => (
                    <option key={status} value={status}>
                      {STATUS_LABELS[status]}
                    </option>
                  ))}
                </select>
              </div>

              {/* Name Fields */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    First Name <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <FaUser className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      value={formData.firstName}
                      onChange={(e) => handleChange('firstName', e.target.value)}
                      className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        errors.firstName ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="John"
                    />
                  </div>
                  {errors.firstName && (
                    <p className="mt-1 text-xs text-red-500">{errors.firstName}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Last Name <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <FaUser className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      value={formData.lastName}
                      onChange={(e) => handleChange('lastName', e.target.value)}
                      className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        errors.lastName ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Doe"
                    />
                  </div>
                  {errors.lastName && (
                    <p className="mt-1 text-xs text-red-500">{errors.lastName}</p>
                  )}
                </div>
              </div>

              {/* Phone Number */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number
                </label>
                <div className="relative">
                  <FaPhone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="tel"
                    value={formData.phoneNumber}
                    onChange={(e) => handleChange('phoneNumber', e.target.value)}
                    className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.phoneNumber ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="+1234567890"
                  />
                </div>
                {errors.phoneNumber && (
                  <p className="mt-1 text-xs text-red-500">{errors.phoneNumber}</p>
                )}
              </div>

              {/* Company Name (conditional) */}
              {(formData.role === UserRole.CARGO_OWNER || formData.role === UserRole.TRUCK_OWNER) && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Company Name
                  </label>
                  <div className="relative">
                    <FaBuilding className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      value={formData.companyName}
                      onChange={(e) => handleChange('companyName', e.target.value)}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Company Name"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="mt-6 flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                disabled={updateUserMutation.isPending}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={updateUserMutation.isPending}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {updateUserMutation.isPending ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Updating...
                  </>
                ) : (
                  'Update User'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditUserModal;
