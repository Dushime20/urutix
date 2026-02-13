import { Test, TestingModule } from '@nestjs/testing';
import { RiskDetectionService } from './risk-detection.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { RiskFlag } from './entities/risk-flag.entity';
import { User } from '../../entities/user.entity';
import { Load } from '../../entities/load.entity';
import { EnforcementService } from './enforcement.service';
import { NotFoundException } from '@nestjs/common';
import { CreateRiskFlagDto } from './dto/create-risk-flag.dto';
import { ReviewRiskFlagDto } from './dto/review-risk-flag.dto';

describe('RiskDetectionService', () => {
  let service: RiskDetectionService;
  let riskFlagRepository: Repository<RiskFlag>;
  let userRepository: Repository<User>;
  let loadRepository: Repository<Load>;
  let enforcementService: EnforcementService;
  let dataSource: any;

  const mockRiskFlagRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
    count: jest.fn(),
  };

  const mockUserRepository = {
    findOne: jest.fn(),
  };

  const mockLoadRepository = {
    count: jest.fn(),
    find: jest.fn(),
  };

  const mockEnforcementService = {
    suspendUser: jest.fn(),
  };

  const mockDataSource = {
    query: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RiskDetectionService,
        {
          provide: getRepositoryToken(RiskFlag),
          useValue: mockRiskFlagRepository,
        },
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
        {
          provide: getRepositoryToken(Load),
          useValue: mockLoadRepository,
        },
        {
          provide: EnforcementService,
          useValue: mockEnforcementService,
        },
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
      ],
    }).compile();

    service = module.get<RiskDetectionService>(RiskDetectionService);
    riskFlagRepository = module.get(getRepositoryToken(RiskFlag));
    userRepository = module.get(getRepositoryToken(User));
    loadRepository = module.get(getRepositoryToken(Load));
    enforcementService = module.get(EnforcementService);
    dataSource = module.get(DataSource);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('flagUser', () => {
    const userId = 'user-123';
    const tenantId = 'tenant-456';

    const flagDto: CreateRiskFlagDto = {
      userId,
      flagType: 'suspicious_activity',
      severity: 'high',
      riskScore: 75,
      description: 'User showing suspicious patterns',
    };

    it('should successfully create a risk flag', async () => {
      const mockUser = {
        id: userId,
        tenantId,
      };

      const mockRiskFlag = {
        id: 'flag-123',
        userId,
        tenantId,
        flagType: 'suspicious_activity',
        severity: 'high',
      };

      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockRiskFlagRepository.create.mockReturnValue(mockRiskFlag);
      mockRiskFlagRepository.save.mockResolvedValue(mockRiskFlag);

      const result = await service.flagUser(flagDto);

      expect(result).toBeDefined();
      expect(result.flagType).toBe('suspicious_activity');
      expect(mockRiskFlagRepository.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException if user not found', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      await expect(service.flagUser(flagDto)).rejects.toThrow(NotFoundException);
    });
  });

  describe('getRiskScore', () => {
    const userId = 'user-123';

    it('should calculate risk score based on active flags', async () => {
      const mockFlags = [
        { severity: 'high', status: 'pending' },
        { severity: 'medium', status: 'pending' },
      ];

      mockRiskFlagRepository.find.mockResolvedValue(mockFlags);
      mockDataSource.query.mockResolvedValue([{ count: '0' }]);
      mockLoadRepository.count.mockResolvedValue(0);
      mockLoadRepository.find.mockResolvedValue([]);

      const score = await service.getRiskScore(userId);

      expect(score).toBeGreaterThan(0);
      expect(score).toBeLessThanOrEqual(100);
    });

    it('should include enforcement history in score', async () => {
      mockRiskFlagRepository.find.mockResolvedValue([]);
      mockDataSource.query.mockResolvedValue([{ count: '3' }]); // 3 recent enforcements
      mockLoadRepository.count.mockResolvedValue(0);
      mockLoadRepository.find.mockResolvedValue([]);

      const score = await service.getRiskScore(userId);

      expect(score).toBeGreaterThan(0);
    });

    it('should cap risk score at 100', async () => {
      const mockFlags = Array(10).fill({ severity: 'critical', status: 'pending' });

      mockRiskFlagRepository.find.mockResolvedValue(mockFlags);
      mockDataSource.query.mockResolvedValue([{ count: '10' }]);
      mockLoadRepository.count.mockResolvedValue(50);
      mockLoadRepository.find.mockResolvedValue([]);

      const score = await service.getRiskScore(userId);

      expect(score).toBeLessThanOrEqual(100);
    });
  });

  describe('detectRapidPosting', () => {
    const userId = 'user-123';

    it('should detect rapid posting and create flag', async () => {
      const mockUser = {
        id: userId,
        tenantId: 'tenant-123',
      };

      const mockRiskFlag = {
        id: 'flag-123',
        flagType: 'rapid_posting',
        severity: 'high',
      };

      mockLoadRepository.count.mockResolvedValue(15); // 15 posts in 1 hour
      mockRiskFlagRepository.findOne.mockResolvedValue(null); // No existing flag
      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockRiskFlagRepository.create.mockReturnValue(mockRiskFlag);
      mockRiskFlagRepository.save.mockResolvedValue(mockRiskFlag);

      const result = await service.detectRapidPosting(userId);

      expect(result).toBeDefined();
      expect(result.flagType).toBe('rapid_posting');
      expect(result.severity).toBe('high');
    });

    it('should return null if posting rate is normal', async () => {
      mockLoadRepository.count.mockResolvedValue(5); // Only 5 posts

      const result = await service.detectRapidPosting(userId);

      expect(result).toBeNull();
    });

    it('should return null if flag already exists', async () => {
      const existingFlag = {
        id: 'existing-flag',
        flagType: 'rapid_posting',
        status: 'pending',
      };

      mockLoadRepository.count.mockResolvedValue(15);
      mockRiskFlagRepository.findOne.mockResolvedValue(existingFlag);

      const result = await service.detectRapidPosting(userId);

      expect(result).toBeNull();
    });

    it('should mark as critical for very high posting rate', async () => {
      const mockUser = {
        id: userId,
        tenantId: 'tenant-123',
      };

      const mockRiskFlag = {
        id: 'flag-123',
        flagType: 'rapid_posting',
        severity: 'critical',
      };

      mockLoadRepository.count.mockResolvedValue(25); // 25 posts in 1 hour
      mockRiskFlagRepository.findOne.mockResolvedValue(null);
      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockRiskFlagRepository.create.mockReturnValue(mockRiskFlag);
      mockRiskFlagRepository.save.mockResolvedValue(mockRiskFlag);

      const result = await service.detectRapidPosting(userId);

      expect(result.severity).toBe('critical');
    });
  });

  describe('detectPriceAnomalies', () => {
    const userId = 'user-123';

    it('should detect price anomalies and create flag', async () => {
      const mockUser = {
        id: userId,
        tenantId: 'tenant-123',
      };

      const mockPosts = [
        { id: '1', price: '10000' }, // Very high
        { id: '2', price: '9000' },  // Very high
        { id: '3', price: '100' },   // Normal
      ];

      const mockRiskFlag = {
        id: 'flag-123',
        flagType: 'price_anomaly',
        severity: 'medium',
      };

      mockLoadRepository.find.mockResolvedValue(mockPosts);
      mockDataSource.query.mockResolvedValue([{ avg_price: '1000' }]); // Market avg
      mockRiskFlagRepository.findOne.mockResolvedValue(null);
      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockRiskFlagRepository.create.mockReturnValue(mockRiskFlag);
      mockRiskFlagRepository.save.mockResolvedValue(mockRiskFlag);

      const result = await service.detectPriceAnomalies(userId);

      expect(result).toBeDefined();
      expect(result.flagType).toBe('price_anomaly');
    });

    it('should return null if not enough data', async () => {
      mockLoadRepository.find.mockResolvedValue([{ id: '1', price: '100' }]); // Only 1 post

      const result = await service.detectPriceAnomalies(userId);

      expect(result).toBeNull();
    });

    it('should return null if no market data', async () => {
      const mockPosts = [
        { id: '1', price: '100' },
        { id: '2', price: '200' },
        { id: '3', price: '300' },
      ];

      mockLoadRepository.find.mockResolvedValue(mockPosts);
      mockDataSource.query.mockResolvedValue([{ avg_price: '0' }]); // No market data

      const result = await service.detectPriceAnomalies(userId);

      expect(result).toBeNull();
    });
  });

  describe('detectBotBehavior', () => {
    const userId = 'user-123';

    it('should detect bot behavior with consistent timing', async () => {
      const mockUser = {
        id: userId,
        tenantId: 'tenant-123',
      };

      // Create posts with very consistent timing (every 60 seconds)
      const baseTime = new Date('2026-02-13T10:00:00Z');
      const mockPosts = Array.from({ length: 60 }, (_, i) => ({
        id: `post-${i}`,
        createdAt: new Date(baseTime.getTime() + i * 60000), // Every 60 seconds
      }));

      const mockRiskFlag = {
        id: 'flag-123',
        flagType: 'bot_behavior',
        severity: 'critical',
      };

      mockLoadRepository.count.mockResolvedValue(60);
      mockLoadRepository.find.mockResolvedValue(mockPosts);
      mockRiskFlagRepository.findOne.mockResolvedValue(null);
      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockRiskFlagRepository.create.mockReturnValue(mockRiskFlag);
      mockRiskFlagRepository.save.mockResolvedValue(mockRiskFlag);

      const result = await service.detectBotBehavior(userId);

      expect(result).toBeDefined();
      expect(result.flagType).toBe('bot_behavior');
      expect(result.severity).toBe('critical');
    });

    it('should return null if action count is below threshold', async () => {
      mockLoadRepository.count.mockResolvedValue(10); // Only 10 actions

      const result = await service.detectBotBehavior(userId);

      expect(result).toBeNull();
    });
  });

  describe('autoSuspendIfHighRisk', () => {
    const userId = 'user-123';

    it('should auto-suspend user with critical risk score', async () => {
      const mockFlags = Array(5).fill({ severity: 'critical', status: 'pending' });

      mockRiskFlagRepository.find.mockResolvedValue(mockFlags);
      mockDataSource.query.mockResolvedValue([{ count: '5' }]);
      mockLoadRepository.count.mockResolvedValue(20);
      mockLoadRepository.find.mockResolvedValue([]);
      mockEnforcementService.suspendUser.mockResolvedValue({});

      const result = await service.autoSuspendIfHighRisk(userId);

      expect(result).toBe(true);
      expect(mockEnforcementService.suspendUser).toHaveBeenCalledWith(
        'system',
        userId,
        expect.objectContaining({
          severity: 'critical',
          violationCategory: 'platform_abuse',
        }),
      );
    });

    it('should not suspend user with low risk score', async () => {
      mockRiskFlagRepository.find.mockResolvedValue([]);
      mockDataSource.query.mockResolvedValue([{ count: '0' }]);
      mockLoadRepository.count.mockResolvedValue(0);
      mockLoadRepository.find.mockResolvedValue([]);

      const result = await service.autoSuspendIfHighRisk(userId);

      expect(result).toBe(false);
      expect(mockEnforcementService.suspendUser).not.toHaveBeenCalled();
    });
  });

  describe('reviewRiskFlag', () => {
    const adminId = 'admin-123';
    const flagId = 'flag-456';

    const reviewDto: ReviewRiskFlagDto = {
      status: 'confirmed',
      reviewNotes: 'Confirmed as legitimate risk after investigation',
    };

    it('should successfully review a risk flag', async () => {
      const mockFlag = {
        id: flagId,
        userId: 'user-123',
        status: 'pending',
      };

      mockRiskFlagRepository.findOne.mockResolvedValue(mockFlag);
      mockRiskFlagRepository.save.mockResolvedValue({
        ...mockFlag,
        status: 'confirmed',
        reviewedBy: adminId,
      });

      const result = await service.reviewRiskFlag(adminId, flagId, reviewDto);

      expect(result.status).toBe('confirmed');
      expect(mockRiskFlagRepository.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException if flag not found', async () => {
      mockRiskFlagRepository.findOne.mockResolvedValue(null);

      await expect(
        service.reviewRiskFlag(adminId, flagId, reviewDto),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('detectSuspiciousActivity', () => {
    const userId = 'user-123';

    it('should run all detection methods and return flags', async () => {
      const mockUser = {
        id: userId,
        tenantId: 'tenant-123',
      };

      const mockFlag = {
        id: 'flag-123',
        flagType: 'rapid_posting',
      };

      // Mock rapid posting detection
      mockLoadRepository.count.mockResolvedValue(15);
      mockRiskFlagRepository.findOne.mockResolvedValue(null);
      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockRiskFlagRepository.create.mockReturnValue(mockFlag);
      mockRiskFlagRepository.save.mockResolvedValue(mockFlag);

      // Mock price anomaly detection (no anomaly)
      mockLoadRepository.find.mockResolvedValue([]);

      const result = await service.detectSuspiciousActivity(userId);

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
    });
  });
});
