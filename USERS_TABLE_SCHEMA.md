# 👥 Users Table Schema

**Database:** PostgreSQL  
**Table Name:** `users`  
**Entity:** `User` (backend/src/entities/user.entity.ts)

---

## 📊 Table Columns

| Column Name | Data Type | Nullable | Default | Description |
|-------------|-----------|----------|---------|-------------|
| **id** | UUID | NO | uuid_generate_v4() | Primary key |
| **tenantId** | UUID | NO | - | Foreign key to tenants table (Company ID) |
| **email** | VARCHAR | NO | - | User email address |
| **phone** | VARCHAR | YES | NULL | User phone number |
| **passwordHash** | VARCHAR | NO | - | Hashed password |
| **emailVerifiedAt** | TIMESTAMP | YES | NULL | Email verification timestamp |
| **phoneVerifiedAt** | TIMESTAMP | YES | NULL | Phone verification timestamp |
| **twoFactorEnabled** | BOOLEAN | NO | false | 2FA enabled flag |
| **twoFactorSecret** | VARCHAR | YES | NULL | 2FA secret key |
| **role** | ENUM | NO | 'CARGO_OWNER' | User role |
| **status** | ENUM | NO | 'PENDING_VERIFICATION' | User status |
| **lastLoginAt** | TIMESTAMP | YES | NULL | Last login timestamp |
| **loginAttempts** | INTEGER | NO | 0 | Failed login attempts counter |
| **lockedUntil** | TIMESTAMP | YES | NULL | Account lock expiry |
| **createdByCargoOwnerId** | UUID | YES | NULL | For receivers: ID of cargo owner who created them |
| **brokerTenantId** | UUID | YES | NULL | For brokers: ID of tenant they work for |
| **totalCommissionEarned** | DECIMAL(10,2) | YES | 0 | Total commission earned by broker |
| **defaultCommissionRate** | DECIMAL(5,2) | YES | NULL | Default commission percentage |
| **createdAt** | TIMESTAMP | NO | CURRENT_TIMESTAMP | Record creation timestamp |
| **updatedAt** | TIMESTAMP | NO | CURRENT_TIMESTAMP | Record update timestamp |
| **deleted_at** | TIMESTAMP | YES | NULL | Soft delete timestamp |

---

## 🔑 Indexes

1. **Primary Key:** `id`
2. **Unique Index:** `(tenantId, email, role)` WHERE deleted_at IS NULL
3. **Index:** `(role, status)`
4. **Index:** `(email)`

---

## 🎭 Role Enum Values

```typescript
enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ADMIN = 'ADMIN',
  TENANT_ADMIN = 'TENANT_ADMIN',
  CARGO_OWNER = 'CARGO_OWNER',
  CARGO_RECEIVER = 'CARGO_RECEIVER',
  TRUCK_OWNER = 'TRUCK_OWNER',
  DRIVER = 'DRIVER',
  AGENT = 'AGENT',
  LENDER = 'LENDER',
  BROKER = 'BROKER'
}
```

---

## 📊 Status Enum Values

```typescript
enum UserStatus {
  PENDING_VERIFICATION = 'PENDING_VERIFICATION',
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
  DEACTIVATED = 'DEACTIVATED'
}
```

---

## 🔗 Relationships

### One-to-One
- **profile** → `user_profiles` table (via `userId`)

### Many-to-One
- **tenant** → `tenants` table (via `tenantId`)
- **createdByCargoOwner** → `users` table (via `createdByCargoOwnerId`)
- **brokerTenant** → `tenants` table (via `brokerTenantId`)

### One-to-Many
- **loads** → `loads` table (as cargoOwner)
- **assignedCargos** → `loads` table (as receiver)
- **createdReceivers** → `users` table (receivers created by this cargo owner)
- **bids** → `bids` table (as truckOwner)
- **trucks** → `trucks` table (as owner)
- **brokerLoads** → `loads` table (as broker)
- **brokerCommissions** → `broker_commissions` table
- **auctionViews** → `auction_views` table
- **auctionWatches** → `auction_watches` table

---

## 📝 Important Notes

### Tenant Isolation
- Every user MUST have a `tenantId` (Company ID)
- Users can only access data within their own tenant
- SUPER_ADMIN can access all tenants

### Email Uniqueness
- Email is unique per tenant (not globally unique)
- Same email can exist in different tenants
- Unique constraint: `(tenantId, email, role)`

### Soft Delete
- Uses `deleted_at` column for soft deletes
- Deleted users are not physically removed
- Queries should filter WHERE `deleted_at IS NULL`

### Security
- Passwords are hashed using bcrypt (12 rounds)
- 2FA support available
- Account locking after failed login attempts
- Email and phone verification supported

### Broker-Specific Fields
- `brokerTenantId`: Links broker to the tenant they work for
- `totalCommissionEarned`: Tracks total earnings
- `defaultCommissionRate`: Default commission percentage (e.g., 5.00 for 5%)

### Cargo Receiver Hierarchy
- `createdByCargoOwnerId`: Links receivers to the cargo owner who created them
- Allows cargo owners to create and manage their own receivers

---

## 🔍 Sample Query

### Get all users for a tenant (company)
```sql
SELECT 
  u.id,
  u.email,
  u.role,
  u.status,
  u.created_at,
  p.first_name,
  p.last_name,
  p.company_name
FROM users u
LEFT JOIN user_profiles p ON u.id = p.user_id
WHERE u.tenant_id = '797356c8-dcb6-48ab-9969-e0b373dde1ae'
  AND u.deleted_at IS NULL
ORDER BY u.created_at DESC;
```

### Get active users by role
```sql
SELECT 
  u.id,
  u.email,
  u.role,
  u.last_login_at
FROM users u
WHERE u.tenant_id = '797356c8-dcb6-48ab-9969-e0b373dde1ae'
  AND u.role = 'CARGO_OWNER'
  AND u.status = 'ACTIVE'
  AND u.deleted_at IS NULL;
```

### Get users with their profiles
```sql
SELECT 
  u.id,
  u.email,
  u.role,
  u.status,
  p.first_name || ' ' || p.last_name as full_name,
  p.company_name,
  p.rating,
  p.total_trips
FROM users u
INNER JOIN user_profiles p ON u.id = p.user_id
WHERE u.tenant_id = '797356c8-dcb6-48ab-9969-e0b373dde1ae'
  AND u.deleted_at IS NULL
ORDER BY p.rating DESC;
```

---

## 📈 Statistics

### Total Columns: 21
- **Required (NOT NULL):** 9 columns
- **Optional (NULL):** 12 columns
- **Timestamps:** 5 columns
- **Foreign Keys:** 3 columns
- **Enums:** 2 columns
- **Booleans:** 1 column
- **Decimals:** 2 columns

---

**Document Version:** 1.0  
**Last Updated:** February 12, 2026  
**Status:** Complete ✅
