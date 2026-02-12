import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole, UserStatus } from '../../entities/user.entity';
import { UserProfile } from '../../entities/user-profile.entity';
import { Tenant } from '../../entities/tenant.entity';
import * as bcrypt from 'bcryptjs';

export interface CreateTenantUserDto {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  tenantId: string;
  companyName?: string;
  phoneNumber?: string;
}

export interface UpdateUserDto {
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  companyName?: string;
  role?: UserRole;
  status?: UserStatus;
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
      UserRole.TRUCK_OWNER,
      UserRole.DRIVER,
      UserRole.AGENT,
      UserRole.LENDER,
      UserRole.BROKER,
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

    // Hash password
    const hashedPassword = await bcrypt.hash(createUserDto.password, 12);

    // Create user
    const user = this.userRepository.create({
      email: createUserDto.email,
      passwordHash: hashedPassword,
      role: createUserDto.role,
      status: UserStatus.ACTIVE, // Activate immediately for tenant users
      tenantId: createUserDto.tenantId,
      emailVerifiedAt: new Date(), // Auto-verify for tenant users
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

    // Remove sensitive data before returning
    const { passwordHash, ...userWithoutPassword } = savedUser;
    return userWithoutPassword as User;
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

  async findUserById(userId: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['profile'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async updateUser(userId: string, updateDto: UpdateUserDto): Promise<User> {
    const user = await this.findUserById(userId);

    // Update user profile if profile fields are provided
    if (updateDto.firstName || updateDto.lastName || updateDto.companyName || updateDto.phoneNumber) {
      const profile = await this.userProfileRepository.findOne({
        where: { userId },
      });

      if (profile) {
        if (updateDto.firstName) profile.firstName = updateDto.firstName;
        if (updateDto.lastName) profile.lastName = updateDto.lastName;
        if (updateDto.companyName) profile.companyName = updateDto.companyName;
        await this.userProfileRepository.save(profile);
      }
    }

    // Update user phone if provided
    if (updateDto.phoneNumber) {
      user.phone = updateDto.phoneNumber;
    }

    // Update role if provided (with validation)
    if (updateDto.role && updateDto.role !== user.role) {
      if (!(await this.checkTenantRoleExists(updateDto.role))) {
        throw new ConflictException(`Role ${updateDto.role} is not valid`);
      }
      user.role = updateDto.role;
    }

    // Update status if provided
    if (updateDto.status) {
      user.status = updateDto.status;
    }

    const updatedUser = await this.userRepository.save(user);

    // Reload with relations
    return this.findUserById(updatedUser.id);
  }

  async deleteUser(userId: string): Promise<void> {
    const user = await this.findUserById(userId);

    // Soft delete - set status to DEACTIVATED
    user.status = UserStatus.DEACTIVATED;

    await this.userRepository.save(user);
  }

  async updateUserStatus(userId: string, status: UserStatus): Promise<User> {
    const user = await this.findUserById(userId);
    user.status = status;
    await this.userRepository.save(user);
    return this.findUserById(userId);
  }

  async changeUserRole(userId: string, role: UserRole): Promise<User> {
    const user = await this.findUserById(userId);

    // Validate role
    if (!(await this.checkTenantRoleExists(role))) {
      throw new ConflictException(`Role ${role} is not valid for tenant users`);
    }

    user.role = role;
    await this.userRepository.save(user);
    return this.findUserById(userId);
  }

  async resetUserPassword(userId: string, newPassword: string): Promise<void> {
    const user = await this.findUserById(userId);

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    user.passwordHash = hashedPassword;

    await this.userRepository.save(user);
  }
}
