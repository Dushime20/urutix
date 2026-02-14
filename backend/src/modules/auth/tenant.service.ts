import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, FindOptionsOrder, ILike, In, Repository } from 'typeorm';
import { Tenant, TenantStatus, TenantType } from '../../entities/tenant.entity';
import { User, UserRole, UserStatus } from '../../entities/user.entity';
import { UserProfile } from '../../entities/user-profile.entity';
import { PasswordResetToken } from '../../entities/password-reset-token.entity';
import { FindTenantsDto } from './dto/tenant.dto';
import { PaginatorResponse, Paginators } from '../../utils/paginator';
import { mergeWhere } from '../../utils/query';
import { EmailService } from './email.service';
import * as crypto from 'crypto';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class TenantService {
  private readonly logger = new Logger(TenantService.name);

  constructor(
    @InjectRepository(Tenant)
    private readonly tenantRepository: Repository<Tenant>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(UserProfile)
    private readonly userProfileRepository: Repository<UserProfile>,
    @InjectRepository(PasswordResetToken)
    private readonly passwordResetTokenRepository: Repository<PasswordResetToken>,
    private readonly emailService: EmailService,
  ) { }

  async createTenant(createTenantDto: any): Promise<Tenant> {
    this.logger.log('🏢 Creating tenant...');
    this.logger.log(`Tenant data: ${JSON.stringify(createTenantDto)}`);

    // Check if subdomain already exists
    if (createTenantDto.subdomain) {
      const existingTenant = await this.tenantRepository.findOne({
        where: { subdomain: createTenantDto.subdomain },
      });

      if (existingTenant) {
        throw new ConflictException('Subdomain already exists');
      }
    }

    // Validate contact email is provided
    if (!createTenantDto.contactEmail || createTenantDto.contactEmail.trim() === '') {
      throw new BadRequestException(
        'Contact email is required to create a tenant account. Please provide a valid email address.',
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const normalizedEmail = createTenantDto.contactEmail.trim().toLowerCase();
    if (!emailRegex.test(normalizedEmail)) {
      throw new BadRequestException(
        'Invalid email format. Please provide a valid email address.',
      );
    }

    this.logger.log(`📧 Contact email from form: ${createTenantDto.contactEmail}`);
    this.logger.log(`📧 Normalized email (will be used for user account and email): ${normalizedEmail}`);

    // Create tenant
    const tenant = this.tenantRepository.create({
      ...createTenantDto,
      status: TenantStatus.PENDING_ACTIVATION,
    });

    const savedTenant = await this.tenantRepository.save(tenant);
    const finalTenant = Array.isArray(savedTenant) ? savedTenant[0] : savedTenant;

    this.logger.log(`✅ Tenant created with ID: ${finalTenant.id}`);
    this.logger.log(`📧 Email will be sent to: ${normalizedEmail} (from contactEmail field)`);

    // Create tenant admin user account
    try {
      // Check if user already exists
      let tenantAdminUser = await this.userRepository.findOne({
        where: { email: normalizedEmail },
      });

      if (tenantAdminUser) {
        this.logger.log(`👤 User ${normalizedEmail} already exists, updating...`);

        // Update user role to TENANT_ADMIN if not already
        if (tenantAdminUser.role !== UserRole.TENANT_ADMIN) {
          tenantAdminUser.role = UserRole.TENANT_ADMIN;
        }

        // Update tenant ID
        tenantAdminUser.tenantId = finalTenant.id;

        // Set status to PENDING_VERIFICATION if not active or doesn't have password
        if (tenantAdminUser.status !== UserStatus.ACTIVE || !tenantAdminUser.passwordHash) {
          tenantAdminUser.status = UserStatus.PENDING_VERIFICATION;
        }

        await this.userRepository.save(tenantAdminUser);

        // Update or create user profile
        let userProfile = await this.userProfileRepository.findOne({
          where: { userId: tenantAdminUser.id },
        });

        if (userProfile) {
          // Extract name from tenant name or use defaults
          const nameParts = (finalTenant.name || 'Tenant Admin').split(' ');
          userProfile.firstName = nameParts[0] || 'Tenant';
          userProfile.lastName = nameParts.slice(1).join(' ') || 'Admin';
          if (!userProfile.tenantId) {
            userProfile.tenantId = finalTenant.id;
          }
          await this.userProfileRepository.save(userProfile);
        } else {
          const nameParts = (finalTenant.name || 'Tenant Admin').split(' ');
          userProfile = this.userProfileRepository.create({
            userId: tenantAdminUser.id,
            tenantId: finalTenant.id,
            firstName: nameParts[0] || 'Tenant',
            lastName: nameParts.slice(1).join(' ') || 'Admin',
          });
          await this.userProfileRepository.save(userProfile);
        }

        // Always send password setup email when creating a tenant
        // This ensures the tenant admin is notified about their new role, even if they already exist
        this.logger.log(`📧 Sending password setup email for tenant admin (existing user)...`);
        this.logger.log(`📧 User status: ${tenantAdminUser.status}, Has password: ${!!tenantAdminUser.passwordHash}`);
        await this.sendTenantPasswordSetupEmail(
          normalizedEmail,
          userProfile.firstName,
          userProfile.lastName,
          finalTenant.name,
          finalTenant.id,
        );
      } else {
        // Create new user for tenant admin
        this.logger.log(`👤 Creating new tenant admin user account...`);

        // Generate temporary password (will be replaced when tenant admin sets password)
        const tempPassword = crypto.randomBytes(32).toString('hex');
        const tempPasswordHash = await bcrypt.hash(tempPassword, 12);

        tenantAdminUser = this.userRepository.create({
          email: normalizedEmail,
          passwordHash: tempPasswordHash,
          role: UserRole.TENANT_ADMIN,
          status: UserStatus.PENDING_VERIFICATION,
          tenantId: finalTenant.id,
        });

        tenantAdminUser = await this.userRepository.save(tenantAdminUser);
        this.logger.log(`✅ Tenant admin user created with ID: ${tenantAdminUser.id}`);

        // Create user profile
        const nameParts = (finalTenant.name || 'Tenant Admin').split(' ');
        const userProfile = this.userProfileRepository.create({
          userId: tenantAdminUser.id,
          tenantId: finalTenant.id,
          firstName: nameParts[0] || 'Tenant',
          lastName: nameParts.slice(1).join(' ') || 'Admin',
        });
        await this.userProfileRepository.save(userProfile);

        // Send password setup email (always send for new users)
        this.logger.log(`📧 Sending password setup email for new tenant admin user...`);
        await this.sendTenantPasswordSetupEmail(
          normalizedEmail,
          userProfile.firstName,
          userProfile.lastName,
          finalTenant.name,
          finalTenant.id,
        );
      }
    } catch (error: any) {
      this.logger.error(`❌ Error creating tenant admin user: ${error.message}`);
      this.logger.error(`❌ Error stack: ${error.stack}`);
      if (error.code) {
        this.logger.error(`❌ Error code: ${error.code}`);
      }
      // Don't fail tenant creation if user creation fails, but log it
      this.logger.warn('Tenant created but user account creation failed. User can be created manually later.');
      // Re-throw if it's a critical error that should prevent tenant creation
      if (error instanceof BadRequestException || error instanceof ConflictException) {
        throw error;
      }
    }

    return finalTenant;
  }

  private async sendTenantPasswordSetupEmail(
    email: string,
    firstName: string,
    lastName: string,
    tenantName: string,
    tenantId: string,
  ): Promise<void> {
    try {
      this.logger.log('📧 ========== TENANT EMAIL SENDING PROCESS START ==========');
      this.logger.log(`📧 Preparing to send tenant password setup email to: ${email}`);
      this.logger.log(`📧 Email address (from contactEmail field): ${email}`);
      this.logger.log(`📧 Tenant name: ${tenantName}`);
      this.logger.log(`📧 First name: ${firstName}, Last name: ${lastName}`);
      this.logger.log(`📧 EmailService instance: ${this.emailService ? 'EXISTS' : 'MISSING'}`);

      // Validate email is not empty
      if (!email || email.trim() === '') {
        this.logger.error('❌ Email address is empty! Cannot send email.');
        return;
      }

      // Generate password setup token
      const token = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // Token expires in 7 days

      const passwordSetupToken = this.passwordResetTokenRepository.create({
        email: email,
        token,
        expiresAt,
        used: false,
      });
      await this.passwordResetTokenRepository.save(passwordSetupToken);

      this.logger.log(`📧 Token generated for tenant admin: ${email}`);
      this.logger.log(`📧 Token (first 10 chars): ${token.substring(0, 10)}...`);

      // Send password setup email (non-blocking)
      try {
        if (!this.emailService) {
          this.logger.error('❌ EmailService is not injected properly!');
          this.logger.warn('⚠️ EmailService is not available, skipping email send');
          return;
        }

        this.logger.log('📧 Calling emailService.sendTenantPasswordSetupEmail...');
        this.logger.log(`📧 Email address being sent to: ${email}`);

        await this.emailService.sendTenantPasswordSetupEmail(
          email,
          firstName,
          lastName,
          tenantName,
          token,
        );

        this.logger.log(`✅ Password setup email sent successfully to: ${email}`);
        this.logger.log(`✅ Check the inbox (and spam folder) for: ${email}`);
      } catch (emailError: any) {
        this.logger.error(`❌ Failed to send password setup email: ${emailError.message}`);
        this.logger.error(`❌ Error stack: ${emailError.stack}`);
        if (emailError.code) {
          this.logger.error(`❌ Error code: ${emailError.code}`);
        }
        if (emailError.response) {
          this.logger.error(`❌ Error response: ${emailError.response}`);
        }
        if (emailError.responseCode) {
          this.logger.error(`❌ Error response code: ${emailError.responseCode}`);
        }
        if (emailError.command) {
          this.logger.error(`❌ Failed command: ${emailError.command}`);
        }
        this.logger.error(`❌ Full email error:`, JSON.stringify(emailError, Object.getOwnPropertyNames(emailError)));
        // Don't throw - tenant creation should succeed even if email fails
      }

      this.logger.log('📧 ========== TENANT EMAIL SENDING PROCESS END ==========');
    } catch (error: any) {
      this.logger.error(`❌ Error in sendTenantPasswordSetupEmail: ${error.message}`);
      this.logger.error(`❌ Error stack: ${error.stack}`);
      // Don't throw - tenant creation should succeed even if email fails
    }
  }

  async findTenantById(id: string): Promise<Tenant> {
    const tenant = await this.tenantRepository.findOne({
      where: { id },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    return tenant;
  }

  async findTenantBySubdomain(subdomain: string): Promise<Tenant> {
    const tenant = await this.tenantRepository.findOne({
      where: { subdomain },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    return tenant;
  }

  async findTenantByDomain(domain: string): Promise<Tenant> {
    const tenant = await this.tenantRepository.findOne({
      where: { domain },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    return tenant;
  }

  async updateTenant(id: string, updateTenantDto: any): Promise<Tenant> {
    const tenant = await this.findTenantById(id);

    // Check if subdomain is being changed and if it conflicts
    if (
      updateTenantDto.subdomain &&
      updateTenantDto.subdomain !== tenant.subdomain
    ) {
      const existingTenant = await this.tenantRepository.findOne({
        where: { subdomain: updateTenantDto.subdomain },
      });

      if (existingTenant) {
        throw new ConflictException('Subdomain already exists');
      }
    }

    // Prevent updating status to DEACTIVATED through update endpoint
    // Use delete endpoint for deactivation
    if (updateTenantDto.status === TenantStatus.DEACTIVATED) {
      delete updateTenantDto.status;
    }

    Object.assign(tenant, updateTenantDto);
    return this.tenantRepository.save(tenant);
  }

  async activateTenant(id: string): Promise<Tenant> {
    const tenant = await this.findTenantById(id);

    // Validation: Check if tenant can be activated
    const validationErrors: string[] = [];

    // 1. Check required fields
    if (!tenant.name || tenant.name.trim().length === 0) {
      validationErrors.push('Tenant name is required');
    }

    if (!tenant.subdomain || tenant.subdomain.trim().length === 0) {
      validationErrors.push('Tenant subdomain is required');
    }

    if (!tenant.contactEmail || tenant.contactEmail.trim().length === 0) {
      validationErrors.push('Contact email is required');
    }

    // 2. Check if tenant has at least one admin user
    const adminUsers = await this.userRepository.find({
      where: {
        tenantId: tenant.id,
        role: UserRole.TENANT_ADMIN,
      } as any,
    });

    if (adminUsers.length === 0) {
      validationErrors.push('Tenant must have at least one admin user before activation');
    }

    // 3. Check if tenant is not already deactivated
    if (tenant.status === TenantStatus.DEACTIVATED) {
      validationErrors.push('Cannot activate a deactivated tenant. Please restore it first.');
    }

    // 4. Check if domain exists (should be set during creation)
    if (!tenant.domain || tenant.domain.trim().length === 0) {
      validationErrors.push('Tenant domain is required. Please ensure domain is set.');
    }

    if (validationErrors.length > 0) {
      throw new BadRequestException(
        `Cannot activate tenant. Missing requirements: ${validationErrors.join(', ')}`,
      );
    }

    // All validations passed - activate tenant
    tenant.status = TenantStatus.ACTIVE;
    tenant.activatedAt = new Date();
    tenant.isActive = true;
    return this.tenantRepository.save(tenant);
  }

  async suspendTenant(id: string, reason?: string): Promise<Tenant> {
    const tenant = await this.findTenantById(id);
    tenant.status = TenantStatus.SUSPENDED;
    tenant.suspendedAt = new Date();
    tenant.suspendedReason = reason;
    tenant.isActive = false;
    return this.tenantRepository.save(tenant);
  }

  async deleteTenant(id: string): Promise<Tenant> {
    const tenant = await this.findTenantById(id);
    // Soft delete: change status to DEACTIVATED and set isActive to false
    tenant.status = TenantStatus.DEACTIVATED;
    tenant.isActive = false;
    return this.tenantRepository.save(tenant);
  }

  async getAllTenants(): Promise<Tenant[]> {
    return this.tenantRepository.find();
  }

  async getSearchedTenants(query: FindTenantsDto) {
    console.log('🔍 [SERVICE] getSearchedTenants called with query:', query);
    const { q } = query;
    const { skip, limit, sorts } = Paginators(query);

    // For signup flow, return ONLY ACTIVE tenants
    // Users should only be able to sign up for companies that are active
    // IMPORTANT: This query must return ALL active tenants for the company selection dropdown
    // Using enum value ensures case-sensitive match with database enum type
    // Note: We only filter by status, not isActive, to include all ACTIVE tenants
    // (some tenants may have isActive=false if manually updated, but status=ACTIVE is the primary indicator)
    let where: FindOptionsWhere<Tenant>[] | FindOptionsWhere<Tenant> = {
      status: TenantStatus.ACTIVE, // This matches 'ACTIVE' in the database enum
      // Note: Not filtering by isActive to ensure all ACTIVE status tenants are included
    };

    // If there's a search query, add name filter
    if (q) {
      where = {
        ...where,
        name: ILike(`%${q}%`),
      };
    }

    console.log('🔍 [SERVICE] Where clause (ACTIVE tenants only):', JSON.stringify(where));
    console.log('🔍 [SERVICE] Query string:', q || 'empty (showing all active tenants)');

    // For public signup, return ALL active tenants (up to 1000 to ensure we get all)
    // This ensures all active companies appear in the signup dropdown
    const maxLimit = limit && limit > 0 ? Math.min(limit, 1000) : 1000;
    console.log('🔍 [SERVICE] Max limit:', maxLimit, '(ensuring all active tenants are included)');

    // Convert sorts from Record<string, number> to TypeORM format { field: 'ASC' | 'DESC' }
    // Paginators returns { name: 1 } or { name: -1 }, but TypeORM needs { name: 'ASC' } or { name: 'DESC' }
    let orderBy: FindOptionsOrder<Tenant> = { name: 'ASC' };
    if (sorts && typeof sorts === 'object' && !Array.isArray(sorts)) {
      // Convert numeric values (1 = ASC, -1 = DESC) to TypeORM format
      orderBy = Object.entries(sorts).reduce((acc, [key, value]) => {
        acc[key as keyof Tenant] = (value === 1 ? 'ASC' : 'DESC') as 'ASC' | 'DESC';
        return acc;
      }, {} as FindOptionsOrder<Tenant>);
    }

    const [tenants, total] = await this.tenantRepository.findAndCount({
      where,
      select: ['id', 'name', 'country', 'city', 'logoUrl', 'websiteUrl', 'status', 'isActive'],
      order: orderBy,
      skip: skip || 0,
      take: maxLimit,
    });

    console.log('✅ [SERVICE] Found tenants:', tenants.length, 'out of', total);
    console.log('✅ [SERVICE] All tenants from DB (no filters):', JSON.stringify(tenants, null, 2));
    console.log('✅ [SERVICE] Tenant names:', tenants.map(t => t.name));
    console.log('✅ [SERVICE] Tenant statuses:', tenants.map(t => ({
      name: t.name,
      status: (t as any).status,
      isActive: (t as any).isActive
    })));

    const response = PaginatorResponse(tenants, total, maxLimit, skip || 0);
    console.log('✅ [SERVICE] Paginated response:', JSON.stringify(response, null, 2));
    return response;
  }

  async getActiveTenants(): Promise<Tenant[]> {
    return this.tenantRepository.find({
      where: { status: TenantStatus.ACTIVE, isActive: true },
    });
  }

  async getTenantStats(id: string) {
    const tenant = await this.findTenantById(id);

    // TODO: Implement tenant statistics
    // This could include user count, load count, revenue, etc.

    return {
      tenantId: tenant.id,
      name: tenant.name,
      status: tenant.status,
      // kycStatus: tenant.kycStatus, // TODO: Add KYC fields to Tenant entity
      // Add more stats as needed
    };
  }

  async submitKYC(id: string, kycData: any): Promise<Tenant> {
    const tenant = await this.findTenantById(id);

    // TODO: Add KYC fields to Tenant entity
    // tenant.kycData = { ...tenant.kycData, ...kycData };
    // tenant.kycStatus = 'SUBMITTED';
    // tenant.kycSubmittedAt = new Date();

    // Auto-update standard fields if provided in KYC
    if (kycData.registrationNumber) tenant.businessLicense = kycData.registrationNumber;
    if (kycData.taxId) tenant.taxId = kycData.taxId;

    this.logger.log(`📝 KYC submitted for tenant ${id}`);
    return this.tenantRepository.save(tenant);
  }

  async updateKYCStatus(id: string, status: 'APPROVED' | 'REJECTED' | 'INCOMPLETE', notes?: string): Promise<Tenant> {
    const tenant = await this.findTenantById(id);

    // TODO: Add KYC fields to Tenant entity
    // tenant.kycStatus = status;
    // tenant.kycNotes = notes;

    if (status === 'APPROVED') {
      // tenant.kycVerifiedAt = new Date();
      // Optionally activate tenant if they were pending activation
      if (tenant.status === TenantStatus.PENDING_ACTIVATION) {
        tenant.status = TenantStatus.ACTIVE;
        tenant.activatedAt = new Date();
        tenant.isActive = true;
      }
    }

    this.logger.log(`📝 KYC status updated for tenant ${id} to ${status}`);
    return this.tenantRepository.save(tenant);
  }

  async getTenantsByKYCStatus(status: 'PENDING' | 'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'INCOMPLETE'): Promise<Tenant[]> {
    // TODO: Add KYC fields to Tenant entity
    return this.tenantRepository.find({
      // where: { kycStatus: status },
      // order: { kycSubmittedAt: 'DESC' }
    });
  }

  async updateOnboardingStep(id: string, step: number): Promise<Tenant> {
    const tenant = await this.findTenantById(id);
    // TODO: Add onboardingStep field to Tenant entity
    // tenant.onboardingStep = step;
    return this.tenantRepository.save(tenant);
  }

  async updateBranding(id: string, branding: { primaryColor?: string; secondaryColor?: string; faviconUrl?: string; portalTitle?: string; description?: string; name?: string; }): Promise<Tenant> {
    const tenant = await this.findTenantById(id);
    Object.assign(tenant, branding);
    return this.tenantRepository.save(tenant);
  }

  async updateTenantConfig(id: string, config: { domain?: string; subdomain?: string; termsUrl?: string; privacyPolicyUrl?: string; dataResidency?: string; }): Promise<Tenant> {
    const tenant = await this.findTenantById(id);

    // Check subdomain uniqueness if changing
    if (config.subdomain && config.subdomain !== tenant.subdomain) {
      const existing = await this.tenantRepository.findOne({ where: { subdomain: config.subdomain } });
      if (existing) throw new ConflictException('Subdomain already taken');
    }

    Object.assign(tenant, config);
    return this.tenantRepository.save(tenant);
  }

  async setSubscriptionPlan(id: string, plan: string): Promise<Tenant> {
    const tenant = await this.findTenantById(id);
    tenant.subscriptionPlan = plan;
    // Set default limits based on plan (simplified logic)
    if (plan === 'ENTERPRISE') {
      tenant.maxUsers = 1000;
      // tenant.storageLimit = 107374182400; // 100GB // TODO: Add storageLimit to Tenant entity
    } else if (plan === 'PRO') {
      tenant.maxUsers = 50;
      // tenant.storageLimit = 21474836480; // 20GB
    } else {
      tenant.maxUsers = 5;
      // tenant.storageLimit = 5368709120; // 5GB
    }
    return this.tenantRepository.save(tenant);
  }
}
