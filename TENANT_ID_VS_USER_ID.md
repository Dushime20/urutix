# 🆔 Tenant ID vs User ID

**Date:** February 12, 2026  
**Topic:** Understanding the difference between Tenant ID and User ID

---

## 🎯 Quick Answer

**YES! They are completely different:**

- **Tenant ID** = Company/Organization ID
- **User ID** = Individual person/account ID

---

## 📊 Visual Explanation

```
Tenant (Company)
├── id: "797356c8-dcb6-48ab-9969-e0b373dde1ae"  ← TENANT ID (Company)
├── name: "ABC Logistics"
└── Users (People who work for this company)
    ├── User 1
    │   ├── id: "user-123-abc"  ← USER ID (Person)
    │   ├── tenantId: "797356c8-dcb6-48ab-9969-e0b373dde1ae"  ← Links to company
    │   ├── email: "john@abclogistics.com"
    │   └── role: "TENANT_ADMIN"
    │
    ├── User 2
    │   ├── id: "user-456-def"  ← USER ID (Person)
    │   ├── tenantId: "797356c8-dcb6-48ab-9969-e0b373dde1ae"  ← Links to company
    │   ├── email: "sarah@abclogistics.com"
    │   └── role: "CARGO_OWNER"
    │
    └── User 3
        ├── id: "user-789-ghi"  ← USER ID (Person)
        ├── tenantId: "797356c8-dcb6-48ab-9969-e0b373dde1ae"  ← Links to company
        ├── email: "mike@abclogistics.com"
        └── role: "TRUCK_OWNER"
```

---

## 🏢 Real-World Analogy

Think of it like a company and its employees:

### Company (Tenant)
- **Tenant ID:** Company registration number
- **Example:** "ABC Logistics Inc." has ID `797356c8-dcb6-48ab-9969-e0b373dde1ae`

### Employees (Users)
- **User ID:** Employee ID badge number
- **Examples:**
  - John (Employee #001) has User ID `user-123-abc`
  - Sarah (Employee #002) has User ID `user-456-def`
  - Mike (Employee #003) has User ID `user-789-ghi`

**All employees have the SAME Tenant ID (company) but DIFFERENT User IDs (individuals)**

---

## 📋 Database Structure

### Tenants Table (Companies)
```sql
CREATE TABLE tenants (
  id UUID PRIMARY KEY,              -- TENANT ID (Company)
  name VARCHAR,                     -- Company name
  type VARCHAR,
  status VARCHAR,
  ...
);
```

**Example Data:**
```sql
INSERT INTO tenants VALUES 
  ('797356c8-dcb6-48ab-9969-e0b373dde1ae', 'ABC Logistics', 'ENTERPRISE', 'ACTIVE');
```

### Users Table (People)
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,              -- USER ID (Person)
  tenant_id UUID,                   -- Links to company (TENANT ID)
  email VARCHAR,
  role VARCHAR,
  ...
  FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);
```

**Example Data:**
```sql
INSERT INTO users VALUES 
  ('user-123-abc', '797356c8-dcb6-48ab-9969-e0b373dde1ae', 'john@abc.com', 'TENANT_ADMIN'),
  ('user-456-def', '797356c8-dcb6-48ab-9969-e0b373dde1ae', 'sarah@abc.com', 'CARGO_OWNER'),
  ('user-789-ghi', '797356c8-dcb6-48ab-9969-e0b373dde1ae', 'mike@abc.com', 'TRUCK_OWNER');
```

---

## 🔍 Key Differences

| Aspect | Tenant ID | User ID |
|--------|-----------|---------|
| **Represents** | Company/Organization | Individual person/account |
| **Table** | `tenants` | `users` |
| **Uniqueness** | One per company | One per person |
| **Relationship** | Has many users | Belongs to one tenant |
| **Example** | `797356c8-dcb6-48ab-9969-e0b373dde1ae` | `user-123-abc` |
| **Used For** | Company-wide data | Personal data |
| **Count** | 1 company = 1 tenant ID | 1 company = many user IDs |

---

## 🔗 Relationship

### One-to-Many Relationship
```
1 Tenant (Company) → Many Users (Employees)
```

**Example:**
```
ABC Logistics (Tenant ID: 797356c8...)
├── John (User ID: user-123-abc)
├── Sarah (User ID: user-456-def)
├── Mike (User ID: user-789-ghi)
├── Lisa (User ID: user-101-jkl)
└── Tom (User ID: user-202-mno)
```

**All 5 users have:**
- ✅ SAME `tenantId`: `797356c8-dcb6-48ab-9969-e0b373dde1ae`
- ✅ DIFFERENT `id` (user ID): Each person has unique ID

---

## 💡 Practical Examples

### Example 1: Login
```typescript
// User logs in
const user = {
  id: "user-123-abc",                              // ← USER ID (John)
  tenantId: "797356c8-dcb6-48ab-9969-e0b373dde1ae", // ← TENANT ID (ABC Logistics)
  email: "john@abclogistics.com",
  role: "TENANT_ADMIN"
};
```

### Example 2: Get All Users in a Company
```sql
-- Get all users for ABC Logistics
SELECT * FROM users 
WHERE tenant_id = '797356c8-dcb6-48ab-9969-e0b373dde1ae';

-- Returns:
-- user-123-abc (John)
-- user-456-def (Sarah)
-- user-789-ghi (Mike)
-- user-101-jkl (Lisa)
-- user-202-mno (Tom)
```

### Example 3: Get User's Company
```sql
-- Get John's company
SELECT t.* FROM tenants t
INNER JOIN users u ON t.id = u.tenant_id
WHERE u.id = 'user-123-abc';

-- Returns:
-- ABC Logistics (797356c8-dcb6-48ab-9969-e0b373dde1ae)
```

---

## 🔐 Security Implications

### Tenant Isolation
```typescript
// CORRECT: Filter by tenant ID
const users = await userRepository.find({
  where: { tenantId: req.user.tenantId }  // ← Uses TENANT ID
});

// WRONG: Filter by user ID
const users = await userRepository.find({
  where: { id: req.user.id }  // ← This only returns ONE user!
});
```

### Authorization Check
```typescript
// Check if user belongs to the tenant
if (req.user.tenantId !== requestedTenantId) {
  throw new ForbiddenException('Access denied');
}
```

---

## 📊 Complete Example

### Scenario: Two Companies

```
Company 1: ABC Logistics
├── Tenant ID: "tenant-abc-123"
└── Users:
    ├── John (User ID: "user-001")
    │   └── tenantId: "tenant-abc-123"
    └── Sarah (User ID: "user-002")
        └── tenantId: "tenant-abc-123"

Company 2: XYZ Shipping
├── Tenant ID: "tenant-xyz-456"
└── Users:
    ├── Mike (User ID: "user-003")
    │   └── tenantId: "tenant-xyz-456"
    └── Lisa (User ID: "user-004")
        └── tenantId: "tenant-xyz-456"
```

**Key Points:**
- ✅ Each company has ONE unique Tenant ID
- ✅ Each person has ONE unique User ID
- ✅ Users link to their company via `tenantId`
- ✅ John and Mike have DIFFERENT Tenant IDs (different companies)
- ✅ John and Sarah have SAME Tenant ID (same company)

---

## 🎯 Summary

### Tenant ID (Company)
- 🏢 Represents a company/organization
- 📊 One tenant = many users
- 🔑 Used for company-wide operations
- 📍 Example: `797356c8-dcb6-48ab-9969-e0b373dde1ae`

### User ID (Person)
- 👤 Represents an individual person/account
- 🔗 Belongs to one tenant (company)
- 🔑 Used for personal operations
- 📍 Example: `user-123-abc`

### Relationship
```
Tenant ID (Company) ──┐
                      │ One-to-Many
                      ↓
User ID (Person) ─────┘
```

**Remember:** 
- **Tenant ID** = Which company
- **User ID** = Which person in that company

---

**Document Version:** 1.0  
**Last Updated:** February 12, 2026  
**Status:** Complete ✅
