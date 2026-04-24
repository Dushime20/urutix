# Notification Module - Implementation TODO

## Current Status
Backend services are excellent, but event triggers and frontend notification center are missing.

## What Needs to Be Implemented

### 1. Backend Event Listeners ⚠️

Need to implement listeners for the following events:

#### Auction/Bidding Events
- `bid.placed` - When a new bid is placed on cargo
- `bid.accepted` - When a bid is accepted
- `bid.rejected` - When a bid is rejected
- `bid.outbid` - When someone outbids you
- `auction.ending_soon` - 1 hour before auction ends
- `auction.ended` - When auction closes

#### Driver Assignment Events
- `driver.assigned` - When driver is assigned to a trip
- `driver.unassigned` - When driver is removed from a trip
- `driver.accepted` - When driver accepts assignment
- `driver.rejected` - When driver rejects assignment

#### Trip Events
- `trip.created` - New trip created
- `trip.started` - Trip has begun
- `trip.in_progress` - Trip status updates
- `trip.delayed` - Trip is delayed
- `trip.completed` - Trip finished
- `trip.cancelled` - Trip cancelled

#### Delivery Events
- `delivery.scheduled` - Delivery scheduled
- `delivery.in_transit` - Cargo in transit
- `delivery.arrived` - Arrived at destination
- `delivery.completed` - Delivery confirmed
- `delivery.failed` - Delivery failed

#### Loan/Financial Events
- `loan.requested` - New loan request
- `loan.approved` - Loan approved
- `loan.rejected` - Loan rejected
- `loan.disbursed` - Funds disbursed
- `loan.repayment_due` - Payment due soon
- `loan.repaid` - Loan repaid
- `loan.overdue` - Payment overdue

### 2. Frontend Notification Center 🎯

#### Required Components

**NotificationCenter Component**
```typescript
Location: frontend/src/components/notifications/NotificationCenter.tsx

Features:
- Bell icon with unread count badge
- Dropdown panel with notification list
- Mark as read/unread
- Mark all as read
- Delete notifications
- Filter by type (all, unread, read)
- Real-time updates via WebSocket
- Pagination for old notifications
```

**NotificationItem Component**
```typescript
Location: frontend/src/components/notifications/NotificationItem.tsx

Features:
- Icon based on notification type
- Title and message
- Timestamp (relative: "2 minutes ago")
- Read/unread indicator
- Click to navigate to related page
- Action buttons (Accept, Reject, View, etc.)
```

**NotificationList Component**
```typescript
Location: frontend/src/components/notifications/NotificationList.tsx

Features:
- Virtualized list for performance
- Group by date (Today, Yesterday, This Week, etc.)
- Empty state when no notifications
- Loading skeleton
- Pull to refresh (mobile)
```

### 3. WebSocket Integration 🔌

**Real-time Notification Delivery**
```typescript
Location: frontend/src/services/notificationWebSocket.ts

Features:
- Connect to WebSocket on login
- Listen for notification events
- Update notification count in real-time
- Show toast for important notifications
- Reconnect on disconnect
- Handle authentication
```

### 4. Notification API Service 📡

**API Methods Needed**
```typescript
Location: frontend/src/services/notificationApi.ts

Methods:
- getNotifications(page, limit, filter)
- getUnreadCount()
- markAsRead(notificationId)
- markAllAsRead()
- deleteNotification(notificationId)
- getNotificationPreferences()
- updateNotificationPreferences(preferences)
```

### 5. Notification Preferences 🔧

**User Settings for Notifications**
```typescript
Location: frontend/src/pages/NotificationSettings.tsx

Settings:
- Email notifications (on/off per event type)
- Push notifications (on/off per event type)
- In-app notifications (on/off per event type)
- SMS notifications (on/off per event type)
- Notification sound (on/off)
- Do not disturb hours
```

## Implementation Priority

### Phase 1: Core Functionality (High Priority)
1. ✅ Backend event listeners for loan events (already working)
2. 🔴 Backend event listeners for trip events
3. 🔴 Backend event listeners for delivery events
4. 🔴 Basic NotificationCenter component
5. 🔴 WebSocket integration
6. 🔴 Notification API service

### Phase 2: Enhanced Features (Medium Priority)
7. 🟡 Backend event listeners for bidding events
8. 🟡 Backend event listeners for driver assignment
9. 🟡 NotificationItem with actions
10. 🟡 Notification preferences page
11. 🟡 Toast notifications for important events

### Phase 3: Polish (Low Priority)
12. 🟢 Notification grouping
13. 🟢 Notification search
14. 🟢 Notification archive
15. 🟢 Email digest (daily/weekly summary)
16. 🟢 Push notifications (PWA)

## Backend Event Listener Example

```javascript
// backend/services/notificationService.js

const EventEmitter = require('events');
const notificationEmitter = new EventEmitter();

// Listen for trip events
notificationEmitter.on('trip.started', async (tripData) => {
  const { tripId, driverId, cargoOwnerId, truckOwnerId } = tripData;
  
  // Notify cargo owner
  await createNotification({
    userId: cargoOwnerId,
    type: 'trip_started',
    title: 'Trip Started',
    message: `Your cargo is now in transit (Trip #${tripId})`,
    data: { tripId },
    priority: 'medium'
  });
  
  // Notify truck owner
  await createNotification({
    userId: truckOwnerId,
    type: 'trip_started',
    title: 'Trip Started',
    message: `Driver has started the trip (Trip #${tripId})`,
    data: { tripId },
    priority: 'medium'
  });
});

// Emit event when trip starts
async function startTrip(tripId) {
  // ... trip start logic ...
  
  notificationEmitter.emit('trip.started', {
    tripId,
    driverId,
    cargoOwnerId,
    truckOwnerId
  });
}
```

## Frontend NotificationCenter Example

```typescript
// frontend/src/components/notifications/NotificationCenter.tsx

import React, { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { notificationApi } from '../../services/notificationApi';
import { useNotificationSocket } from '../../hooks/useNotificationSocket';

const NotificationCenter: React.FC = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  
  // WebSocket for real-time updates
  useNotificationSocket({
    onNotification: (notification) => {
      setNotifications(prev => [notification, ...prev]);
      setUnreadCount(prev => prev + 1);
      
      // Show toast for important notifications
      if (notification.priority === 'high') {
        toast.info(notification.message);
      }
    }
  });
  
  useEffect(() => {
    loadNotifications();
    loadUnreadCount();
  }, []);
  
  const loadNotifications = async () => {
    const data = await notificationApi.getNotifications(1, 20);
    setNotifications(data);
  };
  
  const loadUnreadCount = async () => {
    const count = await notificationApi.getUnreadCount();
    setUnreadCount(count);
  };
  
  const markAllAsRead = async () => {
    await notificationApi.markAllAsRead();
    setUnreadCount(0);
    setNotifications(prev => 
      prev.map(n => ({ ...n, read: true }))
    );
  };
  
  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 hover:bg-gray-100 rounded-full"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>
      
      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-xl border z-50">
          {/* Notification list */}
        </div>
      )}
    </div>
  );
};
```

## Database Schema (If Not Already Exists)

```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id),
  type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  data JSONB,
  priority VARCHAR(20) DEFAULT 'medium',
  read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP,
  CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);
```

## Testing Checklist

### Backend Tests
- [ ] Event listeners trigger correctly
- [ ] Notifications are created in database
- [ ] WebSocket broadcasts notifications
- [ ] Notification preferences are respected
- [ ] Expired notifications are cleaned up

### Frontend Tests
- [ ] Notification center opens/closes
- [ ] Unread count updates in real-time
- [ ] Mark as read works
- [ ] Mark all as read works
- [ ] Delete notification works
- [ ] Click notification navigates correctly
- [ ] WebSocket reconnects on disconnect
- [ ] Toast notifications appear for high priority

## Resources

- WebSocket library: `socket.io-client` (already installed)
- Notification context: `frontend/src/contexts/NotificationContext.tsx` (already exists)
- Backend notification service: `backend/services/notificationService.js` (needs enhancement)

## Next Steps

1. Review existing notification backend code
2. Implement missing event listeners
3. Create NotificationCenter component
4. Integrate WebSocket for real-time updates
5. Add notification preferences page
6. Test thoroughly across all user roles
