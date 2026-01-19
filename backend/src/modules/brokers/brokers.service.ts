import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, Between } from 'typeorm';
import { User, UserRole, UserStatus } from '../../entities/user.entity';
import { UserProfile } from '../../entities/user-profile.entity';
import { Load } from '../../entities/load.entity';
import { BrokerCommission, CommissionStatus } from '../../entities/broker-commission.entity';
import { Tenant } from '../../entities/tenant.entity';
import { PasswordResetToken } from '../../entities/password-reset-token.entity';
import { EmailService } from '../auth/email.service';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import * as bcrypt from 'bcryptjs';
import { CreateBrokerDto } from './dto/create-broker.dto';
import { UpdateBrokerDto } from './dto/update-broker.dto';
import { AssignBrokerToLoadDto } from './dto/assign-broker-to-load.dto';
import { UpdateCommissionStatusDto } from './dto/update-commission-status.dto';
import { CommissionQueryDto } from './dto/commission-query.dto';
import { CreatePayoutRequestDto, UpdatePayoutRequestDto } from './dto/commission-payout.dto';
import { ContractService } from './services/contract.service';
import { LoadContract, ContractStatus, ContractType } from '../../entities/load-contract.entity';

@Injectable()
export class BrokersService {
  private readonly logger = new Logger(BrokersService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(UserProfile)
    private readonly userProfileRepository: Repository<UserProfile>,
    @InjectRepository(Load)
    private readonly loadRepository: Repository<Load>,
    @InjectRepository(BrokerCommission)
    private readonly brokerCommissionRepository: Repository<BrokerCommission>,
    @InjectRepository(Tenant)
    private readonly tenantRepository: Repository<Tenant>,
    @InjectRepository(PasswordResetToken)
    private readonly passwordResetTokenRepository: Repository<PasswordResetToken>,
    private readonly emailService: EmailService,
    private readonly configService: ConfigService,
    private readonly contractService: ContractService,
  ) { }

  /**
   * Create a new broker for a tenant
   */
  async createBroker(
    tenantAdminId: string,
    createBrokerDto: CreateBrokerDto,
  ): Promise<{ broker: User; message: string }> {
    this.logger.log(
      `Creating broker for tenant admin ${tenantAdminId}: ${createBrokerDto.email}`,
    );

    // Verify tenant admin exists
    const tenantAdmin = await this.userRepository.findOne({
      where: { id: tenantAdminId },
    });

    if (!tenantAdmin) {
      throw new NotFoundException('Tenant admin not found');
    }

    if (
      tenantAdmin.role !== UserRole.TENANT_ADMIN &&
      tenantAdmin.role !== UserRole.ADMIN &&
      tenantAdmin.role !== UserRole.SUPER_ADMIN
    ) {
      throw new BadRequestException('User is not authorized to create brokers');
    }

    // Check if email already exists
    const existingUser = await this.userRepository.findOne({
      where: { email: createBrokerDto.email.toLowerCase().trim() },
    });

    if (existingUser) {
      throw new ConflictException('A user with this email already exists');
    }

    // Generate temporary password (will be changed on first login)
    const tempPassword = crypto.randomBytes(16).toString('hex');
    const passwordHash = await bcrypt.hash(tempPassword, 10);

    // Get tenant settings for default commission rate
    const tenant = await this.tenantRepository.findOne({
      where: { id: tenantAdmin.tenantId },
    });

    const defaultCommissionRate =
      createBrokerDto.defaultCommissionRate ??
      (tenant?.settings as any)?.defaultCommissionRate ??
      5.0; // Default 5%

    // Create broker user
    const broker = this.userRepository.create({
      email: createBrokerDto.email.toLowerCase().trim(),
      phone: createBrokerDto.phone?.trim(),
      passwordHash,
      role: UserRole.BROKER,
      status: UserStatus.PENDING_VERIFICATION,
      tenantId: tenantAdmin.tenantId,
      brokerTenantId: tenantAdmin.tenantId,
      defaultCommissionRate,
      totalCommissionEarned: 0,
    });

    await this.userRepository.save(broker);

    // Create user profile
    const profile = this.userProfileRepository.create({
      userId: broker.id,
      tenantId: tenantAdmin.tenantId,
      firstName: createBrokerDto.firstName,
      lastName: createBrokerDto.lastName,
      companyName: createBrokerDto.companyName,
    });

    await this.userProfileRepository.save(profile);

    // Generate password setup token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // Token expires in 7 days

    // Invalidate any existing tokens for this email
    await this.passwordResetTokenRepository.update(
      { email: broker.email, used: false },
      { used: true },
    );

    const passwordSetupToken = this.passwordResetTokenRepository.create({
      email: broker.email,
      token,
      expiresAt,
      used: false,
    });

    await this.passwordResetTokenRepository.save(passwordSetupToken);

    // Send invitation email
    try {
      // Use generic email method if broker-specific method doesn't exist
      if (typeof (this.emailService as any).sendBrokerInvitationEmail === 'function') {
        await (this.emailService as any).sendBrokerInvitationEmail(
          broker.email,
          createBrokerDto.firstName,
          createBrokerDto.lastName,
          tenantAdmin.email,
          token,
        );
      } else {
        // Fallback: use driver invitation email template (similar structure)
        const frontendUrl = this.configService.get<string>('FRONTEND_URL', 'http://localhost:3000');
        const setupUrl = `${frontendUrl}/auth/setup-password?token=${token}&email=${encodeURIComponent(broker.email)}`;
        await (this.emailService as any).sendDriverPasswordSetupEmail(
          broker.email,
          createBrokerDto.firstName,
          createBrokerDto.lastName,
          setupUrl,
        );
      }
      this.logger.log(`✅ Invitation email sent to ${broker.email}`);
    } catch (error) {
      this.logger.error(`Failed to send invitation email: ${error.message}`);
      // Don't fail the creation if email fails
    }

    return {
      broker,
      message: 'Broker created successfully. Invitation email sent.',
    };
  }

  /**
   * Get all brokers for a tenant
   */
  async getBrokersByTenant(tenantId: string): Promise<User[]> {
    this.logger.log(`🔍 Fetching brokers for tenant: ${tenantId}`);

    // Query brokers by brokerTenantId OR tenantId (for backward compatibility)
    // This handles cases where brokers might have been created with only tenantId set
    const brokers = await this.userRepository.find({
      where: [
        {
          brokerTenantId: tenantId,
          role: UserRole.BROKER,
        },
        {
          tenantId: tenantId,
          role: UserRole.BROKER,
          brokerTenantId: null as any, // Only match if brokerTenantId is explicitly null
        },
      ],
      relations: ['profile'],
      order: { createdAt: 'DESC' },
    });

    this.logger.log(`✅ Found ${brokers.length} broker(s) for tenant ${tenantId}`);

    if (brokers.length === 0) {
      this.logger.warn(`⚠️ No brokers found for tenant ${tenantId}. Brokers may need to be created through the admin interface.`);
    } else {
      // Log broker details for debugging
      brokers.forEach((broker, index) => {
        this.logger.log(`  ${index + 1}. ${broker.email} (${broker.profile?.firstName || 'No name'} ${broker.profile?.lastName || ''})`);
      });
    }

    return brokers;
  }

  /**
   * Get a single broker by ID
   */
  async getBrokerById(brokerId: string, tenantId: string): Promise<User> {
    // Try to find broker by brokerTenantId first (preferred)
    let broker = await this.userRepository.findOne({
      where: {
        id: brokerId,
        brokerTenantId: tenantId,
        role: UserRole.BROKER,
      },
      relations: ['profile'],
    });

    // If not found, try by tenantId (broker might belong to the tenant directly)
    if (!broker) {
      broker = await this.userRepository.findOne({
        where: {
          id: brokerId,
          tenantId: tenantId,
          role: UserRole.BROKER,
        },
        relations: ['profile'],
      });
    }

    // If still not found, try without tenant restriction (for cross-tenant scenarios)
    // but verify the broker exists and has BROKER role
    if (!broker) {
      broker = await this.userRepository.findOne({
        where: {
          id: brokerId,
          role: UserRole.BROKER,
        },
        relations: ['profile'],
      });

      // If found but tenant doesn't match, log a warning but allow it
      // This handles cases where brokers might work across tenants
      if (broker && broker.tenantId !== tenantId && broker.brokerTenantId !== tenantId) {
        this.logger.warn(
          `Broker ${brokerId} found but tenant mismatch. Broker tenant: ${broker.tenantId}, Request tenant: ${tenantId}`,
        );
      }
    }

    if (!broker) {
      throw new NotFoundException(
        `Broker not found with ID ${brokerId} for tenant ${tenantId}`,
      );
    }

    return broker;
  }

  /**
   * Update broker information
   */
  async updateBroker(
    brokerId: string,
    tenantId: string,
    updateData: UpdateBrokerDto,
  ): Promise<User> {
    const broker = await this.getBrokerById(brokerId, tenantId);

    if (updateData.firstName || updateData.lastName) {
      const profile = await this.userProfileRepository.findOne({
        where: { userId: broker.id },
      });

      if (profile) {
        if (updateData.firstName) profile.firstName = updateData.firstName;
        if (updateData.lastName) profile.lastName = updateData.lastName;
        await this.userProfileRepository.save(profile);
      }
    }

    if (updateData.phone) {
      broker.phone = updateData.phone;
    }

    if (updateData.defaultCommissionRate !== undefined) {
      broker.defaultCommissionRate = updateData.defaultCommissionRate;
    }

    await this.userRepository.save(broker);

    return this.getBrokerById(brokerId, tenantId);
  }

  /**
   * Delete a broker
   */
  async deleteBroker(brokerId: string, tenantId: string): Promise<void> {
    const broker = await this.getBrokerById(brokerId, tenantId);

    // Check if broker has assigned loads
    const assignedLoads = await this.loadRepository.count({
      where: { brokerId: broker.id },
    });

    if (assignedLoads > 0) {
      throw new BadRequestException(
        `Cannot delete broker. They have ${assignedLoads} assigned load(s). Please reassign or remove load assignments first.`,
      );
    }

    // Soft delete
    await this.userRepository.softDelete(broker.id);
  }

  /**
   * Assign broker to a load
   */
  async assignBrokerToLoad(
    loadId: string,
    tenantId: string,
    assignDto: AssignBrokerToLoadDto,
  ): Promise<Load> {
    // Verify load exists and belongs to tenant
    const load = await this.loadRepository.findOne({
      where: { id: loadId, tenantId },
    });

    if (!load) {
      throw new NotFoundException('Load not found or you do not have permission');
    }

    // Check if load already has a broker assigned
    if (load.brokerId) {
      throw new ConflictException(
        `Load already has a broker assigned. Please unassign the current broker first.`,
      );
    }

    // Verify broker exists and belongs to tenant
    const broker = await this.getBrokerById(assignDto.brokerId, tenantId);

    // Calculate commission
    const commissionRate =
      assignDto.commissionRate ?? broker.defaultCommissionRate ?? 5.0;
    const commissionAmount = (load.loadValue * commissionRate) / 100;

    // Assign broker to load
    load.brokerId = broker.id;
    load.brokerCommissionRate = commissionRate;
    load.brokerCommissionAmount = commissionAmount;

    this.logger.log(
      `Assigning broker ${broker.id} (${broker.email}) to load ${loadId} with ${commissionRate}% commission`,
    );

    await this.loadRepository.save(load);

    this.logger.log(`✅ Broker assigned successfully. Load ${loadId} now has broker ${load.brokerId}`);

    // Create commission record
    await this.createCommissionRecord(load, broker, commissionRate, commissionAmount);

    // Automatically create broker contract with PENDING_BROKER_ACCEPTANCE status
    try {
      const contract = await this.contractService.createContractForBrokerAssignment(
        load.cargoOwnerId,
        tenantId,
        {
          brokerId: broker.id,
          loadId: load.id,
          agreedRate: load.offeredPrice || load.loadValue,
          currencyCode: load.currencyCode || 'KES',
          commissionRate,
          paymentTerms: load.paymentTerms || 'Net 30',
          pickupDate: load.pickupDate ? load.pickupDate.toISOString() : undefined,
          deliveryDate: load.deliveryDate ? load.deliveryDate.toISOString() : undefined,
          contractType: ContractType.BROKER_AGREEMENT,
        },
      );
      this.logger.log(`✅ Broker contract created: ${contract.id} with status PENDING_BROKER_ACCEPTANCE`);
    } catch (error) {
      this.logger.error(`Failed to create broker contract: ${error.message}`);
      // Don't fail the assignment if contract creation fails, but log it
    }

    // Send email notification to broker
    if (broker.email) {
      try {
        await this.emailService.sendBrokerLoadAssignmentEmail(
          broker.email,
          broker.profile?.firstName || 'Broker',
          load.title || 'Load',
          load.id,
          commissionRate,
          commissionAmount,
        );
        this.logger.log(`✅ Assignment email sent to broker ${broker.email}`);
      } catch (error) {
        this.logger.error(`Failed to send assignment email: ${error.message}`);
      }
    }

    return this.loadRepository.findOne({
      where: { id: loadId },
      relations: ['broker', 'broker.profile'],
    });
  }

  /**
   * Unassign broker from load
   */
  async unassignBrokerFromLoad(loadId: string, tenantId: string): Promise<Load> {
    const load = await this.loadRepository.findOne({
      where: { id: loadId, tenantId },
    });

    if (!load) {
      throw new NotFoundException('Load not found or you do not have permission');
    }

    load.brokerId = null;
    load.brokerCommissionRate = null;
    load.brokerCommissionAmount = null;

    await this.loadRepository.save(load);

    // Cancel any pending commissions for this load
    await this.brokerCommissionRepository.update(
      { loadId, status: CommissionStatus.PENDING },
      { status: CommissionStatus.CANCELLED },
    );

    return this.loadRepository.findOne({
      where: { id: loadId },
    });
  }

  /**
   * Get all loads assigned to a broker
   */
  async getLoadsByBroker(brokerId: string, tenantId: string): Promise<Load[]> {
    this.logger.log(`Getting loads for broker ${brokerId} in tenant ${tenantId}`);

    // Verify broker belongs to tenant
    await this.getBrokerById(brokerId, tenantId);

    // First, let's check if there are any loads with this brokerId at all
    const allLoadsWithBroker = await this.loadRepository.find({
      where: { brokerId },
    });
    this.logger.log(`Found ${allLoadsWithBroker.length} loads with brokerId ${brokerId} (across all tenants)`);

    const loads = await this.loadRepository.find({
      where: { brokerId, tenantId },
      relations: ['cargoOwner', 'cargoOwner.profile', 'broker', 'broker.profile'],
      order: { createdAt: 'DESC' },
    });

    this.logger.log(`Found ${loads.length} loads for broker ${brokerId} in tenant ${tenantId}`);

    // Log some details about the loads found
    if (loads.length > 0) {
      this.logger.log(`Load IDs: ${loads.map(l => l.id).join(', ')}`);
    } else {
      // Check if there are loads with brokerId but different tenantId
      if (allLoadsWithBroker.length > 0) {
        const tenantIds = [...new Set(allLoadsWithBroker.map(l => l.tenantId))];
        this.logger.warn(`Loads found with brokerId ${brokerId} but in different tenants: ${tenantIds.join(', ')}`);
      }
    }

    return loads;
  }

  /**
   * Get broker commissions
   */
  async getBrokerCommissions(
    brokerId: string,
    tenantId: string,
    query: CommissionQueryDto,
  ): Promise<{
    commissions: BrokerCommission[];
    total: number;
    totalEarned: number;
    totalPending: number;
  }> {
    // Verify broker belongs to tenant
    await this.getBrokerById(brokerId, tenantId);

    const where: FindOptionsWhere<BrokerCommission> = {
      brokerId,
      tenantId,
    };

    if (query.status) {
      where.status = query.status;
    }

    if (query.loadId) {
      where.loadId = query.loadId;
    }

    if (query.startDate || query.endDate) {
      where.createdAt = Between(
        query.startDate ? new Date(query.startDate) : new Date(0),
        query.endDate ? new Date(query.endDate) : new Date(),
      );
    }

    const [commissions, total] = await this.brokerCommissionRepository.findAndCount({
      where,
      relations: ['load', 'trip', 'broker'],
      order: { createdAt: 'DESC' },
      skip: query.page && query.limit ? (query.page - 1) * query.limit : undefined,
      take: query.limit,
    });

    // Calculate totals
    const totalEarned = await this.brokerCommissionRepository.sum('commissionAmount', {
      brokerId,
      tenantId,
      status: CommissionStatus.PAID,
    });

    const totalPending = await this.brokerCommissionRepository.sum('commissionAmount', {
      brokerId,
      tenantId,
      status: CommissionStatus.PENDING,
    });

    return {
      commissions,
      total,
      totalEarned: totalEarned || 0,
      totalPending: totalPending || 0,
    };
  }

  /**
   * Update commission status
   */
  async updateCommissionStatus(
    commissionId: string,
    tenantId: string,
    updateDto: UpdateCommissionStatusDto,
  ): Promise<BrokerCommission> {
    const commission = await this.brokerCommissionRepository.findOne({
      where: { id: commissionId, tenantId },
      relations: ['broker'],
    });

    if (!commission) {
      throw new NotFoundException('Commission not found');
    }

    const oldStatus = commission.status;
    commission.status = updateDto.status;

    if (updateDto.status === CommissionStatus.PAID) {
      commission.paidAt = new Date();
      if (updateDto.paymentReference) {
        commission.paymentReference = updateDto.paymentReference;
      }

      // Update broker's total commission earned
      if (commission.broker) {
        const broker = await this.userRepository.findOne({
          where: { id: commission.brokerId },
        });
        if (broker) {
          broker.totalCommissionEarned =
            (broker.totalCommissionEarned || 0) + commission.commissionAmount;
          await this.userRepository.save(broker);
        }
      }
    }

    await this.brokerCommissionRepository.save(commission);

    // Send email notification if status changed
    if (oldStatus !== updateDto.status) {
      await this.sendCommissionStatusEmail(commission, oldStatus, updateDto.status);
    }

    return this.brokerCommissionRepository.findOne({
      where: { id: commissionId },
      relations: ['load', 'trip', 'broker'],
    });
  }

  /**
   * Get broker statistics
   */
  async getBrokerStatistics(brokerId: string, tenantId: string): Promise<{
    totalCommissions: number;
    totalEarned: number;
    totalPending: number;
    totalApproved: number;
    totalLoads: number;
    averageCommissionRate: number;
  }> {
    await this.getBrokerById(brokerId, tenantId);

    const [totalEarned, totalPending, totalApproved] = await Promise.all([
      this.brokerCommissionRepository.sum('commissionAmount', {
        brokerId,
        tenantId,
        status: CommissionStatus.PAID,
      }),
      this.brokerCommissionRepository.sum('commissionAmount', {
        brokerId,
        tenantId,
        status: CommissionStatus.PENDING,
      }),
      this.brokerCommissionRepository.sum('commissionAmount', {
        brokerId,
        tenantId,
        status: CommissionStatus.APPROVED,
      }),
    ]);

    const totalCommissions = (totalEarned || 0) + (totalPending || 0) + (totalApproved || 0);

    const totalLoads = await this.loadRepository.count({
      where: { brokerId, tenantId },
    });

    const commissions = await this.brokerCommissionRepository.find({
      where: { brokerId, tenantId },
      select: ['commissionRate'],
    });

    const averageCommissionRate =
      commissions.length > 0
        ? commissions.reduce((sum, c) => sum + (c.commissionRate || 0), 0) /
        commissions.length
        : 0;

    return {
      totalCommissions,
      totalEarned: totalEarned || 0,
      totalPending: totalPending || 0,
      totalApproved: totalApproved || 0,
      totalLoads,
      averageCommissionRate,
    };
  }

  /**
   * Create commission record (public method for use by other services)
   */
  async createCommissionRecord(
    load: Load,
    broker: User,
    commissionRate: number,
    commissionAmount: number,
  ): Promise<BrokerCommission> {
    // Check if commission already exists
    const existingCommission = await this.brokerCommissionRepository.findOne({
      where: { loadId: load.id, brokerId: broker.id },
    });

    if (existingCommission) {
      // Update existing commission
      existingCommission.loadAmount = load.loadValue;
      existingCommission.commissionRate = commissionRate;
      existingCommission.commissionAmount = commissionAmount;
      existingCommission.status = CommissionStatus.PENDING;
      return await this.brokerCommissionRepository.save(existingCommission);
    }

    // Create new commission
    const commission = this.brokerCommissionRepository.create({
      tenantId: load.tenantId,
      brokerId: broker.id,
      loadId: load.id,
      loadAmount: load.loadValue,
      commissionRate,
      commissionAmount,
      status: CommissionStatus.PENDING,
    });

    return await this.brokerCommissionRepository.save(commission);
  }

  /**
   * Request commission payout
   */
  async requestPayout(
    commissionId: string,
    tenantId: string,
    brokerId: string,
    payoutDto: CreatePayoutRequestDto,
  ): Promise<any> {
    const commission = await this.brokerCommissionRepository.findOne({
      where: { id: commissionId, brokerId, tenantId },
      relations: ['broker'],
    });

    if (!commission) {
      throw new NotFoundException('Commission not found');
    }

    if (commission.status !== CommissionStatus.APPROVED) {
      throw new BadRequestException('Only approved commissions can be requested for payout');
    }

    // Create payout request (you would create a PayoutRequest entity for this)
    const payoutRequest = {
      id: crypto.randomUUID(),
      commissionId,
      brokerId,
      tenantId,
      amount: commission.commissionAmount,
      payoutMethod: payoutDto.payoutMethod,
      accountDetails: payoutDto.accountDetails,
      bankName: payoutDto.bankName,
      accountHolderName: payoutDto.accountHolderName,
      status: 'PENDING',
      createdAt: new Date(),
    };

    // Send email notification to broker
    if (commission.broker?.email) {
      try {
        await this.emailService.sendCommissionPayoutRequestEmail(
          commission.broker.email,
          commission.broker.profile?.firstName || 'Broker',
          commission.commissionAmount,
          payoutDto.payoutMethod,
          payoutDto.accountDetails,
        );
      } catch (error) {
        this.logger.error(`Failed to send payout request email: ${error.message}`);
      }
    }

    this.logger.log(`Payout request created for commission ${commissionId}`);
    return payoutRequest;
  }

  /**
   * Get payout requests for a broker
   */
  async getPayoutRequests(
    brokerId: string,
    tenantId: string,
    query: any,
  ): Promise<any[]> {
    // This would query a PayoutRequest entity
    // For now, return empty array as placeholder
    return [];
  }

  /**
   * Get broker contracts
   */
  async getBrokerContracts(tenantId: string, brokerId?: string): Promise<any[]> {
    // Return empty array for now - contracts feature to be implemented
    return [];
  }

  /**
   * Send email notification when commission status changes
   */
  async sendCommissionStatusEmail(
    commission: BrokerCommission,
    oldStatus: CommissionStatus,
    newStatus: CommissionStatus,
  ): Promise<void> {
    if (!commission.broker?.email) {
      return;
    }

    const statusMessages: Record<string, { subject: string; template: string }> = {
      APPROVED: {
        subject: 'Commission Approved',
        template: 'commission-approved',
      },
      PAID: {
        subject: 'Commission Paid',
        template: 'commission-paid',
      },
      CANCELLED: {
        subject: 'Commission Cancelled',
        template: 'commission-cancelled',
      },
    };

    const message = statusMessages[newStatus];
    if (message) {
      try {
        await this.emailService.sendCommissionStatusUpdateEmail(
          commission.broker.email,
          commission.broker.profile?.firstName || 'Broker',
          commission.load?.title || 'Load',
          commission.commissionAmount,
          newStatus,
        );
      } catch (error) {
        this.logger.error(`Failed to send commission status email: ${error.message}`);
      }
    }
  }
}

