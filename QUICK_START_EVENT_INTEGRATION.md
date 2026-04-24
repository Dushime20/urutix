# Quick Start: Event Integration Guide

## 🎯 Goal
Integrate event emissions into existing services to trigger the notification system.

---

## 📦 Step 1: Install EventEmitter (if not already installed)

The `@nestjs/event-emitter` package should already be installed. Verify:

```bash
cd backend
npm list @nestjs/event-emitter
```

If not installed:
```bash
npm install @nestjs/event-emitter
```

---

## 🔧 Step 2: Add EventEmitter to Services

### A. Bidding Service

**File**: `backend/src/modules/bidding/bidding.service.ts`

```typescript
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class BiddingService {
  constructor(
    // ... existing dependencies
    private readonly eventEmitter: EventEmitter2,
  ) {}

  // Find the method where bids are placed
  async placeBid(bidderId: string, auctionId: string, amount: number, tenantId: string) {
    // ... existing bid logic ...
    
    // After successful bid creation, emit event
    try {
      const auction = await this.getAuction(auctionId);
      const bidder = await this.getBidder(bidderId);
      
      this.eventEmitter.emit('auction.bid.received', {
        auctionId,
        bidderId,
        bidderName: bidder.name || bidder.email,
        amount,
        cargoOwnerId: auction.cargoOwnerId,
        tenantId,
        cargoTitle: auction.title || auction.cargoType,
      });
    } catch (error) {
      console.error('Failed to emit auction.bid.received event:', error);
    }
    
    return savedBid;
  }

  // Find the method where winner is selected
  async selectWinner(auctionId: string, winnerId: string) {
    // ... existing winner selection logic ...
    
    // After successful winner selection, emit event
    try {
      const auction = await this.getAuction(auctionId);
      const winner = await this.getUser(winnerId);
      const cargoOwner = await this.getUser(auction.cargoOwnerId);
      const winningBid = await this.getWinningBid(auctionId, winnerId);
      
      this.eventEmitter.emit('auction.winner.selected', {
        auctionId,
        winnerId,
        winnerName: winner.name || winner.email,
        cargoOwnerId: auction.cargoOwnerId,
        cargoOwnerName: cargoOwner.name || cargoOwner.email,
        tenantId: auction.tenantId,
        winningBid: winningBid.amount,
        cargoTitle: auction.title || auction.cargoType,
      });
    } catch (error) {
      console.error('Failed to emit auction.winner.selected event:', error);
    }
    
    return result;
  }
}
```

---

### B. Trips Service

**File**: `backend/src/modules/trips/trips.service.ts`

```typescript
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class TripsService {
  constructor(
    // ... existing dependencies
    private readonly eventEmitter: EventEmitter2,
  ) {}

  // When driver is assigned
  async assignDriver(tripId: string, driverId: string) {
    // ... existing assignment logic ...
    
    try {
      const trip = await this.getTrip(tripId);
      const driver = await this.getDriver(driverId);
      
      this.eventEmitter.emit('trip.driver.assigned', {
        tripId,
        driverId,
        driverName: driver.name || driver.email,
        cargoOwnerId: trip.cargoOwnerId,
        truckOwnerId: trip.truckOwnerId,
        tenantId: trip.tenantId,
        cargoTitle: trip.cargoTitle,
        pickupLocation: trip.pickupLocation,
        deliveryLocation: trip.deliveryLocation,
      });
    } catch (error) {
      console.error('Failed to emit trip.driver.assigned event:', error);
    }
    
    return result;
  }

  // When trip starts
  async startTrip(tripId: string) {
    // ... existing start logic ...
    
    try {
      const trip = await this.getTrip(tripId);
      const driver = await this.getDriver(trip.driverId);
      
      this.eventEmitter.emit('trip.started', {
        tripId,
        driverId: trip.driverId,
        driverName: driver.name || driver.email,
        cargoOwnerId: trip.cargoOwnerId,
        truckOwnerId: trip.truckOwnerId,
        tenantId: trip.tenantId,
        cargoTitle: trip.cargoTitle,
        startLocation: trip.currentLocation,
        estimatedArrival: trip.estimatedArrival,
      });
    } catch (error) {
      console.error('Failed to emit trip.started event:', error);
    }
    
    return result;
  }

  // When trip completes
  async completeTrip(tripId: string) {
    // ... existing completion logic ...
    
    try {
      const trip = await this.getTrip(tripId);
      const driver = await this.getDriver(trip.driverId);
      
      this.eventEmitter.emit('trip.completed', {
        tripId,
        driverId: trip.driverId,
        driverName: driver.name || driver.email,
        cargoOwnerId: trip.cargoOwnerId,
        truckOwnerId: trip.truckOwnerId,
        tenantId: trip.tenantId,
        cargoTitle: trip.cargoTitle,
        deliveryLocation: trip.deliveryLocation,
        completedAt: new Date(),
      });
    } catch (error) {
      console.error('Failed to emit trip.completed event:', error);
    }
    
    return result;
  }
}
```

---

### C. Payments Service

**File**: `backend/src/modules/payments/payments.service.ts`

```typescript
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class PaymentsService {
  constructor(
    // ... existing dependencies
    private readonly eventEmitter: EventEmitter2,
  ) {}

  // When payment is processed
  async processPayment(paymentData: any) {
    // ... existing payment logic ...
    
    try {
      const recipient = await this.getUser(payment.recipientId);
      const sender = await this.getUser(payment.senderId);
      
      // General payment received event
      this.eventEmitter.emit('payment.received', {
        paymentId: payment.id,
        recipientId: payment.recipientId,
        recipientName: recipient.name || recipient.email,
        senderId: payment.senderId,
        senderName: sender.name || sender.email,
        amount: payment.amount,
        tenantId: payment.tenantId,
        paymentSource: payment.source || 'WALLET', // 'WALLET' | 'LOAN' | 'BANK_TRANSFER'
        tripId: payment.tripId,
        cargoTitle: payment.cargoTitle,
      });
      
      // If recipient is truck owner, emit specific event
      if (recipient.role === 'TRUCK_OWNER' || recipient.role === 'FLEET_OWNER') {
        this.eventEmitter.emit('payment.truck.owner.received', {
          paymentId: payment.id,
          recipientId: payment.recipientId,
          recipientName: recipient.name || recipient.email,
          senderId: payment.senderId,
          senderName: sender.name || sender.email,
          amount: payment.amount,
          tenantId: payment.tenantId,
          paymentSource: payment.source || 'WALLET',
          tripId: payment.tripId,
          cargoTitle: payment.cargoTitle,
        });
      }
    } catch (error) {
      console.error('Failed to emit payment events:', error);
    }
    
    return payment;
  }
}
```

---

## 🧪 Step 3: Test the Integration

### Test Auction Notifications

1. **Place a bid on an auction**
   ```bash
   # Use Postman or frontend to place a bid
   POST /api/bidding/auctions/:auctionId/bids
   ```

2. **Check notification appears**
   - Open frontend as cargo owner
   - Check NotificationBell component
   - Should see "New Bid Received" notification

3. **Select auction winner**
   ```bash
   # Select winner
   POST /api/bidding/auctions/:auctionId/select-winner
   ```

4. **Check notifications**
   - Winner should see "Congratulations! You Won"
   - Cargo owner should see "Auction Winner Selected"

### Test Trip Notifications

1. **Assign driver to trip**
   ```bash
   POST /api/trips/:tripId/assign-driver
   ```

2. **Check notifications**
   - Driver should see "New Trip Assignment"
   - Cargo owner should see "Driver Assigned"

3. **Start trip**
   ```bash
   POST /api/trips/:tripId/start
   ```

4. **Check notifications**
   - Cargo owner should see "Trip Started"
   - Truck owner should see "Trip Started"

5. **Complete trip**
   ```bash
   POST /api/trips/:tripId/complete
   ```

6. **Check notifications**
   - All parties should see "Delivery Completed"

### Test Payment Notifications

1. **Process payment**
   ```bash
   POST /api/payments/process
   ```

2. **Check notification**
   - Recipient should see "Payment Received"
   - If truck owner, should see specific truck owner notification

---

## 🐛 Troubleshooting

### Notifications not appearing?

1. **Check WebSocket connection**
   ```javascript
   // In browser console
   console.log('Socket connected:', socket.connected);
   ```

2. **Check backend logs**
   ```bash
   # Look for event emission logs
   grep "Handling.*event" backend/logs/*.log
   ```

3. **Verify event listener is registered**
   ```bash
   # Check notifications module
   cat backend/src/modules/notifications/notifications.module.ts
   ```

4. **Check database**
   ```sql
   -- Verify notifications are being created
   SELECT * FROM notifications ORDER BY created_at DESC LIMIT 10;
   ```

### Events not being emitted?

1. **Verify EventEmitter2 is injected**
   - Check constructor has `private readonly eventEmitter: EventEmitter2`

2. **Check for errors in try-catch blocks**
   - Look for console.error logs

3. **Verify event name matches listener**
   - Event: `auction.bid.received`
   - Listener: `@OnEvent('auction.bid.received')`

---

## ✅ Verification Checklist

After integration, verify:

- [ ] Auction bid notification appears for cargo owner
- [ ] Auction winner notification appears for winner
- [ ] Smart match notification appears for truck owner
- [ ] Driver assignment notification appears for driver
- [ ] Trip started notification appears for cargo owner
- [ ] Trip completed notification appears for all parties
- [ ] Payment received notification appears for recipient
- [ ] Notifications appear in real-time (no page refresh needed)
- [ ] Unread count badge updates correctly
- [ ] Clicking notification navigates to correct page
- [ ] Mark as read functionality works
- [ ] Notification history is preserved

---

## 📚 Reference

### Event Names
- `auction.bid.received`
- `auction.winner.selected`
- `smart.match.selected`
- `trip.truck.owner.accepted`
- `trip.driver.assigned`
- `trip.approved`
- `trip.started`
- `trip.completed`
- `payment.received`
- `payment.truck.owner.received`
- `payment.reminder`
- `payment.due.soon`

### Payload Interfaces
See `backend/src/modules/notifications/listeners/*.ts` for complete payload definitions.

---

## 🎉 Success Criteria

You'll know the integration is successful when:

1. ✅ Notifications appear in real-time without page refresh
2. ✅ Unread badge shows correct count
3. ✅ All user roles receive appropriate notifications
4. ✅ Clicking notifications navigates to relevant pages
5. ✅ Notification history is maintained
6. ✅ No errors in backend logs

---

**Estimated Time**: 2-3 days for full integration and testing
**Difficulty**: Medium
**Priority**: HIGH

Good luck! 🚀
