# Notification System - Role-Based Breakdown

## Overview
The notification system is event-driven, using NestJS EventEmitter to trigger notifications when specific actions occur. Notifications are sent to different user roles based on their involvement in the logistics workflow.

---

## User Roles in the System

### Primary Roles:
1. **CARGO_OWNER** - Customers who need to ship cargo
2. **TRUCK_OWNER** - Fleet owners who provide trucks and drivers
3. **DRIVER** - Drivers who operate trucks and deliver cargo
4. **BROKER** - Intermediaries who facilitate cargo-truck matching

### Administrative Roles:
5. **SUPER_ADMIN** - System-level administrators
6. **ADMIN** - Platform administrators
7. **TENANT_ADMIN** - Organization administrators
8. **FLEET_MANAGER** - Manages fleet operations
9. **FLEET_DISPATCHER** - Coordinates driver assignments
10. **FLEET_ACCOUNTANT** - Handles financial operations
11. **FLEET_SAFETY_OFFICER** - Manages safety compliance

### Other Roles:
12. **CARGO_RECEIVER** - Receives cargo at destination
13. **AGENT** - Third-party agents
14. **LENDER** - Financial service providers

---

## Notification Types & Categories

### Notification Types (50+ types):
- **System**: SYSTEM_MAINTENANCE, SYSTEM_UPDATE, SYSTEM_ERROR
- **User**: USER_WELCOME, USER_VERIFICATION, USER_PASSWORD_RESET
- **Driver**: DRIVER_ASSIGNMENT, DRIVER_TRIP_START, DRIVER_ALERT, DRIVER_DOCUMENT_EXPIRY, DRIVER_SAFETY_ALERT, DRIVER_FATIGUE_WARNING
- **Vehicle**: VEHICLE_MAINTENANCE_DUE, VEHICLE_INSPECTION_DUE, VEHICLE_BREAKDOWN
- **Cargo**: CARGO_PICKUP_REMINDER, CARGO_DELIVERY_UPDATE, CARGO_DELAY, CARGO_DAMAGE
- **Trip**: TRIP_CREATED, TRIP_STARTED, TRIP_COMPLETED, TRIP_CANCELLED, TRIP_DELAY
- **Financial**: PAYMENT_RECEIVED, PAYMENT_DUE, INVOICE_GENERATED
- **Compliance**: LICENSE_EXPIRY, CERTIFICATION_EXPIRY, VIOLATION_ALERT
- **Emergency**: EMERGENCY_ALERT, ACCIDENT_REPORT, WEATHER_WARNING

### Notification Categories:
- SYSTEM, USER, DRIVER, VEHICLE, CARGO, TRIP, FINANCIAL, COMPLIANCE, BUSINESS, EMERGENCY, SAFETY, PERFORMANCE, MAINTENANCE

### Priority Levels:
- **CRITICAL** - Immediate action required (red)
- **URGENT** - High priority (orange)
- **HIGH** - Important (yellow)
- **NORMAL** - Standard (blue)
- **LOW** - Informational (green)

### Delivery Channels:
- **IN_APP** - In-application notifications (bell icon)
- **EMAIL** - Email notifications
- **SMS** - Text messages
- **PUSH** - Mobile push notifications
- **WEBHOOK** - API webhooks
- **SLACK/TEAMS** - Team collaboration tools

---

## Notifications by Role

### 1. CARGO_OWNER (Cargo Shipper)

#### Receives Notifications For:

**Bidding & Matching:**
- ✅ **Bid Submitted** - When truck owner submits bid for their cargo
  - Type: `GENERAL`
  - Priority: `NORMAL`
  - Channels: `IN_APP`, `EMAIL`
  - Action: "Review Bids"

**Trip Lifecycle:**
- ✅ **Trip Started** - When delivery begins
  - Type: `TRIP_STARTED`
  - Priority: `HIGH`
  - Channels: `IN_APP`, `EMAIL`
  - Action: "Track Shipment"
  - Details: Origin, destination, estimated arrival, tracking URL

- ✅ **Trip Completed** - When delivery is finished
  - Type: `TRIP_COMPLETED`
  - Priority: `HIGH`
  - Channels: `IN_APP`, `EMAIL`
  - Action: "View Trip Summary"
  - Details: Distance, duration, completion time

**Delivery Updates:**
- ✅ **Driver Break Started** - When driver takes break during active delivery
  - Type: `CARGO_DELAY`
  - Priority: `NORMAL`
  - Channels: `IN_APP`, `EMAIL`
  - Details: Estimated delay (minutes), break type
  - Note: Only sent if driver is on active trip

- ✅ **Driver Break Ended** - When driver resumes delivery
  - Type: `CARGO_DELIVERY_UPDATE`
  - Priority: `LOW`
  - Channels: `IN_APP`
  - Details: Break duration, shipment back on track

**Incidents:**
- ✅ **Incident During Delivery** - When incident occurs during their shipment
  - Type: `ALERT`
  - Category: `SAFETY`
  - Priority: `HIGH`
  - Channels: `IN_APP`, `EMAIL`
  - Action: "View Shipment"
  - Details: Incident type, severity, shipment details

**Payment:**
- ✅ **Payment Required** - When cargo is loaded and payment is due
  - Type: `PAYMENT_DUE`
  - Priority: `HIGH`
  - Channels: `IN_APP`, `EMAIL`

---

### 2. TRUCK_OWNER (Fleet Owner)

#### Receives Notifications For:

**New Opportunities:**
- ✅ **New Cargo Available** - When cargo owner posts new cargo
  - Type: `CARGO_PICKUP_REMINDER`
  - Priority: `HIGH`
  - Channels: `IN_APP`, `EMAIL`
  - Action: "View Cargo & Bid"
  - Details: Route, weight, pickup date
  - Sent to: ALL active truck owners in tenant

**Bidding:**
- ✅ **Bid Accepted** - When cargo owner accepts their bid
  - Type: `GENERAL`
  - Priority: `HIGH`
  - Channels: `IN_APP`, `EMAIL`
  - Action: "View Cargo Details"
  - Details: Bid amount, route, cargo title

**Trip Monitoring:**
- ✅ **Trip Started** - When their driver starts delivery
  - Type: `TRIP_STARTED`
  - Priority: `NORMAL`
  - Channels: `IN_APP`, `EMAIL`
  - Action: "View Trip"
  - Purpose: Monitor driver progress

- ✅ **Trip Completed** - When delivery is finished
  - Type: `TRIP_COMPLETED`
  - Priority: `NORMAL`
  - Channels: `IN_APP`, `EMAIL`
  - Action: "View Trip"

**Driver Management:**
- ✅ **Driver Break Started** - When any of their drivers starts break
  - Type: `DRIVER_ALERT`
  - Category: `DRIVER`
  - Priority: `NORMAL`
  - Channels: `IN_APP`
  - Details: Driver name, break type, estimated duration, current load
  - Note: ALWAYS sent, regardless of active trip

- ✅ **Driver Break Ended** - When driver completes break
  - Type: `DRIVER_ALERT`
  - Priority: `LOW`
  - Channels: `IN_APP`
  - Details: Break duration, driver now available

**Safety & Incidents:**
- ✅ **Incident Reported** - When driver reports incident
  - Type: `ALERT`
  - Category: `SAFETY`
  - Priority: `HIGH`
  - Channels: `IN_APP`, `PUSH`
  - Action: "View Incident"
  - Details: Incident type, severity, location, driver name
  - Note: ALWAYS sent to truck owner (employer)

**Vehicle Maintenance:**
- ✅ **Vehicle Maintenance Due**
- ✅ **Vehicle Inspection Due**
- ✅ **Vehicle Breakdown**

---

### 3. DRIVER

#### Receives Notifications For:

**Assignments:**
- ✅ **Driver Assignment** - When assigned to a truck
  - Type: `DRIVER_ASSIGNMENT`
  - Priority: `HIGH`
  - Channels: `IN_APP`, `EMAIL`
  - Action: "View Truck Details"
  - Details: Truck plate, model, cargo info

- ✅ **New Delivery Assignment** - When bid is accepted and driver is assigned
  - Type: `DRIVER_TRIP_START`
  - Priority: `HIGH`
  - Channels: `IN_APP`, `EMAIL`
  - Action: "View Delivery Details"
  - Details: Cargo title, route

**Trip Updates:**
- ✅ **Trip Started** - Confirmation when trip begins
- ✅ **Trip Completed** - Confirmation when trip ends

**Safety & Compliance:**
- ✅ **Document Expiry Warnings**
  - License expiry
  - Medical certificate expiry
  - Training certification expiry

- ✅ **Fatigue Warnings** - When driving hours exceed limits
- ✅ **Safety Alerts** - Critical safety notifications

---

### 4. BROKER

#### Receives Notifications For:
- Commission updates
- Deal completions
- Client activity
- Payment notifications

---

### 5. FLEET_MANAGER / FLEET_DISPATCHER

#### Receives Notifications For:
- All driver activities
- Fleet performance metrics
- Vehicle status updates
- Safety incidents
- Compliance issues
- Driver assignments

---

### 6. FLEET_SAFETY_OFFICER

#### Receives Notifications For:
- All safety incidents
- Compliance violations
- Driver safety scores
- Vehicle inspection results
- Accident reports

---

## Notification Flow Architecture

### Event-Driven System:
```
Action Occurs → Event Emitted → Listener Catches Event → Notification Service → Database + Channels
```

### Example Flow (Driver Break):
1. Driver clicks "Start Break" in UI
2. Frontend calls `POST /api/drivers/:id/break/start`
3. Backend `driver.service.ts` emits `driver.break.started` event
4. `DriverBreakNotificationListener` catches event
5. Listener queries database for:
   - Driver details (employer/truck owner)
   - Active trip details (cargo owner)
6. Listener creates notifications via `NotificationService`:
   - Notification for truck owner (always)
   - Notification for cargo owner (if on active trip)
7. Notifications saved to database
8. WebSocket broadcasts to connected clients
9. Email/SMS sent via respective channels
10. Frontend receives notification via:
    - WebSocket (real-time)
    - API polling (every 30s)
    - Unread count API (every 10s)

---

## Frontend Implementation

### Notification Hook (`useNotifications.tsx`):
- Fetches notifications from `/api/notifications`
- Fetches unread count from `/api/notifications/my/unread-count`
- Connects to WebSocket for real-time updates
- Auto-refreshes every 30s (notifications) and 10s (count)
- Works for ALL roles (not just CARGO_OWNER)

### Notification Dropdown Component:
- Bell icon with unread badge
- Sidebar drawer with tabs (All / Unread)
- Color-coded notification types
- Click to mark as read
- Action buttons for quick access
- "Mark all as read" functionality

### Role-Specific Dashboards:
- **Cargo Owner**: `/cargo-owner/dashboard` - Uses `useNotifications` hook
- **Truck Owner**: `/dashboard/fleet` - Uses `useNotifications` hook
- **Driver**: `/dashboard/driver` - Can use same hook

---

## Database Schema

### Notification Table Fields:
- `id` - UUID
- `tenantId` - Organization ID
- `recipientId` - User who receives notification
- `entityType` - Related entity (DRIVER, CARGO, TRIP, etc.)
- `entityId` - Related entity ID
- `notificationType` - Specific type
- `category` - Grouping category
- `priority` - Urgency level
- `status` - PENDING, SENT, DELIVERED, READ, FAILED
- `title` - Notification title
- `message` - Full message
- `shortMessage` - Brief summary
- `channels` - Array of delivery channels
- `metadata` - Additional data (JSON)
- `actionUrl` - Link for action button
- `actionText` - Button text
- `isRead` - Boolean flag
- `createdAt` - Timestamp

### Indexes for Performance:
- `[tenantId, recipientId, isRead]`
- `[notificationType, priority, createdAt]`
- `[recipientId, status]`
- `[entityType, entityId]`

---

## Key Features

### 1. Multi-Channel Delivery:
- In-app notifications (primary)
- Email (important updates)
- SMS (critical alerts)
- Push notifications (mobile)
- Webhooks (integrations)

### 2. Priority-Based Routing:
- CRITICAL/URGENT bypass rate limits
- Safety notifications always delivered
- Quiet hours respected (except emergencies)

### 3. Real-Time Updates:
- WebSocket for instant delivery
- Polling fallback for reliability
- Optimistic UI updates

### 4. User Preferences:
- Enable/disable channels
- Quiet hours configuration
- Notification frequency settings

### 5. Analytics:
- Open count
- Click count
- Delivery attempts
- Device/location info

---

## Current Implementation Status

### ✅ Implemented:
- Cargo lifecycle notifications (created, bid, trip start/end)
- Driver break notifications (start/end)
- Incident notifications (to truck owner and cargo owner)
- Trip status updates
- Real-time WebSocket delivery
- Multi-channel support
- Frontend notification dropdown
- Role-based notification filtering

### 🚧 Partially Implemented:
- Email delivery (infrastructure ready, templates needed)
- SMS delivery (infrastructure ready, provider needed)
- Push notifications (infrastructure ready, FCM setup needed)

### ❌ Not Yet Implemented:
- Vehicle maintenance notifications
- Document expiry notifications
- Compliance violation notifications
- Payment reminder notifications
- Weather/road closure alerts
- Quiet hours enforcement
- Notification preferences UI

---

## API Endpoints

### Get Notifications:
```
GET /api/notifications?limit=50
Response: { notifications: [...], total: number }
```

### Get Unread Count:
```
GET /api/notifications/my/unread-count
Response: { count: number }
```

### Mark as Read:
```
PATCH /api/notifications/:id/read
Response: { success: boolean }
```

### Mark All as Read:
```
PATCH /api/notifications/mark-all-read
Response: { success: boolean }
```

---

## Testing Notifications

### For Truck Owner:
1. Login as truck owner
2. Open browser console
3. Look for logs with `🔔 [NOTIFICATIONS]` prefix
4. Have a driver start/end break
5. Have a driver report incident
6. Check notification dropdown

### For Cargo Owner:
1. Login as cargo owner
2. Create new cargo
3. Wait for truck owner to bid
4. Accept bid
5. Track trip start/completion
6. Monitor driver breaks during delivery

### For Driver:
1. Login as driver
2. Get assigned to truck
3. Start trip
4. Report incident
5. Take break
6. Complete trip

---

## Troubleshooting

### Notifications Not Appearing:
1. Check user role matches expected recipient
2. Verify `recipientId` in database matches user ID
3. Check WebSocket connection status
4. Verify API returns notifications
5. Check browser console for errors
6. Ensure notification status is not FAILED

### Unread Count Mismatch:
1. Check `isRead` flag in database
2. Verify `status` field (should be SENT or DELIVERED)
3. Check if notifications are soft-deleted
4. Verify tenant ID matches

### WebSocket Not Connecting:
1. Check WebSocket URL in environment
2. Verify authentication token
3. Check CORS settings
4. Verify user joined correct room

---

## Best Practices

### When Creating Notifications:
1. Always set appropriate priority
2. Include actionable links when possible
3. Keep messages concise but informative
4. Use shortMessage for mobile/compact views
5. Add relevant metadata for context
6. Choose appropriate channels
7. Set expiry for time-sensitive notifications

### For Developers:
1. Use event emitters for decoupling
2. Handle errors gracefully in listeners
3. Log notification creation for debugging
4. Test with different user roles
5. Consider rate limiting for high-volume events
6. Use transactions for critical notifications
7. Implement retry logic for failed deliveries

---

## Future Enhancements

1. **Smart Notifications**: ML-based relevance scoring
2. **Notification Grouping**: Combine similar notifications
3. **Digest Mode**: Daily/weekly summaries
4. **Rich Media**: Images, videos in notifications
5. **Interactive Actions**: Reply, approve, reject from notification
6. **Notification Templates**: Customizable per tenant
7. **A/B Testing**: Optimize notification content
8. **Delivery Optimization**: Best time to send
9. **Multi-Language**: Localized notifications
10. **Voice Notifications**: Text-to-speech for drivers

---

## Summary

The notification system is comprehensive and role-aware, ensuring each user receives relevant updates based on their involvement in the logistics workflow. The system is:

- **Event-driven**: Decoupled and scalable
- **Multi-channel**: Flexible delivery options
- **Real-time**: WebSocket + polling
- **Priority-aware**: Critical alerts bypass limits
- **Role-based**: Targeted notifications
- **Actionable**: Direct links to relevant pages
- **Extensible**: Easy to add new notification types

Both truck owners and cargo owners now receive appropriate notifications for incidents and driver breaks, ensuring all stakeholders stay informed about critical events affecting their operations.
