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
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { TenantGuard } from '../auth/tenant.guard';
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
