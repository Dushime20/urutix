-- Edit Locks Table for Advisory Locking
-- This table tracks which records are currently being edited

CREATE TABLE edit_locks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    table_name VARCHAR(100) NOT NULL,
    record_id VARCHAR(100) NOT NULL,
    user_id UUID NOT NULL REFERENCES users(id),
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Ensure only one lock per record
    UNIQUE(table_name, record_id)
);

-- Index for performance
CREATE INDEX idx_edit_locks_table_record ON edit_locks(table_name, record_id);
CREATE INDEX idx_edit_locks_user ON edit_locks(user_id);
CREATE INDEX idx_edit_locks_expires ON edit_locks(expires_at);

-- Function to automatically clean up expired locks
CREATE OR REPLACE FUNCTION cleanup_expired_locks()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM edit_locks WHERE expires_at < CURRENT_TIMESTAMP;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Optional: Schedule cleanup every 5 minutes (requires pg_cron extension)
-- SELECT cron.schedule('cleanup-expired-locks', '*/5 * * * *', 'SELECT cleanup_expired_locks();');
