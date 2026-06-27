import { createParamDecorator, ExecutionContext, UnauthorizedException } from '@nestjs/common';

export const GetTenant = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest();

    // Priority: header → query → param → body → JWT claim
    const tenantId =
      request.headers['x-tenant-id'] ||
      request.query.tenantId ||
      request.params.tenantId ||
      request.body?.tenantId ||
      request.user?.tenantId;

    if (!tenantId) {
      throw new UnauthorizedException('Tenant context is required. Ensure you are authenticated and a tenant is selected.');
    }

    return tenantId;
  },
);
