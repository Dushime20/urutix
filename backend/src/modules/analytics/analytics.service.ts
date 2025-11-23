import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Trip, TripStatus } from '../../entities/trip.entity';
import { Load, LoadStatus } from '../../entities/load.entity';
import { Payment, PaymentStatus } from '../../entities/payment.entity';
import { User, UserStatus } from '../../entities/user.entity';
import { Truck, VehicleStatus } from '../../entities/truck.entity';
import { Driver, DriverStatus } from '../../entities/driver.entity';
import {
  Notification,
  NotificationType,
} from '../../entities/notification.entity';
import {
  AnalyticsFilterDto,
  AnalyticsPeriod,
  AnalyticsMetric,
} from './dto/analytics-filter.dto';
import { DashboardRequestDto } from './dto/dashboard-request.dto';

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(Trip)
    private readonly tripRepository: Repository<Trip>,
    @InjectRepository(Load)
    private readonly loadRepository: Repository<Load>,
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Truck)
    private readonly truckRepository: Repository<Truck>,
    @InjectRepository(Driver)
    private readonly driverRepository: Repository<Driver>,
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
  ) {}

  async getDashboardData(
    dashboardRequest: DashboardRequestDto,
    tenantId: string,
  ): Promise<any> {
    const {
      period = AnalyticsPeriod.MONTH,
      metrics = [],
      userId,
    } = dashboardRequest;

    const startDate = this.getStartDate(period);
    const endDate = new Date();

    const dashboardData: any = {};

    // Revenue Analytics
    if (metrics.includes('revenue') || metrics.length === 0) {
      dashboardData.revenue = await this.getRevenueAnalytics(
        startDate,
        endDate,
        tenantId,
        userId,
      );
    }

    // Trip Analytics
    if (metrics.includes('trips') || metrics.length === 0) {
      dashboardData.trips = await this.getTripAnalytics(
        startDate,
        endDate,
        tenantId,
        userId,
      );
    }

    // Load Analytics
    if (metrics.includes('loads') || metrics.length === 0) {
      dashboardData.loads = await this.getLoadAnalytics(
        startDate,
        endDate,
        tenantId,
        userId,
      );
    }

    // Payment Analytics
    if (metrics.includes('payments') || metrics.length === 0) {
      dashboardData.payments = await this.getPaymentAnalytics(
        startDate,
        endDate,
        tenantId,
        userId,
      );
    }

    // User Analytics
    if (metrics.includes('users') || metrics.length === 0) {
      dashboardData.users = await this.getUserAnalytics(
        startDate,
        endDate,
        tenantId,
      );
    }

    // Fleet Analytics
    if (metrics.includes('fleet') || metrics.length === 0) {
      dashboardData.fleet = await this.getFleetAnalytics(
        startDate,
        endDate,
        tenantId,
      );
    }

    // Matching Analytics
    if (metrics.includes('matching') || metrics.length === 0) {
      dashboardData.matching = await this.getMatchingAnalytics(
        startDate,
        endDate,
        tenantId,
      );
    }

    // Notification Analytics
    if (metrics.includes('notifications') || metrics.length === 0) {
      dashboardData.notifications = await this.getNotificationAnalytics(
        startDate,
        endDate,
        tenantId,
        userId,
      );
    }

    return dashboardData;
  }

  async getRevenueAnalytics(
    startDate: Date,
    endDate: Date,
    tenantId: string,
    userId?: string,
  ): Promise<any> {
    const query = this.paymentRepository
      .createQueryBuilder('payment')
      .where('payment.tenantId = :tenantId', { tenantId })
      .andWhere('payment.createdAt BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      })
      .andWhere('payment.status = :status', {
        status: PaymentStatus.COMPLETED,
      });

    if (userId) {
      query.andWhere('payment.payerId = :userId', { userId });
    }

    const payments = await query.getMany();

    const totalRevenue = payments.reduce(
      (sum, payment) => sum + Number(payment.amount),
      0,
    );
    const totalProcessingFees = payments.reduce(
      (sum, payment) => sum + Number(payment.processingFee || 0),
      0,
    );
    const netRevenue = totalRevenue - totalProcessingFees;

    const revenueByCurrency = payments.reduce(
      (acc, payment) => {
        acc[payment.currency] =
          (acc[payment.currency] || 0) + Number(payment.amount);
        return acc;
      },
      {} as Record<string, number>,
    );

    const revenueByType = payments.reduce(
      (acc, payment) => {
        acc[payment.paymentType] =
          (acc[payment.paymentType] || 0) + Number(payment.amount);
        return acc;
      },
      {} as Record<string, number>,
    );

    return {
      totalRevenue,
      netRevenue,
      totalProcessingFees,
      averagePayment: payments.length > 0 ? totalRevenue / payments.length : 0,
      paymentCount: payments.length,
      revenueByCurrency,
      revenueByType,
      period: { startDate, endDate },
    };
  }

  async getTripAnalytics(
    startDate: Date,
    endDate: Date,
    tenantId: string,
    userId?: string,
  ): Promise<any> {
    const query = this.tripRepository
      .createQueryBuilder('trip')
      .leftJoinAndSelect('trip.load', 'load')
      .where('trip.tenantId = :tenantId', { tenantId })
      .andWhere('trip.createdAt BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      });

    if (userId) {
      query.andWhere('load.cargoOwnerId = :userId', { userId });
    }

    const trips = await query.getMany();

    const totalTrips = trips.length;
    const completedTrips = trips.filter(
      (t) => t.status === TripStatus.COMPLETED,
    ).length;
    const inProgressTrips = trips.filter(
      (t) => t.status === TripStatus.IN_PROGRESS,
    ).length;
    const plannedTrips = trips.filter(
      (t) => t.status === TripStatus.PLANNED,
    ).length;
    const cancelledTrips = trips.filter(
      (t) => t.status === TripStatus.CANCELLED,
    ).length;

    const averageTripDuration =
      completedTrips > 0
        ? trips
            .filter(
              (t) =>
                t.status === TripStatus.COMPLETED &&
                t.actualStartTime &&
                t.actualEndTime,
            )
            .reduce((sum, t) => {
              const duration =
                new Date(t.actualEndTime).getTime() -
                new Date(t.actualStartTime).getTime();
              return sum + duration;
            }, 0) / completedTrips
        : 0;

    const tripsByStatus = {
      completed: completedTrips,
      inProgress: inProgressTrips,
      planned: plannedTrips,
      cancelled: cancelledTrips,
    };

    return {
      totalTrips,
      completedTrips,
      inProgressTrips,
      plannedTrips,
      cancelledTrips,
      completionRate: totalTrips > 0 ? (completedTrips / totalTrips) * 100 : 0,
      averageTripDuration: averageTripDuration / (1000 * 60 * 60), // Convert to hours
      tripsByStatus,
      period: { startDate, endDate },
    };
  }

  async getLoadAnalytics(
    startDate: Date,
    endDate: Date,
    tenantId: string,
    userId?: string,
  ): Promise<any> {
    const query = this.loadRepository
      .createQueryBuilder('load')
      .where('load.tenantId = :tenantId', { tenantId })
      .andWhere('load.createdAt BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      });

    if (userId) {
      query.andWhere('load.cargoOwnerId = :userId', { userId });
    }

    const loads = await query.getMany();

    const totalLoads = loads.length;
    const publishedLoads = loads.filter((l) =>
      [LoadStatus.CREATED, LoadStatus.PUBLISHED].includes(l.status),
    ).length;
    const assignedLoads = loads.filter(
      (l) => l.status === LoadStatus.ASSIGNED,
    ).length;
    const deliveredLoads = loads.filter(
      (l) => l.status === LoadStatus.DELIVERED,
    ).length;

    const loadsByStatus = {
      published: publishedLoads,
      assigned: assignedLoads,
      delivered: deliveredLoads,
    };

    const loadsByCargoType = loads.reduce(
      (acc, load) => {
        acc[load.cargoType] = (acc[load.cargoType] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    return {
      totalLoads,
      publishedLoads,
      assignedLoads,
      deliveredLoads,
      assignmentRate: totalLoads > 0 ? (assignedLoads / totalLoads) * 100 : 0,
      deliveryRate: totalLoads > 0 ? (deliveredLoads / totalLoads) * 100 : 0,
      loadsByStatus,
      loadsByCargoType,
      period: { startDate, endDate },
    };
  }

  async getPaymentAnalytics(
    startDate: Date,
    endDate: Date,
    tenantId: string,
    userId?: string,
  ): Promise<any> {
    const query = this.paymentRepository
      .createQueryBuilder('payment')
      .where('payment.tenantId = :tenantId', { tenantId })
      .andWhere('payment.createdAt BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      });

    if (userId) {
      query.andWhere('payment.payerId = :userId', { userId });
    }

    const payments = await query.getMany();

    const totalPayments = payments.length;
    const completedPayments = payments.filter(
      (p) => p.status === PaymentStatus.COMPLETED,
    ).length;
    const pendingPayments = payments.filter(
      (p) => p.status === PaymentStatus.PENDING,
    ).length;
    const failedPayments = payments.filter(
      (p) => p.status === PaymentStatus.FAILED,
    ).length;

    const paymentsByStatus = {
      completed: completedPayments,
      pending: pendingPayments,
      failed: failedPayments,
    };

    const paymentsByMethod = payments.reduce(
      (acc, payment) => {
        acc[payment.paymentMethod] = (acc[payment.paymentMethod] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    const successRate =
      totalPayments > 0 ? (completedPayments / totalPayments) * 100 : 0;

    return {
      totalPayments,
      completedPayments,
      pendingPayments,
      failedPayments,
      successRate,
      paymentsByStatus,
      paymentsByMethod,
      period: { startDate, endDate },
    };
  }

  async getUserAnalytics(
    startDate: Date,
    endDate: Date,
    tenantId: string,
  ): Promise<any> {
    const users = await this.userRepository.find({
      where: { tenantId },
    });

    const newUsers = users.filter(
      (u) => u.createdAt >= startDate && u.createdAt <= endDate,
    ).length;
    const totalUsers = users.length;
    const activeUsers = users.filter(
      (u) => u.status === UserStatus.ACTIVE,
    ).length;

    return {
      totalUsers,
      newUsers,
      activeUsers,
      inactiveUsers: totalUsers - activeUsers,
      userGrowthRate: totalUsers > 0 ? (newUsers / totalUsers) * 100 : 0,
      period: { startDate, endDate },
    };
  }

  async getFleetAnalytics(
    startDate: Date,
    endDate: Date,
    tenantId: string,
  ): Promise<any> {
    const trucks = await this.truckRepository.find({
      where: { tenantId },
    });

    const drivers = await this.driverRepository.find({
      where: { tenantId },
    });

    const totalTrucks = trucks.length;
    const availableTrucks = trucks.filter(
      (t) => t.status === VehicleStatus.AVAILABLE,
    ).length;
    const inTransitTrucks = trucks.filter(
      (t) => t.status === VehicleStatus.IN_TRANSIT,
    ).length;
    const maintenanceTrucks = trucks.filter(
      (t) => t.status === VehicleStatus.MAINTENANCE,
    ).length;

    const totalDrivers = drivers.length;
    const activeDrivers = drivers.filter(
      (d) => d.status === DriverStatus.ACTIVE,
    ).length;
    const availableDrivers = drivers.filter((d) => !d.currentTripId).length;

    return {
      trucks: {
        total: totalTrucks,
        available: availableTrucks,
        inTransit: inTransitTrucks,
        maintenance: maintenanceTrucks,
        utilizationRate:
          totalTrucks > 0
            ? ((totalTrucks - availableTrucks) / totalTrucks) * 100
            : 0,
      },
      drivers: {
        total: totalDrivers,
        active: activeDrivers,
        available: availableDrivers,
        utilizationRate:
          totalDrivers > 0
            ? ((totalDrivers - availableDrivers) / totalDrivers) * 100
            : 0,
      },
      period: { startDate, endDate },
    };
  }

  async getMatchingAnalytics(
    startDate: Date,
    endDate: Date,
    tenantId: string,
  ): Promise<any> {
    // This would integrate with the matching service
    // For now, return placeholder data
    return {
      totalMatches: 0,
      successfulMatches: 0,
      matchSuccessRate: 0,
      averageMatchTime: 0,
      period: { startDate, endDate },
    };
  }

  async getNotificationAnalytics(
    startDate: Date,
    endDate: Date,
    tenantId: string,
    userId?: string,
  ): Promise<any> {
    const query = this.notificationRepository
      .createQueryBuilder('notification')
      .where('notification.tenantId = :tenantId', { tenantId })
      .andWhere('notification.createdAt BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      });

    if (userId) {
      query.andWhere('notification.recipientId = :userId', { userId });
    }

    const notifications = await query.getMany();

    const totalNotifications = notifications.length;
    const readNotifications = notifications.filter((n) => n.isRead).length;
    const unreadNotifications = notifications.filter((n) => !n.isRead).length;
    const deliveredNotifications = notifications.filter(
      (n) => n.deliveryStatus === 'delivered',
    ).length;

    const notificationsByType = notifications.reduce(
      (acc, notification) => {
        acc[notification.notificationType] =
          (acc[notification.notificationType] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    const notificationsByPriority = notifications.reduce(
      (acc, notification) => {
        acc[notification.priority] = (acc[notification.priority] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    return {
      totalNotifications,
      readNotifications,
      unreadNotifications,
      deliveredNotifications,
      readRate:
        totalNotifications > 0
          ? (readNotifications / totalNotifications) * 100
          : 0,
      deliveryRate:
        totalNotifications > 0
          ? (deliveredNotifications / totalNotifications) * 100
          : 0,
      notificationsByType,
      notificationsByPriority,
      period: { startDate, endDate },
    };
  }

  private getStartDate(period: AnalyticsPeriod): Date {
    const now = new Date();
    switch (period) {
      case AnalyticsPeriod.DAY:
        return new Date(now.getFullYear(), now.getMonth(), now.getDate());
      case AnalyticsPeriod.WEEK:
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - now.getDay());
        return new Date(
          weekStart.getFullYear(),
          weekStart.getMonth(),
          weekStart.getDate(),
        );
      case AnalyticsPeriod.MONTH:
        return new Date(now.getFullYear(), now.getMonth(), 1);
      case AnalyticsPeriod.QUARTER:
        const quarter = Math.floor(now.getMonth() / 3);
        return new Date(now.getFullYear(), quarter * 3, 1);
      case AnalyticsPeriod.YEAR:
        return new Date(now.getFullYear(), 0, 1);
      default:
        return new Date(now.getFullYear(), now.getMonth(), 1);
    }
  }
}
