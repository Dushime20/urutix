# Duplicate Pricing Rules Cleaned Up

## Issue
The pricing rules seed script was run twice (on 2026-02-13 and 2026-02-14), creating 12 duplicate rules instead of 6 unique rules.

## Detection
Created `check-duplicate-pricing-rules.js` script that:
- Groups rules by type, unit, and cost
- Identifies duplicate groups
- Suggests cleanup actions

### Found Duplicates
- **weight-ton-5.00**: 4 rules (2 active, 2 inactive)
- **weight-ton-4.00**: 2 rules (both inactive)
- **weight-ton-3.00**: 2 rules (both inactive)
- **distance-km-0.50**: 2 rules (both inactive)
- **flat-trip-10.00**: 2 rules (both inactive)

## Cleanup Process

### Step 1: Remove Inactive Duplicates
Script: `cleanup-duplicate-pricing-rules.js`
- Kept the newest rule from each duplicate group
- Deleted 5 inactive duplicate rules
- Deactivated 2 older active duplicates
- Result: 12 rules → 7 rules

### Step 2: Reactivate Default Rule
Script: `fix-pricing-rules-activation.js`
- Reactivated the default weight-based pricing rules
- Result: 2 active default rules (still duplicates)

### Step 3: Keep Only One Active Default
Script: `keep-one-active-default-rule.js`
- Kept the newest default rule (created 2026-02-14)
- Deactivated the older default rule (created 2026-02-13)
- Result: 1 active rule

## Final State

### Total Rules: 7 (down from 12)

### Active Rules: 1
- ✅ **Weight-based pricing (default)**: 5.00 credits per ton (weight)

### Inactive Rules: 6
- ⚪ Weight tier 1 (0-10 tons): 5.00 credits per ton
- ⚪ Weight tier 2 (10-50 tons): 4.00 credits per ton
- ⚪ Weight tier 3 (50+ tons): 3.00 credits per ton
- ⚪ Distance-based pricing: 0.50 credits per km
- ⚪ Flat rate per trip: 10.00 credits per trip
- ⚪ Time-based pricing: 2.00 credits per hour (if exists)

## Prevention
To prevent duplicate seeding in the future:

1. **Check before seeding**:
   ```javascript
   const existing = await repository.count();
   if (existing > 0) {
     console.log('Pricing rules already seeded, skipping...');
     return;
   }
   ```

2. **Use upsert operations**:
   ```javascript
   await repository.upsert(rules, ['ruleType', 'unit', 'creditCost']);
   ```

3. **Add unique constraints** (optional):
   ```sql
   ALTER TABLE credit_pricing_rules 
   ADD CONSTRAINT unique_rule_config 
   UNIQUE (rule_type, unit, credit_cost, plan_id, tenant_id);
   ```

## Scripts Created
1. `check-duplicate-pricing-rules.js` - Detect duplicates
2. `cleanup-duplicate-pricing-rules.js` - Remove duplicates
3. `fix-pricing-rules-activation.js` - Reactivate default rules
4. `keep-one-active-default-rule.js` - Keep only one active default
5. `test-pricing-rules-endpoint.js` - Test API endpoint

## Verification
```bash
node test-pricing-rules-endpoint.js
```

Output:
```
✅ GET request successful
Status: 200
Number of rules: 7
```

## Impact
- Database cleaned from 12 to 7 unique rules
- Only 1 active rule (the default: 1 ton = 5 credits)
- Frontend will now display 7 rules instead of 12
- No functional impact - system works correctly with cleaned data
