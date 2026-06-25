import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '../../../entities/user.entity';

import { Roles, ROLES_KEY } from '../roles.decorator';
export { Roles, ROLES_KEY };

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();

    if (!user) {
      throw new ForbiddenException('User not found in request');
    }

    const userRoles = Array.isArray(user.role) 
      ? user.role.map(r => String(r).toUpperCase())
      : user.role 
        ? [String(user.role).toUpperCase()]
        : [];

    const hasRole = requiredRoles.some((role) => 
      userRoles.includes(String(role).toUpperCase())
    );

    if (!hasRole) {
      throw new ForbiddenException(
        `Insufficient permissions. Required roles: ${requiredRoles.join(', ')}`
      );
    }

    return true;
  }
}
