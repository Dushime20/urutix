import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from './../decorators/require-permissions.decorator';
import { CapabilityService } from '../../../services/capability.service';

/**
 * Authoritative capability guard:
 * 1. Global / tenant feature controls
 * 2. Role + user permission (RBAC)
 *
 * Fail-closed via CapabilityService on evaluation errors for required permissions.
 */
@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private capabilityService: CapabilityService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredPermissions?.length) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    const userId = user?.userId || user?.id;
    if (!user || !userId) {
      throw new ForbiddenException('User not authenticated');
    }

    await this.capabilityService.assertAnyCapability(userId, requiredPermissions, {
      tenantId: user.tenantId,
    });

    return true;
  }
}
