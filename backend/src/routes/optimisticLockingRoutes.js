// Backend API Routes for Optimistic Locking
// src/routes/optimisticLockingRoutes.js

const express = require('express');
const { OptimisticLockingService, OptimisticLockingError } = require('../services/OptimisticLockingService');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();
const lockingService = new OptimisticLockingService();

// Acquire edit lock
router.post('/locks/acquire', authenticateToken, async (req, res) => {
  try {
    const { tableName, recordId, lockDurationMinutes = 30 } = req.body;
    const userId = req.user.id;

    const result = await lockingService.acquireEditLock(
      tableName, 
      recordId, 
      userId, 
      lockDurationMinutes
    );

    res.json(result);
  } catch (error) {
    if (error instanceof OptimisticLockingError) {
      res.status(409).json({
        success: false,
        message: error.message,
        details: error.details
      });
    } else {
      console.error('Error acquiring lock:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }
});

// Release edit lock
router.post('/locks/release', authenticateToken, async (req, res) => {
  try {
    const { tableName, recordId } = req.body;
    const userId = req.user.id;

    const result = await lockingService.releaseEditLock(tableName, recordId, userId);
    res.json(result);
  } catch (error) {
    console.error('Error releasing lock:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to release lock'
    });
  }
});

// Check lock status
router.get('/locks/check/:tableName/:recordId', authenticateToken, async (req, res) => {
  try {
    const { tableName, recordId } = req.params;
    
    const result = await lockingService.checkEditLock(tableName, recordId);
    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error('Error checking lock:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check lock status'
    });
  }
});

// Renew edit lock
router.post('/locks/renew', authenticateToken, async (req, res) => {
  try {
    const { tableName, recordId, lockDurationMinutes = 30 } = req.body;
    const userId = req.user.id;

    // Check if user currently has the lock
    const lockCheck = await lockingService.checkEditLock(tableName, recordId);
    
    if (!lockCheck.isLocked || lockCheck.lockInfo?.user_id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You do not have an active lock on this record'
      });
    }

    // Renew the lock (re-acquire with same user)
    const result = await lockingService.acquireEditLock(
      tableName, 
      recordId, 
      userId, 
      lockDurationMinutes
    );

    res.json(result);
  } catch (error) {
    console.error('Error renewing lock:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to renew lock'
    });
  }
});

// Update record with optimistic locking
router.put('/optimistic-update', authenticateToken, async (req, res) => {
  try {
    const { tableName, recordId, updateData, currentVersion } = req.body;
    const userId = req.user.id;

    // Verify user has edit lock (optional but recommended)
    const lockCheck = await lockingService.checkEditLock(tableName, recordId);
    if (lockCheck.isLocked && lockCheck.lockInfo?.user_id !== userId) {
      return res.status(409).json({
        success: false,
        message: 'Record is locked by another user',
        details: {
          type: 'RECORD_LOCKED',
          lockedBy: lockCheck.lockInfo?.user_id,
          expiresAt: lockCheck.lockInfo?.expires_at
        }
      });
    }

    // Add audit fields
    const auditedUpdateData = {
      ...updateData,
      updated_by: userId,
      updated_at: new Date()
    };

    const result = await lockingService.updateWithOptimisticLock(
      tableName, 
      recordId, 
      auditedUpdateData, 
      currentVersion
    );

    res.json(result);
  } catch (error) {
    if (error instanceof OptimisticLockingError) {
      res.status(409).json({
        success: false,
        message: error.message,
        details: error.details
      });
    } else {
      console.error('Error updating record:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }
});

// Get record with version info
router.get('/record/:tableName/:recordId', authenticateToken, async (req, res) => {
  try {
    const { tableName, recordId } = req.params;
    
    const query = `SELECT *, version, updated_at FROM ${tableName} WHERE id = $1`;
    const result = await lockingService.pool.query(query, [recordId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Record not found'
      });
    }

    // Also check lock status
    const lockInfo = await lockingService.checkEditLock(tableName, recordId);

    res.json({
      success: true,
      data: result.rows[0],
      lockInfo: lockInfo
    });
  } catch (error) {
    console.error('Error fetching record:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch record'
    });
  }
});

// Cleanup expired locks (admin endpoint)
router.post('/locks/cleanup', authenticateToken, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    const result = await lockingService.cleanupExpiredLocks();
    res.json({
      success: true,
      message: `Cleaned up ${result.deletedLocks} expired locks`
    });
  } catch (error) {
    console.error('Error cleaning up locks:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cleanup expired locks'
    });
  }
});

// Get all active locks (admin endpoint)
router.get('/locks/active', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    const query = `
      SELECT el.*, u.email as user_email, u.first_name, u.last_name
      FROM edit_locks el
      JOIN users u ON el.user_id = u.id
      WHERE el.expires_at > CURRENT_TIMESTAMP
      ORDER BY el.created_at DESC
    `;
    
    const result = await lockingService.pool.query(query);
    
    res.json({
      success: true,
      locks: result.rows
    });
  } catch (error) {
    console.error('Error fetching active locks:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch active locks'
    });
  }
});

module.exports = router;
