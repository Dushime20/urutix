# Quick Tenant Login Guide 🚀

## Super Admin Access

### Option 1: admin@urutix.com
```
URL: http://localhost:5173/login
Email: admin@urutix.com
Password: Admin@123
```

### Option 2: superadmin@urutix.com
```
URL: http://localhost:5173/login
Email: superadmin@urutix.com
Password: Admin@123
```

---

## Tenant Admin Access

### Gasa Tenant
```
URL: http://gasa.localhost:5173/login
Email: tenant.admin@test.com
Password: Admin@123
```

### Solo Tenant
```
URL: http://urutix.localhost:5173/login
Email: solo@gmail.com
Password: Admin@123
```

### David Tenant (daviduruti)
```
URL: http://daviduruti.localhost:5173/login
Email: david.admin@urutix.com
Password: Admin@123
```

### Deborah Rutagengwa (isimbiruti)
```
URL: http://isimbiruti.localhost:5173/login
Email: deborahrutagengwa.admin@urutix.com
Password: Admin@123
```

### Debrah (deburutix)
```
URL: http://deburutix.localhost:5173/login
Email: debrah.admin@urutix.com
Password: Admin@123
```

### Isimbi (debbiurutix)
```
URL: http://debbiurutix.localhost:5173/login
Email: isimbi.admin@urutix.com
Password: Admin@123
```

### Rutagengwa (deb)
```
URL: http://deb.localhost:5173/login
Email: rutagengwa.admin@urutix.com
Password: Admin@123
```

### Deborah (debbie)
```
URL: http://debbie.localhost:5173/login
Email: deborah.admin@urutix.com
Password: Admin@123
```

### Deborah (deborahurutix)
```
URL: http://deborahurutix.localhost:5173/login
Email: deborah.7796e65a@urutix.com
Password: Admin@123
```

### Demo Tenant B
```
URL: http://demo-b.localhost:5173/login
Email: demotenantb.admin@urutix.com
Password: Admin@123
```

---

## 🔐 Password Reset

If you forget your password:
1. Go to: http://localhost:5173/forgot-password
2. Enter your email
3. Check email for reset link
4. Set new password

---

## ⚠️ Important Notes

1. **Default Password**: All seeded accounts use `Admin@123`
2. **Change Password**: Change default password after first login
3. **Subdomain Access**: Use `subdomain.localhost:5173` for tenant-specific access
4. **Super Admin**: Use `localhost:5173` (no subdomain) for super admin access

---

## 🛠️ Troubleshooting

### Can't Access Subdomain?
Make sure your hosts file includes:
```
127.0.0.1 gasa.localhost
127.0.0.1 urutix.localhost
127.0.0.1 daviduruti.localhost
# ... etc
```

Or use the wildcard DNS (if supported):
```
127.0.0.1 *.localhost
```

### Backend Not Running?
```powershell
cd backend
npm run start:dev
```

### Frontend Not Running?
```powershell
cd frontend
npm run dev
```

---

## 📊 Check All Credentials

Run this command anytime:
```powershell
cd backend
node check-tenant-credentials.js
```

---

**Quick Access**: Save this file for easy reference!
