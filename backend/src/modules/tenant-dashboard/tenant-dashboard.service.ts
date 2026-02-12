import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Load, LoadStatus } from '../../entities/load.entity';
import { Truck, VehicleStatus } from '../../entities/truck.entity';
import { User, UserRole } from '../../entities/user.entity';
import { Trip, TripStatus } from '../../entities/trip.entity';
import { Payment, PaymentStatus } from '../../entities/payment.entity';
import { Bid } from '../../entities/bid.entity';
import { Tenant, TenantStatus } from '../../entities/tenant.entity';

export interface TenantMetrics {
  totalRevenue: number;
  totalShipments: number;
  averageLoadUtilization: number;
  fuelEfficiency: number;
  onTimeDelivery: number;
  customerSatisfaction: number;
  activeFleet: number; // Changed from activeTrucks to match frontend
  totalDrivers: number;
  pendingLoads: number;
  completedTrips: number;
  disputeRate: number; // Added to match frontend
}

export interface TenantTrends {
  revenue: number[];
  fleetUtilization: number[];
  shipments: number[];
  fuelEfficiency: number[];
  onTimeDelivery: number[];
}

export interface TenantActivity {
  id: string;
  type:
    | 'load_created'
    | 'trip_started'
    | 'trip_completed'
    | 'payment_received'
    | 'bid_placed';
  description: string;
  timestamp: Date;
  metadata?: any;
}

@Injectable()
export class TenantDashboardService {
  constructor(
    @InjectRepository(Load)
    private readonly loadRepository: Repository<Load>,
    @InjectRepository(Truck)
    private readonly truckRepository: Repository<Truck>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Trip)
    private readonly tripRepository: Repository<Trip>,
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
    @InjectRepository(Bid)
    private readonly bidRepository: Repository<Bid>,
    @InjectRepository(Tenant)
    private readonly tenantRepository: Repository<Tenant>,
  ) {}

  async getAllTenants(): Promise<any[]> {
    const tenants = await this.tenantRepository.find({
      where: {
        status: TenantStatus.ACTIVE,
        isActive: true,
      },
      select: ['id', 'name', 'type', 'city', 'state', 'country'],
      order: {
        name: 'ASC',
      },
    });

    return tenants.map(tenant => ({
      id: tenant.id,
      name: tenant.name,
      type: tenant.type,
      location: [tenant.city, tenant.state, tenant.country].filter(Boolean).join(', '),
    }));
  }

  async getTenantMetrics(
    tenantId: string,
    timeRange: string = '7d',
  ): Promise<TenantMetrics> {
    const { startDate, endDate } = this.getDateRange(timeRange);

    // Get loads for the tenant
    const loads = await this.loadRepository.find({
      where: {
        tenantId,
        createdAt: Between(startDate, endDate),
      },
    });

    // Get trucks for the tenant
    const trucks = await this.truckRepository.find({
      where: { tenantId },
    });

    // Get users (drivers) for the tenant
    const drivers = await this.userRepository.find({
      where: { tenantId, role: UserRole.DRIVER },
    });

    // Get trips for the tenant
    const trips = await this.tripRepository.find({
      where: {
        tenantId,
        createdAt: Between(startDate, endDate),
      },
    });

    // Get payments for the tenant
    const payments = await this.paymentRepository.find({
      where: {
        tenantId,
        createdAt: Between(startDate, endDate),
        status: PaymentStatus.COMPLETED,
      },
    });

    // Calculate metrics
    const totalRevenue = payments.reduce(
      (sum, payment) => sum + (payment.amount || 0),
      0,
    );
    const totalShipments = loads.length;
    const activeTrucks = trucks.filter(
      (truck) => truck.status === VehicleStatus.AVAILABLE,
    ).length;
    const totalDrivers = drivers.length;
    const pendingLoads = loads.filter((load) =>
      [LoadStatus.CREATED, LoadStatus.PUBLISHED].includes(load.status),
    ).length;
    const completedTrips = trips.filter(
      (trip) => trip.status === TripStatus.COMPLETED,
    ).length;

    // Calculate averages and percentages
    const averageLoadUtilization =
      trucks.length > 0 ? (activeTrucks / trucks.length) * 100 : 0;
    const fuelEfficiency = 8.5; // Mock value - would be calculated from actual fuel data
    const onTimeDelivery = 95; // Mock value - would be calculated from actual delivery data
    const customerSatisfaction = 4.2; // Mock value - would be calculated from ratings
    const disputeRate = 2.1; // Mock value - would be calculated from disputes

    return {
      totalRevenue,
      totalShipments,
      averageLoadUtilization: Math.round(averageLoadUtilization),
      fuelEfficiency,
      onTimeDelivery,
      customerSatisfaction,
      activeFleet: activeTrucks, // Changed from activeTrucks to activeFleet
      totalDrivers,
      pendingLoads,
      completedTrips,
      disputeRate,
    };
  }

  async getTenantTrends(
    tenantId: string,
    timeRange: string = '7d',
  ): Promise<TenantTrends> {
    const { startDate, endDate } = this.getDateRange(timeRange);
    const days = this.getDaysArray(startDate, endDate);

    // Get loads grouped by day
    const loadsByDay = await this.loadRepository
      .createQueryBuilder('load')
      .select('DATE(load.createdAt)', 'date')
      .addSelect('COUNT(*)', 'count')
      .where('load.tenantId = :tenantId', { tenantId })
      .andWhere('load.createdAt BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      })
      .groupBy('DATE(load.createdAt)')
      .getRawMany();

    // Get payments grouped by day
    const paymentsByDay = await this.paymentRepository
      .createQueryBuilder('payment')
      .select('DATE(payment.createdAt)', 'date')
      .addSelect('SUM(payment.amount)', 'total')
      .where('payment.tenantId = :tenantId', { tenantId })
      .andWhere('payment.createdAt BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      })
      .andWhere('payment.status = :status', { status: 'completed' })
      .groupBy('DATE(payment.createdAt)')
      .getRawMany();

    // Get trips grouped by day for fleet utilization
    const tripsByDay = await this.tripRepository
      .createQueryBuilder('trip')
      .select('DATE(trip.createdAt)', 'date')
      .addSelect('COUNT(*)', 'count')
      .where('trip.tenantId = :tenantId', { tenantId })
      .andWhere('trip.createdAt BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      })
      .groupBy('DATE(trip.createdAt)')
      .getRawMany();

    // Map data to arrays
    const revenue = days.map((day) => {
      const payment = paymentsByDay.find((p) => p.date === day);
      return payment ? parseFloat(payment.total) || 0 : 0;
    });

    const shipments = days.map((day) => {
      const load = loadsByDay.find((l) => l.date === day);
      return load ? parseInt(load.count) || 0 : 0;
    });

    const fleetUtilization = days.map((day) => {
      const trip = tripsByDay.find((t) => t.date === day);
      return trip ? Math.min(parseInt(trip.count) * 20, 100) : 0; // Mock calculation
    });

    const fuelEfficiency = days.map(() => 8.5); // Mock constant value
    const onTimeDelivery = days.map(() => 95); // Mock constant value

    return {
      revenue,
      fleetUtilization,
      shipments,
      fuelEfficiency,
      onTimeDelivery,
    };
  }

  async getRecentActivity(
    tenantId: string,
    limit: number = 10,
  ): Promise<TenantActivity[]> {
    const activities: TenantActivity[] = [];

    // Get recent loads
    const recentLoads = await this.loadRepository.find({
      where: { tenantId },
      order: { createdAt: 'DESC' },
      take: Math.ceil(limit / 3),
    });

    recentLoads.forEach((load) => {
      const pickup =
        load.pickupLocation?.locationData?.name || 'Unknown pickup';
      const delivery =
        load.deliveryLocation?.locationData?.name || 'Unknown delivery';
      activities.push({
        id: load.id,
        type: 'load_created',
        description: `New load created: ${pickup} to ${delivery}`,
        timestamp: load.createdAt,
        metadata: { loadId: load.id, pickup, delivery },
      });
    });

    // Get recent trips
    const recentTrips = await this.tripRepository.find({
      where: { tenantId },
      order: { createdAt: 'DESC' },
      take: Math.ceil(limit / 3),
    });

    recentTrips.forEach((trip) => {
      const type =
        trip.status === TripStatus.COMPLETED
          ? 'trip_completed'
          : 'trip_started';
      const description =
        trip.status === TripStatus.COMPLETED
          ? `Trip completed: ${trip.tripNumber}`
          : `Trip started: ${trip.tripNumber}`;

      activities.push({
        id: trip.id,
        type,
        description,
        timestamp: trip.createdAt,
        metadata: { tripId: trip.id, tripNumber: trip.tripNumber },
      });
    });

    // Get recent payments
    const recentPayments = await this.paymentRepository.find({
      where: { tenantId, status: PaymentStatus.COMPLETED },
      order: { createdAt: 'DESC' },
      take: Math.ceil(limit / 3),
    });

    recentPayments.forEach((payment) => {
      activities.push({
        id: payment.id,
        type: 'payment_received',
        description: `Payment received: RWF ${payment.amount}`,
        timestamp: payment.createdAt,
        metadata: { paymentId: payment.id, amount: payment.amount },
      });
    });

    // Get recent bids
    const recentBids = await this.bidRepository.find({
      where: { truckOwnerId: tenantId }, // Assuming tenantId here is the truckOwnerId
      order: { createdAt: 'DESC' },
      take: Math.ceil(limit / 3),
    });

    recentBids.forEach((bid) => {
      activities.push({
        id: bid.id,
        type: 'bid_placed',
        description: `Bid placed: ${bid.bidCurrency} ${bid.bidAmount}`,
        timestamp: bid.createdAt,
        metadata: {
          bidId: bid.id,
          amount: bid.bidAmount,
          currency: bid.bidCurrency,
        },
      });
    });

    // Sort by timestamp and limit
    return activities
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  async exportTenantData(
    tenantId: string,
    format: string,
    options: any,
  ): Promise<Blob> {
    // Mock export functionality
    const data = await this.getTenantMetrics(
      tenantId,
      options.timeRange || '7d',
    );
    const csvContent = this.convertToCSV(data);

    return new Blob([csvContent], { type: 'text/csv' });
  }

  private getDateRange(timeRange: string): { startDate: Date; endDate: Date } {
    const endDate = new Date();
    let startDate: Date;

    switch (timeRange) {
      case '7d':
        startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(endDate.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000);
    }

    return { startDate, endDate };
  }

  private getDaysArray(startDate: Date, endDate: Date): string[] {
    const days: string[] = [];
    const currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      days.push(currentDate.toISOString().split('T')[0]);
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return days;
  }

  private convertToCSV(data: any): string {
    const headers = Object.keys(data);
    const values = Object.values(data);
    return `${headers.join(',')}\n${values.join(',')}`;
  }
}
