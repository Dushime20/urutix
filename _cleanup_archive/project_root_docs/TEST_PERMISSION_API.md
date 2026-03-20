# Testing Permission API - Troubleshooting Guide

## Error: 500 Internal Server Error on `/api/admin/permissions/roles/grant`

### Possible Causes

1. **Backend Server Not Running**
   - Check if backend is running on port 3002
   - Run: `cd backend && npm run start:dev`

2. **Database Connection Issue**
   - Check if PostgreSQL is running
   - Verify DATABASE_URL in `backend/.env`
   - Test connection: `psql $DATABASE_URL`

3. **Missing Permissions Table**
   - Run migrations: `cd backend && npm run migration:run`
   - Or run: `node check-permissions-schema.js`

4. **Missing Permissions Data**
   - Run: `node fix-permissions-schema.js`
   - This will create permissions and role_permissions tables with data

### Quick Fix Steps

```bash
# 1. Navigate to backend
cd backend

# 2. Check if permissions table exists
node check-permissions-schema.js

# 3. If missing, create it
node fix-permissions-schema.js

# 4. Restart backend server
npm run start:dev

# 5. Test the API
curl -X POST http://localhost:3002/api/admin/permissions/roles/grant \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"role": "DRIVER", "permission": "cargo:view"}'
```

### Expected Request Format

```json
POST /api/admin/permissions/roles/grant
Headers:
  Content-Type: application/json
  Authorization: Bearer <token>

Body:
{
  "role": "DRIVER",
  "permission": "cargo:create"
}
```

### Expected Response

```json
{
  "success": true,
  "message": "Role permission granted successfully"
}
```

### Check Backend Logs

Look for errors in the backend console:
- Permission not found errors
- Database connection errors
- Transaction errors
- Authentication errors

### Verify Database Schema

The `role_permissions` table should have:
```sql
CREATE TABLE role_permissions (
  role VARCHAR NOT NULL,
  permission_id UUID NOT NULL,
  granted_at TIMESTAMP DEFAULT NOW(),
  granted_by VARCHAR,
  PRIMARY KEY (role, permission_id),
  FOREIGN KEY (permission_id) REFERENCES permissions(id)
);
```

### Verify Permissions Table

The `permissions` table should have:
```sql
CREATE TABLE permissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR UNIQUE NOT NULL,
  resource VARCHAR NOT NULL,
  action VARCHAR NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Common Issues

1. **"Permission not found"**
   - Run `node fix-permissions-schema.js` to populate permissions

2. **"Role not found"**
   - Check if role is valid: CARGO_OWNER, TRUCK_OWNER, DRIVER, AGENT, LENDER, BROKER, TENANT_ADMIN, SUPER_ADMIN

3. **"Unauthorized"**
   - Ensure you're logged in as SUPER_ADMIN
   - Check token is valid and not expired

4. **"Database connection failed"**
   - Check PostgreSQL is running
   - Verify DATABASE_URL in .env
   - Check firewall/network settings

### Test with Postman/Thunder Client

1. Login as SUPER_ADMIN to get token
2. Use token in Authorization header
3. Send POST request to grant endpoint
4. Check response and backend logs

### Alternative: Use SQL Directly

If API continues to fail, you can grant permissions directly:

```sql
-- Grant permission to role
INSERT INTO role_permissions (role, permission_id, granted_by)
SELECT 'DRIVER', id, 'admin'
FROM permissions 
WHERE name = 'cargo:create'
ON CONFLICT (role, permission_id) DO NOTHING;
```

### Check Current Permissions

```sql
-- View all role permissions
SELECT 
  rp.role,
  p.name as permission,
  p.resource,
  p.action,
  rp.granted_at
FROM role_permissions rp
JOIN permissions p ON rp.permission_id = p.id
ORDER BY rp.role, p.resource, p.action;
```

### Next Steps

1. Start backend server if not running
2. Run `node fix-permissions-schema.js` to ensure tables exist
3. Check backend console for specific error messages
4. Try the API call again
5. If still failing, check backend logs and share the error message
