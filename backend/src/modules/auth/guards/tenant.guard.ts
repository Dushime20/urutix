import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { TenantService } from './../services/tenant.service';
import { TenantStatus } from '../../../entities/tenant.entity';

@Injectable()
export class TenantGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private tenantService: TenantService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const { user } = request;

    if (!user) {
      throw new UnauthorizedException('User not found in request');
    }

    // ONLY Super admins can access any tenant without restrictions
    // ADMIN and TENANT_ADMIN must access their own tenant only
    if (user.role === 'SUPER_ADMIN') {
      console.log(`[TenantGuard] SuperAdmin access granted for user ${user.id} to any tenant`);
      return true;
    }

    // Extract tenant ID from request
    const requestTenantId = this.extractTenantId(request);

    if (!requestTenantId) {
      throw new BadRequestException('Tenant ID is required');
    }

    // Log the tenant access attempt
    console.log(`[TenantGuard] User ${user.id} (role: ${user.role}, tenant: ${user.tenantId}) attempting to access tenant ${requestTenantId}`);

    // ALL users (including ADMIN and TENANT_ADMIN) can only access their own tenant
    if (user.tenantId !== requestTenantId) {
      console.error(`[TenantGuard] CROSS-TENANT ACCESS DENIED: User ${user.id} (role: ${user.role}, tenant: ${user.tenantId}) tried to access tenant ${requestTenantId}`);
      throw new ForbiddenException('Access denied: You can only access your own tenant data');
    }

    console.log(`[TenantGuard] Access granted: User ${user.id} (role: ${user.role}) accessing their own tenant ${requestTenantId}`);

    // Check tenant status - only ACTIVE tenants can access the system
    try {
      const tenant = await this.tenantService.findTenantById(user.tenantId);
      
      if (tenant.status !== TenantStatus.ACTIVE) {
        let errorMessage = 'Your tenant account is not active.';
        if (tenant.status === TenantStatus.PENDING_ACTIVATION) {
          errorMessage = 'Your tenant account is pending activation. Please contact your administrator.';
        } else if (tenant.status === TenantStatus.SUSPENDED) {
          errorMessage = 'Your tenant account has been suspended. Please contact support.';
        } else if (tenant.status === TenantStatus.DEACTIVATED) {
          errorMessage = 'Your tenant account has been deactivated. Please contact support.';
        }
        throw new ForbiddenException(errorMessage);
      }
    } catch (error) {
      if (error instanceof ForbiddenException) {
        throw error;
      }
      // If tenant not found or other error, allow the request to proceed
      // (let other guards handle it)
      console.warn('Error checking tenant status in TenantGuard:', error);
    }

    return true;
  }

  private extractTenantId(request: any): string | null {
    // Try multiple sources for tenant ID
    return (
      request.headers['x-tenant-id'] ||
      request.query.tenantId ||
      request.params.tenantId ||
      request.body?.tenantId ||
      request.user?.tenantId ||
      null
    );
  }
}
