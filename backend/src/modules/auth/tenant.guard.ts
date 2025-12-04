import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { TenantService } from './tenant.service';
import { TenantStatus } from '../../entities/tenant.entity';

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

    // Super admins can access any tenant
    if (user.role === 'SUPER_ADMIN' || user.role === 'ADMIN') {
      return true;
    }

    // Extract tenant ID from request
    const requestTenantId = this.extractTenantId(request);

    if (!requestTenantId) {
      throw new BadRequestException('Tenant ID is required');
    }

    // Regular users can only access their own tenant
    if (user.tenantId !== requestTenantId) {
      throw new ForbiddenException('Access denied for this tenant');
    }

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
