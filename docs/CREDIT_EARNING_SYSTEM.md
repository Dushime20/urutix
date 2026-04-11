# Credit Earning System - How Tenant Admin Makes Profit

## Overview

The credit system is designed so that the tenant admin earns credits (profit) from each successful bid. This creates a sustainable business model where the platform generates revenue from transactions.

## Credit Flow When Bid is Accepted

### Example: 8-ton cargo with rates of 2 credits/ton (tenant) and 5 credits/ton (truck owner)

**Step 1: Tenant Admin Operational Cost**
- Deduct: 8 tons × 2 credits/ton = **-16 credits**
- Description: "Operational cost for facilitating the transaction"
- This is the cost to run the platform

**Step 2: Truck Owner Payment**
- Deduct: 8 tons × 5 credits/ton = **-40 credits**
- Description: "Payment for getting the job"
- This is what the truck owner pays to get the cargo delivery job

**Step 3: Tenant Admin Revenue (NEW!)**
- Grant: **+40 credits** (the amount truck owner paid)
- Description: "Revenue earned from truck owner payment"
- This is the tenant admin's earning from the transaction

### Net Result

**Tenant Admin:**
- Operational cost: -16 credits
- Revenue earned: +40 credits
- **Net profit: +24 credits** ✅

**Truck Owner:**
- Payment: -40 credits
- Gets the job and can earn money from cargo delivery

## Business Model

This creates a profitable business model:

1. **Tenant Admin** purchases subscription (e.g., 10,000 credits for $100)
2. **Tenant Admin** sells credits to truck owners via marketplace (e.g., 1,000 credits for $100)
3. **Truck Owner** uses credits to bid on cargo
4. When bid is accepted:
   - Tenant Admin pays small operational cost (2 credits/ton)
   - Truck Owner pays larger amount (5 credits/ton)
   - Tenant Admin receives truck owner's payment as revenue
   - **Tenant Admin profits 3 credits per ton!**

## Example Calculation

### Scenario: 100 successful bids, average 10 tons each

**Per Bid:**
- Tenant operational cost: 10 tons × 2 = 20 credits
- Truck owner payment: 10 tons × 5 = 50 credits
- Tenant revenue: 50 credits
- Tenant profit per bid: 50 - 20 = **30 credits**

**Total for 100 Bids:**
- Total operational cost: 100 × 20 = 2,000 credits
- Total revenue: 100 × 50 = 5,000 credits
- **Total profit: 3,000 credits**

If tenant admin bought 10,000 credits for $100:
- Cost per credit: $0.01
- Profit: 3,000 credits × $0.01 = **$30 profit**
- ROI: 30% on the initial investment

## Credit Rates Strategy

The difference between `creditsPerTonTenant` and `creditsPerTonTruckOwner` determines the profit margin:

- **Low margin** (e.g., 2 vs 3): 1 credit/ton profit = 50% markup
- **Medium margin** (e.g., 2 vs 5): 3 credits/ton profit = 150% markup
- **High margin** (e.g., 2 vs 10): 8 credits/ton profit = 400% markup

The tenant admin can adjust these rates in their subscription plan to balance:
- Competitiveness (lower rates attract more truck owners)
- Profitability (higher rates generate more revenue)

## Transaction Types

### CONSUMPTION (Operational Cost)
```
Type: CONSUMPTION
Amount: -16 credits
Description: "Bid accepted - operational cost for [cargo] (8 tons × 2 credits/ton)"
Reference: BID
```

### CONSUMPTION (Truck Owner Payment)
```
Type: CONSUMPTION
Amount: -40 credits
Description: "Bid accepted - payment for [cargo] (8 tons × 5 credits/ton)"
Reference: BID
```

### BONUS (Tenant Admin Revenue)
```
Type: BONUS
Amount: +40 credits
Description: "Bid revenue from [cargo] - earned from truck owner payment (8 tons × 5 credits/ton)"
Reference: BID
```

## Summary

The earning system ensures that:
1. ✅ Tenant admin always profits from successful bids
2. ✅ Profit margin is controlled by credit rate difference
3. ✅ All transactions are tracked transparently
4. ✅ System is sustainable and scalable
5. ✅ Truck owners pay for the value they receive (cargo delivery jobs)

This creates a win-win situation where the platform generates revenue while providing value to truck owners.
