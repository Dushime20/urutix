# System Health Logs Column Name Fix

## Issue
Backend was logging errors when trying to insert system health metrics:
```
error: column "checked_at" of relation "system_health_logs" does not exist
Failed to log health check: column "checked_at" of relation "system_health_logs" does not exist
Failed to log threshold violation: column "checked_at" of relation "system_health_logs" does not exist
```

## Root Cause
The Phase 1 migration (`013_super_admin_phase1_tables.sql`) renamed the `checked_at` column to `timestamp` to match the design specification, but the entity and service files were still using the old column name.

## Solution
Updated all references from `checked_at` to `timestamp` to match the migration:

### 1. Entity Update
**File**: `urutix/backend/src/entities/system-health.entity.ts`

Changed:
```typescript
@CreateDateColumn({ name: 'checked_at' })
checkedAt: Date;
```

To:
```typescript
@CreateDateColumn({ name: 'timestamp' })
timestamp: Date;
```

### 2. Service Updates
**Files Modified**:
- `urutix/backend/src/services/system-health.service.ts`
- `urutix/backend/src/services/enhanced-system-health.service.ts`

Updated all query references:
- `log.checkedAt` → `log.timestamp`
- `checkedAt: 'DESC'` → `timestamp: 'DESC'`
- `checkedAt: Between(...)` → `timestamp: Between(...)`

## Changes Made

### SystemHealthService
1. `getHistoricalMetrics()` - Updated query builder to use `log.timestamp`
2. `getServiceHealthHistory()` - Updated order by clause to use `timestamp`
3. `getUptimeStats()` - Updated where clause to use `log.timestamp`

### EnhancedSystemHealthService
1. `getHistoricalMetrics()` - Updated Between clause and order by to use `timestamp`
2. `getApiMetrics()` - Updated where clause to use `timestamp`

## Verification
✅ Backend builds successfully
✅ No TypeScript compilation errors
✅ Column name matches migration schema
✅ All queries now use correct column name

## Impact
- System health monitoring now logs metrics correctly
- Threshold violations are properly recorded
- Historical metrics queries work as expected
- No data loss (migration preserved existing data by renaming column)

## Related Files
- Migration: `urutix/backend/migrations/013_super_admin_phase1_tables.sql`
- Entity: `urutix/backend/src/entities/system-health.entity.ts`
- Services:
  - `urutix/backend/src/services/system-health.service.ts`
  - `urutix/backend/src/services/enhanced-system-health.service.ts`

---
**Status**: ✅ RESOLVED
**Date**: February 15, 2026
**Task Context**: Super Admin Enhancement - Phase 1 (Post Task 4.2 cleanup)
