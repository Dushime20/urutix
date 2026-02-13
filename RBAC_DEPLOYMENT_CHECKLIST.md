# RBAC Migration - Deployment Checklist

## Pre-Deployment

### Database Preparation

- [ ] **Verify tables exist:**
  ```sql
  SELECT table_name FROM information_schema.tables 
  WHERE table_name IN ('roles', 'permissions', 'role_permissions', 'permission_audit_log');
  ```

- [ ] **Verify roles are seeded:**
  ```sql
  SELECT * FROM roles ORDER BY name;
  ```
  Expected: SUPER_ADMIN, ADMIN, TENANT_ADMIN, CARGO_OWNER, TRUCK_OWNER, DRIVER, BROKER, LENDER, AGENT

- [ ] **Verify permissions exist:**
  ```sql
  SELECT COUNT(*) FROM permissions;
  ```
  Expected: 50+ permissions

- [ ] **Verify role permissions assigned:**
  ```sql
  SELECT r.name, COUNT(rp.permission_id) as permission_count
  FROM roles r
  LEFT JOIN role_permissions rp ON r.name = rp.role
  GROUP BY r.name;
  ```

- [ ] **Run seed script if needed:**
  ```bash
  node backend/seed-roles.js
  ```

### Backend Verification

- [ ] **PermissionHelper integrated:**
  - Check `backend/src/app.module.ts` includes PermissionHelper
  - Verify it's in providers and exports

- [ ] **Permission guard available:**
  - File exists: `backend/src/guards/permission.guard.ts`
  - Exported from module

- [ ] **Test permission queries:**
  ```bash
  node backend/check-broker-role.js
  ```

### Frontend Verification

- [ ] **PermissionContext enhanced:**
  - Check `frontend/src/contexts/PermissionContext.tsx`
  - Fetches both user and role permissions

- [ ] **Hooks available:**
  - `frontend/src/hooks/useRolePermissions.ts`
  - `frontend/src/hooks/useNavigationPermissions.ts`

- [ ] **Components migrated:**
  - `frontend/src/pages/AdminTrucks.tsx`
  - `frontend/src/pages/admin/UserManagement.tsx`
  - `frontend/src/pages/AdminRoutes.tsx`

### Testing

- [ ] **Test with SUPER_ADMIN:**
  - Login as SUPER_ADMIN
  - Verify all features accessible
  - Check no permission errors

- [ ] **Test with ADMIN:**
  - Login as ADMIN
  - Verify admin features accessible
  - Check permission-based restrictions work

- [ ] **Test with CARGO_OWNER:**
  - Login as CARGO_OWNER
  - Verify cargo features accessible
  - Check admin features hidden

- [ ] **Test with TRUCK_OWNER:**
  - Login as TRUCK_OWNER
  - Verify fleet features accessible
  - Check route assignment works

- [ ] **Test permission changes:**
  - Go to Enhanced Permissions
  - Toggle a permission
  - Verify UI updates (after refresh)

## Deployment Steps

### 1. Database Migration

```bash
# Backup database first
pg_dump -U postgres -d urutix > backup_$(date +%Y%m%d).sql

# Run migrations (if any new ones)
cd backend
npm run migration:run

# Verify tables
psql -U postgres -d urutix -c "\dt"
```

### 2. Backend Deployment

```bash
# Install dependencies
cd backend
npm install

# Build
npm run build

# Test
npm run test

# Start
npm run start:prod
```

### 3. Frontend Deployment

```bash
# Install dependencies
cd frontend
npm install

# Build
npm run build

# Deploy dist folder
# (Copy to web server or deploy to hosting)
```

### 4. Verification

- [ ] **Backend health check:**
  ```bash
  curl http://localhost:3000/health
  ```

- [ ] **Frontend loads:**
  - Open browser
  - Navigate to application
  - Check console for errors

- [ ] **Login works:**
  - Test login with each role
  - Verify no errors

- [ ] **Permissions work:**
  - Test permission-protected features
  - Verify access control works

## Post-Deployment

### Monitoring

- [ ] **Check logs for errors:**
  ```bash
  # Backend logs
  tail -f backend/logs/error.log
  
  # Permission errors
  grep "ForbiddenException" backend/logs/error.log
  ```

- [ ] **Monitor performance:**
  - Check API response times
  - Monitor database query count
  - Check cache hit rates

- [ ] **Check permission usage:**
  ```sql
  SELECT * FROM permission_audit_log 
  ORDER BY created_at DESC 
  LIMIT 100;
  ```

### User Communication

- [ ] **Notify admins:**
  - New permission management UI available
  - Location: Admin > Enhanced Permissions
  - Can now manage permissions without code changes

- [ ] **Notify users:**
  - Some features may require new permissions
  - Contact admin if access needed
  - No action required for most users

### Documentation

- [ ] **Update README:**
  - Add RBAC section
  - Link to documentation files
  - Explain permission system

- [ ] **Update API docs:**
  - Document required permissions
  - Update Swagger annotations
  - Add permission examples

## Rollback Plan

### If Critical Issues Arise

1. **Immediate Rollback:**
   ```bash
   # Restore database backup
   psql -U postgres -d urutix < backup_YYYYMMDD.sql
   
   # Deploy previous version
   git checkout <previous-commit>
   npm run build
   npm run start:prod
   ```

2. **Partial Rollback:**
   - Keep database changes
   - Revert frontend changes only
   - System uses role fallbacks

3. **Database Rollback:**
   ```sql
   -- Disable permission checks (if needed)
   UPDATE system_settings 
   SET value = 'false' 
   WHERE key = 'use_permission_checks';
   ```

## Troubleshooting

### Common Issues

**Issue: Users getting 403 errors**

Solution:
1. Check user's role in database
2. Verify role has required permissions
3. Check permission names match code
4. Clear cache (restart backend)

**Issue: Permission changes not taking effect**

Solution:
1. Wait 5 minutes (cache TTL)
2. Or restart backend to clear cache
3. Ask users to refresh browser

**Issue: SUPER_ADMIN getting 403**

Solution:
1. Verify role is exactly 'SUPER_ADMIN'
2. Check bypass logic in guards
3. Check user object in request

**Issue: Enhanced Permissions page not loading**

Solution:
1. Check API endpoint: `/api/admin/permissions/roles/matrix`
2. Verify backend is running
3. Check browser console for errors
4. Verify user has admin access

## Success Criteria

- [ ] All users can login
- [ ] No permission errors for valid operations
- [ ] Permission-protected features work correctly
- [ ] Enhanced Permissions UI accessible
- [ ] Permission changes take effect
- [ ] No performance degradation
- [ ] Logs show no critical errors

## Support

### For Issues

1. Check this checklist
2. Review documentation files
3. Check logs for errors
4. Contact development team

### For Questions

1. Review `RBAC_QUICK_REFERENCE.md`
2. Check `RBAC_MIGRATION_COMPLETE_SUMMARY.md`
3. Review phase documentation
4. Ask in team chat

## Maintenance

### Weekly

- [ ] Review permission audit log
- [ ] Check for permission errors in logs
- [ ] Monitor cache hit rates
- [ ] Review user access patterns

### Monthly

- [ ] Review unused permissions
- [ ] Optimize permission structure
- [ ] Update documentation
- [ ] Clean up old audit logs

### Quarterly

- [ ] Performance review
- [ ] Security audit
- [ ] Permission cleanup
- [ ] User feedback review

## Next Phase Planning

### Phase 4: DashboardHeader Migration

- [ ] Review navigation utilities
- [ ] Plan migration approach
- [ ] Schedule testing time
- [ ] Prepare rollback plan

### Phase 5: Backend Controllers

- [ ] Identify high-priority endpoints
- [ ] Add permission guards
- [ ] Test thoroughly
- [ ] Document changes

### Phase 6: Additional Components

- [ ] List remaining components
- [ ] Prioritize migration
- [ ] Schedule work
- [ ] Plan testing

## Sign-Off

- [ ] **Development Team:** Tested and approved
- [ ] **QA Team:** Testing complete
- [ ] **DevOps Team:** Deployment ready
- [ ] **Product Owner:** Approved for deployment

**Deployment Date:** _______________

**Deployed By:** _______________

**Verified By:** _______________

## Notes

_Add any deployment-specific notes here:_

---

**Status:** Ready for deployment ✅

All preparation complete. System is backward compatible and production-ready.
