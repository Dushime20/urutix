import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { LocationsService } from './locations.service';
import {
  LocationUtilsService,
  LocationSearchCriteria,
} from './location-utils.service';
import { OpenStreetMapLocationService } from './openstreetmap-location.service';
import { OSMLocationEnrichmentService } from './osm-location-enrichment.service';
import { CreateLocationDto } from './dto/create-location.dto';
import { UpdateLocationDto } from './dto/update-location.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../auth/guards/tenant.guard';
import { GetTenant } from '../auth/decorators/tenant.decorator';

@Controller('locations')
@UseGuards(JwtAuthGuard, TenantGuard)
export class LocationsController {
  constructor(
    private readonly locationsService: LocationsService,
    private readonly locationUtilsService: LocationUtilsService,
    private readonly osmLocationService: OpenStreetMapLocationService,
    private readonly osmEnrichmentService: OSMLocationEnrichmentService,
  ) {}

  @Post()
  create(
    @Body() createLocationDto: CreateLocationDto,
    @GetTenant() tenantId: string,
  ) {
    return this.locationsService.createLocation(createLocationDto, tenantId);
  }

  @Get()
  findAll(@GetTenant() tenantId: string) {
    return this.locationsService.findAll(tenantId);
  }

  @Get('search')
  async searchLocations(
    @Query() searchCriteria: LocationSearchCriteria,
    @GetTenant() tenantId: string,
  ) {
    return this.locationUtilsService.searchLocations(searchCriteria, tenantId);
  }

  @Get('intelligence/:id')
  async getLocationIntelligence(@Param('id') id: string) {
    return this.locationUtilsService.getLocationIntelligence(id);
  }

  @Get('popular')
  async getPopularLocations(
    @GetTenant() tenantId: string,
    @Query('limit') limit: string = '10',
  ) {
    return this.locationUtilsService.getPopularLocations(
      tenantId,
      parseInt(limit),
    );
  }

  @Get('categories')
  async getLocationCategories(@GetTenant() tenantId: string) {
    return this.locationUtilsService.getLocationCategories(tenantId);
  }

  @Get('statistics')
  async getLocationStatistics(@GetTenant() tenantId: string) {
    return this.locationUtilsService.getLocationStatistics(tenantId);
  }

  @Post('validate')
  async validateLocationData(@Body() locationData: any) {
    return this.locationUtilsService.validateLocationData(locationData);
  }

  // OpenStreetMap specific endpoints
  @Post('osm/geocode')
  async getOSMGeocoding(
    @Body() coordinates: { latitude: number; longitude: number },
  ) {
    return this.osmLocationService.getGeocodingData(coordinates);
  }

  @Post('osm/poi')
  async getOSMPOIData(
    @Body() coordinates: { latitude: number; longitude: number },
    @Query('radius') radius: string = '5000',
  ) {
    return this.osmLocationService.getPOIData(coordinates, parseInt(radius));
  }

  @Post('osm/enrich-cargo')
  async enrichCargoWithOSM(@Body() cargoData: any) {
    return this.osmEnrichmentService.enrichCargoLocations(cargoData);
  }

  @Post('osm/enrich-location')
  async enrichLocationWithOSM(@Body() locationData: any) {
    return this.osmEnrichmentService.enrichLocation(locationData);
  }

  @Get('osm/cache/clear')
  async clearOSMCache() {
    this.osmLocationService.clearCache();
    this.osmEnrichmentService.clearCache();
    return { message: 'OSM cache cleared successfully' };
  }

  @Get('osm/cache/stats')
  async getOSMCacheStats() {
    const osmStats = this.osmLocationService.getCacheStatistics();
    const enrichmentStats = this.osmEnrichmentService.getCacheStatistics();
    return {
      osmLocationService: osmStats,
      osmEnrichmentService: enrichmentStats,
      total: osmStats.size + enrichmentStats.size,
    };
  }

  /**
   * Find nearby fuel stations using OpenStreetMap Overpass API.
   * Primary: OSM (no API key required).
   * Returns stations sorted by distance from the provided coordinates.
   */
  @Get('fuel-stations')
  async getNearbyFuelStations(
    @Query('lat') lat: string,
    @Query('lng') lng: string,
    @Query('radius') radius: string = '5000',
  ) {
    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);
    const radiusM = Math.min(parseInt(radius) || 5000, 20000); // cap at 20 km

    if (isNaN(latitude) || isNaN(longitude)) {
      return { stations: [], error: 'Invalid coordinates' };
    }

    try {
      const query = `
        [out:json][timeout:25];
        (
          node["amenity"="fuel"](around:${radiusM},${latitude},${longitude});
          way["amenity"="fuel"](around:${radiusM},${latitude},${longitude});
        );
        out center tags;
      `;

      const response = await fetch(
        `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`,
      );
      const data = await response.json() as any;

      const stations = (data.elements || [])
        .map((el: any) => {
          const lat2 = el.lat ?? el.center?.lat;
          const lng2 = el.lon ?? el.center?.lon;
          if (!lat2 || !lng2) return null;

          // Haversine distance in km
          const R = 6371;
          const dLat = ((lat2 - latitude) * Math.PI) / 180;
          const dLng = ((lng2 - longitude) * Math.PI) / 180;
          const a =
            Math.sin(dLat / 2) ** 2 +
            Math.cos((latitude * Math.PI) / 180) *
              Math.cos((lat2 * Math.PI) / 180) *
              Math.sin(dLng / 2) ** 2;
          const distanceKm = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

          const tags = el.tags || {};
          return {
            id: String(el.id),
            name: tags.name || tags.brand || tags.operator || 'Fuel Station',
            address: [tags['addr:street'], tags['addr:city']]
              .filter(Boolean)
              .join(', ') || tags['addr:full'] || null,
            distanceKm: Math.round(distanceKm * 10) / 10,
            fuelType: tags.fuel || tags['fuel:diesel'] ? 'Diesel' : 'Petrol/Diesel',
            brand: tags.brand || null,
            openNow: tags.opening_hours ? null : null, // OSM doesn't reliably expose this
            coordinates: { latitude: lat2, longitude: lng2 },
          };
        })
        .filter(Boolean)
        .sort((a: any, b: any) => a.distanceKm - b.distanceKm)
        .slice(0, 10);

      return { stations };
    } catch (err) {
      return { stations: [], error: 'Failed to fetch fuel stations' };
    }
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.locationsService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateLocationDto: UpdateLocationDto,
  ) {
    return this.locationsService.update(id, updateLocationDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.locationsService.remove(id);
  }
}
