import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Driver } from '../../entities/driver.entity';
import { Truck } from '../../entities/truck.entity';

export interface ComplianceStatus {
  isCompliant: boolean;
  issues: string[];
  expiringItems: Array<{ item: string; expiresAt: Date; daysLeft: number }>;
}

@Injectable()
export class ComplianceGateService {
  private readonly logger = new Logger(ComplianceGateService.name);

  constructor(
    @InjectRepository(Driver)
    private readonly driverRepository: Repository<Driver>,
    @InjectRepository(Truck)
    private readonly truckRepository: Repository<Truck>,
  ) {}

  async canAssignDriver(driverId: string): Promise<ComplianceStatus> {
    const driver = await this.driverRepository.findOne({ where: { id: driverId } });
    if (!driver) return { isCompliant: false, issues: ['Driver not found'], expiringItems: [] };

    const issues: string[] = [];
    const expiringItems: Array<{ item: string; expiresAt: Date; daysLeft: number }> = [];
    const today = new Date();

    // Check licence expiry
    if (driver.licenseExpiry) {
      const daysLeft = this.daysUntil(driver.licenseExpiry);
      if (daysLeft < 0) {
        issues.push(`Driver licence expired ${Math.abs(daysLeft)} days ago`);
      } else if (daysLeft <= 30) {
        expiringItems.push({ item: 'Driver Licence', expiresAt: driver.licenseExpiry, daysLeft });
      }
    }

    // Check medical cert expiry
    if (driver.medicalCertExpiry) {
      const daysLeft = this.daysUntil(driver.medicalCertExpiry);
      if (daysLeft < 0) {
        issues.push(`Medical certificate expired ${Math.abs(daysLeft)} days ago`);
      } else if (daysLeft <= 30) {
        expiringItems.push({ item: 'Medical Certificate', expiresAt: driver.medicalCertExpiry, daysLeft });
      }
    }

    return { isCompliant: issues.length === 0, issues, expiringItems };
  }

  async canAssignTruck(truckId: string): Promise<ComplianceStatus> {
    const truck = await this.truckRepository.findOne({ where: { id: truckId } });
    if (!truck) return { isCompliant: false, issues: ['Truck not found'], expiringItems: [] };

    const issues: string[] = [];
    const expiringItems: Array<{ item: string; expiresAt: Date; daysLeft: number }> = [];

    // Check insurance expiry from JSONB compliance field
    const compliance = (truck as any).compliance || {};

    if (compliance.insuranceExpiry) {
      const daysLeft = this.daysUntil(new Date(compliance.insuranceExpiry));
      if (daysLeft < 0) {
        issues.push(`Insurance expired ${Math.abs(daysLeft)} days ago`);
      } else if (daysLeft <= 30) {
        expiringItems.push({ item: 'Insurance', expiresAt: new Date(compliance.insuranceExpiry), daysLeft });
      }
    }

    if (compliance.registrationExpiry) {
      const daysLeft = this.daysUntil(new Date(compliance.registrationExpiry));
      if (daysLeft < 0) {
        issues.push(`Vehicle registration expired ${Math.abs(daysLeft)} days ago`);
      } else if (daysLeft <= 30) {
        expiringItems.push({ item: 'Vehicle Registration', expiresAt: new Date(compliance.registrationExpiry), daysLeft });
      }
    }

    if (compliance.roadworthyExpiry) {
      const daysLeft = this.daysUntil(new Date(compliance.roadworthyExpiry));
      if (daysLeft < 0) {
        issues.push(`Roadworthy certificate expired ${Math.abs(daysLeft)} days ago`);
      } else if (daysLeft <= 30) {
        expiringItems.push({ item: 'Roadworthy Certificate', expiresAt: new Date(compliance.roadworthyExpiry), daysLeft });
      }
    }

    return { isCompliant: issues.length === 0, issues, expiringItems };
  }

  async getTenantComplianceDashboard(tenantId: string): Promise<{
    drivers: { total: number; compliant: number; nonCompliant: number; expiringSoon: number };
    trucks: { total: number; compliant: number; nonCompliant: number; expiringSoon: number };
  }> {
    const drivers = await this.driverRepository.find({ where: { tenantId } });
    const trucks = await this.truckRepository.find({ where: { tenantId } });

    let driverCompliant = 0, driverNonCompliant = 0, driverExpiring = 0;
    for (const d of drivers) {
      const status = await this.canAssignDriver(d.id);
      if (!status.isCompliant) driverNonCompliant++;
      else if (status.expiringItems.length > 0) driverExpiring++;
      else driverCompliant++;
    }

    let truckCompliant = 0, truckNonCompliant = 0, truckExpiring = 0;
    for (const t of trucks) {
      const status = await this.canAssignTruck(t.id);
      if (!status.isCompliant) truckNonCompliant++;
      else if (status.expiringItems.length > 0) truckExpiring++;
      else truckCompliant++;
    }

    return {
      drivers: { total: drivers.length, compliant: driverCompliant, nonCompliant: driverNonCompliant, expiringSoon: driverExpiring },
      trucks: { total: trucks.length, compliant: truckCompliant, nonCompliant: truckNonCompliant, expiringSoon: truckExpiring },
    };
  }

  private daysUntil(date: Date): number {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(date);
    target.setHours(0, 0, 0, 0);
    return Math.floor((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  }
}
