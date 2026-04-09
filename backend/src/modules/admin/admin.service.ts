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

        return {
          ...truck,
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
          // Driver information
          driver: driver ? {
            id: driver.id,
            email: driver.email,
            firstName: driver.firstName,
            lastName: driver.lastName,
            phoneNumber: driver.phoneNumber,
          } : null,
          currentDriverName: driver 
            ? `${driver.firstName || ''} ${driver.lastName || ''}`.trim() || driver.email
            : null,
          currentDriverPhone: driver?.phoneNumber || null,
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
      // If password is provided, we'll need to handle it differently
      // For now, we'll use email-based password setup regardless
      // TODO: Add support for direct password setting if adminPassword is provided
      const adminUser = await this.usersService.createTenantAdminUser(
        savedTenant.id,
        {
          email: createTenantDto.contactEmail.toLowerCase().trim(),
          firstName: createTenantDto.adminFirstName.trim(),
          lastName: createTenantDto.adminLastName.trim(),
          companyName: createTenantDto.companyName?.trim() || createTenantDto.name.trim(),
          phoneNumber: createTenantDto.contactPhone?.trim(),
          // Note: adminPassword from DTO is ignored - user will receive email to set password
          sendPasswordSetupEmail: true, // Ensure email is sent
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
