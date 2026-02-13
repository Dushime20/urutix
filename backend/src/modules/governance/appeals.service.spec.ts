import { Test, TestingModule } from '@nestjs/testing';
import { AppealsService } from './appeals.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Appeal } from './entities/appeal.entity';
import { EnforcementAction } from './entities/enforcement-action.entity';
import { UserSubscription } from '../../entities/user-subscription.entity';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { CreateAppealDto } from './dto/create-appeal.dto';
import { ReviewAppealDto } from './dto/review-appeal.dto';
import { AddMessageDto } from './dto/add-message.dto';

describe('AppealsService', () => {
  let service: AppealsService;
  let appealRepository: Repository<Appeal>;
  let enforcementActionRepository: Repository<EnforcementAction>;
  let userSubscriptionRepository: Repository<UserSubscription>;
  let dataSource: any;

  const mockAppealRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const mockEnforcementActionRepository = {
    findOne: jest.fn(),
  };

  const mockUserSubscriptionRepository = {
    findOne: jest.fn(),
  };

  const mockDataSource = {
    transaction: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AppealsService,
        {
          provide: getRepositoryToken(Appeal),
          useValue: mockAppealRepository,
        },
        {
          provide: getRepositoryToken(EnforcementAction),
          useValue: mockEnforcementActionRepository,
        },
        {
          provide: getRepositoryToken(UserSubscription),
          useValue: mockUserSubscriptionRepository,
        },
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
      ],
    }).compile();

    service = module.get<AppealsService>(AppealsService);
    appealRepository = module.get(getRepositoryToken(Appeal));
    enforcementActionRepository = module.get(getRepositoryToken(EnforcementAction));
    userSubscriptionRepository = module.get(getRepositoryToken(UserSubscription));
    dataSource = module.get(DataSource);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createAppeal', () => {
    const userId = 'user-123';
    const enforcementActionId = 'action-456';
    const subscriptionId = 'sub-789';

    const createAppealDto: CreateAppealDto = {
      enforcementActionId,
      appealReason: 'I believe this suspension was made in error as I did not violate any terms',
      userStatement: 'I have been a loyal user for 2 years and have never received any warnings. The alleged violation was actually a misunderstanding.',
      supportingEvidence: {
        screenshots: ['url1', 'url2'],
        documents: ['doc1'],
      },
    };

    it('should successfully create an appeal', async () => {
      const mockEnforcementAction = {
        id: enforcementActionId,
        targetUserId: userId,
        actionType: 'suspend',
      };

      const mockSubscription = {
        id: subscriptionId,
        userId,
      };

      const mockAppeal = {
        id: 'appeal-123',
        enforcementActionId,
        userId,
        subscriptionId,
        appealReason: createAppealDto.appealReason,
        status: 'pending',
      };

      mockDataSource.transaction.mockImplementation(async (callback) => {
        const mockManager = {
          findOne: jest.fn()
            .mockResolvedValueOnce(mockEnforcementAction) // First call for enforcement action
            .mockResolvedValueOnce(null) // Second call for existing appeal
            .mockResolvedValueOnce(mockSubscription), // Third call for subscription
          create: jest.fn().mockReturnValue(mockAppeal),
          save: jest.fn().mockResolvedValue(mockAppeal),
          update: jest.fn().mockResolvedValue(undefined),
        };
        return callback(mockManager);
      });

      const result = await service.createAppeal(userId, createAppealDto);

      expect(result).toBeDefined();
      expect(result.status).toBe('pending');
      expect(result.enforcementActionId).toBe(enforcementActionId);
    });

    it('should throw NotFoundException if enforcement action not found', async () => {
      mockDataSource.transaction.mockImplementation(async (callback) => {
        const mockManager = {
          findOne: jest.fn().mockResolvedValue(null),
        };
        return callback(mockManager);
      });

      await expect(
        service.createAppeal(userId, createAppealDto),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if user does not own the enforcement action', async () => {
      const mockEnforcementAction = {
        id: enforcementActionId,
        targetUserId: 'different-user',
        actionType: 'suspend',
      };

      mockDataSource.transaction.mockImplementation(async (callback) => {
        const mockManager = {
          findOne: jest.fn().mockResolvedValue(mockEnforcementAction),
        };
        return callback(mockManager);
      });

      await expect(
        service.createAppeal(userId, createAppealDto),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if active appeal already exists', async () => {
      const mockEnforcementAction = {
        id: enforcementActionId,
        targetUserId: userId,
        actionType: 'suspend',
      };

      const existingAppeal = {
        id: 'existing-appeal',
        enforcementActionId,
        status: 'pending',
      };

      mockDataSource.transaction.mockImplementation(async (callback) => {
        const mockManager = {
          findOne: jest.fn()
            .mockResolvedValueOnce(mockEnforcementAction)
            .mockResolvedValueOnce(existingAppeal),
        };
        return callback(mockManager);
      });

      await expect(
        service.createAppeal(userId, createAppealDto),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getAppealsByUser', () => {
    const userId = 'user-123';

    it('should return all appeals for a user', async () => {
      const mockAppeals = [
        { id: 'appeal-1', userId, status: 'pending' },
        { id: 'appeal-2', userId, status: 'approved' },
      ];

      mockAppealRepository.find.mockResolvedValue(mockAppeals);

      const result = await service.getAppealsByUser(userId);

      expect(result).toEqual(mockAppeals);
      expect(mockAppealRepository.find).toHaveBeenCalledWith({
        where: { userId },
        relations: ['enforcementAction', 'reviewer'],
        order: { createdAt: 'DESC' },
      });
    });

    it('should return empty array if user has no appeals', async () => {
      mockAppealRepository.find.mockResolvedValue([]);

      const result = await service.getAppealsByUser(userId);

      expect(result).toEqual([]);
    });
  });

  describe('reviewAppeal', () => {
    const adminId = 'admin-123';
    const appealId = 'appeal-456';

    const reviewDto: ReviewAppealDto = {
      decision: 'approved',
      outcome: 'enforcement_lifted',
      adminResponse: 'After careful review of your appeal and the evidence provided, we have determined that the suspension was made in error. Your account has been restored.',
      reviewNotes: 'User provided compelling evidence',
    };

    it('should successfully review and approve an appeal', async () => {
      const mockAppeal = {
        id: appealId,
        userId: 'user-123',
        status: 'pending',
        messages: [],
      };

      mockDataSource.transaction.mockImplementation(async (callback) => {
        const mockManager = {
          findOne: jest.fn().mockResolvedValue(mockAppeal),
          save: jest.fn().mockImplementation((entity, data) => Promise.resolve({ ...mockAppeal, ...data })),
        };
        return callback(mockManager);
      });

      const result = await service.reviewAppeal(adminId, appealId, reviewDto);

      expect(result).toBeDefined();
      expect(result.status).toBe('approved');
    });

    it('should throw NotFoundException if appeal not found', async () => {
      mockDataSource.transaction.mockImplementation(async (callback) => {
        const mockManager = {
          findOne: jest.fn().mockResolvedValue(null),
        };
        return callback(mockManager);
      });

      await expect(
        service.reviewAppeal(adminId, appealId, reviewDto),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if appeal is already resolved', async () => {
      const mockAppeal = {
        id: appealId,
        status: 'approved',
      };

      mockDataSource.transaction.mockImplementation(async (callback) => {
        const mockManager = {
          findOne: jest.fn().mockResolvedValue(mockAppeal),
        };
        return callback(mockManager);
      });

      await expect(
        service.reviewAppeal(adminId, appealId, reviewDto),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('addMessageToAppeal', () => {
    const appealId = 'appeal-123';
    const userId = 'user-456';
    const adminId = 'admin-789';

    const messageDto: AddMessageDto = {
      message: 'I have additional evidence to support my appeal',
    };

    it('should successfully add a user message', async () => {
      const mockAppeal = {
        id: appealId,
        userId,
        status: 'pending',
        messages: [],
      };

      mockDataSource.transaction.mockImplementation(async (callback) => {
        const mockManager = {
          findOne: jest.fn().mockResolvedValue(mockAppeal),
          save: jest.fn().mockImplementation((entity, data) => Promise.resolve({ ...mockAppeal, ...data })),
        };
        return callback(mockManager);
      });

      const result = await service.addMessageToAppeal(appealId, userId, false, messageDto);

      expect(result).toBeDefined();
      expect(result.messages.length).toBeGreaterThan(0);
    });

    it('should update status to under_review when admin responds', async () => {
      const mockAppeal = {
        id: appealId,
        userId,
        status: 'pending',
        messages: [],
      };

      mockDataSource.transaction.mockImplementation(async (callback) => {
        const mockManager = {
          findOne: jest.fn().mockResolvedValue(mockAppeal),
          save: jest.fn().mockImplementation((entity, data) => Promise.resolve({ ...mockAppeal, ...data, status: 'under_review' })),
        };
        return callback(mockManager);
      });

      const result = await service.addMessageToAppeal(appealId, adminId, true, messageDto);

      expect(result.status).toBe('under_review');
    });

    it('should throw BadRequestException if appeal is resolved', async () => {
      const mockAppeal = {
        id: appealId,
        userId,
        status: 'approved',
        messages: [],
      };

      mockDataSource.transaction.mockImplementation(async (callback) => {
        const mockManager = {
          findOne: jest.fn().mockResolvedValue(mockAppeal),
        };
        return callback(mockManager);
      });

      await expect(
        service.addMessageToAppeal(appealId, userId, false, messageDto),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if user tries to message another user\'s appeal', async () => {
      const mockAppeal = {
        id: appealId,
        userId: 'different-user',
        status: 'pending',
        messages: [],
      };

      mockDataSource.transaction.mockImplementation(async (callback) => {
        const mockManager = {
          findOne: jest.fn().mockResolvedValue(mockAppeal),
        };
        return callback(mockManager);
      });

      await expect(
        service.addMessageToAppeal(appealId, userId, false, messageDto),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('withdrawAppeal', () => {
    const userId = 'user-123';
    const appealId = 'appeal-456';

    it('should successfully withdraw a pending appeal', async () => {
      const mockAppeal = {
        id: appealId,
        userId,
        status: 'pending',
      };

      mockDataSource.transaction.mockImplementation(async (callback) => {
        const mockManager = {
          findOne: jest.fn().mockResolvedValue(mockAppeal),
          save: jest.fn().mockImplementation((entity, data) => Promise.resolve({ ...mockAppeal, ...data, status: 'withdrawn' })),
        };
        return callback(mockManager);
      });

      const result = await service.withdrawAppeal(userId, appealId);

      expect(result.status).toBe('withdrawn');
    });

    it('should throw BadRequestException if user does not own the appeal', async () => {
      const mockAppeal = {
        id: appealId,
        userId: 'different-user',
        status: 'pending',
      };

      mockDataSource.transaction.mockImplementation(async (callback) => {
        const mockManager = {
          findOne: jest.fn().mockResolvedValue(mockAppeal),
        };
        return callback(mockManager);
      });

      await expect(
        service.withdrawAppeal(userId, appealId),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if appeal is already resolved', async () => {
      const mockAppeal = {
        id: appealId,
        userId,
        status: 'approved',
      };

      mockDataSource.transaction.mockImplementation(async (callback) => {
        const mockManager = {
          findOne: jest.fn().mockResolvedValue(mockAppeal),
        };
        return callback(mockManager);
      });

      await expect(
        service.withdrawAppeal(userId, appealId),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
