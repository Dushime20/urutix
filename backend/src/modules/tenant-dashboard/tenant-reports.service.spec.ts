import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { DataSource, Repository, SelectQueryBuilder } from 'typeorm';
import { ALL_ENTITIES } from '../../config/database.config';
import {
  TenantReportsService,
  TenantReportQuery,
  ReportScope,
} from './tenant-reports.service';
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

const tenant = '11111111-1111-4111-8111-111111111111';
const other = '22222222-2222-4222-8222-222222222222';
const uid = '33333333-3333-4333-8333-333333333333';
const principal = (role = 'TENANT_ADMIN'): ReportScope => ({
  userId: uid,
  tenantId: tenant,
  role,
  email: 'lender@example.test',
});

describe('Role-scoped reporting (real PostgreSQL query builder; mocked database execution)', () => {
  let db: DataSource;
  let reports: TenantReportsService;
  let queries: { sql: string; parameters: unknown[]; kind: string }[];
  let count: number;

  beforeAll(async () => {
    db = new DataSource({
      type: 'postgres',
      entities: ALL_ENTITIES,
      synchronize: false,
    });
    // Building metadata and SQL needs no running database or credentials.
    await (db as any).buildMetadatas();
    reports = new TenantReportsService(
      db.getRepository(Load),
      db.getRepository(Truck),
      db.getRepository(User),
      db.getRepository(Trip),
      db.getRepository(Payment),
      db.getRepository(CreditTransaction),
      db.getRepository(Driver),
      db.getRepository(ParkingReservation),
      db.getRepository(Invoice),
      db.getRepository(DisputeV2),
      db.getRepository(LoanRequest),
      db.getRepository(LoanRepayment),
      db.getRepository(CustomsInspection),
    );
  });

  beforeEach(() => {
    count = 0;
    queries = [];
    jest.spyOn(Repository.prototype, 'save').mockResolvedValue({} as any);
    jest
      .spyOn(Repository.prototype, 'findOne')
      .mockResolvedValue({ id: tenant, name: 'Test tenant' } as any);
    const capture = (qb: SelectQueryBuilder<any>, kind: string) => {
      const [sql, parameters] = qb.getQueryAndParameters();
      queries.push({ sql, parameters, kind });
    };
    jest
      .spyOn(SelectQueryBuilder.prototype, 'getCount')
      .mockImplementation(async function () {
        capture(this, 'count');
        return count;
      });
    jest
      .spyOn(SelectQueryBuilder.prototype, 'getRawMany')
      .mockImplementation(async function () {
        capture(this, 'aggregate');
        return [];
      });
    jest
      .spyOn(SelectQueryBuilder.prototype, 'getRawOne')
      .mockImplementation(async function () {
        capture(this, 'metric');
        return { completed: '0', timed: '0', on_time: '0' };
      });
    jest
      .spyOn(SelectQueryBuilder.prototype, 'getMany')
      .mockImplementation(async function () {
        capture(this, 'rows');
        return [];
      });
  });
  afterEach(() => jest.restoreAllMocks());

  it.each([
    'SUPER_ADMIN',
    'ADMIN',
    'TENANT_ADMIN',
    'TRUCK_OWNER',
    'CARGO_OWNER',
    'DRIVER',
    'LENDER',
    'BROKER',
  ])('builds every authorized report and aggregation for %s', async (role) => {
    for (const category of reports.catalog(role)) {
      const report = await reports.generate(
        tenant,
        { category: category.id },
        principal(role),
      );
      expect(report.total).toBe(0);
      expect(report.rows).toEqual([]);
      expect(report.metadata.tenantId).toBe(tenant);
    }
    expect(queries.length).toBeGreaterThan(0);
  });

  it.each([
    'TENANT_ADMIN',
    'ADMIN',
    'TRUCK_OWNER',
    'CARGO_OWNER',
    'DRIVER',
    'BROKER',
    'LENDER',
  ])(
    'rejects cross-tenant queries and exports for %s before database access',
    async (role) => {
      const category = role === 'LENDER' ? 'loans' : 'trips';
      for (const exportAll of [false, true]) {
        await expect(
          reports.generate(
            tenant,
            { category, tenantId: other },
            principal(role),
            exportAll,
          ),
        ).rejects.toBeInstanceOf(ForbiddenException);
        await expect(
          reports.generate(other, { category }, principal(role), exportAll),
        ).rejects.toBeInstanceOf(ForbiddenException);
        await expect(
          reports.generate(
            tenant,
            { category, tenantId: '*' },
            principal(role),
            exportAll,
          ),
        ).rejects.toBeInstanceOf(ForbiddenException);
      }
      expect(queries).toEqual([]);
    },
  );

  it('fails closed for unknown roles, unauthorized categories and missing identity', async () => {
    await expect(
      reports.generate(tenant, { category: 'payments' }, principal('UNKNOWN')),
    ).rejects.toBeInstanceOf(ForbiddenException);
    await expect(
      reports.generate(tenant, { category: 'users' }, principal('DRIVER')),
    ).rejects.toBeInstanceOf(ForbiddenException);
    await expect(
      reports.generate(
        tenant,
        { category: 'trips' },
        { ...principal(), userId: '' },
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(queries).toEqual([]);
  });

  it.each([
    ['DRIVER', 'driver."userId"'],
    ['CARGO_OWNER', 'load."cargoOwnerId"'],
    ['TRUCK_OWNER', 'truck."ownerId"'],
    ['BROKER', 'load."brokerId"'],
  ])(
    'applies %s ownership to detail, counts, metrics and exports',
    async (role, predicate) => {
      for (const exportAll of [false, true]) {
        await reports.generate(
          tenant,
          { category: 'trips' },
          principal(role),
          exportAll,
        );
      }
      for (const query of queries) {
        expect(query.sql).toContain(predicate.replace(/^(\w+)\./, '"$1".'));
        expect(query.parameters).toContain(uid);
        expect(query.parameters).toContain(tenant);
      }
    },
  );

  it('resolves lender entity identity by authenticated email and tenant on every financial query', async () => {
    for (const category of ['loans', 'repayments', 'disbursements'] as const) {
      await reports.generate(tenant, { category }, principal('LENDER'), true);
    }
    for (const query of queries) {
      expect(query.sql).toContain('FROM lenders WHERE tenant_id');
      expect(query.parameters).toContain('lender@example.test');
      expect(query.parameters).toContain(tenant);
    }
  });

  it('permits platform scope only explicitly for SUPER_ADMIN', async () => {
    await reports.generate(
      tenant,
      { category: 'trips', tenantId: '*' },
      principal('SUPER_ADMIN'),
    );
    expect(queries.every((q) => !q.parameters.includes(tenant))).toBe(true);
  });

  it('applies inclusive UTC dates and parameterized search before count and pagination', async () => {
    count = 7001;
    const result = await reports.generate(
      tenant,
      {
        category: 'cargo',
        page: 3,
        pageSize: 25,
        dateFrom: '2026-10-01',
        dateTo: '2026-10-30',
        status: 'DRAFT',
        search: "%' OR 1=1 --",
      },
      principal('CARGO_OWNER'),
    );
    expect(result.total).toBe(7001);
    expect(result.page).toBe(3);
    for (const query of queries) {
      expect(query.parameters).toEqual(
        expect.arrayContaining([
          '2026-10-01T00:00:00.000Z',
          '2026-10-31T00:00:00.000Z',
          'DRAFT',
          tenant,
          uid,
        ]),
      );
      expect(query.sql).not.toContain("%' OR 1=1 --");
    }
    const detail = queries.find((q) => q.kind === 'rows')!;
    expect(detail.sql).toContain('LIMIT 25 OFFSET 50');
    expect(queries.find((q) => q.kind === 'count')!.sql).not.toContain('LIMIT');
  });

  it.each([
    { dateFrom: '2026-02-30' },
    { dateTo: 'garbage' },
    { dateFrom: '2026-10-31', dateTo: '2026-10-01' },
    { page: 0 },
    { pageSize: 201 },
    { page: 1.5 },
    { tenantId: 'invalid' },
    { search: ['x'] },
    { status: 'invented' },
    { category: '__proto__' },
    { truckId: other },
    { extra: 'ignored?' },
  ])('rejects malformed or inapplicable filters %j', async (filter) => {
    await expect(
      reports.generate(
        tenant,
        { category: 'payments', ...filter } as TenantReportQuery,
        principal(),
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects oversized exports instead of silently truncating', async () => {
    count = 5001;
    await expect(
      reports.generate(tenant, { category: 'payments' }, principal(), true),
    ).rejects.toThrow('Narrow the filters');
    expect(queries.some((q) => q.kind === 'rows')).toBe(false);
  });

  it('keeps money aggregates separated by currency and status, using child ledgers for principal', async () => {
    await reports.generate(tenant, { category: 'loans' }, principal());
    const financial = queries.find((q) =>
      q.sql.includes('outstanding_principal'),
    )!;
    expect(financial.sql).toContain(
      'GROUP BY "loan"."currency", "loan"."status"',
    );
    expect(financial.sql).toContain('SUM(principal_paid)');
    expect(financial.sql).toContain("status IN ('success', 'disbursed')");
    expect(financial.sql).not.toContain('SUM("loan"."approved_amount") -');
  });

  it('returns separate financial totals and typed detail amounts and audits a successful export', async () => {
    count = 2;
    jest.mocked(SelectQueryBuilder.prototype.getMany).mockResolvedValue([
      {
        id: 'p-1',
        amount: '12.50',
        currency: 'USD',
        status: 'completed',
        createdAt: new Date('2026-10-30'),
      },
      {
        id: 'p-2',
        amount: '1000',
        currency: 'RWF',
        status: 'pending',
        createdAt: new Date('2026-10-30'),
      },
    ] as any);
    jest
      .mocked(SelectQueryBuilder.prototype.getRawMany)
      .mockImplementation(async function () {
        const sql = this.getQuery();
        if (sql.includes('SUM('))
          return [
            { currency: 'USD', status: 'completed', amount: '12.50' },
            { currency: 'RWF', status: 'pending', amount: '1000.00' },
          ];
        if (sql.includes('TO_CHAR')) return [{ month: '2026-10', count: '2' }];
        return [
          { status: 'completed', count: '1' },
          { status: 'pending', count: '1' },
        ];
      });
    const result = await reports.generate(
      tenant,
      { category: 'payments' },
      principal('CARGO_OWNER'),
      true,
    );
    expect(result.rows[0].Amount).toBe(12.5);
    expect(result.summary.amounts).toHaveLength(2);
    expect(result.summary.trends).toEqual([{ month: '2026-10', count: 2 }]);
    expect(result.summary.statuses[0].count).toBe(1);
    expect(Repository.prototype.save).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: uid,
        tenantId: tenant,
        metadata: expect.objectContaining({ category: 'payments', total: 2 }),
      }),
    );
  });

  it('calculates completion and on-time rates using only completed trips with recorded timestamps', async () => {
    count = 10;
    jest
      .mocked(SelectQueryBuilder.prototype.getRawOne)
      .mockResolvedValue({ completed: '6', timed: '4', on_time: '3' });
    const result = await reports.generate(
      tenant,
      { category: 'trips' },
      principal('DRIVER'),
    );
    expect(result.summary.metrics).toEqual({
      'Completion rate (%)': 60,
      'On-time delivery rate (%)': 75,
    });
  });

  it('cannot widen ownership with manipulated truck or cargo-owner filters', async () => {
    await reports.generate(
      tenant,
      { category: 'trips', truckId: other, cargoOwnerId: other },
      principal('TRUCK_OWNER'),
      true,
    );
    for (const query of queries) {
      expect(query.sql).toContain('"truck"."ownerId"');
      expect(query.parameters).toEqual(
        expect.arrayContaining([tenant, uid, other]),
      );
    }
  });

  it('does not match blank reservation emails when the authenticated identity has no email', async () => {
    await reports.generate(
      tenant,
      { category: 'parking' },
      { ...principal('DRIVER'), email: undefined },
    );
    for (const query of queries) {
      expect(query.sql).toContain('"p"."submittedByUserId"');
      expect(query.sql).not.toContain('"p"."email" =');
      expect(query.parameters).not.toContain('');
    }
  });

  it('escapes CSV quotes, separators, newlines and spreadsheet formulas without corrupting numeric negatives', () => {
    const csv = reports.toCsv({
      headers: ['Name', 'Value'],
      rows: [
        { Name: 'a,"b\nc', Value: '=HYPERLINK("evil")' },
        { Name: '@formula', Value: -5 },
      ],
    } as any);
    expect(csv).toContain('"a,""b\nc"');
    expect(csv).toContain('"\'=HYPERLINK(""evil"")"');
    expect(csv).toContain('"\'@formula","-5"');
  });
});
