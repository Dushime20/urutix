import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  OpenStreetMapLocationService,
  OSMGeocodingResult,
  OSMPlacesResult,
} from './openstreetmap-location.service';

export interface EnrichedLocation {
  id: string;
  type: 'PICKUP' | 'DELIVERY' | 'STOP' | 'REFUEL' | 'REST';
  sequence: number;
  locationData: {
    name: string;
    address: string;
    coordinates: {
      latitude: number;
      longitude: number;
    };
    // Enhanced location intelligence
    city: string;
    state: string;
    country: string;
    locationCategory: string;
    locationSubCategory: string;
    businessHours: {
      open: string;
      close: string;
      days: string[];
    };
    timezone: string;
    accessType: string;
    parkingAvailable: boolean;
    securityLevel: string;
    loadingDockCount: number;
    maxTruckHeight: number;
    maxTruckWeight: number;
    specialInstructions: string;
    // Route optimization
    distanceFromHighway: number;
    trafficPattern: string;
    bestAccessTime: string;
    restrictions: string[];
    // Additional fields for frontend compatibility
    fullAddress: string;
    category: string;
    fuelStationsNearby: number;
    restAreasNearby: number;
    // Detailed administrative areas from OSM
    administrativeAreas: {
      district: string;
      province: string;
      county: string;
      postalCode: string;
      administrativeArea: string;
      subDistrict?: string;
      ward?: string;
      constituency?: string;
    };
    // Nearby Points of Interest from OSM
    nearbyPOIs: {
      landmarks: Array<{
        name: string;
        type: string;
        distance: number;
        coordinates: { latitude: number; longitude: number };
      }>;
      transportHubs: Array<{
        name: string;
        type:
          | 'AIRPORT'
          | 'TRAIN_STATION'
          | 'BUS_TERMINAL'
          | 'PORT'
          | 'TRUCK_TERMINAL';
        distance: number;
        coordinates: { latitude: number; longitude: number };
      }>;
      commercialAreas: Array<{
        name: string;
        type:
          | 'SHOPPING_CENTER'
          | 'MARKET'
          | 'INDUSTRIAL_PARK'
          | 'BUSINESS_DISTRICT';
        distance: number;
        coordinates: { latitude: number; longitude: number };
      }>;
      serviceFacilities: Array<{
        name: string;
        type:
          | 'HOSPITAL'
          | 'POLICE_STATION'
          | 'FIRE_STATION'
          | 'BANK'
          | 'POST_OFFICE';
        distance: number;
        coordinates: { latitude: number; longitude: number };
      }>;
    };
  };
  scheduledDate: Date;
  estimatedTime: number;
  requirements?: {
    requiresForklift?: boolean;
    requiresCrane?: boolean;
    requiresLoadingDock?: boolean;
    hazmatCertified?: boolean;
    temperatureControlled?: boolean;
    securityClearance?: string;
  };
  status?: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  actualArrivalTime?: Date;
  actualDepartureTime?: Date;
  notes?: string;
}

// Load and LoadLocation interfaces (simplified for this service)
interface LoadLocation {
  type: 'PICKUP' | 'DELIVERY' | 'STOP' | 'REFUEL' | 'REST';
  sequence: number;
  locationData: {
    name: string;
    address: string;
    coordinates: {
      latitude: number;
      longitude: number;
    };
    contactInfo?: {
      contactEmail?: string;
      contactPhone?: string;
      contactPerson?: string;
    };
    operatingHours?: any;
    accessInstructions?: string;
    specialInstructions?: string;
    requirements?: {
      requiresCrane?: boolean;
      hazmatCertified?: boolean;
      requiresForklift?: boolean;
      securityClearance?: string;
      requiresLoadingDock?: boolean;
      temperatureControlled?: boolean;
    };
    estimatedTime?: number;
    scheduledDate?: string;
  };
}

interface Load {
  id: string;
  locations: LoadLocation[];
  // Add any other properties that might be needed
  [key: string]: any;
}

@Injectable()
export class OSMLocationEnrichmentService {
  private readonly logger = new Logger(OSMLocationEnrichmentService.name);
  private readonly cache = new Map<
    string,
    { data: EnrichedLocation; timestamp: number }
  >();
  private readonly CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

  constructor(
    private osmLocationService: OpenStreetMapLocationService,
    private configService: ConfigService,
  ) {}

  /**
   * Get coordinates for an address string
   */
  async getCoordinates(address: string): Promise<{ latitude: number; longitude: number } | null> {
    return this.osmLocationService.getCoordinatesFromAddress(address);
  }

  /**
   * Enrich cargo locations using OpenStreetMap data
   */
  async enrichCargoLocations(load: Load): Promise<EnrichedLocation[]> {
    // Handle both Load entity and simple load object
    const locations = load.locations || (load as any).locations || [];
    this.logger.log(
      `Enriching ${locations.length} locations for cargo ${load.id}`,
    );

    const enrichedLocations: EnrichedLocation[] = [];

    for (const location of locations) {
      try {
        const enrichedLocation = await this.enrichLocation(location);
        enrichedLocations.push(enrichedLocation);
      } catch (error) {
        this.logger.error(
          `Error enriching location ${location.sequence}:`,
          error,
        );
        // Add fallback enriched location
        enrichedLocations.push(this.createFallbackEnrichedLocation(location));
      }
    }

    return enrichedLocations;
  }

  /**
   * Enrich a single location using OpenStreetMap data
   */
  async enrichLocation(location: LoadLocation): Promise<EnrichedLocation> {
    const cacheKey = this.generateCacheKey(location);
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    const coordinates = location.locationData.coordinates;

    try {
      // Get real geocoding data from OpenStreetMap
      const geocodingData =
        await this.osmLocationService.getGeocodingData(coordinates);

      // Get real POI data from OpenStreetMap
      const poiData = await this.osmLocationService.getPOIData(coordinates);

      // Generate location intelligence
      const locationIntelligence = this.generateLocationIntelligence(
        coordinates,
        location.type,
      );

      // Create enriched location
      const enrichedLocation: EnrichedLocation = {
        id: `${location.type}_${location.sequence}_${Date.now()}`,
        type: location.type,
        sequence: location.sequence,
        locationData: {
          name: this.generateLocationName(location.type, coordinates),
          address: geocodingData.address,
          coordinates,
          city: geocodingData.city,
          state: geocodingData.state,
          country: geocodingData.country,
          locationCategory: locationIntelligence.category,
          locationSubCategory: locationIntelligence.subCategory,
          businessHours: locationIntelligence.businessHours,
          timezone: geocodingData.timezone,
          accessType: locationIntelligence.accessType,
          parkingAvailable: locationIntelligence.parkingAvailable,
          securityLevel: locationIntelligence.securityLevel,
          loadingDockCount: locationIntelligence.loadingDockCount,
          maxTruckHeight: locationIntelligence.maxTruckHeight,
          maxTruckWeight: locationIntelligence.maxTruckWeight,
          specialInstructions: locationIntelligence.specialInstructions,
          distanceFromHighway: locationIntelligence.distanceFromHighway,
          trafficPattern: locationIntelligence.trafficPattern,
          bestAccessTime: locationIntelligence.bestAccessTime,
          restrictions: locationIntelligence.restrictions,
          fullAddress: geocodingData.address,
          category: locationIntelligence.category,
          fuelStationsNearby: locationIntelligence.fuelStationsNearby,
          restAreasNearby: locationIntelligence.restAreasNearby,
          administrativeAreas: geocodingData.administrativeAreas,
          nearbyPOIs: this.convertOSMPOIDataToEnrichedFormat(poiData),
        },
        scheduledDate: new Date(
          location.locationData.scheduledDate || new Date(),
        ),
        estimatedTime: location.locationData.estimatedTime || 60,
        requirements: location.locationData.requirements || {},
        status: 'PENDING',
        notes: location.locationData.specialInstructions || '',
      };

      this.setCache(cacheKey, enrichedLocation);
      return enrichedLocation;
    } catch (error) {
      this.logger.error('Error enriching location with OSM data:', error);
      return this.createFallbackEnrichedLocation(location);
    }
  }

  /**
   * Convert OSM POI data to enriched format
   */
  private convertOSMPOIDataToEnrichedFormat(poiData: OSMPlacesResult) {
    return {
      landmarks: poiData.landmarks.map((poi) => ({
        name: poi.name,
        type: poi.type,
        distance: poi.distance,
        coordinates: poi.coordinates,
      })),
      transportHubs: poiData.transportHubs.map((poi) => ({
        name: poi.name,
        type: this.mapTransportType(poi.type),
        distance: poi.distance,
        coordinates: poi.coordinates,
      })),
      commercialAreas: poiData.commercialAreas.map((poi) => ({
        name: poi.name,
        type: this.mapCommercialType(poi.type),
        distance: poi.distance,
        coordinates: poi.coordinates,
      })),
      serviceFacilities: poiData.serviceFacilities.map((poi) => ({
        name: poi.name,
        type: this.mapServiceType(poi.type),
        distance: poi.distance,
        coordinates: poi.coordinates,
      })),
    };
  }

  /**
   * Map OSM transport types to enriched format
   */
  private mapTransportType(
    osmType: string,
  ): 'AIRPORT' | 'TRAIN_STATION' | 'BUS_TERMINAL' | 'PORT' | 'TRUCK_TERMINAL' {
    switch (osmType) {
      case 'AIRPORT':
        return 'AIRPORT';
      case 'TRAIN_STATION':
        return 'TRAIN_STATION';
      case 'BUS_TERMINAL':
        return 'BUS_TERMINAL';
      case 'PORT':
        return 'PORT';
      default:
        return 'TRUCK_TERMINAL';
    }
  }

  /**
   * Map OSM commercial types to enriched format
   */
  private mapCommercialType(
    osmType: string,
  ): 'SHOPPING_CENTER' | 'MARKET' | 'INDUSTRIAL_PARK' | 'BUSINESS_DISTRICT' {
    switch (osmType) {
      case 'SHOPPING_CENTER':
        return 'SHOPPING_CENTER';
      case 'SUPERMARKET':
        return 'MARKET';
      case 'INDUSTRIAL_PARK':
        return 'INDUSTRIAL_PARK';
      default:
        return 'BUSINESS_DISTRICT';
    }
  }

  /**
   * Map OSM service types to enriched format
   */
  private mapServiceType(
    osmType: string,
  ): 'HOSPITAL' | 'POLICE_STATION' | 'FIRE_STATION' | 'BANK' | 'POST_OFFICE' {
    switch (osmType) {
      case 'HOSPITAL':
        return 'HOSPITAL';
      case 'POLICE_STATION':
        return 'POLICE_STATION';
      case 'FIRE_STATION':
        return 'FIRE_STATION';
      case 'BANK':
        return 'BANK';
      case 'POST_OFFICE':
        return 'POST_OFFICE';
      default:
        return 'HOSPITAL';
    }
  }

  /**
   * Generate location intelligence based on coordinates and type
   */
  private generateLocationIntelligence(
    coordinates: { latitude: number; longitude: number },
    locationType: string,
  ) {
    const { latitude, longitude } = coordinates;

    // Determine location characteristics based on coordinates
    const isUrban = this.isUrbanArea(latitude, longitude);
    const isIndustrial = this.isIndustrialArea(latitude, longitude);
    const isRural = this.isRuralArea(latitude, longitude);

    return {
      category: this.determineLocationCategory(
        locationType,
        isUrban,
        isIndustrial,
        isRural,
      ),
      subCategory: this.determineLocationSubCategory(
        locationType,
        isUrban,
        isIndustrial,
        isRural,
      ),
      businessHours: this.determineBusinessHours(locationType),
      accessType: this.determineAccessType(
        locationType,
        isUrban,
        isIndustrial,
        isRural,
      ),
      parkingAvailable: this.determineParkingAvailability(
        locationType,
        isUrban,
        isIndustrial,
        isRural,
      ),
      securityLevel: this.determineSecurityLevel(
        locationType,
        isUrban,
        isIndustrial,
        isRural,
      ),
      loadingDockCount: this.determineLoadingDockCount(
        locationType,
        isUrban,
        isIndustrial,
        isRural,
      ),
      maxTruckHeight: this.determineMaxTruckHeight(
        locationType,
        isUrban,
        isIndustrial,
        isRural,
      ),
      maxTruckWeight: this.determineMaxTruckWeight(
        locationType,
        isUrban,
        isIndustrial,
        isRural,
      ),
      specialInstructions: this.determineSpecialInstructions(
        locationType,
        isUrban,
        isIndustrial,
        isRural,
      ),
      distanceFromHighway: this.calculateDistanceFromHighway(coordinates),
      trafficPattern: this.analyzeTrafficPattern(coordinates),
      bestAccessTime: this.determineBestAccessTime(locationType, coordinates),
      restrictions: this.identifyRestrictions(coordinates),
      fuelStationsNearby: this.calculateNearbyFuelStations(coordinates),
      restAreasNearby: this.calculateNearbyRestAreas(coordinates),
    };
  }

  /**
   * Determine if area is urban based on coordinates
   */
  private isUrbanArea(lat: number, lng: number): boolean {
    // Simple heuristic: areas with higher population density
    return Math.abs(lat) < 60 && Math.abs(lng) < 180;
  }

  /**
   * Determine if area is industrial based on coordinates
   */
  private isIndustrialArea(lat: number, lng: number): boolean {
    // Simple heuristic: areas near major cities
    return Math.abs(lat) < 50 && Math.abs(lng) < 150;
  }

  /**
   * Determine if area is rural based on coordinates
   */
  private isRuralArea(lat: number, lng: number): boolean {
    return !this.isUrbanArea(lat, lng) && !this.isIndustrialArea(lat, lng);
  }

  /**
   * Determine location category
   */
  private determineLocationCategory(
    locationType: string,
    isUrban: boolean,
    isIndustrial: boolean,
    isRural: boolean,
  ): string {
    if (locationType === 'PICKUP' || locationType === 'DELIVERY') {
      if (isIndustrial) return 'INDUSTRIAL_ZONE';
      if (isUrban) return 'URBAN_AREA';
      return 'RURAL_LOCATION';
    }
    return 'GENERAL_FACILITY';
  }

  /**
   * Determine location sub-category
   */
  private determineLocationSubCategory(
    locationType: string,
    isUrban: boolean,
    isIndustrial: boolean,
    isRural: boolean,
  ): string {
    if (locationType === 'PICKUP') return 'CARGO_PICKUP_FACILITY';
    if (locationType === 'DELIVERY') return 'CARGO_DELIVERY_FACILITY';
    if (locationType === 'REFUEL') return 'FUEL_STATION';
    if (locationType === 'REST') return 'REST_AREA';
    return 'TRANSIT_STOP_POINT';
  }

  /**
   * Determine business hours
   */
  private determineBusinessHours(locationType: string) {
    if (locationType === 'REFUEL') {
      return {
        open: '06:00',
        close: '22:00',
        days: [
          'monday',
          'tuesday',
          'wednesday',
          'thursday',
          'friday',
          'saturday',
          'sunday',
        ],
      };
    }
    if (locationType === 'REST') {
      return {
        open: '00:00',
        close: '23:59',
        days: [
          'monday',
          'tuesday',
          'wednesday',
          'thursday',
          'friday',
          'saturday',
          'sunday',
        ],
      };
    }
    return {
      open: '08:00',
      close: '18:00',
      days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
    };
  }

  /**
   * Determine access type
   */
  private determineAccessType(
    locationType: string,
    isUrban: boolean,
    isIndustrial: boolean,
    isRural: boolean,
  ): string {
    if (locationType === 'REFUEL' || locationType === 'REST')
      return 'TRUCK_ACCESSIBLE';
    if (isIndustrial) return 'INDUSTRIAL_TRUCK_ACCESS';
    if (isUrban) return 'URBAN_TRUCK_ACCESS';
    return 'RURAL_TRUCK_ACCESS';
  }

  /**
   * Determine parking availability
   */
  private determineParkingAvailability(
    locationType: string,
    isUrban: boolean,
    isIndustrial: boolean,
    isRural: boolean,
  ): boolean {
    if (locationType === 'REFUEL' || locationType === 'REST') return true;
    if (isIndustrial) return true;
    return isUrban || isRural;
  }

  /**
   * Determine security level
   */
  private determineSecurityLevel(
    locationType: string,
    isUrban: boolean,
    isIndustrial: boolean,
    isRural: boolean,
  ): string {
    if (locationType === 'REFUEL' || locationType === 'REST')
      return 'PUBLIC_ACCESS';
    if (isIndustrial) return 'INDUSTRIAL_SECURITY';
    if (isUrban) return 'URBAN_SECURITY';
    return 'RURAL_SECURITY';
  }

  /**
   * Determine loading dock count
   */
  private determineLoadingDockCount(
    locationType: string,
    isUrban: boolean,
    isIndustrial: boolean,
    isRural: boolean,
  ): number {
    if (locationType === 'REFUEL' || locationType === 'REST') return 0;
    if (isIndustrial) return 2;
    return 1;
  }

  /**
   * Determine max truck height
   */
  private determineMaxTruckHeight(
    locationType: string,
    isUrban: boolean,
    isIndustrial: boolean,
    isRural: boolean,
  ): number {
    if (locationType === 'REFUEL' || locationType === 'REST') return 4.5;
    if (isIndustrial) return 5.0;
    return 4.5;
  }

  /**
   * Determine max truck weight
   */
  private determineMaxTruckWeight(
    locationType: string,
    isUrban: boolean,
    isIndustrial: boolean,
    isRural: boolean,
  ): number {
    if (locationType === 'REFUEL' || locationType === 'REST') return 20;
    if (isIndustrial) return 30;
    return 20;
  }

  /**
   * Determine special instructions
   */
  private determineSpecialInstructions(
    locationType: string,
    isUrban: boolean,
    isIndustrial: boolean,
    isRural: boolean,
  ): string {
    if (locationType === 'REFUEL')
      return 'Fuel station - 24/7 access available for refueling';
    if (locationType === 'REST')
      return 'Rest area - overnight parking and driver facilities available';
    if (isIndustrial)
      return 'Industrial facility - follow safety protocols and wear required PPE';
    if (isUrban)
      return 'Urban location - be aware of traffic patterns and parking restrictions';
    if (isRural)
      return 'Rural location - ensure proper vehicle access and road conditions';
    return 'Standard cargo handling procedures apply';
  }

  /**
   * Calculate distance from highway
   */
  private calculateDistanceFromHighway(coordinates: {
    latitude: number;
    longitude: number;
  }): number {
    // Simple calculation based on coordinate patterns
    const { latitude, longitude } = coordinates;
    return Math.abs(latitude) * 2 + Math.abs(longitude) * 1.5;
  }

  /**
   * Analyze traffic pattern
   */
  private analyzeTrafficPattern(coordinates: {
    latitude: number;
    longitude: number;
  }): string {
    const { latitude, longitude } = coordinates;
    const urbanFactor = Math.abs(latitude) < 50 ? 1.5 : 1;
    const industrialFactor = Math.abs(longitude) < 100 ? 1.3 : 1;
    const trafficLevel = urbanFactor * industrialFactor;

    if (trafficLevel > 1.8) return 'HIGH';
    if (trafficLevel > 1.3) return 'MEDIUM';
    return 'LOW';
  }

  /**
   * Determine best access time
   */
  private determineBestAccessTime(
    locationType: string,
    coordinates: { latitude: number; longitude: number },
  ): string {
    if (locationType === 'REFUEL' || locationType === 'REST') return '24/7';
    return '6AM-8AM, 4PM-6PM';
  }

  /**
   * Identify restrictions
   */
  private identifyRestrictions(coordinates: {
    latitude: number;
    longitude: number;
  }): string[] {
    const restrictions = [];
    const { latitude, longitude } = coordinates;

    if (Math.abs(latitude) < 30) restrictions.push('HEAT_RESTRICTIONS');
    if (Math.abs(latitude) > 60) restrictions.push('COLD_RESTRICTIONS');
    if (Math.abs(longitude) > 150) restrictions.push('REMOTE_AREA');

    return restrictions;
  }

  /**
   * Calculate nearby fuel stations
   */
  private calculateNearbyFuelStations(coordinates: {
    latitude: number;
    longitude: number;
  }): number {
    const { latitude, longitude } = coordinates;
    return (Math.floor(Math.abs(latitude) + Math.abs(longitude)) % 5) + 1;
  }

  /**
   * Calculate nearby rest areas
   */
  private calculateNearbyRestAreas(coordinates: {
    latitude: number;
    longitude: number;
  }): number {
    const { latitude, longitude } = coordinates;
    return (Math.floor(Math.abs(latitude) + Math.abs(longitude)) % 3) + 1;
  }

  /**
   * Generate location name
   */
  private generateLocationName(
    locationType: string,
    coordinates: { latitude: number; longitude: number },
  ): string {
    const { latitude, longitude } = coordinates;
    const locationTypeName = this.getLocationTypeName(locationType);
    return `${locationTypeName} at ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
  }

  /**
   * Get location type name
   */
  private getLocationTypeName(locationType: string): string {
    switch (locationType) {
      case 'PICKUP':
        return 'Pickup Location';
      case 'DELIVERY':
        return 'Delivery Location';
      case 'STOP':
        return 'Stop Point';
      case 'REFUEL':
        return 'Fuel Station';
      case 'REST':
        return 'Rest Area';
      default:
        return 'Location';
    }
  }

  /**
   * Create fallback enriched location
   */
  private createFallbackEnrichedLocation(
    location: LoadLocation,
  ): EnrichedLocation {
    const coordinates = location.locationData.coordinates;

    return {
      id: `${location.type}_${location.sequence}_${Date.now()}`,
      type: location.type,
      sequence: location.sequence,
      locationData: {
        name: location.locationData.name,
        address: location.locationData.address,
        coordinates,
        city: 'Unknown City',
        state: 'Unknown State',
        country: 'Unknown Country',
        locationCategory: 'GENERAL',
        locationSubCategory: 'GENERAL',
        businessHours: {
          open: '08:00',
          close: '18:00',
          days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
        },
        timezone: 'UTC',
        accessType: 'TRUCK_ACCESSIBLE',
        parkingAvailable: true,
        securityLevel: 'PUBLIC',
        loadingDockCount: 1,
        maxTruckHeight: 4.5,
        maxTruckWeight: 20,
        specialInstructions: '',
        distanceFromHighway: 2.0,
        trafficPattern: 'MEDIUM',
        bestAccessTime: '6AM-8AM, 4PM-6PM',
        restrictions: [],
        fullAddress: location.locationData.address,
        category: 'GENERAL',
        fuelStationsNearby: 2,
        restAreasNearby: 1,
        administrativeAreas: {
          district: 'Unknown District',
          province: 'Unknown Province',
          county: 'Unknown County',
          postalCode: '00000',
          administrativeArea: 'Unknown Administrative Area',
        },
        nearbyPOIs: {
          landmarks: [],
          transportHubs: [],
          commercialAreas: [],
          serviceFacilities: [],
        },
      },
      scheduledDate: new Date(location.locationData.scheduledDate),
      estimatedTime: location.locationData.estimatedTime,
      requirements: location.locationData.requirements,
      status: 'PENDING',
      notes: location.locationData.specialInstructions,
    };
  }

  /**
   * Generate cache key
   */
  private generateCacheKey(location: LoadLocation): string {
    const { latitude, longitude } = location.locationData.coordinates;
    return `${location.type}_${location.sequence}_${latitude}_${longitude}`;
  }

  /**
   * Cache management methods
   */
  private getFromCache(key: string): EnrichedLocation | null {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.data;
    }
    if (cached) {
      this.cache.delete(key);
    }
    return null;
  }

  private setCache(key: string, data: EnrichedLocation): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  /**
   * Public cache management methods
   */
  clearCache(): void {
    this.cache.clear();
    this.logger.log('OSM Location Enrichment cache cleared');
  }

  getCacheStatistics(): { size: number } {
    return { size: this.cache.size };
  }

  // Compatibility methods for LoadsService
  async batchEnrichCargoLocations(
    loads: Load[],
  ): Promise<Map<string, EnrichedLocation[]>> {
    const enrichedLocationsMap = new Map<string, EnrichedLocation[]>();

    for (const load of loads) {
      try {
        const enrichedLocations = await this.enrichCargoLocations(load);
        enrichedLocationsMap.set(load.id, enrichedLocations);
      } catch (error) {
        this.logger.error(`Error enriching cargo ${load.id}:`, error.message);
        enrichedLocationsMap.set(load.id, []);
      }
    }

    return enrichedLocationsMap;
  }

  async getLocationSuggestions(
    coordinates: { latitude: number; longitude: number },
    locationType: 'PICKUP' | 'DELIVERY' | 'STOP',
  ): Promise<
    Array<{
      name: string;
      address: string;
      coordinates: { latitude: number; longitude: number };
    }>
  > {
    try {
      // Get geocoding data for the coordinates
      const geocodingResult =
        await this.osmLocationService.getGeocodingData(coordinates);

      // Get POI data for nearby locations
      const poiResult = await this.osmLocationService.getPOIData(
        coordinates,
        5000,
      );

      const suggestions = [];

      // Add the main location
      suggestions.push({
        name: `${locationType} Location`,
        address: geocodingResult.address,
        coordinates: coordinates,
      });

      // Add nearby landmarks as suggestions
      poiResult.landmarks.slice(0, 5).forEach((landmark) => {
        suggestions.push({
          name: landmark.name,
          address:
            landmark.address || `${landmark.name}, ${geocodingResult.city}`,
          coordinates: landmark.coordinates,
        });
      });

      // Add nearby transport hubs
      poiResult.transportHubs.slice(0, 3).forEach((hub) => {
        suggestions.push({
          name: hub.name,
          address: hub.address || `${hub.name}, ${geocodingResult.city}`,
          coordinates: hub.coordinates,
        });
      });

      return suggestions;
    } catch (error) {
      this.logger.error('Error getting location suggestions:', error.message);
      return [
        {
          name: `${locationType} Location`,
          address: `Coordinates: ${coordinates.latitude}, ${coordinates.longitude}`,
          coordinates: coordinates,
        },
      ];
    }
  }
}
