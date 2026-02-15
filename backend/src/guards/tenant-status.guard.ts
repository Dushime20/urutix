import { Injectable, CanActivate, ExecutionContext, ForbiddenException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tenant, TenantStatus } from '../entities/tenant.entity';

/**
 * Guard to enforce access control for deactivated tenants
 * Requirement 2.6: Prevent all tenant users from accessing the platform when tenant is deactivated
 * 
 * Usage: Apply to controllers or routes that should be blocked for deactivated tenants
 * @UseGuards(JwtAuthGuard, TenantStatusGuard)
 */
@Injectable()
export class TenantStatusGuard implements CanActivate {
  private readonly logger = new Logger(TenantStatusGuard.name);

  constructor(
    @InjectRepository(Tenant)
    private readonly tenantRepository: Repository<Tenant>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // If no user (shouldn't happen after JwtAuthGuard), deny access
    if (!user) {
      this.logger.warn('TenantStatusGuard: No user found in request');
      return false;
    }

    // Super Admin users bypass tenant status checks
    if (user.role === 'super_admin') {
      return true;
    }

    // Check if user has a tenantId
    if (!user.tenantId) {
      this.logger.warn(`TenantStatusGuard: User ${user.id} has no tenantId`);
      throw new ForbiddenException('User is not associated with a tenant');
    }

    // Check tenant status
    const tenant = await this.tenantRepository.findOne({
      where: { id: user.tenantId },
      select: ['id', 'status', 'isActive', 'suspendedReason'],
    });

    if (!tenant) {
      this.logger.warn(`TenantStatusGuard: Tenant ${user.tenantId} not found`);
      throw new ForbiddenException('Tenant not found');
    }

    // Check if tenant is active
    if (tenant.status !== TenantStatus.ACTIVE || !tenant.isActive) {
      this.logger.log(
        `TenantStatusGuard: Access denied for user ${user.id} - Tenant ${tenant.id} is ${tenant.status}`
      );
      
      const reason = tenant.suspendedReason || 'Your organization\'s account is currently inactive';
      throw new ForbiddenException({
        message: 'Access denied',
        reason,
        tenantStatus: tenant.status,
      });
    }

    return true;
  }
}
