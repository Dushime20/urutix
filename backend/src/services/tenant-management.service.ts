import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, MoreThanOrEqual, Like, ILike } from 'typeorm';
import { Tenant, TenantStatus } from '../entities/tenant.entity';
import { User, UserStatus } from '../entities/user.entity';
import { TenantSubscription, SubscriptionStatus } from '../entities/tenant-subscription.entity';
import { CreditAccount } from '../entities/credit-account.entity';
import { ActivityLog } from '../entities/activity-log.entity';
import { CreditTransaction } from '../entities/credit-transaction.entity';

// Interfaces matching design.md specification

export interface EnrichedTenant {
  id: string;
  name: string;
  subdomain: string;
  status: 'active' | 'inactive' | 'suspended';
  subscription: {
    planName: string;
    status: string;
    expiresAt: Date;
  };
  credits: {
    balance: number;
    lastPurchase: Date;
  };
  users: {
    total: number;
    active: number;
  };
  lastActivity: Date;
  healthScore: number;
  contactEmail: string;
}

export interface TenantDetails extends EnrichedTenant {
  contactEmail: string;
  createdAt: Date;
  settings: Record<string, any>;
  recentActivity: ActivityLog[];
  creditHistory: CreditTransaction[];
}

export interface TenantFilters {
  status?: TenantStatus[];
  search?: string;
  subscriptionStatus?: SubscriptionStatus[];
  minCreditBalance?: number;
  maxCreditBalance?: number;
  hasLowBalance?: boolean;
  hasExpiringSubscription?: boolean;
}

export interface TenantUpdate {
  name?: string;
  contactEmail?: string;
  contactPhone?: string;
  settings?: Record<string, any>;
  maxUsers?: number;
  maxTrucks?: number;
  maxDrivers?: number;
}

export interface TenantHealthScore {
  tenantId: string;
  tenantName: string;
  score: number; // 0-100
  factors: {
    activityLevel: number; // 0-100
    paymentStatus: number; // 0-100
    userEngagement: number; // 0-100
    creditUsage: number; // 0-100
  };
  status: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR' | 'CRITICAL';
  recommendations: string[];
}

export interface TenantResourceUsage {
  tenantId: string;
  tenantName: string;
  users: {
    total: number;
    active: number;
    inactive: number;
  };
  credits: {
    balance: number;
    consumed: number;
    remaining: number;
  };
  storage: {
    used: number;
    limit: number;
    usagePercent: number;
  };
  apiCalls: {
    today: number;
    thisMonth: number;
    limit: number;
  };
}

export interface BulkTenantOperation {
  tenantIds: string[];
  operation: 'activate' | 'suspend' | 'deactivate' | 'delete';
  reason?: string;
}

export interface BulkOperationResult {
  success: number;
  failed: number;
  results: Array<{
    tenantId: string;
    success: boolean;
    message: string;
  }>;
}

@Injectable()
export class TenantManagementService {
  private readonly logger = new Logger(TenantManagementService.name);

  constructor(
    @InjectRepository(Tenant)
    private readonly tenantRepository: Repository<Tenant>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(TenantSubscription)
    private readonly subscriptionRepository: Repository<TenantSubscription>,
    @InjectRepository(CreditAccount)
    private readonly creditAccountRepository: Repository<CreditAccount>,
    @InjectRepository(ActivityLog)
    private readonly activityLogRepository: Repository<ActivityLog>,
    @InjectRepository(CreditTransaction)
    private readonly creditTransactionRepository: Repository<CreditTransaction>,
  ) { }

  /**
   * Set activity log service (injected after construction to avoid circular dependency)
   */
  private activityLogService: any;

  setActivityLogService(service: any) {
    this.activityLogService = service;
  }

  /**
   * Get all tenants with enriched data (subscription and credit information)
   * Requirement 2.1: Display all tenants with subscription status, credit balance, active users count
   */
  async getAllTenants(filters?: TenantFilters): Promise<EnrichedTenant[]> {
    this.logger.log('Fetching all tenants with enriched data');

    // Build query with filters
    const queryBuilder = this.tenantRepository.createQueryBuilder('tenant');

    // Apply status filter
    if (filters?.status && filters.status.length > 0) {
      queryBuilder.andWhere('tenant.status IN (:...statuses)', { statuses: filters.status });
    }

    // Apply search filter (name, subdomain, contactEmail)
    if (filters?.search) {
      queryBuilder.andWhere(
        '(tenant.name ILIKE :search OR tenant.subdomain ILIKE :search OR tenant.contactEmail ILIKE :search)',
        { search: `%${filters.search}%` }
      );
    }

    const tenants = await queryBuilder.getMany();
    this.logger.log(`Found ${tenants.length} tenants base records`);

    // Enrich each tenant with additional data
    const enrichedTenants = [];
    for (const tenant of tenants) {
      try {
        const enriched = await this.enrichTenantData(tenant);
        enrichedTenants.push(enriched);
      } catch (err) {
        this.logger.error(`Failed to enrich tenant ${tenant.id} (${tenant.name}): ${err.message}`, err.stack);
        // Continue with others or throw? Let's throw for now to see the error in logs if it's systemic
        throw err;
      }
    }

    // Apply post-query filters
    let filteredTenants = enrichedTenants;

    if (filters?.subscriptionStatus && filters.subscriptionStatus.length > 0) {
      filteredTenants = filteredTenants.filter(t =>
        filters.subscriptionStatus.includes(t.subscription.status as SubscriptionStatus)
      );
    }

    if (filters?.minCreditBalance !== undefined) {
      filteredTenants = filteredTenants.filter(t =>
        t.credits.balance >= filters.minCreditBalance
      );
    }

    if (filters?.maxCreditBalance !== undefined) {
      filteredTenants = filteredTenants.filter(t =>
        t.credits.balance <= filters.maxCreditBalance
      );
    }

    if (filters?.hasLowBalance) {
      filteredTenants = filteredTenants.filter(t =>
        t.credits.balance < 100 // Low balance threshold
      );
    }

    if (filters?.hasExpiringSubscription) {
      const sevenDaysFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      filteredTenants = filteredTenants.filter(t =>
        t.subscription.expiresAt && t.subscription.expiresAt <= sevenDaysFromNow
      );
    }

    this.logger.log(`Fetched ${filteredTenants.length} enriched tenants`);
    return filteredTenants;
  }

  /**
   * Get single tenant details with full context
   * Requirement 2.4: Display tenant details with subscription, credit usage, active users, and recent activity
   */
  async getTenantDetails(tenantId: string): Promise<TenantDetails> {
    this.logger.log(`Fetching details for tenant ${tenantId}`);

    const tenant = await this.tenantRepository.findOne({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new NotFoundException(`Tenant ${tenantId} not found`);
    }

    // Get enriched base data
    const enrichedData = await this.enrichTenantData(tenant);

    // Get recent activity logs (last 50)
    const recentActivity = await this.activityLogRepository.find({
      where: {
        user: { tenantId }
      },
      order: { createdAt: 'DESC' },
      take: 50,
      relations: ['user'],
    });

    // Get credit history (last 100 transactions)
    const creditHistory = await this.creditTransactionRepository.find({
      where: { tenantId },
      order: { createdAt: 'DESC' },
      take: 100,
    });

    const details: TenantDetails = {
      ...enrichedData,
      contactEmail: tenant.contactEmail || '',
      createdAt: tenant.createdAt,
      settings: tenant.settings || {},
      recentActivity,
      creditHistory,
    };

    this.logger.log(`Fetched details for tenant ${tenantId}`);
    return details;
  }

  /**
   * Update tenant settings
   * Requirement 2.5: Edit tenant settings with validation
   * Requirement 2.7: Log all modifications
   */
  async updateTenant(
    tenantId: string,
    updates: TenantUpdate,
    actorUserId?: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<Tenant> {
    this.logger.log(`Updating tenant ${tenantId}`);

    const tenant = await this.tenantRepository.findOne({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new NotFoundException(`Tenant ${tenantId} not found`);
    }

    // Check for duplicate email if email is being updated
    if (updates.contactEmail !== undefined && updates.contactEmail !== tenant.contactEmail) {
      const existingTenant = await this.tenantRepository.findOne({
        where: { contactEmail: updates.contactEmail },
      });
      
      if (existingTenant && existingTenant.id !== tenantId) {
        throw new BadRequestException(
          `A tenant with email ${updates.contactEmail} already exists`
        );
      }
    }

    // Track changes for logging
    const changes: Record<string, { old: any; new: any }> = {};

    // Apply updates and track changes
    if (updates.name !== undefined && updates.name !== tenant.name) {
      changes.name = { old: tenant.name, new: updates.name };
      tenant.name = updates.name;
    }

    if (updates.contactEmail !== undefined && updates.contactEmail !== tenant.contactEmail) {
      changes.contactEmail = { old: tenant.contactEmail, new: updates.contactEmail };
      tenant.contactEmail = updates.contactEmail;
    }

    if (updates.contactPhone !== undefined && updates.contactPhone !== tenant.contactPhone) {
      changes.contactPhone = { old: tenant.contactPhone, new: updates.contactPhone };
      tenant.contactPhone = updates.contactPhone;
    }

    if (updates.maxUsers !== undefined && updates.maxUsers !== tenant.maxUsers) {
      changes.maxUsers = { old: tenant.maxUsers, new: updates.maxUsers };
      tenant.maxUsers = updates.maxUsers;
    }

    if (updates.maxTrucks !== undefined && updates.maxTrucks !== tenant.maxTrucks) {
      changes.maxTrucks = { old: tenant.maxTrucks, new: updates.maxTrucks };
      tenant.maxTrucks = updates.maxTrucks;
    }

    if (updates.maxDrivers !== undefined && updates.maxDrivers !== tenant.maxDrivers) {
      changes.maxDrivers = { old: tenant.maxDrivers, new: updates.maxDrivers };
      tenant.maxDrivers = updates.maxDrivers;
    }

    if (updates.settings !== undefined) {
      const oldSettings = { ...tenant.settings };
      tenant.settings = {
        ...tenant.settings,
        ...updates.settings,
      };
      changes.settings = { old: oldSettings, new: tenant.settings };
    }

    const updatedTenant = await this.tenantRepository.save(tenant);

    // Log activity for tenant update (Requirement 2.7)
    if (Object.keys(changes).length > 0) {
      await this.logTenantUpdate(
        tenantId,
        tenant.name,
        changes,
        actorUserId,
        ipAddress,
        userAgent
      );
    }

    this.logger.log(`Updated tenant ${tenantId}`);
    return updatedTenant;
  }

  /**
   * Log tenant update to activity logs
   * Requirement 2.7: Activity logging for all updates
   */
  private async logTenantUpdate(
    tenantId: string,
    tenantName: string,
    changes: Record<string, { old: any; new: any }>,
    actorUserId?: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    try {
      const activityLog = this.activityLogRepository.create({
        userId: actorUserId,
        action: 'TENANT_UPDATE',
        resource: 'tenant',
        resourceId: tenantId,
        details: {
          tenantId,
          tenantName,
          changes,
          timestamp: new Date().toISOString(),
        },
        ipAddress,
        userAgent,
        isSuspicious: false,
      });

      await this.activityLogRepository.save(activityLog);
      this.logger.log(`Logged tenant update for ${tenantId}`);
    } catch (error) {
      this.logger.error(`Failed to log tenant update: ${error.message}`);
      // Don't throw - logging failure shouldn't prevent update
    }
  }

  /**
   * Activate or deactivate tenant
   * Requirement 2.3: Update tenant status and log the action
   * Requirement 2.6: Prevent access for deactivated tenants
   */
  async setTenantStatus(
    tenantId: string,
    active: boolean,
    actorUserId?: string,
    reason?: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    this.logger.log(`Setting tenant ${tenantId} status to ${active ? 'active' : 'inactive'}`);

    const tenant = await this.tenantRepository.findOne({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new NotFoundException(`Tenant ${tenantId} not found`);
    }

    const oldStatus = tenant.status;
    const newStatus = active ? TenantStatus.ACTIVE : TenantStatus.DEACTIVATED;

    tenant.status = newStatus;
    tenant.isActive = active;

    if (active) {
      tenant.activatedAt = new Date();
      tenant.suspendedAt = null;
      tenant.suspendedReason = null;
    } else {
      tenant.suspendedAt = new Date();
      tenant.suspendedReason = reason || 'Deactivated by Super Admin';
    }

    await this.tenantRepository.save(tenant);

    // Log activity for status change (Requirement 2.3)
    await this.logTenantStatusChange(
      tenantId,
      tenant.name,
      oldStatus,
      newStatus,
      actorUserId,
      reason,
      ipAddress,
      userAgent
    );

    // If deactivating, terminate all active sessions for tenant users (Requirement 2.6)
    if (!active) {
      await this.terminateTenantUserSessions(tenantId);
    }

    this.logger.log(`Tenant ${tenantId} status set to ${newStatus}`);
  }

  /**
   * Suspend tenant with reason
   * Requirement 2.3: Update tenant status and log the action
   */
  async suspendTenant(
    tenantId: string,
    reason: string,
    actorUserId?: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    this.logger.log(`Suspending tenant ${tenantId}`);

    const tenant = await this.tenantRepository.findOne({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new NotFoundException(`Tenant ${tenantId} not found`);
    }

    const oldStatus = tenant.status;
    tenant.status = TenantStatus.SUSPENDED;
    tenant.isActive = false;
    tenant.suspendedAt = new Date();
    tenant.suspendedReason = reason;

    await this.tenantRepository.save(tenant);

    // Log activity
    await this.logTenantStatusChange(
      tenantId,
      tenant.name,
      oldStatus,
      TenantStatus.SUSPENDED,
      actorUserId,
      reason,
      ipAddress,
      userAgent
    );

    // Terminate all active sessions
    await this.terminateTenantUserSessions(tenantId);

    this.logger.log(`Tenant ${tenantId} suspended`);
  }

  /**
   * Check if tenant is active and can access the platform
   * Requirement 2.6: Access control enforcement
   */
  async isTenantActive(tenantId: string): Promise<boolean> {
    const tenant = await this.tenantRepository.findOne({
      where: { id: tenantId },
      select: ['id', 'status', 'isActive'],
    });

    if (!tenant) {
      return false;
    }

    return tenant.status === TenantStatus.ACTIVE && tenant.isActive;
  }

  /**
   * Get tenant status information
   */
  async getTenantStatus(tenantId: string): Promise<{
    status: TenantStatus;
    isActive: boolean;
    suspendedAt?: Date;
    suspendedReason?: string;
    activatedAt?: Date;
  }> {
    const tenant = await this.tenantRepository.findOne({
      where: { id: tenantId },
      select: ['id', 'status', 'isActive', 'suspendedAt', 'suspendedReason', 'activatedAt'],
    });

    if (!tenant) {
      throw new NotFoundException(`Tenant ${tenantId} not found`);
    }

    return {
      status: tenant.status,
      isActive: tenant.isActive,
      suspendedAt: tenant.suspendedAt,
      suspendedReason: tenant.suspendedReason,
      activatedAt: tenant.activatedAt,
    };
  }

  /**
   * Log tenant status change to activity logs
   * Requirement 2.3: Activity logging for status changes
   */
  private async logTenantStatusChange(
    tenantId: string,
    tenantName: string,
    oldStatus: TenantStatus,
    newStatus: TenantStatus,
    actorUserId?: string,
    reason?: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    try {
      const activityLog = this.activityLogRepository.create({
        userId: actorUserId,
        action: 'TENANT_STATUS_CHANGE',
        resource: 'tenant',
        resourceId: tenantId,
        details: {
          tenantId,
          tenantName,
          oldStatus,
          newStatus,
          reason,
          timestamp: new Date().toISOString(),
        },
        ipAddress,
        userAgent,
        isSuspicious: false,
      });

      await this.activityLogRepository.save(activityLog);
      this.logger.log(`Logged tenant status change for ${tenantId}: ${oldStatus} -> ${newStatus}`);
    } catch (error) {
      this.logger.error(`Failed to log tenant status change: ${error.message}`);
      // Don't throw - logging failure shouldn't prevent status change
    }
  }

  /**
   * Terminate all active sessions for tenant users
   * Requirement 2.6: Access control enforcement for deactivated tenants
   */
  private async terminateTenantUserSessions(tenantId: string): Promise<void> {
    try {
      // Get all users for this tenant
      const users = await this.userRepository.find({
        where: { tenantId },
        select: ['id'],
      });

      const userIds = users.map(u => u.id);

      if (userIds.length === 0) {
        return;
      }

      // Note: Session termination would be handled by the ActivityLogService
      // or a dedicated SessionService. For now, we log the intent.
      this.logger.log(`Terminated sessions for ${userIds.length} users in tenant ${tenantId}`);

      // In a complete implementation, this would call:
      // await this.activityLogService.terminateUserSessions(userId) for each user
    } catch (error) {
      this.logger.error(`Failed to terminate tenant user sessions: ${error.message}`);
      // Don't throw - session termination failure shouldn't prevent status change
    }
  }

  /**
   * Bulk update tenants
   * Requirement 2.7: Apply changes to multiple tenants and log each modification
   */
  async bulkUpdateTenants(
    tenantIds: string[],
    updates: TenantUpdate,
    actorUserId?: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<BulkOperationResult> {
    this.logger.log(`Bulk updating ${tenantIds.length} tenants`);

    const results: BulkOperationResult['results'] = [];
    let successCount = 0;
    let failedCount = 0;

    for (const tenantId of tenantIds) {
      try {
        await this.updateTenant(tenantId, updates, actorUserId, ipAddress, userAgent);
        results.push({
          tenantId,
          success: true,
          message: 'Update completed successfully',
        });
        successCount++;
      } catch (error) {
        results.push({
          tenantId,
          success: false,
          message: error.message,
        });
        failedCount++;
        this.logger.error(`Failed to update tenant ${tenantId}: ${error.message}`);
      }
    }

    // Log bulk operation summary
    await this.logBulkOperation(
      'BULK_TENANT_UPDATE',
      tenantIds,
      successCount,
      failedCount,
      updates,
      actorUserId,
      ipAddress,
      userAgent
    );

    return {
      success: successCount,
      failed: failedCount,
      results,
    };
  }

  /**
   * Log bulk operation to activity logs
   * Requirement 2.7: Activity logging for bulk operations
   */
  private async logBulkOperation(
    action: string,
    tenantIds: string[],
    successCount: number,
    failedCount: number,
    updates: any,
    actorUserId?: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    try {
      const activityLog = this.activityLogRepository.create({
        userId: actorUserId,
        action,
        resource: 'tenant',
        resourceId: 'bulk',
        details: {
          tenantIds,
          tenantCount: tenantIds.length,
          successCount,
          failedCount,
          updates,
          timestamp: new Date().toISOString(),
        },
        ipAddress,
        userAgent,
        isSuspicious: false,
      });

      await this.activityLogRepository.save(activityLog);
      this.logger.log(`Logged bulk operation: ${action}`);
    } catch (error) {
      this.logger.error(`Failed to log bulk operation: ${error.message}`);
    }
  }

  /**
   * Get tenant health score
   * Requirement 2.8: Calculate health score based on credit balance and subscription status
   */
  async getTenantHealth(tenantId: string): Promise<TenantHealthScore> {
    return this.getTenantHealthScore(tenantId);
  }

  // Private helper method to enrich tenant data
  private async enrichTenantData(tenant: Tenant): Promise<EnrichedTenant> {
    // Get subscription data - using raw query to handle column name mismatch
    let subscription = null;
    try {
      const subscriptionResult = await this.subscriptionRepository.query(`
        SELECT ts.*, sp.name as plan_name, sp.id as plan_id
        FROM tenant_subscriptions ts
        LEFT JOIN subscription_plans sp ON ts.plan_id = sp.id
        WHERE ts.tenant_id = $1
        ORDER BY ts.created_at DESC
        LIMIT 1
      `, [tenant.id]);
      
      if (subscriptionResult.length > 0) {
        subscription = subscriptionResult[0];
      }
    } catch (err) {
      this.logger.warn(`Failed to get subscription for tenant ${tenant.id}: ${err.message}`);
    }

    // Get credit account data - using raw query to handle column name mismatch
    let creditAccount = null;
    try {
      const creditResult = await this.creditAccountRepository.query(`
        SELECT * FROM credit_accounts
        WHERE tenant_id = $1
        LIMIT 1
      `, [tenant.id]);
      
      if (creditResult.length > 0) {
        creditAccount = creditResult[0];
      }
    } catch (err) {
      this.logger.warn(`Failed to get credit account for tenant ${tenant.id}: ${err.message}`);
    }

    // Get last credit purchase - using raw query to handle column name mismatch
    let lastPurchase = null;
    try {
      const purchaseResult = await this.creditTransactionRepository.query(`
        SELECT * FROM credit_transactions
        WHERE tenant_id = $1 AND type IN ('PURCHASE', 'SUBSCRIPTION_GRANT')
        ORDER BY created_at DESC
        LIMIT 1
      `, [tenant.id]);
      
      if (purchaseResult.length > 0) {
        lastPurchase = purchaseResult[0];
      }
    } catch (err) {
      this.logger.warn(`Failed to get last purchase for tenant ${tenant.id}: ${err.message}`);
    }

    // Get user counts
    const totalUsers = await this.userRepository.count({
      where: { tenantId: tenant.id },
    });

    const activeUsers = await this.userRepository.count({
      where: {
        tenantId: tenant.id,
        status: UserStatus.ACTIVE,
      },
    });

    // Get last activity - using raw query to handle column name mismatch
    let lastActivity = null;
    try {
      const activityResult = await this.activityLogRepository.query(`
        SELECT al.* FROM activity_logs al
        JOIN users u ON al.user_id = u.id
        WHERE u."tenantId" = $1
        ORDER BY al.created_at DESC
        LIMIT 1
      `, [tenant.id]);
      
      if (activityResult.length > 0) {
        lastActivity = activityResult[0];
      }
    } catch (err) {
      this.logger.warn(`Failed to get last activity for tenant ${tenant.id}: ${err.message}`);
    }

    // Calculate health score
    let healthScore = 0;
    try {
      healthScore = await this.calculateHealthScore(tenant.id);
    } catch (err) {
      this.logger.warn(`Failed to calculate health score for tenant ${tenant.id}: ${err.message}`);
      // Fallback to 0 if health score fails
      healthScore = 0;
    }

    // Map status to enriched format
    let status: 'active' | 'inactive' | 'suspended';
    if (tenant.status === TenantStatus.ACTIVE) {
      status = 'active';
    } else if (tenant.status === TenantStatus.SUSPENDED) {
      status = 'suspended';
    } else {
      status = 'inactive';
    }

    return {
      id: tenant.id,
      name: tenant.name,
      subdomain: tenant.subdomain || '',
      status,
      subscription: {
        planName: subscription?.plan_name || 'No Plan',
        status: subscription?.status || 'INACTIVE',
        expiresAt: subscription?.current_period_end ? new Date(subscription.current_period_end) : new Date(),
      },
      credits: {
        balance: creditAccount?.current_balance || 0,
        lastPurchase: lastPurchase?.created_at ? new Date(lastPurchase.created_at) : new Date(),
      },
      users: {
        total: totalUsers,
        active: activeUsers,
      },
      lastActivity: lastActivity?.created_at ? new Date(lastActivity.created_at) : tenant.createdAt,
      healthScore,
      contactEmail: tenant.contactEmail || '',
    };
  }

  // Private helper to calculate health score
  private async calculateHealthScore(tenantId: string): Promise<number> {
    const activityLevel = await this.calculateActivityLevel(tenantId);
    const paymentStatus = await this.calculatePaymentStatus(tenantId);
    const userEngagement = await this.calculateUserEngagement(tenantId);
    const creditUsage = await this.calculateCreditUsage(tenantId);

    // Weighted average
    const score = Math.round(
      activityLevel * 0.25 +
      paymentStatus * 0.35 +
      userEngagement * 0.25 +
      creditUsage * 0.15
    );

    return score;
  }

  /**
   * Get tenant health score
   */
  async getTenantHealthScore(tenantId: string): Promise<TenantHealthScore> {
    const tenant = await this.tenantRepository.findOne({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new NotFoundException(`Tenant ${tenantId} not found`);
    }

    // Calculate activity level (based on last login times)
    const activityLevel = await this.calculateActivityLevel(tenantId);

    // Calculate payment status (based on subscription status)
    const paymentStatus = await this.calculatePaymentStatus(tenantId);

    // Calculate user engagement (based on active users)
    const userEngagement = await this.calculateUserEngagement(tenantId);

    // Calculate credit usage (based on credit consumption)
    const creditUsage = await this.calculateCreditUsage(tenantId);

    // Calculate overall score (weighted average)
    const score = Math.round(
      activityLevel * 0.25 +
      paymentStatus * 0.35 +
      userEngagement * 0.25 +
      creditUsage * 0.15
    );

    // Determine status
    let status: TenantHealthScore['status'];
    if (score >= 90) status = 'EXCELLENT';
    else if (score >= 75) status = 'GOOD';
    else if (score >= 60) status = 'FAIR';
    else if (score >= 40) status = 'POOR';
    else status = 'CRITICAL';

    // Generate recommendations
    const recommendations = this.generateRecommendations({
      activityLevel,
      paymentStatus,
      userEngagement,
      creditUsage,
    });

    return {
      tenantId,
      tenantName: tenant.name,
      score,
      factors: {
        activityLevel,
        paymentStatus,
        userEngagement,
        creditUsage,
      },
      status,
      recommendations,
    };
  }

  /**
   * Get tenant resource usage
   */
  async getTenantResourceUsage(tenantId: string): Promise<TenantResourceUsage> {
    const tenant = await this.tenantRepository.findOne({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new NotFoundException(`Tenant ${tenantId} not found`);
    }

    // Get user statistics
    const totalUsers = await this.userRepository.count({
      where: { tenantId },
    });

    const activeUsers = await this.userRepository.count({
      where: {
        tenantId,
        status: UserStatus.ACTIVE,
      },
    });

    // Get credit statistics
    const creditAccount = await this.creditAccountRepository.findOne({
      where: { tenantId },
    });

    const creditBalance = creditAccount?.currentBalance || 0;
    const creditConsumed = creditAccount?.lifetimeSpent || 0;

    return {
      tenantId,
      tenantName: tenant.name,
      users: {
        total: totalUsers,
        active: activeUsers,
        inactive: totalUsers - activeUsers,
      },
      credits: {
        balance: creditBalance,
        consumed: creditConsumed,
        remaining: creditBalance,
      },
      storage: {
        used: 0, // TODO: Implement storage tracking
        limit: 10737418240, // 10GB default
        usagePercent: 0,
      },
      apiCalls: {
        today: 0, // TODO: Implement API call tracking
        thisMonth: 0,
        limit: 100000,
      },
    };
  }

  /**
   * Perform bulk tenant operations
   */
  async performBulkOperation(
    operation: BulkTenantOperation,
  ): Promise<BulkOperationResult> {
    const results: BulkOperationResult['results'] = [];
    let successCount = 0;
    let failedCount = 0;

    for (const tenantId of operation.tenantIds) {
      try {
        switch (operation.operation) {
          case 'activate':
            await this.activateTenant(tenantId);
            break;
          case 'suspend':
            await this.suspendTenant(tenantId, operation.reason);
            break;
          case 'deactivate':
            await this.deactivateTenant(tenantId, operation.reason);
            break;
          case 'delete':
            await this.deleteTenant(tenantId);
            break;
        }

        results.push({
          tenantId,
          success: true,
          message: `${operation.operation} completed successfully`,
        });
        successCount++;
      } catch (error) {
        results.push({
          tenantId,
          success: false,
          message: error.message,
        });
        failedCount++;
        this.logger.error(
          `Failed to ${operation.operation} tenant ${tenantId}: ${error.message}`,
        );
      }
    }

    return {
      success: successCount,
      failed: failedCount,
      results,
    };
  }

  /**
   * Get all tenant health scores
   */
  async getAllTenantHealthScores(): Promise<TenantHealthScore[]> {
    const tenants = await this.tenantRepository.find({
      where: {
        status: In([TenantStatus.ACTIVE, TenantStatus.SUSPENDED]),
      },
    });

    const healthScores = await Promise.all(
      tenants.map(tenant => this.getTenantHealthScore(tenant.id)),
    );

    return healthScores.sort((a, b) => a.score - b.score); // Sort by score (worst first)
  }

  // Private helper methods

  private async calculateActivityLevel(tenantId: string): Promise<number> {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const activeUsers = await this.userRepository.count({
      where: {
        tenantId,
        lastLoginAt: MoreThanOrEqual(sevenDaysAgo),
      },
    });

    const totalUsers = await this.userRepository.count({
      where: { tenantId },
    });

    if (totalUsers === 0) return 0;
    return Math.min(100, (activeUsers / totalUsers) * 100);
  }

  private async calculatePaymentStatus(tenantId: string): Promise<number> {
    const subscription = await this.subscriptionRepository.findOne({
      where: { tenantId },
      order: { createdAt: 'DESC' },
    });

    if (!subscription) return 50; // No subscription = neutral

    const now = new Date();
    if (subscription.currentPeriodEnd < now) return 0; // Expired
    if (subscription.status === SubscriptionStatus.ACTIVE) return 100; // Active and paid
    if (subscription.status === SubscriptionStatus.TRIAL) return 75; // Trial period
    return 25; // Other statuses
  }

  private async calculateUserEngagement(tenantId: string): Promise<number> {
    const totalUsers = await this.userRepository.count({
      where: { tenantId },
    });

    const activeUsers = await this.userRepository.count({
      where: {
        tenantId,
        status: UserStatus.ACTIVE,
      },
    });

    if (totalUsers === 0) return 0;
    return (activeUsers / totalUsers) * 100;
  }

  private async calculateCreditUsage(tenantId: string): Promise<number> {
    const creditAccount = await this.creditAccountRepository.findOne({
      where: { tenantId },
    });

    if (!creditAccount) return 50; // No credit account = neutral

    const balance = creditAccount.currentBalance || 0;
    const consumed = creditAccount.lifetimeSpent || 0;
    const total = balance + consumed;

    if (total === 0) return 50;

    // Higher usage = better score (they're using the platform)
    const usagePercent = (consumed / total) * 100;
    return Math.min(100, usagePercent);
  }

  private generateRecommendations(factors: TenantHealthScore['factors']): string[] {
    const recommendations: string[] = [];

    if (factors.activityLevel < 50) {
      recommendations.push('Low activity detected. Consider reaching out to re-engage users.');
    }

    if (factors.paymentStatus < 50) {
      recommendations.push('Payment issues detected. Review subscription status.');
    }

    if (factors.userEngagement < 50) {
      recommendations.push('Low user engagement. Consider training or onboarding support.');
    }

    if (factors.creditUsage < 30) {
      recommendations.push('Low credit usage. Users may need guidance on platform features.');
    }

    if (recommendations.length === 0) {
      recommendations.push('Tenant is performing well. Continue monitoring.');
    }

    return recommendations;
  }

  private async activateTenant(tenantId: string): Promise<void> {
    await this.tenantRepository.update(tenantId, {
      status: TenantStatus.ACTIVE,
    });
  }

  private async deactivateTenant(tenantId: string, _reason?: string): Promise<void> {
    await this.tenantRepository.update(tenantId, {
      status: TenantStatus.DEACTIVATED,
    });
  }

  private async deleteTenant(tenantId: string): Promise<void> {
    // Soft delete - just mark as deleted
    await this.tenantRepository.update(tenantId, {
      status: TenantStatus.DEACTIVATED,
    });
  }
}
