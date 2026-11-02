import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
} from '@nestjs/common';
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
import { AuditLog, AuditAction } from '../../entities/audit-log.entity';
import { RevenueRecord } from '../../entities/revenue-record.entity';
import { SafetyInspection } from '../../entities/safety-inspection.entity';
import { SafetyIncident } from '../../entities/safety-incident.entity';
import { Bid } from '../../entities/bid.entity';
import { Auction } from '../../entities/auction.entity';
import { LoadMatch } from '../../entities/load-match.entity';
import { BrokerCommission } from '../../entities/broker-commission.entity';
import { Tenant } from '../../entities/tenant.entity';
import { LoanDisbursement } from '../../entities/loan-disbursement.entity';
import { isUUID } from 'class-validator';
import { categoriesForKind, type TicketKind } from '../disputes/ticket-kind';

export type TenantReportCategory =
  | 'revenue'
  | 'safety'
  | 'incidents'
  | 'tenants'
  | 'auctions'
  | 'bids'
  | 'matches'
  | 'commissions'
  | 'disbursements'
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
  page?: number;
  pageSize?: number;
  tenantId?: string;
  truckId?: string;
  driverId?: string;
  cargoOwnerId?: string;
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
  page: number;
  pageSize: number;
  summary: {
    breakdowns: {
      dimension: string;
      key: string;
      count: number;
      completed?: number;
    }[];
    metrics: Record<string, number>;
    statuses: { status: string; count: number }[];
    trends: { month: string; count: number }[];
    amounts: Record<string, string | number | null>[];
  };
  metadata: {
    generatedAt: string;
    generatedBy: string;
    tenantId: string;
    tenantName?: string;
    dateBasis?: string;
    balanceBasis?: string;
    period: string;
    filters: TenantReportQuery;
  };
}

interface ReportExecution extends ReportScope {
  query: TenantReportQuery;
  exportAll: boolean;
  result: Pick<TenantReportResult, 'total' | 'summary'>;
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
  revenue: 'Settled Revenue',
  safety: 'Safety Inspections',
  incidents: 'Safety Incidents',
  tenants: 'Tenants',
  auctions: 'Auctions',
  bids: 'Bids',
  matches: 'Smart Matching',
  commissions: 'Broker Commissions',
  disbursements: 'Disbursements',
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
  ADMIN: ALL_CATEGORIES.filter((c) => c !== 'tenants'),
  TENANT_ADMIN: ALL_CATEGORIES.filter((c) => c !== 'tenants'),
  CARGO_OWNER: [
    'auctions',
    'bids',
    'matches',
    'repayments',
    'disbursements',
    ...TICKETS,
    'trips',
    'cargo',
    'parking',
    'invoices',
    'payments',
    'credits',
    'loans',
    'inspections',
  ],
  CARGO_RECEIVER: [...TICKETS, 'trips', 'cargo', 'inspections'],
  TRUCK_OWNER: [
    'safety',
    'incidents',
    'bids',
    'matches',
    'repayments',
    'disbursements',
    ...TICKETS,
    'fleet',
    'drivers',
    'trips',
    'cargo',
    'parking',
    'invoices',
    'payments',
    'credits',
    'loans',
  ],
  FLEET_MANAGER: [
    'safety',
    'incidents',
    ...TICKETS,
    'fleet',
    'drivers',
    'trips',
    'cargo',
    'parking',
    'invoices',
    'payments',
    'credits',
    'loans',
  ],
  FLEET_DISPATCHER: [...TICKETS, 'fleet', 'drivers', 'trips', 'cargo'],
  FLEET_ACCOUNTANT: [
    ...TICKETS,
    'trips',
    'invoices',
    'payments',
    'credits',
    'loans',
  ],
  FLEET_SAFETY_OFFICER: [
    'safety',
    'incidents',
    ...TICKETS,
    'fleet',
    'drivers',
    'trips',
  ],
  DRIVER: [
    'safety',
    'incidents',
    ...TICKETS,
    'trips',
    'parking',
    'payments',
    'inspections',
  ],
  BROKER: [
    'auctions',
    'bids',
    'matches',
    'commissions',
    ...TICKETS,
    'trips',
    'cargo',
    'invoices',
    'payments',
    'inspections',
  ],
  LENDER: ['disbursements', ...TICKETS, 'loans', 'repayments', 'payments'],
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
function orWhere<T>(
  qb: SelectQueryBuilder<T>,
  clauses: Array<{ sql: string; params?: Record<string, unknown> }>,
): void {
  qb.andWhere(
    new Brackets((w) => {
      clauses.forEach((clause, i) => {
        if (i === 0) w.where(clause.sql, clause.params);
        else w.orWhere(clause.sql, clause.params);
      });
    }),
  );
}

function fmtDate(value?: Date | string | null): string {
  if (!value) return '';
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime())
    ? String(value)
    : d.toISOString().slice(0, 10);
}

function locName(
  loc?: { name?: string; address?: string; city?: string } | null,
): string {
  if (!loc) return '';
  return loc.name || loc.address || loc.city || '';
}

export function allowedCategories(role: string): TenantReportCategory[] {
  return ROLE_ALLOWED_CATEGORIES[role] ?? [];
}

@Injectable()
export class TenantReportsService {
  private readonly logger = new Logger(TenantReportsService.name);

  constructor(
    @InjectRepository(Load) private readonly loadRepo: Repository<Load>,
    @InjectRepository(Truck) private readonly truckRepo: Repository<Truck>,
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    @InjectRepository(Trip) private readonly tripRepo: Repository<Trip>,
    @InjectRepository(Payment)
    private readonly paymentRepo: Repository<Payment>,
    @InjectRepository(CreditTransaction)
    private readonly creditRepo: Repository<CreditTransaction>,
    @InjectRepository(Driver) private readonly driverRepo: Repository<Driver>,
    @InjectRepository(ParkingReservation)
    private readonly parkingRepo: Repository<ParkingReservation>,
    @InjectRepository(Invoice)
    private readonly invoiceRepo: Repository<Invoice>,
    @InjectRepository(DisputeV2)
    private readonly disputeRepo: Repository<DisputeV2>,
    @InjectRepository(LoanRequest)
    private readonly loanRepo: Repository<LoanRequest>,
    @InjectRepository(LoanRepayment)
    private readonly repaymentRepo: Repository<LoanRepayment>,
    @InjectRepository(CustomsInspection)
    private readonly inspectionRepo: Repository<CustomsInspection>,
  ) {}

  catalog(role: string) {
    const entities: Record<TenantReportCategory, any> = {
      revenue: RevenueRecord,
      safety: SafetyInspection,
      incidents: SafetyIncident,
      issues: DisputeV2,
      support: DisputeV2,
      disputes: DisputeV2,
      fleet: Truck,
      drivers: Driver,
      trips: Trip,
      cargo: Load,
      parking: ParkingReservation,
      users: User,
      invoices: Invoice,
      payments: Payment,
      credits: CreditTransaction,
      loans: LoanRequest,
      repayments: LoanRequest,
      inspections: CustomsInspection,
      tenants: Tenant,
      auctions: Auction,
      bids: Bid,
      matches: LoadMatch,
      commissions: BrokerCommission,
      disbursements: LoanDisbursement,
    };
    return allowedCategories(role).map((id) => ({
      id,
      title: REPORT_TITLES[id],
      statuses: (
        this.loadRepo.manager.connection
          .getMetadata(entities[id])
          .columns.find(
            (c) => c.propertyName === (id === 'credits' ? 'type' : 'status'),
          )?.enum || []
      ).map(String),
    }));
  }

  private validateQuery(query: TenantReportQuery) {
    if (
      Object.keys(query).some(
        (k) =>
          ![
            'category',
            'status',
            'priority',
            'search',
            'dateFrom',
            'dateTo',
            'page',
            'pageSize',
            'tenantId',
            'truckId',
            'driverId',
            'cargoOwnerId',
          ].includes(k),
      )
    )
      throw new BadRequestException('Unsupported report filter');
    if (
      typeof query.category !== 'string' ||
      !Object.prototype.hasOwnProperty.call(REPORT_TITLES, query.category)
    ) {
      throw new BadRequestException('Unknown report category');
    }
    for (const key of ['status', 'priority', 'search'] as const) {
      if (
        query[key] !== undefined &&
        (typeof query[key] !== 'string' || query[key].length > 200)
      ) {
        throw new BadRequestException(`Invalid ${key}`);
      }
    }
    for (const key of ['dateFrom', 'dateTo'] as const) {
      const value = query[key];
      if (
        value !== undefined &&
        (typeof value !== 'string' ||
          !/^\d{4}-\d{2}-\d{2}$/.test(value) ||
          !Number.isFinite(Date.parse(value)) ||
          new Date(value).toISOString().slice(0, 10) !== value)
      ) {
        throw new BadRequestException(`${key} must be a valid YYYY-MM-DD date`);
      }
    }
    if (query.dateFrom && query.dateTo && query.dateFrom > query.dateTo)
      throw new BadRequestException('Invalid date range');
    for (const [key, max] of [
      ['page', 1000000],
      ['pageSize', 200],
    ] as const) {
      if (
        query[key] !== undefined &&
        (!['string', 'number'].includes(typeof query[key]) ||
          !Number.isInteger(Number(query[key])) ||
          Number(query[key]) < 1 ||
          Number(query[key]) > max)
      ) {
        throw new BadRequestException(`Invalid ${key}`);
      }
      if (query[key] !== undefined) query[key] = Number(query[key]);
    }
    for (const key of [
      'tenantId',
      'truckId',
      'driverId',
      'cargoOwnerId',
    ] as const) {
      if (
        query[key] !== undefined &&
        !(key === 'tenantId' && query[key] === '*') &&
        (typeof query[key] !== 'string' || !isUUID(query[key]))
      ) {
        throw new BadRequestException(`Invalid ${key}`);
      }
    }
    if (query.priority && !TICKETS.includes(query.category))
      throw new BadRequestException('Priority only applies to tickets');
  }

  /** Run all filters and aggregates on the authorized query before applying a page limit. */
  private async readRows<T>(
    qb: SelectQueryBuilder<T>,
    scope: ReportExecution,
  ): Promise<T[]> {
    const query = scope.query;
    const alias = qb.alias;
    const metadata = qb.expressionMap.mainAlias!.metadata;
    const has = (name: string) =>
      metadata.columns.some((c) => c.propertyName === name);
    const field = (name: string) => `${alias}.${name}`;
    if (has('deletedAt') && !metadata.deleteDateColumn)
      qb.andWhere(`${field('deletedAt')} IS NULL`);
    const priorityColumn = metadata.columns.find(
      (c) => c.propertyName === 'priority',
    );
    if (
      query.priority &&
      priorityColumn?.enum &&
      !priorityColumn.enum.includes(query.priority)
    )
      throw new BadRequestException('Invalid ticket priority');
    const statusColumn = metadata.columns.find(
      (c) =>
        c.propertyName === (query.category === 'credits' ? 'type' : 'status'),
    );
    if (
      query.status &&
      statusColumn?.enum &&
      !statusColumn.enum.some(
        (v) => String(v).toLowerCase() === query.status!.toLowerCase(),
      )
    ) {
      throw new BadRequestException('Invalid status for this report');
    }
    if (
      query.category === 'repayments' &&
      query.status &&
      ![
        'pending',
        'approved',
        'rejected',
        'disbursed',
        'repaid',
        'failed',
        'defaulted',
      ].includes(query.status.toLowerCase())
    )
      throw new BadRequestException('Invalid loan status');
    if (query.status && !statusColumn && query.category !== 'repayments')
      throw new BadRequestException('Status does not apply to this report');
    if (query.status && statusColumn?.enum) {
      const canonical = statusColumn.enum.find(
        (v) => String(v).toLowerCase() === query.status!.toLowerCase(),
      );
      if (canonical !== undefined) qb.setParameter('status', canonical);
    }
    const dateNames: Partial<Record<TenantReportCategory, string>> = {
      revenue: 'settledAt',
      safety: 'inspectionDate',
      incidents: 'date',
      drivers: 'hireDate',
      invoices: 'issueDate',
      repayments: 'repayment_date',
    };
    const date = field(
      dateNames[query.category] ||
        (has('createdAt') ? 'createdAt' : 'created_at'),
    );
    if (query.dateFrom)
      qb.andWhere(`${date} >= :reportFrom`, {
        reportFrom: `${query.dateFrom}T00:00:00.000Z`,
      });
    if (query.dateTo) {
      const end = new Date(`${query.dateTo}T00:00:00.000Z`);
      end.setUTCDate(end.getUTCDate() + 1);
      qb.andWhere(`${date} < :reportTo`, { reportTo: end.toISOString() });
    }
    const identifiers: Partial<
      Record<TenantReportCategory, Record<string, string>>
    > = {
      safety: { truckId: 's.truckId', driverId: 's.driverId' },
      incidents: { truckId: 's.truckId', driverId: 's.driverId' },
      trips: {
        truckId: 't.truckId',
        driverId: 't.driverId',
        cargoOwnerId: 'load.cargoOwnerId',
      },
      fleet: { truckId: 't.id' },
      drivers: { driverId: 'd.id' },
      cargo: { cargoOwnerId: 'c.cargoOwnerId' },
      matches: { truckId: 'm.truckId', cargoOwnerId: 'load.cargoOwnerId' },
      auctions: { cargoOwnerId: 'load.cargoOwnerId' },
      bids: { cargoOwnerId: 'load.cargoOwnerId' },
    };
    for (const key of ['truckId', 'driverId', 'cargoOwnerId'] as const) {
      if (!query[key]) continue;
      const column = identifiers[query.category]?.[key];
      if (!column)
        throw new BadRequestException(`${key} does not apply to this report`);
      qb.andWhere(`${column} = :report_${key}`, {
        [`report_${key}`]: query[key],
      });
    }
    if (query.search?.trim()) {
      // Search only public report identifiers; never serialize an entire entity containing private fields.
      const searchable = [
        'id',
        'title',
        'name',
        'tripNumber',
        'plateNumber',
        'make',
        'model',
        'firstName',
        'lastName',
        'referenceNumber',
        'reservationReference',
        'invoiceNumber',
        'loan_number',
        'shipmentReference',
        'description',
        'status',
        'currency',
        'bidCurrency',
        'truckPlate',
        'driverName',
        'customerName',
      ];
      const columns = searchable
        .filter(has)
        .map((name) => `CAST(${field(name)} AS TEXT)`);
      qb.andWhere(`CONCAT_WS(' ', ${columns.join(', ')}) ILIKE :reportSearch`, {
        reportSearch: `%${query.search.trim().replace(/[\\%_]/g, '\\$&')}%`,
      });
    }
    // Stable order prevents equal timestamps from shuffling between pages.
    qb.addOrderBy(field('id'), 'DESC').take(undefined).skip(undefined);
    const total = await qb.clone().getCount();
    if (scope.exportAll && total > MAX_ROWS)
      throw new BadRequestException(
        `Export exceeds ${MAX_ROWS} records. Narrow the filters.`,
      );
    const status = has('status')
      ? field('status')
      : has('type')
        ? field('type')
        : null;
    const statuses = status
      ? await qb
          .clone()
          .select(status, 'status')
          .addSelect('COUNT(*)', 'count')
          .orderBy()
          .groupBy(status)
          .getRawMany()
      : [];
    const dateProperty = date.split('.').pop();
    const dateType = metadata.columns.find(
      (c) => c.propertyName === dateProperty,
    )?.type;
    const utcDate = ['timestamp with time zone', 'timestamptz'].includes(
      String(dateType),
    )
      ? `(${date} AT TIME ZONE 'UTC')`
      : date;
    const month = `TO_CHAR(${utcDate}, 'YYYY-MM')`;
    const trends = await qb
      .clone()
      .select(month, 'month')
      .addSelect('COUNT(*)', 'count')
      .orderBy(month, 'ASC')
      .groupBy(month)
      .getRawMany();
    const amountFields: Partial<Record<TenantReportCategory, string[]>> = {
      revenue: [
        'grossAmount',
        'platformFeeAmount',
        'brokerCommissionAmount',
        'netPayoutAmount',
      ],
      payments: ['amount'],
      invoices: ['totalAmount'],
      loans: ['requested_amount', 'approved_amount'],
      repayments: ['amount', 'principal_paid', 'interest_paid'],
      disbursements: ['amount'],
    };
    let amounts: Record<string, string | number | null>[] = [];
    if (amountFields[query.category] && has('currency')) {
      const currency = field('currency');
      const aggregate = qb
        .clone()
        .select(currency, 'currency')
        .orderBy()
        .groupBy(currency);
      if (status) aggregate.addSelect(status, 'status').addGroupBy(status);
      if (query.category === 'payments') {
        aggregate
          .addSelect(field('paymentType'), 'payment_type')
          .addGroupBy(field('paymentType'));
        const direction = isElevated(scope.role)
          ? "'Tenant transaction'"
          : `CASE WHEN ${alias}.payerId = :reportActor THEN 'Outgoing' ELSE 'Incoming' END`;
        aggregate.addSelect(direction, 'direction');
        if (!isElevated(scope.role))
          aggregate
            .addGroupBy(direction)
            .setParameter('reportActor', scope.userId);
      }
      for (const name of amountFields[query.category]!)
        aggregate.addSelect(
          `CASE WHEN ${currency} IS NULL OR TRIM(${currency}) = '' THEN NULL ELSE COALESCE(SUM(${field(name)}), 0) END`,
          name,
        );
      if (query.category === 'loans') {
        // Aggregate each child ledger once; joining raw children would multiply disbursements by repayments.
        const authorizedLoans = qb
          .clone()
          .select(`${alias}.id`)
          .orderBy()
          .getQuery();
        aggregate.leftJoin(
          `(SELECT loan_request_id, currency, SUM(amount) AS total FROM loan_disbursements WHERE status IN ('success', 'disbursed') AND loan_request_id IN (${authorizedLoans}) GROUP BY loan_request_id, currency)`,
          'report_disbursed',
          `report_disbursed.loan_request_id = ${alias}.id AND report_disbursed.currency = ${alias}.currency`,
        );
        aggregate.leftJoin(
          `(SELECT loan_request_id, currency, SUM(principal_paid) AS principal FROM loan_repayments WHERE loan_request_id IN (${authorizedLoans}) GROUP BY loan_request_id, currency)`,
          'report_repaid',
          `report_repaid.loan_request_id = ${alias}.id AND report_repaid.currency = ${alias}.currency`,
        );
        const incomplete = `(EXISTS (SELECT 1 FROM loan_disbursements ledger WHERE ledger.loan_request_id = ${alias}.id AND ledger.status IN ('success', 'disbursed') AND (ledger.currency IS DISTINCT FROM ${alias}.currency OR ledger.amount IS NULL))
          OR EXISTS (SELECT 1 FROM loan_repayments ledger WHERE ledger.loan_request_id = ${alias}.id AND (ledger.currency IS DISTINCT FROM ${alias}.currency OR ledger.principal_paid IS NULL))
          OR (${alias}.status IN ('disbursed', 'repaid', 'defaulted') AND report_disbursed.total IS NULL))`;
        const missing = `COUNT(*) FILTER (WHERE ${incomplete})`;
        aggregate
          .addSelect(missing, 'incomplete_ledger_records')
          .addSelect(
            `CASE WHEN ${missing} > 0 OR ${currency} IS NULL OR TRIM(${currency}) = '' THEN NULL ELSE SUM(COALESCE(report_disbursed.total, 0)) END`,
            'disbursed_principal',
          )
          .addSelect(
            `CASE WHEN ${missing} > 0 OR ${currency} IS NULL OR TRIM(${currency}) = '' THEN NULL ELSE SUM(COALESCE(report_repaid.principal, 0)) END`,
            'principal_repaid',
          )
          .addSelect(
            `CASE WHEN ${missing} > 0 OR ${currency} IS NULL OR TRIM(${currency}) = '' THEN NULL ELSE SUM(GREATEST(0, COALESCE(report_disbursed.total, 0) - COALESCE(report_repaid.principal, 0))) END`,
            'outstanding_principal',
          );
        aggregate
          .addSelect(
            `COUNT(*) FILTER (WHERE (CAST(${alias}.due_date AS TIMESTAMP) AT TIME ZONE 'UTC') < CURRENT_TIMESTAMP AND ${alias}.status <> 'repaid')`,
            'overdue_loans',
          )
          .addSelect(
            `CASE WHEN ${missing} > 0 OR ${currency} IS NULL OR TRIM(${currency}) = '' THEN NULL ELSE SUM(CASE WHEN (CAST(${alias}.due_date AS TIMESTAMP) AT TIME ZONE 'UTC') < CURRENT_TIMESTAMP AND ${alias}.status <> 'repaid' THEN GREATEST(0, COALESCE(report_disbursed.total, 0) - COALESCE(report_repaid.principal, 0)) ELSE 0 END) END`,
            'overdue_principal',
          );
      }
      amounts = await aggregate.getRawMany();
    }
    const metrics: Record<string, number> = {};
    if (query.category === 'trips') {
      const performance = await qb
        .clone()
        .select(`COUNT(*) FILTER (WHERE t.status = 'COMPLETED')`, 'completed')
        .addSelect(
          `COUNT(*) FILTER (WHERE t.status = 'COMPLETED' AND t.actualEndTime IS NOT NULL AND t.plannedEndTime IS NOT NULL)`,
          'timed',
        )
        .addSelect(
          `COUNT(*) FILTER (WHERE t.status = 'COMPLETED' AND t.actualEndTime <= t.plannedEndTime)`,
          'on_time',
        )
        .addSelect(
          `COALESCE(SUM(CASE WHEN t.status = 'COMPLETED' THEN load.weight ELSE 0 END), 0)`,
          'transported_kg',
        )
        .orderBy()
        .getRawOne();
      if (performance.transported_kg != null)
        metrics['Cargo transported (kg)'] = Number(performance.transported_kg);
      if (total)
        metrics['Completion rate (%)'] =
          (Number(performance.completed) / total) * 100;
      if (Number(performance.timed))
        metrics['On-time delivery rate (%)'] =
          (Number(performance.on_time) / Number(performance.timed)) * 100;
    }
    if (query.category === 'bids' && total)
      metrics['Accepted bids (%)'] =
        (Number(statuses.find((s) => s.status === 'ACCEPTED')?.count || 0) /
          total) *
        100;
    if (query.category === 'fleet' && total)
      metrics['Trucks in transit (%)'] =
        (Number(statuses.find((s) => s.status === 'IN_TRANSIT')?.count || 0) /
          total) *
        100;
    if (query.category === 'auctions' && total) {
      const outcomes = await qb
        .clone()
        .select('COUNT(*) FILTER (WHERE a.winningBidId IS NOT NULL)', 'won')
        .orderBy()
        .getRawOne();
      metrics['Auctions with winning bids (%)'] =
        (Number(outcomes?.won || 0) / total) * 100;
    }
    if (query.category === 'matches' && total)
      metrics['Accepted matches (%)'] =
        (Number(statuses.find((s) => s.status === 'ACCEPTED')?.count || 0) /
          total) *
        100;
    if (query.category === 'cargo') {
      const volume = await qb
        .clone()
        .select('COALESCE(SUM(c.weight), 0)', 'weight')
        .orderBy()
        .getRawOne();
      if (volume?.weight != null)
        metrics['Cargo weight (kg)'] = Number(volume.weight);
    }
    const dimensions: { name: string; column: string; label?: string }[] = [];
    if (query.tenantId === '*') {
      if (has('tenantId'))
        dimensions.push({ name: 'Tenant', column: field('tenantId') });
      else if (has('tenant_id'))
        dimensions.push({ name: 'Tenant', column: field('tenant_id') });
      else if (['auctions', 'matches'].includes(query.category))
        dimensions.push({ name: 'Tenant', column: 'load.tenantId' });
    }
    if (query.category === 'users')
      dimensions.push({ name: 'User role', column: field('role') });
    if (query.category === 'trips')
      dimensions.push(
        {
          name: 'Driver',
          column: 't.driverId',
          label: `NULLIF(TRIM(CONCAT(driver.firstName, ' ', driver.lastName)), '')`,
        },
        { name: 'Truck', column: 't.truckId', label: 'truck.plateNumber' },
      );
    if (query.category === 'cargo')
      dimensions.push({ name: 'Cargo owner', column: 'c.cargoOwnerId' });
    if (query.category === 'loans')
      dimensions.push(
        { name: 'Borrower', column: 'loan.borrower_id' },
        { name: 'Financing type', column: 'loan.financing_type' },
      );
    const breakdowns: TenantReportResult['summary']['breakdowns'] = [];
    for (const dimension of dimensions) {
      const grouped = qb
        .clone()
        .select(`CAST(${dimension.column} AS TEXT)`, 'key')
        .addSelect('COUNT(*)', 'count')
        .orderBy('COUNT(*)', 'DESC')
        .addOrderBy(dimension.column, 'ASC')
        .groupBy(dimension.column)
        .limit(20);
      if (dimension.name === 'Tenant') {
        grouped.leftJoin(
          Tenant,
          'reportTenant',
          `reportTenant.id = ${dimension.column}`,
        );
        dimension.label = 'reportTenant.name';
      }
      if (['Cargo owner', 'Borrower'].includes(dimension.name)) {
        const tenantColumn =
          query.category === 'cargo' ? 'c.tenantId' : 'loan.tenant_id';
        grouped
          .leftJoin(
            User,
            'reportUser',
            `reportUser.id = ${dimension.column} AND reportUser.tenantId = ${tenantColumn}`,
          )
          .leftJoin(
            'reportUser.profile',
            'reportProfile',
            `reportProfile.tenantId = ${tenantColumn}`,
          );
        dimension.label = `COALESCE(NULLIF(TRIM(CONCAT(reportProfile.firstName, ' ', reportProfile.lastName)), ''), reportUser.email)`;
      }
      if (dimension.label)
        grouped.addSelect(`MAX(${dimension.label})`, 'label');
      if (query.category === 'trips')
        grouped.addSelect(
          `COUNT(*) FILTER (WHERE t.status = 'COMPLETED')`,
          'completed',
        );
      for (const row of await grouped.getRawMany())
        breakdowns.push({
          dimension: dimension.name,
          key: dimension.label
            ? row.label ||
              (row.key ? `${dimension.name} unavailable` : 'Unassigned')
            : row.key || 'Unassigned',
          count: Number(row.count),
          ...(row.completed === undefined
            ? {}
            : { completed: Number(row.completed) }),
        });
    }
    scope.result = {
      total,
      summary: {
        breakdowns,
        metrics,
        statuses: statuses.map((s) => ({
          status: String(s.status),
          count: Number(s.count),
        })),
        trends: trends
          .filter((t) => t.month)
          .map((t) => ({ month: t.month, count: Number(t.count) })),
        amounts,
      },
    };
    return qb
      .skip(
        scope.exportAll ? 0 : ((query.page || 1) - 1) * (query.pageSize || 50),
      )
      .take(scope.exportAll ? MAX_ROWS : query.pageSize || 50)
      .getMany();
  }

  private async extendedRows(
    tenantId: string,
    query: TenantReportQuery,
    scope: ReportExecution,
  ): Promise<Record<string, string | number>[]> {
    const manager = this.loadRepo.manager;
    const tenant = (column: string) =>
      tenantId === '*' ? '1 = 1' : `${column} = :tenantId`;
    if (query.category === 'revenue') {
      const qb = manager
        .getRepository(RevenueRecord)
        .createQueryBuilder('revenue')
        .where(tenant('revenue.tenantId'), { tenantId })
        .andWhere('revenue.isSettled = TRUE')
        .orderBy('revenue.settledAt', 'DESC');
      return (await this.readRows(qb, scope)).map((r) => ({
        Trip: r.tripId,
        Gross: Number(r.grossAmount),
        PlatformFee: Number(r.platformFeeAmount),
        BrokerCommission: Number(r.brokerCommissionAmount),
        NetPayout: Number(r.netPayoutAmount),
        Currency: r.currency,
        Date: fmtDate(r.settledAt),
      }));
    }
    if (query.category === 'safety' || query.category === 'incidents') {
      const repo = manager.getRepository<SafetyInspection | SafetyIncident>(
        query.category === 'safety' ? SafetyInspection : SafetyIncident,
      );
      const qb = repo
        .createQueryBuilder('s')
        .where(tenant('s.tenantId'), { tenantId })
        .orderBy('s.createdAt', 'DESC');
      if (scope.role === 'DRIVER')
        qb.andWhere(
          's.driverId IN (SELECT id FROM drivers WHERE "userId" = :uid AND "tenantId" = s."tenantId")',
          { uid: scope.userId },
        );
      else if (isFleetFamily(scope.role))
        qb.andWhere(
          's.truckId IN (SELECT id FROM trucks WHERE "ownerId" = :uid AND "tenantId" = s."tenantId")',
          { uid: scope.userId },
        );
      else if (!isElevated(scope.role)) denyAll(qb);
      if (query.status)
        qb.andWhere('s.status = :status', { status: query.status });
      return (await this.readRows(qb, scope)).map((s) => ({
        Reference: s.id,
        Type: s.type,
        Status: s.status,
        Truck: s.truckPlate || s.truckId || '',
        Driver: s.driverId || '',
        Score: 'score' in s ? s.score : '',
        MaximumScore: 'maxScore' in s ? s.maxScore : '',
        Severity: 'severity' in s ? s.severity : '',
        Date: fmtDate('inspectionDate' in s ? s.inspectionDate : s.date),
        Created: fmtDate(s.createdAt),
      }));
    }
    if (query.category === 'tenants') {
      const qb = manager
        .getRepository(Tenant)
        .createQueryBuilder('tenant')
        .where(tenant('tenant.id'), { tenantId })
        .orderBy('tenant.createdAt', 'DESC');
      if (query.status)
        qb.andWhere('tenant.status = :status', { status: query.status });
      return (await this.readRows(qb, scope)).map((t) => ({
        Tenant: t.id,
        Name: t.name,
        Status: t.status,
        Type: t.type,
        Created: fmtDate(t.createdAt),
      }));
    }
    if (query.category === 'commissions') {
      const qb = manager
        .getRepository(BrokerCommission)
        .createQueryBuilder('c')
        .where(tenant('c.tenantId'), { tenantId })
        .orderBy('c.createdAt', 'DESC');
      if (!isElevated(scope.role))
        qb.andWhere('c.brokerId = :uid', { uid: scope.userId });
      if (query.status)
        qb.andWhere('c.status = :status', { status: query.status });
      return (await this.readRows(qb, scope)).map((c) => ({
        Commission: c.id,
        Cargo: c.loadId,
        Amount: Number(c.commissionAmount),
        Currency: 'Unspecified',
        Rate: Number(c.commissionRate),
        Status: c.status,
        Paid: fmtDate(c.paidAt),
        Created: fmtDate(c.createdAt),
      }));
    }
    if (query.category === 'disbursements') {
      const qb = manager
        .getRepository(LoanDisbursement)
        .createQueryBuilder('d')
        .innerJoin('d.loan_request', 'loan')
        .where(tenant('loan.tenant_id'), { tenantId })
        .orderBy('d.created_at', 'DESC');
      this.applyLoanOwnership(qb, 'loan', scope);
      if (query.status)
        qb.andWhere('d.status = :status', {
          status: query.status.toLowerCase(),
        });
      return (await this.readRows(qb, scope)).map((d) => ({
        Disbursement: d.id,
        Loan: d.loan_request_id,
        Amount: d.amount == null ? '' : Number(d.amount),
        Currency: d.currency || 'Unspecified',
        Status: d.status,
        Date: fmtDate(d.disbursement_date),
        Created: fmtDate(d.created_at),
      }));
    }
    if (query.category === 'matches') {
      const qb = manager
        .getRepository(LoadMatch)
        .createQueryBuilder('m')
        .innerJoin(Load, 'load', 'load.id = m.loadId')
        .innerJoin(
          Truck,
          'truck',
          'truck.id = m.truckId AND truck.tenantId = load.tenantId',
        )
        .where(tenant('load.tenantId'), { tenantId })
        .orderBy('m.createdAt', 'DESC');
      this.applyCommercialOwnership(qb, scope);
      if (query.status)
        qb.andWhere('m.status = :status', { status: query.status });
      return (await this.readRows(qb, scope)).map((m) => ({
        Match: m.id,
        Cargo: m.loadId,
        Truck: m.truckId,
        Status: m.status,
        Score: m.score == null ? '' : Number(m.score),
        Created: fmtDate(m.createdAt),
      }));
    }
    if (query.category === 'bids') {
      const qb = manager
        .getRepository(Bid)
        .createQueryBuilder('b')
        .innerJoin('b.load', 'load')
        .where(tenant('b.tenantId'), { tenantId })
        .andWhere('load.tenantId = b.tenantId')
        .orderBy('b.createdAt', 'DESC');
      if (isFleetFamily(scope.role))
        qb.andWhere('b.truckOwnerId = :uid', { uid: scope.userId });
      else this.applyCommercialOwnership(qb, scope);
      if (query.status)
        qb.andWhere('b.status = :status', { status: query.status });
      return (await this.readRows(qb, scope)).map((b) => ({
        Bid: b.id,
        Cargo: b.loadId,
        BidAmount: Number(b.bidAmount),
        Currency: b.bidCurrency,
        Status: b.status,
        Created: fmtDate(b.createdAt),
      }));
    }
    const qb = manager
      .getRepository(Auction)
      .createQueryBuilder('a')
      .innerJoin('a.load', 'load')
      .where(tenant('load.tenantId'), { tenantId })
      .orderBy('a.createdAt', 'DESC');
    this.applyCommercialOwnership(qb, scope);
    if (query.status)
      qb.andWhere('a.status = :status', { status: query.status });
    return (await this.readRows(qb, scope)).map((a) => ({
      Auction: a.id,
      Cargo: a.loadId,
      Status: a.status,
      WinningBid: a.winningBidId || '',
      Start: fmtDate(a.auctionStart),
      End: fmtDate(a.auctionEnd),
      Created: fmtDate(a.createdAt),
    }));
  }

  private applyCommercialOwnership(
    qb: SelectQueryBuilder<any>,
    scope: ReportExecution,
  ) {
    if (isElevated(scope.role)) return;
    if (scope.role === 'CARGO_OWNER')
      qb.andWhere('load.cargoOwnerId = :uid', { uid: scope.userId });
    else if (scope.role === 'BROKER')
      qb.andWhere('load.brokerId = :uid', { uid: scope.userId });
    else if (isFleetFamily(scope.role) && qb.alias === 'm')
      qb.andWhere('truck.ownerId = :uid', { uid: scope.userId });
    else denyAll(qb);
  }

  async generate(
    tenantId: string,
    query: TenantReportQuery,
    principal: ReportScope,
    exportAll = false,
  ): Promise<TenantReportResult> {
    const scope: ReportExecution = {
      ...principal,
      query: { ...query },
      exportAll,
      result: {
        total: 0,
        summary: {
          breakdowns: [],
          metrics: {},
          statuses: [],
          trends: [],
          amounts: [],
        },
      },
    };
    query = scope.query;
    this.validateQuery(query);
    const category = query.category;
    if (!REPORT_TITLES[category]) {
      throw new BadRequestException(`Unknown report category: ${category}`);
    }
    if (!scope?.userId || !scope?.role) {
      throw new ForbiddenException('Authenticated user is required');
    }
    if (!allowedCategories(scope.role).includes(category)) {
      throw new ForbiddenException(
        'This report is not available for your role',
      );
    }

    if (tenantId && tenantId !== scope.tenantId)
      throw new ForbiddenException('Tenant context mismatch');
    if (
      query.tenantId &&
      scope.role !== 'SUPER_ADMIN' &&
      query.tenantId !== scope.tenantId
    ) {
      throw new ForbiddenException('Platform reporting requires SUPER_ADMIN');
    }
    const scopedTenantId =
      scope.role === 'SUPER_ADMIN'
        ? query.tenantId || scope.tenantId
        : scope.tenantId;
    if (!scopedTenantId) {
      throw new BadRequestException('Tenant context is required');
    }

    let rows: Record<string, string | number>[] = [];
    try {
      switch (category) {
        case 'revenue':
        case 'safety':
        case 'incidents':
        case 'tenants':
        case 'auctions':
        case 'bids':
        case 'matches':
        case 'commissions':
        case 'disbursements':
          rows = await this.extendedRows(scopedTenantId, query, scope);
          break;
        case 'issues':
        case 'support':
        case 'disputes': {
          const kind: TicketKind =
            category === 'issues'
              ? 'issue'
              : category === 'support'
                ? 'support'
                : 'dispute';
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
    } catch (err: any) {
      this.logger.error(
        `Report '${category}' failed for role=${scope.role}: ${err?.message}`,
        err?.stack,
      );
      throw err;
    }

    if (exportAll) {
      await this.loadRepo.manager.getRepository(AuditLog).save({
        tenantId: scope.tenantId,
        userId: scope.userId,
        action: AuditAction.OTHER,
        description: 'Reporting export generated',
        metadata: {
          category,
          filters: query,
          total: scope.result.total,
          role: scope.role,
          reportTenantId: scopedTenantId,
        },
      });
    }
    const reportTenant =
      scopedTenantId === '*'
        ? undefined
        : await this.loadRepo.manager.getRepository(Tenant).findOne({
            where: { id: scopedTenantId },
            select: { id: true, name: true },
          });
    const reportAuthor = await this.userRepo.findOne({
      where: { id: scope.userId, tenantId: scope.tenantId },
      relations: ['profile'],
    });
    const headers = rows[0]
      ? Object.keys(rows[0])
      : this.defaultHeaders(category);
    return {
      title: REPORT_TITLES[category],
      category,
      headers,
      rows: rows.slice(0, MAX_ROWS),
      total: scope.result.total,
      page: query.page || 1,
      pageSize: exportAll ? MAX_ROWS : query.pageSize || 50,
      summary: scope.result.summary,
      metadata: {
        generatedAt: new Date().toISOString(),
        generatedBy:
          this.userName(reportAuthor) || scope.email || 'Report user',
        tenantId: scopedTenantId,
        tenantName: scopedTenantId === '*' ? 'All tenants' : reportTenant?.name,
        dateBasis:
          (
            {
              drivers: 'Hire date',
              invoices: 'Invoice issue date',
              repayments: 'Repayment date',
              safety: 'Inspection date',
              incidents: 'Incident date',
              revenue: 'Settlement date',
            } as Partial<Record<TenantReportCategory, string>>
          )[category] || 'Record creation date',
        balanceBasis:
          category === 'loans'
            ? 'Current recorded principal ledgers for the selected loan cohort. Balances are not historical as-of snapshots and exclude interest and fees.'
            : undefined,
        period: `${query.dateFrom || 'Beginning'} to ${query.dateTo || 'Present'} (UTC)`,
        filters: query,
      },
    };
  }

  toCsv(report: TenantReportResult): string {
    const esc = (v: unknown) => {
      const text = String(v ?? '');
      return `"${(/^[\s]*[=+@-]/.test(text) && typeof v !== 'number' ? "'" + text : text).replace(/"/g, '""')}"`;
    };
    return [
      report.headers
        .map((header) =>
          esc(header.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/_/g, ' ')),
        )
        .join(','),
      ...report.rows.map((r) => report.headers.map((h) => esc(r[h])).join(',')),
    ].join('\n');
  }

  private defaultHeaders(category: TenantReportCategory): string[] {
    const headers: Record<TenantReportCategory, string[]> = {
      issues: [
        'Ticket',
        'Title',
        'Category',
        'Priority',
        'Status',
        'Reporter',
        'Assigned',
        'Created',
      ],
      support: [
        'Ticket',
        'Title',
        'Category',
        'Priority',
        'Status',
        'Reporter',
        'Assigned',
        'Created',
      ],
      disputes: [
        'Ticket',
        'Title',
        'Category',
        'Priority',
        'Status',
        'Reporter',
        'Assigned',
        'Created',
      ],
      fleet: [
        'Plate',
        'Make',
        'Model',
        'Type',
        'Status',
        'Mileage',
        'Insurance',
        'Roadworthy',
        'Created',
      ],
      drivers: [
        'Name',
        'Email',
        'Phone',
        'License',
        'Status',
        'Availability',
        'Trips',
        'Rating',
        'Hired',
      ],
      trips: [
        'Trip',
        'Status',
        'Origin',
        'Destination',
        'Truck',
        'Driver',
        'Cargo',
        'Completed',
        'AgreedPrice',
        'Currency',
        'Start',
        'End',
        'Created',
      ],
      cargo: [
        'Title',
        'Type',
        'Status',
        'WeightKg',
        'Pickup',
        'Delivery',
        'OfferedPrice',
        'CargoValue',
        'Currency',
        'PickupDate',
        'Created',
      ],
      parking: [
        'Reference',
        'Company',
        'Driver',
        'Spaces',
        'Status',
        'Start',
        'End',
        'Created',
      ],
      users: ['Name', 'Email', 'Role', 'Status', 'Company', 'Created'],
      invoices: [
        'Invoice',
        'Customer',
        'Amount',
        'Currency',
        'Status',
        'Issued',
        'Due',
        'Paid',
      ],
      payments: [
        'Reference',
        'Amount',
        'Currency',
        'Status',
        'Method',
        'Type',
        'Created',
      ],
      credits: ['Type', 'Amount', 'Balance', 'Reason', 'Source', 'Created'],
      loans: [
        'Loan',
        'Requested',
        'Currency',
        'Approved',
        'Status',
        'Due',
        'Created',
      ],
      repayments: [
        'Loan',
        'Amount',
        'Principal',
        'Interest',
        'Currency',
        'Date',
        'Created',
      ],
      inspections: [
        'Reference',
        'Plate',
        'Container',
        'Driver',
        'Status',
        'Risk',
        'Created',
      ],
      tenants: ['Tenant', 'Name', 'Status', 'Type', 'Created'],
      auctions: [
        'Auction',
        'Cargo',
        'Status',
        'WinningBid',
        'Start',
        'End',
        'Created',
      ],
      bids: ['Bid', 'Cargo', 'BidAmount', 'Currency', 'Status', 'Created'],
      matches: ['Match', 'Cargo', 'Truck', 'Status', 'Score', 'Created'],
      commissions: [
        'Commission',
        'Cargo',
        'Amount',
        'Currency',
        'Rate',
        'Status',
        'Paid',
        'Created',
      ],
      disbursements: [
        'Disbursement',
        'Loan',
        'Amount',
        'Currency',
        'Status',
        'Date',
        'Created',
      ],
      safety: [
        'Reference',
        'Type',
        'Status',
        'Truck',
        'Driver',
        'Score',
        'MaximumScore',
        'Severity',
        'Date',
        'Created',
      ],
      incidents: [
        'Reference',
        'Type',
        'Status',
        'Truck',
        'Driver',
        'Score',
        'MaximumScore',
        'Severity',
        'Date',
        'Created',
      ],
      revenue: [
        'Trip',
        'Gross',
        'PlatformFee',
        'BrokerCommission',
        'NetPayout',
        'Currency',
        'Date',
      ],
    };
    return headers[category];
  }

  private async ticketRows(
    tenantId: string,
    kind: TicketKind,
    query: TenantReportQuery,
    scope: ReportExecution,
  ) {
    const qb = this.disputeRepo
      .createQueryBuilder('d')
      .leftJoinAndSelect('d.complainant', 'complainant')
      .leftJoinAndSelect('complainant.profile', 'cProfile')
      .leftJoinAndSelect('d.assignedTo', 'assignedTo')
      .leftJoinAndSelect('assignedTo.profile', 'aProfile')
      .where(tenantId === '*' ? '1 = 1' : 'd.tenantId = :tenantId', {
        tenantId,
      })
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
    if (query.status)
      qb.andWhere('d.status = :status', { status: query.status });
    if (query.priority)
      qb.andWhere('d.priority = :priority', { priority: query.priority });
    const items = await this.readRows(qb, scope);
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

  private async fleetRows(
    tenantId: string,
    status: string | undefined,
    scope: ReportExecution,
  ) {
    const qb = this.truckRepo
      .createQueryBuilder('t')
      .where(tenantId === '*' ? '1 = 1' : 't.tenantId = :tenantId', {
        tenantId,
      })
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
    const trucks = await this.readRows(qb, scope);
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

  private async driverRows(
    tenantId: string,
    status: string | undefined,
    scope: ReportExecution,
  ) {
    const qb = this.driverRepo
      .createQueryBuilder('d')
      .where(tenantId === '*' ? '1 = 1' : 'd.tenantId = :tenantId', {
        tenantId,
      })
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
    const drivers = await this.readRows(qb, scope);
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

  private async tripRows(
    tenantId: string,
    status: string | undefined,
    scope: ReportExecution,
  ) {
    const qb = this.tripRepo
      .createQueryBuilder('t')
      .leftJoinAndSelect('t.pickupLocation', 'pickup')
      .leftJoinAndSelect('t.deliveryLocation', 'delivery')
      .leftJoinAndSelect('t.truck', 'truck', 'truck.tenantId = t.tenantId')
      .leftJoinAndSelect('t.load', 'load', 'load.tenantId = t.tenantId')
      .leftJoinAndSelect('t.driver', 'driver', 'driver.tenantId = t.tenantId')
      .where(tenantId === '*' ? '1 = 1' : 't.tenantId = :tenantId', {
        tenantId,
      })
      .orderBy('t.createdAt', 'DESC')
      .take(MAX_ROWS);
    if (status) qb.andWhere('t.status = :status', { status });
    this.applyTripOwnership(qb, scope);
    const trips = await this.readRows(qb, scope);
    return trips.map((t) => ({
      Trip: t.tripNumber || t.id,
      Status: t.status || '',
      Origin: locName(t.pickupLocation) || locName(t.load?.origin),
      Destination: locName(t.deliveryLocation) || locName(t.load?.destination),
      Truck:
        t.truck?.plateNumber ||
        (t.truckId ? 'Truck unavailable' : 'Unassigned'),
      Driver:
        `${t.driver?.firstName || ''} ${t.driver?.lastName || ''}`.trim() ||
        (t.driverId ? 'Driver unavailable' : 'Unassigned'),
      Cargo: t.load?.title || (t.loadId ? 'Cargo unavailable' : 'Unassigned'),
      Completed: fmtDate(t.actualEndTime),
      AgreedPrice: Number(t.agreedPrice ?? 0),
      Currency: t.currencyCode || '',
      Start: fmtDate(t.plannedStartTime || t.actualStartTime),
      End: fmtDate(t.plannedEndTime || t.actualEndTime),
      Created: fmtDate(t.createdAt),
    }));
  }

  private applyTripOwnership(
    qb: SelectQueryBuilder<Trip>,
    scope: ReportExecution,
  ) {
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

  private async cargoRows(
    tenantId: string,
    status: string | undefined,
    scope: ReportExecution,
  ) {
    const qb = this.loadRepo
      .createQueryBuilder('c')
      .where(tenantId === '*' ? '1 = 1' : 'c.tenantId = :tenantId', {
        tenantId,
      })
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
    const loads = await this.readRows(qb, scope);
    return loads.map((c) => ({
      Title: c.title || c.id,
      Type: c.cargoType || c.loadType || '',
      Status: c.status || '',
      WeightKg: Number(c.weight ?? 0),
      Pickup: locName(c.origin),
      Delivery: locName(c.destination),
      OfferedPrice: c.offeredPrice == null ? '' : Number(c.offeredPrice),
      CargoValue: c.loadValue == null ? '' : Number(c.loadValue),
      Currency: c.currencyCode || '',
      PickupDate: fmtDate(c.pickupDate),
      Created: fmtDate(c.createdAt),
    }));
  }

  private async parkingRows(
    tenantId: string,
    status: string | undefined,
    scope: ReportExecution,
  ) {
    const qb = this.parkingRepo
      .createQueryBuilder('p')
      .where(tenantId === '*' ? '1 = 1' : 'p.tenantId = :tenantId', {
        tenantId,
      })
      .orderBy('p.createdAt', 'DESC')
      .take(MAX_ROWS);
    if (status) qb.andWhere('p.status = :status', { status });
    if (
      isElevated(scope.role) ||
      scope.role === 'PARKING_RESERVATION_MANAGER'
    ) {
      // facility / tenant-wide
    } else {
      orWhere(qb, [
        { sql: 'p.submittedByUserId = :uid', params: { uid: scope.userId } },
        ...(scope.email
          ? [
              { sql: 'p.email = :email', params: { email: scope.email } },
              { sql: 'p.driverEmail = :email' },
            ]
          : []),
      ]);
    }
    const items = await this.readRows(qb, scope);
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

  private async userRows(
    tenantId: string,
    status: string | undefined,
    scope: ReportExecution,
  ) {
    if (!isElevated(scope.role)) {
      return [];
    }
    const qb = this.userRepo
      .createQueryBuilder('u')
      .leftJoinAndSelect('u.profile', 'profile')
      .where(tenantId === '*' ? '1 = 1' : 'u.tenantId = :tenantId', {
        tenantId,
      })
      .orderBy('u.createdAt', 'DESC')
      .take(MAX_ROWS);
    if (status) qb.andWhere('u.status = :status', { status });
    const users = await this.readRows(qb, scope);
    return users.map((u) => ({
      Name:
        `${u.profile?.firstName || ''} ${u.profile?.lastName || ''}`.trim() ||
        u.email,
      Email: u.email || '',
      Role: u.role || '',
      Status: u.status || '',
      Company: u.profile?.companyName || '',
      Created: fmtDate(u.createdAt),
    }));
  }

  private async invoiceRows(
    tenantId: string,
    status: string | undefined,
    scope: ReportExecution,
  ) {
    const qb = this.invoiceRepo
      .createQueryBuilder('inv')
      .innerJoin('inv.tenant', 'tenant')
      .where(tenantId === '*' ? '1 = 1' : 'tenant.id = :tenantId', { tenantId })
      .orderBy('inv.createdAt', 'DESC')
      .take(MAX_ROWS);
    if (status)
      qb.andWhere('LOWER(CAST(inv.status AS TEXT)) = :status', {
        status: status.toLowerCase(),
      });
    if (!isElevated(scope.role)) {
      orWhere(qb, [
        { sql: 'inv.customerId = :uid', params: { uid: scope.userId } },
        { sql: 'inv.senderId = :uid' },
      ]);
    }
    const invoices = await this.readRows(qb, scope);
    return invoices.map((i) => ({
      Invoice: i.invoiceNumber || i.id,
      Customer: i.customerName || '',
      Amount: Number(i.totalAmount ?? 0),
      Currency: i.currency || '',
      Status: i.status || '',
      Issued: fmtDate(i.issueDate || i.createdAt),
      Due: fmtDate(i.dueDate),
      Paid: fmtDate(i.paidDate),
    }));
  }

  private async paymentRows(
    tenantId: string,
    status: string | undefined,
    scope: ReportExecution,
  ) {
    const qb = this.paymentRepo
      .createQueryBuilder('p')
      .where(tenantId === '*' ? '1 = 1' : 'p.tenantId = :tenantId', {
        tenantId,
      })
      .orderBy('p.createdAt', 'DESC')
      .take(MAX_ROWS);
    if (status)
      qb.andWhere('p.status = :status', { status: status.toLowerCase() });
    if (!isElevated(scope.role)) {
      orWhere(qb, [
        { sql: 'p.payerId = :uid', params: { uid: scope.userId } },
        { sql: 'p.payeeId = :uid' },
      ]);
    }
    const payments = await this.readRows(qb, scope);
    return payments.map((p) => ({
      Reference: p.referenceNumber || p.id,
      Amount: Number(p.amount ?? 0),
      Currency: p.currency || '',
      Status: p.status || '',
      Method: p.paymentMethod || '',
      Type: p.paymentType || '',
      Created: fmtDate(p.createdAt),
    }));
  }

  private async creditRows(
    tenantId: string,
    status: string | undefined,
    scope: ReportExecution,
  ) {
    const qb = this.creditRepo
      .createQueryBuilder('t')
      .addSelect('t.userId')
      .where(tenantId === '*' ? '1 = 1' : 't.tenantId = :tenantId', {
        tenantId,
      })
      .orderBy('t.createdAt', 'DESC')
      .take(MAX_ROWS);
    if (status) qb.andWhere('t.type = :status', { status });
    if (!isElevated(scope.role)) {
      qb.andWhere('t.userId = :uid', { uid: scope.userId });
    }
    const txs = await this.readRows(qb, scope);
    return txs.map((t) => ({
      Type: t.type || '',
      Amount: t.amount ?? '',
      Balance: t.balanceAfter ?? '',
      Reason: t.description || '',
      Source: t.referenceType || '',
      Created: fmtDate(t.createdAt),
    }));
  }

  private applyLoanOwnership(
    qb: SelectQueryBuilder<any>,
    alias: string,
    scope: ReportExecution,
  ) {
    const uid = scope.userId;
    if (isElevated(scope.role)) return;
    if (scope.role === 'LENDER') {
      qb.andWhere(
        `${alias}.lender_id IN (SELECT id FROM lenders WHERE tenant_id = :lenderTenant AND LOWER(contact_email) = LOWER(:lenderEmail))`,
        { lenderTenant: scope.tenantId, lenderEmail: scope.email || '' },
      );
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

  private async loanRows(
    tenantId: string,
    status: string | undefined,
    scope: ReportExecution,
  ) {
    const qb = this.loanRepo
      .createQueryBuilder('loan')
      .where(tenantId === '*' ? '1 = 1' : 'loan.tenant_id = :tenantId', {
        tenantId,
      })
      .orderBy('loan.created_at', 'DESC')
      .take(MAX_ROWS);
    if (status)
      qb.andWhere('loan.status = :status', { status: status.toLowerCase() });
    this.applyLoanOwnership(qb, 'loan', scope);
    const loans = await this.readRows(qb, scope);
    return loans.map((l) => ({
      Loan: l.loan_number || l.id,
      Requested: Number(l.requested_amount ?? 0),
      Currency: l.currency || '',
      Approved: l.approved_amount == null ? '' : Number(l.approved_amount),
      Status: l.status || '',
      Due: fmtDate(l.due_date),
      Created: fmtDate(l.created_at as any),
    }));
  }

  private async repaymentRows(
    tenantId: string,
    status: string | undefined,
    scope: ReportExecution,
  ) {
    const qb = this.repaymentRepo
      .createQueryBuilder('r')
      .innerJoinAndSelect('r.loan_request', 'loan')
      .where(tenantId === '*' ? '1 = 1' : 'loan.tenant_id = :tenantId', {
        tenantId,
      })
      .orderBy('r.created_at', 'DESC')
      .take(MAX_ROWS);
    if (status)
      qb.andWhere('loan.status = :status', { status: status.toLowerCase() });
    this.applyLoanOwnership(qb, 'loan', scope);
    const items = await this.readRows(qb, scope);
    return items.map((r) => ({
      Loan: r.loan_request?.loan_number || r.loan_request_id,
      Amount: Number(r.amount ?? 0),
      Principal: Number(r.principal_paid ?? 0),
      Interest: Number(r.interest_paid ?? 0),
      Currency: r.currency || '',
      Date: fmtDate(r.repayment_date),
      Created: fmtDate(r.created_at),
    }));
  }

  private async inspectionRows(
    tenantId: string,
    status: string | undefined,
    scope: ReportExecution,
  ) {
    const qb = this.inspectionRepo
      .createQueryBuilder('insp')
      .select([
        'insp.id',
        'insp.shipmentReference',
        'insp.plateNumber',
        'insp.containerNumber',
        'insp.driverName',
        'insp.status',
        'insp.riskLevel',
        'insp.createdAt',
      ])
      .where(tenantId === '*' ? '1 = 1' : 'insp.tenantId = :tenantId', {
        tenantId,
      })
      .orderBy('insp.createdAt', 'DESC')
      .take(MAX_ROWS);
    if (status) qb.andWhere('insp.status = :status', { status });
    const uid = scope.userId;
    if (isElevated(scope.role)) {
      // tenant-wide
    } else if (scope.role === 'CUSTOMS_OFFICER') {
      qb.andWhere('insp.officerId = :uid', { uid });
    } else if (scope.role === 'CARGO_OWNER') {
      qb.andWhere(
        `EXISTS (
          SELECT 1 FROM trips trip
          INNER JOIN loads load ON load.id = trip."loadId"
          WHERE trip.id = insp."tripId" AND load."cargoOwnerId" = :uid
        )`,
        { uid },
      );
    } else if (scope.role === 'CARGO_RECEIVER') {
      qb.andWhere(
        `EXISTS (
          SELECT 1 FROM trips trip
          INNER JOIN loads load ON load.id = trip."loadId"
          WHERE trip.id = insp."tripId" AND load."receiverId" = :uid
        )`,
        { uid },
      );
    } else if (scope.role === 'BROKER' || scope.role === 'AGENT') {
      qb.andWhere(
        `EXISTS (
          SELECT 1 FROM trips trip
          INNER JOIN loads load ON load.id = trip."loadId"
          WHERE trip.id = insp."tripId" AND load."brokerId" = :uid
        )`,
        { uid },
      );
    } else if (scope.role === 'DRIVER') {
      qb.andWhere(
        `(insp."driverId" = :uid OR EXISTS (
          SELECT 1 FROM trips trip
          INNER JOIN drivers d ON d.id = trip."driverId"
          WHERE trip.id = insp."tripId" AND d."userId" = :uid
        ))`,
        { uid },
      );
    } else if (isFleetFamily(scope.role)) {
      qb.andWhere(
        `EXISTS (
          SELECT 1 FROM trips trip
          INNER JOIN trucks truck ON truck.id = trip."truckId"
          WHERE trip.id = insp."tripId" AND truck."ownerId" = :uid
        )`,
        { uid },
      );
    } else {
      denyAll(qb);
    }
    const items = await this.readRows(qb, scope);
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
