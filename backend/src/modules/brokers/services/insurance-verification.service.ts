import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import {
  InsuranceVerification,
  VerificationStatus,
  VerificationType,
} from '../../../entities/insurance-verification.entity';
import { User, UserRole } from '../../../entities/user.entity';
import { Load } from '../../../entities/load.entity';
import { VerifyInsuranceDto } from '../dto/verify-insurance.dto';

@Injectable()
export class InsuranceVerificationService {
  private readonly logger = new Logger(InsuranceVerificationService.name);

  constructor(
    @InjectRepository(InsuranceVerification)
    private readonly verificationRepository: Repository<InsuranceVerification>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Load)
    private readonly loadRepository: Repository<Load>,
  ) {}

  /**
   * Verify insurance/compliance for a transporter
   */
  async verifyInsurance(
    brokerId: string,
    tenantId: string,
    verifyDto: VerifyInsuranceDto,
  ): Promise<InsuranceVerification> {
    // Verify broker exists
    const broker = await this.userRepository.findOne({
      where: { id: brokerId, role: UserRole.BROKER, tenantId },
    });

    if (!broker) {
      throw new NotFoundException('Broker not found');
    }

    // Verify transporter exists
    const transporter = await this.userRepository.findOne({
      where: { id: verifyDto.transporterId },
    });

    if (!transporter) {
      throw new NotFoundException('Transporter not found');
    }

    // Verify load if provided
    if (verifyDto.loadId) {
      const load = await this.loadRepository.findOne({
        where: { id: verifyDto.loadId, brokerId, tenantId },
      });

      if (!load) {
        throw new NotFoundException('Load not found or not assigned to broker');
      }
    }

    // Check expiry date
    let status = VerificationStatus.PENDING;
    if (verifyDto.expiryDate) {
      const expiryDate = new Date(verifyDto.expiryDate);
      const now = new Date();
      if (expiryDate < now) {
        status = VerificationStatus.EXPIRED;
      } else if (expiryDate.getTime() - now.getTime() < 30 * 24 * 60 * 60 * 1000) {
        // Expires within 30 days
        status = VerificationStatus.REQUIRES_UPDATE;
      } else {
        status = VerificationStatus.VERIFIED;
      }
    }

    // Create or update verification
    const existing = await this.verificationRepository.findOne({
      where: {
        transporterId: verifyDto.transporterId,
        verificationType: verifyDto.verificationType,
        loadId: verifyDto.loadId || null,
      },
    });

    if (existing) {
      // Update existing
      existing.status = status;
      existing.policyNumber = verifyDto.policyNumber || existing.policyNumber;
      existing.licenseNumber = verifyDto.licenseNumber || existing.licenseNumber;
      existing.dotNumber = verifyDto.dotNumber || existing.dotNumber;
      existing.mcNumber = verifyDto.mcNumber || existing.mcNumber;
      existing.insuranceCompany = verifyDto.insuranceCompany || existing.insuranceCompany;
      existing.coverageAmount = verifyDto.coverageAmount || existing.coverageAmount;
      existing.effectiveDate = verifyDto.effectiveDate
        ? new Date(verifyDto.effectiveDate)
        : existing.effectiveDate;
      existing.expiryDate = verifyDto.expiryDate
        ? new Date(verifyDto.expiryDate)
        : existing.expiryDate;
      existing.verificationNotes = verifyDto.verificationNotes || existing.verificationNotes;
      existing.verifiedAt = new Date();
      existing.verifiedBy = brokerId;
      existing.lastCheckedAt = new Date();

      return this.verificationRepository.save(existing);
    }

    // Create new verification
    const verification = this.verificationRepository.create({
      tenantId,
      brokerId,
      transporterId: verifyDto.transporterId,
      loadId: verifyDto.loadId,
      verificationType: verifyDto.verificationType,
      status,
      policyNumber: verifyDto.policyNumber,
      licenseNumber: verifyDto.licenseNumber,
      dotNumber: verifyDto.dotNumber,
      mcNumber: verifyDto.mcNumber,
      insuranceCompany: verifyDto.insuranceCompany,
      coverageAmount: verifyDto.coverageAmount,
      effectiveDate: verifyDto.effectiveDate ? new Date(verifyDto.effectiveDate) : undefined,
      expiryDate: verifyDto.expiryDate ? new Date(verifyDto.expiryDate) : undefined,
      verificationNotes: verifyDto.verificationNotes,
      verifiedAt: new Date(),
      verifiedBy: brokerId,
      lastCheckedAt: new Date(),
      isAutomated: false,
    });

    return this.verificationRepository.save(verification);
  }

  /**
   * Get verification status for transporter
   */
  async getTransporterVerifications(
    transporterId: string,
    brokerId: string,
    tenantId: string,
    loadId?: string,
  ): Promise<InsuranceVerification[]> {
    const where: any = {
      transporterId,
      brokerId,
      tenantId,
    };

    if (loadId) {
      where.loadId = loadId;
    }

    return this.verificationRepository.find({
      where,
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Check if transporter is compliant for a load
   */
  async checkCompliance(
    transporterId: string,
    brokerId: string,
    tenantId: string,
    requiredTypes: VerificationType[],
  ): Promise<{
    isCompliant: boolean;
    missingTypes: VerificationType[];
    expiredTypes: VerificationType[];
    warnings: string[];
  }> {
    const verifications = await this.verificationRepository.find({
      where: {
        transporterId,
        brokerId,
        tenantId,
        verificationType: requiredTypes as any,
      },
    });

    const missingTypes: VerificationType[] = [];
    const expiredTypes: VerificationType[] = [];
    const warnings: string[] = [];

    const verifiedTypes = new Set(verifications.map((v) => v.verificationType));

    for (const type of requiredTypes) {
      if (!verifiedTypes.has(type)) {
        missingTypes.push(type);
      } else {
        const verification = verifications.find((v) => v.verificationType === type);
        if (verification?.status === VerificationStatus.EXPIRED) {
          expiredTypes.push(type);
          warnings.push(`${type} has expired`);
        } else if (verification?.status === VerificationStatus.REQUIRES_UPDATE) {
          warnings.push(`${type} expires soon`);
        }
      }
    }

    const isCompliant =
      missingTypes.length === 0 && expiredTypes.length === 0;

    return {
      isCompliant,
      missingTypes,
      expiredTypes,
      warnings,
    };
  }

  /**
   * Get expiring verifications (for alerts)
   */
  async getExpiringVerifications(
    brokerId: string,
    tenantId: string,
    daysAhead: number = 30,
  ): Promise<InsuranceVerification[]> {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + daysAhead);

    return this.verificationRepository.find({
      where: {
        brokerId,
        tenantId,
        expiryDate: LessThan(futureDate),
        status: VerificationStatus.VERIFIED,
        expiryAlertSent: false,
      },
      relations: ['transporter'],
    });
  }
}

