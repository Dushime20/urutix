import { Test, TestingModule } from '@nestjs/testing';
import { FeatureRestrictionGuard } from './feature-restriction.guard';
import { Reflector } from '@nestjs/core';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';

describe('FeatureRestrictionGuard', () => {
  let guard: FeatureRestrictionGuard;
  let reflector: Reflector;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FeatureRestrictionGuard,
        {
          provide: Reflector,
          useValue: {
            get: jest.fn(),
          },
        },
      ],
    }).compile();

    guard = module.get<FeatureRestrictionGuard>(FeatureRestrictionGuard);
    reflector = module.get<Reflector>(Reflector);
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  describe('canActivate', () => {
    let mockContext: ExecutionContext;
    let mockRequest: any;

    beforeEach(() => {
      mockRequest = {
        enforcementStatus: {
          enforcement_status: 'normal',
          restrictions: {},
        },
      };

      mockContext = {
        getHandler: jest.fn(),
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue(mockRequest),
        }),
      } as any;
    });

    it('should allow access if no feature is required', async () => {
      jest.spyOn(reflector, 'get').mockReturnValue(undefined);

      const result = await guard.canActivate(mockContext);

      expect(result).toBe(true);
    });

    it('should allow access if no enforcement status', async () => {
      jest.spyOn(reflector, 'get').mockReturnValue('canPostCargo');
      mockRequest.enforcementStatus = undefined;

      const result = await guard.canActivate(mockContext);

      expect(result).toBe(true);
    });

    it('should allow access if feature is not restricted', async () => {
      jest.spyOn(reflector, 'get').mockReturnValue('canPostCargo');
      mockRequest.enforcementStatus = {
        enforcement_status: 'normal',
        restrictions: {},
      };

      const result = await guard.canActivate(mockContext);

      expect(result).toBe(true);
    });

    it('should allow access if feature is explicitly allowed', async () => {
      jest.spyOn(reflector, 'get').mockReturnValue('canPostCargo');
      mockRequest.enforcementStatus = {
        enforcement_status: 'restricted',
        restrictions: {
          canPostCargo: true, // Explicitly allowed
          canBid: false,
        },
      };

      const result = await guard.canActivate(mockContext);

      expect(result).toBe(true);
    });

    it('should block access if feature is restricted', async () => {
      jest.spyOn(reflector, 'get').mockReturnValue('canPostCargo');
      mockRequest.enforcementStatus = {
        enforcement_status: 'restricted',
        restrictions: {
          canPostCargo: false,
          canBid: false,
        },
      };

      await expect(guard.canActivate(mockContext)).rejects.toThrow(ForbiddenException);
    });

    it('should include all restricted features in error', async () => {
      jest.spyOn(reflector, 'get').mockReturnValue('canPostCargo');
      mockRequest.enforcementStatus = {
        enforcement_status: 'restricted',
        restrictions: {
          canPostCargo: false,
          canBid: false,
          canMessage: false,
        },
      };

      try {
        await guard.canActivate(mockContext);
        fail('Should have thrown ForbiddenException');
      } catch (error) {
        expect(error).toBeInstanceOf(ForbiddenException);
        const response = error.getResponse() as any;
        expect(response.details.all_restricted_features).toEqual([
          'canPostCargo',
          'canBid',
          'canMessage',
        ]);
      }
    });

    it('should handle restricted status with multiple features', async () => {
      jest.spyOn(reflector, 'get').mockReturnValue('canAddTrucks');
      mockRequest.enforcementStatus = {
        enforcement_status: 'restricted',
        restrictions: {
          canPostCargo: false,
          canAddTrucks: false,
          canBid: true, // This one is allowed
        },
      };

      await expect(guard.canActivate(mockContext)).rejects.toThrow(ForbiddenException);
    });
  });
});
