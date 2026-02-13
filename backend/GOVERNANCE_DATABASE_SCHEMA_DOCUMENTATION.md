# Governance / Abuse Control System - Database Schema Documentation

## Overview

This document provides comprehensive documentation for all database schema changes made in Phase 1 of the Governance / Abuse Control System implementation. The system introduces enforcement capabilities that are separate from financial operations, maintaining complete audit trails and enabling tenant admins to manage platform abuse effectively.

### Key Principles

1. **Separation of Concerns**: Enforcement status is completely separate from subscription financial status
2. **Immutable Audit Trail**: All enforcement actions are logged and cannot be deleted (soft delete only)
3. **Tenant Isolation**: All enforcement actions are scoped to specific tenants
4. **Performance Optimized**: Comprehensive indexing strategy for sub-10ms enforcement checks
5. **GDPR Compliant**: Supports data retention policies and user rights

### Migration Files

The following TypeORM migration files were created:

1. `1767900000001-AddEnforcementColumnsToUserSubscriptions.ts` - Adds enforcement columns to existing subscriptions
2. `1767900000002-CreateEnforcementActionsTable.ts` - Creates immutable audit log table
3. `1767900000003-CreateAppealsTable.ts` - Creates user appeals management table
4. `1767900000004-CreateUserBlacklistTable.ts` - Creates permanent ban list table
5. `1767900000005-CreateRiskFlagsTable.ts` - Creates automated risk detection table

---

## Table 1: user_subscriptions (Enhanced)

### Overview
Enhanced the existing `user_subscriptions` table with enforcement-related columns to track administrative actions separate from financial status.

### New Columns Added

| Column Name | Type | Nullable | Default | Description |
|------------|------|----------|---------|-------------|
| `enforcement_status` | VARCHAR(50) | NO | 'normal' | Administrative enforcement status: 'normal', 'suspended', 'restricted', 'terminated' |
| `suspended_by` | UUID | YES | NULL | Foreign key to users(id) - Admin who suspended the subscription |
| `suspended_at` | TIMESTAMP | YES | NULL | Timestamp when suspension was applied |
| `suspension_reason` | TEXT | YES | NULL | Required reason for suspension |
| `suspension_expires_at` | TIMESTAMP | YES | NULL | Expiration timestamp for temporary suspensions (NULL = indefinite) |
| `terminated_by` | UUID | YES | NULL | Foreign key to users(id) - Admin who terminated the subscription |
| `terminated_at` | TIMESTAMP | YES | NULL | Timestamp when termination was applied |
| `termination_reason` | TEXT | YES | NULL | Required reason for termination |
| `restrictions` | JSONB | NO | '{}' | Feature restrictions as JSON object |
| `last_reinstated_by` | UUID | YES | NULL | Foreign key to users(id) - Admin who last reinstated the subscription |
| `last_reinstated_at` | TIMESTAMP | YES | NULL | Timestamp when subscription was last reinstated |
| `reinstatement_notes` | TEXT | YES | NULL | Notes about reinstatement conditions or resolution |
| `enforcement_metadata` | JSONB | NO | '{}' | Additional enforcement metadata (risk scores, violation types, etc.) |


### Constraints

- **CHECK Constraint**: `enforcement_status IN ('normal', 'suspended', 'restricted', 'terminated')`
- **Foreign Keys**:
  - `suspended_by` → `users(id)`
  - `terminated_by` → `users(id)`
  - `last_reinstated_by` → `users(id)`

### Indexes Created

| Index Name | Columns | Type | Purpose |
|-----------|---------|------|---------|
| `idx_user_subscriptions_enforcement_status` | enforcement_status | B-tree | Fast lookup by enforcement status |
| `idx_user_subscriptions_suspended_by` | suspended_by | B-tree | Track actions by admin |
| `idx_user_subscriptions_suspension_expires` | suspension_expires_at | Partial (WHERE NOT NULL) | Find expiring suspensions |
| `idx_user_subscriptions_terminated_by` | terminated_by | B-tree | Track terminations by admin |
| `idx_user_subscriptions_enforcement_status_tenant` | enforcement_status, tenantId | Composite | Tenant-scoped enforcement queries |

### JSONB Field Structures

#### restrictions
```json
{
  "canPostCargo": false,
  "canAddTrucks": false,
  "canBid": false,
  "readOnly": true,
  "canMessage": false,
  "canTransact": false
}
```

#### enforcement_metadata
```json
{
  "riskScore": 85,
  "violationType": "fraud",
  "autoFlagged": true,
  "lastReviewDate": "2024-01-15T10:30:00Z",
  "reviewCount": 3
}
```

---

## Table 2: enforcement_actions

### Overview
Immutable audit log table that records all enforcement actions taken by administrators. This table serves as the complete audit trail for compliance and legal purposes.

### Schema

| Column Name | Type | Nullable | Default | Description |
|------------|------|----------|---------|-------------|
| `id` | UUID | NO | gen_random_uuid() | Primary key |
| `admin_id` | UUID | NO | - | Foreign key to users(id) - Admin who performed the action |
| `target_user_id` | UUID | NO | - | Foreign key to users(id) - User subject to enforcement |
| `subscription_id` | UUID | YES | NULL | Foreign key to user_subscriptions(id) - Related subscription |
| `action_type` | VARCHAR(50) | NO | - | Type of action: 'suspend', 'unsuspend', 'restrict', 'unrestrict', 'terminate', 'reinstate', 'flag', 'unflag' |
| `reason` | TEXT | NO | - | Required reason for the action |
| `violation_category` | VARCHAR(50) | YES | NULL | Category: 'fraud', 'platform_abuse', 'spam', 'illegal_listing', 'policy_violation', 'payment_dispute', 'system_exploitation', 'other' |
| `severity` | VARCHAR(20) | YES | NULL | Severity level: 'low', 'medium', 'high', 'critical' |
| `previous_state` | JSONB | YES | NULL | State before the action |
| `new_state` | JSONB | YES | NULL | State after the action |
| `restrictions_applied` | JSONB | YES | NULL | Specific restrictions applied (for 'restrict' actions) |
| `expires_at` | TIMESTAMP | YES | NULL | Expiration timestamp for temporary actions |
| `evidence` | JSONB | YES | NULL | Evidence supporting the action (URLs, screenshots, transaction IDs) |
| `admin_notes` | TEXT | YES | NULL | Notes visible to other admins |
| `internal_notes` | TEXT | YES | NULL | Internal notes not visible to users |
| `is_appealed` | BOOLEAN | NO | FALSE | Whether this action has been appealed |
| `appeal_id` | UUID | YES | NULL | Foreign key to appeals(id) - Reference to appeal record |
| `ip_address` | INET | YES | NULL | IP address of admin when action was taken |
| `user_agent` | TEXT | YES | NULL | User agent of admin when action was taken |
| `created_at` | TIMESTAMP | NO | NOW() | Timestamp when action was created |
| `is_deleted` | BOOLEAN | NO | FALSE | Soft delete flag (never hard delete) |
| `deleted_at` | TIMESTAMP | YES | NULL | Timestamp when soft deleted |
| `deleted_by` | UUID | YES | NULL | Foreign key to users(id) - Admin who soft deleted |


### Constraints

- **CHECK Constraints**:
  - `action_type IN ('suspend', 'unsuspend', 'restrict', 'unrestrict', 'terminate', 'reinstate', 'flag', 'unflag')`
  - `violation_category IN ('fraud', 'platform_abuse', 'spam', 'illegal_listing', 'policy_violation', 'payment_dispute', 'system_exploitation', 'other')`
  - `severity IN ('low', 'medium', 'high', 'critical')`
- **Foreign Keys**:
  - `admin_id` → `users(id)`
  - `target_user_id` → `users(id)`
  - `subscription_id` → `user_subscriptions(id)`
  - `appeal_id` → `appeals(id)`
  - `deleted_by` → `users(id)`

### Indexes Created

| Index Name | Columns | Type | Purpose |
|-----------|---------|------|---------|
| `idx_enforcement_actions_admin` | admin_id | B-tree | Track actions by admin |
| `idx_enforcement_actions_target_user` | target_user_id | B-tree | Find all actions for a user |
| `idx_enforcement_actions_subscription` | subscription_id | Partial (WHERE NOT NULL) | Link to subscriptions |
| `idx_enforcement_actions_type` | action_type | B-tree | Filter by action type |
| `idx_enforcement_actions_created` | created_at DESC | B-tree | Chronological queries |
| `idx_enforcement_actions_violation` | violation_category | Partial (WHERE NOT NULL) | Filter by violation type |
| `idx_enforcement_actions_severity` | severity | Partial (WHERE NOT NULL) | Filter by severity |
| `idx_enforcement_actions_appealed` | is_appealed | Partial (WHERE TRUE) | Find appealed actions |
| `idx_enforcement_actions_not_deleted` | is_deleted | Partial (WHERE FALSE) | Exclude soft-deleted records |
| `idx_enforcement_actions_expires` | expires_at | Partial (WHERE NOT NULL) | Find expiring actions |
| `idx_enforcement_actions_target_created` | target_user_id, created_at DESC | Composite | User action history |
| `idx_enforcement_actions_admin_created` | admin_id, created_at DESC | Composite | Admin action history |
| `idx_enforcement_actions_type_created` | action_type, created_at DESC | Composite | Type-based chronological queries |

### JSONB Field Structures

#### previous_state / new_state
```json
{
  "enforcement_status": "normal",
  "restrictions": {},
  "suspended_at": null,
  "suspension_reason": null
}
```

#### restrictions_applied
```json
{
  "canPostCargo": false,
  "canAddTrucks": false,
  "duration": "30 days",
  "expiresAt": "2024-02-15T00:00:00Z"
}
```

#### evidence
```json
{
  "screenshots": ["https://s3.../evidence1.png"],
  "transactionIds": ["txn_123", "txn_456"],
  "reportUrls": ["https://internal.../report/789"],
  "userReports": [{"userId": "uuid", "reason": "spam"}]
}
```

---

## Table 3: appeals

### Overview
Manages user appeals against enforcement actions, providing a structured process for users to contest administrative decisions.

### Schema

| Column Name | Type | Nullable | Default | Description |
|------------|------|----------|---------|-------------|
| `id` | UUID | NO | gen_random_uuid() | Primary key |
| `enforcement_action_id` | UUID | NO | - | Foreign key to enforcement_actions(id) - Action being appealed |
| `user_id` | UUID | NO | - | Foreign key to users(id) - User who submitted the appeal |
| `subscription_id` | UUID | YES | NULL | Foreign key to user_subscriptions(id) - Related subscription |
| `appeal_reason` | TEXT | NO | - | Primary reason for the appeal |
| `user_statement` | TEXT | YES | NULL | Detailed statement from the user |
| `supporting_evidence` | JSONB | YES | NULL | Documents, links, or other evidence |
| `status` | VARCHAR(50) | NO | 'pending' | Current status: 'pending', 'under_review', 'approved', 'denied', 'withdrawn' |
| `reviewed_by` | UUID | YES | NULL | Foreign key to users(id) - Admin who reviewed the appeal |
| `reviewed_at` | TIMESTAMP | YES | NULL | Timestamp when appeal was reviewed |
| `review_notes` | TEXT | YES | NULL | Internal notes from the review |
| `admin_response` | TEXT | YES | NULL | Response message to the user |
| `outcome` | VARCHAR(50) | YES | NULL | Final outcome: 'enforcement_lifted', 'enforcement_modified', 'enforcement_upheld', 'no_action' |
| `outcome_details` | JSONB | YES | NULL | Additional details about the outcome |
| `messages` | JSONB | NO | '[]' | Communication thread between user and admin |
| `created_at` | TIMESTAMP | NO | NOW() | When the appeal was created |
| `updated_at` | TIMESTAMP | NO | NOW() | When the appeal was last updated |
| `resolved_at` | TIMESTAMP | YES | NULL | When the appeal was resolved |


### Constraints

- **CHECK Constraints**:
  - `status IN ('pending', 'under_review', 'approved', 'denied', 'withdrawn')`
  - `outcome IN ('enforcement_lifted', 'enforcement_modified', 'enforcement_upheld', 'no_action')`
- **Foreign Keys**:
  - `enforcement_action_id` → `enforcement_actions(id)`
  - `user_id` → `users(id)`
  - `subscription_id` → `user_subscriptions(id)`
  - `reviewed_by` → `users(id)`

### Indexes Created

| Index Name | Columns | Type | Purpose |
|-----------|---------|------|---------|
| `idx_appeals_user` | user_id | B-tree | Find appeals by user |
| `idx_appeals_status` | status | B-tree | Filter by status |
| `idx_appeals_enforcement_action` | enforcement_action_id | B-tree | Link to enforcement actions |
| `idx_appeals_created` | created_at DESC | B-tree | Chronological queries |
| `idx_appeals_reviewed_by` | reviewed_by | Partial (WHERE NOT NULL) | Track reviews by admin |
| `idx_appeals_subscription` | subscription_id | Partial (WHERE NOT NULL) | Link to subscriptions |
| `idx_appeals_outcome` | outcome | Partial (WHERE NOT NULL) | Filter by outcome |
| `idx_appeals_resolved` | resolved_at | Partial (WHERE NOT NULL) | Find resolved appeals |
| `idx_appeals_status_created` | status, created_at DESC | Composite | Status-based chronological queries |
| `idx_appeals_user_status` | user_id, status | Composite | User's appeals by status |
| `idx_appeals_user_created` | user_id, created_at DESC | Composite | User appeal history |

### JSONB Field Structures

#### supporting_evidence
```json
{
  "documents": [
    {"url": "https://s3.../doc1.pdf", "type": "invoice", "uploadedAt": "2024-01-15T10:00:00Z"}
  ],
  "links": ["https://example.com/proof"],
  "description": "Additional context about the evidence"
}
```

#### outcome_details
```json
{
  "newEnforcementStatus": "normal",
  "restrictionsLifted": ["canPostCargo", "canBid"],
  "restrictionsRemaining": [],
  "conditions": "User must complete verification within 7 days"
}
```

#### messages
```json
[
  {
    "id": "msg_1",
    "from": "user",
    "message": "I believe this was a mistake...",
    "timestamp": "2024-01-15T10:00:00Z"
  },
  {
    "id": "msg_2",
    "from": "admin",
    "message": "Thank you for your appeal. We are reviewing...",
    "timestamp": "2024-01-15T14:30:00Z"
  }
]
```

---

## Table 4: user_blacklist

### Overview
Permanent ban list that prevents account recreation by blocked identifiers. Supports multiple identifier types for comprehensive blocking.

### Schema

| Column Name | Type | Nullable | Default | Description |
|------------|------|----------|---------|-------------|
| `id` | UUID | NO | gen_random_uuid() | Primary key |
| `email` | VARCHAR(255) | YES | NULL | Specific email address to block |
| `email_domain` | VARCHAR(255) | YES | NULL | Entire email domain to block (e.g., @spam.com) |
| `phone_number` | VARCHAR(50) | YES | NULL | Phone number to block |
| `company_name` | VARCHAR(255) | YES | NULL | Company name to block |
| `tax_id` | VARCHAR(100) | YES | NULL | Tax ID or business registration number to block |
| `device_fingerprint` | TEXT | YES | NULL | Device fingerprint to block |
| `ip_address` | INET | YES | NULL | IP address to block |
| `reason` | TEXT | NO | - | Required reason for blacklisting |
| `violation_category` | VARCHAR(50) | YES | NULL | Category: 'fraud', 'platform_abuse', 'spam', 'illegal_listing', 'policy_violation', 'payment_dispute', 'system_exploitation', 'other' |
| `added_by` | UUID | NO | - | Foreign key to users(id) - Admin who added this entry |
| `tenant_id` | UUID | NO | - | Foreign key to tenants(id) - Tenant this entry belongs to |
| `related_user_id` | UUID | YES | NULL | Foreign key to users(id) - User who was blacklisted |
| `related_enforcement_action_id` | UUID | YES | NULL | Foreign key to enforcement_actions(id) - Related enforcement action |
| `is_active` | BOOLEAN | NO | TRUE | Whether this blacklist entry is currently active |
| `expires_at` | TIMESTAMP | YES | NULL | Expiration timestamp (NULL = permanent) |
| `created_at` | TIMESTAMP | NO | NOW() | When this entry was created |
| `deactivated_at` | TIMESTAMP | YES | NULL | When this entry was deactivated |
| `deactivated_by` | UUID | YES | NULL | Foreign key to users(id) - Admin who deactivated this entry |


### Constraints

- **CHECK Constraint**:
  - `violation_category IN ('fraud', 'platform_abuse', 'spam', 'illegal_listing', 'policy_violation', 'payment_dispute', 'system_exploitation', 'other')`
- **Foreign Keys**:
  - `added_by` → `users(id)`
  - `tenant_id` → `tenants(id)`
  - `related_user_id` → `users(id)`
  - `related_enforcement_action_id` → `enforcement_actions(id)`
  - `deactivated_by` → `users(id)`

### Indexes Created

| Index Name | Columns | Type | Purpose |
|-----------|---------|------|---------|
| `idx_blacklist_email` | email | Partial (WHERE is_active = TRUE) | Fast email lookup for active entries |
| `idx_blacklist_domain` | email_domain | Partial (WHERE is_active = TRUE) | Fast domain lookup for active entries |
| `idx_blacklist_phone` | phone_number | Partial (WHERE is_active = TRUE) | Fast phone lookup for active entries |
| `idx_blacklist_company` | company_name | Partial (WHERE is_active = TRUE) | Fast company lookup for active entries |
| `idx_blacklist_tax_id` | tax_id | Partial (WHERE is_active = TRUE) | Fast tax ID lookup for active entries |
| `idx_blacklist_device` | device_fingerprint | Partial (WHERE is_active = TRUE) | Fast device lookup for active entries |
| `idx_blacklist_ip` | ip_address | Partial (WHERE is_active = TRUE) | Fast IP lookup for active entries |
| `idx_blacklist_tenant` | tenant_id | B-tree | Tenant isolation |
| `idx_blacklist_added_by` | added_by | B-tree | Track entries by admin |
| `idx_blacklist_deactivated_by` | deactivated_by | Partial (WHERE NOT NULL) | Track deactivations by admin |
| `idx_blacklist_related_user` | related_user_id | Partial (WHERE NOT NULL) | Link to users |
| `idx_blacklist_related_enforcement` | related_enforcement_action_id | Partial (WHERE NOT NULL) | Link to enforcement actions |
| `idx_blacklist_active` | is_active | B-tree | Filter by active status |
| `idx_blacklist_expires` | expires_at | Partial (WHERE NOT NULL) | Find expiring entries |
| `idx_blacklist_created` | created_at DESC | B-tree | Chronological queries |
| `idx_blacklist_tenant_active` | tenant_id, is_active | Composite | Tenant-scoped active entries |
| `idx_blacklist_tenant_created` | tenant_id, created_at DESC | Composite | Tenant-scoped chronological queries |

### Usage Notes

- At least one identifier field (email, phone, etc.) should be populated
- Partial indexes on identifier fields only include active entries for performance
- Domain blocking (email_domain) allows blocking entire domains like "@spam.com"
- Tenant isolation ensures blacklist entries are scoped to specific tenants

---

## Table 5: risk_flags

### Overview
Automated risk detection and flagging system that identifies suspicious activities and patterns for admin review.

### Schema

| Column Name | Type | Nullable | Default | Description |
|------------|------|----------|---------|-------------|
| `id` | UUID | NO | gen_random_uuid() | Primary key |
| `userId` | UUID | NO | - | Foreign key to users(id) - User being flagged |
| `tenantId` | UUID | NO | - | Foreign key to tenants(id) - Tenant context |
| `flagType` | VARCHAR(50) | NO | - | Type: 'suspicious_activity', 'rapid_posting', 'price_anomaly', 'payment_pattern', 'duplicate_account', 'bot_behavior', 'other' |
| `severity` | VARCHAR(20) | YES | NULL | Severity level: 'low', 'medium', 'high', 'critical' |
| `riskScore` | INTEGER | YES | NULL | Risk score between 0 and 100 |
| `detectedBy` | VARCHAR(50) | NO | 'system' | Who detected: 'system', 'admin', 'user_report' |
| `detectionMethod` | VARCHAR(100) | YES | NULL | Method used: 'ml_model', 'rule_engine', 'manual' |
| `description` | TEXT | YES | NULL | Description of the flagged behavior |
| `evidence` | JSONB | YES | NULL | Evidence supporting the flag |
| `relatedEntities` | JSONB | YES | NULL | Related loads, transactions, etc. |
| `status` | VARCHAR(50) | NO | 'pending' | Status: 'pending', 'investigating', 'confirmed', 'false_positive', 'resolved' |
| `reviewedBy` | UUID | YES | NULL | Foreign key to users(id) - Admin who reviewed |
| `reviewedAt` | TIMESTAMP | YES | NULL | Timestamp when reviewed |
| `reviewNotes` | TEXT | YES | NULL | Notes from the review |
| `enforcementActionId` | UUID | YES | NULL | Foreign key to enforcement_actions(id) - Action taken |
| `createdAt` | TIMESTAMP | NO | NOW() | When the flag was created |
| `updatedAt` | TIMESTAMP | NO | NOW() | When the flag was last updated |
| `resolvedAt` | TIMESTAMP | YES | NULL | When the flag was resolved |


### Constraints

- **CHECK Constraints**:
  - `flagType IN ('suspicious_activity', 'rapid_posting', 'price_anomaly', 'payment_pattern', 'duplicate_account', 'bot_behavior', 'other')`
  - `severity IN ('low', 'medium', 'high', 'critical')`
  - `riskScore BETWEEN 0 AND 100`
  - `status IN ('pending', 'investigating', 'confirmed', 'false_positive', 'resolved')`
- **Foreign Keys**:
  - `userId` → `users(id)` ON DELETE CASCADE
  - `tenantId` → `tenants(id)` ON DELETE CASCADE
  - `reviewedBy` → `users(id)` ON DELETE SET NULL
  - `enforcementActionId` → `enforcement_actions(id)` ON DELETE SET NULL

### Indexes Created

| Index Name | Columns | Type | Purpose |
|-----------|---------|------|---------|
| `idx_risk_flags_user` | userId | B-tree | Find flags for a user |
| `idx_risk_flags_tenant` | tenantId | B-tree | Tenant isolation |
| `idx_risk_flags_status` | status | B-tree | Filter by status |
| `idx_risk_flags_severity` | severity | B-tree | Filter by severity |
| `idx_risk_flags_created` | createdAt DESC | B-tree | Chronological queries |
| `idx_risk_flags_flag_type` | flagType | B-tree | Filter by flag type |

### JSONB Field Structures

#### evidence
```json
{
  "activityPattern": {
    "postsLast24h": 50,
    "averagePostsPerDay": 5,
    "anomalyScore": 0.95
  },
  "ipAddresses": ["192.168.1.1", "10.0.0.1"],
  "deviceFingerprints": ["fp_abc123"],
  "timestamps": ["2024-01-15T10:00:00Z", "2024-01-15T10:05:00Z"]
}
```

#### relatedEntities
```json
{
  "loads": ["load_uuid_1", "load_uuid_2"],
  "transactions": ["txn_123", "txn_456"],
  "bids": ["bid_uuid_1"],
  "similarUsers": ["user_uuid_1", "user_uuid_2"]
}
```

---

## Relationships Between Tables

### Entity Relationship Diagram (Text Format)

```
users
  ├─→ user_subscriptions (userId)
  │     └─→ enforcement_actions (subscription_id)
  │           └─→ appeals (enforcement_action_id)
  │
  ├─→ enforcement_actions (admin_id, target_user_id)
  │     ├─→ appeals (enforcement_action_id)
  │     └─→ user_blacklist (related_enforcement_action_id)
  │
  ├─→ appeals (user_id, reviewed_by)
  │
  ├─→ user_blacklist (added_by, related_user_id, deactivated_by)
  │
  └─→ risk_flags (userId, reviewedBy)

tenants
  ├─→ user_blacklist (tenant_id)
  └─→ risk_flags (tenantId)
```

### Key Relationships

1. **user_subscriptions → enforcement_actions**: One subscription can have many enforcement actions
2. **enforcement_actions → appeals**: One enforcement action can have one appeal
3. **enforcement_actions → user_blacklist**: One enforcement action can lead to one blacklist entry
4. **users → enforcement_actions**: One admin can perform many actions; one user can be subject to many actions
5. **users → appeals**: One user can submit many appeals; one admin can review many appeals
6. **users → risk_flags**: One user can have many risk flags; one admin can review many flags
7. **tenants → user_blacklist**: One tenant can have many blacklist entries
8. **tenants → risk_flags**: One tenant can have many risk flags

---

## Migration Guide

### Prerequisites

1. Ensure PostgreSQL version 12 or higher
2. Ensure TypeORM is configured and connected
3. Backup the database before running migrations
4. Verify that `users`, `tenants`, and `user_subscriptions` tables exist

### Running Migrations

#### Development Environment

```bash
# Run all migrations
npm run migration:run

# Or run TypeORM CLI directly
npx typeorm migration:run -d src/data-source.ts
```

#### Production Environment

```bash
# 1. Backup database
pg_dump -h localhost -U postgres -d your_database > backup_$(date +%Y%m%d_%H%M%S).sql

# 2. Run migrations with transaction support
npm run migration:run

# 3. Verify schema changes
npm run migration:show
```

### Migration Order

The migrations must run in this specific order:

1. `AddEnforcementColumnsToUserSubscriptions` - Adds columns to existing table
2. `CreateEnforcementActionsTable` - Creates audit log table
3. `CreateAppealsTable` - Creates appeals table (references enforcement_actions)
4. `CreateUserBlacklistTable` - Creates blacklist table (references enforcement_actions)
5. `CreateRiskFlagsTable` - Creates risk flags table (references enforcement_actions)

### Verification Steps

After running migrations, verify the schema:

```sql
-- Check if all tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('enforcement_actions', 'appeals', 'user_blacklist', 'risk_flags');

-- Check if enforcement columns were added to user_subscriptions
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'user_subscriptions'
  AND column_name LIKE '%enforcement%' OR column_name LIKE '%suspend%' OR column_name LIKE '%terminat%';

-- Check if indexes were created
SELECT indexname, tablename 
FROM pg_indexes 
WHERE tablename IN ('user_subscriptions', 'enforcement_actions', 'appeals', 'user_blacklist', 'risk_flags')
  AND indexname LIKE '%enforcement%' OR indexname LIKE '%blacklist%' OR indexname LIKE '%appeal%' OR indexname LIKE '%risk%';
```


---

## Rollback Procedures

### Emergency Rollback

If issues are detected after migration, follow these steps:

#### Step 1: Stop Application

```bash
# Stop the application to prevent data corruption
pm2 stop all  # or your process manager
```

#### Step 2: Restore from Backup

```bash
# Restore from backup (fastest option)
psql -h localhost -U postgres -d your_database < backup_YYYYMMDD_HHMMSS.sql
```

#### Step 3: Or Run Migration Rollback

```bash
# Rollback migrations one by one (in reverse order)
npm run migration:revert

# Verify rollback
npm run migration:show
```

### Rollback Order

Migrations must be rolled back in reverse order:

1. `CreateRiskFlagsTable` (rollback first)
2. `CreateUserBlacklistTable`
3. `CreateAppealsTable`
4. `CreateEnforcementActionsTable`
5. `AddEnforcementColumnsToUserSubscriptions` (rollback last)

### Manual Rollback SQL

If TypeORM rollback fails, use these SQL commands:

```sql
-- Drop tables in reverse order
DROP TABLE IF EXISTS risk_flags CASCADE;
DROP TABLE IF EXISTS user_blacklist CASCADE;
DROP TABLE IF EXISTS appeals CASCADE;
DROP TABLE IF EXISTS enforcement_actions CASCADE;

-- Drop indexes from user_subscriptions
DROP INDEX IF EXISTS idx_user_subscriptions_enforcement_status_tenant;
DROP INDEX IF EXISTS idx_user_subscriptions_terminated_by;
DROP INDEX IF EXISTS idx_user_subscriptions_suspension_expires;
DROP INDEX IF EXISTS idx_user_subscriptions_suspended_by;
DROP INDEX IF EXISTS idx_user_subscriptions_enforcement_status;

-- Drop columns from user_subscriptions
ALTER TABLE user_subscriptions DROP COLUMN IF EXISTS enforcement_metadata;
ALTER TABLE user_subscriptions DROP COLUMN IF EXISTS reinstatement_notes;
ALTER TABLE user_subscriptions DROP COLUMN IF EXISTS last_reinstated_at;
ALTER TABLE user_subscriptions DROP COLUMN IF EXISTS last_reinstated_by;
ALTER TABLE user_subscriptions DROP COLUMN IF EXISTS restrictions;
ALTER TABLE user_subscriptions DROP COLUMN IF EXISTS termination_reason;
ALTER TABLE user_subscriptions DROP COLUMN IF EXISTS terminated_at;
ALTER TABLE user_subscriptions DROP COLUMN IF EXISTS terminated_by;
ALTER TABLE user_subscriptions DROP COLUMN IF EXISTS suspension_expires_at;
ALTER TABLE user_subscriptions DROP COLUMN IF EXISTS suspension_reason;
ALTER TABLE user_subscriptions DROP COLUMN IF EXISTS suspended_at;
ALTER TABLE user_subscriptions DROP COLUMN IF EXISTS suspended_by;
ALTER TABLE user_subscriptions DROP COLUMN IF EXISTS enforcement_status;
```

### Post-Rollback Verification

```sql
-- Verify tables are dropped
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('enforcement_actions', 'appeals', 'user_blacklist', 'risk_flags');
-- Should return 0 rows

-- Verify columns are removed from user_subscriptions
SELECT column_name 
FROM information_schema.columns
WHERE table_name = 'user_subscriptions'
  AND (column_name LIKE '%enforcement%' OR column_name LIKE '%suspend%' OR column_name LIKE '%terminat%');
-- Should return 0 rows
```

---

## Performance Considerations

### Index Strategy

The schema includes comprehensive indexing to ensure sub-10ms enforcement checks:

1. **Partial Indexes**: Used for conditional queries (e.g., `WHERE is_active = TRUE`)
2. **Composite Indexes**: Optimize multi-column queries (e.g., tenant + status)
3. **Covering Indexes**: Include frequently accessed columns
4. **JSONB Indexes**: Consider adding GIN indexes for JSONB columns if needed

### Query Optimization

#### Fast Enforcement Check (Target: <10ms)

```sql
-- Optimized query using indexed columns
SELECT enforcement_status, restrictions, suspension_expires_at
FROM user_subscriptions
WHERE id = $1 AND "tenantId" = $2;
```

#### Efficient Audit Trail Query

```sql
-- Uses composite index idx_enforcement_actions_target_created
SELECT *
FROM enforcement_actions
WHERE target_user_id = $1
  AND is_deleted = FALSE
ORDER BY created_at DESC
LIMIT 50;
```

#### Blacklist Check (Target: <5ms)

```sql
-- Uses partial indexes on identifier columns
SELECT EXISTS (
  SELECT 1 FROM user_blacklist
  WHERE tenant_id = $1
    AND is_active = TRUE
    AND (
      email = $2 OR
      email_domain = $3 OR
      phone_number = $4
    )
) AS is_blacklisted;
```

### Caching Strategy

Implement caching for frequently accessed data:

1. **Enforcement Status**: Cache for 60 seconds
2. **Blacklist Entries**: Cache for 5 minutes
3. **Risk Scores**: Cache for 10 minutes

### Database Maintenance

#### Regular Maintenance Tasks

```sql
-- Analyze tables for query optimization (run weekly)
ANALYZE user_subscriptions;
ANALYZE enforcement_actions;
ANALYZE appeals;
ANALYZE user_blacklist;
ANALYZE risk_flags;

-- Vacuum to reclaim space (run monthly)
VACUUM ANALYZE user_subscriptions;
VACUUM ANALYZE enforcement_actions;
VACUUM ANALYZE appeals;
VACUUM ANALYZE user_blacklist;
VACUUM ANALYZE risk_flags;

-- Reindex if needed (run quarterly)
REINDEX TABLE enforcement_actions;
REINDEX TABLE appeals;
```

#### Monitoring Queries

```sql
-- Check table sizes
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE tablename IN ('user_subscriptions', 'enforcement_actions', 'appeals', 'user_blacklist', 'risk_flags')
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Check index usage
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_scan,
  idx_tup_read,
  idx_tup_fetch
FROM pg_stat_user_indexes
WHERE tablename IN ('user_subscriptions', 'enforcement_actions', 'appeals', 'user_blacklist', 'risk_flags')
ORDER BY idx_scan DESC;

-- Find slow queries
SELECT 
  query,
  calls,
  total_time,
  mean_time,
  max_time
FROM pg_stat_statements
WHERE query LIKE '%enforcement%' OR query LIKE '%appeals%' OR query LIKE '%blacklist%'
ORDER BY mean_time DESC
LIMIT 10;
```

---

## Data Retention and Archival

### Retention Policies

| Table | Retention Period | Archival Strategy |
|-------|------------------|-------------------|
| `enforcement_actions` | 10 years | Partition by year, archive to cold storage after 3 years |
| `appeals` | 7 years | Move resolved appeals older than 1 year to archive table |
| `user_blacklist` | Permanent | No archival (critical for security) |
| `risk_flags` | 2 years | Delete resolved flags older than 2 years |
| `user_subscriptions` (enforcement columns) | Lifetime of subscription | No separate archival |

### Archival Procedures

#### Archive Old Enforcement Actions

```sql
-- Create archive table (run once)
CREATE TABLE enforcement_actions_archive (LIKE enforcement_actions INCLUDING ALL);

-- Move old records to archive (run annually)
WITH moved_rows AS (
  DELETE FROM enforcement_actions
  WHERE created_at < NOW() - INTERVAL '3 years'
  RETURNING *
)
INSERT INTO enforcement_actions_archive
SELECT * FROM moved_rows;
```

#### Archive Resolved Appeals

```sql
-- Create archive table (run once)
CREATE TABLE appeals_archive (LIKE appeals INCLUDING ALL);

-- Move old resolved appeals (run annually)
WITH moved_rows AS (
  DELETE FROM appeals
  WHERE resolved_at < NOW() - INTERVAL '1 year'
    AND status IN ('approved', 'denied', 'withdrawn')
  RETURNING *
)
INSERT INTO appeals_archive
SELECT * FROM moved_rows;
```

#### Clean Up Old Risk Flags

```sql
-- Delete old resolved risk flags (run monthly)
DELETE FROM risk_flags
WHERE resolved_at < NOW() - INTERVAL '2 years'
  AND status IN ('resolved', 'false_positive');
```


---

## Security Considerations

### Data Protection

1. **Encryption at Rest**: Sensitive columns should be encrypted
   - `internal_notes` in enforcement_actions
   - `admin_notes` in enforcement_actions
   - `review_notes` in appeals

2. **Access Control**: Implement row-level security (RLS) for tenant isolation

```sql
-- Enable RLS on enforcement_actions
ALTER TABLE enforcement_actions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see actions in their tenant
CREATE POLICY tenant_isolation_enforcement_actions ON enforcement_actions
  FOR SELECT
  USING (
    target_user_id IN (
      SELECT id FROM users WHERE "tenantId" = current_setting('app.current_tenant_id')::uuid
    )
  );

-- Similar policies for other tables
ALTER TABLE appeals ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_blacklist ENABLE ROW LEVEL SECURITY;
ALTER TABLE risk_flags ENABLE ROW LEVEL SECURITY;
```

3. **Audit Logging**: All access to enforcement_actions should be logged

```sql
-- Create audit log table
CREATE TABLE enforcement_actions_access_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  action_id UUID NOT NULL,
  access_type VARCHAR(20) NOT NULL, -- 'read', 'export'
  ip_address INET,
  accessed_at TIMESTAMP DEFAULT NOW()
);
```

### GDPR Compliance

#### Right to Access

Users can request their enforcement history:

```sql
-- Query to export user's enforcement data
SELECT 
  ea.id,
  ea.action_type,
  ea.reason,
  ea.created_at,
  ea.expires_at,
  a.status AS appeal_status,
  a.outcome AS appeal_outcome
FROM enforcement_actions ea
LEFT JOIN appeals a ON a.enforcement_action_id = ea.id
WHERE ea.target_user_id = $1
  AND ea.is_deleted = FALSE
ORDER BY ea.created_at DESC;
```

#### Right to Erasure (Limited)

Enforcement records are retained for legal/compliance reasons, but personal identifiers can be anonymized:

```sql
-- Anonymize user data (after legal retention period)
UPDATE enforcement_actions
SET 
  admin_notes = '[REDACTED]',
  internal_notes = '[REDACTED]',
  evidence = jsonb_set(evidence, '{redacted}', 'true'::jsonb)
WHERE target_user_id = $1
  AND created_at < NOW() - INTERVAL '7 years';
```

#### Data Portability

Export user's governance data in JSON format:

```sql
-- Export complete governance data for a user
SELECT json_build_object(
  'enforcement_actions', (
    SELECT json_agg(row_to_json(ea))
    FROM enforcement_actions ea
    WHERE ea.target_user_id = $1 AND ea.is_deleted = FALSE
  ),
  'appeals', (
    SELECT json_agg(row_to_json(a))
    FROM appeals a
    WHERE a.user_id = $1
  ),
  'risk_flags', (
    SELECT json_agg(row_to_json(rf))
    FROM risk_flags rf
    WHERE rf."userId" = $1
  )
) AS governance_data;
```

---

## Troubleshooting

### Common Issues

#### Issue 1: Migration Fails - Table Already Exists

**Symptom**: Error message "relation already exists"

**Solution**:
```sql
-- Check if table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_name = 'enforcement_actions'
);

-- If exists, either:
-- 1. Skip migration (if schema matches)
-- 2. Drop and recreate (if schema differs)
DROP TABLE IF EXISTS enforcement_actions CASCADE;
```

#### Issue 2: Foreign Key Constraint Violation

**Symptom**: Error when inserting data - "violates foreign key constraint"

**Solution**:
```sql
-- Verify referenced records exist
SELECT id FROM users WHERE id = $1;  -- Check admin_id, target_user_id
SELECT id FROM tenants WHERE id = $1;  -- Check tenant_id

-- Check for orphaned records
SELECT * FROM enforcement_actions
WHERE admin_id NOT IN (SELECT id FROM users);
```

#### Issue 3: Slow Enforcement Checks

**Symptom**: Enforcement checks taking >10ms

**Solution**:
```sql
-- Check if indexes exist
SELECT indexname FROM pg_indexes 
WHERE tablename = 'user_subscriptions' 
  AND indexname LIKE '%enforcement%';

-- Rebuild indexes if needed
REINDEX TABLE user_subscriptions;

-- Analyze table statistics
ANALYZE user_subscriptions;

-- Check query plan
EXPLAIN ANALYZE
SELECT enforcement_status, restrictions
FROM user_subscriptions
WHERE id = $1;
```

#### Issue 4: JSONB Query Performance

**Symptom**: Queries on JSONB columns are slow

**Solution**:
```sql
-- Add GIN index for JSONB columns
CREATE INDEX idx_user_subscriptions_restrictions_gin 
ON user_subscriptions USING GIN (restrictions);

CREATE INDEX idx_enforcement_actions_evidence_gin 
ON enforcement_actions USING GIN (evidence);

-- Use JSONB operators efficiently
SELECT * FROM user_subscriptions
WHERE restrictions @> '{"canPostCargo": false}'::jsonb;
```

#### Issue 5: Circular Dependency Between Tables

**Symptom**: Cannot create foreign key between enforcement_actions and appeals

**Solution**: The migrations handle this by:
1. Creating enforcement_actions without appeal_id FK
2. Creating appeals table
3. Adding FK constraint from enforcement_actions to appeals

If manual creation is needed:
```sql
-- Create tables without circular FK first
CREATE TABLE enforcement_actions (..., appeal_id UUID);
CREATE TABLE appeals (...);

-- Then add FK constraint
ALTER TABLE enforcement_actions
ADD CONSTRAINT fk_enforcement_actions_appeal_id
FOREIGN KEY (appeal_id) REFERENCES appeals(id);
```

---

## Testing Recommendations

### Schema Validation Tests

```sql
-- Test 1: Verify all tables exist
DO $
BEGIN
  ASSERT (SELECT COUNT(*) FROM information_schema.tables 
          WHERE table_name IN ('enforcement_actions', 'appeals', 'user_blacklist', 'risk_flags')) = 4,
         'Not all governance tables exist';
END $;

-- Test 2: Verify enforcement_status constraint
DO $
BEGIN
  BEGIN
    INSERT INTO user_subscriptions (id, "tenantId", "userId", enforcement_status)
    VALUES (gen_random_uuid(), (SELECT id FROM tenants LIMIT 1), (SELECT id FROM users LIMIT 1), 'invalid_status');
    RAISE EXCEPTION 'Constraint check failed';
  EXCEPTION WHEN check_violation THEN
    -- Expected behavior
  END;
END $;

-- Test 3: Verify indexes exist
DO $
BEGIN
  ASSERT (SELECT COUNT(*) FROM pg_indexes 
          WHERE tablename = 'enforcement_actions' 
          AND indexname LIKE 'idx_enforcement_actions_%') >= 10,
         'Missing indexes on enforcement_actions';
END $;
```

### Performance Tests

```sql
-- Test enforcement check performance
EXPLAIN (ANALYZE, BUFFERS)
SELECT enforcement_status, restrictions, suspension_expires_at
FROM user_subscriptions
WHERE id = (SELECT id FROM user_subscriptions LIMIT 1);
-- Should show index scan with execution time < 1ms

-- Test audit trail query performance
EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM enforcement_actions
WHERE target_user_id = (SELECT id FROM users LIMIT 1)
  AND is_deleted = FALSE
ORDER BY created_at DESC
LIMIT 50;
-- Should use idx_enforcement_actions_target_created
```

---

## Appendix

### Complete Schema Summary

**Tables Created**: 4 new tables
- enforcement_actions
- appeals
- user_blacklist
- risk_flags

**Tables Modified**: 1 existing table
- user_subscriptions (13 new columns)

**Indexes Created**: 50+ indexes across all tables

**Foreign Keys**: 20+ foreign key constraints

**Check Constraints**: 10+ check constraints for data validation

### Migration Statistics

| Metric | Value |
|--------|-------|
| Total Migration Files | 5 |
| Total Tables Created | 4 |
| Total Columns Added | 13 (to user_subscriptions) |
| Total Indexes Created | 50+ |
| Total Foreign Keys | 20+ |
| Estimated Migration Time | 2-5 minutes (depending on data volume) |
| Estimated Rollback Time | 1-2 minutes |

### Support and Maintenance

For issues or questions regarding the database schema:

1. Check this documentation first
2. Review migration logs in the console output
3. Verify schema using the verification queries provided
4. Check application logs for enforcement-related errors
5. Contact the development team with specific error messages

### Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2024-01-15 | Initial schema implementation |

---

**Document End**

*Last Updated: 2024-01-15*  
*Maintained by: Backend Development Team*  
*Related Documents: GOVERNANCE_MIGRATION_TEST_REPORT.md, design.md, requirements.md*
