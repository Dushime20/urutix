import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GeofenceZone, GeofenceZoneType } from '../../entities/geofence-zone.entity';
import { Notification } from '../../entities/notification.entity';

export interface CreateGeofenceDto {
  name: string;
  type: GeofenceZoneType;
  polygon: Array<{ lat: number; lng: number }>;
  alertOnEnter?: boolean;
  alertOnExit?: boolean;
  linkedLoadId?: string;
}

interface BreachEvent {
  zoneId: string;
  zoneName: string;
  type: 'ENTER' | 'EXIT';
  tripId: string;
  lat: number;
  lng: number;
  timestamp: Date;
}

// Track last known zone membership per trip to detect enter/exit
const tripZoneCache = new Map<string, Set<string>>();

@Injectable()
export class GeofencingService {
  private readonly logger = new Logger(GeofencingService.name);

  constructor(
    @InjectRepository(GeofenceZone)
    private readonly zoneRepository: Repository<GeofenceZone>,
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
  ) {}

  // ─── CRUD ────────────────────────────────────────────────────────────────────

  async create(dto: CreateGeofenceDto, tenantId: string): Promise<GeofenceZone> {
    const center = this.calculateCenter(dto.polygon);
    const zone = this.zoneRepository.create({
      ...dto,
      tenantId,
      centerLat: center.lat,
      centerLng: center.lng,
      radiusMeters: this.calculateRadius(dto.polygon, center),
      alertOnEnter: dto.alertOnEnter ?? true,
      alertOnExit: dto.alertOnExit ?? true,
    });
    return this.zoneRepository.save(zone);
  }

  async findAll(tenantId: string): Promise<GeofenceZone[]> {
    return this.zoneRepository.find({ where: { tenantId, isActive: true } });
  }

  async findOne(id: string, tenantId: string): Promise<GeofenceZone> {
    const zone = await this.zoneRepository.findOne({ where: { id, tenantId } });
    if (!zone) throw new NotFoundException(`Geofence zone ${id} not found`);
    return zone;
  }

  async update(id: string, dto: Partial<CreateGeofenceDto>, tenantId: string): Promise<GeofenceZone> {
    const zone = await this.findOne(id, tenantId);
    if (dto.polygon) {
      const center = this.calculateCenter(dto.polygon);
      dto['centerLat'] = center.lat;
      dto['centerLng'] = center.lng;
      dto['radiusMeters'] = this.calculateRadius(dto.polygon, center);
    }
    Object.assign(zone, dto);
    return this.zoneRepository.save(zone);
  }

  async remove(id: string, tenantId: string): Promise<void> {
    await this.zoneRepository.update({ id, tenantId }, { isActive: false });
  }

  // ─── Breach detection (called on each GPS ping) ───────────────────────────────

  async checkBreaches(
    tripId: string,
    tenantId: string,
    lat: number,
    lng: number,
    driverUserId: string,
  ): Promise<BreachEvent[]> {
    const zones = await this.zoneRepository.find({ where: { tenantId, isActive: true } });
    const breaches: BreachEvent[] = [];

    const prevZones = tripZoneCache.get(tripId) ?? new Set<string>();
    const currentZones = new Set<string>();

    for (const zone of zones) {
      const inside = this.isPointInPolygon(lat, lng, zone.polygon);
      if (inside) currentZones.add(zone.id);

      const wasInside = prevZones.has(zone.id);

      if (inside && !wasInside && zone.alertOnEnter) {
        // ENTER event
        const breach: BreachEvent = { zoneId: zone.id, zoneName: zone.name, type: 'ENTER', tripId, lat, lng, timestamp: new Date() };
        breaches.push(breach);
        await this.fireBreachAlert(breach, driverUserId, tenantId);
      } else if (!inside && wasInside && zone.alertOnExit) {
        // EXIT event
        const breach: BreachEvent = { zoneId: zone.id, zoneName: zone.name, type: 'EXIT', tripId, lat, lng, timestamp: new Date() };
        breaches.push(breach);
        await this.fireBreachAlert(breach, driverUserId, tenantId);
      }
    }

    tripZoneCache.set(tripId, currentZones);
    return breaches;
  }

  // ─── Point-in-polygon (Ray casting algorithm) ────────────────────────────────

  private isPointInPolygon(lat: number, lng: number, polygon: Array<{ lat: number; lng: number }>): boolean {
    let inside = false;
    const n = polygon.length;
    for (let i = 0, j = n - 1; i < n; j = i++) {
      const xi = polygon[i].lng, yi = polygon[i].lat;
      const xj = polygon[j].lng, yj = polygon[j].lat;
      const intersect =
        yi > lat !== yj > lat && lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi;
      if (intersect) inside = !inside;
    }
    return inside;
  }

  private calculateCenter(polygon: Array<{ lat: number; lng: number }>): { lat: number; lng: number } {
    const lat = polygon.reduce((s, p) => s + p.lat, 0) / polygon.length;
    const lng = polygon.reduce((s, p) => s + p.lng, 0) / polygon.length;
    return { lat, lng };
  }

  private calculateRadius(polygon: Array<{ lat: number; lng: number }>, center: { lat: number; lng: number }): number {
    return Math.max(
      ...polygon.map((p) => this.haversineMeters(center.lat, center.lng, p.lat, p.lng)),
    );
  }

  private haversineMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371000;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  private async fireBreachAlert(breach: BreachEvent, userId: string, tenantId: string): Promise<void> {
    try {
      await this.notificationRepository.save(
        this.notificationRepository.create({
          userId,
          tenantId,
          title: `Geofence ${breach.type}: ${breach.zoneName}`,
          message: `Trip ${breach.tripId} ${breach.type === 'ENTER' ? 'entered' : 'exited'} zone "${breach.zoneName}" at ${breach.timestamp.toISOString()}`,
          type: 'GEOFENCE_BREACH' as any,
          isRead: false,
          metadata: breach,
        } as any),
      );
    } catch (err) {
      this.logger.error(`Failed to fire geofence breach alert: ${err.message}`);
    }
  }
}
