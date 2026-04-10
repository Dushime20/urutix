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

---

## Demo Tenant Truck Owners (Under tenantadmin@demo.com)

### Truck Owner 1 - John Logistics Ltd
- **Email**: `truckowner1@demo.com`
- **Password**: `TruckOwner@123`
- **Role**: TRUCK_OWNER
- **Company**: John Logistics Ltd
- **Name**: John Logistics
- **Tenant**: Demo Tenant
- **Status**: ✅ Email Verified (ACTIVE)

### Truck Owner 2 - East African Movers
- **Email**: `truckowner2@demo.com`
- **Password**: `TruckOwner@123`
- **Role**: TRUCK_OWNER
- **Company**: East African Movers
- **Name**: Sarah Transport
- **Tenant**: Demo Tenant
- **Status**: ✅ Email Verified (ACTIVE)

### Truck Owner 3 - Mombasa Road Transporters
- **Email**: `truckowner3@demo.com`
- **Password**: `TruckOwner@123`
- **Role**: TRUCK_OWNER
- **Company**: Mombasa Road Transporters
- **Name**: Michael Freight
- **Tenant**: Demo Tenant
- **Status**: ✅ Email Verified (ACTIVE)

### Truck Owner 4 - Swift Cargo Services
- **Email**: `truckowner4@demo.com`
- **Password**: `TruckOwner@123`
- **Role**: TRUCK_OWNER
- **Company**: Swift Cargo Services
- **Name**: David Cargo
- **Tenant**: Demo Tenant
- **Status**: ✅ Email Verified (ACTIVE)

### Truck Owner 5 - Grace Haulage Co
- **Email**: `truckowner5@demo.com`
- **Password**: `TruckOwner@123`
- **Role**: TRUCK_OWNER
- **Company**: Grace Haulage Co
- **Name**: Grace Haulage
- **Tenant**: Demo Tenant
- **Status**: ✅ Email Verified (ACTIVE)

---

## Demo Tenant Cargo Owners (Under tenantadmin@demo.com)

### Cargo Owner 1 - Kigali Exports Ltd
- **Email**: `cargoowner1@demo.com`
- **Password**: `CargoOwner123!`
- **Role**: CARGO_OWNER
- **Company**: Kigali Exports Ltd
- **Tenant**: Demo Tenant
- **Status**: ✅ Email Verified (ACTIVE)

### Cargo Owner 2 - East Africa Trade Co
- **Email**: `cargoowner2@demo.com`
- **Password**: `CargoOwner123!`
- **Role**: CARGO_OWNER
- **Company**: East Africa Trade Co
- **Tenant**: Demo Tenant
- **Status**: ✅ Email Verified (ACTIVE)

---

## Default Tenant Drivers

email:dushimecoder@gmail.com
password:Driver123@

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

### For Demo Tenant Truck Owners:
1. Use `truckowner1@demo.com` / `TruckOwner@123` (John Logistics Ltd)
2. Use `truckowner2@demo.com` / `TruckOwner@123` (East African Movers)
3. Use `truckowner3@demo.com` / `TruckOwner@123` (Mombasa Road Transporters)
4. Use `truckowner4@demo.com` / `TruckOwner@123` (Swift Cargo Services)
5. Use `truckowner5@demo.com` / `TruckOwner@123` (Grace Haulage Co)

### For Demo Tenant Cargo Owners:
1. Use `cargoowner1@demo.com` / `CargoOwner123!` (Kigali Exports Ltd)
2. Use `cargoowner2@demo.com` / `CargoOwner123!` (East Africa Trade Co)

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

*Last Updated: April 10, 2026*