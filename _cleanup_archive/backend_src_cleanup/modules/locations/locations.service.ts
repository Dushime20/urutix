import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Location } from '../../entities/location.entity';
import { CreateLocationDto, LocationType } from './dto/create-location.dto';
import { UpdateLocationDto } from './dto/update-location.dto';
import { NearbyLocationsDto } from './dto/nearby-locations.dto';

@Injectable()
export class LocationsService {
  constructor(
    @InjectRepository(Location)
    private readonly locationRepository: Repository<Location>,
  ) {}

  async createLocation(
    createLocationDto: CreateLocationDto,
    tenantId: string,
  ): Promise<Location> {
    // Transform DTO to match entity structure
    const locationData = {
      tenantId,
      name: createLocationDto.name,
      address: createLocationDto.address,
      cityId: undefined, // Will be set based on city lookup
      postalCode: createLocationDto.postalCode,
      coordinates: {
        type: 'Point',
        coordinates: [createLocationDto.longitude, createLocationDto.latitude],
      },
      locationType: createLocationDto.type,
      contactInfo: {
        contactPerson: createLocationDto.contactPerson,
        contactPhone: createLocationDto.contactPhone,
        contactEmail: createLocationDto.contactEmail,
        city: createLocationDto.city,
        state: createLocationDto.state,
        country: createLocationDto.country,
      },
      operatingHours: createLocationDto.operatingHours
        ? { hours: createLocationDto.operatingHours }
        : {},
      facilities: {
        specialInstructions: createLocationDto.specialInstructions,
        notes: createLocationDto.notes,
      },
      accessInstructions: createLocationDto.specialInstructions,
    };

    const location = this.locationRepository.create(locationData);
    return this.locationRepository.save(location);
  }

  async findAllLocations(
    tenantId: string,
    type?: LocationType,
  ): Promise<Location[]> {
    const query = this.locationRepository
      .createQueryBuilder('location')
      .where('location.tenantId = :tenantId', { tenantId });

    if (type) {
      query.andWhere('location.locationType = :type', { type });
    }

    return query.getMany();
  }

  async findOneLocation(id: string, tenantId: string): Promise<Location> {
    const location = await this.locationRepository.findOne({
      where: { id, tenantId },
    });

    if (!location) {
      throw new NotFoundException('Location not found');
    }

    return location;
  }

  async updateLocation(
    id: string,
    updateLocationDto: UpdateLocationDto,
    tenantId: string,
  ): Promise<Location> {
    const location = await this.findOneLocation(id, tenantId);

    // Transform update data to match entity structure
    const updateData: any = {};

    if (updateLocationDto.name) updateData.name = updateLocationDto.name;
    if (updateLocationDto.address)
      updateData.address = updateLocationDto.address;
    if (updateLocationDto.postalCode)
      updateData.postalCode = updateLocationDto.postalCode;
    if (updateLocationDto.type)
      updateData.locationType = updateLocationDto.type;
    if (updateLocationDto.specialInstructions)
      updateData.accessInstructions = updateLocationDto.specialInstructions;

    if (updateLocationDto.latitude || updateLocationDto.longitude) {
      const currentCoords = location.coordinates as any;
      updateData.coordinates = {
        type: 'Point',
        coordinates: [
          updateLocationDto.longitude ?? currentCoords.coordinates[0],
          updateLocationDto.latitude ?? currentCoords.coordinates[1],
        ],
      };
    }

    if (
      updateLocationDto.contactPerson ||
      updateLocationDto.contactPhone ||
      updateLocationDto.contactEmail
    ) {
      updateData.contactInfo = {
        ...location.contactInfo,
        ...(updateLocationDto.contactPerson && {
          contactPerson: updateLocationDto.contactPerson,
        }),
        ...(updateLocationDto.contactPhone && {
          contactPhone: updateLocationDto.contactPhone,
        }),
        ...(updateLocationDto.contactEmail && {
          contactEmail: updateLocationDto.contactEmail,
        }),
      };
    }

    if (updateLocationDto.operatingHours) {
      updateData.operatingHours = { hours: updateLocationDto.operatingHours };
    }

    if (updateLocationDto.notes) {
      updateData.facilities = {
        ...location.facilities,
        notes: updateLocationDto.notes,
      };
    }

    Object.assign(location, updateData);
    return this.locationRepository.save(location);
  }

  async removeLocation(id: string, tenantId: string): Promise<void> {
    const location = await this.findOneLocation(id, tenantId);
    await this.locationRepository.remove(location);
  }

  async findNearbyLocations(
    nearbyLocationsDto: NearbyLocationsDto,
    tenantId: string,
  ): Promise<Location[]> {
    const {
      latitude,
      longitude,
      radiusKm,
      type,
      limit = 20,
    } = nearbyLocationsDto;

    // For now, return all locations since PostGIS is not configured
    // In production, use PostGIS spatial queries
    const query = this.locationRepository
      .createQueryBuilder('location')
      .where('location.tenantId = :tenantId', { tenantId })
      .limit(limit);

    if (type) {
      query.andWhere('location.locationType = :type', { type });
    }

    const locations = await query.getMany();

    // Filter by distance manually
    return locations.filter((location) => {
      const coords = location.coordinates as any;
      if (!coords || !coords.coordinates) return false;

      const [lon, lat] = coords.coordinates;
      const distance = this.calculateDistance(latitude, longitude, lat, lon);
      return distance <= radiusKm;
    });
  }

  calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) *
        Math.cos(this.toRadians(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  async getLocationStats(tenantId: string): Promise<any> {
    const locations = await this.findAllLocations(tenantId);

    const totalLocations = locations.length;
    const locationTypes = locations.reduce(
      (acc, location) => {
        acc[location.locationType] = (acc[location.locationType] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    const countries = [
      ...new Set(locations.map((l) => l.contactInfo?.country).filter(Boolean)),
    ];
    const cities = [
      ...new Set(locations.map((l) => l.contactInfo?.city).filter(Boolean)),
    ];

    return {
      totalLocations,
      locationTypes,
      countries: countries.length,
      cities: cities.length,
      topCountries: countries.slice(0, 5),
      topCities: cities.slice(0, 10),
    };
  }

  async searchLocations(
    searchTerm: string,
    tenantId: string,
    type?: LocationType,
  ): Promise<Location[]> {
    const query = this.locationRepository
      .createQueryBuilder('location')
      .where('location.tenantId = :tenantId', { tenantId })
      .andWhere(
        '(location.name ILIKE :searchTerm OR location.address ILIKE :searchTerm)',
        { searchTerm: `%${searchTerm}%` },
      );

    if (type) {
      query.andWhere('location.locationType = :type', { type });
    }

    return query.getMany();
  }

  async getLocationsByType(
    type: LocationType,
    tenantId: string,
  ): Promise<Location[]> {
    return this.locationRepository.find({
      where: { locationType: type, tenantId },
      order: { name: 'ASC' },
    });
  }

  async findAll(tenantId: string): Promise<Location[]> {
    return this.findAllLocations(tenantId);
  }

  async findOne(id: string): Promise<Location> {
    // For now, use a default tenant ID - in production this should come from context
    const defaultTenantId = '00000000-0000-0000-0000-000000000001';
    return this.findOneLocation(id, defaultTenantId);
  }

  async update(
    id: string,
    updateLocationDto: UpdateLocationDto,
  ): Promise<Location> {
    // For now, use a default tenant ID - in production this should come from context
    const defaultTenantId = '00000000-0000-0000-0000-000000000001';
    return this.updateLocation(id, updateLocationDto, defaultTenantId);
  }

  async remove(id: string): Promise<void> {
    // For now, use a default tenant ID - in production this should come from context
    const defaultTenantId = '00000000-0000-0000-0000-000000000001';
    return this.removeLocation(id, defaultTenantId);
  }
}
