# 🤝 Broker TenantId Explanation

**Date:** February 12, 2026  
**Topic:** Understanding `tenantId` vs `brokerTenantId` for BROKER users

---

## 🎯 The Two TenantId Fields for Brokers

### For BROKER users, there are TWO tenant fields:

1. **`tenantId`** - The broker's OWN company/organization
2. **`brokerTenantId`** - The client company the broker works FOR

---

## 📊 Example Scenario

### Scenario: ABC Brokerage Company

```
ABC Brokerage (Tenant A)
├── tenantId: "tenant-abc-brokerage"
├── name: "ABC Brokerage Services"
└── Users:
    ├── Broker 1 (John)
    │   ├── tenantId: "tenant-abc-brokerage"        ← His own company
    │   └── brokerTenantId: "tenant-xyz-logistics"  ← Client he works for
    │
    └── Broker 2 (Sarah)
        ├── tenantId: "tenant-abc-brokerage"        ← Her own company
        └── brokerTenantId: "tenant-def-shipping"   ← Client she works for
```

---

## 🔍 Detailed Explanation

### 1. `tenantId` (Broker's Own Company)
- **What it is:** The broker's own brokerage company
- **Purpose:** Identifies which brokerage firm the broker belongs to
- **Used for:** 
  - Broker's own company management
  - Broker's internal operations
  - Commission tracking within the brokerage
  - Brokerage company reports

**Example:**
```json
{
  "id": "broker-john-123",
  "email": "john@abcbrokerage.com",
  "role": "BROKER",
  "tenantId": "tenant-abc-brokerage",  // ← ABC Brokerage Company
  "brokerTenantId": "tenant-xyz-logistics"  // ← Client company
}
```

---

### 2. `brokerTenantId` (Client Company)
- **What it is:** The client company the broker is assigned to work for
- **Purpose:** Links the broker to the client they're servicing
- **Used for:**
  - Accessing client's loads
  - Managing client's shipments
  - Earning commissions from client's business
  - Client-specific operations

**Example:**
```json
{
  "id": "broker-john-123",
  "email": "john@abcbrokerage.com",
  "role": "BROKER",
  "tenantId": "tenant-abc-brokerage",      // ← His brokerage company
  "brokerTenantId": "tenant-xyz-logistics" // ← XYZ Logistics (client)
}
```

---

## 🏢 Real-World Example

### ABC Brokerage serves multiple clients:

```
ABC Brokerage Company (tenant-abc-brokerage)
│
├── Broker: John Smith
│   ├── tenantId: tenant-abc-brokerage
│   ├── brokerTenantId: tenant-xyz-logistics
│   └── Works for: XYZ Logistics
│
├── Broker: Sarah Johnson
│   ├── tenantId: tenant-abc-brokerage
│   ├── brokerTenantId: tenant-def-shipping
│   └── Works for: DEF Shipping Co.
│
└── Broker: Mike Davis
    ├── tenantId: tenant-abc-brokerage
    ├── brokerTenantId: tenant-ghi-transport
    └── Works for: GHI Transport Inc.
```

---

## 🔐 Access Control

### What can a BROKER access?

#### With `tenantId` (Own Company):
- ✅ View other brokers in the same brokerage
- ✅ View brokerage company reports
- ✅ Manage own profile and settings
- ✅ View brokerage commission summaries

#### With `brokerTenantId` (Client Company):
- ✅ View client's loads
- ✅ Manage client's shipments
- ✅ Create bids on behalf of client
- ✅ Track client's trucks and drivers
- ✅ Earn commissions from client's business
- ❌ Cannot access other clients' data

---

## 📝 Database Queries

### Get all brokers from a brokerage company:
```sql
SELECT * FROM users 
WHERE tenant_id = 'tenant-abc-brokerage' 
  AND role = 'BROKER';
```

### Get all brokers working for a specific client:
```sql
SELECT * FROM users 
WHERE broker_tenant_id = 'tenant-xyz-logistics' 
  AND role = 'BROKER';
```

### Get a broker's client company:
```sql
SELECT 
  u.id as broker_id,
  u.email as broker_email,
  t.id as client_tenant_id,
  t.name as client_company_name
FROM users u
INNER JOIN tenants t ON u.broker_tenant_id = t.id
WHERE u.id = 'broker-john-123';
```

---

## 🎯 Use Cases

### Use Case 1: Broker Dashboard
When John (broker) logs in:
- Shows loads from **XYZ Logistics** (his `brokerTenantId`)
- Shows his commission from **XYZ Logistics**
- Shows his profile from **ABC Brokerage** (his `tenantId`)

### Use Case 2: Brokerage Manager Dashboard
ABC Brokerage manager views:
- All brokers where `tenantId = 'tenant-abc-brokerage'`
- Total commissions earned by all brokers
- Performance metrics for the brokerage

### Use Case 3: Client Company Dashboard
XYZ Logistics (client) views:
- All brokers where `brokerTenantId = 'tenant-xyz-logistics'`
- Loads managed by their assigned brokers
- Commissions paid to brokers

---

## 🔄 Workflow Example

### Scenario: Broker John helps XYZ Logistics

1. **John's Company:** ABC Brokerage (`tenantId`)
2. **John's Client:** XYZ Logistics (`brokerTenantId`)

**Steps:**
1. XYZ Logistics creates a load
2. John (broker) sees the load because his `brokerTenantId = 'tenant-xyz-logistics'`
3. John finds a truck owner and creates a bid
4. Bid is accepted, trip is created
5. John earns commission (tracked in `broker_commissions` table)
6. Commission is linked to:
   - John's user account
   - XYZ Logistics (client)
   - ABC Brokerage (John's company)

---

## 📊 Commission Tracking

```sql
-- Get broker's total commission from a specific client
SELECT 
  u.email as broker_email,
  t.name as client_name,
  SUM(bc.commission_amount) as total_commission
FROM users u
INNER JOIN broker_commissions bc ON u.id = bc.broker_id
INNER JOIN tenants t ON u.broker_tenant_id = t.id
WHERE u.id = 'broker-john-123'
  AND u.broker_tenant_id = 'tenant-xyz-logistics'
GROUP BY u.email, t.name;
```

---

## ✅ Summary

| Field | Purpose | Example Value | Used For |
|-------|---------|---------------|----------|
| **tenantId** | Broker's own company | `tenant-abc-brokerage` | Brokerage management, internal operations |
| **brokerTenantId** | Client company | `tenant-xyz-logistics` | Client's loads, commissions, client operations |

**Key Point:** 
- A broker BELONGS to their brokerage company (`tenantId`)
- A broker WORKS FOR a client company (`brokerTenantId`)

---

## 🚀 Why This Design?

### Benefits:
1. ✅ **Multi-Client Support:** One broker can work for multiple clients (by changing `brokerTenantId`)
2. ✅ **Clear Separation:** Broker's company vs client company
3. ✅ **Commission Tracking:** Easy to track which client generated which commission
4. ✅ **Access Control:** Broker can only access their assigned client's data
5. ✅ **Scalability:** Brokerage companies can manage multiple brokers and clients

---

**Document Version:** 1.0  
**Last Updated:** February 12, 2026  
**Status:** Complete ✅
