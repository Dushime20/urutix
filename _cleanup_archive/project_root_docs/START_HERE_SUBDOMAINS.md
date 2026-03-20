# 🎯 START HERE: Activate Tenant Subdomains

## What This Does

Enables each tenant to access the application via their own subdomain:
- `gasa.localhost:5173` → Gasa tenant
- `demo-b.localhost:5173` → Demo Tenant B
- `admin.localhost:5173` → Super admin panel

## Prerequisites

✅ Backend code ready (middleware implemented)
✅ Frontend code ready (utilities implemented)
✅ Database has tenant subdomains configured
✅ CORS configured for subdomain support

## 3-Step Activation

### Step 1: Update Hosts File (2 minutes)

**Right-click PowerShell → Run as Administrator**, then:

```powershell
cd C:\Users\HP\Desktop\urutix\urutix
.\update-hosts-file.ps1
```

This adds subdomain entries to your Windows hosts file so your browser can resolve them.

### Step 2: Restart Backend (1 minute)

```powershell
cd backend
npm run start:dev
```

Wait for: `🚀 UrutiX API is running on: http://localhost:3000`

### Step 3: Test (1 minute)

Open browser to: **http://gasa.localhost:5173**

Open DevTools (F12) and check:
- Console: Should see subdomain detection
- Network tab: API requests should have `X-Tenant-Subdomain: gasa` header

## That's It!

If you can access `http://gasa.localhost:5173` and see the app, subdomains are working!

## Quick Test

Run verification script:
```powershell
.\test-subdomain-setup.ps1
```

## Available Tenant URLs

Try these in your browser:
- http://gasa.localhost:5173
- http://demo-b.localhost:5173
- http://davidurutix.localhost:5173
- http://admin.localhost:5173

## Troubleshooting

### "This site can't be reached"
→ Run `update-hosts-file.ps1` as Administrator

### CORS errors
→ Restart backend

### "Tenant not found"
→ Run `node backend/check-tenant-subdomains.js`

## More Information

- **Detailed Guide**: See `SUBDOMAIN_ACTIVATION_GUIDE.md`
- **Setup Guide**: See `TENANT_SUBDOMAIN_SETUP_GUIDE.md`
- **Phase 1 Details**: See `TENANT_SUBDOMAIN_PHASE1_COMPLETE.md`
- **Phase 2 Details**: See `TENANT_SUBDOMAIN_PHASE2_COMPLETE.md`

## What Happens Next?

Once activated:
1. Each tenant accesses via their subdomain
2. Frontend automatically detects subdomain
3. Backend automatically filters data by tenant
4. Complete tenant isolation
5. Ready for production deployment

---

**Ready?** Run `update-hosts-file.ps1` as Administrator and restart your backend!
