# BROKER and AGENT Role Permissions

## Overview
BROKER and AGENT are intermediary roles that facilitate transactions between cargo owners and truck owners.

---

## AGENT Role

### Current Permissions (Basic)
The AGENT role currently has limited view-only permissions:

```sql
-- AGENT role permissions
'cargo:view_all'      -- View all cargo/loads
'truck:view_all'      -- View all trucks
'trip:view_all'       -- View all trips
'analytics:view_tenant' -- View tenant analytics
'user:view_own'       -- View own user profile
```

### Recommended Additional Permissions
Agents should be able to facilitate deals but with limited control:

```
'cargo:create'        -- Create cargo on behalf of clients
'cargo:update_own'    -- Update cargos they created
'bid:view_all'        -- View all bids
'bid:facilitate'      -- Help facilitate bidding
'payment:view_all'    -- View payment status
'commission:view_own' -- View their commissions
'report:generate'     -- Generate reports
'notification:send'   -- Send notifications to clients
```

---

## BROKER Role

### Current Permissions (Comprehensive)
The BROKER role has extensive permissions for deal facilitation:

#### Load/Cargo Management
```
'cargo:view_all'      -- View all loads
'cargo:create'        -- Create loads for clients
'cargo:update'        -- Update load details
'cargo:assign'        -- Assign loads to transporters
'cargo:track'         -- Track shipments
```

#### Bidding & Matching
```
'bid:view_all'        -- View all bids
'bid:create'          -- Create bids on behalf of clients
'bid:accept'          -- Accept bids
'bid:reject'          -- Reject bids
'match:ai_powered'    -- Use AI matching
'match:recommend'     -- Recommend matches
```

#### Financial Operations
```
'commission:view_own' -- View own commissions
'commission:calculate' -- Calculate commissions
'commission:request_payout' -- Request commission payouts
'payment:view_all'    -- View payment status
'escrow:create'       -- Create escrow accounts
'escrow:manage'       -- Manage escrow funds
'escrow:release'      -- Release escrow funds
```

#### Contract Management
```
'contract:create'     -- Create contracts
'contract:view'       -- View contracts
'contract:sign'       -- Sign contracts
'contract:manage'     -- Manage contract lifecycle
```

#### Insurance & Compliance
```
'insurance:verify'    -- Verify insurance
'insurance:check_compliance' -- Check compliance
'insurance:view'      -- View insurance details
```

#### Dispute Resolution
```
'dispute:create'      -- Create disputes
'dispute:view'        -- View disputes
'dispute:mediate'     -- Mediate disputes
'dispute:resolve'     -- Resolve disputes
```

#### Document Management
```
'document:upload'     -- Upload documents
'document:view'       -- View documents
'document:verify'     -- Verify documents
'document:manage'     -- Manage documents
```

#### Market Intelligence
```
'market:view_rates'   -- View market rates
'market:view_trends'  -- View market trends
'market:analyze'      -- Analyze market data
'intelligence:access' -- Access market intelligence
```

#### Credit Management
```
'credit:view'         -- View credit information
'credit:assess'       -- Assess creditworthiness
'credit:manage'       -- Manage credit limits
```

#### Multi-Stop Loads
```
'multistop:create'    -- Create multi-stop loads
'multistop:manage'    -- Manage multi-stop routes
'multistop:optimize'  -- Optimize routes
```

#### Performance Tracking
```
'performance:view_own' -- View own performance
'performance:track'   -- Track performance metrics
'analytics:view_broker' -- View broker analytics
'report:generate'     -- Generate reports
```

#### Communication
```
'notification:send'   -- Send notifications
'notification:view'   -- View notifications
'message:send'        -- Send messages
'message:view'        -- View messages
```

---

## Key Differences

### AGENT vs BROKER

| Feature | AGENT | BROKER |
|---------|-------|--------|
| **View Loads** | ✅ Yes | ✅ Yes |
| **Create Loads** | ❌ No (Recommended: Yes) | ✅ Yes |
| **Manage Bids** | ❌ No | ✅ Yes |
| **Earn Commissions** | ✅ Yes (View only) | ✅ Yes (Full management) |
| **Escrow Management** | ❌ No | ✅ Yes |
| **Contract Creation** | ❌ No | ✅ Yes |
| **Dispute Resolution** | ❌ No | ✅ Yes |
| **Insurance Verification** | ❌ No | ✅ Yes |
| **Market Intelligence** | ❌ No | ✅ Yes |
| **Credit Management** | ❌ No | ✅ Yes |
| **Multi-Stop Loads** | ❌ No | ✅ Yes |

---

## Business Logic

### AGENT Role
- **Purpose**: Junior intermediary, sales representative
- **Scope**: Limited to viewing and basic facilitation
- **Commission**: Lower percentage (e.g., 1-2%)
- **Autonomy**: Requires approval for major actions
- **Use Case**: Entry-level freight agents, sales reps

### BROKER Role
- **Purpose**: Full-service freight broker
- **Scope**: Complete deal lifecycle management
- **Commission**: Higher percentage (e.g., 5-15%)
- **Autonomy**: Full authority to execute deals
- **Use Case**: Licensed freight brokers, logistics companies

---

## Commission Structure

### AGENT
```typescript
{
  baseRate: 1-2%,
  calculationMethod: 'PERCENTAGE_OF_LOAD_VALUE',
  paymentTiming: 'AFTER_DELIVERY',
  minimumCommission: $10,
  maximumCommission: $100
}
```

### BROKER
```typescript
{
  baseRate: 5-15%,
  calculationMethod: 'PERCENTAGE_OF_LOAD_VALUE',
  paymentTiming: 'AFTER_DELIVERY',
  minimumCommission: $50,
  maximumCommission: $5000,
  bonuses: {
    volumeBonus: true,
    performanceBonus: true,
    quickMatchBonus: true
  }
}
```

---

## API Endpoints

### AGENT Endpoints
```
GET  /api/loads                    -- View all loads
GET  /api/trucks                   -- View all trucks
GET  /api/trips                    -- View all trips
GET  /api/analytics/tenant         -- View tenant analytics
GET  /api/users/me                 -- View own profile
GET  /api/commissions/me           -- View own commissions
```

### BROKER Endpoints
```
# All AGENT endpoints plus:

# Load Management
POST   /api/broker/loads           -- Create load
PUT    /api/broker/loads/:id       -- Update load
POST   /api/broker/loads/:id/assign -- Assign load

# Bidding
POST   /api/broker/bids            -- Create bid
PUT    /api/broker/bids/:id/accept -- Accept bid
PUT    /api/broker/bids/:id/reject -- Reject bid

# Commissions
GET    /api/broker/commissions     -- View commissions
POST   /api/broker/commissions/:id/payout -- Request payout

# Contracts
POST   /api/broker/contracts       -- Create contract
GET    /api/broker/contracts       -- View contracts
PUT    /api/broker/contracts/:id/sign -- Sign contract

# Escrow
POST   /api/broker/escrow          -- Create escrow
PUT    /api/broker/escrow/:id/fund -- Fund escrow
PUT    /api/broker/escrow/:id/release -- Release funds

# Disputes
POST   /api/broker/disputes        -- Create dispute
PUT    /api/broker/disputes/:id/mediate -- Mediate
PUT    /api/broker/disputes/:id/resolve -- Resolve

# Insurance
POST   /api/broker/insurance/verify -- Verify insurance
GET    /api/broker/insurance/compliance -- Check compliance

# Market Intelligence
GET    /api/broker/market/rates    -- View market rates
GET    /api/broker/market/trends   -- View trends
GET    /api/broker/intelligence    -- Access intelligence

# Credit Management
GET    /api/broker/credit/:id      -- View credit
POST   /api/broker/credit/assess   -- Assess credit

# Multi-Stop
POST   /api/broker/multistop       -- Create multi-stop load
PUT    /api/broker/multistop/:id/optimize -- Optimize route
```

---

## How to Assign Permissions

### Via Admin Panel
1. Navigate to `/admin/users` or `/admin/roles`
2. Click "Role Permissions" tab
3. Find AGENT or BROKER role
4. Toggle permissions on/off
5. Changes save automatically

### Via API
```typescript
// Grant permission to role
POST /api/admin/permissions/roles/BROKER/grant
{
  "permission": "cargo:create"
}

// Revoke permission from role
POST /api/admin/permissions/roles/AGENT/revoke
{
  "permission": "cargo:create"
}
```

### Via SQL (Direct)
```sql
-- Grant permission to BROKER
INSERT INTO role_permissions (role, permission_id)
SELECT 'BROKER', id FROM permissions WHERE name = 'cargo:create'
ON CONFLICT DO NOTHING;

-- Revoke permission from AGENT
DELETE FROM role_permissions
WHERE role = 'AGENT' AND permission_id = (
  SELECT id FROM permissions WHERE name = 'cargo:create'
);
```

---

## Recommendations

### For AGENT Role
**Add these permissions to make AGENT more useful:**
1. `cargo:create` - Allow creating loads for clients
2. `bid:facilitate` - Help facilitate bidding process
3. `commission:request_payout` - Request commission payouts
4. `report:generate` - Generate basic reports
5. `notification:send` - Send notifications to clients

### For BROKER Role
**Current permissions are comprehensive and appropriate.**
Consider adding:
1. `analytics:advanced` - Advanced analytics access
2. `api:access` - API access for integrations
3. `export:data` - Export data capabilities

---

## Security Considerations

1. ✅ Brokers can only access their own tenant's data
2. ✅ Brokers cannot modify system settings
3. ✅ Brokers cannot create/delete users
4. ✅ All broker actions are logged in activity history
5. ✅ Commission calculations are audited
6. ✅ Escrow operations require multi-step verification
7. ✅ Dispute resolutions are tracked and reviewable

---

## Current Status

✅ **BROKER Role**: Fully implemented with comprehensive permissions
⚠️ **AGENT Role**: Basic implementation, needs enhancement

**Next Steps for AGENT:**
1. Add cargo creation permission
2. Add commission management
3. Add basic reporting
4. Add notification capabilities
5. Test and validate workflow
