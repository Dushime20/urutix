# Phase 4.2: AppealsController - COMPLETE ✅

## Overview
Successfully implemented the AppealsController with all appeal management endpoints. Users can create appeals against enforcement actions, add messages, and track status. Admins can review appeals and make decisions.

## Completed Endpoints

### 1. POST /governance/appeals ✅
**Purpose:** Create a new appeal

**Features:**
- Users can appeal enforcement actions
- Validates enforcement action exists
- Prevents duplicate appeals
- Notifies admins of new appeal

**Request Body:**
```json
{
  "enforcementActionId": "action-uuid",
  "reason": "I believe this suspension was issued in error",
  "evidence": {
    "screenshots": ["url1", "url2"],
    "explanation": "Detailed explanation"
  },
  "additionalNotes": "This is my first violation"
}
```

### 2. GET /governance/appeals ✅
**Purpose:** Get all appeals with pagination and filtering

**Features:**
- Paginated results (default: 20 per page)
- Filter by status (pending, approved, rejected)
- Filter by user ID (admin only)
- Sort by any field (default: createdAt desc)
- Users see only their own appeals
- Admins see all appeals

**Query Parameters:**
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 20)
- `status` - Filter by status
- `userId` - Filter by user (admin only)
- `sortBy` - Sort field (default: createdAt)
- `sortOrder` - Sort order (asc/desc)

**Response:**
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "totalPages": 3
  }
}
```

### 3. GET /governance/appeals/:id ✅
**Purpose:** Get appeal by ID

**Features:**
- Detailed appeal information
- Includes all messages
- Users can only view own appeals
- Admins can view any appeal

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "appeal-uuid",
    "userId": "user-uuid",
    "enforcementActionId": "action-uuid",
    "reason": "Appeal reason",
    "status": "pending",
    "messages": [...],
    "createdAt": "2026-02-13T10:00:00Z"
  }
}
```

### 4. GET /governance/appeals/user/:userId ✅
**Purpose:** Get all appeals for a specific user

**Features:**
- Returns all user's appeals
- Users can only view own appeals
- Admins can view any user's appeals
- Sorted by creation date (newest first)

### 5. GET /governance/appeals/status/pending ✅
**Purpose:** Get all pending appeals (admin only)

**Features:**
- Returns appeals awaiting review
- Admin-only endpoint
- Sorted by creation date (oldest first)
- Used for admin dashboard

### 6. PATCH /governance/appeals/:id/review ✅
**Purpose:** Review an appeal (admin only)

**Features:**
- Approve or reject appeals
- Requires detailed admin notes
- Updates enforcement status if approved
- Notifies user of decision
- Cannot review already-reviewed appeals

**Request Body:**
```json
{
  "decision": "approved",
  "adminNotes": "After reviewing the evidence, we have determined the suspension was issued in error",
  "internalNotes": "Consulted with legal team"
}
```

### 7. POST /governance/appeals/:id/messages ✅
**Purpose:** Add message to appeal

**Features:**
- Creates conversation thread
- Both users and admins can add messages
- Supports attachments
- Cannot add messages to closed appeals
- Timestamps all messages

**Request Body:**
```json
{
  "message": "Thank you for reviewing my appeal. I have additional evidence.",
  "attachments": ["screenshot-url-1", "document-url-2"]
}
```

### 8. PATCH /governance/appeals/:id/withdraw ✅
**Purpose:** Withdraw an appeal

**Features:**
- Users can withdraw pending appeals
- Cannot withdraw approved/rejected appeals
- Updates appeal status to withdrawn
- Notifies admins

## DTOs Created

### 1. CreateAppealDto ✅
**File:** `dto/create-appeal.dto.ts`

**Validation:**
- `enforcementActionId` - Required UUID
- `reason` - Required string (20-2000 chars)
- `evidence` - Optional object
- `additionalNotes` - Optional string (max 1000 chars)

### 2. ReviewAppealDto ✅
**File:** `dto/review-appeal.dto.ts`

**Validation:**
- `decision` - Required enum (approved/rejected)
- `adminNotes` - Required string (20-2000 chars)
- `internalNotes` - Optional string (max 1000 chars)

### 3. AddAppealMessageDto ✅
**File:** `dto/add-appeal-message.dto.ts`

**Validation:**
- `message` - Required string (10-2000 chars)
- `attachments` - Optional array of strings

## Features Implemented

### ✅ Pagination
- Configurable page size
- Total count tracking
- Total pages calculation
- Efficient database queries

### ✅ Filtering
- By status (pending, approved, rejected)
- By user ID (admin only)
- By date range (via sortBy)

### ✅ Sorting
- Sort by any field
- Ascending or descending order
- Default: createdAt desc

### ✅ Access Control
- Users see only their own appeals
- Admins see all appeals
- Role-based filtering
- Ownership validation

### ✅ Swagger Documentation
- All endpoints documented
- Request/response schemas
- Query parameter descriptions
- Example payloads

### ✅ Error Handling
- Proper HTTP status codes
- Descriptive error messages
- Validation errors
- Business logic errors

## API Response Format

### Success Response
```json
{
  "success": true,
  "message": "Appeal created successfully",
  "data": { ... }
}
```

### Paginated Response
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "totalPages": 3
  }
}
```

### Error Response
```json
{
  "statusCode": 400,
  "error": "Bad Request",
  "message": "Appeal already exists for this enforcement action",
  "timestamp": "2026-02-13T10:00:00Z",
  "path": "/api/governance/appeals"
}
```

## HTTP Status Codes

| Code | Usage |
|------|-------|
| 200 | Successful GET or PATCH operation |
| 201 | Successful POST operation (resource created) |
| 400 | Bad request (validation or business logic error) |
| 401 | Unauthorized (authentication required) |
| 403 | Forbidden (insufficient permissions or ownership) |
| 404 | Not found (appeal or resource not found) |
| 500 | Internal server error |

## Access Control

### User Permissions
- ✅ Create appeals for own enforcement actions
- ✅ View own appeals
- ✅ Add messages to own appeals
- ✅ Withdraw own pending appeals
- ❌ Cannot view other users' appeals
- ❌ Cannot review appeals
- ❌ Cannot access admin endpoints

### Admin Permissions
- ✅ View all appeals
- ✅ Filter by any user
- ✅ Review appeals (approve/reject)
- ✅ Add messages to any appeal
- ✅ Access pending appeals list
- ✅ View internal notes

## Integration

### With AppealsService
- All business logic in service layer
- Controller handles HTTP concerns only
- Proper error propagation
- Transaction support

### With EnforcementService
- Appeals linked to enforcement actions
- Status updates on approval
- Audit trail integration

### With NotificationModule
- Notify admins of new appeals
- Notify users of decisions
- Notify on new messages

## Testing

### Manual Testing with cURL

**Create Appeal:**
```bash
curl -X POST http://localhost:3000/api/governance/appeals \
  -H "Authorization: Bearer USER_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "enforcementActionId": "action-uuid",
    "reason": "I believe this suspension was issued in error"
  }'
```

**Get Appeals (Paginated):**
```bash
curl -X GET "http://localhost:3000/api/governance/appeals?page=1&limit=20&status=pending" \
  -H "Authorization: Bearer JWT_TOKEN"
```

**Review Appeal (Admin):**
```bash
curl -X PATCH http://localhost:3000/api/governance/appeals/appeal-uuid/review \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "decision": "approved",
    "adminNotes": "Appeal approved after review"
  }'
```

**Add Message:**
```bash
curl -X POST http://localhost:3000/api/governance/appeals/appeal-uuid/messages \
  -H "Authorization: Bearer JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Thank you for reviewing my appeal"
  }'
```

### Swagger UI Testing
1. Navigate to http://localhost:3000/api/docs
2. Find "Appeals" tag
3. Click "Authorize" and enter JWT token
4. Try out endpoints directly

## Use Cases

### User Creates Appeal
1. User receives enforcement action (suspension)
2. User navigates to appeals page
3. User creates appeal with reason and evidence
4. System validates and creates appeal
5. Admin receives notification
6. User can track appeal status

### Admin Reviews Appeal
1. Admin views pending appeals
2. Admin selects appeal to review
3. Admin reads user's reason and evidence
4. Admin makes decision (approve/reject)
5. System updates enforcement status if approved
6. User receives notification of decision

### Appeal Conversation
1. User creates appeal
2. Admin adds message requesting more info
3. User receives notification
4. User adds message with additional evidence
5. Admin reviews and makes decision
6. Appeal is resolved

### User Withdraws Appeal
1. User creates appeal
2. User decides to withdraw
3. User clicks withdraw button
4. System updates appeal status
5. Admin receives notification

## Code Quality

- ✅ Zero TypeScript errors
- ✅ Comprehensive JSDoc comments
- ✅ Consistent code style
- ✅ Proper error handling
- ✅ Type safety
- ✅ Clean architecture

## Files Created

1. `backend/src/modules/governance/appeals.controller.ts` - Appeals controller
2. `backend/src/modules/governance/dto/create-appeal.dto.ts` - Create appeal DTO
3. `backend/src/modules/governance/dto/review-appeal.dto.ts` - Review appeal DTO
4. `backend/src/modules/governance/dto/add-appeal-message.dto.ts` - Add message DTO
5. `backend/src/modules/governance/PHASE_4_2_COMPLETE.md` - This file

## Files Modified

1. `backend/src/modules/governance/governance.module.ts` - Added AppealsController

## Next Steps

### Phase 4.3: RiskFlagsController
- [ ] GET /risk-flags - List risk flags
- [ ] POST /risk-flags - Create risk flag
- [ ] PATCH /risk-flags/:id/review - Review flag
- [ ] GET /risk-flags/user/:userId - Get user flags
- [ ] Filtering by severity and status

### Phase 4.4: AuditController
- [ ] GET /audit - List audit logs
- [ ] GET /audit/export - Export audit logs
- [ ] GET /audit/user/:userId - User audit trail
- [ ] GET /audit/admin/:adminId - Admin actions
- [ ] Date range filtering
- [ ] Export formats (CSV, Excel, JSON)

### Phase 4.5: BlacklistController
- [ ] POST /blacklist - Add to blacklist
- [ ] GET /blacklist - List blacklist entries
- [ ] DELETE /blacklist/:id - Remove from blacklist
- [ ] GET /blacklist/check - Check if blacklisted

### Phase 4.6: DashboardController
- [ ] GET /dashboard/stats - Dashboard statistics
- [ ] GET /dashboard/flagged-users - Flagged users
- [ ] GET /dashboard/pending-appeals - Pending appeals
- [ ] GET /dashboard/recent-actions - Recent actions

## Summary

Phase 4.2 is complete with 8 fully functional endpoints:
- ✅ 1 create endpoint
- ✅ 4 read endpoints (list, by ID, by user, pending)
- ✅ 2 update endpoints (review, withdraw)
- ✅ 1 message endpoint

All endpoints include:
- ✅ Authentication & authorization
- ✅ Request validation with DTOs
- ✅ Swagger documentation
- ✅ Pagination and filtering
- ✅ Access control
- ✅ Error handling
- ✅ Comprehensive documentation

The AppealsController is production-ready and provides a complete REST API for appeal management.
