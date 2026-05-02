import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole, UserStatus } from '../../entities/user.entity';
import { UserProfile } from '../../entities/user-profile.entity';
import { Tenant, TenantStatus } from '../../entities/tenant.entity';
import { PasswordResetToken } from '../../entities/password-reset-token.entity';
import { EmailService } from '../auth/services/email.service';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';

export interface CreateTenantUserDto {
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  tenantId: string;
  companyName?: string;
  phoneNumber?: string;
  sendPasswordSetupEmail?: boolean; // Optional flag to control email sending
}

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(UserProfile)
    private readonly userProfileRepository: Repository<UserProfile>,
    @InjectRepository(Tenant)
    private readonly tenantRepository: Repository<Tenant>,
    @InjectRepository(PasswordResetToken)
    private readonly passwordResetTokenRepository: Repository<PasswordResetToken>,
    private readonly emailService: EmailService,
  ) { }

  async create(payload: any) {
    // Implement user creation logic here
    // e.g., validate payload, save to DB, return user object
    return { id: 'new-user-id', ...payload };
  }

  async checkTenantRoleExists(role: UserRole): Promise<boolean> {
    // Check if the role is a valid tenant role
    const validTenantRoles = [
      UserRole.TENANT_ADMIN,
      UserRole.CARGO_OWNER,
      UserRole.CARGO_RECEIVER,
      UserRole.TRUCK_OWNER,
      UserRole.DRIVER,
      UserRole.AGENT,
      UserRole.LENDER,
      UserRole.BROKER,
      UserRole.FLEET_MANAGER,
      UserRole.FLEET_DISPATCHER,
      UserRole.FLEET_ACCOUNTANT,
      UserRole.FLEET_SAFETY_OFFICER,
    ];

    return validTenantRoles.includes(role);
  }

  async createTenantUser(createUserDto: CreateTenantUserDto): Promise<User> {
    // Verify tenant exists
    const tenant = await this.tenantRepository.findOne({
      where: { id: createUserDto.tenantId },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    // Check if tenant is active or if we are creating the initial tenant admin for a pending tenant
    if (tenant.status !== TenantStatus.ACTIVE && !(tenant.status === TenantStatus.PENDING_ACTIVATION && createUserDto.role === UserRole.TENANT_ADMIN)) {
      throw new ConflictException(
        `Cannot create users for tenant with status: ${tenant.status}. Tenant must be ACTIVE.`,
      );
    }

    // Check if role is valid for tenant
    if (!(await this.checkTenantRoleExists(createUserDto.role))) {
      throw new ConflictException(
        `Role ${createUserDto.role} is not valid for tenant users`,
      );
    }

    // Check if user already exists in tenant
    const existingUser = await this.userRepository.findOne({
      where: {
        email: createUserDto.email,
        tenantId: createUserDto.tenantId,
      },
    });

    if (existingUser) {
      throw new ConflictException(
        'User with this email already exists in this tenant',
      );
    }

    // Create user without password initially - they'll set it via email link
    const user = this.userRepository.create({
      email: createUserDto.email,
      passwordHash: null, // No password initially
      role: createUserDto.role,
      status: UserStatus.PENDING_VERIFICATION, // User needs to set password first
      tenantId: createUserDto.tenantId,
      emailVerifiedAt: null, // Will be set when they complete password setup
      phone: createUserDto.phoneNumber,
      // Set brokerTenantId for brokers so they can be queried by tenant
      ...(createUserDto.role === UserRole.BROKER && {
        brokerTenantId: createUserDto.tenantId,
      }),
    });

    const savedUser = await this.userRepository.save(user);

    // Create user profile
    const userProfile = this.userProfileRepository.create({
      userId: savedUser.id,
      tenantId: savedUser.tenantId,
      firstName: createUserDto.firstName,
      lastName: createUserDto.lastName,
      companyName: createUserDto.companyName,
    });

    await this.userProfileRepository.save(userProfile);

    // Generate password setup token and send email (if enabled)
    if (createUserDto.sendPasswordSetupEmail !== false) { // Default to true
      try {
        await this.sendPasswordSetupEmail(savedUser, createUserDto.firstName, createUserDto.lastName);
      } catch (emailError) {
        // Log email error but don't fail user creation
        console.error('Failed to send password setup email:', emailError);
        // You might want to set a flag on the user indicating email failed
      }
    }

    // Remove sensitive data before returning
    const { passwordHash, ...userWithoutPassword } = savedUser;
    return userWithoutPassword as User;
  }

  private async sendPasswordSetupEmail(user: User, firstName: string, lastName: string): Promise<void> {
    // Generate password setup token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // Token expires in 7 days

    // Invalidate any existing tokens for this email
    await this.passwordResetTokenRepository.update(
      { email: user.email, used: false },
      { used: true },
    );

    // Create new password setup token
    const passwordSetupToken = this.passwordResetTokenRepository.create({
      email: user.email,
      token,
      expiresAt,
      used: false,
    });

    await this.passwordResetTokenRepository.save(passwordSetupToken);

    // Send appropriate email based on user role
    switch (user.role) {
      case UserRole.DRIVER:
        await this.emailService.sendDriverPasswordSetupEmail(
          user.email,
          firstName,
          lastName,
          token,
        );
        break;
      case UserRole.CARGO_OWNER:
        await this.emailService.sendCargoOwnerPasswordSetupEmail(
          user.email,
          firstName,
          lastName,
          token,
        );
        break;
      case UserRole.BROKER:
        await this.emailService.sendBrokerPasswordSetupEmail(
          user.email,
          firstName,
          lastName,
          token,
        );
        break;
      case UserRole.TRUCK_OWNER:
        await this.emailService.sendTruckOwnerPasswordSetupEmail(
          user.email,
          firstName,
          lastName,
          token,
        );
        break;
      case UserRole.AGENT:
        await this.emailService.sendAgentPasswordSetupEmail(
          user.email,
          firstName,
          lastName,
          token,
        );
        break;
      case UserRole.LENDER:
        // Get tenant name for lender email
        const tenant = await this.tenantRepository.findOne({
          where: { id: user.tenantId },
        });
        const lenderName = tenant?.name || 'Lender Account';
        await this.emailService.sendLenderPasswordSetupEmail(
          user.email,
          lenderName,
          token,
        );
        break;
      case UserRole.TENANT_ADMIN:
        // Get tenant name for tenant admin email
        const tenantForAdmin = await this.tenantRepository.findOne({
          where: { id: user.tenantId },
        });
        const tenantName = tenantForAdmin?.name || 'Tenant Account';
        await this.emailService.sendTenantPasswordSetupEmail(
          user.email,
          firstName,
          lastName,
          tenantName,
          token,
        );
        break;
      default:
        // Fallback for any other roles - should not happen with current roles
        await this.sendGenericPasswordSetupEmail(user.email, firstName, lastName, user.role, token);
        break;
    }
  }

  private async sendGenericPasswordSetupEmail(
    email: string,
    firstName: string,
    lastName: string,
    role: UserRole,
    token: string,
  ): Promise<void> {
    // For now, we'll use the driver email template as a base
    // In the future, you might want to create role-specific templates
    await this.emailService.sendDriverPasswordSetupEmail(
      email,
      firstName,
      lastName,
      token,
    );
  }

  async createTenantAdminUser(
    tenantId: string,
    adminData: Omit<CreateTenantUserDto, 'tenantId' | 'role'>,
  ): Promise<User> {
    return this.createTenantUser({
      ...adminData,
      tenantId,
      role: UserRole.TENANT_ADMIN,
    });
  }

  async findUsersByTenant(tenantId: string): Promise<User[]> {
    return this.userRepository.find({
      where: { tenantId },
      relations: ['profile'],
    });
  }

  async findUsersByTenantAndRole(
    tenantId: string,
    role: UserRole,
  ): Promise<User[]> {
    return this.userRepository.find({
      where: { tenantId, role },
      relations: ['profile'],
    });
  }

  async findUsersByRole(role: UserRole): Promise<User[]> {
    return this.userRepository.find({
      where: { role },
      relations: ['profile'],
    });
  }

  async findAll(): Promise<User[]> {
    return this.userRepository.find({
      relations: ['profile'],
    });
  }

  async findById(id: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { id },
      relations: ['profile'],
    });
  }

  async updateUser(id: string, updateData: any): Promise<User | null> {
    const user = await this.findById(id);
    if (!user) {
      return null;
    }

    // Update user fields
    if (updateData.email) user.email = updateData.email;
    if (updateData.status) user.status = updateData.status;
    if (updateData.phone) user.phone = updateData.phone;

    const updatedUser = await this.userRepository.save(user);

    // Update profile if provided
    if (updateData.profile && user.profile) {
      const profile = user.profile;
      if (updateData.profile.firstName) profile.firstName = updateData.profile.firstName;
      if (updateData.profile.lastName) profile.lastName = updateData.profile.lastName;
      if (updateData.profile.companyName) profile.companyName = updateData.profile.companyName;
      
      await this.userProfileRepository.save(profile);
    }

    return this.findById(id);
  }
}
