# Credit Marketplace - Quick Start Guide

## What Changed?

We're moving from **fixed partner plans with slots** to a **flexible credit marketplace** where truck owners can buy any amount of credits they need.

---

## Old Way ❌

**Tenant Admin:**
1. Creates "Basic Plan" - 1000 credits, 3 slots, $1000
2. Creates "Premium Plan" - 2000 credits, 1 slot, $2000
3. Manages slot availability
4. Creates new plans when slots run out

**Truck Owner:**
1. Chooses from available plans only
2. Must buy 1000 or 2000 credits (no other options)
3. Plan might be sold out

**Problems:**
- Inflexible (can't buy 1500 credits)
- Slot management overhead
- Plans can sell out
- Wasted credits in unsold slots

---

## New Way ✅

**Tenant Admin:**
1. Sets minimum purchase: 500 credits
2. Sets price: $1.00/credit
3. Done! No plans to create or manage

**Truck Owner:**
1. Enters desired amount: 750, 1200, 1850, etc.
2. Pays: Amount × Price per credit
3. Gets exactly what they need

**Benefits:**
- Buy any amount (above minimum)
- No slots - never sold out
- Simple configuration
- Better credit utilization

---

## Quick Comparison

| Feature | Old System | New System |
|---------|-----------|------------|
| Truck owner buys | 1000 or 2000 credits | Any amount (≥500) |
| Tenant admin creates | Multiple plans | One-time config |
| Availability | Can sell out | Balance-limited only |
| Flexibility | Low | High |

---

## Example Scenario

**Tenant Admin has 5000 credits**

### Old System:
```
Creates:
- Basic (1000 credits, 3 slots) = 3000 allocated
- Premium (2000 credits, 1 slot) = 2000 allocated

Result:
- All 5000 credits pre-allocated
- Only 4 truck owners can buy
- If Premium doesn't sell, 2000 credits wasted
```

### New System:
```
Configures:
- Minimum: 500 credits
- Price: $1.00/credit

Result:
- Truck Owner 1 buys 750 credits
- Truck Owner 2 buys 1200 credits
- Truck Owner 3 buys 1500 credits
- Truck Owner 4 buys 600 credits
- Truck Owner 5 buys 950 credits
- Total: 5 truck owners served, all 5000 credits sold
```

---

## For Developers

### Key Changes

1. **No more partner plan creation** (optional - can keep for backward compatibility)
2. **New marketplace settings** table
3. **Dynamic credit purchase** endpoint
4. **Real-time balance** tracking

### New API Endpoints

```
POST   /api/credits/marketplace/configure
GET    /api/credits/marketplace/availability
POST   /api/credits/marketplace/purchase
```

### Frontend Updates

**Tenant Admin:**
- Remove/simplify partner plan creation UI
- Add marketplace configuration page
- Show available credits and sales analytics

**Truck Owner:**
- Replace plan selection with credit amount input
- Show real-time pricing calculation
- Display available balance

---

## Migration Path

### Option 1: Parallel Systems
- Keep old partner plans working
- Add new marketplace alongside
- Let tenant admins choose

### Option 2: Full Migration
- Convert existing plans to marketplace settings
- Deprecate plan creation
- Maintain existing subscriptions

---

## Next Steps

1. Review the full redesign document: `PARTNER_PLAN_SYSTEM_REDESIGN.md`
2. Decide on migration strategy
3. Implement database changes
4. Update API endpoints
5. Modify frontend UI
6. Test thoroughly
7. Deploy and monitor

---

*For detailed technical specifications, see: PARTNER_PLAN_SYSTEM_REDESIGN.md*
