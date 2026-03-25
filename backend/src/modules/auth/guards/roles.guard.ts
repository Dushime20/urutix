import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '../../../entities/user.entity';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);

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

    // Temporary development bypass for drivers to debug 403 issue
    if (process.env.NODE_ENV === 'development' && user.email?.toLowerCase().includes('driver')) {
      console.log('🏁 Development bypass for driver user:', user.email);
      return true;
    }

    console.log('User role:', user.role);
    console.log('User ID:', user.userId);
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
        `❌ Access denied. Required: ${requiredRoles.join(', ')}. User has: ${user.role}`,
      );
      throw new ForbiddenException(
        `Insufficient permissions. Required roles: ${requiredRoles.join(', ')}. User role: ${user.role}`,
      );
    }

    console.log('✅ Role check passed');
    return true;
  }
}
