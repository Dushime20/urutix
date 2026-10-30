import { GUARDS_METADATA } from '@nestjs/common/constants';
import { ReportsController } from './reports.controller';
import { ReportsAccessGuard } from './reports-access.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../auth/guards/tenant.guard';

describe('Reporting endpoint contracts', () => {
  const user = {
    userId: 'authenticated-user',
    role: 'CARGO_OWNER',
    tenantId: 'authenticated-tenant',
    email: 'owner@example.test',
  };
  const result = {
    title: 'Payments',
    category: 'payments',
    headers: ['Amount'],
    rows: [{ Amount: 10 }],
    total: 1,
    metadata: { generatedAt: '2026-10-30T00:00:00Z' },
  };
  const reports = { generate: jest.fn(), toCsv: jest.fn(), catalog: jest.fn() };
  const access = { filterCatalog: jest.fn() };
  const controller = new ReportsController(reports as any, access as any);
  beforeEach(() => {
    jest.clearAllMocks();
    reports.generate.mockResolvedValue(result);
    reports.toCsv.mockReturnValue('"Amount"\n"10"');
  });

  it('protects catalog, previews and both export paths with authentication, tenant and feature guards', () => {
    expect(Reflect.getMetadata(GUARDS_METADATA, ReportsController)).toEqual([
      JwtAuthGuard,
      TenantGuard,
      ReportsAccessGuard,
    ]);
  });
  it('preserves the response envelope and authenticated identity for previews', async () => {
    const query = { category: 'payments' as const, dateFrom: '2026-10-01' };
    expect((await controller.preview({ user }, query)).data).toBe(result);
    expect(reports.generate).toHaveBeenCalledWith(
      user.tenantId,
      query,
      expect.objectContaining({ userId: user.userId, tenantId: user.tenantId }),
    );
  });
  it('uses full fresh authorized generation for PDF/Excel/print data', async () => {
    const query = { category: 'payments' as const, search: 'filtered' };
    await controller.exportData({ user }, query);
    expect(reports.generate).toHaveBeenCalledWith(
      user.tenantId,
      query,
      expect.objectContaining({ userId: user.userId }),
      true,
    );
  });
  it('uses the same full authorized generation for CSV and disables response caching', async () => {
    const response = { set: jest.fn(), send: jest.fn() };
    const query = { category: 'payments' as const, status: 'completed' };
    await controller.export(response as any, { user }, query);
    expect(reports.generate).toHaveBeenCalledWith(
      user.tenantId,
      query,
      expect.objectContaining({ userId: user.userId }),
      true,
    );
    expect(response.set).toHaveBeenCalledWith(
      expect.objectContaining({
        'Cache-Control': 'no-store',
        'Content-Type': 'text/csv; charset=utf-8',
      }),
    );
    expect(response.send).toHaveBeenCalledWith('\uFEFF"Amount"\n"10"');
  });
});
