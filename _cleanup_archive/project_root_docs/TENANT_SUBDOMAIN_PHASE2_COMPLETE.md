# Tenant Subdomain Implementation - Phase 2 Complete

## What Was Implemented

Phase 2 adds CORS configuration, development tools, and testing utilities for subdomain support.

### Backend Changes

1. **Enhanced CORS Configuration** (`backend/src/main.ts`)
   - Wildcard subdomain support (*.urutix.com)
   - Localhost subdomain support (*.localhost)
   - Pattern matching for subdomain origins
   - Added X-Tenant-Subdomain to allowed headers
   - Detailed logging for CORS decisions

2. **Environment Configuration** (`backend/.env`)
   - Added MAIN_DOMAIN configuration
   - Added ENABLE_SUBDOMAINS flag
   - Updated ALLOWED_ORIGINS with wildcard support

3. **Management Scripts**
   - `check-tenant-subdomains.js` - View all tenant subdomains
   - `add-tenant-subdomains.js` - Interactive subdomain setup
   - `test-subdomain-routing.js` - Test subdomain routing

## How to Use

### Step 1: Check Current Subdomains

```powershell
cd backend
node check-tenant-subdomains.js
```

This shows:
- Tenants with subdomains configured
- Tenants without subdomains
- Suggested subdomains
- Hosts file entries needed

### Step 2: Add Subdomains to Tenants

```powershell
cd backend
node add-tenant-subdomains.js
```

Interactive script that:
- Lists tenants without subdomains
- Suggests subdomain based on tenant name
- Validates subdomain format
- Checks for duplicates
- Updates database

### Step 3: Update Hosts File (Local Development)

**Windows**: Edit `C:\Windows\System32\drivers\etc\hosts` as Administrator

**Mac/Linux**: Edit `/etc/hosts` with sudo

Add entries for each tenant:
```
127.0.0.1 gasa.localhost
127.0.0.1 acme.localhost
127.0.0.1 admin.localhost
```

### Step 4: Restart Backend

```powershell
cd backend
npm run start:dev
```

### Step 5: Test Subdomain Routing

```powershell
cd backend
node test-subdomain-routing.js
```

Tests:
- Requests without subdomain
- Requests with subdomain header
- CORS preflight
- Subdomain.localhost pattern

## CORS Configuration Details

### Development Mode

Automatically allows:
- `http://localhost:5173`
- `http://localhost:5174`
- `http://*.localhost:5173` (wildcard)
- Any `.localhost` subdomain

### Production Mode

Set in `.env`:
```env
ALLOWED_ORIGINS=https://*.urutix.com,https://urutix.com
```

Allows:
- `https://urutix.com` (main domain)
- `https://gasa.urutix.com` (tenant subdomain)
- `https://acme.urutix.com` (tenant subdomain)
- Any subdomain matching `*.urutix.com`

### Wildcard Pattern Matching

The CORS configuration converts wildcard patterns to regex:
- `*.urutix.com` → `/^https?:\/\/[^.]+\.urutix\.com$/`
- Matches: `gasa.urutix.com`, `acme.urutix.com`
- Doesn't match: `sub.gasa.urutix.com` (nested subdomains)

## Testing Locally

### 1. Configure Tenant Subdomains

```powershell
# Check what's configured
node check-tenant-subdomains.js

# Add subdomains if needed
node add-tenant-subdomains.js
```

### 2. Update Hosts File

Add the entries shown by `check-tenant-subdomains.js`:
```
127.0.0.1 gasa.localhost
127.0.0.1 acme.localhost
```

### 3. Access Tenant Subdomains

Open browser:
- `http://gasa.localhost:5173` - Gasa tenant
- `http://acme.localhost:5173` - Acme tenant
- `http://admin.localhost:5173` - Admin panel

### 4. Verify in Browser Console

Open DevTools Console and check:
```javascript
// Should show tenant subdomain
console.log(window.location.hostname); // "gasa.localhost"

// Check API requests include subdomain header
// Look for: X-Tenant-Subdomain: gasa
```

## Subdomain Naming Rules

Valid subdomains must:
- Contain only lowercase letters, numbers, and hyphens
- Start and end with a letter or number
- Be 3-63 characters long
- Not be a reserved subdomain

Reserved subdomains:
- `admin` - Super admin panel
- `api` - API endpoints
- `www` - Main website
- `app` - Application
- `cdn` - Content delivery
- `static` - Static assets
- `mail` - Email services
- `ftp` - File transfer

## Database Schema

Tenants table includes:
```sql
subdomain VARCHAR(255) UNIQUE
```

To check subdomains:
```sql
SELECT id, name, subdomain, status 
FROM tenants 
WHERE deleted_at IS NULL;
```

To add subdomain:
```sql
UPDATE tenants 
SET subdomain = 'gasa', updated_at = NOW() 
WHERE id = 'tenant-id';
```

## Troubleshooting

### Issue: "Tenant not found for subdomain"

**Cause**: Subdomain not configured in database

**Solution**:
```powershell
node check-tenant-subdomains.js
node add-tenant-subdomains.js
```

### Issue: CORS error in browser

**Cause**: Origin not in ALLOWED_ORIGINS

**Solution**: Update `.env`:
```env
ALLOWED_ORIGINS=http://localhost:5173,http://*.localhost:5173
```

Then restart backend.

### Issue: Subdomain.localhost not resolving

**Cause**: Hosts file not updated

**Solution**: Add to hosts file:
```
127.0.0.1 gasa.localhost
```

### Issue: "Subdomain already in use"

**Cause**: Another tenant has that subdomain

**Solution**: Choose a different subdomain or update the other tenant.

### Issue: Backend not detecting subdomain

**Cause**: Middleware not loaded or backend not restarted

**Solution**:
```powershell
# Restart backend
cd backend
npm run start:dev
```

## Production Deployment

### 1. DNS Configuration

Set up wildcard DNS record:
```
Type    Name    Value               TTL
A       @       your.server.ip      300
A       *       your.server.ip      300
CNAME   www     urutix.com          300
```

### 2. Update Environment Variables

```env
NODE_ENV=production
MAIN_DOMAIN=urutix.com
ALLOWED_ORIGINS=https://*.urutix.com,https://urutix.com
ENABLE_SUBDOMAINS=true
```

### 3. SSL Certificates

Get wildcard certificate:
```bash
sudo certbot certonly --manual --preferred-challenges dns \
  -d urutix.com -d *.urutix.com
```

### 4. Nginx Configuration

See `TENANT_SUBDOMAIN_SETUP_GUIDE.md` for full Nginx config.

## API Usage Examples

### Backend - Access Tenant from Request

```typescript
@Controller('loads')
export class LoadsController {
  @Get()
  async getLoads(@Request() req) {
    // Tenant info attached by middleware
    const tenant = req.tenant;
    const tenantId = req.tenantId;
    const subdomain = req.subdomain;
    
    console.log(`Request from tenant: ${tenant.name} (${subdomain})`);
    
    return this.loadsService.findByTenant(tenantId);
  }
}
```

### Frontend - Detect Subdomain

```typescript
import { getSubdomain, isTenantSubdomain } from '../utils/subdomain';

function MyComponent() {
  const subdomain = getSubdomain();
  
  if (isTenantSubdomain()) {
    return <div>Welcome to {subdomain}!</div>;
  }
  
  return <div>Welcome to Urutix</div>;
}
```

## Files Created/Modified

### Created
- ✅ `backend/check-tenant-subdomains.js`
- ✅ `backend/add-tenant-subdomains.js`
- ✅ `backend/test-subdomain-routing.js`

### Modified
- ✅ `backend/src/main.ts` - Enhanced CORS
- ✅ `backend/.env` - Added subdomain config

## Current Status

✅ CORS configured for subdomains
✅ Wildcard pattern matching implemented
✅ Localhost subdomain support added
✅ Management scripts created
✅ Testing utilities ready
✅ Development mode fully functional

⏳ Pending: Production DNS setup
⏳ Pending: SSL certificates
⏳ Pending: Nginx configuration

## Next Steps

### Immediate (Development)
1. Run `node check-tenant-subdomains.js`
2. Run `node add-tenant-subdomains.js` if needed
3. Update hosts file with subdomain entries
4. Restart backend
5. Test in browser at `http://subdomain.localhost:5173`

### Later (Production)
1. Configure DNS with wildcard record
2. Get SSL wildcard certificate
3. Set up Nginx reverse proxy
4. Update production environment variables
5. Deploy and test

## Testing Checklist

- [ ] Backend starts without errors
- [ ] `check-tenant-subdomains.js` shows tenants
- [ ] Subdomains added to database
- [ ] Hosts file updated
- [ ] Can access `http://gasa.localhost:5173`
- [ ] Browser console shows subdomain detection
- [ ] API requests include X-Tenant-Subdomain header
- [ ] CORS allows subdomain requests
- [ ] Middleware attaches tenant to request

---

Phase 2 provides complete local development support for subdomain-based multi-tenancy. The system is ready for testing and can be deployed to production with DNS and SSL configuration.
