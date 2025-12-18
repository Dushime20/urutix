import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import axios, { AxiosInstance } from 'axios';
import * as crypto from 'crypto';
import { Lender } from '../../../entities/Lender';
import { LoanRequest, LoanRequestStatus } from '../../../entities/LoanRequest';
import { Trip } from '../../../entities/trip.entity';
import { Load } from '../../../entities/load.entity';
import { User } from '../../../entities/user.entity';
import { UserProfile } from '../../../entities/user-profile.entity';
import { decryptString } from '../../../common/utils/crypto.util';

export interface UrutiLendingConfig {
  baseUrl: string;
  apiKey: string;
  webhookSecret?: string;
  loanProductCode?: string;
}

export interface CreateApplicationRequest {
  externalReferenceId: string;
  loanProductCode: string;
  companyId: string;
  requestedAmount: number;
  applicationType: string;
  customer: {
    externalCustomerId: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
  };
  tripId: string;
  tripRevenue: number;
  advanceAmount: number;
  tripStartDate: string;
  tripEndDate: string;
  expectedRevenueDate: string;
  loanOfficerId?: string;
}

export interface ApplicationResponse {
  applicationId: string;
  loanNumber?: string;
  status: string;
  externalReferenceId: string;
  approvedAmount?: number;
  message?: string;
}

export interface LoanStatusResponse {
  loanNumber: string;
  status: string;
  loanAmount: number;
  disbursedAmount: number;
  outstandingBalance: number;
  totalAmountPaid: number;
  nextRepaymentDate?: string;
  nextRepaymentAmount?: number;
}

export interface RepaymentRequest {
  externalReferenceId: string;
  loanReference: string;
  amount: number;
  paymentDate: string;
  tripId: string;
  revenueTransactionId?: string;
  totalTripRevenue?: number;
  repaymentPercentage?: number;
}

export interface WebhookPayload {
  event: string;
  timestamp: string;
  data: any;
}

@Injectable()
export class UrutiLendingIntegrationService {
  private readonly logger = new Logger(UrutiLendingIntegrationService.name);
  private axiosInstance: AxiosInstance;

  constructor(
    @InjectRepository(Lender)
    private lenderRepository: Repository<Lender>,
    @InjectRepository(LoanRequest)
    private loanRequestRepository: Repository<LoanRequest>,
    @InjectRepository(Trip)
    private tripRepository: Repository<Trip>,
    @InjectRepository(Load)
    private loadRepository: Repository<Load>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(UserProfile)
    private userProfileRepository: Repository<UserProfile>,
    private configService: ConfigService,
  ) {}

  /**
   * Get Uruti Lending Platform configuration from lender entity
   */
  private async getLenderConfig(lenderId: string): Promise<UrutiLendingConfig> {
    const lender = await this.lenderRepository.findOne({
      where: { id: lenderId },
    });

    if (!lender) {
      throw new NotFoundException(`Lender ${lenderId} not found`);
    }

    if (!lender.callback_url) {
      throw new BadRequestException(
        `Lender ${lenderId} does not have callback_url configured`,
      );
    }

    // Extract base URL from callback_url (remove /api if present)
    const baseUrl = lender.callback_url.replace(/\/api\/?$/, '');

    // Get API key from encrypted storage
    let apiKey: string;
    if (lender.outbound_api_key_encrypted) {
      try {
        apiKey = decryptString(lender.outbound_api_key_encrypted);
      } catch (error) {
        this.logger.error(
          `Failed to decrypt API key for lender ${lenderId}: ${error.message}`,
        );
        throw new BadRequestException('Invalid API key configuration');
      }
    } else {
      throw new BadRequestException(
        `Lender ${lenderId} does not have API key configured`,
      );
    }

    // Get webhook secret if available
    let webhookSecret: string | undefined;
    if (lender.webhook_secret_encrypted) {
      try {
        webhookSecret = decryptString(lender.webhook_secret_encrypted);
      } catch (error) {
        this.logger.warn(
          `Failed to decrypt webhook secret for lender ${lenderId}: ${error.message}`,
        );
      }
    }

    // Get loan product code from metadata or use default
    const loanProductCode =
      lender.metadata?.loanProductCode ||
      lender.metadata?.defaultLoanProductCode ||
      'PL-001';

    return {
      baseUrl,
      apiKey,
      webhookSecret,
      loanProductCode,
    };
  }

  /**
   * Create axios instance with API key authentication
   */
  private createAxiosInstance(config: UrutiLendingConfig): AxiosInstance {
    return axios.create({
      baseURL: `${config.baseUrl}/api`,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': config.apiKey,
      },
    });
  }

  /**
   * Map UrutiX loan status to Uruti Lending Platform status
   */
  private mapStatusToUrutiLending(
    status: LoanRequestStatus,
  ): { applicationStatus?: string; loanStatus?: string } {
    const mapping: Record<
      LoanRequestStatus,
      { applicationStatus?: string; loanStatus?: string }
    > = {
      [LoanRequestStatus.PENDING]: {
        applicationStatus: 'Submitted',
      },
      [LoanRequestStatus.APPROVED]: {
        applicationStatus: 'Approved',
      },
      [LoanRequestStatus.REJECTED]: {
        applicationStatus: 'Rejected',
      },
      [LoanRequestStatus.DISBURSED]: {
        loanStatus: 'Active',
      },
      [LoanRequestStatus.REPAID]: {
        loanStatus: 'Closed',
      },
      [LoanRequestStatus.FAILED]: {
        applicationStatus: 'Rejected',
      },
      [LoanRequestStatus.DEFAULTED]: {
        loanStatus: 'Written Off',
      },
    };

    return mapping[status] || {};
  }

  /**
   * Map Uruti Lending Platform status to UrutiX status
   */
  mapStatusFromUrutiLending(
    applicationStatus?: string,
    loanStatus?: string,
  ): LoanRequestStatus {
    // Priority: loanStatus > applicationStatus
    const status = loanStatus || applicationStatus || '';

    const statusMap: Record<string, LoanRequestStatus> = {
      Draft: LoanRequestStatus.PENDING,
      Submitted: LoanRequestStatus.PENDING,
      'Under Review': LoanRequestStatus.PENDING,
      Approved: LoanRequestStatus.APPROVED,
      Rejected: LoanRequestStatus.REJECTED,
      Sanctioned: LoanRequestStatus.APPROVED,
      'Partially Disbursed': LoanRequestStatus.DISBURSED,
      Disbursed: LoanRequestStatus.DISBURSED,
      Active: LoanRequestStatus.DISBURSED,
      'Loan Closure Requested': LoanRequestStatus.REPAID,
      Closed: LoanRequestStatus.REPAID,
      'Written Off': LoanRequestStatus.DEFAULTED,
      Settled: LoanRequestStatus.REPAID,
    };

    return statusMap[status] || LoanRequestStatus.PENDING;
  }

  /**
   * Create loan application in Uruti Lending Platform
   */
  async createLoanApplication(
    loanRequest: LoanRequest,
    lenderId: string,
  ): Promise<ApplicationResponse> {
    try {
      const config = await this.getLenderConfig(lenderId);
      const axiosInstance = this.createAxiosInstance(config);

      // Fetch related entities
      const trip = await this.tripRepository.findOne({
        where: { id: loanRequest.trip_id },
        relations: ['load'],
      });

      if (!trip) {
        throw new NotFoundException(
          `Trip ${loanRequest.trip_id} not found`,
        );
      }

      const load = trip.load || (await this.loadRepository.findOne({
        where: { id: trip.loadId },
      }));

      // Get borrower information
      let borrower: User | null = null;
      let borrowerProfile: UserProfile | null = null;

      if (loanRequest.borrower_id) {
        borrower = await this.userRepository.findOne({
          where: { id: loanRequest.borrower_id },
        });
        if (borrower) {
          borrowerProfile = await this.userProfileRepository.findOne({
            where: { userId: borrower.id },
          });
        }
      }

      // If no borrower, try to get from cargo owner
      if (!borrower && load) {
        const cargoOwner = await this.userRepository.findOne({
          where: { id: load.cargoOwnerId },
        });
        if (cargoOwner) {
          borrower = cargoOwner;
          borrowerProfile = await this.userProfileRepository.findOne({
            where: { userId: cargoOwner.id },
          });
        }
      }

      if (!borrower) {
        throw new NotFoundException('Borrower not found for loan request');
      }

      // Build customer information
      const firstName =
        borrowerProfile?.firstName || borrower.email.split('@')[0];
      const lastName = borrowerProfile?.lastName || '';
      const email = borrower.email;
      const phone = borrower.phone || '';

      // Calculate trip revenue (use load value or offered price)
      const tripRevenue =
        load?.loadValue || load?.offeredPrice || loanRequest.requested_amount * 2;

      // Build application request
      const applicationRequest: CreateApplicationRequest = {
        externalReferenceId: loanRequest.idempotency_key || loanRequest.id,
        loanProductCode: config.loanProductCode,
        companyId: loanRequest.tenant_id,
        requestedAmount: loanRequest.requested_amount,
        applicationType: 'Trip Financing',
        customer: {
          externalCustomerId: borrower.id,
          firstName,
          lastName,
          email,
          phone,
        },
        tripId: loanRequest.trip_id,
        tripRevenue,
        advanceAmount: loanRequest.requested_amount,
        tripStartDate: trip.actualStartTime
          ? new Date(trip.actualStartTime).toISOString().split('T')[0]
          : trip.plannedStartTime
            ? new Date(trip.plannedStartTime).toISOString().split('T')[0]
            : new Date().toISOString().split('T')[0],
        tripEndDate: trip.actualEndTime
          ? new Date(trip.actualEndTime).toISOString().split('T')[0]
          : trip.plannedEndTime
            ? new Date(trip.plannedEndTime).toISOString().split('T')[0]
            : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
                .toISOString()
                .split('T')[0],
        expectedRevenueDate: trip.actualEndTime
          ? new Date(
              new Date(trip.actualEndTime).getTime() + 5 * 24 * 60 * 60 * 1000,
            )
              .toISOString()
              .split('T')[0]
          : trip.plannedEndTime
            ? new Date(
                new Date(trip.plannedEndTime).getTime() + 5 * 24 * 60 * 60 * 1000,
              )
                .toISOString()
                .split('T')[0]
            : new Date(Date.now() + 12 * 24 * 60 * 60 * 1000)
                .toISOString()
                .split('T')[0],
        loanOfficerId: loanRequest.metadata?.loanOfficerId,
      };

      this.logger.log(
        `Creating loan application in Uruti Lending Platform for loan ${loanRequest.id}`,
      );

      const response = await axiosInstance.post<ApplicationResponse>(
        '/integration/applications',
        applicationRequest,
      );

      // Update loan request with external reference
      if (response.data.loanNumber) {
        loanRequest.external_loan_ref = response.data.loanNumber;
        await this.loanRequestRepository.save(loanRequest);
      }

      this.logger.log(
        `Successfully created loan application: ${response.data.applicationId}`,
      );

      return response.data;
    } catch (error) {
      this.logger.error(
        `Failed to create loan application: ${error.message}`,
        error.stack,
      );

      if (error.response) {
        throw new HttpException(
          error.response.data?.message || 'Failed to create loan application',
          error.response.status || HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      throw error;
    }
  }

  /**
   * Get loan status from Uruti Lending Platform
   */
  async getLoanStatus(
    loanReference: string,
    lenderId: string,
  ): Promise<LoanStatusResponse> {
    try {
      const config = await this.getLenderConfig(lenderId);
      const axiosInstance = this.createAxiosInstance(config);

      const response = await axiosInstance.get<LoanStatusResponse>(
        `/integration/loans/${loanReference}/status`,
      );

      return response.data;
    } catch (error) {
      this.logger.error(
        `Failed to get loan status: ${error.message}`,
        error.stack,
      );

      if (error.response) {
        throw new HttpException(
          error.response.data?.message || 'Failed to get loan status',
          error.response.status || HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      throw error;
    }
  }

  /**
   * Get application status from Uruti Lending Platform
   */
  async getApplicationStatus(
    externalReferenceId: string,
    lenderId: string,
  ): Promise<ApplicationResponse> {
    try {
      const config = await this.getLenderConfig(lenderId);
      const axiosInstance = this.createAxiosInstance(config);

      const response = await axiosInstance.get<ApplicationResponse>(
        `/integration/applications/${externalReferenceId}`,
      );

      return response.data;
    } catch (error) {
      this.logger.error(
        `Failed to get application status: ${error.message}`,
        error.stack,
      );

      if (error.response) {
        throw new HttpException(
          error.response.data?.message || 'Failed to get application status',
          error.response.status || HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      throw error;
    }
  }

  /**
   * Get loan officers from Uruti Lending Platform
   */
  async getLoanOfficers(lenderId: string): Promise<any[]> {
    try {
      const config = await this.getLenderConfig(lenderId);
      const axiosInstance = this.createAxiosInstance(config);

      this.logger.log(`Fetching loan officers from: ${config.baseUrl}/integration/loan-officers`);
      
      const response = await axiosInstance.get('/integration/loan-officers');

      this.logger.log(`Loan officers API response status: ${response.status}`);
      this.logger.log(`Loan officers API response data:`, JSON.stringify(response.data, null, 2));

      // Handle different response formats
      let officers: any[] = [];
      if (response.data?.loanOfficers) {
        officers = response.data.loanOfficers;
      } else if (Array.isArray(response.data)) {
        officers = response.data;
      } else if (response.data?.data && Array.isArray(response.data.data)) {
        officers = response.data.data;
      }

      this.logger.log(`Parsed ${officers.length} loan officers from response`);
      
      return officers;
    } catch (error: any) {
      this.logger.error(
        `Failed to get loan officers for lender ${lenderId}: ${error.message}`,
        error.stack,
      );

      // Log detailed error information
      if (error.response) {
        this.logger.error(`Error response status: ${error.response.status}`);
        this.logger.error(`Error response data:`, JSON.stringify(error.response.data, null, 2));
        this.logger.error(`Error response URL: ${error.config?.url}`);
        
        // If 404, the endpoint doesn't exist - return empty array instead of throwing
        if (error.response.status === 404) {
          this.logger.warn(`Loan officers endpoint not found (404). External system needs to implement: GET /api/integration/loan-officers`);
          return [];
        }
        
        // For other errors, still return empty array but log the error
        this.logger.error(`API error: ${error.response.status} - ${error.response.data?.message || 'Unknown error'}`);
        return [];
      }

      // Network errors, timeouts, etc.
      if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
        this.logger.error(`Cannot connect to external system: ${error.message}`);
        return [];
      }

      // For any other error, return empty array instead of throwing
      this.logger.error(`Unexpected error fetching loan officers: ${error.message}`);
      return [];
    }
  }

  /**
   * Post repayment to Uruti Lending Platform
   */
  async postRepayment(
    repaymentRequest: RepaymentRequest,
    lenderId: string,
  ): Promise<any> {
    try {
      const config = await this.getLenderConfig(lenderId);
      const axiosInstance = this.createAxiosInstance(config);

      const response = await axiosInstance.post(
        '/integration/repayments',
        repaymentRequest,
      );

      return response.data;
    } catch (error) {
      this.logger.error(
        `Failed to post repayment: ${error.message}`,
        error.stack,
      );

      if (error.response) {
        throw new HttpException(
          error.response.data?.message || 'Failed to post repayment',
          error.response.status || HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      throw error;
    }
  }

  /**
   * Verify webhook signature using HMAC SHA-256
   */
  verifyWebhookSignature(
    payload: string | object,
    signature: string,
    secret: string,
  ): boolean {
    try {
      const payloadString =
        typeof payload === 'string' ? payload : JSON.stringify(payload);
      const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(payloadString)
        .digest('hex');

      return crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expectedSignature),
      );
    } catch (error) {
      this.logger.error(
        `Failed to verify webhook signature: ${error.message}`,
      );
      return false;
    }
  }

  /**
   * Process webhook event from Uruti Lending Platform
   */
  async processWebhookEvent(
    webhookPayload: WebhookPayload,
    lenderId: string,
  ): Promise<void> {
    try {
      const config = await this.getLenderConfig(lenderId);

      // Find loan request by external reference
      const externalReferenceId =
        webhookPayload.data?.externalReferenceId ||
        webhookPayload.data?.external_reference_id;

      if (!externalReferenceId) {
        this.logger.warn(
          'Webhook payload missing externalReferenceId',
          webhookPayload,
        );
        return;
      }

      // Find loan request by idempotency key or external reference
      const loanRequest = await this.loanRequestRepository.findOne({
        where: [
          { idempotency_key: externalReferenceId },
          { external_loan_ref: webhookPayload.data?.loanNumber },
        ],
      });

      if (!loanRequest) {
        this.logger.warn(
          `Loan request not found for external reference: ${externalReferenceId}`,
        );
        return;
      }

      // Process based on event type
      switch (webhookPayload.event) {
        case 'application.approved':
          await this.handleApplicationApproved(loanRequest, webhookPayload.data);
          break;
        case 'application.rejected':
          await this.handleApplicationRejected(loanRequest, webhookPayload.data);
          break;
        case 'loan.status.updated':
          await this.handleLoanStatusUpdated(loanRequest, webhookPayload.data);
          break;
        case 'repayment.posted':
          await this.handleRepaymentPosted(loanRequest, webhookPayload.data);
          break;
        default:
          this.logger.warn(
            `Unhandled webhook event: ${webhookPayload.event}`,
          );
      }
    } catch (error) {
      this.logger.error(
        `Failed to process webhook event: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Handle application approved event
   */
  private async handleApplicationApproved(
    loanRequest: LoanRequest,
    data: any,
  ): Promise<void> {
    loanRequest.status = LoanRequestStatus.APPROVED;
    loanRequest.approved_amount = data.approvedAmount || loanRequest.requested_amount;
    loanRequest.external_loan_ref = data.loanNumber || loanRequest.external_loan_ref;

    if (data.approvedAt) {
      loanRequest.metadata = {
        ...loanRequest.metadata,
        approvedAt: data.approvedAt,
        approvedBy: data.approvedBy,
      };
    }

    await this.loanRequestRepository.save(loanRequest);
    this.logger.log(`Loan request ${loanRequest.id} approved`);
  }

  /**
   * Handle application rejected event
   */
  private async handleApplicationRejected(
    loanRequest: LoanRequest,
    data: any,
  ): Promise<void> {
    loanRequest.status = LoanRequestStatus.REJECTED;
    loanRequest.rejection_reason = data.reason || data.rejectionReason || 'Rejected by lender';

    await this.loanRequestRepository.save(loanRequest);
    this.logger.log(`Loan request ${loanRequest.id} rejected: ${loanRequest.rejection_reason}`);
  }

  /**
   * Handle loan status updated event
   */
  private async handleLoanStatusUpdated(
    loanRequest: LoanRequest,
    data: any,
  ): Promise<void> {
    const newStatus = this.mapStatusFromUrutiLending(
      data.applicationStatus,
      data.status || data.loanStatus,
    );

    loanRequest.status = newStatus;
    loanRequest.external_loan_ref = data.loanNumber || loanRequest.external_loan_ref;

    if (data.status === 'Disbursed' || data.status === 'Active') {
      loanRequest.status = LoanRequestStatus.DISBURSED;
    }

    await this.loanRequestRepository.save(loanRequest);
    this.logger.log(
      `Loan request ${loanRequest.id} status updated to ${newStatus}`,
    );
  }

  /**
   * Handle repayment posted event
   */
  private async handleRepaymentPosted(
    loanRequest: LoanRequest,
    data: any,
  ): Promise<void> {
    // Update loan request metadata with repayment info
    loanRequest.metadata = {
      ...loanRequest.metadata,
      lastRepayment: {
        amount: data.amount,
        date: data.paymentDate || data.repaidAt,
        transactionId: data.transactionId,
      },
    };

    // If fully repaid, update status
    if (data.outstandingBalance === 0 || data.status === 'Closed') {
      loanRequest.status = LoanRequestStatus.REPAID;
    }

    await this.loanRequestRepository.save(loanRequest);
    this.logger.log(`Repayment posted for loan request ${loanRequest.id}`);
  }
}

