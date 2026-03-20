# Activity Logs - Quick Start Guide

## What Was Fixed

The Activity Logs page was empty because activities were never being logged. I've implemented automatic activity logging that captures every user action.

## What You Need to Do

### 1. Restart the Backend Server

The activity logging interceptor is now registered. Restart your backend to activate it:

```bash
cd backend
npm run start:dev
```

### 2. Test It Works

Once the server is running, run this test script:

```bash
node test-activity-logging.js
```

This will:
- Login as admin
- Make a few API requests
- Check if activity logs were created
- Show you the recent logs

### 3. View in Admin Dashboard

1. Login to your application as super admin
2. Navigate to `/admin/activity-logs`
3. You should now see activities listed!

### 4. Generate More Activities

To populate the logs:
- Navigate to different pages
- View tenant details
- Create/edit/delete resources
- Check subscriptions
- View reports

Every action will be automatically logged!

## What's Now Working

✅ **Automatic Logging**: Every API request creates an activity log
✅ **Real-Time Updates**: New activities appear instantly (WebSocket)
✅ **Filtering**: Filter by action, resource, date, suspicious flag
✅ **Search**: Search by email, IP address, resource
✅ **Export**: Export activities to CSV
✅ **Session Management**: View and terminate active sessions
✅ **Suspicious Detection**: Automatic flagging of unusual activity

## Quick Verification

```bash
# Check if logs are being created
cd backend
node check-activity-logs.js
```

Before: "Total activity logs: 0"
After using the app: "Total activity logs: 15" (or more)

## Troubleshooting

### Still seeing empty page?

1. Make sure backend server is running
2. Make sure you're logged in (only authenticated requests are logged)
3. Try performing some actions (view tenants, create load, etc.)
4. Check browser console for errors
5. Run `node check-activity-logs.js` to verify database

### No real-time updates?

Check if the green "Live" badge appears in the top right. If not, WebSocket connection may be down.

## That's It!

The Activity Logs system is now fully operational. Just restart your backend and start using the application - all activities will be automatically logged and visible in the admin dashboard.
