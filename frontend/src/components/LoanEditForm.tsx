// Example: Using Optimistic Locking in a Loan Edit Component
// src/components/LoanEditForm.tsx

import React, { useState, useEffect } from 'react';
import { useOptimisticLocking } from '../hooks/useOptimisticLocking';
import { FaLock, FaUnlock, FaExclamationTriangle, FaSpinner } from 'react-icons/fa';

interface LoanEditFormProps {
  loanId: string;
  initialData: any;
  onSave: (data: any) => void;
  onCancel: () => void;
}

export const LoanEditForm: React.FC<LoanEditFormProps> = ({
  loanId,
  initialData,
  onSave,
  onCancel
}) => {
  const [formData, setFormData] = useState(initialData);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const {
    lockingData,
    isLoading,
    error,
    hasEditLock,
    canEdit,
    isLockedByOther,
    lockExpiresIn,
    acquireEditLock,
    releaseEditLock,
    updateRecord,
    checkLockStatus
  } = useOptimisticLocking({
    tableName: 'loans',
    recordId: loanId,
    autoLock: true, // Automatically acquire lock when component mounts
    lockDurationMinutes: 30,
    onLockAcquired: () => {
      console.log('Edit lock acquired for loan:', loanId);
    },
    onLockLost: () => {
      console.log('Edit lock lost for loan:', loanId);
      // Could show a modal asking user what to do with unsaved changes
    },
    onVersionConflict: (details) => {
      console.log('Version conflict detected:', details);
      // Refresh data and ask user how to proceed
      handleVersionConflict(details);
    }
  });

  const handleVersionConflict = (details: any) => {
    // Show modal with options:
    // 1. Discard changes and refresh
    // 2. Save as new version (if business logic allows)
    // 3. Show diff and let user merge changes
    console.log('Version conflict details:', details);
    const shouldRefresh = window.confirm(
      'This record has been modified by another user. ' +
      'Click OK to refresh and lose your changes, or Cancel to continue editing ' +
      '(you may need to merge your changes manually).'
    );
    
    if (shouldRefresh) {
      window.location.reload();
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }));
    setHasUnsavedChanges(true);
  };

  const handleSave = async () => {
    if (!canEdit) {
      alert('Cannot save: Record is locked by another user');
      return;
    }

    const result = await updateRecord(formData);
    
    if (result.success) {
      setHasUnsavedChanges(false);
      onSave(result.data);
    }
  };

  const handleCancel = () => {
    if (hasUnsavedChanges) {
      const shouldCancel = window.confirm(
        'You have unsaved changes. Are you sure you want to cancel?'
      );
      if (!shouldCancel) return;
    }
    
    releaseEditLock();
    onCancel();
  };

  // Warn user before leaving with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  // Format lock expiry time
  const formatLockExpiry = (milliseconds: number) => {
    const minutes = Math.floor(milliseconds / 60000);
    const seconds = Math.floor((milliseconds % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Lock Status Header */}
      <div className="mb-6 p-4 rounded-lg border">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {hasEditLock ? (
              <>
                <FaLock className="text-green-600" />
                <span className="text-green-600 font-medium">
                  You have edit access
                </span>
                <span className="text-sm text-gray-500">
                  (expires in {formatLockExpiry(lockExpiresIn)})
                </span>
              </>
            ) : isLockedByOther ? (
              <>
                <FaLock className="text-red-600" />
                <span className="text-red-600 font-medium">
                  Record is being edited by another user
                </span>
                <span className="text-sm text-gray-500">
                  (until {new Date(lockingData.lockExpiresAt!).toLocaleString()})
                </span>
              </>
            ) : (
              <>
                <FaUnlock className="text-yellow-600" />
                <span className="text-yellow-600 font-medium">
                  No edit lock - read only
                </span>
              </>
            )}
          </div>

          <div className="flex items-center space-x-2">
            {!hasEditLock && !isLockedByOther && (
              <button
                onClick={acquireEditLock}
                disabled={isLoading}
                className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-50"
              >
                {isLoading ? <FaSpinner className="animate-spin" /> : 'Acquire Lock'}
              </button>
            )}
            
            {hasEditLock && (
              <button
                onClick={releaseEditLock}
                className="px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700"
              >
                Release Lock
              </button>
            )}

            <button
              onClick={checkLockStatus}
              className="px-3 py-1 bg-gray-200 text-gray-700 rounded text-sm hover:bg-gray-300"
            >
              Refresh Status
            </button>
          </div>
        </div>

        {/* Version Information */}
        <div className="mt-2 text-sm text-gray-600">
          Version: {lockingData.version} | Last updated: {new Date(lockingData.lastUpdated).toLocaleString()}
        </div>

        {/* Error Display */}
        {error && (
          <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded flex items-center space-x-2">
            <FaExclamationTriangle className="text-red-600" />
            <span className="text-red-700 text-sm">{error}</span>
          </div>
        )}
      </div>

      {/* Form Fields */}
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Loan Amount
            </label>
            <input
              type="number"
              value={formData.amount || ''}
              onChange={(e) => handleInputChange('amount', parseFloat(e.target.value))}
              disabled={!canEdit}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 
                ${!canEdit ? 'bg-gray-100 cursor-not-allowed' : ''}`}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Interest Rate (%)
            </label>
            <input
              type="number"
              step="0.01"
              value={formData.interestRate || ''}
              onChange={(e) => handleInputChange('interestRate', parseFloat(e.target.value))}
              disabled={!canEdit}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 
                ${!canEdit ? 'bg-gray-100 cursor-not-allowed' : ''}`}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Term (Months)
            </label>
            <input
              type="number"
              value={formData.termMonths || ''}
              onChange={(e) => handleInputChange('termMonths', parseInt(e.target.value))}
              disabled={!canEdit}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 
                ${!canEdit ? 'bg-gray-100 cursor-not-allowed' : ''}`}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              value={formData.status || ''}
              onChange={(e) => handleInputChange('status', e.target.value)}
              disabled={!canEdit}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 
                ${!canEdit ? 'bg-gray-100 cursor-not-allowed' : ''}`}
            >
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="defaulted">Defaulted</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Notes
          </label>
          <textarea
            value={formData.notes || ''}
            onChange={(e) => handleInputChange('notes', e.target.value)}
            disabled={!canEdit}
            rows={4}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 
              ${!canEdit ? 'bg-gray-100 cursor-not-allowed' : ''}`}
            placeholder="Add any notes about this loan..."
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mt-8 flex justify-end space-x-4">
        <button
          onClick={handleCancel}
          className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
        >
          Cancel
        </button>
        
        <button
          onClick={handleSave}
          disabled={!canEdit || isLoading || !hasUnsavedChanges}
          className={`px-6 py-2 rounded-lg font-medium
            ${canEdit && hasUnsavedChanges
              ? 'bg-blue-600 text-white hover:bg-blue-700' 
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
        >
          {isLoading ? (
            <>
              <FaSpinner className="animate-spin inline mr-2" />
              Saving...
            </>
          ) : (
            'Save Changes'
          )}
        </button>
      </div>

      {/* Unsaved Changes Indicator */}
      {hasUnsavedChanges && (
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center space-x-2">
            <FaExclamationTriangle className="text-yellow-600" />
            <span className="text-yellow-700 text-sm font-medium">
              You have unsaved changes
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
