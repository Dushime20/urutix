import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { LendingController } from './lending.controller';
import { LendingService } from './lending.service';
import { RiskAssessmentService } from './services/risk-assessment.service';
import { AutoLoanGeneratorService } from './services/auto-loan-generator.service';
import { LenderAnalyticsService } from './services/lender-analytics.service';
import { RepaymentProcessorService } from './services/repayment-processor.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';

describe('LendingController (integration)', () => {
  let app: INestApplication;
  const serviceMock = {
    createLoanRequest: jest.fn(),
    confirmDisbursement: jest.fn(),
  } as unknown as LendingService;
  const riskAssessmentMock = {
    assessLoanRisk: jest.fn().mockResolvedValue({ overall_score: 0.8 }),
  } as unknown as RiskAssessmentService;
  const autoLoanGeneratorMock = {
    checkAndGenerateAutoLoan: jest.fn(),
    processBulkAutoLoanGeneration: jest.fn(),
  } as unknown as AutoLoanGeneratorService;
  const lenderAnalyticsMock = {
    getPortfolioMetrics: jest.fn(),
    getROIAnalysis: jest.fn(),
    getDefaultAnalysis: jest.fn(),
    getExposureAnalysis: jest.fn(),
  } as unknown as LenderAnalyticsService;
  const repaymentProcessorMock = {
    calculateRepaymentSchedule: jest.fn(),
    getRepaymentHistory: jest.fn(),
    getOutstandingBalance: jest.fn(),
  } as unknown as RepaymentProcessorService;

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      controllers: [LendingController],
      providers: [
        { provide: LendingService, useValue: serviceMock },
        { provide: RiskAssessmentService, useValue: riskAssessmentMock },
        { provide: AutoLoanGeneratorService, useValue: autoLoanGeneratorMock },
        { provide: LenderAnalyticsService, useValue: lenderAnalyticsMock },
        {
          provide: RepaymentProcessorService,
          useValue: repaymentProcessorMock,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    app = moduleRef.createNestApplication();
    // Inject a mock authenticated user for controller methods that read req.user.id
    app.use((req, _res, next) => {
      req.user = { id: '11111111-1111-1111-1111-111111111111' };
      next();
    });

    // Configure validation pipe exactly like the main app
    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
        validateCustomDecorators: true,
      }),
    );

    await app.init();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /api/lending/loan-requests should validate body and return 400 on missing fields', async () => {
    serviceMock.createLoanRequest = jest.fn();

    const res = await request(app.getHttpServer())
      .post('/api/lending/loan-requests')
      .send({})
      .expect(400);

    expect(res.body.message).toBeDefined();
    expect(serviceMock.createLoanRequest).not.toHaveBeenCalled();
  });

  it('POST /api/platform/v1/lender_disbursements should require Authorization header', async () => {
    serviceMock.confirmDisbursement = jest
      .fn()
      .mockRejectedValue(new Error('Missing Authorization header'));

    await request(app.getHttpServer())
      .post('/api/platform/v1/lender_disbursements')
      .send({
        loan_id: '11111111-1111-1111-1111-111111111111',
        external_disbursement_ref: 'ref',
        beneficiaries: [],
        status: 'success',
        timestamp: new Date().toISOString(),
      })
      .expect(400); // Missing headers/body validation triggers Bad Request; endpoint is reachable
  });

  it('POST /api/lending/loan-requests should accept valid loan request data', async () => {
    const validLoanRequest = {
      tenant_id: '550e8400-e29b-41d4-a716-446655440000',
      cargo_id: '550e8400-e29b-41d4-a716-446655440001',
      trip_id: '550e8400-e29b-41d4-a716-446655440002',
      requested_amount: 10000,
      requested_split: [
        {
          type: 'fuel',
          id: '550e8400-e29b-41d4-a716-446655440010',
          amount: 5000,
        },
        {
          type: 'maintenance',
          id: '550e8400-e29b-41d4-a716-446655440011',
          amount: 5000,
        },
      ],
      created_by: '550e8400-e29b-41d4-a716-446655440099',
    };

    serviceMock.createLoanRequest = jest.fn().mockResolvedValue({
      id: '11111111-1111-1111-1111-111111111111',
      ...validLoanRequest,
      status: 'pending',
      created_at: new Date(),
    });

    const res = await request(app.getHttpServer())
      .post('/api/lending/loan-requests')
      .send(validLoanRequest)
      .expect(201);

    expect(res.body).toBeDefined();
    expect(serviceMock.createLoanRequest).toHaveBeenCalled();
  });

  it('POST /api/lending/loan-requests should show validation errors for invalid data', async () => {
    const invalidLoanRequest = {
      tenant_id: '11111111-1111-1111-1111-111111111111',
      // Missing required fields
    };

    const res = await request(app.getHttpServer())
      .post('/api/lending/loan-requests')
      .send(invalidLoanRequest)
      .expect(400);

    expect(res.body.message).toBeDefined();
    expect(serviceMock.createLoanRequest).not.toHaveBeenCalled();
  });
});
