# Notification System Implementation Guide

## ✅ What Was Implemented

### 1. Event Listeners Created

Three new event listener files have been created to handle all required notifications:

1. **`backend/src/modules/notifications/listeners/auction-notification.listener.ts`**
   - Handles auction bid received notifications
   - Handles auction winner selected notifications
   - Handles smart match selected notifications

2. **`backend/src/modules/notifications/listeners/trip-notification.listener.ts`**
   - Handles truck owner accepted assignment notifications
   - Handles driver assignment notifications
   - Handles trip approved notifications
   - Handles trip started notifications
   - Handles trip completed/delivery completed notifications

3. **`backend/src/modules/notifications/listeners/payment-notification.listener.ts`**
   - Handles payment received notifications
   - Handles truck owner payment received notifications
   - Handles payment reminder notifications
   - Handles payment due soon notifications

### 2. Module Registration

Updated `backend/src/modules/notifications/notifications.module.ts` to:
- Import the three new listeners
- Register them as providers
- Import EventsModule for WebSocket support

---

## 🔧 How to Emit Events (Integration Steps)

To make these notifications work, you need to emit events from your existing services. Here's how:

### Step 1: Inject EventEmitter2 in Your Services

```typescript
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class YourService {
  constructor(
    private readonly eventEmitter: EventEmitter2,
    // ... other dependencies
  ) {}
}
```

### Step 2: Emit Events at the Right Time

#### A. Auction/Bidding Service

**File**: `backend/src/modules/bidding/bidding.service.ts`

```typescript
// When a new bid is placed
async placeBid(bidderId: string, auctionId: string, amount: number) {
  // ... your existing bid logic ...
  
  // Emit event for notification
  this.eventEmitter.emit('auction.bid.received', {
    auctionId,
    bidderId,
    bidderName: bidder.name, // Get from bidder object
    amount,
    cargoOwnerId: auction.cargoOwnerId,
    tenantId: auction.tenantId,
    cargoTitle: auction.cargoTitle,
  });
  
  return savedBid;
}

// When auction winner is selected
async selectWinner(auctionId: string, winnerId: string) {
  // ... your existing winner selection logic ...
  
  // Emit event for notification
  this.eventEmitter.emit('auction.winner.selected', {
    auctionId,
    winnerId,
    winnerName: winner.name,
    cargoOwnerId: auction.cargoOwnerId,
    cargoOwnerName: cargoOwner.name,
    tenantId: auction.tenantId,
    winningBid: winningBid.amount,
    cargoTitle: auction.cargoTitle,
  });
  
  return result;
}
```

#### B. Smart Matching Service

**File**: `backend/src/modules/matching/matching.service.ts`

```typescript
// When smart match is selected
async selectSmartMatch(matchId: string, truckOwnerId: string, cargoOwnerId: string) {
  // ... your existing matching logic ...
  
  // Emit event for notification
  this.eventEmitter.emit('smart.match.selected', {
    matchId,
    truckOwnerId,
    truckOwnerName: truckOwner.name,
    cargoOwnerId,
    cargoOwnerName: cargoOwner.name,
    tenantId: match.tenantId,
    cargoTitle: match.cargoTitle,
    estimatedPrice: match.estimatedPrice,
  });
  
  return result;
}
```

#### C. Trips Service

**File**: `backend/src/modules/trips/trips.service.ts`

```typescript
// When truck owner accepts assignment
async acceptAssignment(assignmentId: string, truckOwnerId: string) {
  // ... your existing acceptance logic ...
  
  // Emit event for notification
  this.eventEmitter.emit('trip.truck.owner.accepted', {
    assignmentId,
    tripId: assignment.tripId,
    truckOwnerId,
    truckOwnerName: truckOwner.name,
    cargoOwnerId: trip.cargoOwnerId,
    tenantId: trip.tenantId,
    cargoTitle: trip.cargoTitle,
  });
  
  return result;
}

// When driver is assigned to trip
async assignDriver(tripId: string, driverId: string) {
  // ... your existing driver assignment logic ...
  
  // Emit event for notification
  this.eventEmitter.emit('trip.driver.assigned', {
    tripId,
    driverId,
    driverName: driver.name,
    cargoOwnerId: trip.cargoOwnerId,
    truckOwnerId: trip.truckOwnerId,
    tenantId: trip.tenantId,
    cargoTitle: trip.cargoTitle,
    pickupLocation: trip.pickupLocation,
    deliveryLocation: trip.deliveryLocation,
  });
  
  return result;
}

// When trip is approved
async approveTrip(tripId: string) {
  // ... your existing approval logic ...
  
  // Emit event for notification
  this.eventEmitter.emit('trip.approved', {
    tripId,
    driverId: trip.driverId,
    driverName: driver.name,
    cargoOwnerId: trip.cargoOwnerId,
    truckOwnerId: trip.truckOwnerId,
    tenantId: trip.tenantId,
    cargoTitle: trip.cargoTitle,
    scheduledStartTime: trip.scheduledStartTime,
  });
  
  return result;
}

// When trip starts
async startTrip(tripId: string, driverId: string) {
  // ... your existing trip start logic ...
  
  // Emit event for notification
  this.eventEmitter.emit('trip.started', {
    tripId,
    driverId,
    driverName: driver.name,
    cargoOwnerId: trip.cargoOwnerId,
    truckOwnerId: trip.truckOwnerId,
    tenantId: trip.tenantId,
    cargoTitle: trip.cargoTitle,
    startLocation: trip.currentLocation,
    estimatedArrival: trip.estimatedArrival,
  });
  
  return result;
}

// When trip is completed
async completeTrip(tripId: string) {
  // ... your existing trip completion logic ...
  
  // Emit event for notification
  this.eventEmitter.emit('trip.completed', {
    tripId,
    driverId: trip.driverId,
    driverName: driver.name,
    cargoOwnerId: trip.cargoOwnerId,
    truckOwnerId: trip.truckOwnerId,
    tenantId: trip.tenantId,
    cargoTitle: trip.cargoTitle,
    deliveryLocation: trip.deliveryLocation,
    completedAt: new Date(),
  });
  
  return result;
}
```

#### D. Payments Service

**File**: `backend/src/modules/payments/payments.service.ts`

```typescript
// When payment is received
async processPayment(paymentData: any) {
  // ... your existing payment processing logic ...
  
  // Emit event for notification
  this.eventEmitter.emit('payment.received', {
    paymentId: payment.id,
    recipientId: payment.recipientId,
    recipientName: recipient.name,
    senderId: payment.senderId,
    senderName: sender.name,
    amount: payment.amount,
    tenantId: payment.tenantId,
    paymentSource: payment.source, // 'WALLET' | 'LOAN' | 'BANK_TRANSFER'
    tripId: payment.tripId,
    cargoTitle: payment.cargoTitle,
  });
  
  // If payment is to truck owner, emit specific event
  if (recipient.role === 'TRUCK_OWNER') {
    this.eventEmitter.emit('payment.truck.owner.received', {
      paymentId: payment.id,
      recipientId: payment.recipientId,
      recipientName: recipient.name,
      senderId: payment.senderId,
      senderName: sender.name,
      amount: payment.amount,
      tenantId: payment.tenantId,
      paymentSource: payment.source,
      tripId: payment.tripId,
      cargoTitle: payment.cargoTitle,
    });
  }
  
  return payment;
}

// Payment reminder (can be triggered by cron job)
async sendPaymentReminder(invoiceId: string) {
  // ... get invoice details ...
  
  const daysOverdue = this.calculateDaysOverdue(invoice.dueDate);
  
  // Emit event for notification
  this.eventEmitter.emit('payment.reminder', {
    invoiceId,
    cargoOwnerId: invoice.cargoOwnerId,
    amount: invoice.amount,
    dueDate: invoice.dueDate,
    tenantId: invoice.tenantId,
    tripId: invoice.tripId,
    cargoTitle: invoice.cargoTitle,
    daysOverdue,
  });
}

// Payment due soon (3 days before due date - cron job)
async sendPaymentDueSoonReminder(invoiceId: string) {
  // ... get invoice details ...
  
  // Emit event for notification
  this.eventEmitter.emit('payment.due.soon', {
    invoiceId,
    cargoOwnerId: invoice.cargoOwnerId,
    amount: invoice.amount,
    dueDate: invoice.dueDate,
    tenantId: invoice.tenantId,
    tripId: invoice.cargoTitle,
    cargoTitle: invoice.cargoTitle,
  });
}
```

---

## 📋 Checklist for Integration

### Backend Integration

- [ ] Add `EventEmitter2` to BiddingService constructor
- [ ] Emit `auction.bid.received` when bid is placed
- [ ] Emit `auction.winner.selected` when winner is chosen
- [ ] Add `EventEmitter2` to MatchingService constructor
- [ ] Emit `smart.match.selected` when match is confirmed
- [ ] Add `EventEmitter2` to TripsService constructor
- [ ] Emit `trip.truck.owner.accepted` when assignment accepted
- [ ] Emit `trip.driver.assigned` when driver is assigned
- [ ] Emit `trip.approved` when trip is approved
- [ ] Emit `trip.started` when trip starts
- [ ] Emit `trip.completed` when trip completes
- [ ] Add `EventEmitter2` to PaymentsService constructor
- [ ] Emit `payment.received` when payment is processed
- [ ] Emit `payment.truck.owner.received` for truck owner payments
- [ ] Emit `payment.reminder` for overdue payments
- [ ] Emit `payment.due.soon` for upcoming due dates
- [ ] Create cron job for payment reminders (optional)

### Testing

- [ ] Test auction bid notification
- [ ] Test auction winner notification
- [ ] Test smart match notification
- [ ] Test truck owner acceptance notification
- [ ] Test driver assignment notification
- [ ] Test trip approved notification
- [ ] Test trip started notification
- [ ] Test trip completed notification
- [ ] Test payment received notification
- [ ] Test payment reminder notification
- [ ] Verify WebSocket real-time delivery
- [ ] Verify notification appears in NotificationBell component
- [ ] Verify unread count updates correctly

---

## 🎯 Next Steps

After integrating the event emissions:

1. **Test the notification flow end-to-end**
2. **Implement the Loan UI components** (Phase 2)
3. **Add email/SMS delivery** (if needed)
4. **Create cron jobs for scheduled notifications** (payment reminders)

---

## 📝 Notes

- All notifications are automatically delivered via WebSocket to the frontend
- The NotificationBell component will show real-time updates
- Notifications are stored in the database for history
- Users can mark notifications as read/unread
- Priority levels affect the notification styling in the UI

---

## 🚀 Status

✅ **Phase 1 Complete**: All notification listeners created and registered
⏭️ **Next**: Integrate event emissions in existing services
⏭️ **Then**: Implement Loan UI components (Phase 2)

