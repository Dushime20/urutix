# 🏢 Tenant vs Company Clarification

**Date:** February 12, 2026  
**Status:** ✅ Clarified

---

## 🎯 Understanding the System

### What is a Tenant?
In this system, **Tenant = Company/Organization**

```
Tenant
├── id: "797356c8-dcb6-48ab-9969-e0b373dde1ae"  ← This IS the Company ID
├── name: "ABC Logistics"
├── type: "ENTERPRISE"
└── Users
    ├── User 1 (TENANT_ADMIN)
    ├── User 2 (CARGO_OWNER)
    ├── User 3 (TRUCK_OWNER)
    └── User 4 (DRIVER)
```

---

## 📊 Database Structure

### Tenant Table (Companies/Organizations)
```sql
CREATE TABLE tenants (
  id UUID PRIMARY KEY,              -- This is the "Company ID"
  name VARCHAR,                     -- Company name
  type ENUM,                        -- ENTERPRISE, SMALL_BUSINESS, etc.
  status ENUM,                      -- ACTIVE, SUSPENDED, etc.
  ...
);
```

### Users Table
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,
  tenant_id UUID,                   -- Foreign key to tenants (Company ID)
  email VARCHAR,
  role ENUM,
  ...
);
```

### User Profiles Table
```sql
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY,
  user_id UUID,
  tenant_id UUID,                   -- Same as user's tenant_id
  first_name VARCHAR,
  last_name VARCHAR,
  company_name VARCHAR,             -- ⚠️ This is just a TEXT field, NOT a foreign key!
  ...
);
```

---

## 🔍 What is `companyName` in UserProfile?

The `companyName` field in `user_profiles` is:
- ✅ An optional text field
- ✅ Used for display purposes only
- ✅ Can be different from the tenant name
- ❌ NOT a foreign key to a Company table
- ❌ NOT used for filtering or relationships

**Example:**
```json
{
  "user": {
    "id": "user-123",
    "tenantId": "tenant-abc",  // ← This links to the company
    "email": "john@example.com",
    "role": "CARGO_OWNER"
  },
  "profile": {
    "firstName": "John",
    "lastName": "Doe",
    "companyName": "John's Shipping LLC"  // ← Just a display name
  }
}
```

---

## ✅ Current Endpoint is Correct!

### Endpoint: `GET /users/tenant/:tenantId`

**What it does:**
- Returns all users where `user.tenantId = :tenantId`
- This IS filtering by "Company ID" because `tenantId` = Company ID

**Example:**
```bash
GET /users/tenant/797356c8-dcb6-48ab-9969-e0b373dde1ae

# Returns all users belonging to tenant (company) 797356c8-dcb6-48ab-9969-e0b373dde1ae
```

---

## 🔒 Security Implementation

The endpoint now has proper security:

```typescript
@Get('tenant/:tenantId')
async getTenantUsers(@Param('tenantId') tenantId: string, @Request() req) {
  // Security check: User can only view their own tenant (company)
  if (req.user.role !== 'SUPER_ADMIN' && req.user.tenantId !== tenantId) {
    return {
      success: false,
      message: 'Access denied - you can only view users from your own tenant',
      data: [],
    };
  }

  // Get users for this tenant (company)
  const users = await this.usersService.findUsersByTenant(tenantId);
  
  return {
    success: true,
    data: users,
    total: users.length
  };
}
```

**What this means:**
- ✅ TENANT_ADMIN can only view users from THEIR OWN company (tenantId)
- ✅ SUPER_ADMIN can view users from ANY company
- ✅ The endpoint filters by `tenantId` which IS the Company ID

---

## 📝 Summary

| Term | What it means | Database Field |
|------|---------------|----------------|
| **Tenant** | Company/Organization | `tenants.id` |
| **Tenant ID** | Company ID | `users.tenant_id` |
| **Company Name (in profile)** | Display name only | `user_profiles.company_name` |

**The endpoint `GET /users/tenant/:tenantId` correctly returns users under that company (tenant)!** ✅

---

## 🎯 Conclusion

**Your understanding is correct!**

The endpoint MUST return users under the company ID, and it DOES:
- ✅ `tenantId` parameter = Company ID
- ✅ Filters users by `user.tenantId`
- ✅ Returns only users belonging to that company
- ✅ Security checks prevent cross-company access

**The implementation is correct and secure!** 🎉

---

**Document Version:** 1.0  
**Last Updated:** February 12, 2026  
**Status:** Clarified ✅
