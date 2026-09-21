import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Load } from '../../entities/load.entity';
import { Truck } from '../../entities/truck.entity';
import { User } from '../../entities/user.entity';
import { Trip } from '../../entities/trip.entity';
import { Payment } from '../../entities/payment.entity';
import { CreditTransaction } from '../../entities/credit-transaction.entity';
import { Driver } from '../../entities/driver.entity';
import { ParkingReservation } from '../../entities/parking-reservation.entity';
import { Invoice } from '../financial/entities/invoice.entity';
import { DisputeV2 } from '../../entities/dispute-v2.entity';
import { categoriesForKind, type TicketKind } from '../disputes/ticket-kind';

export type TenantReportCategory =
  | 'issues'
  | 'support'
  | 'disputes'
  | 'fleet'
  | 'drivers'
  | 'trips'
  | 'cargo'
  | 'parking'
  | 'users'
  | 'invoices'
  | 'payments'
  | 'credits';

export interface TenantReportQuery {
  category: TenantReportCategory;
  status?: string;
  priority?: string;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface TenantReportResult {
  title: string;
  category: TenantReportCategory;
  headers: string[];
  rows: Record<string, string | number>[];
  total: number;
}

const MAX_ROWS = 5000;
const REPORT_TITLES: Record<TenantReportCategory, string> = {
  issues: 'Issues',
  support: 'Support',
  disputes: 'Disputes',
  fleet: 'Fleet',
  drivers: 'Drivers',
  trips: 'Trips',
  cargo: 'Cargo',
  parking: 'Parking Reservations',
  users: 'Users',
  invoices: 'Invoices',
  payments: 'Payments',
  credits: 'Credits',
};

function fmtDate(value?: Date | string | null): string {
  if (!value) return '';
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime()) ? String(value) : d.toISOString().slice(0, 10);
}

function locName(loc?: { name?: string; address?: string; city?: string } | null): string {
  if (!loc) return '';
  return loc.name || loc.address || loc.city || '';
}

function matchesSearch(row: Record<string, string | number>, search?: string): boolean {
  if (!search?.trim()) return true;
  const q = search.trim().toLowerCase();
  return Object.values(row).some((v) => String(v).toLowerCase().includes(q));
}

function inRange(iso: string, from?: string, to?: string): boolean {
  if (!iso) return true;
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return true;
  if (from && t < new Date(from).setHours(0, 0, 0, 0)) return false;
  if (to) {
    const end = new Date(to);
    end.setHours(23, 59, 59, 999);
    if (t > end.getTime()) return false;
  }
  return true;
}

@Injectable()
export class TenantReportsService {
  constructor(
    @InjectRepository(Load) private readonly loadRepo: Repository<Load>,
    @InjectRepository(Truck) private readonly truckRepo: Repository<Truck>,
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    @InjectRepository(Trip) private readonly tripRepo: Repository<Trip>,
    @InjectRepository(Payment) private readonly paymentRepo: Repository<Payment>,
    @InjectRepository(CreditTransaction) private readonly creditRepo: Repository<CreditTransaction>,
    @InjectRepository(Driver) private readonly driverRepo: Repository<Driver>,
    @InjectRepository(ParkingReservation) private readonly parkingRepo: Repository<ParkingReservation>,
    @InjectRepository(Invoice) private readonly invoiceRepo: Repository<Invoice>,
    @InjectRepository(DisputeV2) private readonly disputeRepo: Repository<DisputeV2>,
  ) {}

  async generate(tenantId: string, query: TenantReportQuery): Promise<TenantReportResult> {
    const category = query.category;
    if (!REPORT_TITLES[category]) {
      throw new BadRequestException(`Unknown report category: ${category}`);
    }

    let rows: Record<string, string | number>[] = [];
    switch (category) {
      case 'issues':
      case 'support':
      case 'disputes': {
        const kind: TicketKind = category === 'issues' ? 'issue' : category === 'support' ? 'support' : 'dispute';
        rows = await this.ticketRows(tenantId, kind, query);
        break;
      }
      case 'fleet':
        rows = await this.fleetRows(tenantId, query.status);
        break;
      case 'drivers':
        rows = await this.driverRows(tenantId, query.status);
        break;
      case 'trips':
        rows = await this.tripRows(tenantId, query.status);
        break;
      case 'cargo':
        rows = await this.cargoRows(tenantId, query.status);
        break;
      case 'parking':
        rows = await this.parkingRows(tenantId, query.status);
        break;
      case 'users':
        rows = await this.userRows(tenantId, query.status);
        break;
      case 'invoices':
        rows = await this.invoiceRows(tenantId, query.status);
        break;
      case 'payments':
        rows = await this.paymentRows(tenantId, query.status);
        break;
      case 'credits':
        rows = await this.creditRows(tenantId, query.status);
        break;
    }

    rows = rows.filter((row) => {
      if (!matchesSearch(row, query.search)) return false;
      const dateVal = String(row.Created || row.Issued || row.Start || row.Hired || row.PickupDate || '');
      return inRange(dateVal, query.dateFrom, query.dateTo);
    });

    const headers = rows[0] ? Object.keys(rows[0]) : this.defaultHeaders(category);
    return {
      title: REPORT_TITLES[category],
      category,
      headers,
      rows: rows.slice(0, MAX_ROWS),
      total: rows.length,
    };
  }

  toCsv(report: TenantReportResult): string {
    const esc = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    return [
      report.headers.map(esc).join(','),
      ...report.rows.map((r) => report.headers.map((h) => esc(r[h])).join(',')),
    ].join('\n');
  }

  private defaultHeaders(category: TenantReportCategory): string[] {
    if (category === 'issues' || category === 'support' || category === 'disputes') {
      return ['Ticket', 'Title', 'Category', 'Priority', 'Status', 'Reporter', 'Assigned', 'Created'];
    }
    return ['Result'];
  }

  private async ticketRows(tenantId: string, kind: TicketKind, query: TenantReportQuery) {
    const qb = this.disputeRepo
      .createQueryBuilder('d')
      .leftJoinAndSelect('d.complainant', 'complainant')
      .leftJoinAndSelect('complainant.profile', 'cProfile')
      .leftJoinAndSelect('d.assignedTo', 'assignedTo')
      .leftJoinAndSelect('assignedTo.profile', 'aProfile')
      .where('d.tenantId = :tenantId', { tenantId })
      .andWhere('d.deleted_at IS NULL')
      .andWhere('d.category IN (:...cats)', { cats: categoriesForKind(kind) })
      .orderBy('d.createdAt', 'DESC')
      .take(MAX_ROWS);
    if (query.status) qb.andWhere('d.status = :status', { status: query.status });
    if (query.priority) qb.andWhere('d.priority = :priority', { priority: query.priority });
    const items = await qb.getMany();
    return items.map((d) => ({
      Ticket: d.ticketNumber || d.referenceNumber || '',
      Title: d.title || '',
      Category: d.category || '',
      Priority: d.priority || '',
      Status: d.status || '',
      Reporter: this.userName(d.complainant),
      Assigned: d.assignedTo ? this.userName(d.assignedTo) : '',
      Created: fmtDate(d.createdAt),
    }));
  }

  private async fleetRows(tenantId: string, status?: string) {
    const where: any = { tenantId };
    if (status) where.status = status;
    const trucks = await this.truckRepo.find({ where, take: MAX_ROWS, order: { createdAt: 'DESC' } });
    return trucks.map((t) => ({
      Plate: t.plateNumber || '',
      Make: t.make || '',
      Model: t.model || '',
      Type: t.truckType || '',
      Status: t.status || '',
      Mileage: t.mileage ?? '',
      Insurance: fmtDate(t.insuranceExpiry),
      Roadworthy: fmtDate(t.roadworthyCertExpiry),
      Created: fmtDate(t.createdAt),
    }));
  }

  private async driverRows(tenantId: string, status?: string) {
    const where: any = { tenantId };
    if (status) where.status = status;
    const drivers = await this.driverRepo.find({ where, take: MAX_ROWS, order: { createdAt: 'DESC' } });
    return drivers.map((d) => ({
      Name: `${d.firstName || ''} ${d.lastName || ''}`.trim(),
      Email: d.email || '',
      Phone: d.phone || '',
      License: d.licenseNumber || '',
      Status: d.status || '',
      Availability: d.availabilityStatus || '',
      Trips: d.totalTrips ?? '',
      Rating: d.rating ?? '',
      Hired: fmtDate(d.hireDate),
    }));
  }

  private async tripRows(tenantId: string, status?: string) {
    const qb = this.tripRepo
      .createQueryBuilder('t')
      .leftJoinAndSelect('t.pickupLocation', 'pickup')
      .leftJoinAndSelect('t.deliveryLocation', 'delivery')
      .leftJoinAndSelect('t.truck', 'truck')
      .where('t.tenantId = :tenantId', { tenantId })
      .orderBy('t.createdAt', 'DESC')
      .take(MAX_ROWS);
    if (status) qb.andWhere('t.status = :status', { status });
    const trips = await qb.getMany();
    return trips.map((t) => ({
      Trip: t.tripNumber || t.id,
      Status: t.status || '',
      Origin: locName(t.pickupLocation),
      Destination: locName(t.deliveryLocation),
      Truck: t.truck?.plateNumber || t.truckId || '',
      Price: t.agreedPrice ?? '',
      Start: fmtDate(t.plannedStartTime || t.actualStartTime),
      End: fmtDate(t.plannedEndTime || t.actualEndTime),
      Created: fmtDate(t.createdAt),
    }));
  }

  private async cargoRows(tenantId: string, status?: string) {
    const where: any = { tenantId };
    if (status) where.status = status;
    const loads = await this.loadRepo.find({ where, take: MAX_ROWS, order: { createdAt: 'DESC' } });
    return loads.map((c) => ({
      Title: c.title || c.id,
      Type: c.cargoType || c.loadType || '',
      Status: c.status || '',
      Weight: c.weight ?? '',
      Pickup: locName(c.origin),
      Delivery: locName(c.destination),
      Value: c.offeredPrice ?? c.loadValue ?? '',
      PickupDate: fmtDate(c.pickupDate),
      Created: fmtDate(c.createdAt),
    }));
  }

  private async parkingRows(tenantId: string, status?: string) {
    const where: any = { tenantId };
    if (status) where.status = status;
    const items = await this.parkingRepo.find({ where, take: MAX_ROWS, order: { createdAt: 'DESC' } });
    return items.map((p) => ({
      Reference: p.reservationReference || '',
      Company: p.companyName || '',
      Driver: `${p.driverFirstName || ''} ${p.driverLastName || ''}`.trim(),
      Spaces: p.truckSpacesRequested ?? '',
      Status: p.status || '',
      Start: fmtDate(p.requestedStartDate),
      End: fmtDate(p.contractEndDate),
      Created: fmtDate(p.createdAt),
    }));
  }

  private async userRows(tenantId: string, status?: string) {
    const qb = this.userRepo
      .createQueryBuilder('u')
      .leftJoinAndSelect('u.profile', 'profile')
      .where('u.tenantId = :tenantId', { tenantId })
      .orderBy('u.createdAt', 'DESC')
      .take(MAX_ROWS);
    if (status) qb.andWhere('u.status = :status', { status });
    const users = await qb.getMany();
    return users.map((u) => ({
      Name: `${u.profile?.firstName || ''} ${u.profile?.lastName || ''}`.trim() || u.email,
      Email: u.email || '',
      Role: u.role || '',
      Status: u.status || '',
      Company: u.profile?.companyName || '',
      Created: fmtDate(u.createdAt),
    }));
  }

  private async invoiceRows(tenantId: string, status?: string) {
    const qb = this.invoiceRepo
      .createQueryBuilder('inv')
      .innerJoin('inv.tenant', 'tenant')
      .where('tenant.id = :tenantId', { tenantId })
      .orderBy('inv.createdAt', 'DESC')
      .take(MAX_ROWS);
    if (status) qb.andWhere('LOWER(CAST(inv.status AS TEXT)) = :status', { status: status.toLowerCase() });
    const invoices = await qb.getMany();
    return invoices.map((i) => ({
      Invoice: i.invoiceNumber || i.id,
      Customer: i.customerName || '',
      Amount: i.totalAmount ?? '',
      Status: i.status || '',
      Issued: fmtDate(i.issueDate || i.createdAt),
      Due: fmtDate(i.dueDate),
      Paid: fmtDate(i.paidDate),
    }));
  }

  private async paymentRows(tenantId: string, status?: string) {
    const where: any = { tenantId };
    if (status) where.status = status.toLowerCase();
    const payments = await this.paymentRepo.find({ where, take: MAX_ROWS, order: { createdAt: 'DESC' } });
    return payments.map((p) => ({
      Reference: p.referenceNumber || p.id,
      Amount: p.amount ?? '',
      Currency: p.currency || '',
      Status: p.status || '',
      Method: p.paymentMethod || '',
      Type: p.paymentType || '',
      Created: fmtDate(p.createdAt),
    }));
  }

  private async creditRows(tenantId: string, status?: string) {
    const where: any = { tenantId };
    if (status) where.type = status;
    const txs = await this.creditRepo.find({ where, take: MAX_ROWS, order: { createdAt: 'DESC' } });
    return txs.map((t) => ({
      Type: t.type || '',
      Amount: t.amount ?? '',
      Balance: t.balanceAfter ?? '',
      Reason: t.description || '',
      Source: t.referenceType || '',
      Created: fmtDate(t.createdAt),
    }));
  }

  private userName(user?: User | null): string {
    if (!user) return '';
    const first = user.profile?.firstName || '';
    const last = user.profile?.lastName || '';
    const name = `${first} ${last}`.trim();
    return name || user.email || '';
  }
}
