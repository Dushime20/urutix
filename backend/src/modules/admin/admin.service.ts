import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../entities/user.entity';
import { Payment } from '../../entities/payment.entity';
import { Notification } from '../../entities/notification.entity';
import { Tenant } from '../../entities/tenant.entity';
import { Dispute } from '../../entities/dispute.entity';
import { AuditLog } from '../../entities/audit-log.entity';
import { Trip } from '../../entities/trip.entity';
import { Load } from '../../entities/load.entity';
import { Truck } from '../../entities/truck.entity';
import { Route as FleetRoute } from '../../entities/route.entity';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    @InjectRepository(Payment)
    private readonly paymentRepo: Repository<Payment>,
    @InjectRepository(Notification)
    private readonly notificationRepo: Repository<Notification>,
    @InjectRepository(Tenant) private readonly tenantRepo: Repository<Tenant>,
    @InjectRepository(Dispute)
    private readonly disputeRepo: Repository<Dispute>,
    @InjectRepository(AuditLog)
    private readonly auditRepo: Repository<AuditLog>,
    @InjectRepository(Trip) private readonly tripRepo: Repository<Trip>,
    @InjectRepository(Load) private readonly loadRepo: Repository<Load>,
    @InjectRepository(Truck) private readonly truckRepo: Repository<Truck>,
    @InjectRepository(FleetRoute)
    private readonly routeRepo: Repository<FleetRoute>,
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

  async getKpi(tenantId: string) {
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
  }

  async getAnalytics(tenantId: string) {
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
  }

  async getUsers(tenantId: string) {
    const users = await this.userRepo.find({
      where: { tenantId } as any,
      take: 100,
      order: { createdAt: 'DESC' } as any,
    });
    return { users };
  }

  async getFinancials(tenantId: string) {
    const total = await this.paymentRepo
      .createQueryBuilder('p')
      .select('COALESCE(SUM(p.amount),0)', 'sum')
      .where('p.tenantId = :tenantId', { tenantId })
      .getRawOne<{ sum: string }>();
    return { totalRevenue: Number(total?.sum || 0) };
  }

  async getHealth() {
    // Simple stubbed health; could be expanded with DB ping etc.
    return { status: 'ok', uptime: process.uptime() };
  }

  async getDisputes(tenantId: string) {
    const disputes = await this.disputeRepo.find({
      where: { tenantId } as any,
      take: 50,
      order: { createdAt: 'DESC' } as any,
    });
    return { disputes };
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
    const where = tenantId ? ({ tenantId } as any) : ({} as any);
    const trucks = await this.truckRepo.find({
      where,
      take: 500,
      order: { createdAt: 'DESC' } as any,
    });
    return { trucks };
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
      take: 500,
      order: { createdAt: 'DESC' } as any,
    });
    return { trips };
  }

  async listAllUsers(tenantId?: string) {
    const where = tenantId ? ({ tenantId } as any) : ({} as any);
    const users = await this.userRepo.find({
      where,
      take: 500,
      order: { createdAt: 'DESC' } as any,
    });
    return { users };
  }

  // Create tenant
  async createTenant(data: Partial<Tenant>) {
    const t = this.tenantRepo.create({ ...data, isActive: true });
    const saved = await this.tenantRepo.save(t);
    return { tenant: saved };
  }

  // Create route for a tenant
  async createRouteForTenant(tenantId: string, data: Partial<FleetRoute>) {
    const route = this.routeRepo.create({ ...data, tenantId });
    const saved = await this.routeRepo.save(route);
    return { route: saved };
  }
}
