# 🏢 UrutiX Tenant System & Roles Guide

## Table of Contents
1. [Overview](#overview)
2. [Tenant Architecture](#tenant-architecture)
3. [User Roles Explained](#user-roles-explained)
4. [Role Permissions Matrix](#role-permissions-matrix)
5. [Tenant Types](#tenant-types)
6. [Multi-Tenancy Flow](#multi-tenancy-flow)
7. [Best Practices](#best-practices)

---

## Overview

UrutiX uses a **multi-tenant architecture** where each organization (tenant) has isolated data and users. This ensures data security, privacy, and scalability.

### Key Concepts

- **Tenant**: An organization or company using the platform
- **User**: An individual account within a tenant
- **Role**: Defines what a user can do within the system
- **Isolation**: Each tenant's data is completely separate

---

## Tenant Architecture

### Current Tenants in System

1. **Admin Global** (System Tenant)
   - ID: `933211a2-ace5-4bd0-a8e1-2265a024cf32`
   - Type: ENTERPRISE
   - Purpose: System-wide administration
   - Users: Super Admins only

2. **Uruti-X Default** (Business Tenant)
   - ID: `797356c8-dcb6-48ab-9969-e0b373dde1ae`
   - Type: ENTERPRISE
   - Purpose: Main business operations
   - Users: Tenant Admins, Cargo Owners, Truck Owners, Drivers

### Tenant Hierarchy

```
┌─────────────────────────────────────┐
│      SUPER ADMIN (ADMIN)            │
│   System-wide Access                │
│   Tenant: Admin Global              │
└─────────────────────────────────────┘
              │
              ├─────────────────────────────────┐
              │                                 │
    ┌─────────────────────┐         ┌─────────────────────┐
    │  Tenant 1           │         │  Tenant 2           │
    │  (Uruti-X Default)  │         │  (Other Company)    │
    └─────────────────────┘         └─────────────────────┘
              │                                 │
    ┌─────────────────────┐         ┌─────────────────────┐
    │  TENANT_ADMIN       │         │  TENANT_ADMIN       │
    │  Manages Tenant     │         │  Manages Tenant     │
    └─────────────────────┘         └─────────────────────┘
              │                                 │
    ┌─────────┴─────────┐           ┌─────────┴─────────┐
    │                   │           │                   │
┌───────┐         ┌───────┐     ┌───────┐         ┌───────┐
│ Users │         │ Users │     │ Users │         │ Users │
└───────┘         └───────┘     └───────┘         └───────┘
```

---

## User Roles Explained

### 1. 👑 SUPER_ADMIN (System Administrator)

**Credentials:** `urutixv@gmail.com` / `Admin123@`

**Description:**
- Highest level of access in the system
- Can manage all tenants and users
- System-wide configuration and monitoring
- Not tied to any specific business tenant

**Capabilities:**
- ✅ Create, update, delete tenants
- ✅ Manage all users across all tenants
- ✅ System configuration and settings
- ✅ View all data across tenants
- ✅ Generate system-wide reports
- ✅ Manage platform features and modules
- ✅ Access audit logs and analytics

**Use Cases:**
- Platform maintenance and updates
- Onboarding new companies (tenants)
- Troubleshooting cross-tenant issues
- System monitoring and optimization

---

### 2. 🏢 TENANT_ADMIN (Tenant Administrator)

**Credentials:** `tenant.admin@test.com` / `Admin123@`

**Description:**
- Administrator for a specific tenant/organization
- Manages users and operations within their tenant
- Cannot access other tenants' data
- Business-level administration

**Capabilities:**
- ✅ Manage users within their tenant (CARGO_OWNER and TRUCK_OWNER only)
- ✅ Configure tenant settings
- ✅ View tenant-wide reports and analytics
- ✅ Manage company profile and billing
- ✅ Set up workflows and approvals
- ✅ Manage trucks, drivers, and loads (oversight only)
- ✅ Access all features within tenant scope
- ❌ Cannot access other tenants
- ❌ Cannot modify system settings
- ❌ Cannot create DRIVER users (TRUCK_OWNER creates their own drivers)
- ❌ Cannot create AGENT, LENDER, BROKER users (system-level roles)

**Use Cases:**
- Company operations management
- User onboarding and management
- Business configuration
- Performance monitoring

---

### 3. 📦 CARGO_OWNER (Shipper/Customer)

**Credentials:** 
- `cargo.owner@test.com` / `test123`
- `cargo.owner2@test.com` / `test123`

**Description:**
- Businesses or individuals who need to ship cargo
- Create and manage shipment requests
- Track deliveries and manage payments

**Capabilities:**
- ✅ Create cargo/load requests
- ✅ Publish loads for bidding
- ✅ View and accept bids from truck owners
- ✅ Track shipments in real-time
- ✅ Manage delivery locations
- ✅ Make payments for completed trips
- ✅ Rate and review truck owners/drivers
- ✅ View shipment history and invoices
- ❌ Cannot access truck management
- ❌ Cannot view other cargo owners' data

**Use Cases:**
- Posting shipment requirements
- Selecting transporters
- Tracking cargo delivery
- Managing shipping costs

---

### 4. 🚛 TRUCK_OWNER (Transporter/Carrier)

**Credentials:**
- `truck.owner@test.com` / `test123`
- `truck.owner2@test.com` / `test123`

**Description:**
- Transportation companies or individual truck owners
- Bid on available cargo loads
- Manage fleet and drivers

**Capabilities:**
- ✅ View available cargo loads
- ✅ Place bids on loads
- ✅ Manage truck fleet
- ✅ Assign drivers to trucks
- ✅ Track trips and deliveries
- ✅ Receive payments for completed trips
- ✅ View earnings and financial reports
- ✅ Rate and review cargo owners
- ❌ Cannot create cargo loads
- ❌ Cannot access other truck owners' data

**Use Cases:**
- Finding available loads
- Bidding on transportation jobs
- Fleet management
- Driver assignment
- Revenue tracking

---

### 5. 👨‍✈️ DRIVER

**Credentials:**
- `driver1@test.com` / `test123`
- `driver2@test.com` / `test123`

**Description:**
- Individual drivers employed by truck owners
- Execute trips and deliveries
- Mobile-focused role

**Capabilities:**
- ✅ View assigned trips
- ✅ Update trip status (started, in-transit, delivered)
- ✅ Update real-time location
- ✅ Upload delivery proof (photos, signatures)
- ✅ Report incidents or delays
- ✅ View trip history and earnings
- ✅ Communicate with cargo owners
- ❌ Cannot manage trucks
- ❌ Cannot bid on loads
- ❌ Cannot access financial data

**Use Cases:**
- Receiving trip assignments
- Updating delivery status
- Navigation and route tracking
- Proof of delivery

---

### 6. 🤝 AGENT (Optional Role)

**Description:**
- Third-party agents or brokers
- Facilitate connections between cargo owners and truck owners
- Earn commissions on successful matches

**Capabilities:**
- ✅ View available loads
- ✅ Recommend matches
- ✅ Facilitate negotiations
- ✅ Track commission earnings
- ❌ Limited access to sensitive data

---

### 7. 💰 LENDER (Financial Partner)

**Description:**
- Financial institutions providing loans
- Assess creditworthiness of users
- Manage loan applications and disbursements

**Capabilities:**
- ✅ View loan applications
- ✅ Assess user credit scores
- ✅ Approve/reject loan requests
- ✅ Track loan repayments
- ✅ Generate financial reports
- ❌ Cannot access operational data

---

## Role Permissions Matrix

| Feature | SUPER_ADMIN | TENANT_ADMIN | CARGO_OWNER | TRUCK_OWNER | DRIVER | AGENT | LENDER |
|---------|-------------|--------------|-------------|-------------|--------|-------|--------|
| **Tenant Management** |
| Create Tenants | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Manage Tenant Settings | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| View All Tenants | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **User Management** |
| Create Users (Any Tenant) | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Create Users (Own Tenant) | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Manage Own Profile | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Cargo/Load Management** |
| Create Loads | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ |
| View All Loads | ✅ | ✅ | Own | Public | Assigned | Public | ❌ |
| Publish Loads | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ |
| **Bidding** |
| Place Bids | ❌ | ❌ | ❌ | ✅ | ❌ | ✅ | ❌ |
| Accept Bids | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| View Bids | ✅ | ✅ | Own Loads | Own Bids | ❌ | Related | ❌ |
| **Fleet Management** |
| Manage Trucks | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ |
| Assign Drivers | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ |
| View Fleet | ✅ | ✅ | ❌ | Own | Assigned | ❌ | ❌ |
| **Trip Management** |
| Create Trips | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ |
| Update Trip Status | ✅ | ✅ | ❌ | ✅ | ✅ | ❌ | ❌ |
| Track Trips | ✅ | ✅ | Own | Own | Assigned | Related | ❌ |
| **Financial** |
| Make Payments | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Receive Payments | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ | ❌ |
| View Financial Reports | ✅ | ✅ | Own | Own | Own | Own | ✅ |
| Manage Loans | ❌ | ❌ | Apply | Apply | ❌ | ❌ | ✅ |
| **Analytics** |
| System Analytics | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Tenant Analytics | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Personal Analytics | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

---

## Tenant Types

### 1. ENTERPRISE
- Large organizations
- Multiple users and roles
- Advanced features enabled
- Custom configurations

### 2. SMALL_BUSINESS
- Small to medium companies
- Limited users
- Standard features
- Cost-effective plans

### 3. INDIVIDUAL
- Single user or freelancer
- Basic features
- Pay-as-you-go model

### 4. PARTNER
- Strategic partners
- Special access and features
- Integration capabilities

---

## Multi-Tenancy Flow

### User Login Flow

```
1. User enters email/password
   ↓
2. System identifies user's tenant
   ↓
3. Authenticate credentials
   ↓
4. Load tenant-specific data
   ↓
5. Apply role-based permissions
   ↓
6. User accesses their dashboard
```

### Data Isolation

```
┌─────────────────────────────────────┐
│         Database Layer              │
├─────────────────────────────────────┤
│  All queries include tenantId       │
│  WHERE tenantId = 'xxx'             │
├─────────────────────────────────────┤
│  Row-Level Security (RLS)           │
│  Automatic filtering by tenant      │
└─────────────────────────────────────┘
```

### Cross-Tenant Access

- **SUPER_ADMIN**: Can switch between tenants
- **Other Roles**: Strictly isolated to their tenant
- **API Requests**: Include tenant context in headers
- **Database Queries**: Automatically filtered by tenantId

---

## Best Practices

### For Super Admins

1. ✅ Use SUPER_ADMIN only for system tasks
2. ✅ Create separate accounts for business operations
3. ✅ Regularly audit tenant activities
4. ✅ Monitor system performance
5. ❌ Don't use SUPER_ADMIN for daily operations

### For Tenant Admins

1. ✅ Assign appropriate roles to users
2. ✅ Regularly review user permissions
3. ✅ Keep tenant settings updated
4. ✅ Monitor tenant usage and costs
5. ❌ Don't share admin credentials

### For All Users

1. ✅ Use strong passwords
2. ✅ Enable two-factor authentication
3. ✅ Keep profile information updated
4. ✅ Report suspicious activities
5. ❌ Don't share login credentials

---

## Security Features

### Authentication
- Bcrypt password hashing
- JWT token-based sessions
- Email verification required
- Account lockout after failed attempts

### Authorization
- Role-based access control (RBAC)
- Tenant-level data isolation
- API endpoint protection
- Resource-level permissions

### Data Protection
- Encrypted sensitive data
- Audit logs for all actions
- Soft deletes (data retention)
- Regular backups

---

## Common Scenarios

### Scenario 1: New Company Onboarding

1. **SUPER_ADMIN** creates new tenant
2. **SUPER_ADMIN** creates TENANT_ADMIN user
3. **TENANT_ADMIN** logs in and configures company
4. **TENANT_ADMIN** creates users (cargo owners, truck owners)
5. Users start operations

### Scenario 2: Cargo Shipment

1. **CARGO_OWNER** creates load request
2. **CARGO_OWNER** publishes load
3. **TRUCK_OWNER** views available loads
4. **TRUCK_OWNER** places bid
5. **CARGO_OWNER** accepts bid
6. **TRUCK_OWNER** assigns driver
7. **DRIVER** executes trip
8. **CARGO_OWNER** makes payment

### Scenario 3: Fleet Management

1. **TRUCK_OWNER** adds trucks to fleet
2. **TRUCK_OWNER** creates driver accounts
3. **TRUCK_OWNER** assigns drivers to trucks
4. **DRIVER** receives assignments
5. **TRUCK_OWNER** monitors fleet performance

---

## API Authentication

### Headers Required

```javascript
{
  "Authorization": "Bearer <jwt_token>",
  "X-Tenant-ID": "<tenant_id>",
  "Content-Type": "application/json"
}
```

### Token Payload

```json
{
  "userId": "uuid",
  "email": "user@example.com",
  "role": "CARGO_OWNER",
  "tenantId": "uuid",
  "iat": 1234567890,
  "exp": 1234567890
}
```

---

## Troubleshooting

### Issue: User can't access data

**Check:**
1. User's tenantId matches data tenantId
2. User has correct role permissions
3. Data is not soft-deleted
4. User account is active

### Issue: Cross-tenant data leak

**Prevention:**
1. Always include tenantId in queries
2. Use middleware for tenant validation
3. Implement row-level security
4. Regular security audits

---

## Future Enhancements

- [ ] Multi-tenant SSO integration
- [ ] Custom role creation
- [ ] Tenant-specific branding
- [ ] Advanced analytics per tenant
- [ ] Tenant data export/import
- [ ] Tenant cloning for testing

---

**Last Updated:** February 12, 2026  
**Version:** 1.0  
**Maintained By:** UrutiX Development Team
