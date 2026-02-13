import { Test, TestingModule } from '@nestjs/testing';
import { AuditService } from './audit.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EnforcementAction } from './entities/enforcement-action.entity';
import { NotFoundException } from '@nestjs/common';
import { AuditFilterDto } from './dto/audit-filter.dto';
import { ExportAuditDto } from './dto/export-audit.dto';

describe('AuditService', () => {
  let service: AuditService;
  let enforcementActionRepository: Repository<EnforcementAction>;

  const mockEnforcementActionRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuditService,
        {
          provide: getRepositoryToken(EnforcementAction),
          useValue: mockEnforcementActionRepository,
        },
      ],
    }).compile();

    service = module.get<AuditService>(AuditService);
    enforcementActionRepository = module.get(getRepositoryToken(EnforcementAction));

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('logEnforcementAction', () => {
    it('should create and save an audit record', async () => {
      const actionData = {
        adminId: 'admin-123',
        targetUserId: 'user-456',
        actionType: 'suspend',
        reason: 'Violation of terms',
      };

      const mockAction = {
        id: 'action-123',
        ...actionData,
        createdAt: new Date(),
      };

      mockEnforcementActionRepository.create.mockReturnValue(mockAction);
      mockEnforcementActionRepository.save.mockResolvedValue(mockAction);

      const result = await service.logEnforcementAction(actionData);

      expect(result).toBeDefined();
      expect(result.id).toBe('action-123');
      expect(mockEnforcementActionRepository.create).toHaveBeenCalledWith(actionData);
      expect(mockEnforcementActionRepository.save).toHaveBeenCalled();
    });
  });

  describe('getAuditTrail', () => {
    const mockQueryBuilder = {
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getCount: jest.fn(),
      getMany: jest.fn(),
    };

    beforeEach(() => {
      mockEnforcementActionRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);
    });

    it('should return paginated audit trail', async () => {
      const filters: AuditFilterDto = {
        page: 1,
        limit: 10,
      };

      const mockActions = [
        { id: 'action-1', actionType: 'suspend' },
        { id: 'action-2', actionType: 'unsuspend' },
      ];

      mockQueryBuilder.getCount.mockResolvedValue(2);
      mockQueryBuilder.getMany.mockResolvedValue(mockActions);

      const result = await service.getAuditTrail(filters);

      expect(result).toBeDefined();
      expect(result.data).toEqual(mockActions);
      expect(result.total).toBe(2);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
      expect(result.totalPages).toBe(1);
    });

    it('should filter by adminId', async () => {
      const filters: AuditFilterDto = {
        adminId: 'admin-123',
      };

      mockQueryBuilder.getCount.mockResolvedValue(5);
      mockQueryBuilder.getMany.mockResolvedValue([]);

      await service.getAuditTrail(filters);

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'action.adminId = :adminId',
        { adminId: 'admin-123' },
      );
    });

    it('should filter by targetUserId', async () => {
      const filters: AuditFilterDto = {
        targetUserId: 'user-456',
      };

      mockQueryBuilder.getCount.mockResolvedValue(3);
      mockQueryBuilder.getMany.mockResolvedValue([]);

      await service.getAuditTrail(filters);

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'action.targetUserId = :targetUserId',
        { targetUserId: 'user-456' },
      );
    });

    it('should filter by actionType', async () => {
      const filters: AuditFilterDto = {
        actionType: 'suspend',
      };

      mockQueryBuilder.getCount.mockResolvedValue(10);
      mockQueryBuilder.getMany.mockResolvedValue([]);

      await service.getAuditTrail(filters);

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'action.actionType = :actionType',
        { actionType: 'suspend' },
      );
    });

    it('should filter by date range', async () => {
      const startDate = new Date('2026-01-01');
      const endDate = new Date('2026-01-31');

      const filters: AuditFilterDto = {
        startDate,
        endDate,
      };

      mockQueryBuilder.getCount.mockResolvedValue(15);
      mockQueryBuilder.getMany.mockResolvedValue([]);

      await service.getAuditTrail(filters);

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'action.createdAt BETWEEN :startDate AND :endDate',
        { startDate, endDate },
      );
    });

    it('should use default pagination values', async () => {
      const filters: AuditFilterDto = {};

      mockQueryBuilder.getCount.mockResolvedValue(100);
      mockQueryBuilder.getMany.mockResolvedValue([]);

      const result = await service.getAuditTrail(filters);

      expect(result.page).toBe(1);
      expect(result.limit).toBe(50);
      expect(mockQueryBuilder.skip).toHaveBeenCalledWith(0);
      expect(mockQueryBuilder.take).toHaveBeenCalledWith(50);
    });

    it('should calculate correct pagination', async () => {
      const filters: AuditFilterDto = {
        page: 3,
        limit: 20,
      };

      mockQueryBuilder.getCount.mockResolvedValue(100);
      mockQueryBuilder.getMany.mockResolvedValue([]);

      const result = await service.getAuditTrail(filters);

      expect(result.totalPages).toBe(5); // 100 / 20
      expect(mockQueryBuilder.skip).toHaveBeenCalledWith(40); // (3-1) * 20
    });
  });

  describe('exportAuditLog', () => {
    const mockQueryBuilder = {
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      getMany: jest.fn(),
    };

    beforeEach(() => {
      mockEnforcementActionRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);
    });

    it('should export to CSV format', async () => {
      const filters: ExportAuditDto = {
        format: 'csv',
      };

      const mockActions = [
        {
          id: 'action-1',
          createdAt: new Date('2026-02-13'),
          adminId: 'admin-123',
          targetUserId: 'user-456',
          actionType: 'suspend',
          reason: 'Violation',
          admin: { email: 'admin@example.com' },
          targetUser: { email: 'user@example.com' },
        },
      ];

      mockQueryBuilder.getMany.mockResolvedValue(mockActions);

      const result = await service.exportAuditLog(filters);

      expect(result).toBeInstanceOf(Buffer);
      expect(result.toString()).toContain('ID');
      expect(result.toString()).toContain('action-1');
    });

    it('should export to JSON format', async () => {
      const filters: ExportAuditDto = {
        format: 'json',
      };

      const mockActions = [
        {
          id: 'action-1',
          createdAt: new Date('2026-02-13'),
          adminId: 'admin-123',
          targetUserId: 'user-456',
          actionType: 'suspend',
          reason: 'Violation',
          admin: { email: 'admin@example.com' },
          targetUser: { email: 'user@example.com' },
        },
      ];

      mockQueryBuilder.getMany.mockResolvedValue(mockActions);

      const result = await service.exportAuditLog(filters);

      expect(result).toBeInstanceOf(Buffer);
      const jsonData = JSON.parse(result.toString());
      expect(Array.isArray(jsonData)).toBe(true);
      expect(jsonData[0].id).toBe('action-1');
    });

    it('should default to CSV format', async () => {
      const filters: ExportAuditDto = {};

      mockQueryBuilder.getMany.mockResolvedValue([]);

      const result = await service.exportAuditLog(filters);

      expect(result).toBeInstanceOf(Buffer);
      expect(result.toString()).toContain('ID'); // CSV header
    });
  });

  describe('getActionsByAdmin', () => {
    it('should return actions by admin', async () => {
      const adminId = 'admin-123';
      const mockActions = [
        { id: 'action-1', adminId, actionType: 'suspend' },
        { id: 'action-2', adminId, actionType: 'unsuspend' },
      ];

      mockEnforcementActionRepository.find.mockResolvedValue(mockActions);

      const result = await service.getActionsByAdmin(adminId);

      expect(result).toEqual(mockActions);
      expect(mockEnforcementActionRepository.find).toHaveBeenCalledWith({
        where: { adminId },
        relations: ['targetUser'],
        order: { createdAt: 'DESC' },
        take: 100,
      });
    });

    it('should respect custom limit', async () => {
      const adminId = 'admin-123';

      mockEnforcementActionRepository.find.mockResolvedValue([]);

      await service.getActionsByAdmin(adminId, 50);

      expect(mockEnforcementActionRepository.find).toHaveBeenCalledWith(
        expect.objectContaining({ take: 50 }),
      );
    });
  });

  describe('getActionsByUser', () => {
    it('should return actions for user', async () => {
      const userId = 'user-456';
      const mockActions = [
        { id: 'action-1', targetUserId: userId, actionType: 'suspend' },
        { id: 'action-2', targetUserId: userId, actionType: 'restrict' },
      ];

      mockEnforcementActionRepository.find.mockResolvedValue(mockActions);

      const result = await service.getActionsByUser(userId);

      expect(result).toEqual(mockActions);
      expect(mockEnforcementActionRepository.find).toHaveBeenCalledWith({
        where: { targetUserId: userId },
        relations: ['admin'],
        order: { createdAt: 'DESC' },
        take: 100,
      });
    });

    it('should respect custom limit', async () => {
      const userId = 'user-456';

      mockEnforcementActionRepository.find.mockResolvedValue([]);

      await service.getActionsByUser(userId, 25);

      expect(mockEnforcementActionRepository.find).toHaveBeenCalledWith(
        expect.objectContaining({ take: 25 }),
      );
    });
  });

  describe('getActionById', () => {
    it('should return action by ID', async () => {
      const actionId = 'action-123';
      const mockAction = {
        id: actionId,
        actionType: 'suspend',
        admin: { id: 'admin-123' },
        targetUser: { id: 'user-456' },
      };

      mockEnforcementActionRepository.findOne.mockResolvedValue(mockAction);

      const result = await service.getActionById(actionId);

      expect(result).toEqual(mockAction);
      expect(mockEnforcementActionRepository.findOne).toHaveBeenCalledWith({
        where: { id: actionId },
        relations: ['admin', 'targetUser', 'appeal'],
      });
    });

    it('should throw NotFoundException if action not found', async () => {
      const actionId = 'nonexistent';

      mockEnforcementActionRepository.findOne.mockResolvedValue(null);

      await expect(service.getActionById(actionId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('getAuditStatistics', () => {
    const mockQueryBuilder = {
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      groupBy: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      getCount: jest.fn(),
      getRawMany: jest.fn(),
    };

    beforeEach(() => {
      mockEnforcementActionRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);
    });

    it('should return audit statistics', async () => {
      const startDate = new Date('2026-01-01');
      const endDate = new Date('2026-01-31');

      mockQueryBuilder.getCount.mockResolvedValue(100);
      mockQueryBuilder.getRawMany
        .mockResolvedValueOnce([
          { type: 'suspend', count: '50' },
          { type: 'unsuspend', count: '30' },
        ])
        .mockResolvedValueOnce([
          { severity: 'high', count: '40' },
          { severity: 'medium', count: '30' },
        ])
        .mockResolvedValueOnce([
          { category: 'spam', count: '60' },
          { category: 'fraud', count: '20' },
        ])
        .mockResolvedValueOnce([
          { adminId: 'admin-1', count: '50' },
          { adminId: 'admin-2', count: '30' },
        ]);

      const result = await service.getAuditStatistics(startDate, endDate);

      expect(result).toBeDefined();
      expect(result.totalActions).toBe(100);
      expect(result.actionsByType).toEqual({ suspend: 50, unsuspend: 30 });
      expect(result.actionsBySeverity).toEqual({ high: 40, medium: 30 });
      expect(result.actionsByCategory).toEqual({ spam: 60, fraud: 20 });
      expect(result.topAdmins).toHaveLength(2);
      expect(result.topAdmins[0]).toEqual({ adminId: 'admin-1', count: 50 });
    });
  });

  describe('getRecentActions', () => {
    it('should return recent actions', async () => {
      const mockActions = [
        { id: 'action-1', createdAt: new Date() },
        { id: 'action-2', createdAt: new Date() },
      ];

      mockEnforcementActionRepository.find.mockResolvedValue(mockActions);

      const result = await service.getRecentActions();

      expect(result).toEqual(mockActions);
      expect(mockEnforcementActionRepository.find).toHaveBeenCalledWith({
        relations: ['admin', 'targetUser'],
        order: { createdAt: 'DESC' },
        take: 20,
      });
    });

    it('should respect custom limit', async () => {
      mockEnforcementActionRepository.find.mockResolvedValue([]);

      await service.getRecentActions(10);

      expect(mockEnforcementActionRepository.find).toHaveBeenCalledWith(
        expect.objectContaining({ take: 10 }),
      );
    });
  });
});
