import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PermissionService } from '../../services/permissionService';
import { PERMISSIONS_KEY } from './decorators/require-permissions.decorator';

@Injectable()
export class PermissionsGuard implements CanActivate {
    constructor(
        private reflector: Reflector,
        private permissionService: PermissionService,
    ) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const requiredPermissions = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);

        if (!requiredPermissions) {
            return true;
        }

        const { user } = context.switchToHttp().getRequest();
        if (!user || !user.userId) {
            throw new ForbiddenException('User not authenticated');
        }

        const hasPermission = await this.permissionService.checkAnyPermission(user.userId, requiredPermissions);

        if (!hasPermission) {
            throw new ForbiddenException(`Missing required permissions: ${requiredPermissions.join(', ')}`);
        }

        return true;
    }
}
