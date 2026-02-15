# Tenant Subdomain Implementation - Phase 1 Complete

## What Was Implemented

Phase 1 establishes the core subdomain detection and routing infrastructure for multi-tenant support.

### Backend Changes

1. **Subdomain Middleware** (`backend/src/middleware/tenant-subdomain.middleware.ts`)
   - Extracts subdomain from hostname
   - Validates subdomain against database
   - Attaches tenant information to request object
   - Handles reserved subdomains (admin, api, www, etc.)
   - Skips localhost and IP addresses for development

2. **App Module Updates** (`backend/src/app.module.ts`)
   - Registered `TenantSubdomainMiddleware` globally
   - Added `Tenant` entity to TypeORM for middleware access
   - Middleware applies to all routes

### Frontend Changes

1. **Subdomain Utilities** (`frontend/src/utils/subdomain.ts`)
   - `getSubdomain()` - Extract subdomain from hostname
   - `isAdminSubdomain()` - Check if on admin subdomain
   - `getTenantFromSubdomain()` - Get tenant identifier
   - `buildTenantUrl()` - Build URLs for specific tenants
   - `getMainDomain()` - Get domain without subdomain
   - `isTenantSubdomain()` - Check if on tenant subdomain

2. **API Client Updates** (`frontend/src/services/api.ts`)
   - Added subdomain detection to request interceptor
   - Sends `X-Tenant-Subdomain` header with all requests
   - Logs subdomain information for debugging

## How It Works

### Request Flow

```
1. User visits: gasa.urutix.com
2. Frontend detects subdomain: "gasa"
3. Frontend sends API request with header: X-Tenant-Subdomain: gasa
4. Backend middleware extracts subdomain from hostname
5. Backend looks up tenant in database
6. Backend attaches tenant to request object
7. Controllers can access req.tenant, req.tenantId
```

### Development Mode

For local development, the system:
- Skips subdomain detection for `localhost` and `127.0.0.1`
- Falls back to existing tenant ID from localStorage
- Allows testing without DNS configuration

### Reserved Subdomains

These subdomains are reserved for system use:
- `admin` - Super admin panel
- `api` - API endpoints
- `www` - Main website
- `app` - Application
- `cdn` - Content delivery
- `static` - Static assets
- `mail` - Email services
- `ftp` - File transfer

## Testing

### 1. Check Tenant Subdomains

```sql
SELECT id, name, subdomain, status 
FROM tenants 
WHERE deleted_at IS NULL AND subdomain IS NOT NULL;
```

### 2. Test Middleware (Development)

The middleware is now active. Test by:

1. Start backend: `npm run start:dev`
2. Make API request
3. Check backend console for subdomain detection logs

### 3. Test Frontend Detection

Open browser console and run:
```javascript
import { getSubdomain } from './utils/subdomain';
console.log('Subdomain:', getSubdomain());
```

## Next Steps - Phase 2

To fully enable subdomain routing, you'll need:

### 1. Local Development Setup

Edit hosts file for testing:

**Windows**: `C:\Windows\System32\drivers\etc\hosts`
```
127.0.0.1 gasa.localhost
127.0.0.1 acme.localhost
127.0.0.1 admin.localhost
```

Then access: `http://gasa.localhost:5173`

### 2. Update CORS Configuration

**File**: `backend/src/main.ts`

```typescript
app.enableCors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);

    const allowedDomains = ['urutix.com', 'localhost', '127.0.0.1'];
    const isAllowed = allowedDomains.some(domain => 
      origin.includes(domain)
    );

    if (isAllowed) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
});
```

### 3. Production DNS Setup

Configure wildcard DNS:
```
Type    Name    Value               TTL
A       @       your.server.ip      300
A       *       your.server.ip      300
```

### 4. Nginx Configuration

Set up reverse proxy for subdomains (see full guide).

### 5. SSL Certificates

Get wildcard SSL certificate for `*.urutix.com`.

## Current Status

✅ Backend middleware created and registered
✅ Frontend utilities created
✅ API client updated with subdomain headers
✅ Development mode handles localhost correctly
✅ Reserved subdomains protected

⏳ Pending: DNS configuration (production)
⏳ Pending: CORS updates for subdomains
⏳ Pending: Nginx/reverse proxy setup
⏳ Pending: SSL certificates

## Usage Examples

### Backend - Access Tenant from Request

```typescript
@Controller('loads')
export class LoadsController {
  @Get()
  async getLoads(@Request() req) {
    const tenant = req.tenant; // Tenant object
    const tenantId = req.tenantId; // Tenant ID
    const subdomain = req.subdomain; // Subdomain string
    
    // Use tenant information
    return this.loadsService.findByTenant(tenantId);
  }
}
```

### Frontend - Build Tenant URLs

```typescript
import { buildTenantUrl, getSubdomain } from '../utils/subdomain';

// Get current subdomain
const subdomain = getSubdomain(); // "gasa"

// Build URL for another tenant
const acmeUrl = buildTenantUrl('acme', '/dashboard');
// Result: https://acme.urutix.com/dashboard

// Check if on tenant subdomain
if (isTenantSubdomain()) {
  // Show tenant-specific UI
}
```

## Troubleshooting

### Issue: Middleware not detecting subdomain
- Check that backend is restarted
- Verify hostname is not localhost
- Check browser console for subdomain logs

### Issue: Tenant not found
- Verify tenant has subdomain set in database
- Check tenant status is ACTIVE
- Ensure subdomain matches exactly (case-sensitive)

### Issue: CORS errors
- Update CORS configuration to allow subdomains
- Check ALLOWED_ORIGINS environment variable
- Verify credentials: true in CORS config

## Files Modified

- ✅ `backend/src/middleware/tenant-subdomain.middleware.ts` (created)
- ✅ `backend/src/app.module.ts` (updated)
- ✅ `frontend/src/utils/subdomain.ts` (created)
- ✅ `frontend/src/services/api.ts` (updated)

## Restart Required

**Backend**: Yes - restart to load middleware
```powershell
cd backend
npm run start:dev
```

**Frontend**: No - changes are in utilities, will load on next page refresh

---

Phase 1 provides the foundation for subdomain-based multi-tenancy. The system can now detect and route based on subdomains, ready for DNS and production configuration.
