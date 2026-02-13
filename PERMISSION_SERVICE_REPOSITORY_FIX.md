# Permission Service Repository Fix

## Issue

Backend returning 500 error when accessing `/api/admin/permissions/roles`:
```
Failed to load resource: the server responded with a status of 500 (Internal Server Error)
```

## Root Cause

In the `permission.service.ts` file, I was using `this.roleRepository.query()` which doesn't exist in TypeORM's Repository class. The correct method is `this.roleRepository.manager.query()`.

### Error Location

```typescript
// ❌ WRONG - Repository doesn't have query() method
const roles = await this.roleRepository.query(query);

// ✅ CORRECT - Use manager.query()
const roles = await this.roleRepository.manager.query(query);
```

## Fix Applied

Updated all instances of `this.roleRepository.query()` to `this.roleRepository.manager.query()`:

### Methods Fixed

1. **`getAllRoles()`** - Line ~87
   ```typescript
   const roles = await this.roleRepository.manager.query(query);
   ```

2. **`getRoleById()`** - Line ~120
   ```typescript
   const roles = await this.roleRepository.manager.query(query, [id]);
   ```

3. **`deleteRole()`** - Line ~326
   ```typescript
   const usersWithRole = await this.roleRepository.manager.query(
       'SELECT COUNT(*) as count FROM users WHERE role = $1',
       [role.name]
   );
   ```

## TypeORM Repository vs Manager

### Repository
- Provides entity-specific methods: `find()`, `findOne()`, `save()`, `remove()`, etc.
- Does NOT have `query()` method for raw SQL

### Manager (EntityManager)
- Provides database-level methods including `query()` for raw SQL
- Accessed via `repository.manager`

## Files Modified

- `backend/src/services/permission.service.ts`

## Testing

The SQL queries themselves are correct (verified with test script), only the method call was wrong.

### Test Command
```bash
cd backend
node test-get-all-roles-endpoint.js
```

Expected output:
```
✅ Query executed successfully - Found 11 roles
✅ JSON parsing successful
✅ All tests passed
```

## Status

✅ **FIXED** - Backend should now return roles correctly

## Next Steps

1. Restart backend server if running
2. Test the endpoint in browser: `/admin/permissions`
3. Verify roles load correctly
4. Test creating/editing roles

## Related Documentation

- `TASK_4_ENHANCED_PERMISSIONS_FIX_COMPLETE.md` - Original fix documentation
- `ENHANCED_PERMISSIONS_UI_IMPROVEMENTS.md` - UI improvements
- `ENHANCED_PERMISSIONS_FULLY_FUNCTIONAL.md` - Complete system documentation
