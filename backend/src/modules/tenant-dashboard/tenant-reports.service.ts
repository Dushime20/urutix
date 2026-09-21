import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Repository, SelectQueryBuilder } from 'typeorm';
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
import { LoanRequest } from '../../entities/loan-request.entity';
import { LoanRepayment } from '../../entities/loan-repayment.entity';
import { CustomsInspection } from '../../entities/customs-inspection.entity';
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
  | 'credits'
  | 'loans'
  | 'repayments'
  | 'inspections';

export interface TenantReportQuery {
  category: TenantReportCategory;
  status?: string;
  priority?: string;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface ReportScope {
  userId: string;
  role: string;
  tenantId: string;
  email?: string;
}

export interface TenantReportResult {
  title: string;
  category: TenantReportCategory;
  headers: string[];
  rows: Record<string, string | number>[];
  total: number;
}

const MAX_ROWS = 5000;
const TICKETS: TenantReportCategory[] = ['issues', 'support', 'disputes'];
const ELEVATED_ROLES = new Set(['SUPER_ADMIN', 'ADMIN', 'TENANT_ADMIN']);
const FLEET_ROLES = new Set([
  'TRUCK_OWNER',
  'FLEET_MANAGER',
  'FLEET_DISPATCHER',
  'FLEET_ACCOUNTANT',
  'FLEET_SAFETY_OFFICER',
]);

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
  loans: 'Loans',
  repayments: 'Repayments',
  inspections: 'Inspections',
};

const ALL_CATEGORIES = Object.keys(REPORT_TITLES) as TenantReportCategory[];

const ROLE_ALLOWED_CATEGORIES: Record<string, TenantReportCategory[]> = {
  SUPER_ADMIN: ALL_CATEGORIES,
  ADMIN: ALL_CATEGORIES,
  TENANT_ADMIN: ALL_CATEGORIES,
  CARGO_OWNER: [...TICKETS, 'trips', 'cargo', 'parking', 'invoices', 'payments', 'credits', 'loans', 'inspections'],
  CARGO_RECEIVER: [...TICKETS, 'trips', 'cargo', 'inspections'],
  TRUCK_OWNER: [...TICKETS, 'fleet', 'drivers', 'trips', 'cargo', 'parking', 'invoices', 'payments', 'credits', 'loans'],
  FLEET_MANAGER: [...TICKETS, 'fleet', 'drivers', 'trips', 'cargo', 'parking', 'invoices', 'payments', 'credits', 'loans'],
  FLEET_DISPATCHER: [...TICKETS, 'fleet', 'drivers', 'trips', 'cargo'],
  FLEET_ACCOUNTANT: [...TICKETS, 'trips', 'invoices', 'payments', 'credits', 'loans'],
  FLEET_SAFETY_OFFICER: [...TICKETS, 'fleet', 'drivers', 'trips'],
  DRIVER: [...TICKETS, 'trips', 'parking', 'payments', 'inspections'],
  BROKER: [...TICKETS, 'trips', 'cargo', 'invoices', 'payments', 'inspections'],
  LENDER: [...TICKETS, 'loans', 'repayments', 'payments'],
  CUSTOMS_OFFICER: [...TICKETS, 'inspections', 'trips', 'cargo'],
  PARKING_RESERVATION_MANAGER: [...TICKETS, 'parking'],
  AGENT: [...TICKETS, 'trips', 'cargo'],
};

function isElevated(role: string): boolean {
  return ELEVATED_ROLES.has(role);
}

function isFleetFamily(role: string): boolean {
  return FLEET_ROLES.has(role);
}

function denyAll<T>(qb: SelectQueryBuilder<T>): void {
  qb.andWhere('1 = 0');
}

/** Separate OR clauses so TypeORM quotes camelCase columns. A single "(a OR b)" string is sent to Postgres unquoted. */
function orWhere<T>(qb: SelectQueryBuilder<T>, clauses: Array<{ sql: string; params?: Record<string, unknown> }>): void {
  qb.andWhere(new Brackets((w) => {
    clauses.forEach((clause, i) => {
      if (i === 0) w.where(clause.sql, clause.params);
      else w.orWhere(clause.sql, clause.params);
    });
  }));
}

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

function allowedCategories(role: string): TenantReportCategory[] {
  return ROLE_ALLOWED_CATEGORIES[role] ?? [...TICKETS];
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
    @InjectRepository(LoanRequest) private readonly loanRepo: Repository<LoanRequest>,
    @InjectRepository(LoanRepayment) private readonly repaymentRepo: Repository<LoanRepayment>,
    @InjectRepository(CustomsInspection) private readonly inspectionRepo: Repository<CustomsInspection>,
  ) {}

  async generate(tenantId: string, query: TenantReportQuery, scope: ReportScope): Promise<TenantReportResult> {
    const category = query.category;
    if (!REPORT_TITLES[category]) {
      throw new BadRequestException(`Unknown report category: ${category}`);
    }
    if (!scope?.userId || !scope?.role) {
      throw new ForbiddenException('Authenticated user is required');
    }
    if (!allowedCategories(scope.role).includes(category)) {
      throw new ForbiddenException('This report is not available for your role');
    }

    const scopedTenantId = tenantId || scope.tenantId;
    if (!scopedTenantId) {
      throw new BadRequestException('Tenant context is required');
    }

    let rows: Record<string, string | number>[] = [];
    switch (category) {
      case 'issues':
      case 'support':
      case 'disputes': {
        const kind: TicketKind = category === 'issues' ? 'issue' : category === 'support' ? 'support' : 'dispute';
        rows = await this.ticketRows(scopedTenantId, kind, query, scope);
        break;
      }
      case 'fleet':
        rows = await this.fleetRows(scopedTenantId, query.status, scope);
        break;
      case 'drivers':
        rows = await this.driverRows(scopedTenantId, query.status, scope);
        break;
      case 'trips':
        rows = await this.tripRows(scopedTenantId, query.status, scope);
        break;
      case 'cargo':
        rows = await this.cargoRows(scopedTenantId, query.status, scope);
        break;
      case 'parking':
        rows = await this.parkingRows(scopedTenantId, query.status, scope);
        break;
      case 'users':
        rows = await this.userRows(scopedTenantId, query.status, scope);
        break;
      case 'invoices':
        rows = await this.invoiceRows(scopedTenantId, query.status, scope);
        break;
      case 'payments':
        rows = await this.paymentRows(scopedTenantId, query.status, scope);
        break;
      case 'credits':
        rows = await this.creditRows(scopedTenantId, query.status, scope);
        break;
      case 'loans':
        rows = await this.loanRows(scopedTenantId, query.status, scope);
        break;
      case 'repayments':
        rows = await this.repaymentRows(scopedTenantId, query.status, scope);
        break;
      case 'inspections':
        rows = await this.inspectionRows(scopedTenantId, query.status, scope);
        break;
    }

    rows = rows.filter((row) => {
      if (!matchesSearch(row, query.search)) return false;
      const dateVal = String(row.Created || row.Issued || row.Start || row.Hired || row.PickupDate || row.Date || '');
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

  private async ticketRows(tenantId: string, kind: TicketKind, query: TenantReportQuery, scope: ReportScope) {
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
    if (!isElevated(scope.role)) {
      orWhere(qb, [
        { sql: 'd.complainantUserId = :uid', params: { uid: scope.userId } },
        { sql: 'd.respondentUserId = :uid' },
        { sql: 'd.driverId = :uid' },
      ]);
    }
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

  private async fleetRows(tenantId: string, status: string | undefined, scope: ReportScope) {
    const qb = this.truckRepo
      .createQueryBuilder('t')
      .where('t.tenantId = :tenantId', { tenantId })
      .orderBy('t.createdAt', 'DESC')
      .take(MAX_ROWS);
    if (status) qb.andWhere('t.status = :status', { status });
    if (isElevated(scope.role)) {
      // tenant-wide
    } else if (isFleetFamily(scope.role)) {
      qb.andWhere('t.ownerId = :uid', { uid: scope.userId });
    } else {
      denyAll(qb);
    }
    const trucks = await qb.getMany();
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

  private async driverRows(tenantId: string, status: string | undefined, scope: ReportScope) {
    const qb = this.driverRepo
      .createQueryBuilder('d')
      .where('d.tenantId = :tenantId', { tenantId })
      .orderBy('d.createdAt', 'DESC')
      .take(MAX_ROWS);
    if (status) qb.andWhere('d.status = :status', { status });
    if (isElevated(scope.role)) {
      // tenant-wide
    } else if (scope.role === 'DRIVER') {
      qb.andWhere('d.userId = :uid', { uid: scope.userId });
    } else if (isFleetFamily(scope.role)) {
      qb.andWhere('d.employerId = :uid', { uid: scope.userId });
    } else {
      denyAll(qb);
    }
    const drivers = await qb.getMany();
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

  private async tripRows(tenantId: string, status: string | undefined, scope: ReportScope) {
    const qb = this.tripRepo
      .createQueryBuilder('t')
      .leftJoinAndSelect('t.pickupLocation', 'pickup')
      .leftJoinAndSelect('t.deliveryLocation', 'delivery')
      .leftJoinAndSelect('t.truck', 'truck')
      .leftJoinAndSelect('t.load', 'load')
      .leftJoinAndSelect('t.driver', 'driver')
      .where('t.tenantId = :tenantId', { tenantId })
      .orderBy('t.createdAt', 'DESC')
      .take(MAX_ROWS);
    if (status) qb.andWhere('t.status = :status', { status });
    this.applyTripOwnership(qb, scope);
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

  private applyTripOwnership(qb: SelectQueryBuilder<Trip>, scope: ReportScope) {
    const uid = scope.userId;
    if (isElevated(scope.role)) return;
    if (scope.role === 'DRIVER') {
      qb.andWhere('driver.userId = :uid', { uid });
      return;
    }
    if (scope.role === 'CARGO_OWNER') {
      qb.andWhere('load.cargoOwnerId = :uid', { uid });
      return;
    }
    if (scope.role === 'CARGO_RECEIVER') {
      qb.andWhere('load.receiverId = :uid', { uid });
      return;
    }
    if (scope.role === 'BROKER' || scope.role === 'AGENT') {
      qb.andWhere('load.brokerId = :uid', { uid });
      return;
    }
    if (isFleetFamily(scope.role)) {
      qb.andWhere('truck.ownerId = :uid', { uid });
      return;
    }
    if (scope.role === 'CUSTOMS_OFFICER') {
      qb.andWhere(
        `EXISTS (SELECT 1 FROM customs_inspections ci WHERE ci."tripId" = t.id AND ci."officerId" = :uid)`,
        { uid },
      );
      return;
    }
    denyAll(qb);
  }

  private async cargoRows(tenantId: string, status: string | undefined, scope: ReportScope) {
    const qb = this.loadRepo
      .createQueryBuilder('c')
      .where('c.tenantId = :tenantId', { tenantId })
      .orderBy('c.createdAt', 'DESC')
      .take(MAX_ROWS);
    if (status) qb.andWhere('c.status = :status', { status });
    const uid = scope.userId;
    if (isElevated(scope.role)) {
      // tenant-wide
    } else if (scope.role === 'CARGO_OWNER') {
      qb.andWhere('c.cargoOwnerId = :uid', { uid });
    } else if (scope.role === 'CARGO_RECEIVER') {
      qb.andWhere('c.receiverId = :uid', { uid });
    } else if (scope.role === 'BROKER' || scope.role === 'AGENT') {
      qb.andWhere('c.brokerId = :uid', { uid });
    } else if (isFleetFamily(scope.role)) {
      qb.andWhere(
        `EXISTS (
          SELECT 1 FROM trips trip
          INNER JOIN trucks truck ON truck.id = trip."truckId"
          WHERE trip."loadId" = c.id AND truck."ownerId" = :uid
        )`,
        { uid },
      );
    } else if (scope.role === 'DRIVER') {
      qb.andWhere(
        `EXISTS (
          SELECT 1 FROM trips trip
          INNER JOIN drivers d ON d.id = trip."driverId"
          WHERE trip."loadId" = c.id AND d."userId" = :uid
        )`,
        { uid },
      );
    } else if (scope.role === 'CUSTOMS_OFFICER') {
      qb.andWhere(
        `EXISTS (
          SELECT 1 FROM customs_inspections ci
          INNER JOIN trips trip ON trip.id = ci."tripId"
          WHERE trip."loadId" = c.id AND ci."officerId" = :uid
        )`,
        { uid },
      );
    } else {
      denyAll(qb);
    }
    const loads = await qb.getMany();
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

  private async parkingRows(tenantId: string, status: string | undefined, scope: ReportScope) {
    const qb = this.parkingRepo
      .createQueryBuilder('p')
      .where('p.tenantId = :tenantId', { tenantId })
      .orderBy('p.createdAt', 'DESC')
      .take(MAX_ROWS);
    if (status) qb.andWhere('p.status = :status', { status });
    if (isElevated(scope.role) || scope.role === 'PARKING_RESERVATION_MANAGER') {
      // facility / tenant-wide
    } else {
      orWhere(qb, [
        { sql: 'p.email = :email', params: { email: scope.email || '', uid: scope.userId } },
        { sql: 'p.driverEmail = :email' },
        { sql: 'p.submittedByUserId = :uid' },
      ]);
    }
    const items = await qb.getMany();
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

  private async userRows(tenantId: string, status: string | undefined, scope: ReportScope) {
    if (!isElevated(scope.role)) {
      return [];
    }
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

  private async invoiceRows(tenantId: string, status: string | undefined, scope: ReportScope) {
    const qb = this.invoiceRepo
      .createQueryBuilder('inv')
      .innerJoin('inv.tenant', 'tenant')
      .where('tenant.id = :tenantId', { tenantId })
      .orderBy('inv.createdAt', 'DESC')
      .take(MAX_ROWS);
    if (status) qb.andWhere('LOWER(CAST(inv.status AS TEXT)) = :status', { status: status.toLowerCase() });
    if (!isElevated(scope.role)) {
      orWhere(qb, [
        { sql: 'inv.customerId = :uid', params: { uid: scope.userId } },
        { sql: 'inv.senderId = :uid' },
      ]);
    }
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

  private async paymentRows(tenantId: string, status: string | undefined, scope: ReportScope) {
    const qb = this.paymentRepo
      .createQueryBuilder('p')
      .where('p.tenantId = :tenantId', { tenantId })
      .orderBy('p.createdAt', 'DESC')
      .take(MAX_ROWS);
    if (status) qb.andWhere('p.status = :status', { status: status.toLowerCase() });
    if (!isElevated(scope.role)) {
      orWhere(qb, [
        { sql: 'p.payerId = :uid', params: { uid: scope.userId } },
        { sql: 'p.payeeId = :uid' },
      ]);
    }
    const payments = await qb.getMany();
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

  private async creditRows(tenantId: string, status: string | undefined, scope: ReportScope) {
    const qb = this.creditRepo
      .createQueryBuilder('t')
      .addSelect('t.userId')
      .where('t.tenantId = :tenantId', { tenantId })
      .orderBy('t.createdAt', 'DESC')
      .take(MAX_ROWS);
    if (status) qb.andWhere('t.type = :status', { status });
    if (!isElevated(scope.role)) {
      qb.andWhere('t.userId = :uid', { uid: scope.userId });
    }
    const txs = await qb.getMany();
    return txs.map((t) => ({
      Type: t.type || '',
      Amount: t.amount ?? '',
      Balance: t.balanceAfter ?? '',
      Reason: t.description || '',
      Source: t.referenceType || '',
      Created: fmtDate(t.createdAt),
    }));
  }

  private applyLoanOwnership(qb: SelectQueryBuilder<any>, alias: string, scope: ReportScope) {
    const uid = scope.userId;
    if (isElevated(scope.role)) return;
    if (scope.role === 'LENDER') {
      qb.andWhere(`${alias}.lender_id = :uid`, { uid });
      return;
    }
    if (scope.role === 'CARGO_OWNER' || isFleetFamily(scope.role)) {
      orWhere(qb, [
        { sql: `${alias}.borrower_id = :uid`, params: { uid } },
        { sql: `${alias}.created_by = :uid` },
      ]);
      return;
    }
    denyAll(qb);
  }

  private async loanRows(tenantId: string, status: string | undefined, scope: ReportScope) {
    const qb = this.loanRepo
      .createQueryBuilder('loan')
      .where('loan.tenant_id = :tenantId', { tenantId })
      .orderBy('loan.created_at', 'DESC')
      .take(MAX_ROWS);
    if (status) qb.andWhere('loan.status = :status', { status: status.toLowerCase() });
    this.applyLoanOwnership(qb, 'loan', scope);
    const loans = await qb.getMany();
    return loans.map((l) => ({
      Loan: l.loan_number || l.id,
      Amount: l.requested_amount ?? '',
      Approved: l.approved_amount ?? '',
      Status: l.status || '',
      Due: fmtDate(l.due_date),
      Created: fmtDate(l.created_at as any),
    }));
  }

  private async repaymentRows(tenantId: string, status: string | undefined, scope: ReportScope) {
    const qb = this.repaymentRepo
      .createQueryBuilder('r')
      .innerJoinAndSelect('r.loan_request', 'loan')
      .where('loan.tenant_id = :tenantId', { tenantId })
      .orderBy('r.created_at', 'DESC')
      .take(MAX_ROWS);
    if (status) qb.andWhere('loan.status = :status', { status: status.toLowerCase() });
    this.applyLoanOwnership(qb, 'loan', scope);
    const items = await qb.getMany();
    return items.map((r) => ({
      Loan: r.loan_request?.loan_number || r.loan_request_id,
      Amount: r.amount ?? '',
      Principal: r.principal_paid ?? '',
      Interest: r.interest_paid ?? '',
      Currency: r.currency || '',
      Date: fmtDate(r.repayment_date),
      Created: fmtDate(r.created_at),
    }));
  }

  private async inspectionRows(tenantId: string, status: string | undefined, scope: ReportScope) {
    const qb = this.inspectionRepo
      .createQueryBuilder('insp')
      .leftJoinAndSelect('insp.trip', 'trip')
      .leftJoinAndSelect('trip.load', 'load')
      .leftJoinAndSelect('trip.driver', 'driver')
      .leftJoinAndSelect('trip.truck', 'truck')
      .where('insp.tenantId = :tenantId', { tenantId })
      .orderBy('insp.createdAt', 'DESC')
      .take(MAX_ROWS);
    if (status) qb.andWhere('insp.status = :status', { status });
    const uid = scope.userId;
    if (isElevated(scope.role)) {
      // tenant-wide
    } else if (scope.role === 'CUSTOMS_OFFICER') {
      qb.andWhere('insp.officerId = :uid', { uid });
    } else if (scope.role === 'CARGO_OWNER') {
      qb.andWhere('load.cargoOwnerId = :uid', { uid });
    } else if (scope.role === 'CARGO_RECEIVER') {
      qb.andWhere('load.receiverId = :uid', { uid });
    } else if (scope.role === 'BROKER' || scope.role === 'AGENT') {
      qb.andWhere('load.brokerId = :uid', { uid });
    } else if (scope.role === 'DRIVER') {
      orWhere(qb, [
        { sql: 'insp.driverId = :uid', params: { uid } },
        { sql: 'driver.userId = :uid' },
      ]);
    } else if (isFleetFamily(scope.role)) {
      qb.andWhere('truck.ownerId = :uid', { uid });
    } else {
      denyAll(qb);
    }
    const items = await qb.getMany();
    return items.map((i) => ({
      Reference: i.shipmentReference || i.id,
      Plate: i.plateNumber || '',
      Container: i.containerNumber || '',
      Driver: i.driverName || '',
      Status: i.status || '',
      Risk: i.riskLevel || '',
      Created: fmtDate(i.createdAt),
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
