# Activity Logs Implementation Guide

## Current Status

The Activity Logs page at `/admin/activity-logs` is empty because:

1. ✅ **Database table exists**: `activity_logs` table is created and ready
2. ✅ **Backend API exists**: ActivityLogController and ActivityLogService are implemented
3. ✅ **Frontend page exists**: ActivityLogs.tsx page is fully functional
4. ❌ **No automatic logging**: Activities are not being logged automatically

## Root Cause

The `ActivityLogService.logActivity()` method exists but is never called. There's no:
- Interceptor to automatically log HTTP requests
- Middleware to track user actions
- Integration with authentication flow (login/logout)

## Solution: Implement Automatic Activity Logging

### Step 1: Create Activity Log Interceptor ✅

Created `src/interceptors/activity-log.interceptor.ts` that:
- Intercepts all HTTP requests
- Logs activities after successful requests
- Logs failed attempts with error details
- Extracts resource and action from URL and HTTP method
- Skips health checks and static files

### Step 2: Register Interceptor Globally

Add to `app.module.ts`:

```typescript
import { APP_INTERCEPTOR } from '@nestjs/core';
import { ActivityLogInterceptor } from './interceptors/activity-log.interceptor';

@Module({
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: ActivityLogInterceptor,
    },
  ],
})
export class AppModule {}
```

### Step 3: Add Manual Logging for Critical Actions

For login/logout and other critical actions, manually call `activityLogService.logActivity()`:

```typescript
// In auth service after successful login
await this.activityLogService.logActivity({
  userId: user.id,
  action: 'LOGIN',
  resource: 'auth',
  ipAddress: clientIp,
  userAgent: userAgent,
  details: { method: 'password' },
});

// After logout
await this.activityLogService.logActivity({
  userId: user.id,
  action: 'LOGOUT',
  resource: 'auth',
  ipAddress: clientIp,
});
```

### Step 4: Test Activity Logging

1. Start the backend server
2. Login as any user
3. Navigate to different pages
4. Perform CRUD operations
5. Check `/admin/activity-logs` - should see activities

## Activity Types Logged

### Automatic (via Interceptor)
- `VIEW_*` - GET requests
- `CREATE_*` - POST requests
- `UPDATE_*` - PUT/PATCH requests
- `DELETE_*` - DELETE requests

### Manual (Critical Actions)
- `LOGIN` - User authentication
- `LOGOUT` - User session end
- `PASSWORD_CHANGE` - Password updates
- `PERMISSION_CHANGE` - Role/permission modifications
- `PAYMENT_PROCESSED` - Financial transactions

## Suspicious Activity Detection

The system automatically flags activities as suspicious when:
- More than 30 actions per minute from same user/session
- Multiple IP addresses (>3) for same user within 1 hour
- Sensitive actions (DELETE_USER, UPDATE_PERMISSIONS, etc.)

## Session Tracking

User sessions are tracked in `user_sessions` table:
- Created on login
- Updated on each activity
- Expired sessions cleaned up automatically
- Can be terminated by admin

## Next Steps

1. ✅ Create ActivityLogInterceptor
2. ⏳ Register interceptor in AppModule
3. ⏳ Add manual logging to auth service
4. ⏳ Test with real user actions
5. ⏳ Verify logs appear in admin dashboard

## Files Modified

- ✅ `src/interceptors/activity-log.interceptor.ts` (created)
- ✅ `src/decorators/log-activity.decorator.ts` (created)
- ⏳ `src/app.module.ts` (needs update)
- ⏳ `src/modules/auth/enhanced-auth.service.ts` (needs update)

## Testing Commands

```bash
# Check if activity logs exist
node backend/check-activity-logs.js

# Test login and check logs
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"password"}'

# View logs in database
psql $DATABASE_URL -c "SELECT * FROM activity_logs ORDER BY created_at DESC LIMIT 10;"
```

## Expected Results

After implementation:
- Every API request creates an activity log entry
- Login/logout events are tracked
- Admin can view all activities in real-time
- Suspicious activities trigger alerts
- Sessions are tracked and can be terminated
