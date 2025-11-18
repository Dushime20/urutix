import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';

@Injectable()
export class RolesGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    const user = req.user;
    if (
      !user ||
      !['SUPER_ADMIN', 'ADMIN', 'TENANT_ADMIN'].includes(user.role)
    ) {
      throw new ForbiddenException('Access denied: Admins only');
    }
    return true;
  }
}
