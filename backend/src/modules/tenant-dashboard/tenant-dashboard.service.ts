import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Load, LoadStatus } from '../../entities/load.entity';
import { Truck, VehicleStatus } from '../../entities/truck.entity';
import { User, UserRole } from '../../entities/user.entity';
import { Trip, TripStatus } from '../../entities/trip.entity';
import { Payment, PaymentStatus } from '../../entities/payment.entity';
import { Bid } from '../../entities/bid.entity';
import { CreditAccount } from '../../entities/credit-account.entity';
import { CreditService } from '../../services/credit.service';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../../entities/notification.entity';

export interface TenantMetrics {
  totalRevenue: number;
  totalShipments: number;
  averageLoadUtilization: number;
  fuelEfficiency: number;
  onTimeDelivery: number;
  customerSatisfaction: number;
  activeTrucks: number;
  totalDrivers: number;
  pendingLoads: number;
  completedTrips: number;
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
    @InjectRepository(CreditAccount)
    private readonly creditAccountRepository: Repository<CreditAccount>,
    private readonly creditService: CreditService,
    private readonly notificationsService: NotificationsService,
  ) { }

  async getLowCreditPartners(tenantId: string) {
    return this.creditService.getLowCreditPartners(tenantId);
  }

  async notifyLowCreditPartners(tenantId: string) {
    const lowCreditPartners = await this.creditService.getLowCreditPartners(tenantId, 5000); // 5000 TRX threshold

    const notificationPromises = lowCreditPartners.map(partner =>
      this.notificationsService.createNotification({
        userId: partner.user.id,
        type: NotificationType.ALERT,
        tenantId: tenantId,
        channel: 'IN_APP' as any,
        priority: 'HIGH' as any,
        category: 'FINANCIAL' as any,
        entityType: 'USER' as any, // Required field - specifying the entity type
        entityId: partner.user.id, // The user ID this notification is about
        templateId: 'low-credit-alert',
        content: `Your credit balance is low (${partner.currentBalance} TRX). Please top up to avoid service interruption.`,
        metadata: {
          currentBalance: partner.currentBalance,
          threshold: 5000,
          actionUrl: '/dashboard/credits/topup'
        }
      }, tenantId)
    );

    return Promise.all(notificationPromises);
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

    // Get tenant-level credit account for partner sales revenue
    const tenantCreditAccount = await this.creditAccountRepository.findOne({
      where: {
        tenantId,
        userId: null, // Tenant-level account
      },
    });

    // Calculate metrics
    const operationalRevenue = payments.reduce(
      (sum, payment) => sum + (Number(payment.amount) || 0),
      0,
    );
    const partnerSalesRevenue = tenantCreditAccount 
      ? Number(tenantCreditAccount.revenueFromPartnerSales) || 0
      : 0;
    const totalRevenue = operationalRevenue + partnerSalesRevenue;
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

    return {
      totalRevenue,
      totalShipments,
      averageLoadUtilization: Math.round(averageLoadUtilization),
      fuelEfficiency,
      onTimeDelivery,
      customerSatisfaction,
      activeTrucks,
      totalDrivers,
      pendingLoads,
      completedTrips,
    };
  }

  async getTenantTrends(
    tenantId: string,
    timeRange: string = '7d',
  ): Promise<TenantTrends> {
    const { startDate, endDate } = this.getDateRange(timeRange);
    const days = this.getDaysArray(startDate, endDate);

    // Use AT TIME ZONE 'UTC' to ensure consistent date comparison
    // Get loads grouped by day
    const loadsByDay = await this.loadRepository
      .createQueryBuilder('load')
      .select("TO_CHAR(load.createdAt AT TIME ZONE 'UTC', 'YYYY-MM-DD')", 'date')
      .addSelect('COUNT(*)', 'count')
      .where('load.tenantId = :tenantId', { tenantId })
      .andWhere('load.createdAt >= :startDate AND load.createdAt <= :endDate', {
        startDate,
        endDate,
      })
      .groupBy("TO_CHAR(load.createdAt AT TIME ZONE 'UTC', 'YYYY-MM-DD')")
      .getRawMany();

    // Get payments grouped by day (completed payments)
    const paymentsByDay = await this.paymentRepository
      .createQueryBuilder('payment')
      .select("TO_CHAR(payment.createdAt AT TIME ZONE 'UTC', 'YYYY-MM-DD')", 'date')
      .addSelect('SUM(payment.amount)', 'total')
      .where('payment.tenantId = :tenantId', { tenantId })
      .andWhere('payment.createdAt >= :startDate AND payment.createdAt <= :endDate', {
        startDate,
        endDate,
      })
      .andWhere('payment.status = :status', { status: PaymentStatus.COMPLETED })
      .groupBy("TO_CHAR(payment.createdAt AT TIME ZONE 'UTC', 'YYYY-MM-DD')")
      .getRawMany();

    // Get trips grouped by day — use agreedPrice as revenue fallback
    const tripsByDay = await this.tripRepository
      .createQueryBuilder('trip')
      .select("TO_CHAR(trip.createdAt AT TIME ZONE 'UTC', 'YYYY-MM-DD')", 'date')
      .addSelect('COUNT(*)', 'count')
      .addSelect('SUM(trip.agreedPrice)', 'tripRevenue')
      .where('trip.tenantId = :tenantId', { tenantId })
      .andWhere('trip.createdAt >= :startDate AND trip.createdAt <= :endDate', {
        startDate,
        endDate,
      })
      .groupBy("TO_CHAR(trip.createdAt AT TIME ZONE 'UTC', 'YYYY-MM-DD')")
      .getRawMany();

    // Get total trucks for utilization calculation
    const totalTrucks = await this.truckRepository.count({
      where: { tenantId },
    });

    // Map data to arrays
    const revenue = days.map((day) => {
      // Prefer payment revenue, fall back to trip agreedPrice
      const payment = paymentsByDay.find((p) => p.date === day);
      if (payment && parseFloat(payment.total) > 0) {
        return parseFloat(payment.total) || 0;
      }
      const trip = tripsByDay.find((t) => t.date === day);
      return trip ? parseFloat(trip.tripRevenue) || 0 : 0;
    });

    const shipments = days.map((day) => {
      const load = loadsByDay.find((l) => l.date === day);
      return load ? parseInt(load.count) || 0 : 0;
    });

    // Fleet utilization: (active trips on that day / total trucks) * 100
    const fleetUtilization = days.map((day) => {
      const trip = tripsByDay.find((t) => t.date === day);
      if (!trip || totalTrucks === 0) return 0;
      const activeTrips = parseInt(trip.count) || 0;
      return Math.min(Math.round((activeTrips / totalTrucks) * 100), 100);
    });

    const fuelEfficiency = days.map(() => 8.5);
    const onTimeDelivery = days.map(() => 95);

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

    // Get recent bids — join through loads to filter by tenantId
    const recentBids = await this.bidRepository
      .createQueryBuilder('bid')
      .innerJoin('loads', 'load', 'bid.loadId = load.id')
      .where('load.tenantId = :tenantId', { tenantId })
      .orderBy('bid.createdAt', 'DESC')
      .take(Math.ceil(limit / 3))
      .getMany();

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

  async getTruckOwnerPerformance(tenantId: string): Promise<any[]> {
    const rawData = await this.tripRepository
      .createQueryBuilder('trip')
      .leftJoin('trucks', 'truck', 'trip.truckId = truck.id')
      .leftJoin('users', 'user', 'truck.ownerId = user.id')
      .leftJoin('user_profiles', 'profile', 'user.id = profile.userId')
      .leftJoin('loads', 'load', 'trip.loadId = load.id')
      .select('user.email', 'email')
      .addSelect('profile.companyName', 'companyName')
      .addSelect('COUNT(trip.id)', 'totalTrips')
      .addSelect("COUNT(CASE WHEN trip.status = 'COMPLETED' THEN 1 END)", 'completedTrips')
      .addSelect('AVG(load.rating)', 'averageRating')
      .addSelect('SUM(trip.agreedPrice)', 'totalRevenue')
      .where('trip.tenantId = :tenantId', { tenantId })
      .groupBy('user.email')
      .addGroupBy('profile.companyName')
      .orderBy('COUNT(trip.id)', 'DESC')
      .getRawMany();

    return rawData.map(item => ({
      email: item.email,
      companyName: item.companyName,
      totalTrips: parseInt(item.totalTrips),
      completedTrips: parseInt(item.completedTrips),
      averageRating: parseFloat(item.averageRating || 0),
      totalRevenue: parseFloat(item.totalRevenue || 0),
    }));
  }

  async getCargoMetrics(tenantId: string, timeRange: string = '7d'): Promise<any> {
    const { startDate, endDate } = this.getDateRange(timeRange);

    // Get loads for the tenant
    const loads = await this.loadRepository.find({
      where: {
        tenantId,
        createdAt: Between(startDate, endDate),
      },
      relations: ['cargoOwner', 'cargoOwner.profile'],
    });

    // Get trips for delivery metrics
    const trips = await this.tripRepository.find({
      where: {
        tenantId,
        createdAt: Between(startDate, endDate),
      },
      relations: ['load'],
    });

    // Calculate metrics
    const totalLoads = loads.length;
    const activeLoads = loads.filter(load => 
      [LoadStatus.PUBLISHED, LoadStatus.ASSIGNED, LoadStatus.IN_TRANSIT].includes(load.status)
    ).length;
    const completedLoads = loads.filter(load => load.status === LoadStatus.DELIVERED).length;
    const pendingLoads = loads.filter(load => 
      [LoadStatus.DRAFT, LoadStatus.CREATED].includes(load.status)
    ).length;

    // Calculate revenue from completed trips
    const totalRevenue = trips
      .filter(trip => trip.status === TripStatus.COMPLETED)
      .reduce((sum, trip) => sum + (trip.agreedPrice || 0), 0);

    const averageLoadValue = loads.length > 0
      ? loads.reduce((sum, load) => sum + (load.loadValue || 0), 0) / loads.length
      : 0;

    // Calculate on-time delivery
    const completedTrips = trips.filter(trip => trip.status === TripStatus.COMPLETED);
    const onTimeTrips = completedTrips.filter(trip => {
      if (!trip.plannedEndTime || !trip.actualEndTime) return false;
      return new Date(trip.actualEndTime) <= new Date(trip.plannedEndTime);
    });
    const onTimeDelivery = completedTrips.length > 0
      ? (onTimeTrips.length / completedTrips.length) * 100
      : 0;

    // Group by cargo type
    const cargoTypeMap = new Map<string, { count: number; revenue: number }>();
    loads.forEach(load => {
      const type = load.cargoType || 'Other';
      const existing = cargoTypeMap.get(type) || { count: 0, revenue: 0 };
      cargoTypeMap.set(type, {
        count: existing.count + 1,
        revenue: existing.revenue + (load.loadValue || 0),
      });
    });

    const topCommodities = Array.from(cargoTypeMap.entries())
      .map(([name, data]) => ({
        name,
        count: data.count,
        value: data.revenue,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);

    // Group by route
    const routeMap = new Map<string, number>();
    loads.forEach(load => {
      const origin = load.pickupLocation?.locationData?.city || 'Unknown';
      const destination = load.deliveryLocation?.locationData?.city || 'Unknown';
      const routeKey = `${origin}-${destination}`;
      routeMap.set(routeKey, (routeMap.get(routeKey) || 0) + 1);
    });

    const popularRoutes = Array.from(routeMap.entries())
      .map(([route, frequency]) => {
        const [origin, destination] = route.split('-');
        return { origin, destination, frequency };
      })
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 5);

    return {
      summary: {
        totalLoads,
        activeLoads,
        completedLoads,
        pendingLoads,
        totalRevenue,
        averageDeliveryTime: 2.3, // Would need trip duration calculation
        onTimeDelivery: Math.round(onTimeDelivery * 10) / 10,
        averageLoadValue,
      },
      topCommodities,
      popularRoutes,
    };
  }
}
