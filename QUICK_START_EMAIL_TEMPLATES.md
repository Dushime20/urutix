# 🚀 Quick Start: Email Templates

## Status: ✅ Ready (Needs Backend Restart)

## One Command to Get Started

```powershell
cd backend
.\restart-backend.ps1
```

That's it! After the backend restarts, your 8 professional email templates will be available.

## Verify It Works

```powershell
cd backend
node test-email-templates-api.js
```

Expected: `✅ Found 8 templates`

## Use Templates

1. Login: `superadmin@urutix.com` / `SuperAdmin@123`
2. Go to: **Admin → Bulk Email**
3. Click: **Create Email Campaign**
4. Select a template and send!

## The 8 Templates

| Template | Category | Use Case |
|----------|----------|----------|
| Welcome to Urutix | Onboarding | New user welcome |
| New Load Match | Notification | Load alerts |
| Payment Confirmation | Transaction | Payment receipts |
| Delivery Completed | Delivery | Delivery confirmations |
| Performance Summary | Report | Monthly reports |
| Document Expiring | Alert | Compliance alerts |
| Subscription Renewal | Subscription | Renewal reminders |
| Feature Launch | Announcement | New features |

## Template Variables

All templates support:
- `{{tenantName}}` - Company name
- `{{email}}` - User email
- `{{firstName}}` - First name
- `{{lastName}}` - Last name
- Plus template-specific variables

## Troubleshooting

**"No templates found"**
→ Restart backend: `.\restart-backend.ps1`

**"No metadata for EmailTemplate"**
→ Backend needs restart to load entity

**Templates still not showing**
→ Clear browser cache (Ctrl+Shift+Delete)

## Files to Know

- `EMAIL_TEMPLATES_READY.md` - Full guide (this file)
- `EMAIL_TEMPLATES_STRATEGY.md` - Strategy details
- `check-email-templates.js` - Verify database
- `test-email-templates-api.js` - Test API

---

**TL;DR:** Run `.\restart-backend.ps1` and you're good to go! 🎉
