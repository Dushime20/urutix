# Governance API Documentation

## Overview
The Governance API provides endpoints for managing user enforcement actions, appeals, risk flags, audit logs, and blacklist management. All endpoints require authentication and appropriate role-based permissions.

**Base URL:** `/api/governance`

**Authentication:** Bearer Token (JWT)

**Required Role:** Tenant Admin

## Enforcement Endpoints

### 1. Suspend User
Temporarily blocks all platform access for a user.

**Endpoint:** `POST /governance/enforcement/suspend/:userId`

**Parameters:**
- `userId` (path) - UUID of the user to suspend

**Request Body:**
```json
{
  "reason": "Violation of terms of service",
  "violationCategory": "spam",
  "severity": "high",
  "expiresAt": "2026-03-15T00:00:00Z",
  "adminNotes": "User posted spam content repeatedly",
  "internalNotes": "Third violation this month",
  "evidence": {
    "posts": ["post-123", "post-456"],
    "reports": 15
  }
}
```

**Response:** `201 Created`
```json
{
  "success": true,
  "message": "User suspended successfully",
  "data": {
    "id": "action-uuid",
    "adminId": "admin-uuid",
    "targetUserId": "user-uuid",
    "actionType": "suspend",
    "reason": "Violation of terms of service",
    "severity": "high",
    "createdAt": "2026-02-13T10:00:00Z"
  }
}
```

**Error Responses:**
- `400 Bad Request` - User already suspended or terminated
- `401 Unauthorized` - Authentication required
- `403 Forbidden` - Requires Tenant Admin role
- `404 Not Found` - User not found

---

### 2. Unsuspend User
Lifts suspension from a user, restoring normal platform access.

**Endpoint:** `POST /governance/enforcement/unsuspend/:userId`

**Parameters:**
- `userId` (path) - UUID of the user to unsuspend

**Request Body:**
```json
{
  "notes": "Suspension period completed. User has acknowledged terms."
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "User unsuspended successfully",
  "data": {
    "id": "action-uuid",
    "adminId": "admin-uuid",
    "targetUserId": "user-uuid",
    "actionType": "unsuspend",
    "reason": "Suspension period completed",
    "createdAt": "2026-02-13T10:00:00Z"
  }
}
```

**Error Responses:**
- `400 Bad Request` - User not currently suspended
- `401 Unauthorized` - Authentication required
- `403 Forbidden` - Requires Tenant Admin role
- `404 Not Found` - User not found

---

### 3. Restrict Features
Applies granular feature-level restrictions without full suspension.

**Endpoint:** `POST /governance/enforcement/restrict/:userId`

**Parameters:**
- `userId` (path) - UUID of the user to restrict

**Request Body:**
```json
{
  "restrictions": {
    "canPostCargo": false,
    "canBid": false,
    "canMessage": true
  },
  "reason": "Suspicious activity detected",
  "expiresAt": "2026-03-01T00:00:00Z",
  "adminNotes": "Restricting posting until verification complete",
  "evidence": {
    "flaggedPosts": 5,
    "riskScore": 75
  }
}
```

**Response:** `201 Created`
```json
{
  "success": true,
  "message": "Features restricted successfully",
  "data": {
    "id": "action-uuid",
    "adminId": "admin-uuid",
    "targetUserId": "user-uuid",
    "actionType": "restrict",
    "restrictionsApplied": {
      "canPostCargo": false,
      "canBid": false
    },
    "createdAt": "2026-02-13T10:00:00Z"
  }
}
```

**Common Feature Keys:**
- `canPostCargo` - Post cargo listings
- `canAddTrucks` - Add trucks to fleet
- `canBid` - Bid on loads
- `canMessage` - Send messages
- `canViewAnalytics` - View analytics
- `readOnly` - Read-only access

**Error Responses:**
- `400 Bad Request` - User is terminated
- `401 Unauthorized` - Authentication required
- `403 Forbidden` - Requires Tenant Admin role
- `404 Not Found` - User not found

---

### 4. Lift Restrictions
Removes specified feature restrictions, potentially restoring full access.

**Endpoint:** `POST /governance/enforcement/lift-restrictions/:userId`

**Parameters:**
- `userId` (path) - UUID of the user

**Request Body:**
```json
{
  "restrictions": ["canPostCargo", "canBid"]
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Restrictions lifted successfully",
  "data": {
    "id": "action-uuid",
    "adminId": "admin-uuid",
    "targetUserId": "user-uuid",
    "actionType": "unrestrict",
    "reason": "Lifted restrictions: canPostCargo, canBid",
    "createdAt": "2026-02-13T10:00:00Z"
  }
}
```

**Error Responses:**
- `401 Unauthorized` - Authentication required
- `403 Forbidden` - Requires Tenant Admin role
- `404 Not Found` - User not found

---

### 5. Terminate Subscription
Permanently blocks all platform access. Most severe enforcement action.

**Endpoint:** `POST /governance/enforcement/terminate/:userId`

**Parameters:**
- `userId` (path) - UUID of the user to terminate

**Request Body:**
```json
{
  "reason": "Repeated violations of terms of service",
  "violationCategory": "fraud",
  "adminNotes": "User engaged in fraudulent activities",
  "internalNotes": "Legal team notified",
  "evidence": {
    "fraudulentTransactions": 10,
    "affectedUsers": 25,
    "totalLoss": 50000
  }
}
```

**Response:** `201 Created`
```json
{
  "success": true,
  "message": "User terminated successfully",
  "data": {
    "id": "action-uuid",
    "adminId": "admin-uuid",
    "targetUserId": "user-uuid",
    "actionType": "terminate",
    "reason": "Repeated violations",
    "severity": "critical",
    "createdAt": "2026-02-13T10:00:00Z"
  }
}
```

**Error Responses:**
- `400 Bad Request` - User already terminated
- `401 Unauthorized` - Authentication required
- `403 Forbidden` - Requires Tenant Admin role
- `404 Not Found` - User not found

---

### 6. Reinstate User
Restores platform access to a previously terminated user.

**Endpoint:** `POST /governance/enforcement/reinstate/:userId`

**Parameters:**
- `userId` (path) - UUID of the user to reinstate

**Request Body:**
```json
{
  "notes": "Investigation completed. User cleared of all charges. Reinstating access."
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "User reinstated successfully",
  "data": {
    "id": "action-uuid",
    "adminId": "admin-uuid",
    "targetUserId": "user-uuid",
    "actionType": "reinstate",
    "reason": "Investigation completed",
    "createdAt": "2026-02-13T10:00:00Z"
  }
}
```

**Error Responses:**
- `400 Bad Request` - User not currently terminated
- `401 Unauthorized` - Authentication required
- `403 Forbidden` - Requires Tenant Admin role
- `404 Not Found` - User not found

---

### 7. Get Enforcement Status
Returns the complete enforcement status including restrictions.

**Endpoint:** `GET /governance/enforcement/status/:userId`

**Parameters:**
- `userId` (path) - UUID of the user

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "enforcement_status": "restricted",
    "suspended_by": null,
    "suspended_at": null,
    "suspension_reason": null,
    "suspension_expires_at": null,
    "terminated_by": null,
    "terminated_at": null,
    "termination_reason": null,
    "restrictions": {
      "canPostCargo": false,
      "canBid": false
    },
    "last_reinstated_by": null,
    "last_reinstated_at": null,
    "reinstatement_notes": null
  }
}
```

**Enforcement Status Values:**
- `normal` - No enforcement actions
- `suspended` - Account suspended
- `restricted` - Feature restrictions applied
- `terminated` - Account permanently terminated

**Error Responses:**
- `401 Unauthorized` - Authentication required
- `403 Forbidden` - Requires Tenant Admin role
- `404 Not Found` - User not found

---

## Cache Metrics Endpoint

### Get Cache Metrics
Returns cache performance metrics for monitoring.

**Endpoint:** `GET /governance/cache/metrics`

**Response:** `200 OK`
```json
{
  "invalidations": 42,
  "warmings": 15,
  "hits": 1250,
  "misses": 58,
  "hitRate": 95.56
}
```

---

## Common Response Formats

### Success Response
```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": { ... }
}
```

### Error Response
```json
{
  "statusCode": 400,
  "error": "Bad Request",
  "message": "User is already suspended",
  "timestamp": "2026-02-13T10:00:00Z",
  "path": "/api/governance/enforcement/suspend/user-123"
}
```

---

## Authentication

All endpoints require a valid JWT token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

The token must contain:
- `user.id` - Admin user ID
- `user.role` - Must be "tenant_admin" or higher
- `user.tenantId` - Tenant ID for multi-tenancy

---

## Rate Limiting

All endpoints are rate-limited to prevent abuse:
- **Limit:** 100 requests per minute per user
- **Headers:**
  - `X-RateLimit-Limit` - Maximum requests allowed
  - `X-RateLimit-Remaining` - Remaining requests
  - `X-RateLimit-Reset` - Time when limit resets

**Rate Limit Exceeded Response:** `429 Too Many Requests`
```json
{
  "statusCode": 429,
  "error": "Too Many Requests",
  "message": "Rate limit exceeded. Please try again later.",
  "retryAfter": 60
}
```

---

## Audit Trail

All enforcement actions are logged in an immutable audit trail:
- **Who:** Admin user ID
- **What:** Action type (suspend, unsuspend, restrict, etc.)
- **When:** Timestamp
- **Why:** Reason and notes
- **Evidence:** Supporting evidence
- **Previous State:** State before action
- **New State:** State after action

Audit logs can be accessed via the Audit API (coming in Phase 4.4).

---

## Best Practices

### 1. Always Provide Detailed Reasons
```json
{
  "reason": "User posted spam content in 15 cargo listings",
  "adminNotes": "User ignored 3 warnings. Suspension warranted.",
  "evidence": {
    "spamPosts": 15,
    "warnings": 3,
    "reports": 25
  }
}
```

### 2. Use Appropriate Severity Levels
- `low` - Minor violations, first offense
- `medium` - Repeated minor violations
- `high` - Serious violations
- `critical` - Fraud, illegal activity

### 3. Set Expiration Dates for Temporary Actions
```json
{
  "expiresAt": "2026-03-15T00:00:00Z"
}
```

### 4. Use Feature Restrictions Before Suspension
Start with granular restrictions before full suspension:
```json
{
  "restrictions": {
    "canPostCargo": false,
    "canMessage": true
  }
}
```

### 5. Document Internal Notes
Use `internalNotes` for sensitive information not shown to users:
```json
{
  "adminNotes": "User violated spam policy",
  "internalNotes": "Legal team reviewing case. Potential lawsuit."
}
```

---

## Error Codes

| Code | Description |
|------|-------------|
| 400 | Bad Request - Invalid input or business logic error |
| 401 | Unauthorized - Authentication required |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found - Resource not found |
| 429 | Too Many Requests - Rate limit exceeded |
| 500 | Internal Server Error - Server error |

---

## Swagger Documentation

Interactive API documentation is available at:
```
http://localhost:3000/api/docs
```

Features:
- Try out endpoints directly
- View request/response schemas
- See example payloads
- Test authentication

---

## Testing

### Using cURL

**Suspend User:**
```bash
curl -X POST http://localhost:3000/api/governance/enforcement/suspend/user-123 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "reason": "Spam violation",
    "violationCategory": "spam",
    "severity": "high",
    "expiresAt": "2026-03-15T00:00:00Z"
  }'
```

**Get Enforcement Status:**
```bash
curl -X GET http://localhost:3000/api/governance/enforcement/status/user-123 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Using Postman

1. Import the Swagger JSON from `/api/docs-json`
2. Set up environment variables:
   - `BASE_URL`: http://localhost:3000
   - `JWT_TOKEN`: Your authentication token
3. Use the pre-configured requests

---

## Support

For issues or questions:
1. Check the error message and status code
2. Review the audit logs
3. Verify authentication and permissions
4. Check rate limits
5. Consult the Swagger documentation

---

## Changelog

### Version 1.0.0 (2026-02-13)
- Initial release
- 7 enforcement endpoints
- Cache metrics endpoint
- Swagger documentation
- Rate limiting
- Audit trail integration
