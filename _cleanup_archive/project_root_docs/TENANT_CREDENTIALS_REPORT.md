# Tenant Credentials Report

Generated: February 15, 2026

---

## 📊 Summary

- **Total Tenants**: 13
- **Tenants with Admin Users**: 4
- **Tenants without Admin Users**: 9
- **Total Admin Users**: 6
- **Super Admin Accounts**: 2

---

## 🔐 Super Admin Accounts

### 1. admin@urutix.com
- **Password**: `Admin@123`
- **Status**: ACTIVE ✅
- **Email Verified**: Yes ✅
- **Last Login**: February 13, 2026
- **Login URL**: http://localhost:5173/login

### 2. superadmin@urutix.com
- **Password**: `Admin@123`
- **Status**: ACTIVE ✅
- **Email Verified**: Yes ✅
- **Last Login**: February 15, 2026
- **Login URL**: http://localhost:5173/login

---

## 📦 Tenants with Admin Users

### 1. Gasa (gasa)
**Status**: ACTIVE ✅

#### Admin Users:
1. **tenant.admin@test.com**
   - Password: `Admin@123`
   - Role: TENANT_ADMIN
   - Status: ACTIVE ✅
   - Email Verified: Yes ✅
   - Last Login: November 28, 2025
   - Login URL: http://gasa.localhost:5173/login

2. **admin@test.com**
   - Password: `Admin@123`
   - Role: ADMIN
   - Status: ACTIVE ✅
   - Email Verified: No ❌
   - Last Login: Never
   - Login URL: http://gasa.localhost:5173/login

3. **admin2@urutix.com**
   - Password: `Admin@123`
   - Role: ADMIN
   - Status: ACTIVE ✅
   - Email Verified: Yes ✅
   - Last Login: December 17, 2025
   - Login URL: http://gasa.localhost:5173/login

---

### 2. Solo (urutix)
**Status**: ACTIVE ✅

#### Admin Users:
1. **solo@gmail.com**
   - Password: `Admin@123` (default - may have been changed)
   - Role: TENANT_ADMIN
   - Status: ACTIVE ✅
   - Email Verified: Yes ✅
   - Last Login: Never
   - Login URL: http://urutix.localhost:5173/login

---

### 3. Deborah (deborah.urutixcom)
**Status**: SUSPENDED ⚠️

#### Admin Users:
1. **isdeborah47@gmail.com**
   - Password: User-created (unknown)
   - Role: TENANT_ADMIN
   - Status: ACTIVE ✅
   - Email Verified: Yes ✅
   - Last Login: December 15, 2025
   - Login URL: http://deborah.urutixcom.localhost:5173/login

---

### 4. David (davidurutix)
**Status**: ACTIVE ✅

#### Admin Users:
1. **dkubui@gmail.com**
   - Password: User-created (unknown)
   - Role: TENANT_ADMIN
   - Status: ACTIVE ✅
   - Email Verified: Yes ✅
   - Last Login: Never
   - Login URL: http://davidurutix.localhost:5173/login

---

## ⚠️ Tenants WITHOUT Admin Users

The following tenants have no admin users and need attention:

1. **System** (00000000-0000-0000-0000-000000000001)
   - Status: ACTIVE
   - Subdomain: Not set
   - Created: February 13, 2026

2. **David** (87b0ba8e-9a14-4c8a-a15b-3f1f91fb0888)
   - Status: PENDING_ACTIVATION
   - Subdomain: daviduruti
   - Created: November 28, 2025

3. **Deborah Rutagengwa** (b7d244e3-9a1a-4686-a22f-3fe18468500e)
   - Status: ACTIVE
   - Subdomain: isimbiruti
   - Created: November 28, 2025

4. **Debrah** (6cecdd59-a8b9-4668-bdb8-3785e6090116)
   - Status: PENDING_ACTIVATION
   - Subdomain: deburutix
   - Created: November 28, 2025

5. **Isimbi** (1a4c09d0-e660-4788-a803-38ee1e2c26bd)
   - Status: ACTIVE
   - Subdomain: debbiurutix
   - Created: November 28, 2025

6. **Rutagengwa** (3c233ba2-72b9-4180-89c9-960d1a58dea3)
   - Status: PENDING_ACTIVATION
   - Subdomain: deb
   - Created: November 28, 2025

7. **Deborah** (4c0a03b5-60b4-4676-8140-3d2a4ceaea1a)
   - Status: PENDING_ACTIVATION
   - Subdomain: debbie
   - Created: November 28, 2025

8. **Deborah** (7796e65a-9906-461f-8dc6-6e9b889760f6)
   - Status: PENDING_ACTIVATION
   - Subdomain: deborahurutix
   - Created: November 28, 2025

9. **Demo Tenant B** (4a49a3c2-e0f7-47ad-aec5-1c7f62455fb4)
   - Status: ACTIVE
   - Subdomain: demo-b
   - Created: November 11, 2025

---

## 🔧 How to Fix Tenants Without Admin Users

### Option 1: Fix All Tenants at Once
```powershell
cd backend
node fix-all-tenants-admin-users.js
```

This will create admin users for all tenants that don't have one.

### Option 2: Fix Individual Tenant
```powershell
cd backend
node fix-tenant-admin-user.js
```

Follow the prompts to select a tenant and create an admin user.

---

## 🔐 Password Management

### Default Passwords
All seeded accounts use the default password: `Admin@123`

### Accounts with User-Created Passwords
The following accounts were created by users during signup and have unknown passwords:
- isdeborah47@gmail.com
- dkubui@gmail.com
- solo@gmail.com (may have changed from default)

### Reset Password Options

#### Option 1: Frontend (Recommended)
1. Go to http://localhost:5173/forgot-password
2. Enter email address
3. Check email for reset link
4. Set new password

#### Option 2: Backend Script
```powershell
cd backend
node reset-super-admin-password.js
```

---

## 🚀 Quick Login Guide

### Super Admin Login
1. Go to: http://localhost:5173/login
2. Email: `admin@urutix.com` or `superadmin@urutix.com`
3. Password: `Admin@123`

### Tenant Admin Login (Gasa)
1. Go to: http://gasa.localhost:5173/login
2. Email: `tenant.admin@test.com`
3. Password: `Admin@123`

### Tenant Admin Login (Solo)
1. Go to: http://urutix.localhost:5173/login
2. Email: `solo@gmail.com`
3. Password: `Admin@123` (if not changed)

---

## ⚠️ Security Recommendations

1. **Change Default Passwords**
   - All accounts using `Admin@123` should change their password
   - Use strong passwords with mix of characters

2. **Enable Two-Factor Authentication**
   - Especially for Super Admin accounts
   - Available in user settings

3. **Review Inactive Accounts**
   - Several accounts have never logged in
   - Consider deactivating or removing unused accounts

4. **Fix Tenants Without Admins**
   - 9 tenants have no admin users
   - This prevents proper tenant management
   - Run fix scripts to create admin users

5. **Verify Email Addresses**
   - `admin@test.com` has unverified email
   - Send verification emails to unverified accounts

---

## 📝 Notes

- **System Tenant**: Special tenant (ID: 00000000-0000-0000-0000-000000000001) with no admin users - may be intentional
- **Suspended Tenant**: Deborah (deborah.urutixcom) is suspended but admin can still access
- **Subdomain Issues**: Some subdomains contain invalid characters (dots in subdomain)
- **Pending Activation**: 6 tenants are pending activation - may need review

---

## 🔍 Check Credentials Anytime

Run this command to generate an updated report:
```powershell
cd backend
node check-tenant-credentials.js
```

---

**Last Updated**: February 15, 2026
**Script**: `backend/check-tenant-credentials.js`
