# Tenant Subdomain Activation Guide

## Current Status

✅ **Phase 1 Complete**: Backend middleware and frontend utilities created
✅ **Phase 2 Complete**: CORS configuration and management scripts ready
✅ **Tenants Configured**: 12 out of 13 tenants have subdomains

## What You Need to Do Now

Follow these steps to activate subdomain routing:

### Step 1: Update Hosts File (Windows)

You need to add subdomain entries to your Windows hosts file so your browser can resolve them locally.

#### Option A: Automatic (Recommended)

Run the PowerShell script as Administrator:

```powershell
# Right-click PowerShell -> Run as Administrator
cd C:\Users\HP\Desktop\urutix\urutix
.\update-hosts-file.ps1
```

This script will:
- Backup your current hosts file
- Add all tenant subdomain entries
- Show you which entries were added

#### Option B: Manual

1. Open Notepad as Administrator
2. Open file: `C:\Windows\System32\drivers\etc\hosts`
3. Add these lines at the end:

```
# Urutix Tenant Subdomains
127.0.0.1 daviduruti.localhost
127.0.0.1 isimbiruti.localhost
127.0.0.1 deburutix.localhost
127.0.0.1 debbiurutix.localhost
127.0.0.1 deb.localhost
127.0.0.1 debbie.localhost
127.0.0.1 deborahurutix.localhost
127.0.0.1 davidurutix.localhost
127.0.0.1 deborah.urutixcom.localhost
127.0.0.1 urutix.localhost
127.0.0.1 demo-b.localhost
127.0.0.1 gasa.localhost
127.0.0.1 admin.localhost
```

4. Save and close

### Step 2: Restart Backend

The backend needs to be restarted to load the subdomain middleware:

```powershell
cd backend
npm run start:dev
```

Wait for the message:
```
🚀 UrutiX API is running on: http://localhost:3000
```

### Step 3: Start Frontend (if not running)

```powershell
cd frontend
npm run dev
```

### Step 4: Test Subdomain Routing

Open your browser and test these URLs:

#### Test 1: Gasa Tenant
```
http://gasa.localhost:5173
```

Expected behavior:
- Page loads normally
- Open browser DevTools Console (F12)
- Check for subdomain detection logs
- API requests should include `X-Tenant-Subdomain: gasa` header

#### Test 2: Demo-B Tenant
```
http://demo-b.localhost:5173
```

#### Test 3: Admin Subdomain
```
http://admin.localhost:5173
```

### Step 5: Verify Subdomain Detection

Open browser console (F12) and check:

1. **Network Tab**:
   - Click on any API request
   - Check Request Headers
   - Should see: `X-Tenant-Subdomain: gasa` (or whatever subdomain you're on)

2. **Console Tab**:
   - Should see subdomain detection logs from the API client

3. **Backend Console**:
   - Should see CORS logs: `✅ CORS: Allowed request from http://gasa.localhost:5173`
   - Should see tenant detection in middleware

## How It Works

### Request Flow

```
1. User visits: http://gasa.localhost:5173
   ↓
2. Frontend detects subdomain: "gasa"
   ↓
3. Frontend sends API request with header: X-Tenant-Subdomain: gasa
   ↓
4. Backend middleware extracts subdomain from hostname
   ↓
5. Backend looks up tenant in database (subdomain = 'gasa')
   ↓
6. Backend attaches tenant to request object
   ↓
7. Controllers can access: req.tenant, req.tenantId, req.subdomain
   ↓
8. Response sent back with tenant-specific data
```

### Available Tenants

Based on your database, these tenants are ready:

| Tenant Name | Subdomain | Status | URL |
|------------|-----------|--------|-----|
| Gasa | gasa | ACTIVE | http://gasa.localhost:5173 |
| Demo Tenant B | demo-b | ACTIVE | http://demo-b.localhost:5173 |
| Isimbi | debbiurutix | ACTIVE | http://debbiurutix.localhost:5173 |
| Deborah Rutagengwa | isimbiruti | ACTIVE | http://isimbiruti.localhost:5173 |
| David | davidurutix | ACTIVE | http://davidurutix.localhost:5173 |
| Solo | urutix | ACTIVE | http://urutix.localhost:5173 |

## Testing Checklist

- [ ] Hosts file updated with subdomain entries
- [ ] Backend restarted successfully
- [ ] Frontend running
- [ ] Can access http://gasa.localhost:5173
- [ ] Browser console shows subdomain detection
- [ ] API requests include X-Tenant-Subdomain header
- [ ] Backend console shows CORS approval
- [ ] Backend console shows tenant detection
- [ ] Can switch between different tenant subdomains
- [ ] Each subdomain shows correct tenant data

## Troubleshooting

### Issue: "This site can't be reached"

**Cause**: Hosts file not updated or DNS cache

**Solution**:
```powershell
# Flush DNS cache
ipconfig /flushdns

# Verify hosts file entry exists
notepad C:\Windows\System32\drivers\etc\hosts
```

### Issue: CORS Error in Browser

**Cause**: Backend not allowing subdomain origin

**Solution**: Check backend console for CORS logs. Should see:
```
✅ CORS: Allowed request from http://gasa.localhost:5173 (localhost subdomain)
```

If you see blocked message, restart backend.

### Issue: "Tenant not found for subdomain"

**Cause**: Tenant subdomain not in database or tenant not ACTIVE

**Solution**:
```powershell
cd backend
node check-tenant-subdomains.js
```

Verify tenant has subdomain and status is ACTIVE.

### Issue: Subdomain not detected in frontend

**Cause**: Browser cache or service worker

**Solution**:
1. Hard refresh: Ctrl + Shift + R
2. Clear browser cache
3. Open in incognito/private window

### Issue: Backend not detecting subdomain

**Cause**: Middleware not loaded or backend not restarted

**Solution**:
```powershell
# Stop backend (Ctrl+C)
cd backend
npm run start:dev
```

Check backend console for startup messages.

## Development Workflow

### Working with Specific Tenant

1. Open browser to tenant subdomain: `http://gasa.localhost:5173`
2. Login with tenant user credentials
3. All API requests automatically include tenant context
4. Backend filters data by tenant automatically

### Switching Between Tenants

1. Open new browser tab
2. Navigate to different subdomain: `http://demo-b.localhost:5173`
3. Login with that tenant's credentials
4. Each tab maintains separate tenant context

### Testing Multi-Tenant Features

1. Open multiple browser windows
2. Each window on different subdomain
3. Login to each with different tenant users
4. Verify data isolation between tenants

## Backend Usage

Controllers automatically have access to tenant information:

```typescript
@Controller('loads')
export class LoadsController {
  @Get()
  async getLoads(@Request() req) {
    // Tenant info from middleware
    const tenant = req.tenant;        // Full tenant object
    const tenantId = req.tenantId;    // Tenant ID
    const subdomain = req.subdomain;  // Subdomain string
    
    console.log(`Request from: ${tenant.name} (${subdomain})`);
    
    // Use tenant context
    return this.loadsService.findByTenant(tenantId);
  }
}
```

## Frontend Usage

Detect and use subdomain information:

```typescript
import { getSubdomain, isTenantSubdomain } from '../utils/subdomain';

function MyComponent() {
  const subdomain = getSubdomain(); // "gasa"
  
  if (isTenantSubdomain()) {
    return <div>Welcome to {subdomain}!</div>;
  }
  
  return <div>Welcome to Urutix</div>;
}
```

## Next Steps (Production)

Once local testing is complete, for production deployment:

1. **DNS Configuration**: Set up wildcard DNS (*.urutix.com)
2. **SSL Certificates**: Get wildcard SSL certificate
3. **Nginx Setup**: Configure reverse proxy for subdomains
4. **Environment Variables**: Update production .env
5. **Deploy**: Deploy backend and frontend

See `TENANT_SUBDOMAIN_SETUP_GUIDE.md` for production deployment details.

## Summary

Your subdomain system is ready to use! Just:

1. ✅ Run `update-hosts-file.ps1` as Administrator
2. ✅ Restart backend
3. ✅ Test at `http://gasa.localhost:5173`

The infrastructure is complete - middleware, CORS, utilities, and database are all configured. You just need to update your hosts file and restart the backend to activate it.

---

**Need Help?**

- Check backend console for logs
- Check browser console for errors
- Run `node check-tenant-subdomains.js` to verify configuration
- See `TENANT_SUBDOMAIN_SETUP_GUIDE.md` for detailed documentation
