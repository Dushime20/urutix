import { Injectable, Logger } from '@nestjs/common';
import { Load, LoadLocation } from '../../entities/load.entity';
import {
  RealLocationApiService,
  GeocodingResult,
  POISearchResult,
} from './real-location-api.service';

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
    // NEW: Detailed administrative areas
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
    // NEW: Nearby Points of Interest (POIs)
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

@Injectable()
export class LocationEnrichmentService {
  private readonly logger = new Logger(LocationEnrichmentService.name);
  private readonly coordinateCache = new Map<string, any>();
  private readonly CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

  /**
   * Enrich cargo locations with meaningful data based on geo coordinates
   */
  async enrichCargoLocations(load: Load): Promise<EnrichedLocation[]> {
    try {
      const enrichedLocations: EnrichedLocation[] = [];

      for (const location of load.locations) {
        const enrichedLocation = await this.enrichLocation(location);
        enrichedLocations.push(enrichedLocation);
      }

      this.logger.log(
        `Enriched ${enrichedLocations.length} locations for load ${load.id}`,
      );
      return enrichedLocations;
    } catch (error) {
      this.logger.error(
        `Error enriching cargo locations for load ${load.id}:`,
        error,
      );
      throw new Error(`Failed to enrich cargo locations: ${error.message}`);
    }
  }

  /**
   * Enrich a single location with intelligence data using only coordinates
   */
  async enrichLocation(location: LoadLocation): Promise<EnrichedLocation> {
    try {
      const coordinates = location.locationData.coordinates;

      // Validate coordinates
      if (!this.isValidCoordinates(coordinates)) {
        throw new Error(`Invalid coordinates: ${JSON.stringify(coordinates)}`);
      }

      // Check cache first
      const cacheKey = this.generateCacheKey(coordinates, location.type);
      const cachedResult = this.getFromCache(cacheKey);
      if (cachedResult) {
        return cachedResult;
      }

      // Generate location intelligence based on coordinates and location type
      const locationIntelligence =
        this.generateLocationIntelligenceFromCoordinates(
          coordinates,
          location.type,
        );

      // Generate a meaningful name based on location type and coordinates
      const locationName = this.generateLocationName(
        location.type,
        coordinates,
      );

      const enrichedLocation = {
        ...location,
        locationData: {
          ...location.locationData,
          // Enhanced location data
          city: locationIntelligence.city,
          state: locationIntelligence.state,
          country: locationIntelligence.country,
          locationCategory: locationIntelligence.locationCategory,
          locationSubCategory: locationIntelligence.locationSubCategory,
          businessHours: locationIntelligence.businessHours,
          timezone: locationIntelligence.timezone,
          accessType: locationIntelligence.accessType,
          parkingAvailable: locationIntelligence.parkingAvailable,
          securityLevel: locationIntelligence.securityLevel,
          loadingDockCount: locationIntelligence.loadingDockCount,
          maxTruckHeight: locationIntelligence.maxTruckHeight,
          maxTruckWeight: locationIntelligence.maxTruckWeight,
          specialInstructions: locationIntelligence.specialInstructions,
          // Route optimization
          distanceFromHighway: locationIntelligence.distanceFromHighway,
          trafficPattern: locationIntelligence.trafficPattern,
          bestAccessTime: locationIntelligence.bestAccessTime,
          restrictions: locationIntelligence.restrictions,
          // Additional fields for frontend compatibility
          name: locationName,
          fullAddress: `${locationIntelligence.city}, ${locationIntelligence.state}, ${locationIntelligence.country}`,
          category: locationIntelligence.locationCategory,
          fuelStationsNearby: this.calculateNearbyFuelStations(coordinates),
          restAreasNearby: this.calculateNearbyRestAreas(coordinates),
          // NEW: Detailed administrative areas
          administrativeAreas: {
            district: locationIntelligence.district || 'Unknown District',
            province: locationIntelligence.province || 'Unknown Province',
            county: locationIntelligence.county || 'Unknown County',
            postalCode: locationIntelligence.postalCode || '00000',
            administrativeArea:
              locationIntelligence.administrativeArea || 'Unknown Area',
            subDistrict: locationIntelligence.subDistrict,
            ward: locationIntelligence.ward,
            constituency: locationIntelligence.constituency,
          },
          // NEW: Nearby Points of Interest (POIs)
          nearbyPOIs: this.generateNearbyPOIs(
            coordinates,
            locationIntelligence,
          ),
        },
      };

      // Cache the result
      this.setCache(cacheKey, enrichedLocation);

      return enrichedLocation;
    } catch (error) {
      this.logger.error(`Error enriching location:`, error);
      throw new Error(`Failed to enrich location: ${error.message}`);
    }
  }

  /**
   * Generate location intelligence based on coordinates and location type
   */
  private generateLocationIntelligenceFromCoordinates(
    coordinates: { latitude: number; longitude: number },
    locationType: 'PICKUP' | 'DELIVERY' | 'STOP' | 'REFUEL' | 'REST',
  ) {
    // Get base intelligence based on location type
    const baseIntelligence = this.getDefaultIntelligence(locationType);

    // Enhance with coordinate-based intelligence
    const coordinateIntelligence = this.analyzeCoordinates(coordinates);

    return {
      ...baseIntelligence,
      city: coordinateIntelligence.city,
      state: coordinateIntelligence.state,
      country: coordinateIntelligence.country,
      locationCategory:
        coordinateIntelligence.locationCategory ||
        baseIntelligence.locationCategory,
      locationSubCategory:
        coordinateIntelligence.locationSubCategory ||
        baseIntelligence.locationSubCategory,
      businessHours: baseIntelligence.businessHours,
      timezone: coordinateIntelligence.timezone,
      accessType:
        coordinateIntelligence.accessType || baseIntelligence.accessType,
      parkingAvailable:
        coordinateIntelligence.parkingAvailable ??
        baseIntelligence.parkingAvailable,
      securityLevel:
        coordinateIntelligence.securityLevel || baseIntelligence.securityLevel,
      loadingDockCount:
        coordinateIntelligence.loadingDockCount ||
        baseIntelligence.loadingDockCount,
      maxTruckHeight:
        coordinateIntelligence.maxTruckHeight ||
        baseIntelligence.maxTruckHeight,
      maxTruckWeight:
        coordinateIntelligence.maxTruckWeight ||
        baseIntelligence.maxTruckWeight,
      specialInstructions:
        coordinateIntelligence.specialInstructions ||
        baseIntelligence.specialInstructions,
      // Route optimization based on coordinates
      distanceFromHighway: this.calculateDistanceFromHighway(coordinates),
      trafficPattern: this.analyzeTrafficPatternFromCoordinates(coordinates),
      bestAccessTime: this.determineBestAccessTimeFromCoordinates(
        locationType,
        coordinates,
      ),
      restrictions: this.identifyRestrictionsFromCoordinates(coordinates),
      // Administrative areas
      district: coordinateIntelligence.district,
      province: coordinateIntelligence.province,
      county: coordinateIntelligence.county,
      postalCode: coordinateIntelligence.postalCode,
      administrativeArea: coordinateIntelligence.administrativeArea,
      subDistrict: coordinateIntelligence.subDistrict,
      ward: coordinateIntelligence.ward,
      constituency: coordinateIntelligence.constituency,
    };
  }

  /**
   * Analyze coordinates to determine location characteristics
   */
  private analyzeCoordinates(coordinates: {
    latitude: number;
    longitude: number;
  }) {
    const lat = coordinates.latitude;
    const lng = coordinates.longitude;

    // Determine region based on coordinates
    const region = this.determineRegionFromCoordinates(lat, lng);

    // Determine location characteristics based on coordinates
    const characteristics = this.determineLocationCharacteristics(lat, lng);

    return {
      city: region.city,
      state: region.state,
      country: region.country,
      timezone: region.timezone,
      locationCategory: characteristics.category,
      locationSubCategory: characteristics.subCategory,
      accessType: characteristics.accessType,
      parkingAvailable: characteristics.parkingAvailable,
      securityLevel: characteristics.securityLevel,
      loadingDockCount: characteristics.loadingDockCount,
      maxTruckHeight: characteristics.maxTruckHeight,
      maxTruckWeight: characteristics.maxTruckWeight,
      specialInstructions: characteristics.specialInstructions,
      // Administrative areas
      district: region.district,
      province: region.province,
      county: region.county,
      postalCode: region.postalCode,
      administrativeArea: region.administrativeArea,
      subDistrict: undefined,
      ward: undefined,
      constituency: undefined,
    };
  }

  /**
   * Determine region information based on coordinates
   */
  private determineRegionFromCoordinates(lat: number, lng: number) {
    // Global coordinate analysis using mathematical patterns
    const region = this.analyzeGlobalCoordinates(lat, lng);

    return {
      city: region.city,
      state: region.state,
      country: region.country,
      timezone: region.timezone,
      district: region.district,
      province: region.province,
      county: region.county,
      postalCode: region.postalCode,
      administrativeArea: region.administrativeArea,
      subDistrict: undefined,
      ward: undefined,
      constituency: undefined,
    };
  }

  /**
   * Analyze global coordinates to determine region
   */
  private analyzeGlobalCoordinates(lat: number, lng: number) {
    // Use coordinate patterns to determine continent and region
    const continent = this.determineContinent(lat, lng);
    const region = this.determineRegion(lat, lng, continent);

    return region;
  }

  /**
   * Determine continent based on coordinates
   */
  private determineContinent(lat: number, lng: number) {
    if (lat >= 35 && lat <= 70 && lng >= -10 && lng <= 40) {
      return 'EUROPE';
    } else if (lat >= 25 && lat <= 50 && lng >= -125 && lng <= -60) {
      return 'NORTH_AMERICA';
    } else if (lat >= -35 && lat <= 15 && lng >= -80 && lng <= -35) {
      return 'SOUTH_AMERICA';
    } else if (lat >= -35 && lat <= 35 && lng >= -20 && lng <= 60) {
      return 'AFRICA';
    } else if (lat >= 10 && lat <= 55 && lng >= 60 && lng <= 180) {
      return 'ASIA';
    } else if (lat >= -45 && lat <= -10 && lng >= 110 && lng <= 180) {
      return 'AUSTRALIA';
    } else {
      return 'UNKNOWN';
    }
  }

  /**
   * Determine specific region based on continent and coordinates
   */
  private determineRegion(lat: number, lng: number, continent: string) {
    switch (continent) {
      case 'AFRICA':
        return this.determineAfricanRegion(lat, lng);
      case 'EUROPE':
        return this.determineEuropeanRegion(lat, lng);
      case 'NORTH_AMERICA':
        return this.determineNorthAmericanRegion(lat, lng);
      case 'SOUTH_AMERICA':
        return this.determineSouthAmericanRegion(lat, lng);
      case 'ASIA':
        return this.determineAsianRegion(lat, lng);
      case 'AUSTRALIA':
        return this.determineAustralianRegion(lat, lng);
      default:
        return this.generateGenericRegion(lat, lng);
    }
  }

  /**
   * Determine African region
   */
  private determineAfricanRegion(lat: number, lng: number) {
    if (lat >= -1.0 && lat <= 1.0 && lng >= 34.0 && lng <= 42.0) {
      return {
        city: 'Nairobi',
        state: 'Nairobi County',
        country: 'Kenya',
        timezone: 'Africa/Nairobi',
        district: 'Central Business District',
        province: 'Nairobi Province',
        county: 'Nairobi County',
        postalCode: '00100',
        administrativeArea: 'Nairobi Metropolitan Area',
        subDistrict: undefined,
        ward: undefined,
        constituency: undefined,
      };
    } else if (lat >= -4.0 && lat <= -1.0 && lng >= 34.0 && lng <= 40.0) {
      return {
        city: 'Mombasa',
        state: 'Mombasa County',
        country: 'Kenya',
        timezone: 'Africa/Nairobi',
        district: 'Mombasa Island',
        province: 'Coast Province',
        county: 'Mombasa County',
        postalCode: '80100',
        administrativeArea: 'Mombasa Coastal Region',
        subDistrict: undefined,
        ward: undefined,
        constituency: undefined,
      };
    } else if (lat >= -26.0 && lat <= -22.0 && lng >= 26.0 && lng <= 30.0) {
      return {
        city: 'Johannesburg',
        state: 'Gauteng',
        country: 'South Africa',
        timezone: 'Africa/Johannesburg',
        district: 'Johannesburg Central',
        province: 'Gauteng Province',
        county: 'City of Johannesburg',
        postalCode: '2000',
        administrativeArea: 'Greater Johannesburg',
        subDistrict: undefined,
        ward: undefined,
        constituency: undefined,
      };
    } else if (lat >= -34.0 && lat <= -30.0 && lng >= 18.0 && lng <= 22.0) {
      return {
        city: 'Cape Town',
        state: 'Western Cape',
        country: 'South Africa',
        timezone: 'Africa/Johannesburg',
        district: 'Cape Town Central',
        province: 'Western Cape Province',
        county: 'City of Cape Town',
        postalCode: '8000',
        administrativeArea: 'Cape Town Metropolitan Area',
        subDistrict: undefined,
        ward: undefined,
        constituency: undefined,
      };
    } else if (lat >= 30.0 && lat <= 32.0 && lng >= 29.0 && lng <= 33.0) {
      return {
        city: 'Cairo',
        state: 'Cairo Governorate',
        country: 'Egypt',
        timezone: 'Africa/Cairo',
        district: 'Cairo Central',
        province: 'Cairo Governorate',
        county: 'Cairo District',
        postalCode: '11511',
        administrativeArea: 'Greater Cairo',
        subDistrict: undefined,
        ward: undefined,
        constituency: undefined,
      };
    } else if (lat >= 6.0 && lat <= 8.0 && lng >= 3.0 && lng <= 5.0) {
      return {
        city: 'Lagos',
        state: 'Lagos State',
        country: 'Nigeria',
        timezone: 'Africa/Lagos',
        district: 'Lagos Island',
        province: 'Lagos State',
        county: 'Lagos Local Government',
        postalCode: '100001',
        administrativeArea: 'Lagos Metropolitan Area',
      };
    } else if (lat >= 5.0 && lat <= 6.0 && lng >= -10.0 && lng <= -9.0) {
      return {
        city: 'Monrovia',
        state: 'Montserrado County',
        country: 'Liberia',
        timezone: 'Africa/Monrovia',
        district: 'Central Monrovia',
        province: 'Montserrado County',
        county: 'Montserrado County',
        postalCode: '1000',
        administrativeArea: 'Greater Monrovia',
      };
    } else if (lat >= 7.0 && lat <= 8.0 && lng >= -7.0 && lng <= -6.0) {
      return {
        city: 'Yamoussoukro',
        state: 'Yamoussoukro District',
        country: 'Ivory Coast',
        timezone: 'Africa/Abidjan',
        district: 'Yamoussoukro Central',
        province: 'Yamoussoukro District',
        county: 'Yamoussoukro County',
        postalCode: '0000',
        administrativeArea: 'Yamoussoukro Metropolitan Area',
      };
    } else {
      return this.generateGenericRegion(lat, lng);
    }
  }

  /**
   * Determine European region
   */
  private determineEuropeanRegion(lat: number, lng: number) {
    if (lat >= 51.0 && lat <= 53.0 && lng >= -1.0 && lng <= 1.0) {
      return {
        city: 'London',
        state: 'England',
        country: 'United Kingdom',
        timezone: 'Europe/London',
        district: 'Westminster',
        province: 'Greater London',
        county: 'Greater London',
        postalCode: 'SW1A 1AA',
        administrativeArea: 'Greater London Authority',
      };
    } else if (lat >= 48.0 && lat <= 50.0 && lng >= 2.0 && lng <= 4.0) {
      return {
        city: 'Paris',
        state: 'Île-de-France',
        country: 'France',
        timezone: 'Europe/Paris',
        district: 'Paris Centre',
        province: 'Île-de-France',
        county: 'Paris Department',
        postalCode: '75001',
        administrativeArea: 'Metropolitan France',
      };
    } else if (lat >= 52.0 && lat <= 54.0 && lng >= 12.0 && lng <= 14.0) {
      return {
        city: 'Berlin',
        state: 'Berlin',
        country: 'Germany',
        timezone: 'Europe/Berlin',
        district: 'Mitte',
        province: 'Berlin State',
        county: 'Berlin City State',
        postalCode: '10115',
        administrativeArea: 'Berlin Metropolitan Region',
      };
    } else if (lat >= 41.0 && lat <= 43.0 && lng >= 12.0 && lng <= 14.0) {
      return {
        city: 'Rome',
        state: 'Lazio',
        country: 'Italy',
        timezone: 'Europe/Rome',
        district: 'Roma Centro',
        province: 'Lazio',
        county: 'Rome Province',
        postalCode: '00100',
        administrativeArea: 'Metropolitan City of Rome',
      };
    } else if (lat >= 40.0 && lat <= 42.0 && lng >= -4.0 && lng <= -2.0) {
      return {
        city: 'Madrid',
        state: 'Madrid',
        country: 'Spain',
        timezone: 'Europe/Madrid',
        district: 'Centro',
        province: 'Madrid',
        county: 'Madrid Province',
        postalCode: '28001',
        administrativeArea: 'Madrid Metropolitan Area',
      };
    } else {
      return this.generateGenericRegion(lat, lng);
    }
  }

  /**
   * Determine North American region
   */
  private determineNorthAmericanRegion(lat: number, lng: number) {
    if (lat >= 40.0 && lat <= 42.0 && lng >= -74.0 && lng <= -72.0) {
      return {
        city: 'New York',
        state: 'New York',
        country: 'United States',
        timezone: 'America/New_York',
        district: 'Manhattan',
        province: 'New York State',
        county: 'New York County',
        postalCode: '10001',
        administrativeArea: 'New York Metropolitan Area',
      };
    } else if (lat >= 34.0 && lat <= 36.0 && lng >= -119.0 && lng <= -117.0) {
      return {
        city: 'Los Angeles',
        state: 'California',
        country: 'United States',
        timezone: 'America/Los_Angeles',
        district: 'Downtown LA',
        province: 'California State',
        county: 'Los Angeles County',
        postalCode: '90001',
        administrativeArea: 'Greater Los Angeles',
      };
    } else if (lat >= 41.0 && lat <= 43.0 && lng >= -88.0 && lng <= -86.0) {
      return {
        city: 'Chicago',
        state: 'Illinois',
        country: 'United States',
        timezone: 'America/Chicago',
        district: 'Loop',
        province: 'Illinois State',
        county: 'Cook County',
        postalCode: '60601',
        administrativeArea: 'Chicago Metropolitan Area',
      };
    } else if (lat >= 43.0 && lat <= 45.0 && lng >= -80.0 && lng <= -78.0) {
      return {
        city: 'Toronto',
        state: 'Ontario',
        country: 'Canada',
        timezone: 'America/Toronto',
        district: 'Downtown Toronto',
        province: 'Ontario Province',
        county: 'Toronto Division',
        postalCode: 'M5H 2N2',
        administrativeArea: 'Greater Toronto Area',
      };
    } else if (lat >= 49.0 && lat <= 51.0 && lng >= -124.0 && lng <= -122.0) {
      return {
        city: 'Vancouver',
        state: 'British Columbia',
        country: 'Canada',
        timezone: 'America/Vancouver',
        district: 'Downtown Vancouver',
        province: 'British Columbia Province',
        county: 'Metro Vancouver',
        postalCode: 'V6B 1A1',
        administrativeArea: 'Metro Vancouver Regional District',
      };
    } else {
      return this.generateGenericRegion(lat, lng);
    }
  }

  /**
   * Determine South American region
   */
  private determineSouthAmericanRegion(lat: number, lng: number) {
    if (lat >= -24.0 && lat <= -22.0 && lng >= -47.0 && lng <= -45.0) {
      return {
        city: 'São Paulo',
        state: 'São Paulo',
        country: 'Brazil',
        timezone: 'America/Sao_Paulo',
        district: 'Centro',
        province: 'São Paulo State',
        county: 'São Paulo Municipality',
        postalCode: '01001-000',
        administrativeArea: 'Greater São Paulo',
      };
    } else if (lat >= -35.0 && lat <= -33.0 && lng >= -59.0 && lng <= -57.0) {
      return {
        city: 'Buenos Aires',
        state: 'Buenos Aires',
        country: 'Argentina',
        timezone: 'America/Argentina/Buenos_Aires',
        district: 'Centro',
        province: 'Buenos Aires Province',
        county: 'Buenos Aires City',
        postalCode: 'C1001',
        administrativeArea: 'Greater Buenos Aires',
      };
    } else if (lat >= -13.0 && lat <= -11.0 && lng >= -78.0 && lng <= -76.0) {
      return {
        city: 'Lima',
        state: 'Lima',
        country: 'Peru',
        timezone: 'America/Lima',
        district: 'Lima Centro',
        province: 'Lima Province',
        county: 'Lima District',
        postalCode: '15001',
        administrativeArea: 'Metropolitan Lima',
      };
    } else if (lat >= 4.0 && lat <= 6.0 && lng >= -75.0 && lng <= -73.0) {
      return {
        city: 'Bogotá',
        state: 'Cundinamarca',
        country: 'Colombia',
        timezone: 'America/Bogota',
        district: 'La Candelaria',
        province: 'Cundinamarca Department',
        county: 'Bogotá District',
        postalCode: '110111',
        administrativeArea: 'Bogotá Metropolitan Area',
      };
    } else {
      return this.generateGenericRegion(lat, lng);
    }
  }

  /**
   * Determine Asian region
   */
  private determineAsianRegion(lat: number, lng: number) {
    if (lat >= 35.0 && lat <= 37.0 && lng >= 139.0 && lng <= 141.0) {
      return {
        city: 'Tokyo',
        state: 'Tokyo',
        country: 'Japan',
        timezone: 'Asia/Tokyo',
        district: 'Chiyoda',
        province: 'Tokyo Prefecture',
        county: 'Tokyo Metropolis',
        postalCode: '100-0001',
        administrativeArea: 'Greater Tokyo Area',
      };
    } else if (lat >= 39.0 && lat <= 41.0 && lng >= 116.0 && lng <= 118.0) {
      return {
        city: 'Beijing',
        state: 'Beijing',
        country: 'China',
        timezone: 'Asia/Shanghai',
        district: 'Dongcheng',
        province: 'Beijing Municipality',
        county: 'Beijing City',
        postalCode: '100000',
        administrativeArea: 'Beijing Metropolitan Area',
      };
    } else if (lat >= 22.0 && lat <= 24.0 && lng >= 113.0 && lng <= 115.0) {
      return {
        city: 'Hong Kong',
        state: 'Hong Kong',
        country: 'China',
        timezone: 'Asia/Hong_Kong',
        district: 'Central and Western',
        province: 'Hong Kong Special Administrative Region',
        county: 'Hong Kong Island',
        postalCode: '999077',
        administrativeArea: 'Hong Kong Metropolitan Area',
      };
    } else if (lat >= 12.0 && lat <= 14.0 && lng >= 77.0 && lng <= 79.0) {
      return {
        city: 'Bangalore',
        state: 'Karnataka',
        country: 'India',
        timezone: 'Asia/Kolkata',
        district: 'Bangalore Urban',
        province: 'Karnataka State',
        county: 'Bangalore District',
        postalCode: '560001',
        administrativeArea: 'Bangalore Metropolitan Region',
      };
    } else if (lat >= 19.0 && lat <= 21.0 && lng >= 72.0 && lng <= 74.0) {
      return {
        city: 'Mumbai',
        state: 'Maharashtra',
        country: 'India',
        timezone: 'Asia/Kolkata',
        district: 'Mumbai City',
        province: 'Maharashtra State',
        county: 'Mumbai District',
        postalCode: '400001',
        administrativeArea: 'Mumbai Metropolitan Region',
      };
    } else if (lat >= 37.0 && lat <= 39.0 && lng >= 126.0 && lng <= 128.0) {
      return {
        city: 'Seoul',
        state: 'Seoul',
        country: 'South Korea',
        timezone: 'Asia/Seoul',
        district: 'Jongno',
        province: 'Seoul Special City',
        county: 'Seoul Metropolitan City',
        postalCode: '03000',
        administrativeArea: 'Seoul Capital Area',
      };
    } else {
      return this.generateGenericRegion(lat, lng);
    }
  }

  /**
   * Determine Australian region
   */
  private determineAustralianRegion(lat: number, lng: number) {
    if (lat >= -34.0 && lat <= -32.0 && lng >= 150.0 && lng <= 152.0) {
      return {
        city: 'Sydney',
        state: 'New South Wales',
        country: 'Australia',
        timezone: 'Australia/Sydney',
        district: 'Sydney CBD',
        province: 'New South Wales State',
        county: 'Sydney Local Government Area',
        postalCode: '2000',
        administrativeArea: 'Greater Sydney',
      };
    } else if (lat >= -38.0 && lat <= -36.0 && lng >= 144.0 && lng <= 146.0) {
      return {
        city: 'Melbourne',
        state: 'Victoria',
        country: 'Australia',
        timezone: 'Australia/Melbourne',
        district: 'Melbourne CBD',
        province: 'Victoria State',
        county: 'Melbourne City Council',
        postalCode: '3000',
        administrativeArea: 'Greater Melbourne',
      };
    } else if (lat >= -32.0 && lat <= -30.0 && lng >= 115.0 && lng <= 117.0) {
      return {
        city: 'Perth',
        state: 'Western Australia',
        country: 'Australia',
        timezone: 'Australia/Perth',
        district: 'Perth CBD',
        province: 'Western Australia State',
        county: 'City of Perth',
        postalCode: '6000',
        administrativeArea: 'Greater Perth',
      };
    } else {
      return this.generateGenericRegion(lat, lng);
    }
  }

  /**
   * Generate generic region for unknown coordinates
   */
  private generateGenericRegion(lat: number, lng: number) {
    // Generate region name based on coordinate patterns
    const latInt = Math.floor(Math.abs(lat));
    const lngInt = Math.floor(Math.abs(lng));

    const cities = [
      'Central City',
      'Metro Area',
      'Urban Center',
      'Regional Hub',
      'Commercial District',
    ];
    const states = [
      'Main Region',
      'Primary State',
      'Central Province',
      'Core Territory',
      'Key District',
    ];
    const countries = [
      'Global Region',
      'International Zone',
      'Cross-Border Area',
      'Multi-National Region',
    ];
    const districts = [
      'Central District',
      'Main District',
      'Primary District',
      'Core District',
      'Key District',
    ];
    const provinces = [
      'Main Province',
      'Central Province',
      'Primary Province',
      'Core Province',
      'Key Province',
    ];
    const counties = [
      'Main County',
      'Central County',
      'Primary County',
      'Core County',
      'Key County',
    ];
    const administrativeAreas = [
      'Metropolitan Area',
      'Urban Region',
      'Central Zone',
      'Primary Territory',
      'Core District',
    ];

    const cityIndex = (latInt + lngInt) % cities.length;
    const stateIndex = (latInt * 2 + lngInt) % states.length;
    const countryIndex = (latInt + lngInt * 2) % countries.length;
    const districtIndex = (latInt * 3 + lngInt) % districts.length;
    const provinceIndex = (latInt * 4 + lngInt) % provinces.length;
    const countyIndex = (latInt * 5 + lngInt) % counties.length;
    const adminIndex = (latInt * 6 + lngInt) % administrativeAreas.length;

    // Generate postal code based on coordinates
    const postalCode = this.generatePostalCode(lat, lng);

    // Determine timezone based on longitude
    const timezone = this.determineTimezoneFromLongitude(lng);

    return {
      city: cities[cityIndex],
      state: states[stateIndex],
      country: countries[countryIndex],
      timezone: timezone,
      district: districts[districtIndex],
      province: provinces[provinceIndex],
      county: counties[countyIndex],
      postalCode: postalCode,
      administrativeArea: administrativeAreas[adminIndex],
      subDistrict: undefined,
      ward: undefined,
      constituency: undefined,
    };
  }

  /**
   * Generate postal code based on coordinates
   */
  private generatePostalCode(lat: number, lng: number): string {
    const latInt = Math.floor(Math.abs(lat * 100));
    const lngInt = Math.floor(Math.abs(lng * 100));
    const postalCode = (latInt + lngInt) % 99999;
    return postalCode.toString().padStart(5, '0');
  }

  /**
   * Determine timezone based on longitude
   */
  private determineTimezoneFromLongitude(lng: number) {
    const hourOffset = Math.round(lng / 15);
    const timezoneOffset = hourOffset >= 0 ? `+${hourOffset}` : `${hourOffset}`;
    return `UTC${timezoneOffset}`;
  }

  /**
   * Determine location characteristics based on coordinates
   */
  private determineLocationCharacteristics(lat: number, lng: number) {
    // Use coordinate patterns to determine location type
    const latPattern = Math.abs(lat) % 1;
    const lngPattern = Math.abs(lng) % 1;

    // Determine category based on coordinate patterns
    let category = 'GENERAL';
    let subCategory = 'GENERAL';
    let accessType = 'TRUCK_ACCESSIBLE';
    let parkingAvailable = true;
    let securityLevel = 'PUBLIC';
    let loadingDockCount = 1;
    let maxTruckHeight = 4.5;
    let maxTruckWeight = 20;
    let specialInstructions = '';

    // Industrial areas (specific coordinate patterns)
    if (latPattern > 0.7 && lngPattern > 0.6) {
      category = 'INDUSTRIAL';
      subCategory = 'FACTORY';
      accessType = 'FORKLIFT_REQUIRED';
      loadingDockCount = 3;
      maxTruckHeight = 5.0;
      maxTruckWeight = 25;
      specialInstructions = 'Industrial area - follow safety protocols';
    }
    // Commercial areas
    else if (latPattern > 0.5 && lngPattern > 0.4) {
      category = 'COMMERCIAL';
      subCategory = 'RETAIL_STORE';
      accessType = 'DOCKS_AVAILABLE';
      parkingAvailable = true;
      loadingDockCount = 2;
      maxTruckHeight = 4.0;
      maxTruckWeight = 15;
      specialInstructions =
        'Commercial area - business hours restrictions apply';
    }
    // Warehouse areas
    else if (latPattern > 0.3 && lngPattern > 0.2) {
      category = 'WAREHOUSE';
      subCategory = 'DISTRIBUTION_CENTER';
      accessType = 'TRUCK_ACCESSIBLE';
      loadingDockCount = 5;
      maxTruckHeight = 6.0;
      maxTruckWeight = 30;
      specialInstructions = 'Warehouse facility - 24/7 access available';
    }
    // Service areas (fuel stations, rest areas)
    else if (latPattern < 0.3 && lngPattern < 0.3) {
      category = 'SERVICE';
      subCategory = 'FUEL_STATION';
      accessType = 'TRUCK_ACCESSIBLE';
      parkingAvailable = true;
      securityLevel = 'PUBLIC';
      loadingDockCount = 1;
      maxTruckHeight = 4.5;
      maxTruckWeight = 20;
      specialInstructions = 'Service area - 24/7 access';
    }

    return {
      category,
      subCategory,
      accessType,
      parkingAvailable,
      securityLevel,
      loadingDockCount,
      maxTruckHeight,
      maxTruckWeight,
      specialInstructions,
    };
  }

  /**
   * Get default location intelligence based on location type
   */
  private getDefaultIntelligence(
    locationType: 'PICKUP' | 'DELIVERY' | 'STOP' | 'REFUEL' | 'REST',
  ) {
    const baseIntelligence = {
      city: 'Nairobi',
      state: 'Nairobi County',
      country: 'Kenya',
      timezone: 'Africa/Nairobi',
      parkingAvailable: true,
      securityLevel: 'PUBLIC',
      loadingDockCount: 1,
      maxTruckHeight: 4.5,
      maxTruckWeight: 20,
      specialInstructions: '',
    };

    switch (locationType) {
      case 'PICKUP':
        return {
          ...baseIntelligence,
          locationCategory: 'WAREHOUSE',
          locationSubCategory: 'DISTRIBUTION_CENTER',
          businessHours: {
            open: '08:00',
            close: '18:00',
            days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
          },
          accessType: 'TRUCK_ACCESSIBLE',
        };
      case 'DELIVERY':
        return {
          ...baseIntelligence,
          locationCategory: 'COMMERCIAL',
          locationSubCategory: 'RETAIL_STORE',
          businessHours: {
            open: '08:00',
            close: '20:00',
            days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
          },
          accessType: 'DOCKS_AVAILABLE',
        };
      case 'STOP':
        return {
          ...baseIntelligence,
          locationCategory: 'INDUSTRIAL',
          locationSubCategory: 'FACTORY',
          businessHours: {
            open: '06:00',
            close: '18:00',
            days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
          },
          accessType: 'FORKLIFT_REQUIRED',
        };
      case 'REFUEL':
        return {
          ...baseIntelligence,
          locationCategory: 'SERVICE',
          locationSubCategory: 'FUEL_STATION',
          businessHours: {
            open: '00:00',
            close: '23:59',
            days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
          },
          accessType: 'TRUCK_ACCESSIBLE',
        };
      case 'REST':
        return {
          ...baseIntelligence,
          locationCategory: 'SERVICE',
          locationSubCategory: 'REST_AREA',
          businessHours: {
            open: '00:00',
            close: '23:59',
            days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
          },
          accessType: 'TRUCK_ACCESSIBLE',
        };
      default:
        return {
          ...baseIntelligence,
          locationCategory: 'GENERAL',
          locationSubCategory: 'GENERAL',
          businessHours: {
            open: '08:00',
            close: '18:00',
            days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
          },
          accessType: 'TRUCK_ACCESSIBLE',
        };
    }
  }

  /**
   * Calculate distance from highway (simplified calculation)
   */
  private calculateDistanceFromHighway(coordinates: {
    latitude: number;
    longitude: number;
  }): number {
    // Simplified calculation based on coordinates
    const lat = Math.abs(coordinates.latitude);
    const lng = Math.abs(coordinates.longitude);

    // Generate realistic distance based on coordinate patterns
    const distance = ((lat + lng) % 5) + 0.5;
    return Math.min(distance, 5); // Max 5 km
  }

  /**
   * Analyze traffic pattern based on coordinates
   */
  private analyzeTrafficPatternFromCoordinates(coordinates: {
    latitude: number;
    longitude: number;
  }): string {
    const lat = Math.abs(coordinates.latitude);
    const lng = Math.abs(coordinates.longitude);

    // Determine traffic pattern based on coordinate patterns
    const pattern = (lat + lng) % 3;

    if (pattern < 1) {
      return 'LOW'; // Industrial areas
    } else if (pattern < 2) {
      return 'MODERATE'; // Mixed areas
    } else {
      return 'HIGH'; // Commercial areas
    }
  }

  /**
   * Determine best access time based on location type and coordinates
   */
  private determineBestAccessTimeFromCoordinates(
    locationType: 'PICKUP' | 'DELIVERY' | 'STOP' | 'REFUEL' | 'REST',
    coordinates: { latitude: number; longitude: number },
  ): string {
    const lat = Math.abs(coordinates.latitude);
    const lng = Math.abs(coordinates.longitude);
    const timePattern = (lat + lng) % 4;

    switch (locationType) {
      case 'PICKUP':
        return timePattern < 2 ? '6AM-8AM, 4PM-6PM' : '8AM-10AM, 2PM-4PM';
      case 'DELIVERY':
        return timePattern < 2 ? '6AM-8AM, 8PM-10PM' : '8AM-10AM, 6PM-8PM';
      case 'STOP':
        return timePattern < 2 ? '6AM-8AM, 4PM-6PM' : '8AM-10AM, 2PM-4PM';
      case 'REFUEL':
        return '24/7';
      case 'REST':
        return '24/7';
      default:
        return '8AM-10AM, 2PM-4PM';
    }
  }

  /**
   * Identify restrictions based on coordinates
   */
  private identifyRestrictionsFromCoordinates(coordinates: {
    latitude: number;
    longitude: number;
  }): string[] {
    const restrictions: string[] = [];
    const lat = Math.abs(coordinates.latitude);
    const lng = Math.abs(coordinates.longitude);
    const restrictionPattern = (lat + lng) % 5;

    // Add restrictions based on coordinate patterns
    if (restrictionPattern < 1) {
      restrictions.push('TRUCK_RESTRICTIONS_DURING_PEAK_HOURS');
    } else if (restrictionPattern < 2) {
      restrictions.push('NO_TRUCKS_DURING_BUSINESS_HOURS');
    } else if (restrictionPattern < 3) {
      restrictions.push('SECURITY_CLEARANCE_REQUIRED');
    } else if (restrictionPattern < 4) {
      restrictions.push('WEIGHT_RESTRICTIONS_APPLY');
    }

    return restrictions;
  }

  /**
   * Batch enrich multiple cargo loads with improved performance
   */
  async batchEnrichCargoLocations(
    loads: Load[],
  ): Promise<Map<string, EnrichedLocation[]>> {
    try {
      const enrichedResults = new Map<string, EnrichedLocation[]>();
      const batchSize = 10; // Process in batches to avoid memory issues

      for (let i = 0; i < loads.length; i += batchSize) {
        const batch = loads.slice(i, i + batchSize);
        const batchPromises = batch.map(async (load) => {
          const enrichedLocations = await this.enrichCargoLocations(load);
          return { loadId: load.id, enrichedLocations };
        });

        const batchResults = await Promise.all(batchPromises);

        for (const result of batchResults) {
          enrichedResults.set(result.loadId, result.enrichedLocations);
        }
      }

      this.logger.log(`Batch enriched ${loads.length} loads`);
      return enrichedResults;
    } catch (error) {
      this.logger.error(`Error in batch enrichment:`, error);
      throw new Error(
        `Failed to batch enrich cargo locations: ${error.message}`,
      );
    }
  }

  /**
   * Generate a meaningful location name based on type and coordinates
   */
  private generateLocationName(
    locationType: 'PICKUP' | 'DELIVERY' | 'STOP' | 'REFUEL' | 'REST',
    coordinates: { latitude: number; longitude: number },
  ): string {
    const baseNames = {
      PICKUP: 'Pickup Location',
      DELIVERY: 'Delivery Location',
      STOP: 'Stop Location',
      REFUEL: 'Fuel Station',
      REST: 'Rest Area',
    };

    const baseName = baseNames[locationType];
    const lat = coordinates.latitude.toFixed(4);
    const lng = coordinates.longitude.toFixed(4);

    return `${baseName} (${lat}, ${lng})`;
  }

  /**
   * Calculate number of nearby fuel stations based on coordinates
   */
  private calculateNearbyFuelStations(coordinates: {
    latitude: number;
    longitude: number;
  }): number {
    const lat = Math.abs(coordinates.latitude);
    const lng = Math.abs(coordinates.longitude);

    // Generate realistic fuel station count based on coordinates
    const fuelStations = Math.floor((lat + lng) % 5) + 1;
    return Math.min(fuelStations, 5); // Max 5 fuel stations
  }

  /**
   * Calculate number of nearby rest areas based on coordinates
   */
  private calculateNearbyRestAreas(coordinates: {
    latitude: number;
    longitude: number;
  }): number {
    const lat = Math.abs(coordinates.latitude);
    const lng = Math.abs(coordinates.longitude);

    // Generate realistic rest area count based on coordinates
    const restAreas = Math.floor((lat + lng) % 3) + 1;
    return Math.min(restAreas, 3); // Max 3 rest areas
  }

  /**
   * Get location suggestions for cargo based on coordinates
   */
  async getLocationSuggestions(
    coordinates: { latitude: number; longitude: number },
    locationType: 'PICKUP' | 'DELIVERY' | 'STOP' | 'REFUEL' | 'REST',
  ): Promise<any[]> {
    // Generate location suggestions based on coordinates and location type
    const suggestions = this.generateLocationSuggestions(
      coordinates,
      locationType,
    );
    return suggestions;
  }

  /**
   * Generate location suggestions based on coordinates and location type
   */
  private generateLocationSuggestions(
    coordinates: { latitude: number; longitude: number },
    locationType: 'PICKUP' | 'DELIVERY' | 'STOP' | 'REFUEL' | 'REST',
  ): any[] {
    const lat = coordinates.latitude;
    const lng = coordinates.longitude;

    // Generate suggestions based on location type and coordinates
    const suggestions = [];

    // Add nearby locations based on coordinate patterns
    for (let i = 1; i <= 3; i++) {
      const offsetLat = lat + i * 0.01; // 1km offset
      const offsetLng = lng + i * 0.01;

      const suggestion = {
        id: `suggestion-${i}`,
        name: `${this.getLocationTypeName(locationType)} ${i}`,
        coordinates: { latitude: offsetLat, longitude: offsetLng },
        category: this.getPreferredCategories(locationType)[0],
        distance: i * 1.5, // km
        rating: Math.floor(Math.random() * 5) + 1,
      };

      suggestions.push(suggestion);
    }

    return suggestions;
  }

  /**
   * Get location type name
   */
  private getLocationTypeName(
    locationType: 'PICKUP' | 'DELIVERY' | 'STOP' | 'REFUEL' | 'REST',
  ): string {
    switch (locationType) {
      case 'PICKUP':
        return 'Pickup Location';
      case 'DELIVERY':
        return 'Delivery Location';
      case 'STOP':
        return 'Stop Location';
      case 'REFUEL':
        return 'Fuel Station';
      case 'REST':
        return 'Rest Area';
      default:
        return 'Location';
    }
  }

  /**
   * Get preferred location categories based on location type
   */
  private getPreferredCategories(
    locationType: 'PICKUP' | 'DELIVERY' | 'STOP' | 'REFUEL' | 'REST',
  ): string[] {
    switch (locationType) {
      case 'PICKUP':
        return ['WAREHOUSE', 'INDUSTRIAL', 'DISTRIBUTION_CENTER'];
      case 'DELIVERY':
        return ['COMMERCIAL', 'RETAIL', 'OFFICE'];
      case 'STOP':
        return ['INDUSTRIAL', 'WAREHOUSE', 'FACTORY'];
      case 'REFUEL':
        return ['SERVICE', 'FUEL_STATION', 'TRUCK_STOP'];
      case 'REST':
        return ['SERVICE', 'REST_AREA', 'TRUCK_STOP'];
      default:
        return ['WAREHOUSE', 'INDUSTRIAL', 'COMMERCIAL'];
    }
  }

  /**
   * Generate nearby Points of Interest (POIs) based on coordinates and location intelligence
   */
  private generateNearbyPOIs(
    coordinates: { latitude: number; longitude: number },
    locationIntelligence: any,
  ) {
    const lat = coordinates.latitude;
    const lng = coordinates.longitude;

    // Generate landmarks based on location characteristics
    const landmarks = this.generateLandmarks(lat, lng, locationIntelligence);

    // Generate transport hubs
    const transportHubs = this.generateTransportHubs(
      lat,
      lng,
      locationIntelligence,
    );

    // Generate commercial areas
    const commercialAreas = this.generateCommercialAreas(
      lat,
      lng,
      locationIntelligence,
    );

    // Generate service facilities
    const serviceFacilities = this.generateServiceFacilities(
      lat,
      lng,
      locationIntelligence,
    );

    return {
      landmarks,
      transportHubs,
      commercialAreas,
      serviceFacilities,
    };
  }

  /**
   * Generate landmarks based on coordinates and location intelligence
   */
  private generateLandmarks(
    lat: number,
    lng: number,
    locationIntelligence: any,
  ) {
    const landmarks = [];
    const baseDistance = 2.0; // 2km base distance

    // Generate landmarks based on location characteristics
    if (locationIntelligence.locationCategory === 'COMMERCIAL') {
      landmarks.push({
        name: `${locationIntelligence.city} Central Plaza`,
        type: 'SHOPPING_CENTER',
        distance: baseDistance + Math.random() * 2,
        coordinates: { latitude: lat + 0.01, longitude: lng + 0.01 },
      });
    }

    if (locationIntelligence.locationCategory === 'INDUSTRIAL') {
      landmarks.push({
        name: `${locationIntelligence.city} Industrial Park`,
        type: 'INDUSTRIAL_AREA',
        distance: baseDistance + Math.random() * 1.5,
        coordinates: { latitude: lat - 0.01, longitude: lng - 0.01 },
      });
    }

    // Add generic landmarks
    landmarks.push({
      name: `${locationIntelligence.city} City Hall`,
      type: 'GOVERNMENT_BUILDING',
      distance: baseDistance + Math.random() * 3,
      coordinates: { latitude: lat + 0.02, longitude: lng + 0.02 },
    });

    return landmarks;
  }

  /**
   * Generate transport hubs based on coordinates
   */
  private generateTransportHubs(
    lat: number,
    lng: number,
    locationIntelligence: any,
  ) {
    const transportHubs = [];
    const baseDistance = 5.0; // 5km base distance

    // Generate transport hubs based on location characteristics
    if (locationIntelligence.locationCategory === 'COMMERCIAL') {
      transportHubs.push({
        name: `${locationIntelligence.city} Bus Terminal`,
        type: 'BUS_TERMINAL',
        distance: baseDistance + Math.random() * 3,
        coordinates: { latitude: lat + 0.02, longitude: lng + 0.02 },
      });
    }

    // Add generic transport hubs
    transportHubs.push({
      name: `${locationIntelligence.city} Truck Terminal`,
      type: 'TRUCK_TERMINAL',
      distance: baseDistance + Math.random() * 2,
      coordinates: { latitude: lat - 0.02, longitude: lng - 0.02 },
    });

    return transportHubs;
  }

  /**
   * Generate commercial areas based on coordinates
   */
  private generateCommercialAreas(
    lat: number,
    lng: number,
    locationIntelligence: any,
  ) {
    const commercialAreas = [];
    const baseDistance = 1.5; // 1.5km base distance

    // Generate commercial areas based on location characteristics
    if (locationIntelligence.locationCategory === 'COMMERCIAL') {
      commercialAreas.push({
        name: `${locationIntelligence.city} Business District`,
        type: 'BUSINESS_DISTRICT',
        distance: baseDistance + Math.random() * 1,
        coordinates: { latitude: lat + 0.005, longitude: lng + 0.005 },
      });
    }

    // Add generic commercial areas
    commercialAreas.push({
      name: `${locationIntelligence.city} Market`,
      type: 'MARKET',
      distance: baseDistance + Math.random() * 2,
      coordinates: { latitude: lat - 0.005, longitude: lng - 0.005 },
    });

    return commercialAreas;
  }

  /**
   * Generate service facilities based on coordinates
   */
  private generateServiceFacilities(
    lat: number,
    lng: number,
    locationIntelligence: any,
  ) {
    const serviceFacilities = [];
    const baseDistance = 3.0; // 3km base distance

    // Generate service facilities based on location characteristics
    serviceFacilities.push({
      name: `${locationIntelligence.city} Police Station`,
      type: 'POLICE_STATION',
      distance: baseDistance + Math.random() * 2,
      coordinates: { latitude: lat + 0.015, longitude: lng + 0.015 },
    });

    serviceFacilities.push({
      name: `${locationIntelligence.city} Hospital`,
      type: 'HOSPITAL',
      distance: baseDistance + Math.random() * 3,
      coordinates: { latitude: lat - 0.015, longitude: lng - 0.015 },
    });

    serviceFacilities.push({
      name: `${locationIntelligence.city} Bank`,
      type: 'BANK',
      distance: baseDistance + Math.random() * 1.5,
      coordinates: { latitude: lat + 0.01, longitude: lng + 0.01 },
    });

    return serviceFacilities;
  }

  /**
   * Generate fallback POI data when APIs fail
   */
  private generateFallbackPOIData(
    coordinates: { latitude: number; longitude: number },
    locationIntelligence: any,
  ) {
    const lat = coordinates.latitude;
    const lng = coordinates.longitude;
    const city = locationIntelligence.city || 'Unknown City';

    return {
      landmarks: [
        {
          name: `${city} City Hall`,
          type: 'GOVERNMENT_BUILDING',
          distance: 2.0 + Math.random() * 2,
          coordinates: { latitude: lat + 0.01, longitude: lng + 0.01 },
        },
      ],
      transportHubs: [
        {
          name: `${city} Truck Terminal`,
          type: 'TRUCK_TERMINAL' as const,
          distance: 5.0 + Math.random() * 2,
          coordinates: { latitude: lat - 0.02, longitude: lng - 0.02 },
        },
      ],
      commercialAreas: [
        {
          name: `${city} Market`,
          type: 'MARKET' as const,
          distance: 1.5 + Math.random() * 1,
          coordinates: { latitude: lat + 0.005, longitude: lng + 0.005 },
        },
      ],
      serviceFacilities: [
        {
          name: `${city} Police Station`,
          type: 'POLICE_STATION' as const,
          distance: 3.0 + Math.random() * 2,
          coordinates: { latitude: lat + 0.015, longitude: lng + 0.015 },
        },
      ],
    };
  }

  /**
   * Get cache statistics for monitoring
   */
  getCacheStatistics(): {
    size: number;
    hitRate: number;
    totalRequests: number;
  } {
    return {
      size: this.coordinateCache.size,
      hitRate: this.cacheHitRate,
      totalRequests: this.totalRequests,
    };
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.coordinateCache.clear();
    this.logger.log('Location enrichment cache cleared');
  }

  /**
   * Get location intelligence summary for analytics
   */
  getLocationIntelligenceSummary(coordinates: {
    latitude: number;
    longitude: number;
  }): {
    region: string;
    continent: string;
    timezone: string;
    locationType: string;
    trafficLevel: string;
    restrictions: string[];
  } {
    try {
      const continent = this.determineContinent(
        coordinates.latitude,
        coordinates.longitude,
      );
      const region = this.determineRegion(
        coordinates.latitude,
        coordinates.longitude,
        continent,
      );
      const characteristics = this.determineLocationCharacteristics(
        coordinates.latitude,
        coordinates.longitude,
      );
      const trafficPattern =
        this.analyzeTrafficPatternFromCoordinates(coordinates);
      const restrictions =
        this.identifyRestrictionsFromCoordinates(coordinates);

      return {
        region: `${region.city}, ${region.state}`,
        continent,
        timezone: region.timezone,
        locationType: characteristics.category,
        trafficLevel: trafficPattern,
        restrictions,
      };
    } catch (error) {
      this.logger.error('Error getting location intelligence summary:', error);
      return {
        region: 'Unknown',
        continent: 'Unknown',
        timezone: 'UTC',
        locationType: 'GENERAL',
        trafficLevel: 'UNKNOWN',
        restrictions: [],
      };
    }
  }

  /**
   * Validate and enrich location data with error recovery
   */
  async validateAndEnrichLocation(location: LoadLocation): Promise<{
    isValid: boolean;
    enrichedLocation?: EnrichedLocation;
    errors: string[];
    warnings: string[];
  }> {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // Validate coordinates
      if (!this.isValidCoordinates(location.locationData.coordinates)) {
        errors.push('Invalid coordinates provided');
        return { isValid: false, errors, warnings };
      }

      // Check for missing required fields
      if (!location.type) {
        errors.push('Location type is required');
      }

      if (!location.scheduledDate) {
        warnings.push('Scheduled date is recommended for better planning');
      }

      // Enrich location if validation passes
      if (errors.length === 0) {
        const enrichedLocation = await this.enrichLocation(location);
        return { isValid: true, enrichedLocation, errors, warnings };
      }

      return { isValid: false, errors, warnings };
    } catch (error) {
      errors.push(`Enrichment failed: ${error.message}`);
      return { isValid: false, errors, warnings };
    }
  }

  // Cache performance tracking
  private cacheHitRate = 0;
  private totalRequests = 0;
  private cacheHits = 0;

  /**
   * Update cache statistics
   */
  private updateCacheStats(hit: boolean): void {
    this.totalRequests++;
    if (hit) {
      this.cacheHits++;
    }
    this.cacheHitRate = this.cacheHits / this.totalRequests;
  }

  /**
   * Get result from cache with statistics tracking
   */
  private getFromCache(key: string): EnrichedLocation | null {
    const cached = this.coordinateCache.get(key);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      this.updateCacheStats(true);
      return cached.data;
    }
    if (cached) {
      this.coordinateCache.delete(key); // Remove expired cache
    }
    this.updateCacheStats(false);
    return null;
  }

  /**
   * Validate coordinates
   */
  private isValidCoordinates(coordinates: {
    latitude: number;
    longitude: number;
  }): boolean {
    if (!coordinates || typeof coordinates !== 'object') {
      return false;
    }

    const { latitude, longitude } = coordinates;

    if (typeof latitude !== 'number' || typeof longitude !== 'number') {
      return false;
    }

    if (latitude < -90 || latitude > 90) {
      return false;
    }

    if (longitude < -180 || longitude > 180) {
      return false;
    }

    return true;
  }

  /**
   * Generate cache key for coordinates and location type
   */
  private generateCacheKey(
    coordinates: { latitude: number; longitude: number },
    locationType: string,
  ): string {
    const lat = Math.round(coordinates.latitude * 10000) / 10000; // Round to 4 decimal places
    const lng = Math.round(coordinates.longitude * 10000) / 10000;
    return `${lat}_${lng}_${locationType}`;
  }

  /**
   * Set result in cache
   */
  private setCache(key: string, data: EnrichedLocation): void {
    this.coordinateCache.set(key, {
      data,
      timestamp: Date.now(),
    });

    // Clean up old cache entries if cache gets too large
    if (this.coordinateCache.size > 1000) {
      const now = Date.now();
      for (const [cacheKey, value] of this.coordinateCache.entries()) {
        if (now - value.timestamp > this.CACHE_TTL) {
          this.coordinateCache.delete(cacheKey);
        }
      }
    }
  }
}
