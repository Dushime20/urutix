# Auction Creation Activation Guide

## Overview
The auction/bidding system allows cargo owners to create auctions for their cargo loads, enabling truck owners to bid competitively for transportation contracts.

## Prerequisites for Creating an Auction

### 1. User Requirements
- **Role**: Must be logged in as `CARGO_OWNER` or `BROKER`
- **Tenant**: Must belong to an active tenant
- **Credentials**: Use one of the cargo owner accounts:
  - `cargoowner1@demo.com` / `CargoOwner123!`
  - `cargoowner2@demo.com` / `CargoOwner123!`

### 2. Cargo/Load Requirements
The cargo must meet these conditions:
- **Status**: Must be in one of these states:
  - `CREATED`
  - `PUBLISHED`
  - `ASSIGNED`
- **Ownership**: Cargo owner must own the load
- **No Existing Auction**: Load cannot already have an active auction
- **Broker Status**: 
  - If load has a broker assigned, only the broker can create the auction
  - If no broker, the cargo owner can create the auction

### 3. Auction Data Requirements
Required fields:
- `loadId`: ID of the cargo/load to auction
- `auctionStart`: Start date/time (datetime-local format)
- `auctionEnd`: End date/time (datetime-local format)

Optional fields:
- `auctionType`: REVERSE (default), FORWARD, DUTCH, or SEALED
- `reservePrice`: Minimum acceptable price
- `minimumBidIncrement`: Minimum bid increment amount
- `maximumBidAmount`: Maximum bid amount allowed

## How to Activate Auction Creation

### Step 1: Create Cargo/Load
Before creating an auction, you need to have cargo registered in the system.

**Option A: Through UI**
1. Log in as cargo owner (`cargoowner1@demo.com` / `CargoOwner123!`)
2. Navigate to Cargo Management section
3. Click "Create New Cargo" or "Add Load"
4. Fill in cargo details:
   - Origin
   - Destination
   - Cargo type
   - Weight
   - Description
5. Save the cargo

**Option B: Through API**
```bash
POST /api/loads
Authorization: Bearer <cargo_owner_token>
Content-Type: application/json

{
  "origin": "Kigali",
  "destination": "Nairobi",
  "cargoType": "Electronics",
  "weightKg": 5000,
  "description": "Electronic equipment shipment",
  "status": "PUBLISHED"
}
```

### Step 2: Access Bidding Dashboard
1. Log in as cargo owner
2. Navigate to: **Dashboard → Bidding** or `/dashboard/bidding`
3. You should see the Bidding Dashboard with tabs:
   - My Auctions
   - Create (this is where you create auctions)
   - Analytics

### Step 3: Create Auction
1. Click on the **"Create"** tab
2. The form will show:
   - **Cargo Selection**: Dropdown of eligible cargos
   - **Auction Strategy**: Type of auction (REVERSE, FORWARD, DUTCH, SEALED)
   - **Reserve Valuation**: Minimum price (optional)
   - **Timing: Start Bound**: When auction starts
   - **Timing: End Bound**: When auction ends

3. Fill in the form:
   ```
   Cargo Selection: Select your cargo from dropdown
   Auction Strategy: REVERSE (recommended for getting lowest price)
   Reserve Valuation: 1000 (optional minimum price)
   Start Bound: 2026-04-11T09:00 (tomorrow morning)
   End Bound: 2026-04-15T17:00 (4 days later)
   ```

4. Click **"Initialize Auction"**

### Step 4: Verify Auction Creation
After successful creation:
- Success message appears: "Auction created successfully!"
- Auction appears in "My Auctions" tab
- Truck owners can now see and bid on the auction

## Auction Status Flow

```
SCHEDULED → ACTIVE → CLOSED
     ↓         ↓
  PAUSED   CANCELLED
```

- **SCHEDULED**: Auction created but not started yet (start time in future)
- **ACTIVE**: Auction is live and accepting bids
- **PAUSED**: Temporarily paused by cargo owner
- **CLOSED**: Auction ended (either time expired or manually closed)
- **CANCELLED**: Auction cancelled before completion

## Troubleshooting

### "No eligible cargos found"
**Cause**: No cargo meets the requirements
**Solution**:
1. Create new cargo with status CREATED or PUBLISHED
2. Ensure cargo is owned by logged-in user
3. Check that cargo doesn't already have an active auction

### "Load is managed by a broker"
**Cause**: Cargo has a broker assigned
**Solution**:
- Only the assigned broker can create auctions for this cargo
- Or remove broker assignment from the cargo

### "Auction already exists for this load"
**Cause**: An active auction already exists
**Solution**:
- Wait for current auction to close
- Or cancel the existing auction first
- Or select a different cargo

### "Load must be created, published or assigned"
**Cause**: Cargo status is not valid for auction
**Solution**:
- Change cargo status to CREATED, PUBLISHED, or ASSIGNED
- Check cargo details in cargo management

## API Endpoint

### Create Auction
```http
POST /api/bidding/auctions
Authorization: Bearer <token>
Content-Type: application/json

{
  "loadId": "uuid-of-cargo",
  "auctionType": "REVERSE",
  "auctionStart": "2026-04-11T09:00:00",
  "auctionEnd": "2026-04-15T17:00:00",
  "reservePrice": 1000
}
```

### Response
```json
{
  "id": "auction-uuid",
  "loadId": "cargo-uuid",
  "auctionType": "REVERSE",
  "status": "ACTIVE",
  "auctionStart": "2026-04-11T09:00:00",
  "auctionEnd": "2026-04-15T17:00:00",
  "reservePrice": 1000,
  "createdAt": "2026-04-10T18:30:00"
}
```

## Testing the Complete Flow

### 1. As Cargo Owner
```bash
# Login
POST /api/auth/login
{
  "email": "cargoowner1@demo.com",
  "password": "CargoOwner123!"
}

# Create cargo
POST /api/loads
{
  "origin": "Kigali",
  "destination": "Nairobi",
  "cargoType": "Electronics",
  "weightKg": 5000,
  "status": "PUBLISHED"
}

# Create auction
POST /api/bidding/auctions
{
  "loadId": "<cargo-id-from-above>",
  "auctionType": "REVERSE",
  "auctionStart": "2026-04-11T09:00:00",
  "auctionEnd": "2026-04-15T17:00:00",
  "reservePrice": 1000
}
```

### 2. As Truck Owner
```bash
# Login
POST /api/auth/login
{
  "email": "truckowner1@demo.com",
  "password": "TruckOwner@123"
}

# View available auctions
GET /api/bidding/auctions

# Place bid
POST /api/bidding/bids
{
  "auctionId": "<auction-id>",
  "bidAmount": 950,
  "notes": "Competitive offer with reliable service"
}
```

## Summary

To activate auction creation:
1. ✅ Have cargo owner account (cargoowner1@demo.com)
2. ✅ Create cargo with status PUBLISHED
3. ✅ Navigate to Dashboard → Bidding → Create tab
4. ✅ Fill auction form and submit
5. ✅ Truck owners can now bid on the auction

The system is fully functional and ready for auction creation!
