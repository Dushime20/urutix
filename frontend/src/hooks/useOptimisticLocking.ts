// Frontend Hook for Optimistic Locking
// src/hooks/useOptimisticLocking.ts

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-hot-toast';

interface OptimisticLockingData {
  version: number;
  lastUpdated: string;
  isLocked: boolean;
  lockedBy?: string;
  lockExpiresAt?: string;
}

interface UseOptimisticLockingOptions {
  tableName: string;
  recordId: string;
  autoLock?: boolean;
  lockDurationMinutes?: number;
  onLockAcquired?: () => void;
  onLockLost?: () => void;
  onVersionConflict?: (details: any) => void;
}

export const useOptimisticLocking = (options: UseOptimisticLockingOptions) => {
  const { user } = useAuth();
  const {
    tableName,
    recordId,
    autoLock = false,
    lockDurationMinutes = 30,
    onLockAcquired,
    onLockLost,
    onVersionConflict
  } = options;

  const [lockingData, setLockingData] = useState<OptimisticLockingData>({
    version: 1,
    lastUpdated: new Date().toISOString(),
    isLocked: false
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasEditLock, setHasEditLock] = useState(false);
  
  const lockCheckInterval = useRef<NodeJS.Timeout>();
  const lockRenewalInterval = useRef<NodeJS.Timeout>();

  // Check lock status
  const checkLockStatus = useCallback(async () => {
    try {
      const response = await fetch(`/api/locks/check/${tableName}/${recordId}`);
      const data = await response.json();
      
      if (data.success) {
        setLockingData(prev => ({
          ...prev,
          isLocked: data.isLocked,
          lockedBy: data.lockInfo?.user_id,
          lockExpiresAt: data.lockInfo?.expires_at
        }));

        // If we had a lock but lost it, notify
        if (hasEditLock && data.isLocked && data.lockInfo?.user_id !== user?.id) {
          setHasEditLock(false);
          onLockLost?.();
          toast.error('Edit lock has been lost. Another user is now editing this record.');
        }
      }
    } catch (error) {
      console.error('Error checking lock status:', error);
    }
  }, [tableName, recordId, hasEditLock, user?.id, onLockLost]);

  // Acquire edit lock
  const acquireEditLock = useCallback(async () => {
    if (!user?.id) return false;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/locks/acquire', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tableName,
          recordId,
          userId: user.id,
          lockDurationMinutes
        })
      });

      const data = await response.json();

      if (data.success) {
        setHasEditLock(true);
        setLockingData(prev => ({
          ...prev,
          isLocked: true,
          lockedBy: user.id,
          lockExpiresAt: data.expiresAt
        }));

        onLockAcquired?.();
        toast.success('Edit lock acquired. You can now modify this record.');

        // Start lock renewal
        lockRenewalInterval.current = setInterval(async () => {
          try {
            await fetch('/api/locks/renew', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ tableName, recordId, userId: user.id })
            });
          } catch (error) {
            console.error('Failed to renew lock:', error);
          }
        }, (lockDurationMinutes * 60 * 1000) / 2); // Renew at half the lock duration

        return true;
      } else {
        const errorMsg = data.details?.type === 'RECORD_LOCKED' 
          ? `Record is being edited by another user until ${new Date(data.details.expiresAt).toLocaleString()}`
          : data.message || 'Failed to acquire edit lock';
        
        setError(errorMsg);
        toast.error(errorMsg);
        return false;
      }
    } catch (error) {
      const errorMsg = 'Failed to acquire edit lock';
      setError(errorMsg);
      toast.error(errorMsg);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, tableName, recordId, lockDurationMinutes, onLockAcquired]);

  // Release edit lock
  const releaseEditLock = useCallback(async () => {
    if (!user?.id || !hasEditLock) return;

    try {
      await fetch('/api/locks/release', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tableName,
          recordId,
          userId: user.id
        })
      });

      setHasEditLock(false);
      setLockingData(prev => ({
        ...prev,
        isLocked: false,
        lockedBy: undefined,
        lockExpiresAt: undefined
      }));

      // Clear renewal interval
      if (lockRenewalInterval.current) {
        clearInterval(lockRenewalInterval.current);
      }

      toast.success('Edit lock released.');
    } catch (error) {
      console.error('Error releasing lock:', error);
    }
  }, [user?.id, tableName, recordId, hasEditLock]);

  // Update record with optimistic locking
  const updateRecord = useCallback(async (updateData: any) => {
    if (!user?.id) return { success: false, error: 'User not authenticated' };

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/optimistic-update', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tableName,
          recordId,
          updateData,
          currentVersion: lockingData.version,
          userId: user.id
        })
      });

      const data = await response.json();

      if (data.success) {
        setLockingData(prev => ({
          ...prev,
          version: data.newVersion,
          lastUpdated: new Date().toISOString()
        }));

        toast.success('Record updated successfully');
        return { success: true, data: data.data, newVersion: data.newVersion };
      } else {
        if (data.details?.type === 'VERSION_CONFLICT') {
          const conflictMsg = `Record has been modified by another user. Please refresh and try again.`;
          setError(conflictMsg);
          toast.error(conflictMsg);
          onVersionConflict?.(data.details);
        } else {
          setError(data.message || 'Update failed');
          toast.error(data.message || 'Update failed');
        }
        return { success: false, error: data.message };
      }
    } catch (error) {
      const errorMsg = 'Failed to update record';
      setError(errorMsg);
      toast.error(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, tableName, recordId, lockingData.version, onVersionConflict]);

  // Auto-acquire lock when component mounts
  useEffect(() => {
    if (autoLock && user?.id) {
      acquireEditLock();
    }

    // Start periodic lock status checks
    lockCheckInterval.current = setInterval(checkLockStatus, 10000); // Check every 10 seconds

    return () => {
      if (lockCheckInterval.current) {
        clearInterval(lockCheckInterval.current);
      }
      if (lockRenewalInterval.current) {
        clearInterval(lockRenewalInterval.current);
      }
      // Auto-release lock on unmount if we have it
      if (hasEditLock) {
        releaseEditLock();
      }
    };
  }, [autoLock, user?.id, hasEditLock]);

  return {
    // State
    lockingData,
    isLoading,
    error,
    hasEditLock,
    canEdit: hasEditLock || !lockingData.isLocked,
    
    // Actions
    acquireEditLock,
    releaseEditLock,
    updateRecord,
    checkLockStatus,
    
    // Computed
    isLockedByOther: lockingData.isLocked && lockingData.lockedBy !== user?.id,
    lockExpiresIn: lockingData.lockExpiresAt 
      ? Math.max(0, new Date(lockingData.lockExpiresAt).getTime() - Date.now()) 
      : 0
  };
};
