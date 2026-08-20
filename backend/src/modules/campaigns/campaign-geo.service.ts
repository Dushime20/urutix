import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { CorridorCity, citySlug, haversineKm } from './campaign-planner';

const NOMINATIM = 'https://nominatim.openstreetmap.org/search';
const OVERPASS = 'https://overpass-api.de/api/interpreter';
const NOMINATIM_MAX = 40;
const HEADERS = {
  'User-Agent': 'UrutiXCampaign/1.0 (distribution-planner)',
  Accept: 'application/json',
  'Accept-Language': 'en',
};
const PLACE_TYPES = new Set([
  'city',
  'town',
  'municipality',
  'village',
  'hamlet',
  'suburb',
  'borough',
  'city_district',
  'quarter',
]);

@Injectable()
export class CampaignGeoService {
  private readonly logger = new Logger(CampaignGeoService.name);
  private readonly cache = new Map<string, { at: number; value: any }>();
  private lastNominatimAt = 0;

  async searchCities(query: string, limit = NOMINATIM_MAX): Promise<CorridorCity[]> {
    const q = query.trim();
    if (q.length < 2) return [];
    const take = Math.min(Math.max(limit, 1), NOMINATIM_MAX);
    const rows = await this.nominatim({
      q,
      format: 'json',
      addressdetails: 1,
      limit: NOMINATIM_MAX,
      dedupe: 1,
    });
    const worldwide = rows.filter((row) => this.isWorldwidePlace(row));
    const source = worldwide.length ? worldwide : rows;
    const ranked = [...source].sort((a, b) => this.placeRank(a) - this.placeRank(b));
    return this.uniqueCities(
      ranked.map((row) => this.toCity(row)).filter(Boolean) as CorridorCity[],
    ).slice(0, take);
  }

  async geocodeCity(query: string): Promise<CorridorCity | null> {
    const matches = await this.searchCities(query, 3);
    return matches[0] || null;
  }

  async geocodeMany(names: string[]): Promise<CorridorCity[]> {
    const cities: CorridorCity[] = [];
    for (const name of names) {
      const city = await this.geocodeCity(name);
      if (city) cities.push(city);
    }
    return this.uniqueCities(cities);
  }

  async citiesInCountries(countryHints: string[], limit: number, origin?: CorridorCity): Promise<CorridorCity[]> {
    const codes: string[] = [];
    for (const hint of countryHints) {
      const code = await this.countryCode(hint);
      if (code) codes.push(code);
    }
    if (!codes.length && origin?.countryCode) codes.push(origin.countryCode);
    const collected: CorridorCity[] = [];
    for (const code of codes) {
      const batch = await this.overpassCitiesInCountry(code, Math.max(limit, 8));
      collected.push(...batch);
    }
    const unique = this.uniqueCities(collected).filter(
      (city) => !origin || citySlug(city.name, city.countryCode) !== citySlug(origin.name, origin.countryCode),
    );
    unique.sort((a, b) => {
      if (!origin) return a.name.localeCompare(b.name);
      return haversineKm(origin.lat, origin.lng, a.lat, a.lng) - haversineKm(origin.lat, origin.lng, b.lat, b.lng);
    });
    return unique.slice(0, Math.min(Math.max(limit, 1), 40));
  }

  async nearbyCities(origin: CorridorCity, limit: number): Promise<CorridorCity[]> {
    const cached = this.getCache(`near:${origin.lat}:${origin.lng}:${limit}`);
    if (cached) return cached;
    try {
      const radiusM = 1_200_000;
      const query = `
        [out:json][timeout:25];
        (
          node["place"="city"](around:${radiusM},${origin.lat},${origin.lng});
        );
        out body;
      `;
      const response = await axios.post(OVERPASS, query, {
        headers: { ...HEADERS, 'Content-Type': 'text/plain' },
        timeout: 28000,
      });
      const elements = response.data?.elements || [];
      const cities = this.uniqueCities(
        elements
          .map((el: any) => this.fromOverpass(el))
          .filter(Boolean) as CorridorCity[],
      ).filter((city) => citySlug(city.name, city.countryCode) !== citySlug(origin.name, origin.countryCode));
      cities.sort((a, b) => haversineKm(origin.lat, origin.lng, a.lat, a.lng) - haversineKm(origin.lat, origin.lng, b.lat, b.lng));
      const result = cities.slice(0, Math.min(Math.max(limit, 1), 40));
      this.setCache(`near:${origin.lat}:${origin.lng}:${limit}`, result);
      return result;
    } catch (err: any) {
      this.logger.warn(`Overpass nearby cities failed: ${err?.message}`);
      return this.searchCities(`cities near ${origin.name} ${origin.country}`, limit);
    }
  }

  private async overpassCitiesInCountry(countryCode: string, limit: number): Promise<CorridorCity[]> {
    const cached = this.getCache(`cc:${countryCode}:${limit}`);
    if (cached) return cached;
    try {
      const query = `
        [out:json][timeout:25];
        area["ISO3166-1"="${countryCode.toUpperCase()}"][admin_level=2]->.c;
        (
          node["place"="city"](area.c);
        );
        out body;
      `;
      const response = await axios.post(OVERPASS, query, {
        headers: { ...HEADERS, 'Content-Type': 'text/plain' },
        timeout: 28000,
      });
      const cities = this.uniqueCities(
        (response.data?.elements || [])
          .map((el: any) => this.fromOverpass(el, countryCode))
          .filter(Boolean) as CorridorCity[],
      );
      const result = cities.slice(0, Math.max(limit, 8));
      this.setCache(`cc:${countryCode}:${limit}`, result);
      return result;
    } catch (err: any) {
      this.logger.warn(`Overpass country ${countryCode} failed: ${err?.message}`);
      return this.searchCities(`city ${countryCode}`, limit);
    }
  }

  private async countryCode(hint: string): Promise<string | null> {
    const geocoded = await this.geocodeCity(hint);
    return geocoded?.countryCode || null;
  }

  private async nominatim(params: Record<string, string | number>) {
    const now = Date.now();
    const wait = 1100 - (now - this.lastNominatimAt);
    if (wait > 0) await new Promise((resolve) => setTimeout(resolve, wait));
    this.lastNominatimAt = Date.now();
    const response = await axios.get(NOMINATIM, { params, headers: HEADERS, timeout: 12000 });
    return Array.isArray(response.data) ? response.data : [];
  }

  private isWorldwidePlace(row: any): boolean {
    if (row?.class === 'place' && PLACE_TYPES.has(String(row.type || '').toLowerCase())) return true;
    const rank = Number(row?.place_rank);
    return row?.class === 'boundary' && row?.type === 'administrative' && Number.isFinite(rank) && rank <= 16;
  }

  private placeRank(row: any): number {
    const type = String(row?.type || '').toLowerCase();
    const order = ['city', 'municipality', 'town', 'village', 'suburb', 'borough', 'city_district', 'quarter', 'hamlet'];
    const idx = order.indexOf(type);
    return idx === -1 ? 20 : idx;
  }

  private toCity(row: any): CorridorCity | null {
    const name = row.name || row.display_name?.split(',')[0];
    const lat = Number(row.lat);
    const lng = Number(row.lon);
    if (!name || !Number.isFinite(lat) || !Number.isFinite(lng)) return null;
    const countryCode = (row.address?.country_code || '').toUpperCase();
    const region = row.address?.state || row.address?.county || row.address?.region || '';
    const osmKey = row.osm_id ? `${row.osm_type || 'n'}-${row.osm_id}` : `${lat.toFixed(4)}-${lng.toFixed(4)}`;
    return {
      id: `osm-${osmKey}`,
      name,
      country: row.address?.country || '',
      countryCode: countryCode || 'XX',
      region,
      lat,
      lng,
    };
  }

  private fromOverpass(el: any, fallbackCc?: string): CorridorCity | null {
    const name = el.tags?.name;
    const lat = Number(el.lat);
    const lng = Number(el.lon);
    if (!name || !Number.isFinite(lat) || !Number.isFinite(lng)) return null;
    const countryCode = (el.tags?.['ISO3166-1'] || fallbackCc || '').toUpperCase() || 'XX';
    const country = el.tags?.['addr:country'] || countryCode;
    return {
      id: citySlug(name, countryCode),
      name,
      country,
      countryCode,
      lat,
      lng,
    };
  }

  private uniqueCities(cities: CorridorCity[]): CorridorCity[] {
    const seen = new Set<string>();
    return cities.filter((city) => {
      const key = city.id || citySlug(city.name, city.countryCode);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  private getCache(key: string) {
    const hit = this.cache.get(key);
    if (!hit) return null;
    if (Date.now() - hit.at > 12 * 60 * 60 * 1000) {
      this.cache.delete(key);
      return null;
    }
    return hit.value;
  }

  private setCache(key: string, value: any) {
    this.cache.set(key, { at: Date.now(), value });
  }
}
