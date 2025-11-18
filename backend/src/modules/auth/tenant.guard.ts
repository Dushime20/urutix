import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class TenantGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const { user } = request;

    if (!user) {
      throw new UnauthorizedException('User not found in request');
    }

    // Super admins can access any tenant
    if (user.role === 'SUPER_ADMIN') {
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
