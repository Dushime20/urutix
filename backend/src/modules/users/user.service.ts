import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../entities/user.entity';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async findById(id: string): Promise<User | null> {
    try {
      return await this.userRepository.findOne({ where: { id } });
    } catch (error) {
      this.logger.error(`Failed to find user by ID ${id}: ${error.message}`);
      return null;
    }
  }

  async findByEmail(email: string): Promise<User | null> {
    try {
      return await this.userRepository.findOne({ where: { email } });
    } catch (error) {
      this.logger.error(
        `Failed to find user by email ${email}: ${error.message}`,
      );
      return null;
    }
  }

  async getUserProfile(userId: string): Promise<Partial<User> | null> {
    try {
      const user = await this.userRepository.findOne({
        where: { id: userId },
        select: ['id', 'email', 'role', 'tenantId'],
        relations: ['profile'],
      });

      if (!user) {
        throw new NotFoundException(`User with ID ${userId} not found`);
      }

      return user;
    } catch (error) {
      this.logger.error(
        `Failed to get user profile for ${userId}: ${error.message}`,
      );
      return null;
    }
  }

  async updateUserLastActivity(userId: string): Promise<void> {
    try {
      await this.userRepository.update(userId, {
        lastLoginAt: new Date(),
      });
    } catch (error) {
      this.logger.error(
        `Failed to update user last activity for ${userId}: ${error.message}`,
      );
    }
  }

  async getUserPermissions(userId: string): Promise<string[]> {
    try {
      const user = await this.userRepository.findOne({
        where: { id: userId },
        select: ['role'],
      });

      if (!user) {
        return [];
      }

      // Basic role-based permissions
      const rolePermissions = {
        SUPER_ADMIN: ['*'],
        ADMIN: ['read', 'write', 'delete', 'manage_users', 'manage_documents'],
        TENANT_ADMIN: [
          'read',
          'write',
          'delete',
          'manage_users',
          'manage_documents',
        ],
        CARGO_OWNER: ['read', 'write', 'manage_own_documents'],
        TRUCK_OWNER: ['read', 'write', 'manage_own_documents'],
        DRIVER: ['read', 'write_own_documents'],
        AGENT: ['read', 'write'],
        LENDER: ['read', 'write', 'manage_own_documents'],
      };

      return rolePermissions[user.role] || ['read_own_documents'];
    } catch (error) {
      this.logger.error(
        `Failed to get user permissions for ${userId}: ${error.message}`,
      );
      return ['read_own_documents'];
    }
  }

  async validateUserAccess(
    userId: string,
    resourceId: string,
    action: string,
  ): Promise<boolean> {
    try {
      const permissions = await this.getUserPermissions(userId);

      // Super admin has access to everything
      if (permissions.includes('*')) {
        return true;
      }

      // Check specific permissions
      if (permissions.includes(action)) {
        return true;
      }

      // Check resource ownership for specific actions
      if (action === 'read_own_documents' || action === 'write_own_documents') {
        // This would typically check if the user owns the resource
        // For now, return true as a placeholder
        return true;
      }

      return false;
    } catch (error) {
      this.logger.error(`Failed to validate user access: ${error.message}`);
      return false;
    }
  }
}
