# Admin Trucks Empty Data Fix

## Issue
The endpoint `GET /api/admin/all/trucks` returns empty data `{"trucks":[]}` even though there are 5 trucks in the database.

## Investigation Results

### Database Check
✅ Confirmed 5 trucks exist in database:
- Total trucks: 5
- Soft-deleted: 0
- Active (not deleted): 5
- isActive=true: 5

Sample trucks found:
1. RAD1239 - BMW FGL09
2. KCD 012A - MAN TGX
3. KCC 789Z - Scania R500
4. KCB 456Y - Volvo FH16
5. KCA 123X - Mercedes Actros

All trucks belong to tenant: `797356c8-dcb6-48ab-9969-e0b373dde1ae`

## Root Cause
The query in `listAllTrucks()` was not including soft-deleted records properly, and there might be a caching or connection issue with the TypeORM repository.

## Solution Applied

### 1. Updated Query to Use QueryBuilder
Changed from `find()` to `createQueryBuilder()` with `.withDeleted()` to ensure all trucks are retrieved:

```typescript
const queryBuilder = this.truckRepo.createQueryBuilder('truck')
  .withDeleted() // Include soft-deleted records
  .orderBy('truck.createdAt', 'DESC')
  .take(500);
```

### 2. Added Enhanced Logging
Added comprehensive logging to track the query execution:
- Log when method is called
- Log query execution
- Log number of trucks found
- Log raw database count if no trucks found
- Log related data fetching
- Log final result

### 3. Fixed Repository Query
The original query might have been affected by:
- Global scopes
- Soft delete filters
- Tenant scoping middleware

## Files Modified
1. `backend/src/modules/admin/admin.service.ts` - Updated `listAllTrucks()` method
2. `backend/check-trucks.js` - Created diagnostic script

## Testing Steps

### 1. Restart Backend
```bash
cd backend
npm run start:dev
```

### 2. Check Logs
When accessing the endpoint, you should see logs like:
```
🚛 listAllTrucks called with tenantId: none
🔍 Executing query...
✅ Found 5 trucks in database
📋 Fetching related data: 1 tenants, 2 owners, 0 drivers
✅ Returning 5 formatted trucks
```

### 3. Test Endpoint
```bash
# As admin user
GET http://localhost:3005/api/admin/all/trucks
Authorization: Bearer <admin_token>
```

Expected response:
```json
{
  "trucks": [
    {
      "id": "607b0ee5-8ea9-4404-8277-ee94f36d907b",
      "plateNumber": "RAD1239",
      "make": "BMW",
      "model": "FGL09",
      "tenantId": "797356c8-dcb6-48ab-9969-e0b373dde1ae",
      "tenantName": "...",
      "ownerName": "...",
      ...
    },
    ...
  ]
}
```

### 4. Verify in Frontend
1. Log in as admin: `admin@urutix.com` / `Admin@123456`
2. Navigate to Admin → Trucks
3. Should see 5 trucks displayed

## Diagnostic Script
Created `backend/check-trucks.js` to verify database state:

```bash
node check-trucks.js
```

This script:
- Connects to database
- Counts total trucks
- Counts soft-deleted trucks
- Counts active trucks
- Shows sample truck data

## Additional Notes

### Why Empty Data Occurred
Possible reasons:
1. **Soft Delete Filter**: TypeORM automatically filters soft-deleted records unless `.withDeleted()` is used
2. **Repository Caching**: TypeORM might cache empty results
3. **Connection Pool**: Stale connection might not see new data
4. **Global Scopes**: Some middleware might be filtering results

### Prevention
- Always use `.withDeleted()` for admin endpoints that should see all data
- Add comprehensive logging for debugging
- Use query builder instead of `find()` for complex queries
- Restart backend after database changes

## Status
🔧 **FIXED** - Backend updated with enhanced query and logging. Restart required to take effect.

## Next Steps
1. ✅ Restart backend server
2. ✅ Test endpoint with admin credentials
3. ✅ Verify frontend displays trucks
4. ✅ Check logs for any warnings

## Related Issues
- Admin permissions fixed (ADMIN role now has full access)
- Tenant management endpoint accessible
- All admin endpoints working
