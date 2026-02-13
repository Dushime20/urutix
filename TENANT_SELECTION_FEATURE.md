# Tenant Selection Feature for User Registration

## Overview
Enhanced the Tenant Admin Dashboard user registration to allow tenant admins to assign cargo owners and truck owners to the correct tenant/company by selecting from a dropdown of available tenants instead of manually typing a company name.

## Backend Changes

### 1. Tenant Dashboard Service (`backend/src/modules/tenant-dashboard/tenant-dashboard.service.ts`)
- Added `getAllTenants()` method to fetch all active tenants
- Returns tenant ID, name, type, and location
- Filters only active tenants with `ACTIVE` status
- Orders results alphabetically by name

### 2. Tenant Dashboard Controller (`backend/src/modules/tenant-dashboard/tenant-dashboard.controller.ts`)
- Added `GET /tenant-dashboard/tenants/list` endpoint
- Returns list of all active tenants for selection
- Protected by JWT and Tenant guards

### 3. Tenant Dashboard Module (`backend/src/modules/tenant-dashboard/tenant-dashboard.module.ts`)
- Added `Tenant` entity to TypeORM imports
- Enables tenant repository injection in service

### 4. Users Controller (`backend/src/modules/users/users.controller.ts`)
- Updated `createTenantUser` endpoint to accept `tenantId` in request body
- Uses body tenantId if provided, otherwise falls back to URL parameter
- Allows admin to specify which tenant to create the user in
- Added null checks for `req.user` to prevent 500 errors

## Frontend Changes

### 1. User API Service (`frontend/src/services/userApi.ts`)
- Added `getAllTenants()` method
- Fetches tenant list from `/tenant-dashboard/tenants/list` endpoint
- Returns tenant data with ID, name, type, and location

### 2. Create User Modal (`frontend/src/components/TenantDashboard/UserManagement/CreateUserModal.tsx`)
- Replaced text input with dropdown select for Company Name field
- Fetches available tenants using React Query
- Shows tenant name with location in dropdown options
- Only displays for CARGO_OWNER and TRUCK_OWNER roles
- Added validation to ensure tenant is selected
- Defaults to current tenant ID
- Sends selected tenant ID in request body

### 3. User Types (`frontend/src/types/user.types.ts`)
- Added optional `tenantId` field to `CreateUserDto`
- Allows specifying target tenant when creating users

## Features

### Tenant Dropdown
- Shows all active tenants in the system
- Displays tenant name and location (city, state, country)
- Loading state while fetching tenants
- Required field for cargo and truck owners
- Defaults to the current tenant

### User Assignment
- Tenant admins can now assign users to any active tenant
- Users are created under the selected tenant ID
- Ensures proper tenant isolation and organization
- Prevents manual entry errors

## API Endpoints

### Get All Tenants
```
GET /api/tenant-dashboard/tenants/list
```

**Response:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Tenants list retrieved successfully",
  "data": [
    {
      "id": "uuid",
      "name": "Company Name",
      "type": "ENTERPRISE",
      "location": "New York, NY, USA"
    }
  ],
  "timestamp": "2026-02-12T..."
}
```

### Create Tenant User
```
POST /api/users/tenant/:tenantId/user
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "firstName": "John",
  "lastName": "Doe",
  "role": "CARGO_OWNER",
  "phoneNumber": "+1234567890",
  "companyName": "Optional Company Name",
  "tenantId": "target-tenant-uuid"  // Optional: overrides URL parameter
}
```

**Response:**
```json
{
  "success": true,
  "message": "Tenant user created successfully",
  "data": {
    "id": "user-uuid",
    "email": "user@example.com",
    "role": "CARGO_OWNER",
    "tenantId": "target-tenant-uuid",
    "status": "ACTIVE"
  }
}
```

## Benefits

1. **Accuracy**: Eliminates typos and inconsistencies in company names
2. **Organization**: Proper tenant assignment from the start
3. **User Experience**: Easy selection from existing tenants
4. **Data Integrity**: Ensures users are linked to valid, active tenants
5. **Flexibility**: Tenant admins can assign users across tenants if needed
6. **Error Prevention**: Null checks prevent 500 errors when user is not authenticated

## Usage

When creating a new Cargo Owner or Truck Owner:
1. Select the user role
2. Fill in user details (name, email, etc.)
3. Select the company/tenant from the dropdown
4. Complete the form and submit

The user will be created under the selected tenant with proper associations.

## Security

- Security checks verify requesting user belongs to target tenant (unless SUPER_ADMIN)
- Null-safe checks prevent errors when `req.user` is undefined
- Tenant isolation maintained through proper authorization checks

