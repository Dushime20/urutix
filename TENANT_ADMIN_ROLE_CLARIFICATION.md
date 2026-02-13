# 🏢 TENANT_ADMIN Role Clarification

## Correct Understanding (Updated)

### TENANT_ADMIN Can Create:
- ✅ **CARGO_OWNER** - Businesses/individuals who need to ship cargo
- ✅ **TRUCK_OWNER** - Transportation companies/truck owners

### TENANT_ADMIN Cannot Create:
- ❌ **DRIVER** - Created by TRUCK_OWNER (each truck owner manages their own drivers)
- ❌ **AGENT** - System-level role (created by SUPER_ADMIN)
- ❌ **LENDER** - System-level role (created by SUPER_ADMIN)
- ❌ **BROKER** - System-level role (created by SUPER_ADMIN)
- ❌ **TENANT_ADMIN** - Created by SUPER_ADMIN only

---

## User Creation Hierarchy

```
SUPER_ADMIN (System Level)
    │
    ├─→ Creates TENANT_ADMIN
    ├─→ Creates AGENT (system-level)
    ├─→ Creates LENDER (system-level)
    └─→ Creates BROKER (system-level)

TENANT_ADMIN (Tenant Level)
    │
    ├─→ Creates CARGO_OWNER
    └─→ Creates TRUCK_OWNER

TRUCK_OWNER (Fleet Level)
    │
    └─→ Creates DRIVER (their own drivers)
```

---

## Role Responsibilities

### SUPER_ADMIN
**Primary Function:** System administration
- Create and manage tenants
- Create TENANT_ADMIN users
- Create system-level roles (AGENT, LENDER, BROKER)
- System-wide configuration
- Cross-tenant operations

### TENANT_ADMIN
**Primary Function:** Tenant business administration
- Create and manage CARGO_OWNER users
- Create and manage TRUCK_OWNER users
- Configure tenant settings
- View tenant-wide analytics
- Accept/reject bids on behalf of cargo owners
- Oversight of all operations within tenant

### TRUCK_OWNER
**Primary Function:** Fleet operations
- Create and manage their own DRIVER users
- Manage their own trucks
- Assign drivers to their trucks
- Bid on loads
- Track their trips

### CARGO_OWNER
**Primary Function:** Shipping operations
- Create and publish loads
- Accept bids from truck owners
- Track shipments
- Make payments

### DRIVER
**Primary Function:** Trip execution
- View assigned trips
- Update trip status
- Upload delivery proof
- Report incidents

---

## Why This Structure?

### 1. TENANT_ADMIN creates CARGO_OWNER and TRUCK_OWNER
**Reason:** These are the primary business users within a tenant. TENANT_ADMIN onboards companies/individuals who will use the platform.

**Example:**
- A logistics company (tenant) wants to onboard:
  - Manufacturing companies (CARGO_OWNER) who need shipping
  - Transportation companies (TRUCK_OWNER) who provide trucks

### 2. TRUCK_OWNER creates DRIVER
**Reason:** Each truck owner knows their own drivers. They hire, manage, and assign their drivers.

**Example:**
- ABC Transport (TRUCK_OWNER) has 10 trucks and 15 drivers
- ABC Transport creates driver accounts for their employees
- ABC Transport assigns drivers to their trucks
- TENANT_ADMIN doesn't need to know ABC Transport's internal driver management

### 3. SUPER_ADMIN creates AGENT, LENDER, BROKER
**Reason:** These are special roles that operate across tenants or require system-level access.

**Example:**
- AGENT: Freight brokers who facilitate deals across multiple tenants
- LENDER: Financial institutions providing loans across tenants
- BROKER: Third-party brokers with special access

---

## Updated User Management Features

### TENANT_ADMIN User Management Dashboard

**Can Manage:**
1. **CARGO_OWNER Users**
   - Create new cargo owner accounts
   - Edit cargo owner information
   - Activate/deactivate cargo owners
   - View cargo owner statistics (loads, shipments, spending)
   - Reset passwords

2. **TRUCK_OWNER Users**
   - Create new truck owner accounts
   - Edit truck owner information
   - Activate/deactivate truck owners
   - View truck owner statistics (trucks, drivers, earnings)
   - Reset passwords

**Can View (Oversight Only):**
3. **DRIVER Users** (created by TRUCK_OWNER)
   - View list of all drivers in tenant
   - View driver details
   - View driver statistics
   - Cannot create/edit/delete drivers
   - Can see which TRUCK_OWNER each driver belongs to

**Cannot See:**
4. **AGENT, LENDER, BROKER** (system-level roles)
   - These are managed at system level by SUPER_ADMIN

---

## Updated Implementation Plan

### User Management Tab Structure

```
User Management
├── Cargo Owners (Tab)
│   ├── List of cargo owners
│   ├── Create cargo owner button
│   ├── Edit/Delete actions
│   └── Statistics per cargo owner
│
├── Truck Owners (Tab)
│   ├── List of truck owners
│   ├── Create truck owner button
│   ├── Edit/Delete actions
│   └── Statistics per truck owner
│
└── Drivers (Tab - View Only)
    ├── List of all drivers in tenant
    ├── Filter by truck owner
    ├── View driver details
    └── No create/edit/delete buttons
```

---

## Updated Frontend Components

### 1. UserManagement Component (Main)
- Two main tabs: "Cargo Owners" and "Truck Owners"
- Optional third tab: "Drivers" (view-only for oversight)
- Statistics cards for each user type

### 2. CargoOwnerList Component
- Table of cargo owners
- Create/Edit/Delete actions
- Search and filter
- Statistics: Total loads, Active loads, Total spent

### 3. TruckOwnerList Component
- Table of truck owners
- Create/Edit/Delete actions
- Search and filter
- Statistics: Total trucks, Active trucks, Total earned

### 4. DriverList Component (View Only)
- Table of all drivers in tenant
- Filter by truck owner
- View details only (no create/edit/delete)
- Shows which truck owner each driver belongs to
- Statistics: Total trips, Rating, Status

### 5. CreateUserModal
- Two variants:
  - Create Cargo Owner form
  - Create Truck Owner form
- Role is pre-selected based on which tab user is on

---

## Database Queries

### TENANT_ADMIN Queries

```sql
-- Get all cargo owners in tenant
SELECT * FROM users 
WHERE tenantId = :tenantId 
AND role = 'CARGO_OWNER';

-- Get all truck owners in tenant
SELECT * FROM users 
WHERE tenantId = :tenantId 
AND role = 'TRUCK_OWNER';

-- Get all drivers in tenant (for oversight)
SELECT u.*, p.firstName, p.lastName, t.ownerId as truckOwnerId
FROM users u
LEFT JOIN user_profiles p ON u.id = p.userId
LEFT JOIN drivers d ON u.id = d.userId
LEFT JOIN trucks t ON d.currentTruckId = t.id
WHERE u.tenantId = :tenantId 
AND u.role = 'DRIVER';
```

### TRUCK_OWNER Queries

```sql
-- Get only their own drivers
SELECT * FROM users 
WHERE tenantId = :tenantId 
AND role = 'DRIVER'
AND id IN (
  SELECT userId FROM drivers 
  WHERE ownerId = :truckOwnerId
);
```

---

## API Endpoints (Updated)

### TENANT_ADMIN Endpoints

```typescript
// Cargo Owner Management
POST   /users/tenant/:tenantId/cargo-owner     - Create cargo owner
GET    /users/tenant/:tenantId/cargo-owners    - Get all cargo owners
PUT    /users/cargo-owner/:userId              - Update cargo owner
DELETE /users/cargo-owner/:userId              - Delete cargo owner

// Truck Owner Management
POST   /users/tenant/:tenantId/truck-owner     - Create truck owner
GET    /users/tenant/:tenantId/truck-owners    - Get all truck owners
PUT    /users/truck-owner/:userId              - Update truck owner
DELETE /users/truck-owner/:userId              - Delete truck owner

// Driver Oversight (View Only)
GET    /users/tenant/:tenantId/drivers         - Get all drivers (read-only)
GET    /users/driver/:userId                   - Get driver details (read-only)
```

### TRUCK_OWNER Endpoints

```typescript
// Driver Management (Own Drivers Only)
POST   /users/truck-owner/:ownerId/driver     - Create driver
GET    /users/truck-owner/:ownerId/drivers    - Get own drivers
PUT    /users/driver/:userId                  - Update own driver
DELETE /users/driver/:userId                  - Delete own driver
POST   /users/driver/:userId/assign-truck     - Assign driver to truck
```

---

## Summary

**TENANT_ADMIN manages the business users:**
- ✅ CARGO_OWNER (shippers)
- ✅ TRUCK_OWNER (transporters)

**TRUCK_OWNER manages their operational users:**
- ✅ DRIVER (their employees)

**SUPER_ADMIN manages system-level users:**
- ✅ TENANT_ADMIN
- ✅ AGENT
- ✅ LENDER
- ✅ BROKER

This creates a clear hierarchy and separation of concerns:
- **System Level** → SUPER_ADMIN
- **Business Level** → TENANT_ADMIN
- **Operational Level** → TRUCK_OWNER

---

**Document Version:** 1.0  
**Last Updated:** February 12, 2026  
**Status:** Clarified and Corrected
