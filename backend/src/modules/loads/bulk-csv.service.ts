import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Load, LoadStatus, CargoType, UrgencyLevel } from '../../entities/load.entity';
import { BulkCsvResult, CsvLoadRow } from './dto/bulk-csv.dto';

@Injectable()
export class BulkCsvService {
  private readonly logger = new Logger(BulkCsvService.name);

  constructor(
    @InjectRepository(Load)
    private readonly loadRepository: Repository<Load>,
  ) {}

  async processCSV(
    csvBuffer: Buffer,
    userId: string,
    tenantId: string,
  ): Promise<BulkCsvResult> {
    const content = csvBuffer.toString('utf-8');
    const lines = content.split('\n').map((l) => l.trim()).filter(Boolean);

    if (lines.length < 2) {
      throw new BadRequestException('CSV must have a header row and at least one data row');
    }

    const headers = lines[0].split(',').map((h) => h.trim().toLowerCase().replace(/\s+/g, ''));
    const result: BulkCsvResult = { created: 0, failed: 0, errors: [], loadIds: [] };

    const REQUIRED = ['origin', 'destination', 'weight', 'pickupdate', 'deliverydate', 'offeredprice'];
    const missing = REQUIRED.filter((r) => !headers.includes(r));
    if (missing.length > 0) {
      throw new BadRequestException(`Missing required CSV columns: ${missing.join(', ')}`);
    }

    for (let i = 1; i < lines.length; i++) {
      const rowNum = i + 1;
      try {
        const values = this.parseCSVLine(lines[i]);
        const row: Record<string, string> = {};
        headers.forEach((h, idx) => { row[h] = values[idx] ?? ''; });

        // Validate required fields
        if (!row.origin || !row.destination) {
          throw new Error('origin and destination are required');
        }
        if (!row.weight || isNaN(Number(row.weight))) {
          throw new Error('weight must be a valid number');
        }
        if (!row.offeredprice || isNaN(Number(row.offeredprice))) {
          throw new Error('offeredPrice must be a valid number');
        }

        const pickupDate = new Date(row.pickupdate);
        const deliveryDate = new Date(row.deliverydate);
        if (isNaN(pickupDate.getTime())) throw new Error('pickupDate is invalid');
        if (isNaN(deliveryDate.getTime())) throw new Error('deliveryDate is invalid');
        if (deliveryDate < pickupDate) throw new Error('deliveryDate cannot be before pickupDate');

        const load = this.loadRepository.create({
          tenantId,
          cargoOwnerId: userId,
          title: row.title || `${row.origin} → ${row.destination}`,
          description: row.description || '',
          weight: Number(row.weight),
          offeredPrice: Number(row.offeredprice),
          currencyCode: row.currency || 'KES',
          cargoType: (row.cargotype?.toUpperCase() as CargoType) || CargoType.GENERAL,
          urgencyLevel: (row.urgencylevel?.toUpperCase() as UrgencyLevel) || UrgencyLevel.NORMAL,
          pickupDate,
          deliveryDate,
          status: LoadStatus.CREATED,
          loadValue: Number(row.offeredprice),
          locations: [
            {
              id: `pickup-${Date.now()}`,
              type: 'PICKUP',
              sequence: 1,
              locationData: {
                name: row.origin,
                address: row.origin,
                coordinates: { latitude: 0, longitude: 0 },
              },
              scheduledDate: pickupDate,
              estimatedTime: 60,
            },
            {
              id: `delivery-${Date.now()}`,
              type: 'DELIVERY',
              sequence: 2,
              locationData: {
                name: row.destination,
                address: row.destination,
                coordinates: { latitude: 0, longitude: 0 },
              },
              scheduledDate: deliveryDate,
              estimatedTime: 60,
            },
          ],
          autoMatchEnabled: false,
          isFragile: false,
          isHazardous: false,
          requiresRefrigeration: false,
          isStackable: false,
          requiresHumidityControl: false,
          requiresForklift: false,
          requiresCrane: false,
          requiresLoadingDock: false,
          isTimeCritical: false,
          requiresGpsMonitoring: false,
          requiresTemperatureMonitoring: false,
          requiresLowClearanceRoute: false,
          requiresEscortVehicle: false,
          requiresPreShipmentInspection: false,
          requiresDeliveryInspection: false,
          requiresPhotographicDocumentation: false,
          numberOfPieces: 0,
          numberOfPallets: 0,
          rating: 0,
          viewCount: 0,
        } as any);

        const saved = await this.loadRepository.save(load);
        const savedLoad = Array.isArray(saved) ? saved[0] : saved;
        result.loadIds.push(savedLoad.id);
        result.created++;
      } catch (err) {
        result.failed++;
        result.errors.push({ row: rowNum, message: err.message });
        this.logger.warn(`CSV row ${rowNum} failed: ${err.message}`);
      }
    }

    this.logger.log(`CSV bulk upload: ${result.created} created, ${result.failed} failed`);
    return result;
  }

  private parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    for (const char of line) {
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  }

  getCSVTemplate(): string {
    return [
      'origin,destination,weight,cargoType,pickupDate,deliveryDate,offeredPrice,currency,urgencyLevel,title,description',
      'Nairobi,Mombasa,5000,GENERAL,2026-07-01,2026-07-02,50000,KES,STANDARD,Sample Load,Sample description',
    ].join('\n');
  }
}
