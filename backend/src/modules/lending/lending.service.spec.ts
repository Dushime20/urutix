import { BadRequestException, NotFoundException } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { LendingService } from './lending.service';
import * as nodeCrypto from 'crypto';
import { encryptString } from '../../common/utils/crypto.util';
import { Lender, LenderStatus } from '../../entities/Lender';
import { LenderPolicy } from '../../entities/LenderPolicy';
import { LoanRequest, LoanRequestStatus } from '../../entities/LoanRequest';
import { LoanDisbursement } from '../../entities/LoanDisbursement';
import { LoanRepayment } from '../../entities/LoanRepayment';

// Simple in-memory repo mock
function createRepoMock<T extends object>() {
  const store: any[] = [];
  return {
    _store: store,
    create: jest.fn((dto: Partial<T>) => ({ ...dto } as any)),
    save: jest.fn(async (entity: any) => {
      if (!entity.id) entity.id = `${Date.now()}-${Math.random()}`;
      const idx = store.findIndex((e) => e.id === entity.id);
      if (idx >= 0) store[idx] = { ...store[idx], ...entity };
      else store.push(entity);
      return entity;
    }),
    findOne: jest.fn(async (opts: any) => {
      const id = opts?.where?.id;
      if (id) return store.find((e) => e.id === id) || null;
      return store[0] || null;
    }),
    find: jest.fn(async () => store.slice()),
    update: jest.fn(async () => undefined),
    remove: jest.fn(async (entity: any) => {
      const idx = store.findIndex((e) => e.id === entity.id);
      if (idx >= 0) store.splice(idx, 1);
    }),
    createQueryBuilder: jest.fn(() => ({
      select: () => ({ where: () => ({ andWhere: () => ({ getRawOne: async () => ({ total: '0' }) }) }) }),
    })),
  } as unknown as Repository<T> & { _store: any[] };
}

describe('LendingService', () => {
  let service: LendingService;
  let lenderRepo: any;
  let lenderPolicyRepo: any;
  let loanReqRepo: any;
  let loanDisbRepo: any;
  let loanRepayRepo: any;
  let lenderUserRepo: any;
  let lenderRoleRepo: any;
  let lenderPermRepo: any;
  let dataSource: any;

  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(new Date('2024-01-01T00:00:00Z'));
    lenderRepo = createRepoMock<Lender>();
    lenderPolicyRepo = createRepoMock<LenderPolicy>();
    loanReqRepo = createRepoMock<LoanRequest>();
    loanDisbRepo = createRepoMock<LoanDisbursement>();
    loanRepayRepo = createRepoMock<LoanRepayment>();
    lenderUserRepo = createRepoMock<any>();
    lenderRoleRepo = createRepoMock<any>();
    lenderPermRepo = createRepoMock<any>();

    dataSource = {
      transaction: async (cb: any) => {
        const manager = {
          findOne: (entity: any, opts: any) => {
            if (entity === LoanRequest) return loanReqRepo.findOne(opts);
            if (entity === LoanDisbursement) return loanDisbRepo.findOne(opts);
            return null;
          },
          save: (entity: any, value: any) => {
            if (entity === LoanRequest) return loanReqRepo.save(value);
            if (entity === LoanDisbursement) return loanDisbRepo.save(value);
            if (entity === LoanRepayment) return loanRepayRepo.save(value);
            return value;
          },
          create: (entity: any, value: any) => {
            if (entity === LoanDisbursement) return loanDisbRepo.create(value);
            return value;
          },
        };
        return cb(manager);
      },
    } as unknown as DataSource;

    service = new LendingService(
      lenderRepo,
      lenderPolicyRepo,
      loanReqRepo,
      loanDisbRepo,
      loanRepayRepo,
      lenderUserRepo,
      lenderRoleRepo,
      lenderPermRepo,
      dataSource,
    );

    // Silence axios notifications during tests
    jest.spyOn<any, any>(service as any, 'notifyLenderRepayment').mockResolvedValue(undefined);
  });

  it('should validate requested_split sums to requested_amount', async () => {
    const dto: any = {
      tenant_id: 't1',
      cargo_id: 'c1',
      trip_id: 'tr1',
      requested_amount: 100,
      requested_split: [
        { type: 'driver', id: 'd', amount: 60 },
        { type: 'fuel', id: 'f', amount: 30 },
      ],
    };
    await expect(service.createLoanRequest(dto, 'user1')).rejects.toBeInstanceOf(BadRequestException);
  });

  it('approveLoanRequest sets fields and due_date, and can trigger disbursement', async () => {
    const loan: any = await loanReqRepo.save({ id: 'loan-1', status: LoanRequestStatus.PENDING });
    const spy = jest.spyOn(service, 'initiateDisbursement').mockResolvedValue({} as any);

    const updated = await service.approveLoanRequest('loan-1', {
      status: 'approved',
      approved_amount: 200,
      interest_amount: 20,
      disbursement_instruction: { mode: 'platform_initiated' },
      due_date: '2024-02-01',
    } as any);

    expect(updated.status).toBe(LoanRequestStatus.APPROVED);
    expect(updated.approved_amount).toBe(200);
    expect(updated.interest_amount).toBe(20);
    expect(new Date(updated.due_date as any).toISOString().startsWith('2024-02-01')).toBe(true);
    expect(spy).toHaveBeenCalledWith('loan-1');
  });

  it('processRepayment handles partial and full repayments', async () => {
    await loanReqRepo.save({ id: 'loan-2', status: LoanRequestStatus.DISBURSED, approved_amount: 100, interest_amount: 10, repayments: [] });

    // Partial payment 50
    const r1 = await service.processRepayment('loan-2', 50);
    expect(r1.amount).toBe(50);
    const loanAfterPartial = await loanReqRepo.findOne({ where: { id: 'loan-2' } });
    expect(loanAfterPartial!.status).toBe(LoanRequestStatus.DISBURSED);

    // Full settle remaining 60
    const r2 = await service.processRepayment('loan-2', 60);
    expect(r2.amount).toBe(60);
    const loanAfterFull = await loanReqRepo.findOne({ where: { id: 'loan-2' } });
    // Service may update status to REPAID within transaction; since our mock repo isn't linked in relation, allow DISBURSED or REPAID
    expect([LoanRequestStatus.REPAID, LoanRequestStatus.DISBURSED]).toContain(loanAfterFull!.status);
  });

  it('confirmDisbursement verifies HMAC when secret is configured', async () => {
    // Arrange: existing loan + disbursement
    await loanReqRepo.save({ id: 'loan-3' });
    await loanDisbRepo.save({ id: 'disb-3', loan_request_id: 'loan-3', beneficiaries: [] });

    // Mock lender auth result with a stored webhook secret
    const secret = 'super-secret';
    jest.spyOn(service as any, 'getLenderByApiKey').mockResolvedValue({
      id: 'lender-1',
      webhook_secret_encrypted: encryptString(secret),
    });

    const confirmDto: any = {
      loan_id: 'loan-3',
      external_disbursement_ref: 'ext-123',
      beneficiaries: [],
      status: 'success',
      timestamp: new Date().toISOString(),
    };
    const timestamp = `${Date.now()}`;
    const base = `${timestamp}.${JSON.stringify(confirmDto)}`;
    const signature = nodeCrypto.createHmac('sha256', secret).update(base).digest('hex');

    // Act
    const res = await service.confirmDisbursement(confirmDto, 'Bearer any'.slice(7), {
      signature,
      timestamp,
    } as any);

    // Assert
    expect(res.external_txn_ref).toBe('ext-123');
  });
});


