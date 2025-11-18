import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const GetTenant = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest();

    // Try multiple sources for tenant ID
    const tenantId =
      request.headers['x-tenant-id'] ||
      request.query.tenantId ||
      request.params.tenantId ||
      request.body?.tenantId ||
      request.user?.tenantId ||
      '00000000-0000-0000-0000-000000000001'; // Default tenant

    return tenantId;
  },
);
