# Tenant Admin Data Sharing Fix

## 🚨 Issue Description

**Problem**: Multiple tenant admins for the same tenant are NOT seeing the same data. Admin 2 cannot see data created by Admin 1.

**Root Cause**: Some endpoints are filtering by `userId` (individual admin's ID) instead of `tenantId` (company/organization ID).

**Example**:
```
Tenant: Company XYZ (tenantId: 49e52b60-7c9f-4946-a6ca-2fe8bb0d9e95)
├── Admin 1 (userId: abc-123) - Created May 2nd
│   └── Can see: Trucks, Drivers, Loads created by Admin 1 ✅
│   └── Cannot see: Nothing (created everything)
│
└── Admin 2 (userId: def-456) - Created May 6th  
    └── Can see: Only their own data ❌
    └── Cannot see: Trucks, Drivers, Loads created by Admin 1 ❌
```

**Expected Behavior**:
```
Tenant: Company XYZ (tenantId: 49e52b60-7c9f-4946-a6ca-2fe8bb0d9e95)
├── Admin 1 (userId: abc-123)
│   └── Can see: ALL tenant data ✅
│
└── Admin 2 (userId: def-456)
    └── Can see: ALL tenant data ✅
```

---

## 🔍 How to Identify the Issue

### ❌ WRONG (Filters by userId):
```typescript
// BAD: Only shows data created by this specific admin
const trucks = await truckRepository.find({
  where: { ownerId: user.id }  // ❌ Wrong!
});

const loads = await loadRepository.find({
  where: { cargoOwnerId: user.id }  // ❌ Wrong!
});

const drivers = await driverRepository.find({
  where: { createdBy: user.id }  // ❌ Wrong!
});
```

### ✅ CORRECT (Filters by tenantId):
```typescript
// GOOD: Shows ALL data for the tenant
const trucks = await truckRepository.find({
  where: { tenantId: user.tenantId }  // ✅ Correct!
});

const loads = await loadRepository.find({
  where: { tenantId: user.tenantId }  // ✅ Correct!
});

const drivers = await driverRepository.find({
  where: { tenantId: user.tenantId }  // ✅ Correct!
});
```

---

## 🎯 Rule of Thumb

### When to use `tenantId`:
- **Tenant Admins** viewing tenant-wide data
- **Listing** all resources (trucks, drivers, loads, etc.)
- **Dashboard** statistics and metrics
- **Reports** and analytics
- **Billing** and subscriptions

### When to use `userId`:
- **Individual user** settings/preferences
- **Personal** notifications
- **User-specific** audit logs
- **My Profile** page
- **Personal** API tokens

---

## 🔧 Endpoints That Need Fixing

### 1. Trucks/Fleet Management

**File**: `backend/src/modules/fleet/*.service.ts`

❌ **Before**:
```typescript
async getMyTrucks(user: User) {
  return this.truckRepository.find({
    where: { ownerId: user.id }  // ❌ Only shows trucks owned by this admin
  });
}
```

✅ **After**:
```typescript
async getMyTrucks(user: User) {
  // For TENANT_ADMIN: show ALL tenant trucks
  if (user.role === 'TENANT_ADMIN' || user.role === 'ADMIN') {
    return this.truckRepository.find({
      where: { tenantId: user.tenantId }  // ✅ Shows all tenant trucks
    });
  }
  
  // For TRUCK_OWNER: show only their trucks
  return this.truckRepository.find({
    where: { ownerId: user.id, tenantId: user.tenantId }
  });
}
```

### 2. Loads/Cargo Management

**File**: `backend/src/modules/loads/*.service.ts`

❌ **Before**:
```typescript
async getMyLoads(user: User) {
  return this.loadRepository.find({
    where: { cargoOwnerId: user.id }  // ❌ Only shows loads created by this admin
  });
}
```

✅ **After**:
```typescript
async getMyLoads(user: User) {
  // For TENANT_ADMIN: show ALL tenant loads
  if (user.role === 'TENANT_ADMIN' || user.role === 'ADMIN') {
    return this.loadRepository.find({
      where: { tenantId: user.tenantId }  // ✅ Shows all tenant loads
    });
  }
  
  // For CARGO_OWNER: show only their loads
  return this.loadRepository.find({
    where: { cargoOwnerId: user.id, tenantId: user.tenantId }
  });
}
```

### 3. Drivers Management

**File**: `backend/src/modules/drivers/*.service.ts`

❌ **Before**:
```typescript
async getMyDrivers(user: User) {
  return this.driverRepository.find({
    where: { createdBy: user.id }  // ❌ Only shows drivers created by this admin
  });
}
```

✅ **After**:
```typescript
async getMyDrivers(user: User) {
  // For TENANT_ADMIN: show ALL tenant drivers
  if (user.role === 'TENANT_ADMIN' || user.role === 'ADMIN') {
    return this.driverRepository.find({
      where: { tenantId: user.tenantId }  // ✅ Shows all tenant drivers
    });
  }
  
  // For TRUCK_OWNER: show only their drivers
  return this.driverRepository.find({
    where: { ownerId: user.id, tenantId: user.tenantId }
  });
}
```

### 4. Bidding

**File**: `backend/src/modules/bidding/*.service.ts`

❌ **Before**:
```typescript
async getMyBids(user: User) {
  return this.bidRepository.find({
    where: { truckOwnerId: user.id }  // ❌ Only shows bids by this admin
  });
}
```

✅ **After**:
```typescript
async getMyBids(user: User) {
  // For TENANT_ADMIN: show ALL tenant bids
  if (user.role === 'TENANT_ADMIN' || user.role === 'ADMIN') {
    // Get all trucks for this tenant
    const trucks = await this.truckRepository.find({
      where: { tenantId: user.tenantId },
      select: ['id']
    });
    const truckIds = trucks.map(t => t.id);
    
    return this.bidRepository.find({
      where: { truckId: In(truckIds) }  // ✅ Shows all tenant bids
    });
  }
  
  // For TRUCK_OWNER: show only their bids
  return this.bidRepository.find({
    where: { truckOwnerId: user.id }
  });
}
```

### 5. Credits/Subscriptions

**File**: `backend/src/services/credit.service.ts`

✅ **Already Correct** (uses tenantId):
```typescript
async getCreditBalance(user: User) {
  return this.creditAccountRepository.findOne({
    where: { 
      tenantId: user.tenantId,  // ✅ Correct!
      userId: null  // Tenant-level account
    }
  });
}
```

---

## 📝 Implementation Pattern

### Helper Method to Add to Services:

```typescript
/**
 * Determines if user should see tenant-wide data or only their own
 */
private shouldShowTenantWideData(user: User): boolean {
  return user.role === 'TENANT_ADMIN' || 
         user.role === 'ADMIN' || 
         user.role === 'SUPER_ADMIN';
}

/**
 * Gets the appropriate where clause based on user role
 */
private getWhereClause(user: User, entityType: 'truck' | 'load' | 'driver') {
  if (this.shouldShowTenantWideData(user)) {
    // Show all tenant data
    return { tenantId: user.tenantId };
  }
  
  // Show only user's own data
  switch (entityType) {
    case 'truck':
      return { ownerId: user.id, tenantId: user.tenantId };
    case 'load':
      return { cargoOwnerId: user.id, tenantId: user.tenantId };
    case 'driver':
      return { ownerId: user.id, tenantId: user.tenantId };
  }
}
```

---

## 🧪 Testing Checklist

After fixing, test with 2 tenant admins:

### Admin 1 (Original):
- [ ] Can see all trucks
- [ ] Can see all drivers
- [ ] Can see all loads
- [ ] Can see all bids
- [ ] Can see all payments
- [ ] Can see tenant revenue
- [ ] Can see tenant subscriptions

### Admin 2 (New):
- [ ] Can see all trucks (including those created by Admin 1)
- [ ] Can see all drivers (including those created by Admin 1)
- [ ] Can see all loads (including those created by Admin 1)
- [ ] Can see all bids (including those placed by Admin 1)
- [ ] Can see all payments (including those from Admin 1)
- [ ] Can see same tenant revenue as Admin 1
- [ ] Can see same tenant subscriptions as Admin 1

---

## 🎯 Files to Check and Fix

1. `backend/src/modules/fleet/*.service.ts` - Truck management
2. `backend/src/modules/loads/*.service.ts` - Load management
3. `backend/src/modules/drivers/*.service.ts` - Driver management
4. `backend/src/modules/bidding/*.service.ts` - Bidding system
5. `backend/src/modules/trips/*.service.ts` - Trip management
6. Any controller with `@Get('my-*')` endpoints

---

## 💡 Quick Fix Script

To find all problematic endpoints:

```bash
# Search for userId filters that should be tenantId
grep -r "where.*user\.id" backend/src/modules/
grep -r "ownerId.*user\.id" backend/src/modules/
grep -r "cargoOwnerId.*user\.id" backend/src/modules/
grep -r "createdBy.*user\.id" backend/src/modules/
```

---

## ✅ Success Criteria

Fix is complete when:
1. ✅ Multiple tenant admins see identical data
2. ✅ New admin sees historical data from before they joined
3. ✅ Truck owners still see only their own trucks
4. ✅ Cargo owners still see only their own loads
5. ✅ Tenant admins see ALL tenant resources

---

**Priority**: HIGH  
**Impact**: Multiple tenant admins cannot collaborate  
**Effort**: Medium (need to update multiple services)
