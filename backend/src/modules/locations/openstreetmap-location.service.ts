import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

export interface OSMGeocodingResult {
  address: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
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
  timezone: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
}

export interface OSMPlaceResult {
  name: string;
  type: string;
  distance: number;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  address?: string;
  phone?: string;
  website?: string;
  rating?: number;
  openNow?: boolean;
}

export interface OSMPlacesResult {
  landmarks: OSMPlaceResult[];
  transportHubs: OSMPlaceResult[];
  commercialAreas: OSMPlaceResult[];
  serviceFacilities: OSMPlaceResult[];
}

@Injectable()
export class OpenStreetMapLocationService {
  private readonly logger = new Logger(OpenStreetMapLocationService.name);
  private readonly cache = new Map<string, any>();
  private readonly CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

  constructor(private configService: ConfigService) {}

   /**
   * Get coordinates from address string using Nominatim
   */
  async getCoordinatesFromAddress(address: string): Promise<{ latitude: number; longitude: number } | null> {
    const cacheKey = `osm_address_${address.toLowerCase().trim()}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        address,
      )}&limit=1`;
      
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'CargoAIMatching/1.0',
          'Accept-Language': 'en',
        },
        timeout: 10000,
      });

      if (response.status === 200 && response.data && response.data.length > 0) {
        const result = response.data[0];
        const coordinates = {
          latitude: parseFloat(result.lat),
          longitude: parseFloat(result.lon),
        };
        this.setCache(cacheKey, coordinates);
        return coordinates;
      }
      return null;
    } catch (error) {
      this.logger.error(`Error geocoding address "${address}":`, error);
      return null;
    }
  }

  /**
   * Get real geocoding data from OpenStreetMap Nominatim
   */
  async getGeocodingData(coordinates: {
    latitude: number;
    longitude: number;
  }): Promise<OSMGeocodingResult | null> {
    const cacheKey = `osm_geocoding_${coordinates.latitude}_${coordinates.longitude}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      const result = await this.getOSMGeocodingData(coordinates);
      if (result) {
        this.setCache(cacheKey, result);
        return result;
      }
      // OSM returned no usable data — don't cache, let next attempt try again
      return null;
    } catch (error) {
      this.logger.error('Error getting OSM geocoding data:', error);
      return null;
    }
  }

  /**
   * Get real POI data from OpenStreetMap Overpass API
   */
  async getPOIData(
    coordinates: { latitude: number; longitude: number },
    radius: number = 5000,
  ): Promise<OSMPlacesResult> {
    const cacheKey = `osm_poi_${coordinates.latitude}_${coordinates.longitude}_${radius}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      const result = await this.getOSMPOIData(coordinates, radius);
      if (result) {
        this.setCache(cacheKey, result);
        return result;
      }

      // Fallback to generated POI data
      const fallbackResult = this.generateFallbackPOIData(coordinates);
      this.setCache(cacheKey, fallbackResult);
      return fallbackResult;
    } catch (error) {
      this.logger.error('Error getting OSM POI data:', error);
      const fallbackResult = this.generateFallbackPOIData(coordinates);
      this.setCache(cacheKey, fallbackResult);
      return fallbackResult;
    }
  }

  /**
   * Get geocoding data from OpenStreetMap Nominatim
   */
  private async getOSMGeocodingData(coordinates: {
    latitude: number;
    longitude: number;
  }): Promise<OSMGeocodingResult | null> {
    try {
      const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${coordinates.latitude}&lon=${coordinates.longitude}&zoom=18&addressdetails=1`;

      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'UrutiX-Logistics/1.0',
          'Accept-Language': 'en',
        },
        timeout: 10000,
      });

      if (response.status === 200 && response.data) {
        const data = response.data;
        // Use display_name as full address
        const address = data.display_name || '';

        // Extract address components — returns null for missing fields
        const addressParts = this.extractOSMAddressComponents(data.address || {});

        // If OSM returned nothing useful, signal failure so caller can skip enrichment
        if (!addressParts.city && !addressParts.country) {
          return null;
        }

        // Get timezone
        const timezone = await this.getTimezoneFromCoordinates(coordinates);

        return {
          address,
          city: addressParts.city,
          state: addressParts.state,
          country: addressParts.country,
          postalCode:
            addressParts.postcode ||
            this.generatePostalCode(
              coordinates.latitude,
              coordinates.longitude,
            ),
          administrativeAreas: {
            district: addressParts.district,
            province: addressParts.state,
            county: addressParts.district,
            postalCode:
              addressParts.postcode ||
              this.generatePostalCode(
                coordinates.latitude,
                coordinates.longitude,
              ),
            administrativeArea: addressParts.state,
            subDistrict:
              addressParts.suburb || addressParts.neighbourhood || undefined,
            ward: addressParts.ward || undefined,
            constituency: addressParts.constituency || undefined,
          },
          timezone,
          coordinates,
        };
      }

      return null;
    } catch (error) {
      this.logger.error('Error fetching OSM geocoding data:', error);
      return null;
    }
  }

  /**
   * Get POI data from OpenStreetMap Overpass API
   */
  private async getOSMPOIData(
    coordinates: { latitude: number; longitude: number },
    radius: number,
  ): Promise<OSMPlacesResult | null> {
    try {
      const { latitude, longitude } = coordinates;
      const bbox = `${latitude - 0.05},${longitude - 0.05},${latitude + 0.05},${longitude + 0.05}`;

      // Overpass API query for different types of POIs
      const queries = [
        // Landmarks
        `[out:json][timeout:25];(node["tourism"](bbox);way["tourism"](bbox);relation["tourism"](bbox););out center;`,
        // Transport hubs
        `[out:json][timeout:25];(node["amenity"="bus_station"](bbox);node["amenity"="train_station"](bbox);node["aeroway"="aerodrome"](bbox);way["amenity"="bus_station"](bbox);way["amenity"="train_station"](bbox);way["aeroway"="aerodrome"](bbox););out center;`,
        // Commercial areas
        `[out:json][timeout:25];(node["shop"](bbox);node["amenity"="restaurant"](bbox);node["amenity"="cafe"](bbox);way["shop"](bbox);way["amenity"="restaurant"](bbox);way["amenity"="cafe"](bbox););out center;`,
        // Service facilities
        `[out:json][timeout:25];(node["amenity"="hospital"](bbox);node["amenity"="police"](bbox);node["amenity"="fire_station"](bbox);node["amenity"="bank"](bbox);node["amenity"="post_office"](bbox);way["amenity"="hospital"](bbox);way["amenity"="police"](bbox);way["amenity"="fire_station"](bbox);way["amenity"="bank"](bbox);way["amenity"="post_office"](bbox););out center;`,
      ];

      const results = await Promise.all(
        queries.map((query) => this.queryOverpassAPI(query)),
      );

      const landmarks = this.parseOSMPlaces(
        results[0],
        coordinates,
        'landmark',
      );
      const transportHubs = this.parseOSMPlaces(
        results[1],
        coordinates,
        'transport',
      );
      const commercialAreas = this.parseOSMPlaces(
        results[2],
        coordinates,
        'commercial',
      );
      const serviceFacilities = this.parseOSMPlaces(
        results[3],
        coordinates,
        'service',
      );

      return {
        landmarks,
        transportHubs,
        commercialAreas,
        serviceFacilities,
      };
    } catch (error) {
      this.logger.error('Error fetching OSM POI data:', error);
      return null;
    }
  }

  /**
   * Query OpenStreetMap Overpass API
   */
  private async queryOverpassAPI(query: string): Promise<any[]> {
    try {
      const response = await axios.get(
        'https://overpass-api.de/api/interpreter',
        {
          params: { data: query },
          timeout: 15000,
        },
      );

      if (response.status === 200 && response.data && response.data.elements) {
        return response.data.elements;
      }

      return [];
    } catch (error) {
      this.logger.error('Error querying Overpass API:', error);
      return [];
    }
  }

  /**
   * Parse OSM places from Overpass API response
   */
  private parseOSMPlaces(
    elements: any[],
    coordinates: { latitude: number; longitude: number },
    category: string,
  ): OSMPlaceResult[] {
    return elements
      .filter((element) => element.tags && element.tags.name)
      .map((element) => {
        const elementCoords =
          element.center || element.lat
            ? {
                latitude: element.center?.lat || element.lat,
                longitude: element.center?.lon || element.lon,
              }
            : coordinates;

        const distance = this.calculateDistance(coordinates, elementCoords);

        return {
          name: element.tags.name,
          type: this.mapOSMPlaceType(element.tags, category),
          distance,
          coordinates: elementCoords,
          address: element.tags['addr:street']
            ? `${element.tags['addr:housenumber'] || ''} ${element.tags['addr:street']}`.trim()
            : undefined,
          phone: element.tags.phone || element.tags['contact:phone'],
          website: element.tags.website || element.tags['contact:website'],
          rating: undefined, // OSM doesn't provide ratings
          openNow: undefined, // OSM doesn't provide opening hours
        };
      })
      .filter((place) => place.distance <= 5000) // Filter by distance
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 10); // Limit to top 10
  }

  /**
   * Map OSM place types to our categories
   */
  private mapOSMPlaceType(tags: any, category: string): string {
    switch (category) {
      case 'landmark':
        if (tags.tourism === 'museum') return 'MUSEUM';
        if (tags.tourism === 'hotel') return 'HOTEL';
        if (tags.historic) return 'HISTORIC_SITE';
        if (tags.leisure === 'park') return 'PARK';
        return 'LANDMARK';

      case 'transport':
        if (tags.aeroway === 'aerodrome') return 'AIRPORT';
        if (tags.amenity === 'train_station') return 'TRAIN_STATION';
        if (tags.amenity === 'bus_station') return 'BUS_TERMINAL';
        if (tags.amenity === 'ferry_terminal') return 'PORT';
        return 'TRANSPORT_HUB';

      case 'commercial':
        if (tags.shop === 'supermarket') return 'SUPERMARKET';
        if (tags.amenity === 'restaurant') return 'RESTAURANT';
        if (tags.amenity === 'cafe') return 'CAFE';
        if (tags.shop === 'mall') return 'SHOPPING_CENTER';
        return 'COMMERCIAL';

      case 'service':
        if (tags.amenity === 'hospital') return 'HOSPITAL';
        if (tags.amenity === 'police') return 'POLICE_STATION';
        if (tags.amenity === 'fire_station') return 'FIRE_STATION';
        if (tags.amenity === 'bank') return 'BANK';
        if (tags.amenity === 'post_office') return 'POST_OFFICE';
        return 'SERVICE_FACILITY';

      default:
        return 'UNKNOWN';
    }
  }

  /**
   * Extract address components from OSM Nominatim response
   */
  private extractOSMAddressComponents(address: any): any {
    return {
      // OSM Nominatim uses different keys in different regions:
      // - "city" for large cities
      // - "town" for smaller towns
      // - "village" for villages
      // - "municipality" in some countries
      // - "county" for African districts/counties that OSM treats as city-level
      // - "state_district" for some sub-national regions
      // - "region" used in some African countries
      city:
        address.city ||
        address.town ||
        address.village ||
        address.municipality ||
        address.county ||
        address.state_district ||
        address.region ||
        null,
      state: address.state || address.province || null,
      country: address.country || null,
      postcode: address.postcode || null,
      district: address.district || address.county || null,
      suburb: address.suburb || null,
      neighbourhood: address.neighbourhood || null,
      ward: address.ward || null,
      constituency: address.constituency || null,
    };
  }

  /**
   * Get timezone from coordinates using a simple calculation
   */
  private async getTimezoneFromCoordinates(coordinates: {
    latitude: number;
    longitude: number;
  }): Promise<string> {
    // Simple timezone calculation based on longitude
    const timezoneOffset = Math.round(coordinates.longitude / 15);
    const sign = timezoneOffset >= 0 ? '+' : '';
    return `UTC${sign}${timezoneOffset}`;
  }

  /**
   * Calculate distance between two coordinates using Haversine formula
   */
  private calculateDistance(
    coord1: { latitude: number; longitude: number },
    coord2: { latitude: number; longitude: number },
  ): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(coord2.latitude - coord1.latitude);
    const dLon = this.toRadians(coord2.longitude - coord1.longitude);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(coord1.latitude)) *
        Math.cos(this.toRadians(coord2.latitude)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * Convert degrees to radians
   */
  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  /**
   * Generate fallback geocoding data
   */
  private generateFallbackGeocodingData(coordinates: {
    latitude: number;
    longitude: number;
  }): OSMGeocodingResult {
    const timezone = `UTC${Math.round(coordinates.longitude / 15) >= 0 ? '+' : ''}${Math.round(coordinates.longitude / 15)}`;

    return {
      address: `Lat: ${coordinates.latitude.toFixed(4)}, Lng: ${coordinates.longitude.toFixed(4)}`,
      city: 'Unknown City',
      state: 'Unknown State',
      country: 'Unknown Country',
      postalCode: this.generatePostalCode(
        coordinates.latitude,
        coordinates.longitude,
      ),
      administrativeAreas: {
        district: 'Unknown District',
        province: 'Unknown Province',
        county: 'Unknown County',
        postalCode: this.generatePostalCode(
          coordinates.latitude,
          coordinates.longitude,
        ),
        administrativeArea: 'Unknown Administrative Area',
        subDistrict: undefined,
        ward: undefined,
        constituency: undefined,
      },
      timezone,
      coordinates,
    };
  }

  /**
   * Generate fallback POI data
   */
  private generateFallbackPOIData(coordinates: {
    latitude: number;
    longitude: number;
  }): OSMPlacesResult {
    return {
      landmarks: [],
      transportHubs: [],
      commercialAreas: [],
      serviceFacilities: [],
    };
  }

  /**
   * Generate postal code based on coordinates
   */
  private generatePostalCode(lat: number, lng: number): string {
    const latInt = Math.abs(Math.floor(lat * 100));
    const lngInt = Math.abs(Math.floor(lng * 100));
    return `${latInt}${lngInt}`.padStart(5, '0');
  }

  /**
   * Cache management methods
   */
  private getFromCache(key: string): any {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.data;
    }
    if (cached) {
      this.cache.delete(key);
    }
    return null;
  }

  private setCache(key: string, data: any): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  clearCache(): void {
    this.cache.clear();
    this.logger.log('OSM Location cache cleared');
  }

  getCacheStatistics(): { size: number } {
    return { size: this.cache.size };
  }
}
