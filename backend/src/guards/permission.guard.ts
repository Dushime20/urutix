/**
 * Permission Guard
 * 
 * NestJS guard that checks if the user has required permissions
 * to access a route or controller method.
 * 
 * Usage:
 * @UseGuards(PermissionGuard('user:manage'))
 * @UseGuards(PermissionGuard(['user:manage', 'user:update'])) // Any of these
 */

import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PermissionHelper } from '../utils/permission-helper';

export const PERMISSIONS_KEY = 'permissions';

/**
 * Decorator to specify required permissions for a route
 * 
 * @param permissions - Single permission or array of permissions (OR logic)
 * 
 * @example
 * @RequirePermissions('user:manage')
 * @RequirePermissions(['user:manage', 'user:update']) // User needs ANY of these
 */
export const RequirePermissions = (...permissions: string[]) =>
  Reflector.createDecorator<string[]>({ transform: () => permissions });

/**
 * Decorator to specify that ALL permissions are required (AND logic)
 * 
 * @param permissions - Array of permissions that ALL must be present
 * 
 * @example
 * @RequireAllPermissions(['user:view', 'user:update']) // User needs ALL of these
 */
export const RequireAllPermissions = (...permissions: string[]) =>
  Reflector.createDecorator<{ all: string[] }>({ 
    transform: () => ({ all: permissions })
  });

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private permissionHelper: PermissionHelper,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Get required permissions from decorator
    const requiredPermissions = this.reflector.getAllAndOverride<string[] | { all: string[] }>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    // If no permissions specified, allow access
    if (!requiredPermissions) {
      return true;
    }

    // Get user from request
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new UnauthorizedException('User not authenticated');
    }

    // SUPER_ADMIN bypasses all permission checks
    if (user.role === 'SUPER_ADMIN') {
      return true;
    }

    try {
      // Check if ALL permissions required (AND logic)
      if (typeof requiredPermissions === 'object' && 'all' in requiredPermissions) {
        const hasAll = await this.permissionHelper.roleHasAllPermissions(
          user.role,
          requiredPermissions.all,
        );

        if (!hasAll) {
          throw new ForbiddenException(
            `Insufficient permissions. Required: ${requiredPermissions.all.join(', ')}`,
          );
        }

        return true;
      }

      // Check if ANY permission is present (OR logic)
      const permissions = Array.isArray(requiredPermissions) 
        ? requiredPermissions 
        : [requiredPermissions];

      const hasAny = await this.permissionHelper.roleHasAnyPermission(
        user.role,
        permissions,
      );

      if (!hasAny) {
        throw new ForbiddenException(
          `Insufficient permissions. Required one of: ${permissions.join(', ')}`,
        );
      }

      return true;
    } catch (error) {
      if (error instanceof ForbiddenException || error instanceof UnauthorizedException) {
        throw error;
      }

      // Log unexpected errors
      console.error('Permission check error:', error);
      throw new ForbiddenException('Permission check failed');
    }
  }
}

/**
 * Factory function to create a guard with specific permissions
 * Useful for inline usage without decorators
 * 
 * @param permissions - Single permission or array of permissions
 * @returns Guard class
 * 
 * @example
 * @UseGuards(createPermissionGuard('user:manage'))
 * @UseGuards(createPermissionGuard(['user:manage', 'user:update']))
 */
export function createPermissionGuard(...permissions: string[]) {
  @Injectable()
  class PermissionGuardMixin implements CanActivate {
    constructor(public permissionHelper: PermissionHelper) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
      const request = context.switchToHttp().getRequest();
      const user = request.user;

      if (!user) {
        throw new UnauthorizedException('User not authenticated');
      }

      // SUPER_ADMIN bypasses all checks
      if (user.role === 'SUPER_ADMIN') {
        return true;
      }

      const hasPermission = await this.permissionHelper.roleHasAnyPermission(
        user.role,
        permissions,
      );

      if (!hasPermission) {
        throw new ForbiddenException(
          `Insufficient permissions. Required one of: ${permissions.join(', ')}`,
        );
      }

      return true;
    }
  }

  return PermissionGuardMixin;
}
