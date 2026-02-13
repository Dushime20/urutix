import { Test, TestingModule } from '@nestjs/testing';
import { BlacklistService } from './blacklist.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { UserBlacklist } from './entities/user-blacklist.entity';
import { User } from '../../entities/user.entity';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { AddToBlacklistDto } from './dto/add-to-blacklist.dto';
import { CheckBlacklistDto } from './dto/check-blacklist.dto';

describe('BlacklistService', () => {
  let service: BlacklistService;
  let blacklistRepository: Repository<UserBlacklist>;
  let userRepository: Repository<User>;
  let dataSource: any;

  const mockBlacklistRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
    count: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const mockUserRepository = {
    findOne: jest.fn(),
  };

  const mockDataSource = {
    transaction: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BlacklistService,
        {
          provide: getRepositoryToken(UserBlacklist),
          useValue: mockBlacklistRepository,
        },
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
      ],
    }).compile();

    service = module.get<BlacklistService>(BlacklistService);
    blacklistRepository = module.get(getRepositoryToken(UserBlacklist));
    userRepository = module.get(getRepositoryToken(User));
    dataSource = module.get(DataSource);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('addToBlacklist', () => {
    const adminId = 'admin-123';
    const tenantId = 'tenant-456';

    const blacklistDto: AddToBlacklistDto = {
      email: 'blocked@example.com',
      reason: 'Repeated violations of terms of service',
      violationCategory: 'spam',
    };

    it('should successfully add to blacklist', async () => {
      const mockEntry = {
        id: 'blacklist-123',
        email: 'blocked@example.com',
        reason: 'Repeated violations',
        isActive: true,
      };

      mockBlacklistRepository.findOne.mockResolvedValue(null); // No existing entry
      mockBlacklistRepository.create.mockReturnValue(mockEntry);
      mockBlacklistRepository.save.mockResolvedValue(mockEntry);

      const result = await service.addToBlacklist(adminId, tenantId, blacklistDto);

      expect(result).toBeDefined();
      expect(result.email).toBe('blocked@example.com');
      expect(mockBlacklistRepository.save).toHaveBeenCalled();
    });

    it('should throw BadRequestException if no identifiers provided', async () => {
      const emptyDto: AddToBlacklistDto = {
        reason: 'Test reason that is long enough',
      };

      await expect(
        service.addToBlacklist(adminId, tenantId, emptyDto),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if entry already exists', async () => {
      const existingEntry = {
        id: 'existing-123',
        email: 'blocked@example.com',
        isActive: true,
      };

      mockBlacklistRepository.findOne.mockResolvedValue(existingEntry);

      await expect(
        service.addToBlacklist(adminId, tenantId, blacklistDto),
      ).rejects.toThrow(BadRequestException);
    });

    it('should support email domain blocking', async () => {
      const domainDto: AddToBlacklistDto = {
        emailDomain: 'spam.com',
        reason: 'Known spam domain with repeated violations',
      };

      mockBlacklistRepository.findOne.mockResolvedValue(null);
      mockBlacklistRepository.create.mockReturnValue({ emailDomain: 'spam.com' });
      mockBlacklistRepository.save.mockResolvedValue({ emailDomain: 'spam.com' });

      const result = await service.addToBlacklist(adminId, tenantId, domainDto);

      expect(result.emailDomain).toBe('spam.com');
    });

    it('should support temporary bans with expiration', async () => {
      const expiresAt = new Date('2026-12-31');
      const tempBanDto: AddToBlacklistDto = {
        email: 'temp@example.com',
        reason: 'Temporary suspension for review',
        expiresAt,
      };

      mockBlacklistRepository.findOne.mockResolvedValue(null);
      mockBlacklistRepository.create.mockReturnValue({ expiresAt });
      mockBlacklistRepository.save.mockResolvedValue({ expiresAt });

      const result = await service.addToBlacklist(adminId, tenantId, tempBanDto);

      expect(result.expiresAt).toEqual(expiresAt);
    });
  });

  describe('checkBlacklist', () => {
    const tenantId = 'tenant-456';

    const mockQueryBuilder = {
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getMany: jest.fn(),
    };

    beforeEach(() => {
      mockBlacklistRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);
    });

    it('should return true if email is blacklisted', async () => {
      const checkDto: CheckBlacklistDto = {
        email: 'blocked@example.com',
      };

      const mockEntry = {
        id: 'blacklist-123',
        email: 'blocked@example.com',
        reason: 'Spam',
      };

      mockQueryBuilder.getMany.mockResolvedValue([mockEntry]);

      const result = await service.checkBlacklist(tenantId, checkDto);

      expect(result.isBlacklisted).toBe(true);
      expect(result.matchingEntries).toHaveLength(1);
      expect(result.reason).toBe('Spam');
    });

    it('should return true if email domain is blacklisted', async () => {
      const checkDto: CheckBlacklistDto = {
        email: 'user@spam.com',
      };

      const mockEntry = {
        id: 'blacklist-123',
        emailDomain: 'spam.com',
        reason: 'Known spam domain',
      };

      mockQueryBuilder.getMany.mockResolvedValue([mockEntry]);

      const result = await service.checkBlacklist(tenantId, checkDto);

      expect(result.isBlacklisted).toBe(true);
    });

    it('should return false if not blacklisted', async () => {
      const checkDto: CheckBlacklistDto = {
        email: 'clean@example.com',
      };

      mockQueryBuilder.getMany.mockResolvedValue([]);

      const result = await service.checkBlacklist(tenantId, checkDto);

      expect(result.isBlacklisted).toBe(false);
      expect(result.matchingEntries).toHaveLength(0);
    });

    it('should check multiple identifiers', async () => {
      const checkDto: CheckBlacklistDto = {
        email: 'user@example.com',
        phoneNumber: '+1234567890',
      };

      mockQueryBuilder.getMany.mockResolvedValue([]);

      const result = await service.checkBlacklist(tenantId, checkDto);

      expect(mockQueryBuilder.andWhere).toHaveBeenCalled();
      expect(result.isBlacklisted).toBe(false);
    });

    it('should return false if no identifiers provided', async () => {
      const checkDto: CheckBlacklistDto = {};

      const result = await service.checkBlacklist(tenantId, checkDto);

      expect(result.isBlacklisted).toBe(false);
      expect(result.matchingEntries).toHaveLength(0);
    });
  });

  describe('removeFromBlacklist', () => {
    const adminId = 'admin-123';
    const entryId = 'blacklist-456';

    it('should successfully remove from blacklist', async () => {
      const mockEntry = {
        id: entryId,
        email: 'blocked@example.com',
        isActive: true,
      };

      mockBlacklistRepository.findOne.mockResolvedValue(mockEntry);
      mockBlacklistRepository.save.mockResolvedValue({
        ...mockEntry,
        isActive: false,
        deactivatedBy: adminId,
      });

      const result = await service.removeFromBlacklist(adminId, entryId);

      expect(result.isActive).toBe(false);
      expect(result.deactivatedBy).toBe(adminId);
      expect(mockBlacklistRepository.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException if entry not found', async () => {
      mockBlacklistRepository.findOne.mockResolvedValue(null);

      await expect(
        service.removeFromBlacklist(adminId, entryId),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if already inactive', async () => {
      const mockEntry = {
        id: entryId,
        email: 'blocked@example.com',
        isActive: false,
      };

      mockBlacklistRepository.findOne.mockResolvedValue(mockEntry);

      await expect(
        service.removeFromBlacklist(adminId, entryId),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getBlacklistEntries', () => {
    const tenantId = 'tenant-456';

    it('should return active entries by default', async () => {
      const mockEntries = [
        { id: 'entry-1', email: 'blocked1@example.com', isActive: true },
        { id: 'entry-2', email: 'blocked2@example.com', isActive: true },
      ];

      mockBlacklistRepository.find.mockResolvedValue(mockEntries);

      const result = await service.getBlacklistEntries(tenantId);

      expect(result).toEqual(mockEntries);
      expect(mockBlacklistRepository.find).toHaveBeenCalledWith({
        where: { tenantId, isActive: true },
        relations: ['addedByUser', 'relatedUser', 'deactivatedByUser'],
        order: { createdAt: 'DESC' },
      });
    });

    it('should return all entries when activeOnly is false', async () => {
      const mockEntries = [
        { id: 'entry-1', isActive: true },
        { id: 'entry-2', isActive: false },
      ];

      mockBlacklistRepository.find.mockResolvedValue(mockEntries);

      await service.getBlacklistEntries(tenantId, false);

      expect(mockBlacklistRepository.find).toHaveBeenCalledWith({
        where: { tenantId },
        relations: ['addedByUser', 'relatedUser', 'deactivatedByUser'],
        order: { createdAt: 'DESC' },
      });
    });
  });

  describe('checkRegistration', () => {
    const tenantId = 'tenant-456';

    const mockQueryBuilder = {
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getMany: jest.fn(),
    };

    beforeEach(() => {
      mockBlacklistRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);
    });

    it('should block registration if email is blacklisted', async () => {
      const mockEntry = {
        email: 'blocked@example.com',
        reason: 'Spam account',
      };

      mockQueryBuilder.getMany.mockResolvedValue([mockEntry]);

      const result = await service.checkRegistration(
        tenantId,
        'blocked@example.com',
      );

      expect(result.isBlacklisted).toBe(true);
      expect(result.reason).toBe('Spam account');
      expect(result.blockedBy).toBe('email');
    });

    it('should block registration if domain is blacklisted', async () => {
      const mockEntry = {
        emailDomain: 'spam.com',
        reason: 'Known spam domain',
      };

      mockQueryBuilder.getMany.mockResolvedValue([mockEntry]);

      const result = await service.checkRegistration(
        tenantId,
        'user@spam.com',
      );

      expect(result.isBlacklisted).toBe(true);
      expect(result.blockedBy).toBe('domain');
    });

    it('should allow registration if not blacklisted', async () => {
      mockQueryBuilder.getMany.mockResolvedValue([]);

      const result = await service.checkRegistration(
        tenantId,
        'clean@example.com',
      );

      expect(result.isBlacklisted).toBe(false);
    });
  });

  describe('getBlacklistStatistics', () => {
    const tenantId = 'tenant-456';

    it('should return statistics', async () => {
      const mockActiveEntries = [
        { email: 'test1@example.com', phoneNumber: '+123' },
        { emailDomain: 'spam.com' },
        { companyName: 'Bad Company' },
      ];

      mockBlacklistRepository.count
        .mockResolvedValueOnce(3) // totalActive
        .mockResolvedValueOnce(1) // totalInactive
        .mockResolvedValueOnce(0); // expiringThisMonth

      mockBlacklistRepository.find.mockResolvedValue(mockActiveEntries);

      const result = await service.getBlacklistStatistics(tenantId);

      expect(result.totalActive).toBe(3);
      expect(result.totalInactive).toBe(1);
      expect(result.byType).toBeDefined();
      expect(result.byType.email).toBe(1);
      expect(result.byType.emailDomain).toBe(1);
      expect(result.byType.company).toBe(1);
    });
  });

  describe('searchBlacklist', () => {
    const tenantId = 'tenant-456';

    const mockQueryBuilder = {
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      getMany: jest.fn(),
    };

    beforeEach(() => {
      mockBlacklistRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);
    });

    it('should search blacklist entries', async () => {
      const mockResults = [
        { id: 'entry-1', email: 'spam@example.com' },
      ];

      mockQueryBuilder.getMany.mockResolvedValue(mockResults);

      const result = await service.searchBlacklist(tenantId, 'spam');

      expect(result).toEqual(mockResults);
      expect(mockQueryBuilder.andWhere).toHaveBeenCalled();
    });
  });
});
