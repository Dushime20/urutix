# RBAC Migration Guide

## Quick Start - Run Migration via API

Since your backend is already running, use this simple method:

### Step 1: Check Migration Status
```bash
curl http://localhost:3000/api/migrations/rbac-status
```

### Step 2: Run Migration
```bash
curl -X POST http://localhost:3000/api/migrations/run-rbac
```

### Alternative: Use the Test Script
```bash
cd backend
node test-migration-api.js
```

## What Gets Created

The migration creates:
- ✅ `permissions` table (52 core permissions)
- ✅ `role_permissions` table (role mappings)
- ✅ `user_permissions` table (user-specific overrides)
- ✅ `permission_audit_log` table (audit trail)
- ✅ `user_all_permissions` view (for queries)

## Integration Steps

### Backend Integration

1. **Add migration routes to your app:**
```typescript
import { Pool } from 'pg';
import { createMigrationRouter } from './routes/migrations.routes';

// In your app setup
const pool = new Pool({ /* your config */ });
app.use('/api/migrations', createMigrationRouter(pool));
```

2. **Use PermissionService in routes:**
```typescript
import { getPermissionService } from './services';
import { createRBACMiddleware } from './middleware/rbac.middleware';

const pool = new Pool({ /* your config */ });
const { requirePermission } = createRBACMiddleware(pool);

// Protect routes
router.post('/cargo', requirePermission('cargo:create'), createCargo);
router.get('/trucks', requirePermission(['truck:view_own', 'truck:view_all']), getTrucks);
```

### Frontend Integration

1. **Wrap your app with PermissionProvider:**
```tsx
import { PermissionProvider } from './contexts/PermissionContext';

<AuthProvider>
  <PermissionProvider>
    <App />
  </PermissionProvider>
</AuthProvider>
```

2. **Use in components:**
```tsx
import { usePermission } from './contexts/PermissionContext';
import { ProtectedAction } from './components/common/ProtectedAction';
import { Permissions } from './utils/permissions';

function MyComponent() {
  const { hasPermission } = usePermission();
  
  return (
    <div>
      <ProtectedAction permission={Permissions.CARGO_CREATE}>
        <button>Create Cargo</button>
      </ProtectedAction>
    </div>
  );
}
```

## Permission Format

Permissions follow the `resource:action` pattern:
- `cargo:create` - Create cargo
- `truck:view_own` - View own trucks
- `admin:manage_tenants` - Manage tenants

## Role Hierarchy

1. **SUPER_ADMIN** - All permissions
2. **ADMIN** - Cross-tenant admin
3. **TENANT_ADMIN** - Tenant management
4. **CARGO_OWNER** - Cargo operations
5. **TRUCK_OWNER** - Fleet management
6. **DRIVER** - Trip operations
7. **AGENT** - View-only access
8. **LENDER** - Payment access

## Troubleshooting

### Migration Already Run
If you see "Migration already run", the tables exist. Check status:
```bash
curl http://localhost:3000/api/migrations/rbac-status
```

### Backend Not Running
Start your backend:
```bash
cd backend
npm run start
```

### Permission Denied
The migration endpoint should be protected in production. Add authentication middleware.

## Security Notes

⚠️ **IMPORTANT**: In production, protect the migration endpoints:
```typescript
router.post('/run-rbac', 
  requireAuth,
  requireRole('SUPER_ADMIN'),
  async (req, res) => { /* ... */ }
);
```

## Next Steps

After migration runs successfully:
1. ✅ Permissions are seeded
2. ✅ Role mappings are configured
3. ✅ Backend service is ready
4. ✅ Frontend context is ready
5. ⏳ Integrate into your routes
6. ⏳ Build admin UI (optional)
