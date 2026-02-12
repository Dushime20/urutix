# 🏢 UrutiX Tenant System & Roles Explained

## 📋 Table of Contents
1. [What is a Tenant?](#what-is-a-tenant)
2. [Tenant Types](#tenant-types)
3. [User Roles Hierarchy](#user-roles-hierarchy)
4. [Role Permissions & Actions](#role-permissions--actions)
5. [Tenant vs Global Roles](#tenant-vs-global-roles)
6. [Real-World Examples](#real-world-examples)

---

## 🏢 What is a Tenant?

A **Tenant** is an isolated organization/company within the UrutiX platform. Think of it as a separate workspace where:

- Each tenant has its own users, trucks, loads, and data
- Data is completely isolated between tenants
- Each tenant can have its own branding, settings, and subscription plan
- Multi-tenancy allows one platform to serve multiple companies

### Tenant Properties:
```typescript
{
  id: "uuid",
  name: "Company Name",
  subdomain: "company",           // company.urutix.com
  type: "ENTERPRISE",              // or SMALL_BUSINESS, INDIVIDUAL, PARTNER
  status: "ACTIVE",                // or SUSPENDED, PENDING_ACTIVATION, DEACTIVATED
  isActive: true,
  
  // Limits
  maxUsers: 100,
  maxTrucks: 50,
  maxDrivers: 75,
  maxLoadsPerMonth: 500,
  
  // Subscription
  subscriptionPlan: "premium",
  subscriptionExpiresAt: "2025-12-31",
  
  // Contact
  contactEmail: "admin@company.com",
  contactPhone: "+254-XXX-XXX-XXX"
}
```

---

## 🏷️ Tenant Types

### 1. **ENTERPRISE** 🏭
- Large companies with multiple departments
- High volume of shipments
- Multiple admins and managers
- Custom features and integrations
- **Example:** Large logistics companies, manufacturing firms

### 2. **SMALL_BUSINESS** 🏪
- Small to medium companies
- Moderate shipment volume
- Limited admin users
- Standard features
- **Example:** Local transport companies, small warehouses

### 3. **INDIVIDUAL** 👤
- Single owner-operators
- Personal use
- Basic features
- **Example:** Independent truck owners, freelance drivers

### 4. **PARTNER** 🤝
- Partner organizations
- Shared resources
- Special pricing
- **Example:** Affiliated transport companies, broker networks

---

## 👥 User Roles Hierarchy

```
┌─────────────────────────────────────────────────────────────┐
│                    SUPER_ADMIN (Global)                      │
│  • Full system access across ALL tenants                     │
│  • Platform configuration                                    │
│  • Create/manage tenants                                     │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│        