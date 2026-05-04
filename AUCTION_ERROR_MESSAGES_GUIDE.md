# Auction Creation Error Messages - Frontend Guide

## Overview
This guide helps frontend developers handle auction creation errors gracefully and display meaningful messages to users.

## Error Response Format

All errors follow this structure:
```typescript
{
  statusCode: number;    // HTTP status code
  message: string;       // User-friendly error message
  error: string;         // Error type (e.g., "Bad Request", "Not Found")
}
```

## Common Error Scenarios

### 1. Auction Already Exists (400)

**When**: User tries to create an auction for a load that already has one

**Response**:
```json
{
  "statusCode": 400,
  "message": "An auction already exists for this load (Auction ID: abc-123, Status: ACTIVE). Please delete the existing auction first or use a different load.",
  "error": "Bad Request"
}
```

**Frontend Handling**:
```typescript
try {
  await biddingAPI.createAuction(auctionData);
} catch (error) {
  if (error.response?.status === 400 && error.response?.data?.message?.includes('already exists')) {
    // Show user-friendly message
    toast.error(error.response.data.message);
    
    // Optionally, offer to view existing auction
    const auctionIdMatch = error.response.data.message.match(/Auction ID: ([a-f0-9-]+)/);
    if (auctionIdMatch) {
      const existingAuctionId = auctionIdMatch[1];
      // Navigate to existing auction or offer to delete it
      showConfirmDialog({
        title: 'Auction Already Exists',
        message: error.response.data.message,
        actions: [
          { label: 'View Existing Auction', onClick: () => navigate(`/auctions/${existingAuctionId}`) },
          { label: 'Delete and Create New', onClick: () => deleteAndRecreate(existingAuctionId) }
        ]
      });
    }
  }
}
```

### 2. Load Not Found (404)

**When**: Invalid or non-existent load ID

**Response**:
```json
{
  "statusCode": 404,
  "message": "Load with ID \"invalid-id\" not found. Please verify the load ID and try again.",
  "error": "Not Found"
}
```

**Frontend Handling**:
```typescript
if (error.response?.status === 404) {
  toast.error('Load not found. Please select a valid load.');
  // Redirect to loads list
  navigate('/loads');
}
```

### 3. Invalid Load Status (400)

**When**: Load is not in correct status (must be CREATED, PUBLISHED, or ASSIGNED)

**Response**:
```json
{
  "statusCode": 400,
  "message": "Cannot create auction: Load status is \"IN_TRANSIT\". Load must be in CREATED, PUBLISHED, or ASSIGNED status to create an auction.",
  "error": "Bad Request"
}
```

**Frontend Handling**:
```typescript
if (error.response?.status === 400 && error.response?.data?.message?.includes('Load status')) {
  const statusMatch = error.response.data.message.match(/status is "([^"]+)"/);
  const currentStatus = statusMatch ? statusMatch[1] : 'unknown';
  
  toast.error(`Cannot create auction: Load is currently ${currentStatus}. Only loads in CREATED, PUBLISHED, or ASSIGNED status can have auctions.`);
  
  // Disable auction creation button for loads in wrong status
  setCanCreateAuction(false);
}
```

### 4. Permission Denied - Not Owner (403)

**When**: User tries to create auction for load they don't own

**Response**:
```json
{
  "statusCode": 403,
  "message": "You do not have permission to create an auction for this load. Only the load owner can create auctions.",
  "error": "Forbidden"
}
```

**Frontend Handling**:
```typescript
if (error.response?.status === 403) {
  toast.error('Permission denied: You can only create auctions for your own loads.');
  navigate('/my-loads');
}
```

### 5. Broker Managed Load (403)

**When**: Cargo owner tries to create auction for broker-managed load

**Response**:
```json
{
  "statusCode": 403,
  "message": "Cannot create auction: This load is currently managed by a broker. The assigned broker must create the auction.",
  "error": "Forbidden"
}
```

**Frontend Handling**:
```typescript
if (error.response?.status === 403 && error.response?.data?.message?.includes('managed by a broker')) {
  toast.warning('This load is managed by a broker. Please contact your broker to create the auction.');
  // Show broker contact info if available
  showBrokerContact(load.brokerId);
}
```

### 6. Broker Not Assigned (403)

**When**: Broker tries to create auction for load they're not assigned to

**Response**:
```json
{
  "statusCode": 403,
  "message": "You are not assigned as the broker for this load. Only the assigned broker can create auctions.",
  "error": "Forbidden"
}
```

**Frontend Handling**:
```typescript
if (error.response?.status === 403 && error.response?.data?.message?.includes('not assigned')) {
  toast.error('You are not assigned to this load. Only the assigned broker can create auctions.');
  navigate('/broker/assigned-loads');
}
```

### 7. No Active Contract (403)

**When**: Broker doesn't have active contract for the load

**Response**:
```json
{
  "statusCode": 403,
  "message": "Cannot create auction: You must have an active contract to create auctions for this load.",
  "error": "Forbidden"
}
```

**Frontend Handling**:
```typescript
if (error.response?.status === 403 && error.response?.data?.message?.includes('active contract')) {
  toast.error('No active contract found. Please sign a contract before creating auctions.');
  navigate(`/contracts/create?loadId=${loadId}`);
}
```

## Complete Error Handler Example

```typescript
const handleCreateAuction = async (auctionData: AuctionData) => {
  try {
    setLoading(true);
    const response = await biddingAPI.createAuction(auctionData);
    toast.success('Auction created successfully!');
    navigate(`/auctions/${response.data.id}`);
  } catch (error: any) {
    console.error('Error creating auction:', error);
    
    const status = error.response?.status;
    const message = error.response?.data?.message || 'Failed to create auction';
    
    switch (status) {
      case 400:
        if (message.includes('already exists')) {
          // Extract auction ID and show options
          const auctionIdMatch = message.match(/Auction ID: ([a-f0-9-]+)/);
          if (auctionIdMatch) {
            showExistingAuctionDialog(auctionIdMatch[1], message);
          } else {
            toast.error(message);
          }
        } else if (message.includes('Load status')) {
          toast.error(message);
          setCanCreateAuction(false);
        } else {
          toast.error(message);
        }
        break;
        
      case 403:
        if (message.includes('managed by a broker')) {
          toast.warning(message);
          showBrokerContact(load.brokerId);
        } else if (message.includes('active contract')) {
          toast.error(message);
          navigate(`/contracts/create?loadId=${auctionData.loadId}`);
        } else {
          toast.error(message);
        }
        break;
        
      case 404:
        toast.error('Load not found. Please select a valid load.');
        navigate('/loads');
        break;
        
      default:
        toast.error(message || 'An unexpected error occurred. Please try again.');
    }
  } finally {
    setLoading(false);
  }
};
```

## UI Recommendations

### 1. Pre-Validation
Before showing the "Create Auction" button, check:
```typescript
const canCreateAuction = (load: Load) => {
  // Check load status
  if (!['CREATED', 'PUBLISHED', 'ASSIGNED'].includes(load.status)) {
    return { can: false, reason: `Load is ${load.status}` };
  }
  
  // Check ownership
  if (load.cargoOwnerId !== currentUser.id && load.brokerId !== currentUser.id) {
    return { can: false, reason: 'Not authorized' };
  }
  
  // Check if auction exists
  if (load.hasAuction) {
    return { can: false, reason: 'Auction already exists' };
  }
  
  return { can: true };
};

// In component
const auctionCheck = canCreateAuction(load);
<button 
  disabled={!auctionCheck.can}
  title={!auctionCheck.can ? auctionCheck.reason : 'Create auction'}
>
  Create Auction
</button>
```

### 2. Error Display Component
```typescript
const AuctionErrorAlert: React.FC<{ error: string }> = ({ error }) => {
  const getErrorType = (message: string) => {
    if (message.includes('already exists')) return 'warning';
    if (message.includes('Permission denied')) return 'error';
    if (message.includes('not found')) return 'error';
    return 'info';
  };

  const type = getErrorType(error);
  
  return (
    <Alert severity={type} sx={{ mb: 2 }}>
      <AlertTitle>
        {type === 'error' ? 'Error' : type === 'warning' ? 'Warning' : 'Info'}
      </AlertTitle>
      {error}
    </Alert>
  );
};
```

### 3. Confirmation Dialog for Existing Auction
```typescript
const showExistingAuctionDialog = (auctionId: string, message: string) => {
  confirmDialog({
    title: 'Auction Already Exists',
    message: message,
    confirmText: 'View Existing Auction',
    cancelText: 'Cancel',
    onConfirm: () => navigate(`/auctions/${auctionId}`),
    additionalActions: [
      {
        text: 'Delete and Create New',
        color: 'error',
        onClick: async () => {
          try {
            await biddingAPI.deleteAuction(auctionId);
            toast.success('Existing auction deleted');
            // Retry creation
            await handleCreateAuction(auctionData);
          } catch (err) {
            toast.error('Failed to delete existing auction');
          }
        }
      }
    ]
  });
};
```

## Testing Checklist

- [ ] Test creating auction for load with existing auction
- [ ] Test creating auction for non-existent load
- [ ] Test creating auction for load in wrong status
- [ ] Test creating auction for load owned by another user
- [ ] Test creating auction for broker-managed load (as cargo owner)
- [ ] Test creating auction for unassigned load (as broker)
- [ ] Test creating auction without active contract (as broker)
- [ ] Verify all error messages display correctly
- [ ] Verify error messages are user-friendly
- [ ] Verify appropriate actions are offered (view, delete, navigate)

## Best Practices

1. **Always display the full error message** - Backend provides context
2. **Extract IDs from messages** - Use regex to get auction/load IDs
3. **Offer actionable solutions** - Navigate, delete, contact, etc.
4. **Pre-validate when possible** - Disable buttons for invalid states
5. **Log errors for debugging** - Keep console.error for dev team
6. **Use appropriate toast types** - error, warning, info, success
7. **Handle network errors** - Check for error.response existence

---

**Last Updated**: 2026-05-04
**Related**: `BIDDING_AUCTION_ERROR_HANDLING_FIX.md`
