// Backend Service for Optimistic Locking
// src/services/OptimisticLockingService.js

class OptimisticLockingService {
  
  /**
   * Update a record with optimistic locking
   * @param {string} tableName - The table name
   * @param {string} id - Record ID
   * @param {object} updateData - Data to update
   * @param {number} currentVersion - Current version from frontend
   * @returns {object} Updated record or conflict error
   */
  async updateWithOptimisticLock(tableName, id, updateData, currentVersion) {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // First, check if the record exists and get current version
      const checkQuery = `
        SELECT version, updated_at 
        FROM ${tableName} 
        WHERE id = $1 
        FOR UPDATE
      `;
      const checkResult = await client.query(checkQuery, [id]);
      
      if (checkResult.rows.length === 0) {
        throw new Error(`Record not found in ${tableName}`);
      }
      
      const dbVersion = checkResult.rows[0].version;
      
      // Check for version conflict
      if (dbVersion !== currentVersion) {
        await client.query('ROLLBACK');
        throw new OptimisticLockingError({
          type: 'VERSION_CONFLICT',
          message: 'Record has been modified by another user',
          currentVersion: dbVersion,
          attemptedVersion: currentVersion,
          lastUpdated: checkResult.rows[0].updated_at
        });
      }
      
      // Build update query with version increment
      const updateFields = Object.keys(updateData)
        .map((key, index) => `${key} = $${index + 3}`)
        .join(', ');
      
      const updateQuery = `
        UPDATE ${tableName} 
        SET ${updateFields}, 
            version = version + 1, 
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $1 AND version = $2
        RETURNING *
      `;
      
      const updateValues = [id, currentVersion, ...Object.values(updateData)];
      const updateResult = await client.query(updateQuery, updateValues);
      
      if (updateResult.rows.length === 0) {
        await client.query('ROLLBACK');
        throw new OptimisticLockingError({
          type: 'UPDATE_FAILED',
          message: 'Update failed due to concurrent modification'
        });
      }
      
      await client.query('COMMIT');
      return {
        success: true,
        data: updateResult.rows[0],
        newVersion: updateResult.rows[0].version
      };
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Lock a record for editing (advisory lock)
   * @param {string} tableName 
   * @param {string} recordId 
   * @param {string} userId 
   * @param {number} lockDurationMinutes 
   */
  async acquireEditLock(tableName, recordId, userId, lockDurationMinutes = 30) {
    const lockKey = `${tableName}:${recordId}`;
    const expiresAt = new Date(Date.now() + lockDurationMinutes * 60 * 1000);
    
    const query = `
      INSERT INTO edit_locks (table_name, record_id, user_id, expires_at, created_at)
      VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
      ON CONFLICT (table_name, record_id) 
      DO UPDATE SET 
        user_id = EXCLUDED.user_id,
        expires_at = EXCLUDED.expires_at,
        created_at = CURRENT_TIMESTAMP
      WHERE edit_locks.expires_at < CURRENT_TIMESTAMP 
         OR edit_locks.user_id = EXCLUDED.user_id
      RETURNING *
    `;
    
    try {
      const result = await this.pool.query(query, [tableName, recordId, userId, expiresAt]);
      
      if (result.rows.length === 0) {
        // Lock is held by another user
        const existingLock = await this.pool.query(
          'SELECT user_id, expires_at FROM edit_locks WHERE table_name = $1 AND record_id = $2',
          [tableName, recordId]
        );
        
        throw new OptimisticLockingError({
          type: 'RECORD_LOCKED',
          message: 'Record is currently being edited by another user',
          lockedBy: existingLock.rows[0]?.user_id,
          expiresAt: existingLock.rows[0]?.expires_at
        });
      }
      
      return {
        success: true,
        lockId: result.rows[0].id,
        expiresAt: result.rows[0].expires_at
      };
      
    } catch (error) {
      throw error;
    }
  }

  /**
   * Release an edit lock
   */
  async releaseEditLock(tableName, recordId, userId) {
    const query = `
      DELETE FROM edit_locks 
      WHERE table_name = $1 AND record_id = $2 AND user_id = $3
      RETURNING *
    `;
    
    const result = await this.pool.query(query, [tableName, recordId, userId]);
    return { success: result.rows.length > 0 };
  }

  /**
   * Check if a record is locked
   */
  async checkEditLock(tableName, recordId) {
    const query = `
      SELECT user_id, expires_at, created_at
      FROM edit_locks 
      WHERE table_name = $1 AND record_id = $2 AND expires_at > CURRENT_TIMESTAMP
    `;
    
    const result = await this.pool.query(query, [tableName, recordId]);
    
    return {
      isLocked: result.rows.length > 0,
      lockInfo: result.rows[0] || null
    };
  }

  /**
   * Clean up expired locks
   */
  async cleanupExpiredLocks() {
    const query = 'DELETE FROM edit_locks WHERE expires_at < CURRENT_TIMESTAMP';
    const result = await this.pool.query(query);
    return { deletedLocks: result.rowCount };
  }
}

// Custom error class for optimistic locking conflicts
class OptimisticLockingError extends Error {
  constructor(details) {
    super(details.message);
    this.name = 'OptimisticLockingError';
    this.type = details.type;
    this.details = details;
  }
}

module.exports = { OptimisticLockingService, OptimisticLockingError };
