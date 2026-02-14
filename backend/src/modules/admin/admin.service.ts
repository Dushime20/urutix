import {
  Injectable,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../entities/user.entity';
import { Payment } from '../../entities/payment.entity';
import { Notification } from '../../entities/notification.entity';
import { Tenant, TenantStatus, TenantType } from '../../entities/tenant.entity';
import { Dispute } from '../../entities/dispute.entity';
import { AuditLog } from '../../entities/audit-log.entity';
import { Trip } from '../../entities/trip.entity';
import { Load } from '../../entities/load.entity';
import { Truck } from '../../entities/truck.entity';
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
    @InjectRepository(Dispute)
    private readonly disputeRepo: Repository<Dispute>,
    @InjectRepository(AuditLog)
    private readonly auditRepo: Repository<AuditLog>,
    @InjectRepository(Trip) private readonly tripRepo: Repository<Trip>,
    @InjectRepository(Load) private readonly loadRepo: Repository<Load>,
    @InjectRepository(Truck) private readonly truckRepo: Repository<Truck>,
    @InjectRepository(FleetRoute)
    private readonly routeRepo: Repository<FleetRoute>,
    private readonly usersService: UsersService,
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
      relations: ['owner'], // Removed 'currentDriver' as it doesn't exist
      take: 500,
      // Removed createdAt ordering as it may not exist on trucks table
    });

    // Format trucks with readable location data
    const formattedTrucks = trucks.map(truck => {
      let locationString = null;
      let coordinates = null;

      // Parse PostGIS Point object if it exists
      if (truck.currentLocation) {
        try {
          // PostGIS returns location as { type: 'Point', coordinates: [lng, lat] }
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

      return {
        ...truck,
        currentLocationString: locationString,
        coordinates,
        ownerName: truck.owner ? `${(truck.owner as any).firstName || ''} ${(truck.owner as any).lastName || ''}`.trim() : null,
        currentDriverName: null, // TODO: Load driver relation if needed
      };
    });

    return { trucks: formattedTrucks };
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
      relations: ['profile'],
      take: 500,
      order: { createdAt: 'DESC' } as any,
    });
    return { users };
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
      status: TenantStatus.PENDING_ACTIVATION,
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
      isActive: false, // Will be activated after approval
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

    try {
      // Create tenant admin user
      const adminUser = await this.usersService.createTenantAdminUser(
        savedTenant.id,
        {
          email: createTenantDto.contactEmail.toLowerCase().trim(),
          password: createTenantDto.adminPassword,
          firstName: createTenantDto.adminFirstName.trim(),
          lastName: createTenantDto.adminLastName.trim(),
          companyName: createTenantDto.companyName?.trim() || createTenantDto.name.trim(),
          phoneNumber: createTenantDto.contactPhone?.trim(),
        },
      );

      this.logger.log(`Tenant admin user created with ID: ${adminUser.id}`);

      // Return tenant with admin user info (without password)
      return {
        tenant: {
          ...savedTenant,
          // Remove sensitive fields if any
        },
        adminUser: {
          id: adminUser.id,
          email: adminUser.email,
          firstName: createTenantDto.adminFirstName,
          lastName: createTenantDto.adminLastName,
          role: adminUser.role,
        },
      };
    } catch (error) {
      // If admin user creation fails, rollback tenant creation
      this.logger.error(
        `Failed to create admin user for tenant ${savedTenant.id}. Rolling back tenant creation.`,
        error,
      );
      await this.tenantRepo.remove(savedTenant);
      throw new BadRequestException(
        `Failed to create tenant admin user: ${error.message}`,
      );
    }
  }

  // Create route for a tenant
  async createRouteForTenant(tenantId: string, data: Partial<FleetRoute>) {
    const route = this.routeRepo.create({ ...data, tenantId });
    const saved = await this.routeRepo.save(route);
    return { route: saved };
  }
}
