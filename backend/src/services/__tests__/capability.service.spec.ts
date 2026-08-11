import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, BadRequestException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { CapabilityService } from '../capability.service';
import { PermissionService } from '../raw-permission.service';
import { FeatureControlScope } from '../../entities/feature-control.entity';

describe('CapabilityService', () => {
  let service: CapabilityService;
  let dataSource: { query: jest.Mock };
  let permissionService: { checkPermission: jest.Mock };

  beforeEach(async () => {
    dataSource = { query: jest.fn() };
    permissionService = { checkPermission: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CapabilityService,
        { provide: DataSource, useValue: dataSource },
        { provide: PermissionService, useValue: permissionService },
      ],
    }).compile();

    service = module.get(CapabilityService);
    service.invalidateCache();
  });

  it('is defined', () => {
    expect(service).toBeDefined();
  });

  it('normalizes resource.action to resource:action', () => {
    expect(service.normalizeCode('bids.create')).toBe('bids:create');
    expect(service.normalizeCode('bids:create')).toBe('bids:create');
  });

  it('treats missing feature_controls table as enabled', async () => {
    dataSource.query.mockResolvedValueOnce([{ count: 0 }]);
    await expect(service.isFeatureEnabled('bids:create')).resolves.toBe(true);
  });

  it('denies when platform feature is disabled', async () => {
    dataSource.query
      .mockResolvedValueOnce([{ count: 1 }])
      .mockResolvedValueOnce([{ enabled: false }]);

    await expect(
      service.assertCapability('user-1', 'bids:create', { tenantId: 't1' }),
    ).rejects.toBeInstanceOf(ForbiddenException);

    service.invalidateCache();
    dataSource.query
      .mockResolvedValueOnce([{ count: 1 }])
      .mockResolvedValueOnce([{ enabled: false }]);

    try {
      await service.assertCapability('user-1', 'bids:create');
    } catch (error) {
      const body = (error as ForbiddenException).getResponse() as any;
      expect(body.code).toBe('FEATURE_DISABLED');
      expect(body.permission).toBe('bids:create');
    }
  });

  it('allows when feature enabled and role permission granted', async () => {
    dataSource.query
      .mockResolvedValueOnce([{ count: 1 }])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);
    permissionService.checkPermission.mockResolvedValue(true);

    await expect(
      service.assertCapability('user-1', 'bids:create', { tenantId: 't1' }),
    ).resolves.toBeUndefined();
  });

  it('denies when feature enabled but permission missing', async () => {
    dataSource.query
      .mockResolvedValueOnce([{ count: 1 }])
      .mockResolvedValueOnce([{ enabled: true }]);
    permissionService.checkPermission.mockResolvedValue(false);

    await expect(
      service.assertCapability('user-1', 'bids:create'),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('blocks disabling protected capabilities', async () => {
    await expect(
      service.setFeatureControl({
        permissionCode: 'users:permissions.manage',
        enabled: false,
        updatedBy: 'admin-1',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('writes audit log when toggling a feature', async () => {
    dataSource.query
      .mockResolvedValueOnce([{ id: 'perm-1' }])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([
        {
          id: 'p1',
          resource: 'bids',
          action: 'create',
          category: 'bidding',
          description: 'Place a bid',
        },
      ])
      .mockResolvedValueOnce([
        {
          id: 'fc1',
          permission_code: 'bids:create',
          enabled: false,
          updated_by: 'admin-1',
          reason: 'maintenance',
          updated_at: new Date(),
        },
      ]);

    const result = await service.setFeatureControl({
      permissionCode: 'bids:create',
      enabled: false,
      updatedBy: 'admin-1',
      reason: 'maintenance',
    });

    expect(result.permissionCode).toBe('bids:create');
    expect(result.enabled).toBe(false);
    expect(dataSource.query).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO feature_controls'),
      expect.any(Array),
    );
  });

  it('tenant cannot enable a platform-disabled feature', async () => {
    dataSource.query
      .mockResolvedValueOnce([{ count: 1 }])
      .mockResolvedValueOnce([{ enabled: false }]);

    await expect(
      service.setFeatureControl({
        permissionCode: 'cargo:create',
        enabled: true,
        updatedBy: 'admin-1',
        scope: FeatureControlScope.TENANT,
        tenantId: 'tenant-1',
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('assertAnyCapability allows when one of several permissions succeeds', async () => {
    dataSource.query
      .mockResolvedValueOnce([{ count: 1 }])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);
    permissionService.checkPermission.mockResolvedValue(true);

    await expect(
      service.assertAnyCapability('user-1', ['matching:request', 'matching:view_results'], {
        tenantId: 't1',
      }),
    ).resolves.toBeUndefined();
  });
});
