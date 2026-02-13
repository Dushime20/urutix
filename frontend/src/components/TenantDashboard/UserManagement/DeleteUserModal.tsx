import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { FaTimes, FaExclamationTriangle, FaTrash } from 'react-icons/fa';
import { userApi } from '../../../services/userApi';
import type { User } from '../../../types/user.types';
import toast from 'react-hot-toast';

interface DeleteUserModalProps {
  user: User;
  onClose: () => void;
  onSuccess: () => void;
}

const DeleteUserModal: React.FC<DeleteUserModalProps> = ({
  user,
  onClose,
  onSuccess
}) => {
  const [confirmText, setConfirmText] = useState('');
  const expectedText = 'DELETE';

  const deleteUserMutation = useMutation({
    mutationFn: () => userApi.deleteTenantUser(user.id),
    onSuccess: () => {
      toast.success('User deleted successfully!');
      onSuccess();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete user');
    }
  });

  const handleDelete = () => {
    if (confirmText === expectedText) {
      deleteUserMutation.mutate();
    }
  };

  const isConfirmValid = confirmText === expectedText;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div 
          className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
          onClick={onClose}
        ></div>

        {/* Modal panel */}
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          {/* Header */}
          <div className="bg-red-600 px-6 py-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold text-white flex items-center">
                <FaExclamationTriangle className="mr-2" />
                Delete User
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
          <div className="px-6 py-4">
            <div className="mb-4">
              <div className="flex items-center justify-center w-16 h-16 mx-auto bg-red-100 rounded-full">
                <FaTrash className="text-red-600 text-2xl" />
              </div>
            </div>

            <div className="text-center mb-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-2">
                Are you sure you want to delete this user?
              </h4>
              <p className="text-gray-600 mb-4">
                You are about to delete:
              </p>
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <p className="font-semibold text-gray-900">
                  {user.profile?.firstName} {user.profile?.lastName}
                </p>
                <p className="text-sm text-gray-600">{user.email}</p>
              </div>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-left">
                <p className="text-sm text-red-800">
                  <strong>Warning:</strong> This action cannot be undone. All user data, 
                  including their profile, activity history, and associated records will be 
                  permanently deleted.
                </p>
              </div>
            </div>

            {/* Confirmation Input */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Type <span className="font-bold text-red-600">{expectedText}</span> to confirm
              </label>
              <input
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                placeholder={expectedText}
                autoFocus
              />
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                disabled={deleteUserMutation.isPending}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={!isConfirmValid || deleteUserMutation.isPending}
                className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {deleteUserMutation.isPending ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Deleting...
                  </>
                ) : (
                  <>
                    <FaTrash className="mr-2" />
                    Delete User
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeleteUserModal;
