import {
  Injectable,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { User } from '../../entities/user.entity';
import { Payment } from '../../entities/payment.entity';
import { Notification } from '../../entities/notification.entity';
import { Tenant, TenantStatus, TenantType } from '../../entities/tenant.entity';
import { DisputeV2, DisputeStatusV2 } from '../../entities/dispute-v2.entity';
import { AuditLog } from '../../entities/audit-log.entity';
import { Trip } from '../../entities/trip.entity';
import { Load } from '../../entities/load.entity';
import { Truck } from '../../entities/truck.entity';
import { toPublicTruck } from '../fleet/truck-persistence.util';
import { Route as FleetRoute } from '../../entities/route.entity';
import { UsersService } from '../users/users.service';
import { CreateTenantDto, SubscriptionPlan } from './dto/create-tenant.dto';

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    @InjectRepository(Payment)
    private readonly paymentRepo: Repository<Payment>,
    @InjectRepository(Notification)
    private readonly notificationRepo: Repository<Notification>,
    @InjectRepository(Tenant) private readonly tenantRepo: Repository<Tenant>,
    @InjectRepository(DisputeV2)
    private readonly disputeRepo: Repository<DisputeV2>,
    @InjectRepository(AuditLog)
    private readonly auditRepo: Repository<AuditLog>,
    @InjectRepository(Trip) private readonly tripRepo: Repository<Trip>,
    @InjectRepository(Load) private readonly loadRepo: Repository<Load>,
    @InjectRepository(Truck) private readonly truckRepo: Repository<Truck>,
    @InjectRepository(FleetRoute)
    private readonly routeRepo: Repository<FleetRoute>,
    private readonly usersService: UsersService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  // Get all routes with optional filters
  async getRoutes(filters: {
    tenantId?: string;
    status?: string;
    priority?: string;
    routeType?: string;
    search?: string;
  }) {
    try {
      let query = this.routeRepo.createQueryBuilder('route');
      if (filters.tenantId)
        query = query.andWhere('route.tenantId = :tenantId', {
          tenantId: filters.tenantId,
        });
      if (filters.status)
        query = query.andWhere('route.status = :status', {
          status: filters.status,
        });

      // Only filter by routeType if the column exists
      if (filters.routeType) {
        try {
          query = query.andWhere('route.routeType = :routeType', {
            routeType: filters.routeType,
          });
        } catch (error) {
          console.warn('routeType column may not exist yet, skipping filter');
        }
      }

      if (filters.search) {
        query = query.andWhere(
          '(LOWER(route.name) LIKE :search OR LOWER(route.origin) LIKE :search OR LOWER(route.destination) LIKE :search)',
          { search: `%${filters.search.toLowerCase()}%` },
        );
      }
      const routes = await query.orderBy('route.createdAt', 'DESC').getMany();
      return { routes };
    } catch (error) {
      console.error('Error in getRoutes:', error);

      // If there's a column error, try without routeType filter
      if (error.message && error.message.includes('routeType')) {
        console.log('Falling back to query without routeType filter');
        try {
          let query = this.routeRepo.createQueryBuilder('route');
          if (filters.tenantId)
            query = query.andWhere('route.tenantId = :tenantId', {
              tenantId: filters.tenantId,
            });
          if (filters.status)
            query = query.andWhere('route.status = :status', {
              status: filters.status,
            });
          if (filters.search) {
            query = query.andWhere(
              '(LOWER(route.name) LIKE :search OR LOWER(route.origin) LIKE :search OR LOWER(route.destination) LIKE :search)',
              { search: `%${filters.search.toLowerCase()}%` },
            );
          }
          const routes = await query
            .orderBy('route.createdAt', 'DESC')
            .getMany();
          return { routes };
        } catch (fallbackError) {
          console.error('Fallback query also failed:', fallbackError);
          return { routes: [] };
        }
      }

      return { routes: [] };
    }
  }

  async getKpi(tenantId?: string) {
    if (tenantId) {
      // Get KPIs for specific tenant
      const [users, trips, payments, alerts] = await Promise.all([
        this.userRepo.count({ where: { tenantId } }),
        this.tripRepo.count({ where: { tenantId } as any }),
        this.paymentRepo.count({ where: { tenantId } as any }),
        this.notificationRepo.count({ where: { tenantId } as any }),
      ]);

      return {
        users,
        activeTrips: trips,
        revenue: payments,
        engagement: Math.min(users * 2, 100),
        alerts,
      };
    } else {
      // Get KPIs for all tenants (super admin view)
      const [users, trips, payments, alerts] = await Promise.all([
        this.userRepo.count(),
        this.tripRepo.count(),
        this.paymentRepo.count(),
        this.notificationRepo.count(),
      ]);

      return {
        users,
        activeTrips: trips,
        revenue: payments,
        engagement: Math.min(users * 2, 100),
        alerts,
      };
    }
  }

  async getAnalytics(tenantId?: string) {
    if (tenantId) {
      // Get analytics for specific tenant
      const recentTrips = await this.tripRepo.find({
        where: { tenantId } as any,
        take: 10,
        order: { createdAt: 'DESC' } as any,
      });
      const recentPayments = await this.paymentRepo.find({
        where: { tenantId } as any,
        take: 10,
        order: { createdAt: 'DESC' } as any,
      });
      return { recentTrips, recentPayments };
    } else {
      // Get analytics for all tenants (super admin view)
      const recentTrips = await this.tripRepo.find({
        take: 10,
        order: { createdAt: 'DESC' } as any,
      });
      const recentPayments = await this.paymentRepo.find({
        take: 10,
        order: { createdAt: 'DESC' } as any,
      });
      return { recentTrips, recentPayments };
    }
  }

  async getUsers(tenantId: string) {
    const users = await this.userRepo.find({
      where: { tenantId } as any,
      take: 100,
      order: { createdAt: 'DESC' } as any,
    });
    return { users };
  }

  async getFinancials(tenantId?: string) {
    try {
      console.log('💰 Calculating financials for tenantId:', tenantId || 'ALL');
      
      // Get revenue from multiple sources
      const revenuePromises = [];
      
      // 1. Revenue from payments table
      let paymentsQuery = this.paymentRepo
        .createQueryBuilder('p')
        .select('COALESCE(SUM(p.amount),0)', 'sum');
      
      if (tenantId) {
        paymentsQuery = paymentsQuery.where('p.tenantId = :tenantId', { tenantId });
      }
      
      revenuePromises.push(
        paymentsQuery.getRawOne<{ sum: string }>().then(result => ({
          source: 'payments',
          amount: Number(result?.sum || 0)
        }))
      );
      
      // 2. Revenue from credit marketplace sales (credit_accounts table)
      const creditAccountsRepo = this.userRepo.manager.getRepository('credit_accounts');
      let creditQuery = creditAccountsRepo
        .createQueryBuilder('ca')
        .select('COALESCE(SUM(ca.revenue_from_marketplace_sales),0)', 'sum');
      
      if (tenantId) {
        creditQuery = creditQuery.where('ca.tenant_id = :tenantId', { tenantId });
      }
      
      revenuePromises.push(
        creditQuery.getRawOne<{ sum: string }>().then(result => ({
          source: 'credit_marketplace',
          amount: Number(result?.sum || 0)
        })).catch(err => {
          console.warn('Could not query credit_accounts:', err.message);
          return { source: 'credit_marketplace', amount: 0 };
        })
      );
      
      // 3. Revenue from trips (agreedPrice, totalCost)
      let tripsQuery = this.tripRepo
        .createQueryBuilder('t')
        .select('COALESCE(SUM(t.agreedPrice),0)', 'agreedSum')
        .addSelect('COALESCE(SUM(t.totalCost),0)', 'costSum');
      
      if (tenantId) {
        tripsQuery = tripsQuery.where('t.tenantId = :tenantId', { tenantId });
      }
      
      revenuePromises.push(
        tripsQuery.getRawOne<{ agreedSum: string; costSum: string }>().then(result => ({
          source: 'trips_agreed',
          amount: Number(result?.agreedSum || 0)
        })).catch(err => {
          console.warn('Could not query trips for agreedPrice:', err.message);
          return { source: 'trips_agreed', amount: 0 };
        })
      );
      
      // 4. Revenue from loads (offeredPrice, brokerCommissionAmount)
      let loadsQuery = this.loadRepo
        .createQueryBuilder('l')
        .select('COALESCE(SUM(l.offeredPrice),0)', 'offeredSum')
        .addSelect('COALESCE(SUM(l.brokerCommissionAmount),0)', 'commissionSum');
      
      if (tenantId) {
        loadsQuery = loadsQuery.where('l.tenantId = :tenantId', { tenantId });
      }
      
      revenuePromises.push(
        loadsQuery.getRawOne<{ offeredSum: string; commissionSum: string }>().then(result => ({
          source: 'loads_offered',
          amount: Number(result?.offeredSum || 0)
        })).catch(err => {
          console.warn('Could not query loads for offeredPrice:', err.message);
          return { source: 'loads_offered', amount: 0 };
        })
      );
      
      revenuePromises.push(
        loadsQuery.getRawOne<{ offeredSum: string; commissionSum: string }>().then(result => ({
          source: 'broker_commissions',
          amount: Number(result?.commissionSum || 0)
        })).catch(err => {
          console.warn('Could not query loads for commissions:', err.message);
          return { source: 'broker_commissions', amount: 0 };
        })
      );
      
      // Wait for all revenue calculations
      const revenueResults = await Promise.all(revenuePromises);
      
      console.log('💰 Revenue breakdown by source:');
      revenueResults.forEach(result => {
        console.log(`  ${result.source}: $${result.amount}`);
      });
      
      // Calculate total revenue
      const totalRevenue = revenueResults.reduce((sum, result) => sum + result.amount, 0);
      
      console.log('💰 Total Revenue:', totalRevenue);
      
      return { 
        totalRevenue,
        revenueBreakdown: revenueResults.reduce((acc, result) => {
          acc[result.source] = result.amount;
          return acc;
        }, {} as Record<string, number>)
      };
      
    } catch (error) {
      console.error('❌ Error calculating financials:', error);
      return { 
        totalRevenue: 0,
        error: error.message 
      };
    }
  }

  async getHealth() {
    // Simple stubbed health; could be expanded with DB ping etc.
    return { status: 'ok', uptime: process.uptime() };
  }

  // ─── Comprehensive Analytics Methods ────────────────────────────────────────

  async getAnalyticsOverview(tenantId?: string) {
    try {
      const [
        totalUsers, totalTrips, totalLoads, totalTrucks,
        completedTrips, activeTrips, totalRevenue,
        recentTrips, recentLoads,
      ] = await Promise.all([
        tenantId ? this.userRepo.count({ where: { tenantId } as any }) : this.userRepo.count(),
        tenantId ? this.tripRepo.count({ where: { tenantId } as any }) : this.tripRepo.count(),
        tenantId ? this.loadRepo.count({ where: { tenantId } as any }) : this.loadRepo.count(),
        tenantId ? this.truckRepo.count({ where: { tenantId } as any }) : this.truckRepo.count(),
        tenantId
          ? this.tripRepo.count({ where: { tenantId, status: 'COMPLETED' } as any })
          : this.tripRepo.count({ where: { status: 'COMPLETED' } as any }),
        tenantId
          ? this.tripRepo.count({ where: { tenantId, status: 'IN_PROGRESS' } as any })
          : this.tripRepo.count({ where: { status: 'IN_PROGRESS' } as any }),
        this.tripRepo.createQueryBuilder('t')
          .select('COALESCE(SUM(t.agreedPrice), 0)', 'sum')
          .where(tenantId ? 't.tenantId = :tenantId' : '1=1', tenantId ? { tenantId } : {})
          .getRawOne<{ sum: string }>(),
        // Weekly trip counts (last 8 weeks)
        this.tripRepo.manager.query(`
          SELECT DATE_TRUNC('week', "createdAt") AS week, COUNT(*) AS count
          FROM trips
          ${tenantId ? `WHERE "tenantId" = '${tenantId}'` : ''}
          GROUP BY week ORDER BY week DESC LIMIT 8
        `),
        // Monthly load counts (last 6 months)
        this.tripRepo.manager.query(`
          SELECT DATE_TRUNC('month', "createdAt") AS month, COUNT(*) AS count
          FROM loads
          ${tenantId ? `WHERE "tenantId" = '${tenantId}'` : ''}
          GROUP BY month ORDER BY month DESC LIMIT 6
        `),
      ]);

      const matchingEfficiency = totalTrips > 0
        ? Math.round((completedTrips / totalTrips) * 100)
        : 0;

      // Build weekly revenue trend (last 8 weeks)
      const weeklyRevenue = (recentTrips as any[]).reverse().map((r: any) => ({
        label: new Date(r.week).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        value: 0, // trips don't have per-week revenue easily; use count as proxy
        count: parseInt(r.count),
      }));

      return {
        stats: {
          totalRevenue: Number(totalRevenue?.sum || 0),
          totalUsers,
          totalTrips,
          totalLoads,
          totalTrucks,
          completedTrips,
          activeTrips,
          matchingEfficiency,
          alerts: 0,
        },
        weeklyTripCounts: weeklyRevenue,
        monthlyLoadCounts: (recentLoads as any[]).reverse().map((r: any) => ({
          label: new Date(r.month).toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
          count: parseInt(r.count),
        })),
      };
    } catch (error) {
      this.logger.error('Error in getAnalyticsOverview:', error);
      return { stats: {}, weeklyTripCounts: [], monthlyLoadCounts: [] };
    }
  }

  async getCargoAnalytics(tenantId?: string) {
    // Treat null/undefined/'null'/'undefined' as no filter (show all data)
    const safeTenantId = tenantId && tenantId !== 'null' && tenantId !== 'undefined' ? tenantId : undefined;
    try {
      const tenantFilter = safeTenantId ? `WHERE "tenantId" = '${safeTenantId}'` : '';
      const tenantAnd = safeTenantId ? `AND "tenantId" = '${safeTenantId}'` : '';

      const [
        totalLoads,
        statusBreakdown,
        cargoTypeBreakdown,
        monthlyLoads,
        avgValues,
      ] = await Promise.all([
        // Total count
        this.loadRepo.manager.query(
          `SELECT COUNT(*) AS count FROM loads ${tenantFilter}`
        ),
        // Status breakdown
        this.loadRepo.manager.query(
          `SELECT status, COUNT(*) AS count FROM loads ${tenantFilter} GROUP BY status ORDER BY count DESC`
        ),
        // Cargo type breakdown
        this.loadRepo.manager.query(
          `SELECT "cargoType", COUNT(*) AS count FROM loads ${tenantFilter} GROUP BY "cargoType" ORDER BY count DESC LIMIT 10`
        ),
        // Monthly loads + revenue (last 6 months)
        this.loadRepo.manager.query(
          `SELECT DATE_TRUNC('month', "createdAt") AS month,
                  COUNT(*) AS count,
                  COALESCE(SUM("offeredPrice"), 0) AS revenue,
                  COALESCE(SUM("loadValue"), 0) AS load_value
           FROM loads ${tenantFilter}
           GROUP BY month ORDER BY month DESC LIMIT 6`
        ),
        // Avg values
        this.loadRepo.manager.query(
          `SELECT COALESCE(AVG("loadValue"), 0) AS avg_load_value,
                  COALESCE(AVG("offeredPrice"), 0) AS avg_offered_price
           FROM loads ${tenantFilter}`
        ),
      ]);

      const total = parseInt(totalLoads[0]?.count || '0');

      // Build status map from real data
      const statusMap: Record<string, number> = {};
      (statusBreakdown as any[]).forEach(r => {
        statusMap[r.status] = parseInt(r.count);
      });

      // "Active" = loads in progress (ASSIGNED, LOADED, IN_TRANSIT, PUBLISHED)
      const activeStatuses = ['ASSIGNED', 'LOADED', 'IN_TRANSIT', 'PUBLISHED', 'PENDING_CONFIRMATION'];
      const activeLoads = activeStatuses.reduce((sum, s) => sum + (statusMap[s] || 0), 0);
      const completedLoads = (statusMap['COMPLETED'] || 0) + (statusMap['DELIVERED'] || 0) + (statusMap['CLOSED'] || 0);
      const cancelledLoads = statusMap['CANCELLED'] || 0;

      const bookingSuccessRate = total > 0
        ? Math.round((completedLoads / total) * 100)
        : 0;

      return {
        stats: {
          totalLoads: total,
          activeLoads,
          completedLoads,
          cancelledLoads,
          bookingSuccessRate,
          avgLoadValue: Number(avgValues[0]?.avg_load_value || 0),
          avgOfferedPrice: Number(avgValues[0]?.avg_offered_price || 0),
          statusBreakdown: statusMap,
        },
        cargoTypeBreakdown: (cargoTypeBreakdown as any[]).map(r => ({
          label: r.cargoType || 'UNKNOWN',
          count: parseInt(r.count),
        })),
        monthlyLoads: (monthlyLoads as any[]).reverse().map(r => ({
          label: new Date(r.month).toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
          count: parseInt(r.count),
          revenue: Number(r.revenue),
          loadValue: Number(r.load_value),
        })),
      };
    } catch (error) {
      this.logger.error('Error in getCargoAnalytics:', error.message, error.stack);
      return { stats: {}, cargoTypeBreakdown: [], monthlyLoads: [] };
    }
  }

  async getFleetAnalytics(tenantId?: string) {
    try {
      const tenantFilter = tenantId ? `WHERE "tenantId" = '${tenantId}'` : '';

      const [
        totalTrucks, statusBreakdown,
        totalTrips, tripStatusBreakdown,
        truckTypeBreakdown, monthlyTrips,
      ] = await Promise.all([
        this.truckRepo.manager.query(
          `SELECT COUNT(*) AS count FROM trucks ${tenantFilter}`
        ),
        this.truckRepo.manager.query(
          `SELECT status, COUNT(*) AS count FROM trucks ${tenantFilter} GROUP BY status`
        ),
        this.tripRepo.manager.query(
          `SELECT COUNT(*) AS count FROM trips ${tenantFilter}`
        ),
        this.tripRepo.manager.query(
          `SELECT status, COUNT(*) AS count FROM trips ${tenantFilter} GROUP BY status`
        ),
        this.truckRepo.manager.query(
          `SELECT "truckType", COUNT(*) AS count FROM trucks ${tenantFilter}
           GROUP BY "truckType" ORDER BY count DESC LIMIT 8`
        ),
        this.tripRepo.manager.query(
          `SELECT DATE_TRUNC('month', "createdAt") AS month,
                  COUNT(*) AS count,
                  COALESCE(SUM("agreedPrice"), 0) AS revenue
           FROM trips ${tenantFilter}
           GROUP BY month ORDER BY month DESC LIMIT 6`
        ),
      ]);

      const truckTotal = parseInt(totalTrucks[0]?.count || '0');
      const tripTotal = parseInt(totalTrips[0]?.count || '0');

      // Build status maps
      const truckStatusMap: Record<string, number> = {};
      (statusBreakdown as any[]).forEach(r => { truckStatusMap[r.status] = parseInt(r.count); });

      const tripStatusMap: Record<string, number> = {};
      (tripStatusBreakdown as any[]).forEach(r => { tripStatusMap[r.status] = parseInt(r.count); });

      const availableTrucks = truckStatusMap['AVAILABLE'] || 0;
      const inTransitTrucks = truckStatusMap['IN_TRANSIT'] || 0;
      const maintenanceTrucks = truckStatusMap['MAINTENANCE'] || 0;

      const completedTrips = (tripStatusMap['COMPLETED'] || 0) + (tripStatusMap['DELIVERED'] || 0);

      const utilizationRate = truckTotal > 0
        ? Math.round((inTransitTrucks / truckTotal) * 100)
        : 0;
      const tripSuccessRate = tripTotal > 0
        ? Math.round((completedTrips / tripTotal) * 100)
        : 0;

      return {
        stats: {
          totalTrucks: truckTotal,
          availableTrucks,
          inTransitTrucks,
          maintenanceTrucks,
          utilizationRate,
          totalTrips: tripTotal,
          completedTrips,
          tripSuccessRate,
          truckStatusBreakdown: truckStatusMap,
          tripStatusBreakdown: tripStatusMap,
        },
        truckTypeBreakdown: (truckTypeBreakdown as any[]).map(r => ({
          label: r.truckType || 'UNKNOWN',
          count: parseInt(r.count),
        })),
        monthlyTrips: (monthlyTrips as any[]).reverse().map(r => ({
          label: new Date(r.month).toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
          count: parseInt(r.count),
          revenue: Number(r.revenue),
        })),
      };
    } catch (error) {
      this.logger.error('Error in getFleetAnalytics:', error.message);
      return { stats: {}, truckTypeBreakdown: [], monthlyTrips: [] };
    }
  }

  async getSystemVitals() {
    try {
      const [
        totalUsers, totalTenants, totalTrips, totalLoads, totalTrucks,
        recentAuditLogs, dbHealthCheck,
      ] = await Promise.all([
        this.userRepo.count(),
        this.tenantRepo.count(),
        this.tripRepo.count(),
        this.loadRepo.count(),
        this.truckRepo.count(),
        this.auditRepo.find({ take: 5, order: { createdAt: 'DESC' } as any }),
        this.userRepo.manager.query('SELECT 1 AS ok').then(() => true).catch(() => false),
      ]);

      const memUsage = process.memoryUsage();
      const uptimeSeconds = process.uptime();

      return {
        system: {
          status: 'operational',
          uptime: uptimeSeconds,
          uptimeFormatted: `${Math.floor(uptimeSeconds / 3600)}h ${Math.floor((uptimeSeconds % 3600) / 60)}m`,
          nodeVersion: process.version,
          memoryUsedMB: Math.round(memUsage.heapUsed / 1024 / 1024),
          memoryTotalMB: Math.round(memUsage.heapTotal / 1024 / 1024),
          memoryPercent: Math.round((memUsage.heapUsed / memUsage.heapTotal) * 100),
        },
        database: {
          status: dbHealthCheck ? 'connected' : 'error',
          totalRecords: totalUsers + totalTrips + totalLoads + totalTrucks,
        },
        platform: {
          totalUsers,
          totalTenants,
          totalTrips,
          totalLoads,
          totalTrucks,
        },
        security: {
          sslActive: true,
          threatLevel: 'LOW',
          nodeHarmony: 99.2,
        },
        recentActivity: recentAuditLogs.map(log => ({
          id: log.id,
          action: (log as any).action || 'SYSTEM_EVENT',
          createdAt: log.createdAt,
        })),
      };
    } catch (error) {
      this.logger.error('Error in getSystemVitals:', error);
      return {
        system: { status: 'degraded', uptime: process.uptime() },
        database: { status: 'unknown' },
        platform: {},
        security: { sslActive: true, threatLevel: 'LOW', nodeHarmony: 0 },
        recentActivity: [],
      };
    }
  }

  async getEscrow(tenantId?: string) {
    try {
      // 1. Real escrow_accounts records
      let escrowQuery = this.userRepo.manager
        .createQueryBuilder()
        .select([
          'e.id            AS id',
          'e."tenantId"    AS "tenantId"',
          'e."tripId"      AS "tripId"',
          'e."loadId"      AS "loadId"',
          'e."payerId"     AS "payerId"',
          'e."payeeId"     AS "payeeId"',
          'e.status        AS status',
          'e."totalAmount" AS "totalAmount"',
          'e."fundedAmount" AS "fundedAmount"',
          'e."releasedAmount" AS "releasedAmount"',
          'e."currencyCode" AS "currencyCode"',
          'e."isDisputed"  AS "isDisputed"',
          'e."disputeId"   AS "disputeId"',
          'e."createdAt"   AS "createdAt"',
          'e."fundedAt"    AS "fundedAt"',
        ])
        .from('escrow_accounts', 'e');

      if (tenantId) {
        escrowQuery = escrowQuery.where('e."tenantId" = :tenantId', { tenantId });
      }

      const escrowRows = await escrowQuery.getRawMany();

      // 2. Trips with agreedPrice as synthetic escrow-like records
      let tripsQuery = this.tripRepo
        .createQueryBuilder('t')
        .select([
          't.id            AS id',
          't."tenantId"    AS "tenantId"',
          't."loadId"      AS "loadId"',
          't."truckId"     AS "truckId"',
          't."driverId"    AS "driverId"',
          't.status        AS status',
          't."agreedPrice" AS "agreedPrice"',
          't."currencyCode" AS "currencyCode"',
          't."createdAt"   AS "createdAt"',
          't."completedAt" AS "completedAt"',
        ])
        .where('t."agreedPrice" IS NOT NULL')
        .andWhere('t."agreedPrice" > 0')
        .orderBy('t."createdAt"', 'DESC')
        .limit(100);

      if (tenantId) {
        tripsQuery = tripsQuery.andWhere('t."tenantId" = :tenantId', { tenantId });
      }

      const tripRows = await tripsQuery.getRawMany();

      // Enrich trip rows with tenant/user names
      const tenantIds = [...new Set(tripRows.map(r => r.tenantId).filter(Boolean))];
      const tenants = tenantIds.length
        ? await this.tenantRepo.findByIds(tenantIds)
        : [];
      const tenantMap = new Map(tenants.map(t => [t.id, t]));

      const syntheticEscrows = tripRows.map(t => {
        const tenant = tenantMap.get(t.tenantId);
        // Map trip status → escrow status
        const statusMap: Record<string, string> = {
          COMPLETED: 'RELEASED',
          IN_PROGRESS: 'ACTIVE',
          PENDING: 'PENDING',
          CANCELLED: 'CANCELLED',
          DISPUTED: 'DISPUTED',
        };
        return {
          id: `TRIP-${t.id.slice(0, 8).toUpperCase()}`,
          source: 'trip',
          tripId: t.id,
          loadId: t.loadId,
          tenantId: t.tenantId,
          tenantName: tenant?.name || 'Unknown Tenant',
          cargoOwner: tenant?.name || 'Cargo Owner',
          truckOwner: 'Truck Owner',
          amount: parseFloat(t.agreedPrice) || 0,
          currency: t.currencyCode || 'USD',
          status: statusMap[t.status] || 'PENDING',
          releaseCondition: t.completedAt ? 'Delivery Confirmed' : 'Awaiting Delivery',
          releaseDate: t.completedAt || null,
          createdAt: t.createdAt,
          isDisputed: false,
        };
      });

      // Combine real escrow + synthetic from trips
      const allEscrow = [
        ...escrowRows.map(e => ({
          id: e.id,
          source: 'escrow',
          tripId: e.tripId,
          loadId: e.loadId,
          tenantId: e.tenantId,
          tenantName: 'Unknown',
          cargoOwner: e.payerId || 'Payer',
          truckOwner: e.payeeId || 'Payee',
          amount: parseFloat(e.totalAmount) || 0,
          currency: e.currencyCode || 'USD',
          status: e.status,
          releaseCondition: 'Delivery Confirmed',
          releaseDate: null,
          createdAt: e.createdAt,
          isDisputed: e.isDisputed,
        })),
        ...syntheticEscrows,
      ];

      // Stats
      const totalInEscrow = allEscrow
        .filter(e => ['ACTIVE', 'PENDING'].includes(e.status))
        .reduce((s, e) => s + e.amount, 0);

      return {
        escrowAccounts: allEscrow,
        stats: {
          totalInEscrow,
          totalAccounts: allEscrow.length,
          activeAccounts: allEscrow.filter(e => e.status === 'ACTIVE').length,
          pendingRelease: allEscrow.filter(e => e.status === 'PENDING').length,
          releasedAccounts: allEscrow.filter(e => e.status === 'RELEASED').length,
          disputedAccounts: allEscrow.filter(e => e.status === 'DISPUTED').length,
        },
      };
    } catch (error) {
      this.logger.error('Error fetching escrow data:', error);
      return {
        escrowAccounts: [],
        stats: {
          totalInEscrow: 0,
          totalAccounts: 0,
          activeAccounts: 0,
          pendingRelease: 0,
          releasedAccounts: 0,
          disputedAccounts: 0,
        },
      };
    }
  }

  private mapDisputeForAdmin(dispute: DisputeV2) {
    const latestResolution = [...(dispute.resolutions || [])].sort(
      (a, b) => new Date(b.resolvedAt).getTime() - new Date(a.resolvedAt).getTime(),
    )[0];

    return {
      id: dispute.id,
      tenantId: dispute.tenantId,
      tripId: dispute.tripId,
      raisedById: dispute.complainantUserId,
      status: dispute.status,
      reason: dispute.description || dispute.title,
      resolution: latestResolution?.resolutionSummary || dispute.additionalNotes,
      createdAt: dispute.createdAt,
      updatedAt: dispute.updatedAt,
      raisedBy: dispute.complainant
        ? {
            id: dispute.complainant.id,
            email: dispute.complainant.email,
            firstName: dispute.complainant.profile?.firstName,
            lastName: dispute.complainant.profile?.lastName,
            role: dispute.complainant.role,
          }
        : undefined,
      trip: dispute.trip
        ? {
            id: dispute.trip.id,
            tripNumber: dispute.trip.tripNumber,
            agreedPrice: dispute.trip.agreedPrice,
            status: dispute.trip.status,
          }
        : undefined,
    };
  }

  async getDisputes(tenantId: string) {
    const disputes = await this.disputeRepo.find({
      where: tenantId ? ({ tenantId } as any) : {},
      relations: ['complainant', 'complainant.profile', 'trip', 'resolutions'],
      take: 200,
      order: { createdAt: 'DESC' } as any,
    });
    return { disputes: disputes.map((dispute) => this.mapDisputeForAdmin(dispute)) };
  }

  async updateDisputeStatus(
    disputeId: string,
    status: string,
    resolution?: string,
  ) {
    const dispute = await this.disputeRepo.findOne({
      where: { id: disputeId } as any,
      relations: ['complainant', 'complainant.profile', 'trip', 'resolutions'],
    });
    if (!dispute) {
      throw new Error('Dispute not found');
    }
    dispute.status = status as DisputeStatusV2;
    if (status === DisputeStatusV2.RESOLVED) {
      dispute.resolvedAt = new Date();
    }
    if (resolution) {
      dispute.additionalNotes = resolution;
    }
    const saved = await this.disputeRepo.save(dispute);
    return { dispute: this.mapDisputeForAdmin(saved) };
  }

  async getAudit(tenantId: string) {
    const logs = await this.auditRepo.find({
      where: { tenantId } as any,
      take: 100,
      order: { createdAt: 'DESC' } as any,
    });
    return { logs };
  }

  async getTenants() {
    const tenants = await this.tenantRepo.find({
      take: 100,
      order: { createdAt: 'DESC' } as any,
    });
    return { tenants };
  }

  // Admin-wide listings (no tenant filter or optional filter)
  async listAllTrucks(tenantId?: string) {
    try {
      this.logger.log(`🚛 listAllTrucks called with tenantId: ${tenantId || 'none'}`);
      
      const where = tenantId ? ({ tenantId } as any) : ({} as any);
      
      // Use query builder to include soft-deleted records if needed
      const queryBuilder = this.truckRepo.createQueryBuilder('truck')
        .withDeleted() // Include soft-deleted records
        .orderBy('truck.createdAt', 'DESC')
        .take(500);
      
      if (tenantId) {
        queryBuilder.where('truck.tenantId = :tenantId', { tenantId });
      }
      
      this.logger.log(`🔍 Executing query...`);
      const trucks = await queryBuilder.getMany();

      this.logger.log(`✅ Found ${trucks.length} trucks in database`);
      
      if (trucks.length === 0) {
        this.logger.warn('⚠️  No trucks found! Checking database directly...');
        // Try a raw query to see if trucks exist
        const rawCount = await this.truckRepo.query('SELECT COUNT(*) as count FROM trucks');
        this.logger.warn(`📊 Raw count from database: ${rawCount[0]?.count || 0}`);
      }

      // Get all unique tenant IDs and owner IDs
      const tenantIds = [...new Set(trucks.map(t => t.tenantId).filter(Boolean))];
      const ownerIds = [...new Set(trucks.map(t => t.ownerId).filter(Boolean))];
      const driverIds = [...new Set(trucks.map(t => t.currentDriverId).filter(Boolean))];

      this.logger.log(`📋 Fetching related data: ${tenantIds.length} tenants, ${ownerIds.length} owners, ${driverIds.length} drivers`);

      // Fetch tenants, owners, and drivers in parallel
      const [tenants, owners, drivers] = await Promise.all([
        tenantIds.length > 0 
          ? this.tenantRepo.findByIds(tenantIds)
          : Promise.resolve([]),
        ownerIds.length > 0 
          ? this.userRepo.findByIds(ownerIds)
          : Promise.resolve([]),
        driverIds.length > 0 
          ? this.userRepo.findByIds(driverIds)
          : Promise.resolve([]),
      ]);

      // Create lookup maps for quick access
      const tenantMap = new Map(tenants.map(t => [t.id, t]));
      const ownerMap = new Map(owners.map(o => [o.id, o]));
      const driverMap = new Map(drivers.map(d => [d.id, d]));

      // Format trucks with all related data
      const formattedTrucks = trucks.map(truck => {
        let locationString = null;
        let coordinates = null;

        // Parse PostGIS Point object if it exists
        if (truck.currentLocation) {
          try {
            const loc = truck.currentLocation as any;
            if (loc.coordinates && Array.isArray(loc.coordinates)) {
              const [lng, lat] = loc.coordinates;
              coordinates = { latitude: lat, longitude: lng };
              locationString = `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
            }
          } catch (error) {
            this.logger.warn(`Failed to parse location for truck ${truck.id}:`, error);
          }
        }

        // Get related entities
        const tenant = truck.tenantId ? tenantMap.get(truck.tenantId) : null;
        const owner = truck.ownerId ? ownerMap.get(truck.ownerId) : null;
        const driver = truck.currentDriverId ? driverMap.get(truck.currentDriverId) : null;

        // Get current driver from assignedDrivers array
        let currentDriverInfo = null;
        if (truck.assignedDrivers && Array.isArray(truck.assignedDrivers)) {
          // Find the active driver assignment
          const activeAssignment = truck.assignedDrivers.find(
            (assignment: any) => assignment.status === 'active'
          );
          if (activeAssignment) {
            currentDriverInfo = {
              id: activeAssignment.driverId,
              name: activeAssignment.driverName,
              assignmentDate: activeAssignment.assignmentDate,
              notes: activeAssignment.notes,
            };
          }
        }

        // Fallback to currentDriver relation if no active assignment found
        if (!currentDriverInfo && driver) {
          currentDriverInfo = {
            id: driver.id,
            name: `${driver.firstName || ''} ${driver.lastName || ''}`.trim() || driver.email,
            assignmentDate: null,
            notes: null,
          };
        }

        return {
          ...toPublicTruck(truck),
          currentLocationString: locationString,
          coordinates,
          // Tenant information
          tenant: tenant ? {
            id: tenant.id,
            name: tenant.name,
            subdomain: tenant.subdomain,
            status: tenant.status,
            type: tenant.type,
          } : null,
          tenantName: tenant?.name || 'Unknown Tenant',
          // Owner information
          owner: owner ? {
            id: owner.id,
            email: owner.email,
            firstName: owner.firstName,
            lastName: owner.lastName,
            phoneNumber: owner.phoneNumber,
            role: owner.role,
          } : null,
          ownerName: owner 
            ? `${owner.firstName || ''} ${owner.lastName || ''}`.trim() || owner.email
            : 'No Owner',
          ownerEmail: owner?.email || null,
          ownerPhone: owner?.phoneNumber || null,
          // Driver information (updated to use assignedDrivers)
          driver: currentDriverInfo,
          currentDriverName: currentDriverInfo?.name || null,
          currentDriverId: currentDriverInfo?.id || truck.currentDriverId || null,
          currentDriverPhone: driver?.phoneNumber || null,
          // Include assignedDrivers for additional context
          assignedDrivers: truck.assignedDrivers || [],
        };
      });

      this.logger.log(`✅ Returning ${formattedTrucks.length} formatted trucks`);
      return { trucks: formattedTrucks };
    } catch (error) {
      this.logger.error('❌ Error fetching trucks:', error);
      this.logger.error('Error stack:', error.stack);
      // Return empty array instead of throwing to prevent 500 errors
      return { trucks: [] };
    }
  }

  async listAllLoads(tenantId?: string) {
    const where = tenantId ? ({ tenantId } as any) : ({} as any);
    const loads = await this.loadRepo.find({
      where,
      take: 500,
      order: { createdAt: 'DESC' } as any,
    });
    return { loads };
  }

  async listAllTrips(tenantId?: string) {
    const where = tenantId ? ({ tenantId } as any) : ({} as any);
    const trips = await this.tripRepo.find({
      where,
      relations: ['load', 'truck', 'driver'],
      take: 500,
      order: { createdAt: 'DESC' } as any,
    });
    return { trips };
  }

  async listAllUsers(tenantId?: string) {
    const where = tenantId ? ({ tenantId } as any) : ({} as any);
    const users = await this.userRepo.find({
      where,
      relations: ['profile'],
      take: 500,
      order: { createdAt: 'DESC' } as any,
    });
    return { users };
  }

  async updateUser(
    userId: string,
    updateData: {
      email?: string;
      tenantId?: string;
      firstName?: string;
      lastName?: string;
      phone?: string;
      companyName?: string;
      role?: string;
      status?: string;
    },
  ) {
    const user = await this.userRepo.findOne({
      where: { id: userId },
      relations: ['profile'],
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Update user fields
    if (updateData.email !== undefined) {
      user.email = updateData.email;
    }
    if (updateData.tenantId !== undefined) {
      user.tenantId = updateData.tenantId;
    }
    if (updateData.phone !== undefined) {
      user.phone = updateData.phone;
    }
    if (updateData.role !== undefined) {
      user.role = updateData.role as any;
    }
    if (updateData.status !== undefined) {
      user.status = updateData.status as any;
    }

    // Update profile fields
    if (user.profile) {
      if (updateData.firstName !== undefined) {
        user.profile.firstName = updateData.firstName;
      }
      if (updateData.lastName !== undefined) {
        user.profile.lastName = updateData.lastName;
      }
      if (updateData.companyName !== undefined) {
        user.profile.companyName = updateData.companyName;
      }
    }

    await this.userRepo.save(user);

    return {
      success: true,
      message: 'User updated successfully',
      user,
    };
  }

  async deleteUser(userId: string) {
    const user = await this.userRepo.findOne({ where: { id: userId } });

    if (!user) {
      throw new Error('User not found');
    }

    await this.userRepo.remove(user);

    return {
      success: true,
      message: 'User deleted successfully',
    };
  }

  async activateUser(userId: string) {
    const user = await this.userRepo.findOne({ where: { id: userId } });

    if (!user) {
      throw new Error('User not found');
    }

    user.status = 'ACTIVE' as any;
    await this.userRepo.save(user);

    return {
      success: true,
      message: 'User activated successfully',
      user,
    };
  }

  async suspendUser(userId: string, reason?: string) {
    const user = await this.userRepo.findOne({ where: { id: userId } });

    if (!user) {
      throw new Error('User not found');
    }

    user.status = 'SUSPENDED' as any;
    await this.userRepo.save(user);

    // TODO: Log suspension reason in audit log

    return {
      success: true,
      message: 'User suspended successfully',
      user,
    };
  }

  /**
   * Get subscription plan limits
   */
  private getSubscriptionLimits(plan: SubscriptionPlan = SubscriptionPlan.STARTER) {
    const limits = {
      [SubscriptionPlan.STARTER]: {
        maxUsers: 10,
        maxTrucks: 5,
        maxDrivers: 10,
        maxLoadsPerMonth: 100,
      },
      [SubscriptionPlan.PROFESSIONAL]: {
        maxUsers: 50,
        maxTrucks: 25,
        maxDrivers: 50,
        maxLoadsPerMonth: 1000,
      },
      [SubscriptionPlan.ENTERPRISE]: {
        maxUsers: null, // unlimited
        maxTrucks: null, // unlimited
        maxDrivers: null, // unlimited
        maxLoadsPerMonth: null, // unlimited
      },
    };

    return limits[plan] || limits[SubscriptionPlan.STARTER];
  }

  /**
   * Generate domain from subdomain
   * If subdomain already contains dots (full domain), use it as-is
   * Otherwise, append the base domain
   */
  private generateDomain(subdomain: string): string {
    // If subdomain already contains dots, it's a full domain - use as-is
    if (subdomain.includes('.')) {
      return subdomain.toLowerCase();
    }
    // Otherwise, append the base domain
    const baseDomain = process.env.TENANT_BASE_DOMAIN || 'urutix.com';
    return `${subdomain.toLowerCase()}.${baseDomain}`;
  }

  /**
   * Create a new tenant with admin user
   */
  async createTenant(createTenantDto: CreateTenantDto) {
    this.logger.log(`Creating tenant: ${createTenantDto.name} (${createTenantDto.subdomain})`);

    // Normalize subdomain (lowercase, trim)
    const normalizedSubdomain = createTenantDto.subdomain.toLowerCase().trim();

    // Check if subdomain already exists
    const existingTenant = await this.tenantRepo.findOne({
      where: { subdomain: normalizedSubdomain },
    });

    if (existingTenant) {
      throw new ConflictException(
        `Subdomain '${normalizedSubdomain}' is already taken. Please choose a different subdomain.`,
      );
    }

    // Check if email is already used by another tenant admin
    const existingUser = await this.userRepo.findOne({
      where: { email: createTenantDto.contactEmail },
    });

    if (existingUser) {
      throw new ConflictException(
        `Email '${createTenantDto.contactEmail}' is already registered. Please use a different email.`,
      );
    }

    // Use provided domain or generate from subdomain
    const domain = createTenantDto.domain?.trim() || this.generateDomain(normalizedSubdomain);

    // Get subscription plan limits
    const plan = createTenantDto.plan || SubscriptionPlan.STARTER;
    const limits = this.getSubscriptionLimits(plan);

    // Calculate trial end date (30 days from now)
    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + 30);

    // Create tenant entity
    const tenant = this.tenantRepo.create({
      name: createTenantDto.name.trim(),
      subdomain: normalizedSubdomain,
      domain,
      type: TenantType.SMALL_BUSINESS, // Default type, can be updated later
      status: TenantStatus.ACTIVE,
      description: createTenantDto.description?.trim(),
      contactEmail: createTenantDto.contactEmail.toLowerCase().trim(),
      contactPhone: createTenantDto.contactPhone?.trim(),
      address: createTenantDto.address?.trim(),
      city: createTenantDto.city?.trim(),
      state: createTenantDto.state?.trim(),
      country: createTenantDto.country?.trim(),
      postalCode: createTenantDto.postalCode?.trim(),
      websiteUrl: createTenantDto.websiteUrl?.trim(),
      subscriptionPlan: plan,
      maxUsers: limits.maxUsers,
      maxTrucks: limits.maxTrucks,
      maxDrivers: limits.maxDrivers,
      maxLoadsPerMonth: limits.maxLoadsPerMonth,
      trialEndsAt,
      isActive: true, // Automatically active since created by super admin
      settings: {
        timezone: 'UTC',
        language: 'en',
        currency: 'USD',
        dateFormat: 'MM/DD/YYYY',
      },
      features: {
        loads: true,
        tracking: true,
        payments: plan !== SubscriptionPlan.STARTER,
        analytics: plan !== SubscriptionPlan.STARTER,
        api_access: plan === SubscriptionPlan.ENTERPRISE,
        multi_user: true,
        fleet_management: true,
      },
      billingInfo: {
        plan,
        billing_cycle: 'monthly',
        payment_method: null,
      },
    });

    // Save tenant
    const savedTenant = await this.tenantRepo.save(tenant);
    this.logger.log(`Tenant created with ID: ${savedTenant.id}`);

    this.eventEmitter.emit('system.admin.tenant_created', {
      tenantId: savedTenant.id,
      tenantName: savedTenant.name,
      subdomain: savedTenant.subdomain,
      contactEmail: savedTenant.contactEmail,
      plan: savedTenant.subscriptionPlan,
      actorRole: 'SUPER_ADMIN',
    });

    return {
      tenant: savedTenant,
    };
  }

  // Create route for a tenant
  async createRouteForTenant(tenantId: string, data: Partial<FleetRoute>) {
    const route = this.routeRepo.create({ ...data, tenantId });
    const saved = await this.routeRepo.save(route);
    return { route: saved };
  }

  /**
   * getDashboardCharts
   *
   * Returns all chart-level data needed by the admin-operational overview page,
   * scoped strictly to the caller's tenant:
   *   - revenueAndTrips  : last N days of (revenue, trip count) per day
   *   - loadStatus       : load count per status group for the donut chart
   *   - bidActivity      : bid count per day for last 7 days (bar chart)
   *   - recentActivity   : last 10 audit-log events for the activity feed
   *   - kpi              : top-line numbers for the stat cards
   */
  async getDashboardCharts(tenantId: string, days: number = 7) {
    const safeTenantId = tenantId;

    try {
      // ── 1. Revenue & Trips per day (last `days` days) ─────────────────────
      const revenueRows: Array<{ day: string; revenue: string; trips: string }> =
        await this.tripRepo.manager.query(
          `SELECT
             TO_CHAR(DATE_TRUNC('day', t."createdAt"), 'Dy') AS day,
             COALESCE(SUM(CAST(t."agreedPrice" AS NUMERIC)), 0)  AS revenue,
             COUNT(*)                                            AS trips
           FROM trips t
           WHERE t."tenantId" = $1
             AND t."createdAt" >= NOW() - ($2 || ' days')::INTERVAL
           GROUP BY DATE_TRUNC('day', t."createdAt")
           ORDER BY DATE_TRUNC('day', t."createdAt") ASC`,
          [safeTenantId, days],
        );

      const revenueAndTrips = revenueRows.map(r => ({
        day: r.day,
        revenue: Number(r.revenue),
        trips: Number(r.trips),
      }));

      // ── 2. Load status distribution ───────────────────────────────────────
      const loadStatusRows: Array<{ status: string; count: string }> =
        await this.loadRepo.manager.query(
          `SELECT status, COUNT(*) AS count
           FROM loads
           WHERE "tenantId" = $1
           GROUP BY status`,
          [safeTenantId],
        );

      // Group into 4 meaningful buckets for the donut chart
      const statusMap: Record<string, number> = {};
      loadStatusRows.forEach(r => { statusMap[r.status] = Number(r.count); });

      const inTransit =
        (statusMap['IN_TRANSIT'] || 0) +
        (statusMap['ASSIGNED'] || 0) +
        (statusMap['LOADED'] || 0);
      const pending =
        (statusMap['CREATED'] || 0) +
        (statusMap['PUBLISHED'] || 0) +
        (statusMap['DRAFT'] || 0) +
        (statusMap['PENDING_CONFIRMATION'] || 0);
      const delivered =
        (statusMap['DELIVERED'] || 0) +
        (statusMap['COMPLETED'] || 0) +
        (statusMap['CLOSED'] || 0);
      const disputed = statusMap['DISPUTED'] || 0;

      const loadStatus = [
        { name: 'In Transit', value: inTransit,  color: '#3b82f6' },
        { name: 'Pending',    value: pending,     color: '#f59e0b' },
        { name: 'Delivered',  value: delivered,   color: '#10b981' },
        { name: 'Disputed',   value: disputed,    color: '#ef4444' },
      ].filter(item => item.value > 0);

      // ── 3. Bid activity — last 7 days ──────────────────────────────────────
      // Bids are linked to loads which carry tenantId, so we JOIN through loads
      const bidRows: Array<{ day: string; label: string; bids: string }> =
        await this.loadRepo.manager.query(
          `SELECT
             DATE_TRUNC('day', b."createdAt")                              AS day,
             TO_CHAR(DATE_TRUNC('day', b."createdAt"), 'Dy')               AS label,
             COUNT(*)                                                       AS bids
           FROM bids b
           JOIN loads l ON l.id = b."loadId"
           WHERE l."tenantId" = $1
             AND b."createdAt" >= NOW() - INTERVAL '7 days'
           GROUP BY DATE_TRUNC('day', b."createdAt")
           ORDER BY day ASC`,
          [safeTenantId],
        );

      // Fill in any missing days with 0
      const bidActivity = this.fillMissingDays(
        bidRows.map(r => ({ day: r.day, label: r.label, bids: Number(r.bids) })),
        7,
      );

      // ── 4. Recent activity from audit logs ────────────────────────────────
      const auditRows = await this.auditRepo.find({
        where: { tenantId: safeTenantId } as any,
        order: { createdAt: 'DESC' } as any,
        take: 10,
      });

      const DOT_COLOR: Record<string, string> = {
        DISPUTE:  'bg-orange-500',
        PAYMENT:  'bg-emerald-500',
        BID:      'bg-blue-500',
        LOAD:     'bg-purple-500',
        TRIP:     'bg-slate-400',
        DEFAULT:  'bg-gray-400',
      };

      const recentActivity = auditRows.map(log => {
        const action: string = ((log as any).action || 'DEFAULT').toUpperCase();
        const typeKey = Object.keys(DOT_COLOR).find(k => action.includes(k)) || 'DEFAULT';
        return {
          dot: DOT_COLOR[typeKey],
          title: this.formatAuditTitle(action),
          sub: (log as any).details || (log as any).entityId || '',
          time: this.timeAgo(log.createdAt),
          type: typeKey.toLowerCase(),
        };
      });

      // ── 5. KPI top-line numbers ───────────────────────────────────────────
      const [activeTrips, openLoads, openDisputes, totalRevRow, currencyRow] = await Promise.all([
        this.tripRepo.count({ where: { tenantId: safeTenantId, status: 'IN_PROGRESS' } as any }),
        this.loadRepo.count({ where: { tenantId: safeTenantId, status: 'PUBLISHED' } as any }),
        this.disputeRepo.count({ where: { tenantId: safeTenantId, status: 'OPEN' } as any }),
        this.tripRepo.manager.query(
          `SELECT COALESCE(SUM(CAST("agreedPrice" AS NUMERIC)), 0) AS total
           FROM trips WHERE "tenantId" = $1
             AND DATE_TRUNC('day', "createdAt") = DATE_TRUNC('day', NOW())`,
          [safeTenantId],
        ),
        // Most-used currency for this tenant's trips
        this.tripRepo.manager.query(
          `SELECT "currencyCode", COUNT(*) AS cnt
           FROM trips WHERE "tenantId" = $1 AND "currencyCode" IS NOT NULL
           GROUP BY "currencyCode" ORDER BY cnt DESC LIMIT 1`,
          [safeTenantId],
        ),
      ]);

      const currency = currencyRow[0]?.currencyCode || 'USD';

      const kpi = {
        activeTrips,
        openLoads,
        openDisputes,
        revenueToday: Number(totalRevRow[0]?.total || 0),
        currency,
      };

      return { revenueAndTrips, loadStatus, bidActivity, recentActivity, kpi };
    } catch (err) {
      this.logger.error('getDashboardCharts error:', err.message);
      return {
        revenueAndTrips: [],
        loadStatus: [],
        bidActivity: [],
        recentActivity: [],
        kpi: { activeTrips: 0, openLoads: 0, openDisputes: 0, revenueToday: 0 },
      };
    }
  }

  /** Fill missing days in a time series so charts always show N bars */
  private fillMissingDays(
    rows: Array<{ day: string | Date; label: string; bids: number }>,
    n: number,
  ) {
    const result: Array<{ label: string; bids: number }> = [];
    for (let i = n - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const iso = d.toISOString().split('T')[0];
      const label = d.toLocaleDateString('en-US', { weekday: 'short' });
      const found = rows.find(r => {
        const rowDay = typeof r.day === 'string' ? r.day.split('T')[0] : r.day.toISOString().split('T')[0];
        return rowDay === iso;
      });
      result.push({ label: found?.label || label, bids: found?.bids || 0 });
    }
    return result;
  }

  /** Human-readable title from an audit action string */
  private formatAuditTitle(action: string): string {
    return action
      .toLowerCase()
      .replace(/_/g, ' ')
      .replace(/\b\w/g, c => c.toUpperCase());
  }

  /** Relative time string */
  private timeAgo(date: Date): string {
    const diff = Date.now() - new Date(date).getTime();
    const mins  = Math.floor(diff / 60_000);
    const hours = Math.floor(diff / 3_600_000);
    const days  = Math.floor(diff / 86_400_000);
    if (mins < 1)  return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  }
}
