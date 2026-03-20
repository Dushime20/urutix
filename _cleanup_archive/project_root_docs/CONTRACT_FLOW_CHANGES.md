# Contract Flow Changes - Cargo Owner to Broker

## Overview
Modified the contract processing flow so that cargo owners create contracts when assigning brokers, and brokers can view and accept these contracts. The status changes are reflected for both parties.

## Changes Made

### Backend Changes

#### 1. Contract Service (`backend/src/modules/brokers/services/contract.service.ts`)
- **Modified `createContract` method**: Now accepts `cargoOwnerId` instead of `brokerId` as the creator
  - Verifies cargo owner exists and has access
  - Requires `brokerId` in the DTO
  - Sets initial status to `PENDING_SIGNATURE` instead of `DRAFT`
  - Contract type defaults to `BROKER_AGREEMENT`
  - Negotiation history shows "created by cargo owner"

- **Added `acceptContract` method**: Allows brokers to accept contracts
  - Verifies contract exists and belongs to broker
  - Checks contract is in `PENDING_SIGNATURE` status
  - Updates status to `ACTIVE`
  - Records broker signature with timestamp
  - Adds acceptance to negotiation history

- **Added `getCargoOwnerContracts` method**: Retrieves contracts for cargo owners
  - Filters by cargo owner ID and tenant
  - Includes broker profile information
  - Orders by creation date

#### 2. Create Contract DTO (`backend/src/modules/brokers/dto/create-contract.dto.ts`)
- **Added `brokerId` field**: Required UUID field to specify which broker the contract is for
- Moved `brokerId` to the top of the DTO for clarity

#### 3. Brokers Enhanced Controller (`backend/src/modules/brokers/brokers-enhanced.controller.ts`)
- **Modified `createContract` endpoint**: 
  - Now accessible by `CARGO_OWNER` role
  - Uses `userId` instead of `brokerId` for creation

- **Added `acceptContract` endpoint**: 
  - PUT `/brokers/contracts/:contractId/accept`
  - Only accessible by `BROKER` role
  - Calls the new `acceptContract` service method

- **Modified `getContracts` endpoint**:
  - Now accessible by both `BROKER` and `CARGO_OWNER` roles
  - Routes to appropriate service method based on user role
  - Brokers see contracts assigned to them
  - Cargo owners see contracts they created

### Frontend Changes

#### 1. Broker Assignment Modal (`frontend/src/components/Cargo/BrokerAssignmentModal.tsx`)
- **Enhanced `assignBroker` function**:
  - After assigning broker to load, automatically creates a contract
  - Contract includes broker ID, load ID, commission rate
  - Sets contract type to `BROKER_AGREEMENT`
  - Continues even if contract creation fails (graceful degradation)

#### 2. Cargo Owner Contracts Page (`frontend/src/pages/cargo-owner/Contracts.tsx`)
- **Replaced mock data with real API calls**:
  - `fetchContracts`: Fetches contracts from `/brokers/contracts` endpoint
  - Displays loading state while fetching
  - Shows error messages on failure

- **Updated contract interface**:
  - Changed to match backend contract structure
  - Includes nested broker and load objects
  - Status changed from `PENDING_REVIEW` to `PENDING_SIGNATURE`

- **Added helper functions**:
  - `getBrokerName`: Extracts broker name from nested profile
  - `getBrokerCompany`: Gets broker company name
  - `getLoadTitle`: Gets load title or generates from ID

- **Updated `handleReject` method**:
  - Makes API call to update contract status
  - Shows success/error toasts

- **Updated status handling**:
  - Changed `PENDING_REVIEW` to `PENDING_SIGNATURE`
  - Added `ACTIVE` status color (green)

#### 3. Broker Contract Management (`frontend/src/pages/broker/ContractManagement.tsx`)
- **Removed sample data**: Now only shows real contracts from API

- **Added `handleAcceptContract` method**:
  - Calls broker API to accept contract
  - Refreshes contract list on success
  - Shows success/error toasts

- **Added `canAcceptContract` helper**:
  - Returns true only for `PENDING_SIGNATURE` status
  - Used to conditionally show accept button

- **Updated action buttons**:
  - Replaced "Sign Contract" with "Accept Contract"
  - Only shows accept button for pending contracts
  - Uses CheckCircle2 icon for accept action

#### 4. Broker API Service (`frontend/src/services/brokerApi.ts`)
- **Added `acceptContract` method**:
  - PUT request to `/brokers/contracts/:contractId/accept`
  - No request body needed
  - Returns updated contract

## Contract Flow

### 1. Cargo Owner Assigns Broker
1. Cargo owner opens load details
2. Clicks "Assign Broker" button
3. Selects broker from modal
4. System assigns broker to load
5. System automatically creates contract with status `PENDING_SIGNATURE`

### 2. Broker Views Contract
1. Broker navigates to "Contracts" page
2. Sees contracts with `PENDING_SIGNATURE` status
3. Can view contract details
4. Can download contract PDF
5. Sees "Accept Contract" button

### 3. Broker Accepts Contract
1. Broker clicks "Accept Contract" button
2. System updates contract status to `ACTIVE`
3. Records broker signature with timestamp
4. Both cargo owner and broker see updated status

### 4. Status Visibility
- **Cargo Owner**: Sees all contracts they created with current status
- **Broker**: Sees all contracts assigned to them with current status
- **Status Colors**:
  - Yellow: `PENDING_SIGNATURE`
  - Green: `ACTIVE`, `SIGNED`
  - Red: `REJECTED`, `CANCELLED`
  - Gray: `DRAFT`

## Contract Statuses

1. **PENDING_SIGNATURE**: Contract created by cargo owner, waiting for broker acceptance
2. **ACTIVE**: Contract accepted by broker, currently in effect
3. **SIGNED**: Contract fully signed by all parties
4. **REJECTED**: Contract rejected by cargo owner
5. **CANCELLED**: Contract cancelled
6. **EXPIRED**: Contract expired

## API Endpoints

### Create Contract (Cargo Owner)
```
POST /brokers/contracts
Body: {
  brokerId: string,
  loadId: string,
  transporterId: string,
  agreedRate: number,
  commissionRate: number,
  currencyCode: string,
  paymentTerms: string,
  contractType: 'BROKER_AGREEMENT'
}
```

### Accept Contract (Broker)
```
PUT /brokers/contracts/:contractId/accept
```

### Get Contracts (Both Roles)
```
GET /brokers/contracts?status=PENDING_SIGNATURE
```

## Database Schema
No changes to the `load_contracts` table schema were required. The existing structure supports this flow.

## Testing Checklist

- [ ] Cargo owner can assign broker to load
- [ ] Contract is automatically created on broker assignment
- [ ] Cargo owner sees contract with PENDING_SIGNATURE status
- [ ] Broker sees contract in their contracts list
- [ ] Broker can accept contract
- [ ] Status changes to ACTIVE after acceptance
- [ ] Both parties see updated status
- [ ] Contract PDF can be downloaded
- [ ] Cargo owner can reject contract
- [ ] Error handling works correctly

## Future Enhancements

1. Email notifications when contract is created/accepted
2. Contract negotiation (counter-offers)
3. Contract templates
4. Digital signatures
5. Contract expiration reminders
6. Contract amendments
7. Multi-party signatures (transporter)
