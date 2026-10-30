import { ForbiddenException } from '@nestjs/common';
import { ReportsAccessGuard } from './reports-access.guard';

describe('Report capability and feature guard', () => {
  const context = (role: string) =>
    ({
      switchToHttp: () => ({
        getRequest: () => ({
          user: { userId: 'user', tenantId: 'tenant', role },
        }),
      }),
    }) as any;
  it.each([
    ['SUPER_ADMIN', 'analytics:view_all'],
    ['TENANT_ADMIN', 'analytics:view_tenant'],
    ['ADMIN', 'analytics:view_tenant'],
    ['TRUCK_OWNER', 'analytics:view_own'],
    ['CARGO_OWNER', 'analytics:view_own'],
    ['DRIVER', 'analytics:view_own'],
    ['BROKER', 'brokers:view'],
    ['LENDER', 'lending:view'],
  ])('checks the existing %s capability', async (role, permission) => {
    const capabilities = {
      assertAnyCapabilityOrRole: jest.fn().mockResolvedValue(undefined),
    };
    expect(
      await new ReportsAccessGuard(capabilities as any).canActivate(
        context(role),
      ),
    ).toBe(true);
    expect(capabilities.assertAnyCapabilityOrRole).toHaveBeenCalledWith(
      'user',
      [permission],
      { tenantId: 'tenant', userRole: role, decoratorRoles: [role] },
    );
  });
  it('propagates explicit permission denial or disabled feature without role bypass', async () => {
    const capabilities = {
      assertAnyCapabilityOrRole: jest
        .fn()
        .mockRejectedValue(new ForbiddenException('FEATURE_DISABLED')),
    };
    await expect(
      new ReportsAccessGuard(capabilities as any).canActivate(
        context('SUPER_ADMIN'),
      ),
    ).rejects.toThrow('FEATURE_DISABLED');
  });
  it('denies missing identity', async () => {
    const capabilities = { assertAnyCapabilityOrRole: jest.fn() };
    const ctx = { switchToHttp: () => ({ getRequest: () => ({}) }) } as any;
    await expect(
      new ReportsAccessGuard(capabilities as any).canActivate(ctx),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(capabilities.assertAnyCapabilityOrRole).not.toHaveBeenCalled();
  });

  it('hides financial reports when financial reporting is disabled and checks the capability once per catalog', async () => {
    const capabilities = {
      assertAnyCapabilityOrRole: jest
        .fn()
        .mockRejectedValue(new ForbiddenException('FEATURE_DISABLED')),
    };
    const guard = new ReportsAccessGuard(capabilities as any);
    const catalog = await guard.filterCatalog(
      { userId: 'user', tenantId: 'tenant', role: 'CARGO_OWNER' },
      [{ id: 'cargo' }, { id: 'payments' }, { id: 'loans' }],
    );
    expect(catalog).toEqual([{ id: 'cargo' }]);
    expect(capabilities.assertAnyCapabilityOrRole).toHaveBeenCalledTimes(1);
  });

  it('denies direct financial preview/export requests even when general reporting is allowed', async () => {
    const capabilities = {
      assertAnyCapabilityOrRole: jest
        .fn()
        .mockResolvedValueOnce(undefined)
        .mockRejectedValueOnce(
          new ForbiddenException('Financial reporting denied'),
        ),
    };
    const ctx = {
      switchToHttp: () => ({
        getRequest: () => ({
          user: { userId: 'user', tenantId: 'tenant', role: 'CARGO_OWNER' },
          query: { category: 'payments' },
        }),
      }),
    } as any;
    await expect(
      new ReportsAccessGuard(capabilities as any).canActivate(ctx),
    ).rejects.toThrow('Financial reporting denied');
    expect(capabilities.assertAnyCapabilityOrRole).toHaveBeenLastCalledWith(
      'user',
      ['analytics:financial'],
      expect.objectContaining({ tenantId: 'tenant' }),
    );
  });
});
