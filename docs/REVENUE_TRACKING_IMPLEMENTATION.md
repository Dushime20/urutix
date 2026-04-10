# Revenue Tracking System for Tenant Admins

## Overview

Implemented a comprehensive revenue tracking system that records financial earnings when tenant admins sell partner plans to truck owners.

## Problem Statement

Previously, when a tenant admin sold a partner plan to a truck owner:
- ✅ Truck owner received credits
- ✅ Payment was processed
- ❌ Tenant admin's revenue was NOT tracked
- ❌ No visibility into business performance
- ❌ No way to see earnings from partner sales

## Solution Implemented

Added revenue tracking fields to the credit account system to track:
1. Total revenue from partner plan sales
2. Number of partner plans sold
3. Credits allocated to partners
4. Credits available for future allocation

## Database Changes

### Migration 034: Add Revenue Tracking Fields

**File:** `backend/migrations/034_add_revenue_tracking_to_credit_accounts.sql`

**New Columns:**
```sql
ALTER TABLE credit_accounts ADD COLUMN:
- revenue_from_partner_sales DECIMAL(10, 2) DEFAULT 0
- total_partners_sold INTEGER DEFAULT 0
- credits_allocated_to_partners INTEGER DEFAULT 0
```

## Backend Changes

### 1. Entity Updates

**File:** `backend/src/entities/credit-account.entity.ts`

Added fields:
```typescript
@Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
revenueFromPartnerSales: number;

@Column({ type: 'int', default: 0 })
totalPartnersSold: number;

@Column({ type: 'int', default: 0 })
creditsAllocatedToPartners: number;
```

### 2. Service Updates

**File:** `backend/src/services/credit.service.ts`

**New Method:**
```typescript
async trackPartnerPlanRevenue(
  tenantId: string,
  revenueAmount: number,
  creditsAllocated: number,
): Promise<void>
```

**Updated Interface:**
```typescript
export interface CreditBalanceResponse {
  // Existing fields...
  revenueFromPartnerSales?: number;
  totalPartnersSold?: number;
  creditsAllocatedToPartners?: number;
  creditsAvailableForAllocation?: number;
}
```

**Updated Method:**
```typescript
async getCreditBalance(tenantId: string, userId?: string)
// Now includes revenue data for tenant-level accounts
```

### 3. Subscription Service Updates

**File:** `backend/src/services/subscription.service.ts`

**Updated Method:**
```typescript
async purchaseSubscription(data)
// Now tracks revenue when partner plans are purchased
```

## How It Works

### Flow Diagram

```
Truck Owner Purchases Partner Plan
    ↓
Payment Processed ($1000)
    ↓
Credits Granted to Truck Owner (1000 credits)
    ↓
Revenue Tracked for Tenant Admin
    ├─ revenueFromPartnerSales += $1000
    ├─ totalPartnersSold += 1
    └─ creditsAllocatedToPartners += 1000
```

### Example Scenario

**Initial State:**
```json
{
  "currentBalance": 5000,
  "subscriptionCredits": 5000,
  "revenueFromPartnerSales": 0,
  "totalPartnersSold": 0,
  "creditsAllocatedToPartners": 0
}
```

**Truck Owner Buys Partner Plan (1000 credits @ $1/credit):**
```json
{
  "currentBalance": 5000,           // Unchanged (operational credits)
  "subscriptionCredits": 5000,      // Unchanged
  "revenueFromPartnerSales": 1000,  // ✅ Revenue tracked!
  "totalPartnersSold": 1,            // ✅ Count increased!
  "creditsAllocatedToPartners": 1000, // ✅ Allocation tracked!
  "creditsAvailableForAllocation": 4000 // 5000 - 1000
}
```

**After 3 More Sales:**
```json
{
  "currentBalance": 5000,
  "subscriptionCredits": 5000,
  "revenueFromPartnerSales": 4000,  // $1000 × 4 sales
  "totalPartnersSold": 4,
  "creditsAllocatedToPartners": 4000,
  "creditsAvailableForAllocation": 1000
}
```

## API Response

### GET /api/credits/balance (Tenant Admin)

**Before:**
```json
{
  "success": true,
  "data": {
    "currentBalance": 5000,
    "subscriptionCredits": 5000,
    "purchasedCredits": 0,
    "bonusCredits": 0,
    "lifetimeEarned": 5000,
    "lifetimeSpent": 0
  }
}
```

**After:**
```json
{
  "success": true,
  "data": {
    "currentBalance": 5000,
    "subscriptionCredits": 5000,
    "purchasedCredits": 0,
    "bonusCredits": 0,
    "lifetimeEarned": 5000,
    "lifetimeSpent": 0,
    "revenueFromPartnerSales": 4000,
    "totalPartnersSold": 4,
    "creditsAllocatedToPartners": 4000,
    "creditsAvailableForAllocation": 1000
  }
}
```

## Field Explanations

### currentBalance
- **Purpose:** Operational credits available for tenant's own use
- **Source:** Purchased from system admin
- **Usage:** Tenant's cargo operations
- **Not affected by:** Partner plan sales

### subscriptionCredits
- **Purpose:** Credits from subscription purchases
- **Source:** Buying subscription plans from system admin
- **Calculation:** Sum of all subscription credits received

### revenueFromPartnerSales
- **Purpose:** Total money earned from selling partner plans
- **Source:** Truck owners purchasing partner plans
- **Calculation:** Sum of (price per credit × credits per plan)
- **Example:** 4 plans × $1000 each = $4000

### totalPartnersSold
- **Purpose:** Number of partner plan subscriptions sold
- **Source:** Count of truck owner purchases
- **Usage:** Business metrics, performance tracking

### creditsAllocatedToPartners
- **Purpose:** Total credits reserved/allocated for partner plans
- **Source:** Sum of credits in all sold partner plans
- **Calculation:** Sum of (credits per partner × number sold)
- **Example:** 4 plans × 1000 credits = 4000 credits

### creditsAvailableForAllocation
- **Purpose:** Credits that can still be allocated to new partner plans
- **Calculation:** `currentBalance - creditsAllocatedToPartners`
- **Example:** 5000 - 4000 = 1000 credits available

## Business Insights Enabled

With this system, tenant admins can now track:

1. **Revenue Performance**
   - Total earnings from partner sales
   - Average revenue per partner
   - Revenue growth over time

2. **Sales Metrics**
   - Number of partners onboarded
   - Conversion rates
   - Popular plan types

3. **Credit Utilization**
   - How many credits allocated vs available
   - Allocation efficiency
   - When to purchase more credits

4. **Financial Planning**
   - Profit margins (revenue vs credit cost)
   - ROI on subscription purchases
   - Capacity planning

## Example Queries

### Get Revenue Summary
```typescript
const balance = await creditService.getCreditBalance(tenantId);
console.log(`Total Revenue: $${balance.revenueFromPartnerSales}`);
console.log(`Partners Sold: ${balance.totalPartnersSold}`);
console.log(`Avg Revenue/Partner: $${balance.revenueFromPartnerSales / balance.totalPartnersSold}`);
```

### Check Allocation Capacity
```typescript
const balance = await creditService.getCreditBalance(tenantId);
const canCreateMorePlans = balance.creditsAvailableForAllocation > 1000;
console.log(`Can create more plans: ${canCreateMorePlans}`);
console.log(`Available for allocation: ${balance.creditsAvailableForAllocation} credits`);
```

## Testing

To test the revenue tracking:

1. **Login as tenant admin:**
   - Email: tenantadmin@demo.com
   - Password: TenantAdmin@123

2. **Check initial balance:**
   ```
   GET /api/credits/balance
   ```

3. **Create a partner plan:**
   - Navigate to `/tenant-admin/subscription-plans`
   - Go to "Manage Partners" tab
   - Create a plan with 1000 credits

4. **Have truck owner purchase the plan:**
   - Login as truckowner5@demo.com
   - Navigate to `/dashboard/fleet/partner-plans`
   - Purchase the plan

5. **Check updated balance:**
   ```
   GET /api/credits/balance
   ```
   Should show:
   - `revenueFromPartnerSales`: 1000
   - `totalPartnersSold`: 1
   - `creditsAllocatedToPartners`: 1000

## Future Enhancements

Potential additions:
- Revenue analytics dashboard
- Revenue trends over time
- Partner performance metrics
- Automated revenue reports
- Tax reporting integration
- Payout management system

## Date
April 10, 2026
