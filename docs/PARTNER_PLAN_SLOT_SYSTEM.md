# Partner Plan Slot-Based Credit Allocation System

## Overview
This document describes the slot-based credit allocation system for Partner Plans, which allows Tenant Admins to flexibly distribute their purchased credits to Truck Owners while maintaining strict control over total usage.

## System Flow

### 1. System Admin → Tenant Admin
- System Admin creates subscription plans (e.g., 11,000 credits for $1,650)
- Tenant Admin purchases a subscription plan
- Credits are added to Tenant Admin's account

### 2. Tenant Admin → Truck Owners (Partner Plans)
- Tenant Admin creates Partner Plans from their purchased subscription
- Each Partner Plan has:
  - **Credit Cost Per Partner**: Credits required per truck owner (e.g., 1,000 credits)
  - **Available Slots**: Number of truck owners who can purchase this plan (e.g., 4 slots)
  - **Total Allocation**: Calculated as `Credit Cost × Available Slots` (e.g., 4,000 credits)

### 3. Truck Owners Purchase Partner Plans
- Truck owners browse available Partner Plans
- When a truck owner purchases a plan:
  - One slot is consumed
  - Credits are deducted from Tenant Admin's balance
  - Truck owner receives credits in their account
- Once all slots are filled, the plan is no longer available for purchase

## Example Scenario

### Tenant Admin Purchases: 11,000 Credits

#### Partner Plan A: "Starter Package"
- Credit Cost Per Partner: **1,000 credits**
- Available Slots: **4 partners**
- Total Allocation: **4,000 credits** (1,000 × 4)
- Status: 2/4 slots filled
- Remaining: 2 slots available

#### Partner Plan B: "Professional Package"
- Credit Cost Per Partner: **2,000 credits**
- Available Slots: **2 partners**
- Total Allocation: **4,000 credits** (2,000 × 2)
- Status: 1/2 slots filled
- Remaining: 1 slot available

#### Partner Plan C: "Enterprise Package"
- Credit Cost Per Partner: **3,000 credits**
- Available Slots: **1 partner**
- Total Allocation: **3,000 credits** (3,000 × 1)
- Status: 0/1 slots filled
- Remaining: 1 slot available

### Credit Allocation Summary
- **Total Purchased**: 11,000 credits
- **Total Allocated**: 11,000 credits (4,000 + 4,000 + 3,000)
- **Available for New Plans**: 0 credits
- **Consumed by Truck Owners**: 5,000 credits (2 + 1 + 0 slots filled)
- **Reserved but Unused**: 6,000 credits (remaining slots)

## Validation Rules

### 1. Credit Allocation Validation
```
Total Allocation = Σ (Credit Cost Per Partner × Available Slots)
Total Allocation ≤ Tenant Admin's Purchased Credits
```

### 2. Slot Consumption Tracking
- Track how many slots have been filled for each Partner Plan
- Prevent purchases when all slots are consumed
- Update available slots in real-time

### 3. Credit Deduction
- Credits are deducted from Tenant Admin's balance when truck owner purchases
- Credits are added to Truck Owner's account
- Transaction is atomic (both operations succeed or fail together)

## Database Schema

### subscription_plans Table
```sql
- id (UUID)
- name (VARCHAR)
- slug (VARCHAR)
- description (TEXT)
- parent_subscription_id (UUID) -- References tenant_subscriptions
- price_per_credit (DECIMAL)
- credit_cost_per_partner (INTEGER) -- Credits per slot
- available_slots (INTEGER) -- Total slots available
- total_credits (INTEGER) -- Calculated: credit_cost_per_partner × available_slots
- credits_per_ton_truck_owner (DECIMAL)
- is_active (BOOLEAN)
```

### partner_plan_purchases Table (New - To Be Created)
```sql
- id (UUID)
- partner_plan_id (UUID) -- References subscription_plans
- truck_owner_id (UUID) -- References users
- tenant_id (UUID) -- References tenants
- credits_allocated (INTEGER)
- purchase_date (TIMESTAMP)
- status (ENUM: active, cancelled, expired)
```

## API Endpoints

### Tenant Admin Endpoints
- `POST /api/subscriptions/partner-plans` - Create partner plan
- `GET /api/subscriptions/partner-plans` - List tenant's partner plans
- `PUT /api/subscriptions/partner-plans/:id` - Update partner plan
- `DELETE /api/subscriptions/partner-plans/:id` - Delete partner plan (if no purchases)
- `GET /api/subscriptions/partner-plans/:id/slots` - Get slot usage statistics

### Truck Owner Endpoints
- `GET /api/subscriptions/available-plans` - List available partner plans (with slot availability)
- `POST /api/subscriptions/purchase-partner-plan` - Purchase a partner plan
- `GET /api/subscriptions/my-partner-subscriptions` - List purchased partner plans

## Frontend Components

### Tenant Admin - Partner Plans Management
**Location**: `/tenant-admin/partner-plans`

**Features**:
- Create partner plans with credit cost and slot configuration
- View real-time slot usage (e.g., "2/4 slots filled")
- See total credit allocation vs available credits
- Edit plans (only if no slots are filled)
- Delete plans (only if no purchases made)

### Truck Owner - Browse Partner Plans
**Location**: `/truck-owner/subscription-plans`

**Features**:
- Browse available partner plans
- See slot availability (e.g., "3 slots remaining")
- View credit cost and benefits
- Purchase plan (if slots available)
- View purchased plans and credit balance

## Business Rules

### 1. Plan Creation
- Tenant Admin must have sufficient available credits
- Total allocation cannot exceed purchased credits
- At least 1 slot must be available

### 2. Plan Modification
- Can update name, description, status
- Cannot change credit cost or slots if any purchases made
- Can increase slots if credits available
- Can decrease slots only if no purchases exceed new limit

### 3. Plan Deletion
- Can only delete if no truck owners have purchased
- Deleting plan releases allocated credits back to available pool

### 4. Slot Management
- Slots are consumed on purchase
- Slots are released if truck owner cancels subscription
- Plan becomes unavailable when all slots filled
- Tenant Admin can add more slots if credits available

## Benefits

### For Tenant Admins
- **Flexible Distribution**: Create multiple plans with different pricing tiers
- **Credit Control**: Strict validation ensures no over-allocation
- **Revenue Opportunity**: Can markup prices for truck owners
- **Capacity Planning**: Control how many truck owners can join

### For Truck Owners
- **Transparent Pricing**: Clear credit cost per plan
- **Availability Visibility**: See how many slots remain
- **Flexible Options**: Choose plan that fits their needs
- **Fair Access**: First-come, first-served slot allocation

## Implementation Status

### ✅ Completed
1. Database migration for `credit_cost_per_partner` and `available_slots` columns
2. Entity updates in `SubscriptionPlan`
3. Service methods for partner plan CRUD operations
4. Controller endpoints for partner plan management
5. Frontend form with credit cost and slot inputs
6. Real-time allocation summary calculation
7. Validation for credit allocation limits

### 🔄 In Progress
1. Slot consumption tracking when truck owners purchase
2. Real-time slot availability updates
3. Purchase history and analytics

### 📋 To Do
1. Create `partner_plan_purchases` table
2. Implement truck owner purchase flow
3. Add slot usage statistics endpoint
4. Implement credit deduction on purchase
5. Add slot release on cancellation
6. Create truck owner subscription dashboard
7. Add email notifications for slot availability
8. Implement waiting list for full plans

## Example Use Cases

### Use Case 1: Small Fleet Operator
- Purchases 5,000 credits from System Admin
- Creates "Basic Plan" (500 credits, 8 slots) = 4,000 credits
- Creates "Premium Plan" (1,000 credits, 1 slot) = 1,000 credits
- Total: 5,000 credits allocated across 9 potential truck owners

### Use Case 2: Large Logistics Company
- Purchases 50,000 credits from System Admin
- Creates "Micro Plan" (1,000 credits, 20 slots) = 20,000 credits
- Creates "Small Plan" (2,500 credits, 8 slots) = 20,000 credits
- Creates "Medium Plan" (5,000 credits, 2 slots) = 10,000 credits
- Total: 50,000 credits allocated across 30 potential truck owners

### Use Case 3: Dynamic Adjustment
- Initially creates plan with 5 slots
- 3 slots get filled quickly
- Tenant Admin adds 5 more slots (if credits available)
- Now 7 more truck owners can purchase

## Monitoring & Analytics

### Tenant Admin Dashboard Metrics
- Total credits purchased
- Total credits allocated to partner plans
- Available credits for new plans
- Total slots created
- Slots filled vs available
- Revenue from truck owner purchases
- Most popular partner plans

### System Admin Dashboard Metrics
- Total partner plans created across all tenants
- Average slot utilization rate
- Credit allocation efficiency
- Tenant Admin engagement with partner plans

## Security Considerations

1. **Authorization**: Only Tenant Admin can create/manage their partner plans
2. **Validation**: Server-side validation for all credit calculations
3. **Atomic Transactions**: Credit deduction and allocation must be atomic
4. **Audit Trail**: Log all partner plan purchases and modifications
5. **Rate Limiting**: Prevent abuse of purchase endpoints

## Conclusion

The slot-based credit allocation system provides a flexible, controlled, and transparent way for Tenant Admins to distribute their purchased credits to Truck Owners. The system ensures:
- No over-allocation of credits
- Fair access through slot management
- Real-time visibility of availability
- Strict validation and control
- Scalable architecture for growth
