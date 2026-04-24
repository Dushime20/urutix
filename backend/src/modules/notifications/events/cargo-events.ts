// Event definitions for cargo-related notifications

export class CargoCreatedEvent {
  constructor(
    public readonly cargoId: string,
    public readonly cargoOwnerId: string,
    public readonly tenantId: string,
    public readonly cargoDetails: {
      title: string;
      origin: string;
      destination: string;
      weight: number;
      pickupDate: Date;
      deliveryDate: Date;
      price?: number;
    },
  ) {}
}

export class BidSubmittedEvent {
  constructor(
    public readonly bidId: string,
    public readonly cargoId: string,
    public readonly truckOwnerId: string,
    public readonly cargoOwnerId: string,
    public readonly tenantId: string,
    public readonly bidDetails: {
      amount: number;
      proposedPickupDate?: Date;
      proposedDeliveryDate?: Date;
      notes?: string;
    },
  ) {}
}

export class BidAcceptedEvent {
  constructor(
    public readonly bidId: string,
    public readonly cargoId: string,
    public readonly truckOwnerId: string,
    public readonly cargoOwnerId: string,
    public readonly driverId: string | null,
    public readonly tenantId: string,
    public readonly bidDetails: {
      amount: number;
      cargoTitle: string;
      origin: string;
      destination: string;
    },
  ) {}
}

export class DriverAssignedEvent {
  constructor(
    public readonly driverId: string,
    public readonly truckId: string,
    public readonly truckOwnerId: string,
    public readonly tenantId: string,
    public readonly assignmentDetails: {
      truckPlateNumber: string;
      truckModel: string;
      assignedBy: string;
      cargoId?: string;
      tripId?: string;
    },
  ) {}
}

export class TripStartedEvent {
  constructor(
    public readonly tripId: string,
    public readonly driverId: string,
    public readonly cargoOwnerId: string,
    public readonly truckOwnerId: string,
    public readonly tenantId: string,
    public readonly tripDetails: {
      cargoTitle: string;
      origin: string;
      destination: string;
      estimatedArrival: Date;
      trackingUrl?: string;
    },
  ) {}
}

export class TripCompletedEvent {
  constructor(
    public readonly tripId: string,
    public readonly driverId: string,
    public readonly cargoOwnerId: string,
    public readonly truckOwnerId: string,
    public readonly tenantId: string,
    public readonly tripDetails: {
      cargoTitle: string;
      origin: string;
      destination: string;
      completedAt: Date;
      distance?: number;
      duration?: number;
    },
  ) {}
}

export class DriverBreakStartedEvent {
  constructor(
    public readonly driverId: string,
    public readonly breakId: string,
    public readonly tenantId: string,
    public readonly breakDetails: {
      breakType: string;
      startTime: Date;
      driverName: string;
      currentTripId?: string;
      currentLoadId?: string;
      estimatedDuration?: number;
      notes?: string;
    },
  ) {}
}

export class DriverBreakEndedEvent {
  constructor(
    public readonly driverId: string,
    public readonly breakId: string,
    public readonly tenantId: string,
    public readonly breakDetails: {
      breakType: string;
      startTime: Date;
      endTime: Date;
      duration: number; // in minutes
      driverName: string;
      currentTripId?: string;
      currentLoadId?: string;
    },
  ) {}
}

// ─── Loan Events ────────────────────────────────────────────────────────────

export class LoanRequestedEvent {
  constructor(
    public readonly loanId: string,
    public readonly cargoOwnerId: string,
    public readonly lenderId: string | null,
    public readonly tenantId: string,
    public readonly loanDetails: {
      requestedAmount: number;
      tripId?: string;
      cargoId?: string;
      cargoTitle?: string;
    },
  ) {}
}

export class LoanApprovedEvent {
  constructor(
    public readonly loanId: string,
    public readonly cargoOwnerId: string,
    public readonly truckOwnerId: string | null,
    public readonly lenderId: string | null,
    public readonly tenantId: string,
    public readonly loanDetails: {
      approvedAmount: number;
      tripId?: string;
      cargoTitle?: string;
    },
  ) {}
}

export class LoanRejectedEvent {
  constructor(
    public readonly loanId: string,
    public readonly cargoOwnerId: string,
    public readonly tenantId: string,
    public readonly loanDetails: {
      requestedAmount: number;
      reason?: string;
      cargoTitle?: string;
    },
  ) {}
}

export class LoanRepaymentReceivedEvent {
  constructor(
    public readonly loanId: string,
    public readonly cargoOwnerId: string,
    public readonly lenderId: string | null,
    public readonly tenantId: string,
    public readonly repaymentDetails: {
      amount: number;
      remainingBalance: number;
    },
  ) {}
}

export class LoanOverdueEvent {
  constructor(
    public readonly loanId: string,
    public readonly cargoOwnerId: string,
    public readonly lenderId: string | null,
    public readonly tenantId: string,
    public readonly loanDetails: {
      overdueAmount: number;
      dueDate: Date;
    },
  ) {}
}

export class LenderPaidOnBehalfEvent {
  constructor(
    public readonly loanId: string,
    public readonly cargoOwnerId: string,
    public readonly truckOwnerId: string,
    public readonly lenderId: string | null,
    public readonly tenantId: string,
    public readonly paymentDetails: {
      amount: number;
      cargoTitle?: string;
      tripId?: string;
    },
  ) {}
}

// ─── Auction / Smart Match Events ───────────────────────────────────────────

export class AuctionWonEvent {
  constructor(
    public readonly auctionId: string,
    public readonly truckOwnerId: string,
    public readonly cargoOwnerId: string,
    public readonly tenantId: string,
    public readonly auctionDetails: {
      winningBid: number;
      cargoTitle: string;
      origin: string;
      destination: string;
    },
  ) {}
}

export class SmartMatchSelectedEvent {
  constructor(
    public readonly matchId: string,
    public readonly truckOwnerId: string,
    public readonly cargoOwnerId: string,
    public readonly tenantId: string,
    public readonly matchDetails: {
      cargoTitle: string;
      origin: string;
      destination: string;
      matchScore?: number;
    },
  ) {}
}

export class PaymentReminderEvent {
  constructor(
    public readonly paymentId: string,
    public readonly cargoOwnerId: string,
    public readonly tenantId: string,
    public readonly paymentDetails: {
      amount: number;
      dueDate: Date;
      tripId?: string;
      cargoTitle?: string;
    },
  ) {}
}

export class TruckOwnerPaymentReceivedEvent {
  constructor(
    public readonly paymentId: string,
    public readonly truckOwnerId: string,
    public readonly tenantId: string,
    public readonly paymentDetails: {
      amount: number;
      cargoTitle?: string;
      tripId?: string;
      paymentSource?: 'DIRECT' | 'LOAN';
    },
  ) {}
}
