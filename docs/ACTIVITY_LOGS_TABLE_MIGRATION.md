# Activity Logs Table Migration

## Overview
Created the missing `activity_logs` table to support activity tracking and audit logging functionality.

## Migration Date
April 8, 2026

## Issue
The `/api/activity-logs` endpoint was returning a 500 error with:
```
error: relation "activity_logs" does not exist
```

## Solution
Created the `activity_logs` table with proper schema and indexes.

## Table Schema

### Columns
- **id** (UUID, PRIMARY KEY) - Unique identifier for each log entry
- **user_id** (UUID, nullable) - Foreign key to users table
- **action** (VARCHAR(100), NOT NULL) - Action performed (e.g., CREATE, UPDATE, DELETE, LOGIN)
- **resource** (VARCHAR(100), nullable) - Resource type (e.g., cargo, user, payment)
- **resource_id** (VARCHAR(255), nullable) - ID of the affected resource
- **details** (JSONB, nullable) - Additional details about the action
- **ip_address** (INET, nullable) - IP address of the user
- **user_agent** (TEXT, nullable) - Browser/client user agent
- **location** (JSONB, nullable) - Geographic location data
- **is_suspicious** (BOOLEAN, default: false) - Flag for suspicious activities
- **session_id** (VARCHAR(255), nullable) - Session identifier
- **created_at** (TIMESTAMP, default: CURRENT_TIMESTAMP) - When the log was created

### Indexes
1. `idx_activity_logs_user_id` - Index on user_id for fast user activity queries
2. `idx_activity_logs_action` - Index on action for filtering by action type
3. `idx_activity_logs_resource` - Composite index on (resource, resource_id)
4. `idx_activity_logs_created_at` - Index on created_at for time-based queries
5. `idx_activity_logs_suspicious` - Partial index on is_suspicious (WHERE is_suspicious = true)

### Foreign Keys
- `fk_activity_logs_user` - References users(id) ON DELETE SET NULL

## Migration Script
Location: `backend/create-activity-logs-table.js`

To run the migration:
```bash
cd backend
node create-activity-logs-table.js
```

## API Endpoints

### Get Activity Logs
```
GET /api/activity-logs
Authorization: Bearer <token>

Query Parameters:
- category: Filter by category (user, cargo, payment, system, security, tenant, document)
- status: Filter by status
- search: Search in action, username, or details
- limit: Number of records to return (default: 50)
- offset: Number of records to skip (default: 0)

Response:
{
  "logs": [
    {
      "id": "uuid",
      "timestamp": "2026-04-08T...",
      "user": "user@example.com",
      "userRole": "CARGO_OWNER",
      "action": "CREATE",
      "category": "cargo",
      "description": "Created new cargo #123",
      "status": "success",
      "ipAddress": "192.168.1.1",
      "details": {...}
    }
  ],
  "total": 100,
  "limit": 50,
  "offset": 0
}
```

### Get Activity Stats
```
GET /api/activity-logs/stats
Authorization: Bearer <token>

Response:
{
  "totalActivities": 150,
  "userActions": 80,
  "securityEvents": 10,
  "systemEvents": 60
}
```

## Activity Categories
The system maps resources to categories:
- **user** - User management actions
- **cargo** - Cargo and load operations
- **payment** - Payment transactions
- **system** - System-level events
- **security** - Authentication and security events (auth)
- **tenant** - Tenant management
- **document** - Document operations

## Status Determination
Logs are automatically assigned a status based on the action:
- **error** - Suspicious activities, FAIL, ERROR actions
- **warning** - WARN, SUSPEND actions
- **info** - INFO actions
- **success** - All other actions

## Usage Examples

### Logging User Actions
```typescript
await activityLogRepository.save({
  userId: user.id,
  action: 'CREATE_CARGO',
  resource: 'cargo',
  resourceId: cargo.id,
  details: { cargoType: 'container', weight: 1000 },
  ipAddress: req.ip,
  userAgent: req.headers['user-agent'],
  sessionId: req.session.id,
});
```

### Logging Security Events
```typescript
await activityLogRepository.save({
  userId: user.id,
  action: 'LOGIN_FAILED',
  resource: 'auth',
  details: { reason: 'Invalid password', attempts: 3 },
  ipAddress: req.ip,
  isSuspicious: true,
});
```

## Verification

After migration, verify the table exists:
```sql
SELECT * FROM information_schema.tables 
WHERE table_name = 'activity_logs';
```

Check indexes:
```sql
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'activity_logs';
```

## Notes
- The table uses UUID for primary keys for better distribution
- JSONB columns allow flexible storage of additional data
- Partial index on `is_suspicious` improves security monitoring queries
- Foreign key uses ON DELETE SET NULL to preserve logs even if user is deleted
- All timestamps are stored in UTC
