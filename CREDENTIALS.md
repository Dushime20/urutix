# Urutix Logistics Platform - Test Credentials

## System Access Information

### Frontend URL
- **Development**: http://localhost:5175/
- **Backend API**: http://localhost:3005/

### Database Connection
- **Host**: 127.0.0.1
- **Port**: 5433
- **Database**: urutix
- **Username**: postgres
- **Password**: 1234

---

## User Accounts

### 🔑 **Default Password for All Users**: `test123`

---

## Admin Users

### System Administrator
- **Email**: `admin@urutix.com`
- **Password**: `Admin@123456`
- **Role**: ADMIN
- **Tenant**: Admin Global
- **Status**: ✅ Email Verified (ACTIVE)
- **Access**: Full system administration

### Super Admin
- **Email**: `urutixv@gmail.com`
- **Password**: `test123`
- **Role**: ADMIN
- **Tenant**: Admin Global
- **Status**: ✅ Email Verified
- **Access**: Full system administration

### Admin Cargo Owner
- **Email**: `test@gmail.com`
- **Password**: `test123`
- **Role**: CARGO_OWNER
- **Tenant**: Admin Global
- **Status**: ✅ Email Verified

---

## Default Tenant Users (Uruti-X Default)

### Tenant Administrator
- **Email**: `tenant.admin@test.com`
- **Password**: `test123`
- **Role**: TENANT_ADMIN
- **Status**: ✅ Email Verified
- **Access**: Tenant-level administration

### Demo Tenant Administrator
- **Email**: `tenantadmin@demo.com`
- **Password**: `TenantAdmin@123`
- **Role**: TENANT_ADMIN
- **Tenant**: Demo Tenant
- **Status**: ✅ Email Verified (ACTIVE)
- **Access**: Full tenant administration for Demo Tenant

### Verified Cargo Owners
- **Email**: `tenant@gmail.com`
- **Password**: `test123`
- **Role**: CARGO_OWNER
- **Status**: ✅ Email Verified

- **Email**: `cargownertest@gmail.com`
- **Password**: `test123`
- **Role**: CARGO_OWNER
- **Status**: ✅ Email Verified

---

## Test Users (Uruti-X Default Tenant)

### Cargo Owners
- **Email**: `cargo.owner@test.com`
- **Password**: `test123`
- **Role**: CARGO_OWNER
- **Status**: ⚠️ Email Not Verified

- **Email**: `cargo.owner2@test.com`
- **Password**: `test123`
- **Role**: CARGO_OWNER
- **Status**: ⚠️ Email Not Verified

### Truck Owners
- **Email**: `truck.owner@test.com`
- **Password**: `test123`
- **Role**: TRUCK_OWNER
- **Status**: ⚠️ Email Not Verified

- **Email**: `truck.owner2@test.com`
- **Password**: `test123`
- **Role**: TRUCK_OWNER
- **Status**: ⚠️ Email Not Verified

### Drivers
- **Email**: `driver1@test.com`
- **Password**: `test123`
- **Role**: DRIVER
- **Status**: ⚠️ Email Not Verified

- **Email**: `driver2@test.com`
- **Password**: `test123`
- **Role**: DRIVER
- **Status**: ⚠️ Email Not Verified

---

## Available Tenants

### 1. Admin Global
- **Name**: Admin Global
- **Subdomain**: admin
- **Type**: ENTERPRISE
- **Status**: ACTIVE
- **Users**: Super admin and admin cargo owner

### 2. Uruti-X Default
- **Name**: Uruti-X Default
- **Subdomain**: default
- **Type**: ENTERPRISE
- **Status**: ACTIVE
- **Users**: All other test users

---

## Quick Start Testing

### For Admin Testing:
1. Use `admin@urutix.com` / `Admin@123456` for full system admin access
2. Use `urutixv@gmail.com` / `test123` for super admin access
3. Use `tenant.admin@test.com` / `test123` for tenant admin features
4. Use `tenantadmin@demo.com` / `TenantAdmin@123` for Demo Tenant admin

### For Cargo Owner Testing:
1. Use `tenant@gmail.com` / `test123` (verified account)
2. Use `cargownertest@gmail.com` / `test123` (verified account)

### For Truck Owner Testing:
1. Use `truck.owner@test.com` / `test123`
2. Use `truck.owner2@test.com` / `test123`

### For Driver Testing:
1. Use `driver1@test.com` / `test123`
2. Use `driver2@test.com` / `test123`

---

## System Status

✅ **Backend**: Running on port 3005  
✅ **Frontend**: Running on port 5175  
✅ **Database**: Connected and migrated  
✅ **Users**: Seeded with test data  
✅ **System Settings**: Configured  
✅ **Health Monitoring**: Active  

---

## Notes

- All passwords are set to `test123` for development/testing
- Email verification status affects some features
- Use verified accounts for full feature testing
- Admin accounts have access to all tenants
- Regular users are scoped to their specific tenant

---

*Last Updated: March 23, 2026*