# Matching Data Seed Script

This script creates matching cargo and truck data for testing the AI matching system.

## What It Creates

### Users
- **deborah@gmail.com** (Cargo Owner) - Creates or finds existing user
- **truck.owner@test.com** (Truck Owner) - Creates or finds existing user

### Truck (MATCH-001)
- **Owner**: truck.owner@test.com
- **Capacity**: 25,000 kg / 80 m³
- **Type**: DRY_VAN
- **Features**:
  - ✅ Has Lift Gate (required by cargo)
  - ✅ Has Forklift (required by cargo)
  - ✅ Has Loading Dock capability
  - ✅ GPS enabled
  - ✅ Status: AVAILABLE
  - ✅ Active: true

### Cargo (Electronics Shipment)
- **Owner**: deborah@gmail.com
- **Weight**: 15,000 kg (within truck's 25,000 kg capacity)
- **Volume**: 50 m³ (within truck's 80 m³ capacity)
- **Type**: FRAGILE (electronics)
- **Requirements**:
  - ✅ Requires Lift Gate (truck has it)
  - ✅ Requires Forklift (truck has it)
  - ✅ Requires Loading Dock (truck has it)
  - ✅ Auto-match enabled

### Route
- **Pickup**: Nairobi, Kenya (Industrial Area)
- **Delivery**: Mombasa, Kenya (Port Road)
- **Pickup Date**: 2 days from now
- **Delivery Date**: 5 days from now

## Matching Criteria Met

✅ **Weight Capacity**: Truck (25,000 kg) >= Cargo (15,000 kg)  
✅ **Volume Capacity**: Truck (80 m³) >= Cargo (50 m³)  
✅ **Lift Gate**: Truck has it = Cargo requires it  
✅ **Forklift**: Truck has it = Cargo requires it  
✅ **Loading Dock**: Truck has it = Cargo requires it  
✅ **Equipment Type**: Both use DRY_VAN  
✅ **Cargo Type**: FRAGILE (truck supports fragile handling)  
✅ **Status**: Truck is AVAILABLE and ACTIVE  
✅ **Tenant**: Same tenant ID  
✅ **Auto-Match**: Enabled on cargo  

## How to Run

```bash
# From the backend directory
cd urutixv2/backend
npm run ts-node src/scripts/seed-matching-data.ts
```

Or using tsx:
```bash
npx tsx src/scripts/seed-matching-data.ts
```

## Expected Output

After running, you should see:
1. Users created/found
2. Truck created with plate number MATCH-001
3. Cargo created with title "Electronics Shipment - Nairobi to Mombasa"
4. Summary showing all matching criteria are met

## Testing the Match

1. Log in as **deborah@gmail.com**
2. View the cargo you created
3. The system should automatically match it to the truck owned by **truck.owner@test.com**
4. You can also manually trigger matching via the API:
   ```
   POST /matching/find-matches
   {
     "loadId": "<cargo-id>",
     "algorithm": "WEIGHTED_SCORE"
   }
   ```

## Notes

- The script is idempotent - it will find existing users/trucks if they already exist
- All data uses the default tenant ID: `00000000-0000-0000-0000-000000000001`
- The cargo will automatically trigger matching when created (if autoMatchEnabled is true)

