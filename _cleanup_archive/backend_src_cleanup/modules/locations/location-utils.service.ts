import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Location } from '../../entities/location.entity';

export interface LocationIntelligence {
  locationId: string;
  name: string;
  fullAddress: string;
  locationCategory: string;
  accessType: string;
  businessHours: string;
  specialInstructions: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  operationalInfo: {
    isOperational: boolean;
    parkingAvailable: boolean;
    loadingDockCount: number;
    maxTruckHeight: number;
    maxTruckWeight: number;
    securityLevel: string;
  };
  routeOptimization: {
    distanceFromHighway: number;
    trafficPattern: string;
    bestAccessTime: string;
    restrictions: string[];
  };
}

export interface LocationSearchCriteria {
  city?: string;
  state?: string;
  country?: string;
  locationCategory?: string;
  accessType?: string;
  hasParking?: boolean;
  hasLoadingDock?: boolean;
  maxTruckHeight?: number;
  maxTruckWeight?: number;
  isOperational?: boolean;
}

@Injectable()
export class LocationUtilsService {
  constructor(
    @InjectRepository(Location)
    private readonly locationRepository: Repository<Location>,
  ) {}

  /**
   * Get meaningful location information for a location
   */
  async getLocationIntelligence(
    locationId: string,
  ): Promise<LocationIntelligence | null> {
    const location = await this.locationRepository.findOne({
      where: { id: locationId },
    });

    if (!location) {
      return null;
    }

    return {
      locationId: location.id,
      name: location.name,
      fullAddress: location.fullAddress,
      locationCategory: location.locationCategory || 'GENERAL',
      accessType: location.accessType || 'TRUCK_ACCESSIBLE',
      businessHours: location.businessHours || '24/7',
      specialInstructions: location.specialInstructions || '',
      coordinates: {
        latitude: location.latitude || 0,
        longitude: location.longitude || 0,
      },
      operationalInfo: {
        isOperational: location.isOperational,
        parkingAvailable: location.parkingAvailable || false,
        loadingDockCount: location.loadingDockCount || 0,
        maxTruckHeight: location.maxTruckHeight || 4.5, // Default 4.5m
        maxTruckWeight: location.maxTruckWeight || 20, // Default 20 tons
        securityLevel: location.securityLevel || 'PUBLIC',
      },
      routeOptimization: await this.getRouteOptimization(location),
    };
  }

  /**
   * Search locations with meaningful criteria
   */
  async searchLocations(
    criteria: LocationSearchCriteria,
    tenantId: string,
  ): Promise<Location[]> {
    const queryBuilder = this.locationRepository
      .createQueryBuilder('location')
      .where('location.tenantId = :tenantId', { tenantId });

    if (criteria.city) {
      queryBuilder.andWhere('location.city ILIKE :city', {
        city: `%${criteria.city}%`,
      });
    }

    if (criteria.state) {
      queryBuilder.andWhere('location.state ILIKE :state', {
        state: `%${criteria.state}%`,
      });
    }

    if (criteria.country) {
      queryBuilder.andWhere('location.country ILIKE :country', {
        country: `%${criteria.country}%`,
      });
    }

    if (criteria.locationCategory) {
      queryBuilder.andWhere('location.locationCategory = :category', {
        category: criteria.locationCategory,
      });
    }

    if (criteria.accessType) {
      queryBuilder.andWhere('location.accessType = :accessType', {
        accessType: criteria.accessType,
      });
    }

    if (criteria.hasParking !== undefined) {
      queryBuilder.andWhere('location.parkingAvailable = :parking', {
        parking: criteria.hasParking,
      });
    }

    if (criteria.hasLoadingDock !== undefined) {
      if (criteria.hasLoadingDock) {
        queryBuilder.andWhere('location.loadingDockCount > 0');
      } else {
        queryBuilder.andWhere(
          '(location.loadingDockCount = 0 OR location.loadingDockCount IS NULL)',
        );
      }
    }

    if (criteria.maxTruckHeight) {
      queryBuilder.andWhere('location.maxTruckHeight >= :height', {
        height: criteria.maxTruckHeight,
      });
    }

    if (criteria.maxTruckWeight) {
      queryBuilder.andWhere('location.maxTruckWeight >= :weight', {
        weight: criteria.maxTruckWeight,
      });
    }

    if (criteria.isOperational !== undefined) {
      queryBuilder.andWhere('location.isActive = :active', {
        active: criteria.isOperational,
      });
    }

    return queryBuilder.getMany();
  }

  /**
   * Get popular locations by category
   */
  async getPopularLocations(
    tenantId: string,
    limit: number = 10,
  ): Promise<Location[]> {
    return this.locationRepository
      .createQueryBuilder('location')
      .where('location.tenantId = :tenantId', { tenantId })
      .andWhere('location.isActive = true')
      .orderBy('location.locationCategory', 'ASC')
      .addOrderBy('location.name', 'ASC')
      .limit(limit)
      .getMany();
  }

  /**
   * Get location categories with counts
   */
  async getLocationCategories(
    tenantId: string,
  ): Promise<Array<{ category: string; count: number }>> {
    const result = await this.locationRepository
      .createQueryBuilder('location')
      .select('location.locationCategory', 'category')
      .addSelect('COUNT(*)', 'count')
      .where('location.tenantId = :tenantId', { tenantId })
      .andWhere('location.isActive = true')
      .groupBy('location.locationCategory')
      .orderBy('count', 'DESC')
      .getRawMany();

    return result.map((row) => ({
      category: row.category || 'GENERAL',
      count: parseInt(row.count),
    }));
  }

  /**
   * Get route optimization data for a location
   */
  private async getRouteOptimization(location: Location): Promise<{
    distanceFromHighway: number;
    trafficPattern: string;
    bestAccessTime: string;
    restrictions: string[];
  }> {
    // This would typically integrate with external mapping services
    // For now, return default values based on location category
    const defaults = {
      distanceFromHighway: 2.5, // km
      trafficPattern: 'MODERATE',
      bestAccessTime: '8AM-10AM, 2PM-4PM',
      restrictions: [],
    };

    switch (location.locationCategory) {
      case 'INDUSTRIAL':
        return {
          ...defaults,
          trafficPattern: 'LOW',
          bestAccessTime: '6AM-8AM, 4PM-6PM',
          restrictions: ['TRUCK_RESTRICTIONS_DURING_PEAK_HOURS'],
        };
      case 'COMMERCIAL':
        return {
          ...defaults,
          trafficPattern: 'HIGH',
          bestAccessTime: '6AM-8AM, 8PM-10PM',
          restrictions: ['NO_TRUCKS_DURING_BUSINESS_HOURS'],
        };
      case 'WAREHOUSE':
        return {
          ...defaults,
          distanceFromHighway: 1.0,
          trafficPattern: 'LOW',
          bestAccessTime: '24/7',
          restrictions: [],
        };
      default:
        return defaults;
    }
  }

  /**
   * Validate location data and provide suggestions
   */
  async validateLocationData(locationData: Partial<Location>): Promise<{
    isValid: boolean;
    suggestions: string[];
    warnings: string[];
  }> {
    const suggestions: string[] = [];
    const warnings: string[] = [];

    // Check for required fields
    if (!locationData.name) {
      warnings.push('Location name is required');
    }

    if (!locationData.address) {
      warnings.push('Address is required');
    }

    // Suggest location category based on name
    if (locationData.name && !locationData.locationCategory) {
      const name = locationData.name.toLowerCase();
      if (name.includes('warehouse') || name.includes('storage')) {
        suggestions.push('Consider setting locationCategory to "WAREHOUSE"');
      } else if (name.includes('factory') || name.includes('industrial')) {
        suggestions.push('Consider setting locationCategory to "INDUSTRIAL"');
      } else if (name.includes('office') || name.includes('commercial')) {
        suggestions.push('Consider setting locationCategory to "COMMERCIAL"');
      }
    }

    // Validate coordinates
    if (locationData.coordinates) {
      const coords =
        (locationData.coordinates as any).coordinates ||
        locationData.coordinates;
      if (Array.isArray(coords) && coords.length === 2) {
        const [lng, lat] = coords;
        if (lng < -180 || lng > 180) {
          warnings.push('Longitude must be between -180 and 180');
        }
        if (lat < -90 || lat > 90) {
          warnings.push('Latitude must be between -90 and 90');
        }
      }
    }

    // Suggest business hours for commercial locations
    if (
      locationData.locationCategory === 'COMMERCIAL' &&
      !locationData.businessHours
    ) {
      suggestions.push(
        'Consider adding business hours for commercial locations',
      );
    }

    // Suggest access type based on location category
    if (locationData.locationCategory && !locationData.accessType) {
      switch (locationData.locationCategory) {
        case 'WAREHOUSE':
          suggestions.push('Consider setting accessType to "TRUCK_ACCESSIBLE"');
          break;
        case 'INDUSTRIAL':
          suggestions.push(
            'Consider setting accessType to "FORKLIFT_REQUIRED"',
          );
          break;
        case 'COMMERCIAL':
          suggestions.push('Consider setting accessType to "DOCKS_AVAILABLE"');
          break;
      }
    }

    return {
      isValid: warnings.length === 0,
      suggestions,
      warnings,
    };
  }

  /**
   * Get location statistics for analytics
   */
  async getLocationStatistics(tenantId: string): Promise<{
    totalLocations: number;
    operationalLocations: number;
    categories: Array<{ category: string; count: number; percentage: number }>;
    accessTypes: Array<{ type: string; count: number; percentage: number }>;
    topCities: Array<{ city: string; count: number }>;
  }> {
    const locations = await this.locationRepository.find({
      where: { tenantId, isActive: true },
    });

    const totalLocations = locations.length;
    const operationalLocations = locations.filter(
      (l) => l.isOperational,
    ).length;

    // Category statistics
    const categoryCounts = locations.reduce(
      (acc, location) => {
        const category = location.locationCategory || 'GENERAL';
        acc[category] = (acc[category] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    const categories = Object.entries(categoryCounts).map(
      ([category, count]) => ({
        category,
        count,
        percentage: (count / totalLocations) * 100,
      }),
    );

    // Access type statistics
    const accessTypeCounts = locations.reduce(
      (acc, location) => {
        const type = location.accessType || 'TRUCK_ACCESSIBLE';
        acc[type] = (acc[type] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    const accessTypes = Object.entries(accessTypeCounts).map(
      ([type, count]) => ({
        type,
        count,
        percentage: (count / totalLocations) * 100,
      }),
    );

    // Top cities
    const cityCounts = locations.reduce(
      (acc, location) => {
        const city = location.city || 'Unknown';
        acc[city] = (acc[city] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    const topCities = Object.entries(cityCounts)
      .map(([city, count]) => ({ city, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      totalLocations,
      operationalLocations,
      categories,
      accessTypes,
      topCities,
    };
  }
}
