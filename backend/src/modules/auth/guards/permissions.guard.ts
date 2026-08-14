import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from './../decorators/require-permissions.decorator';
import { IS_PUBLIC_KEY } from '../../../common/decorators/public.decorator';
import { ROLES_KEY } from '../roles.decorator';
import { CapabilityService } from '../../../services/capability.service';
import { UserRole } from '../../../entities/user.entity';

/**
 * Opt-in guard for endpoints decorated with @RequirePermissions.
 * Uses permission check with role fallback so existing role-based access keeps working.
 * Endpoints without @RequirePermissions are not affected by this guard.
 */
@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private capabilityService: CapabilityService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest();
    const user = request?.user;
    const userId = user?.userId || user?.id;
    if (!user || !userId) return true;

    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredPermissions?.length) return true;

    const decoratorRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    await this.capabilityService.assertAnyCapabilityOrRole(userId, requiredPermissions, {
      tenantId: user.tenantId,
      userRole: user.role,
      decoratorRoles: decoratorRoles?.map((r) => String(r)),
    });

    return true;
  }
}
