import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
} from '@nestjs/common';
import { CapabilityService } from '../../services/capability.service';
import { allowedCategories, type ReportScope } from './tenant-reports.service';

/** Reuse capability evaluation so explicit denies and feature switches apply to every report format. */
@Injectable()
export class ReportsAccessGuard implements CanActivate {
  constructor(private readonly capabilities: CapabilityService) {}

  private categoryPermission(
    category: string,
    role: string,
  ): string | undefined {
    if (
      [
        'payments',
        'invoices',
        'credits',
        'loans',
        'repayments',
        'disbursements',
        'commissions',
        'revenue',
      ].includes(category)
    )
      return 'analytics:financial';
    if (category === 'users') return 'users:view';
    if (category === 'tenants') return 'tenants:view';
    if (category === 'auctions') return 'auctions:view';
    if (category === 'bids')
      return role === 'TRUCK_OWNER' ? 'bids:view_own' : 'bids:view';
    if (category === 'matches') return 'matching:view_results';
    return undefined;
  }

  async assertCategory(scope: ReportScope, category: string) {
    const permission = this.categoryPermission(category, scope.role);
    if (permission)
      await this.capabilities.assertAnyCapabilityOrRole(
        scope.userId,
        [permission],
        {
          tenantId: scope.tenantId,
          userRole: scope.role,
          // The reporting service still enforces its category/role whitelist. Explicit denies and kill switches always win.
          decoratorRoles: [scope.role],
        },
      );
  }

  async filterCatalog<T extends { id: string }>(
    scope: ReportScope,
    catalog: T[],
  ): Promise<T[]> {
    const checks = new Map<string, Promise<boolean>>();
    const visible = await Promise.all(
      catalog.map(async (report) => {
        const permission = this.categoryPermission(report.id, scope.role);
        if (!permission) return true;
        if (!checks.has(permission))
          checks.set(
            permission,
            this.assertCategory(scope, report.id)
              .then(() => true)
              .catch((error) => {
                if (error instanceof ForbiddenException) return false;
                throw error;
              }),
          );
        return await checks.get(permission);
      }),
    );
    return catalog.filter((_, index) => visible[index]);
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const { user } = context.switchToHttp().getRequest();
    const id = user?.userId || user?.id;
    if (!id) throw new ForbiddenException('Authenticated user is required');
    if (!allowedCategories(user.role).length)
      throw new ForbiddenException('Reporting is not available for this role');
    const permission =
      user.role === 'SUPER_ADMIN'
        ? 'analytics:view_all'
        : ['ADMIN', 'TENANT_ADMIN'].includes(user.role)
          ? 'analytics:view_tenant'
          : user.role === 'LENDER'
            ? 'lending:view'
            : user.role === 'BROKER'
              ? 'brokers:view'
              : user.role?.startsWith('FLEET_')
                ? 'fleet:view'
                : user.role === 'CUSTOMS_OFFICER'
                  ? 'customs:view'
                  : user.role === 'PARKING_RESERVATION_MANAGER'
                    ? 'parking:view'
                    : user.role === 'CARGO_RECEIVER'
                      ? 'receivers:view'
                      : 'analytics:view_own';
    await this.capabilities.assertAnyCapabilityOrRole(id, [permission], {
      tenantId: user.tenantId,
      userRole: user.role,
      decoratorRoles: [user.role],
    });
    const request = context.switchToHttp().getRequest();
    if (typeof request.query?.category === 'string')
      await this.assertCategory(
        { userId: id, tenantId: user.tenantId, role: user.role },
        request.query.category,
      );
    return true;
  }
}
