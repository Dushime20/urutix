# Bidding Auction Error Handling Fix

## Issue Summary
The `POST /api/bidding/auctions` endpoint was returning generic 500 Internal Server Error with no meaningful message when users tried to create auctions. This made it impossible for users to understand what went wrong.

## Root Cause
**Error**: `duplicate key value violates unique constraint "REL_0e1f240cbe7467e649e0a22f97"`

**Explanation**:
- The `Auction` entity has a `@OneToOne` relationship with `Load`
- This creates a unique constraint on `loadId` - only ONE auction per load
- When trying to create a second auction for the same load, PostgreSQL throws a constraint violation
- The error was not being caught and returned as a generic 500 error

## Changes Made

### 1. Controller Error Handling (`backend/src/modules/bidding/bidding.controller.ts`)

**Added**:
- Try-catch block around the service call
- Specific handling for PostgreSQL constraint errors (code 23505)
- User-friendly error messages
- Error logging for debugging

**Before**:
```typescript
async createAuction(
  @Body() createAuctionDto: CreateAuctionDto,
  @Request() req: any,
): Promise<Auction> {
  if (!req.user) {
    throw new Error('User not authenticated');
  }
  return this.biddingService.createAuction(...);
}
```

**After**:
```typescript
async createAuction(
  @Body() createAuctionDto: CreateAuctionDto,
  @Request() req: any,
): Promise<Auction> {
  try {
    if (!req.user) {
      throw new Error('User not authenticated');
    }
    return await this.biddingService.createAuction(...);
  } catch (error) {
    console.error('Error creating auction:', error);
    
    // Handle database constraint errors
    if (error.code === '23505') {
      if (error.constraint?.includes('REL_')) {
        throw new BadRequestException(
          'An auction already exists for this load. Please delete the existing auction first or use a different load.'
        );
      }
      throw new BadRequestException(
        'Duplicate entry detected. This auction may already exist.'
      );
    }
    
    // Re-throw known exceptions
    if (error.status) {
      throw error;
    }
    
    // Handle unknown errors
    throw new BadRequestException(
      error.message || 'Failed to create auction. Please check your input and try again.'
    );
  }
}
```

### 2. Service Error Messages (`backend/src/modules/bidding/bidding.service.ts`)

**Improved Error Messages**:

| Error Type | Before | After |
|------------|--------|-------|
| Load not found | "Load not found" | "Load with ID \"{loadId}\" not found. Please verify the load ID and try again." |
| Broker managed load | "Cannot create auction: Load is managed by a broker..." | "Cannot create auction: This load is currently managed by a broker. The assigned broker must create the auction." |
| Permission denied | "You do not have permission to create an auction for this load" | "You do not have permission to create an auction for this load. Only the load owner can create auctions." |
| Broker not assigned | "Broker is not assigned to this load" | "You are not assigned as the broker for this load. Only the assigned broker can create auctions." |
| No active contract | "Broker must have an active contract..." | "Cannot create auction: You must have an active contract to create auctions for this load." |
| Invalid load status | "Load must be created, published or assigned..." | "Cannot create auction: Load status is \"{status}\". Load must be in CREATED, PUBLISHED, or ASSIGNED status to create an auction." |
| Auction exists | "Auction already exists for this load" | "An auction already exists for this load (Auction ID: {id}, Status: {status}). Please delete the existing auction first or use a different load." |

### 3. Soft-Delete Handling

**Added**:
- Check for soft-deleted auctions using `withDeleted: true`
- If auction is soft-deleted, hard delete it to allow creating new auction
- If auction is active, provide detailed error with auction ID and status

**Code**:
```typescript
const existingAuction = await this.auctionRepository.findOne({
  where: { loadId: createAuctionDto.loadId },
  withDeleted: true, // Include soft-deleted auctions
});

if (existingAuction) {
  if (!existingAuction.deletedAt) {
    throw new BadRequestException(
      `An auction already exists for this load (Auction ID: ${existingAuction.id}, Status: ${existingAuction.status}). Please delete the existing auction first or use a different load.`
    );
  }
  
  // Hard delete soft-deleted auction
  await this.auctionRepository.remove(existingAuction);
}
```

## Error Response Examples

### Before Fix ❌
```json
{
  "statusCode": 500,
  "message": "Internal Server Error"
}
```

### After Fix ✅

**Auction Already Exists**:
```json
{
  "statusCode": 400,
  "message": "An auction already exists for this load (Auction ID: abc-123, Status: ACTIVE). Please delete the existing auction first or use a different load.",
  "error": "Bad Request"
}
```

**Load Not Found**:
```json
{
  "statusCode": 404,
  "message": "Load with ID \"invalid-id\" not found. Please verify the load ID and try again.",
  "error": "Not Found"
}
```

**Invalid Load Status**:
```json
{
  "statusCode": 400,
  "message": "Cannot create auction: Load status is \"IN_TRANSIT\". Load must be in CREATED, PUBLISHED, or ASSIGNED status to create an auction.",
  "error": "Bad Request"
}
```

**Permission Denied**:
```json
{
  "statusCode": 403,
  "message": "You do not have permission to create an auction for this load. Only the load owner can create auctions.",
  "error": "Forbidden"
}
```

## Database Constraint Details

### Unique Constraint
- **Constraint Name**: `REL_0e1f240cbe7467e649e0a22f97`
- **Type**: One-to-One relationship constraint
- **Table**: `auctions`
- **Column**: `loadId`
- **Meaning**: Only ONE auction can exist per load

### Entity Relationship
```typescript
@Entity('auctions')
export class Auction {
  @Column('uuid')
  loadId: string;

  @OneToOne('Load', 'auction')
  @JoinColumn({ name: 'loadId' })
  load: Load;
}
```

## Testing

### Test Case 1: Create Auction for Load with Existing Auction
**Request**:
```bash
POST /api/bidding/auctions
{
  "loadId": "existing-load-id",
  "auctionStart": "2026-05-05T00:00:00Z",
  "auctionEnd": "2026-05-10T00:00:00Z"
}
```

**Expected Response** (400):
```json
{
  "statusCode": 400,
  "message": "An auction already exists for this load (Auction ID: abc-123, Status: ACTIVE). Please delete the existing auction first or use a different load.",
  "error": "Bad Request"
}
```

### Test Case 2: Create Auction for Non-Existent Load
**Request**:
```bash
POST /api/bidding/auctions
{
  "loadId": "non-existent-id",
  "auctionStart": "2026-05-05T00:00:00Z",
  "auctionEnd": "2026-05-10T00:00:00Z"
}
```

**Expected Response** (404):
```json
{
  "statusCode": 404,
  "message": "Load with ID \"non-existent-id\" not found. Please verify the load ID and try again.",
  "error": "Not Found"
}
```

### Test Case 3: Create Auction for Load in Wrong Status
**Request**:
```bash
POST /api/bidding/auctions
{
  "loadId": "in-transit-load-id",
  "auctionStart": "2026-05-05T00:00:00Z",
  "auctionEnd": "2026-05-10T00:00:00Z"
}
```

**Expected Response** (400):
```json
{
  "statusCode": 400,
  "message": "Cannot create auction: Load status is \"IN_TRANSIT\". Load must be in CREATED, PUBLISHED, or ASSIGNED status to create an auction.",
  "error": "Bad Request"
}
```

## Files Modified

1. ✅ `backend/src/modules/bidding/bidding.controller.ts`
   - Added try-catch error handling
   - Added database constraint error detection
   - Added user-friendly error messages
   - Added `BadRequestException` import

2. ✅ `backend/src/modules/bidding/bidding.service.ts`
   - Improved all error messages with context
   - Added soft-delete handling
   - Added auction ID and status in error messages
   - Added `withDeleted: true` to existing auction check

## Benefits

✅ **User-Friendly**: Clear, actionable error messages
✅ **Debugging**: Includes relevant IDs and status information
✅ **Soft-Delete Handling**: Automatically cleans up soft-deleted auctions
✅ **Consistent**: All errors follow same format
✅ **Informative**: Users know exactly what went wrong and how to fix it

## Deployment

```bash
# SSH to server
ssh root@38.242.224.199

# Navigate to project
cd ~/urutix-smart-logistics

# Pull latest changes
git pull origin merge-superdashboard-into-dev

# Rebuild backend
docker-compose -f docker-compose.production.yml up -d --build backend

# Monitor logs
docker-compose -f docker-compose.production.yml logs -f backend
```

## Verification

After deployment, test the endpoint:

```bash
# Test with existing auction
curl -X POST http://38.242.224.199:3005/api/bidding/auctions \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "loadId": "existing-load-id",
    "auctionStart": "2026-05-05T00:00:00Z",
    "auctionEnd": "2026-05-10T00:00:00Z"
  }'
```

Expected: 400 Bad Request with meaningful error message (not 500)

---

**Status**: ✅ **COMPLETE AND READY FOR DEPLOYMENT**

**Date**: 2026-05-04
**Branch**: `merge-superdashboard-into-dev`
**Server**: `38.242.224.199:3005`
