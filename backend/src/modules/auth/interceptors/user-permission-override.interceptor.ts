import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { IS_PUBLIC_KEY } from '../../../common/decorators/public.decorator';
import { PermissionService } from '../../../services/raw-permission.service';
import { RoutePermissionResolver } from '../../../services/route-permission.resolver';

/**
 * Runs after JWT auth guards — only blocks when user has admin overrides AND
 * a denied capability matches the route. Users without overrides: no change.
 */
@Injectable()
export class UserPermissionOverrideInterceptor implements NestInterceptor {
  constructor(
    private reflector: Reflector,
    private permissionService: PermissionService,
    private routePermissionResolver: RoutePermissionResolver,
  ) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<unknown>> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return next.handle();

    const request = context.switchToHttp().getRequest();
    const userId = request?.user?.userId || request?.user?.id;
    if (!userId) return next.handle();

    const hasOverrides = await this.permissionService.userHasPermissionOverrides(userId);
    if (!hasOverrides) return next.handle();

    const rawPath =
      request.route?.path ||
      request.path ||
      request.url ||
      request.originalUrl ||
      '';
    const routePerms = this.routePermissionResolver.resolve(request.method, rawPath);
    if (!routePerms?.length) return next.handle();

    const deniedCode = await this.permissionService.hasExplicitDenyForAny(userId, routePerms);
    if (deniedCode) {
      throw new ForbiddenException({
        statusCode: 403,
        error: 'Forbidden',
        code: 'PERMISSION_DENIED',
        permission: deniedCode,
        message: `This capability was denied for your account (${deniedCode}).`,
      });
    }

    return next.handle();
  }
}
