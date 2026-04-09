# Tenant KYC Columns Migration

## Overview
Added missing KYC (Know Your Customer) columns to the `tenants` table to support tenant verification functionality.

## Migration Date
April 8, 2026

## Changes Made

### Database Schema Changes
Added the following columns to the `tenants` table:

1. **kycStatus** (enum)
   - Type: `tenant_kyc_status_enum`
   - Values: PENDING, SUBMITTED, UNDER_REVIEW, APPROVED, REJECTED, INCOMPLETE
   - Default: PENDING
   - Purpose: Track the current KYC verification status

2. **kycData** (jsonb)
   - Type: JSONB
   - Default: {}
   - Purpose: Store KYC verification documents and data

3. **kycSubmittedAt** (timestamp)
   - Type: TIMESTAMP
   - Nullable: true
   - Purpose: Track when KYC was submitted

4. **kycVerifiedAt** (timestamp)
   - Type: TIMESTAMP
   - Nullable: true
   - Purpose: Track when KYC was verified/approved

5. **kycNotes** (text)
   - Type: TEXT
   - Nullable: true
   - Purpose: Store admin notes about KYC verification

### Entity Updates
- Restored KYC columns in `backend/src/entities/tenant.entity.ts`
- Added `KycStatus` enum to tenant entity
- Updated `tenant-kyc-audit-log.entity.ts` to import KycStatus from tenant entity

### Service Updates
- Restored `submitKYC()` method in `tenant.service.ts`
- Restored `updateKYCStatus()` method in `tenant.service.ts`
- Restored `getTenantsByKYCStatus()` method in `tenant.service.ts`
- Updated `getTenantStats()` to include kycStatus

### Controller Updates
- Restored `POST /api/tenants/:id/kyc` endpoint (Submit KYC)
- Restored `PUT /api/tenants/:id/kyc/status` endpoint (Update KYC Status)
- Restored `GET /api/tenants/kyc/pending` endpoint (Get Pending KYC Tenants)

## Migration Script
Location: `backend/add-tenant-kyc-columns.js`

To run the migration:
```bash
cd backend
node add-tenant-kyc-columns.js
```

## API Endpoints

### Submit KYC
```
POST /api/tenants/:id/kyc
Authorization: Bearer <token>

Body:
{
  "registrationNumber": "string",
  "taxId": "string",
  "documents": {...}
}
```

### Update KYC Status (Admin Only)
```
PUT /api/tenants/:id/kyc/status
Authorization: Bearer <token>

Body:
{
  "status": "APPROVED" | "REJECTED" | "INCOMPLETE",
  "notes": "string (optional)"
}
```

### Get Pending KYC Tenants (Admin Only)
```
GET /api/tenants/kyc/pending
Authorization: Bearer <token>
```

## KYC Workflow

1. **PENDING** - Initial state when tenant is created
2. **SUBMITTED** - Tenant submits KYC documents
3. **UNDER_REVIEW** - Admin is reviewing the submission
4. **APPROVED** - KYC verified and approved
   - Tenant status automatically changes to ACTIVE if it was PENDING_ACTIVATION
5. **REJECTED** - KYC rejected, tenant needs to resubmit
6. **INCOMPLETE** - Missing information, tenant needs to provide more data

## Verification

After migration, verify the columns exist:
```sql
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'tenants'
AND column_name IN ('kycStatus', 'kycData', 'kycSubmittedAt', 'kycVerifiedAt', 'kycNotes')
ORDER BY column_name;
```

## Notes
- All existing tenants will have `kycStatus` set to 'PENDING' by default
- KYC approval can automatically activate tenants that are in PENDING_ACTIVATION status
- KYC data is stored as JSONB for flexibility in document types
- Audit logging is supported via `tenant_kyc_audit_log` table
