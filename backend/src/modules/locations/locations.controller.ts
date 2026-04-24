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
  Logger,
} from '@nestjs/common';
import axios from 'axios';
import * as https from 'https';
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
  private readonly logger = new Logger(LocationsController.name);

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

      this.logger.log(`Querying OSM fuel stations: lat=${latitude} lng=${longitude} radius=${radiusM}m`);

      // Use native https — axios sends Accept: application/json by default
      // which Overpass rejects with 406. Native https sends no Accept header.
      const data: any = await new Promise((resolve, reject) => {
        const encoded = encodeURIComponent(query);
        const options = {
          hostname: 'overpass-api.de',
          path: `/api/interpreter?data=${encoded}`,
          method: 'GET',
          headers: { 'User-Agent': 'UrutiX-Fleet/1.0' },
        };
        const req = https.request(options, (res) => {
          let body = '';
          res.on('data', (chunk) => (body += chunk));
          res.on('end', () => {
            if (res.statusCode !== 200) {
              reject(new Error(`Overpass returned ${res.statusCode}`));
              return;
            }
            try { resolve(JSON.parse(body)); }
            catch (e) { reject(new Error('Invalid JSON from Overpass')); }
          });
        });
        req.setTimeout(30000, () => { req.destroy(); reject(new Error('Overpass timeout')); });
        req.on('error', reject);
        req.end();
      });

      this.logger.log(`OSM returned ${data.elements?.length ?? 0} elements`);

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
          const hasDiesel = tags['fuel:diesel'] === 'yes' || tags['fuel:HGV_diesel'] === 'yes';
          const hasPetrol = tags['fuel:octane_95'] === 'yes' || tags['fuel:octane_91'] === 'yes';
          const fuelType = hasDiesel && hasPetrol ? 'Diesel & Petrol'
            : hasDiesel ? 'Diesel'
            : hasPetrol ? 'Petrol'
            : 'Fuel';

          return {
            id: String(el.id),
            name: tags.name || tags.brand || tags.operator || 'Fuel Station',
            address: [tags['addr:street'], tags['addr:housenumber'], tags['addr:city']]
              .filter(Boolean).join(' ') || tags['addr:full'] || null,
            distanceKm: Math.round(distanceKm * 10) / 10,
            fuelType,
            brand: tags.brand || null,
            phone: tags.phone || tags['contact:phone'] || null,
            openingHours: tags.opening_hours || null,
            coordinates: { latitude: lat2, longitude: lng2 },
          };
        })
        .filter(Boolean)
        .sort((a: any, b: any) => a.distanceKm - b.distanceKm)
        .slice(0, 15);

      return { stations, source: 'OpenStreetMap', count: stations.length };
    } catch (err: any) {
      this.logger.error(`Fuel stations query failed: ${err.message}`);
      return { stations: [], error: 'Failed to fetch fuel stations. Please try again.' };
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
