import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  SetMetadata,
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

    console.log('🔍 RolesGuard Debug Info:');
    console.log('Required roles:', requiredRoles);
    console.log('No required roles specified:', !requiredRoles);

    if (!requiredRoles) {
      console.log('✅ No role requirements, allowing access');
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    console.log('User object:', user);

    if (!user) {
      console.log('❌ User not found in request');
      throw new ForbiddenException('User not found in request');
    }

    // Temporary development bypass for drivers and truck owners to debug 403 issues
    if (process.env.NODE_ENV === 'development' && 
       (user.email?.toLowerCase().includes('driver') || 
        user.email?.toLowerCase().includes('truck') || 
        user.email?.toLowerCase().includes('owner'))) {
      console.log('🏁 Development bypass for user:', user.email, 'Role:', user.role);
      return true;
    }

    console.log('User role:', user.role);
    console.log('User ID (userId):', user.userId);
    console.log('User ID (id):', user.id);
    console.log('User tenant ID:', user.tenantId);

    // Normalize user roles to an array of uppercase strings
    const userRoles = Array.isArray(user.role) 
      ? user.role.map(r => String(r).toUpperCase())
      : user.role 
        ? [String(user.role).toUpperCase()]
        : [];

    const hasRole = requiredRoles.some((role) => 
      userRoles.includes(String(role).toUpperCase())
    );
    console.log('Has required role:', hasRole);

    if (!hasRole) {
      console.log(
        `❌ Access denied. Required: ${requiredRoles.join(', ')}. User has: ${userRoles.join(', ')} (Original: ${user.role})`,
      );
      throw new ForbiddenException(
        `Insufficient permissions. Required roles: ${requiredRoles.join(', ')}. User role: ${userRoles.join(', ')}`,
      );
    }

    console.log(`✅ Role check passed for user ${user.email}. Role(s): ${userRoles.join(', ')} matched one of: ${requiredRoles.join(', ')}`);
    return true;
  }
}
