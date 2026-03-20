
import { MatchingService } from './matching.service';
import { Load } from '../../entities/load.entity';
import { Truck, VehicleStatus } from '../../entities/truck.entity';
import { MatchRequestDto } from './dto/match-request.dto';

describe('MatchingService Algorithm', () => {
  let service: MatchingService;

  const mockLoadRepo: any = { findOne: jest.fn() };
  const mockTruckRepo: any = { find: jest.fn() };
  const mockDriverRepo: any = { findOne: jest.fn() };
  const mockLocationRepo: any = {};
  const mockCacheService: any = {};
  const mockMarketIntelligence: any = {
    getMarketConditions: jest.fn().mockReturnValue({}),
  };
  const mockMlPrediction: any = {
    predictSuccessProbability: jest.fn().mockReturnValue(0.8),
  };

  beforeEach(() => {
    service = new MatchingService(
      mockLoadRepo,
      mockTruckRepo,
      mockDriverRepo,
      mockLocationRepo,
      mockCacheService,
      mockMarketIntelligence,
      mockMlPrediction,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('scoreTruck - 5 Core Criteria Constraints', () => {
    const baseLoad = {
      id: 'load-1',
      weight: 1000,
      requiresRefrigeration: false,
      isHazardous: false,
      requiresGpsMonitoring: false,
      pickupLocation: () => ({ locationData: { coordinates: [0, 0] } }), // Mock
    } as any;

    const baseTruck = {
      id: 'truck-1',
      plateNumber: 'T-100',
      capacityWeight: 2000, // > 1000
      status: VehicleStatus.AVAILABLE,
      hasRefrigeration: false,
      hasHazmatPermit: false,
      hasGps: false,
      securityFeatures: {},
      routeCapabilities: { maxDistance: 1000 },
      currentLocation: { coordinates: [0, 0] }, // Mock
    } as any;

    const criteria = { includeDrivers: false } as MatchRequestDto;

    // Helper to access private method
    const scoreTruck = async (truck: any, load: any) => {
      return (service as any).scoreTruck(truck, load, criteria);
    };

    it('✅ matches when all constraints are met', async () => {
      const result = await scoreTruck(baseTruck, baseLoad);
      expect(result).not.toBeNull();
      expect(result.overallScore).toBeGreaterThan(0);
    });

    it('❌ rejects when CAPACITY is insufficient', async () => {
      const smallTruck = { ...baseTruck, capacityWeight: 500 }; // < 1000
      const result = await scoreTruck(smallTruck, baseLoad);
      expect(result).toBeNull();
    });

    it('❌ rejects when STATUS is not AVAILABLE', async () => {
      const busyTruck = { ...baseTruck, status: VehicleStatus.MAINTENANCE };
      const result = await scoreTruck(busyTruck, baseLoad);
      expect(result).toBeNull();
    });

    it('✅ accepts IN_TRANSIT truck if finishing soon (exception)', async () => {
      const incomingTruck = { 
        ...baseTruck, 
        status: VehicleStatus.IN_TRANSIT,
        estimatedAvailableTime: new Date(Date.now() + 1000 * 60 * 60), // 1 hour from now
      };
      const result = await scoreTruck(incomingTruck, baseLoad);
      expect(result).not.toBeNull();
    });

    it('❌ rejects when EQUIPMENT (Refrigeration) missing', async () => {
      const reeferLoad = { ...baseLoad, requiresRefrigeration: true };
      const result = await scoreTruck(baseTruck, reeferLoad);
      expect(result).toBeNull();
    });

    it('✅ accepts when EQUIPMENT (Refrigeration) present', async () => {
      const reeferLoad = { ...baseLoad, requiresRefrigeration: true };
      const reeferTruck = { ...baseTruck, hasRefrigeration: true };
      const result = await scoreTruck(reeferTruck, reeferLoad);
      expect(result).not.toBeNull();
      expect(result.matchReason).toContain('Refrigeration');
    });

    it('❌ rejects when SECURITY (GPS) missing', async () => {
      const gpsLoad = { ...baseLoad, requiresGpsMonitoring: true };
      const result = await scoreTruck(baseTruck, gpsLoad);
      expect(result).toBeNull();
    });

    it('✅ accepts when SECURITY (GPS) present', async () => {
      const gpsLoad = { ...baseLoad, requiresGpsMonitoring: true };
      const gpsTruck = { ...baseTruck, hasGps: true };
      const result = await scoreTruck(gpsTruck, gpsLoad);
      expect(result).not.toBeNull();
    });

    it('❌ rejects when ROUTE (Distance) too far', async () => {
      // Mock calculateDistance to return large value
      jest.spyOn(service as any, 'calculateDistance').mockReturnValue(2000);
      
      const localTruck = { ...baseTruck, routeCapabilities: { maxDistance: 100 } };
      const result = await scoreTruck(localTruck, baseLoad);
      expect(result).toBeNull();
    });

  });
});
