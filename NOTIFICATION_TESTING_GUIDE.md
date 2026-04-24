# Notification System Testing Guide

## Quick Start Testing

This guide provides step-by-step instructions for testing all notification types in the system.

---

## Prerequisites

1. **Backend Running**: `cd backend && npm run start:dev`
2. **Frontend Running**: `cd frontend && npm run dev`
3. **Database Running**: PostgreSQL with all migrations applied
4. **Test Users**: At least 3 users with different roles:
   - Cargo Owner
   - Truck Owner
   - Driver

---

## Test Scenarios

### 1. Smart Match Notification

**Objective**: Test that truck owners receive notifications when cargo owners select their trucks

**Steps**:
1. Login as **Cargo Owner**
2. Navigate to **Dashboard → Cargo → Create Load**
3. Create a new load with valid details
4. Click **"Find Matches"** button
5. Review the matching results
6. Click **"Request Match"** on any truck
7. Open a new browser tab/window
8. Login as the **Truck Owner** of the selected truck
9. Check the **Notification Bell** icon (top right)

**Expected Results**:
- ✅ Truck owner sees notification: "New Truck Request"
- ✅ Notification appears in real-time (no page refresh needed)
- ✅ Unread count badge shows "1"
- ✅ Clicking notification navigates to `/dashboard/fleet?tab=matches`
- ✅ Notification shows cargo owner's name and truck plate number

**Backend Logs to Check**:
```
📧 Emitted smart.match.selected event for match {matchId}
✅ Match saved successfully: {matchId}
```

---

### 2. Payment Notification

**Objective**: Test that truck owners receive notifications when payments are received

**Steps**:
1. Login as **Cargo Owner**
2. Navigate to **Dashboard → Payments**
3. Find a pending payment for a trip
4. Click **"Make Payment"**
5. Complete the payment process
6. Wait for payment to be processed (status: COMPLETED)
7. Open a new browser tab/window
8. Login as the **Truck Owner** for that trip
9. Check the **Notification Bell** icon

**Expected Results**:
- ✅ Truck owner sees notification: "Payment Received"
- ✅ Notification shows payment amount
- ✅ Notification shows payment source (Wallet or Loan)
- ✅ Notification appears in real-time
- ✅ Unread count badge updates
- ✅ Clicking notification navigates to payment details

**Backend Logs to Check**:
```
Emitted payment events for payment {paymentId}
Payment processed successfully
```

---

### 3. Trip Started Notification

**Objective**: Test that all parties receive notifications when a trip starts

**Steps**:
1. Login as **Driver** (or user with driver role)
2. Navigate to **Dashboard → My Trips**
3. Find a trip with status "PLANNED"
4. Click **"Start Trip"** button
5. Confirm the action
6. Open new browser tabs for:
   - Cargo Owner
   - Truck Owner
7. Check **Notification Bell** on both accounts

**Expected Results**:
- ✅ Cargo owner sees: "Trip Started"
- ✅ Truck owner sees: "Trip Started"
- ✅ Driver sees confirmation
- ✅ All notifications appear in real-time
- ✅ Notifications show trip number and cargo title
- ✅ Clicking notification navigates to trip details

**Backend Logs to Check**:
```
Emitted trip.started event for trip {tripId}
[TripsService] Credit deduction successful for trip {tripId}
```

---

### 4. Trip Completed Notification

**Objective**: Test that all parties receive notifications when a trip is completed

**Steps**:
1. Login as **Driver**
2. Navigate to **Dashboard → My Trips**
3. Find a trip with status "IN_PROGRESS"
4. Click **"Complete Trip"** button
5. Confirm the action
6. Open new browser tabs for:
   - Cargo Owner
   - Truck Owner
7. Check **Notification Bell** on both accounts

**Expected Results**:
- ✅ Cargo owner sees: "Shipment Delivered"
- ✅ Truck owner sees: "Trip Completed"
- ✅ Driver sees confirmation
- ✅ All notifications appear in real-time
- ✅ Notifications show delivery location
- ✅ Clicking notification navigates to trip details

**Backend Logs to Check**:
```
Emitted trip.completed event for trip {tripId}
Sent completion notifications for trip {tripId} to {count} recipients
```

---

### 5. Auction Bid Notification

**Objective**: Test that cargo owners receive notifications when bids are placed

**Steps**:
1. Login as **Cargo Owner**
2. Navigate to **Dashboard → Auctions**
3. Create a new auction
4. Note the auction ID
5. Open a new browser tab
6. Login as **Truck Owner**
7. Navigate to **Dashboard → Auctions**
8. Find the auction and place a bid
9. Switch back to **Cargo Owner** tab
10. Check **Notification Bell**

**Expected Results**:
- ✅ Cargo owner sees: "New Bid Received"
- ✅ Notification shows bidder name and amount
- ✅ Notification appears in real-time
- ✅ Unread count badge updates
- ✅ Clicking notification navigates to auction details

**Backend Logs to Check**:
```
Emitted auction.bid.received event
Bid created successfully
```

---

### 6. Auction Winner Notification

**Objective**: Test that winners receive notifications when selected

**Steps**:
1. Login as **Cargo Owner**
2. Navigate to **Dashboard → Auctions**
3. Find an auction with bids
4. Click **"Select Winner"** on a bid
5. Confirm the selection
6. Open a new browser tab
7. Login as the **Winning Truck Owner**
8. Check **Notification Bell**

**Expected Results**:
- ✅ Winner sees: "Congratulations! You Won"
- ✅ Notification shows auction details
- ✅ Notification shows winning bid amount
- ✅ Notification appears in real-time
- ✅ Clicking notification navigates to auction details

**Backend Logs to Check**:
```
Emitted auction.winner.selected event
Winner selected successfully
```

---

## Testing WebSocket Connection

### Browser Console Test

1. Open browser console (F12)
2. Navigate to any dashboard page
3. Check for WebSocket connection logs:

```javascript
// Should see:
Socket connected: true
Socket ID: {socketId}
Joined room: user:{userId}
```

### Manual WebSocket Test

```javascript
// In browser console
socket.on('notification', (notification) => {
  console.log('Received notification:', notification);
});

// Trigger a notification action
// Check console for received notification
```

---

## Testing Notification Features

### 1. Mark as Read

**Steps**:
1. Have at least one unread notification
2. Click on the notification
3. Verify notification is marked as read
4. Verify unread count decreases

**Expected**:
- ✅ Notification background changes (lighter color)
- ✅ Unread badge count decreases
- ✅ Database updated (isRead = true)

### 2. Notification History

**Steps**:
1. Click **Notification Bell** icon
2. Scroll through notification list
3. Verify all notifications are displayed
4. Check pagination (if many notifications)

**Expected**:
- ✅ All notifications visible
- ✅ Sorted by date (newest first)
- ✅ Read/unread status visible
- ✅ Pagination works correctly

### 3. Notification Actions

**Steps**:
1. Click on a notification with an action
2. Verify navigation to correct page
3. Verify relevant data is displayed

**Expected**:
- ✅ Navigates to correct URL
- ✅ Relevant entity is highlighted/selected
- ✅ User can take action from that page

---

## Performance Testing

### Load Test

**Objective**: Test system with multiple simultaneous notifications

**Steps**:
1. Create 10+ test users
2. Trigger multiple notifications simultaneously:
   - Multiple bids on same auction
   - Multiple match requests
   - Multiple payments
3. Monitor:
   - Backend response time
   - WebSocket delivery time
   - Frontend rendering time

**Expected**:
- ✅ All notifications delivered within 2 seconds
- ✅ No duplicate notifications
- ✅ No missed notifications
- ✅ UI remains responsive

### Stress Test

**Objective**: Test system under heavy load

**Steps**:
1. Generate 100+ notifications for a single user
2. Check notification list performance
3. Test pagination
4. Test mark all as read

**Expected**:
- ✅ List loads within 3 seconds
- ✅ Pagination works smoothly
- ✅ Mark all as read completes within 5 seconds
- ✅ No memory leaks

---

## Troubleshooting

### Notifications Not Appearing

**Check**:
1. WebSocket connection status (browser console)
2. Backend logs for event emission
3. Database for notification records
4. User is in correct room (`user:{userId}`)

**Common Fixes**:
- Refresh page to reconnect WebSocket
- Check user authentication
- Verify event listener is registered
- Check notification service is running

### Duplicate Notifications

**Check**:
1. Event emission code (should emit once)
2. Listener registration (should register once)
3. WebSocket reconnection logic

**Common Fixes**:
- Add idempotency checks
- Verify event emission is not in a loop
- Check WebSocket reconnection settings

### Performance Issues

**Check**:
1. Number of active WebSocket connections
2. Database query performance
3. Event emission frequency

**Common Fixes**:
- Implement connection pooling
- Add database indexes
- Batch notification creation
- Implement rate limiting

---

## Test Data Setup

### Create Test Users

```sql
-- Cargo Owner
INSERT INTO users (email, role, tenant_id) 
VALUES ('cargo@test.com', 'CARGO_OWNER', 'tenant-1');

-- Truck Owner
INSERT INTO users (email, role, tenant_id) 
VALUES ('truck@test.com', 'TRUCK_OWNER', 'tenant-1');

-- Driver
INSERT INTO users (email, role, tenant_id) 
VALUES ('driver@test.com', 'DRIVER', 'tenant-1');
```

### Create Test Load

```sql
INSERT INTO loads (
  title, cargo_type, weight, pickup_date, delivery_date,
  cargo_owner_id, tenant_id, status
) VALUES (
  'Test Cargo', 'GENERAL', 1000, NOW(), NOW() + INTERVAL '7 days',
  'cargo-owner-id', 'tenant-1', 'CREATED'
);
```

---

## Success Criteria

### All Tests Pass When:
- ✅ All notification types appear correctly
- ✅ Real-time delivery works (< 2 seconds)
- ✅ Unread count updates correctly
- ✅ Mark as read works
- ✅ Notification history is maintained
- ✅ Navigation from notifications works
- ✅ No duplicate notifications
- ✅ No missed notifications
- ✅ Performance is acceptable (< 3 seconds load time)
- ✅ No errors in backend logs
- ✅ No errors in browser console

---

## Automated Testing (Future)

### Unit Tests
```typescript
describe('NotificationService', () => {
  it('should create notification', async () => {
    const notification = await service.createNotification({...});
    expect(notification).toBeDefined();
    expect(notification.recipientId).toBe(userId);
  });
});
```

### Integration Tests
```typescript
describe('Event Emissions', () => {
  it('should emit smart.match.selected event', async () => {
    const spy = jest.spyOn(eventEmitter, 'emit');
    await matchingService.requestMatch(...);
    expect(spy).toHaveBeenCalledWith('smart.match.selected', {...});
  });
});
```

### E2E Tests
```typescript
describe('Notification Flow', () => {
  it('should deliver notification in real-time', async () => {
    // Create match request
    // Wait for WebSocket message
    // Verify notification appears in UI
  });
});
```

---

**Testing Time Estimate**: 4-6 hours for complete manual testing

**Recommended**: Test each scenario at least twice to ensure consistency

**Priority**: HIGH - Complete before production deployment
