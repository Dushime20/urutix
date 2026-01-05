import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EscrowAccount, EscrowStatus, ReleaseTrigger } from '../../../entities/escrow-account.entity';
import { Load } from '../../../entities/load.entity';
import { User, UserRole } from '../../../entities/user.entity';
import { CreateEscrowDto } from '../dto/create-escrow.dto';

@Injectable()
export class EscrowService {
  private readonly logger = new Logger(EscrowService.name);

  constructor(
    @InjectRepository(EscrowAccount)
    private readonly escrowRepository: Repository<EscrowAccount>,
    @InjectRepository(Load)
    private readonly loadRepository: Repository<Load>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  /**
   * Create escrow account for a load
   */
  async createEscrow(
    brokerId: string,
    tenantId: string,
    createDto: CreateEscrowDto,
  ): Promise<EscrowAccount> {
    // Verify broker exists
    const broker = await this.userRepository.findOne({
      where: { id: brokerId, role: UserRole.BROKER, tenantId },
    });

    if (!broker) {
      throw new NotFoundException('Broker not found');
    }

    // Verify load exists and is assigned to broker
    const load = await this.loadRepository.findOne({
      where: { id: createDto.loadId, brokerId, tenantId },
    });

    if (!load) {
      throw new NotFoundException('Load not found or not assigned to broker');
    }

    // Verify payer and payee exist
    const payer = await this.userRepository.findOne({
      where: { id: createDto.payerId },
    });

    if (!payer) {
      throw new NotFoundException('Payer not found');
    }

    const payee = await this.userRepository.findOne({
      where: { id: createDto.payeeId },
    });

    if (!payee) {
      throw new NotFoundException('Payee not found');
    }

    // Check if escrow already exists for this load
    const existing = await this.escrowRepository.findOne({
      where: { loadId: createDto.loadId, tenantId },
    });

    if (existing) {
      throw new BadRequestException('Escrow account already exists for this load');
    }

    // Create escrow account
    const escrow = this.escrowRepository.create({
      tenantId,
      brokerId,
      loadId: createDto.loadId,
      tripId: createDto.tripId,
      payerId: createDto.payerId,
      payeeId: createDto.payeeId,
      status: EscrowStatus.PENDING,
      totalAmount: createDto.totalAmount,
      currencyCode: createDto.currencyCode || 'KES',
      commissionAmount: createDto.commissionAmount,
      paymentMethod: createDto.paymentMethod,
      releaseSchedule: (createDto.releaseSchedule || []).map((schedule) => ({
        ...schedule,
        released: false,
      })),
      autoReleaseConfig: createDto.autoReleaseConfig,
      releaseHistory: [],
      refundHistory: [],
    });

    return this.escrowRepository.save(escrow);
  }

  /**
   * Fund escrow account
   */
  async fundEscrow(
    escrowId: string,
    brokerId: string,
    tenantId: string,
    fundingData: {
      amount: number;
      paymentMethod: string;
      paymentReference: string;
      transactionId?: string;
    },
  ): Promise<EscrowAccount> {
    const escrow = await this.escrowRepository.findOne({
      where: { id: escrowId, brokerId, tenantId },
    });

    if (!escrow) {
      throw new NotFoundException('Escrow account not found');
    }

    if (escrow.status !== EscrowStatus.PENDING) {
      throw new BadRequestException('Escrow account is not in PENDING status');
    }

    escrow.fundedAmount = fundingData.amount;
    escrow.paymentMethod = fundingData.paymentMethod;
    escrow.paymentReference = fundingData.paymentReference;
    escrow.transactionId = fundingData.transactionId;
    escrow.fundedAt = new Date();
    escrow.status = EscrowStatus.FUNDED;

    return this.escrowRepository.save(escrow);
  }

  /**
   * Release funds from escrow
   */
  async releaseFunds(
    escrowId: string,
    brokerId: string,
    tenantId: string,
    releaseData: {
      amount: number;
      trigger: ReleaseTrigger;
      paymentReference?: string;
      notes?: string;
    },
  ): Promise<EscrowAccount> {
    const escrow = await this.escrowRepository.findOne({
      where: { id: escrowId, brokerId, tenantId },
    });

    if (!escrow) {
      throw new NotFoundException('Escrow account not found');
    }

    if (escrow.status !== EscrowStatus.FUNDED && escrow.status !== EscrowStatus.PARTIALLY_RELEASED) {
      throw new BadRequestException('Escrow account is not funded');
    }

    if (escrow.releasedAmount + releaseData.amount > escrow.totalAmount) {
      throw new BadRequestException('Release amount exceeds total amount');
    }

    escrow.releasedAmount += releaseData.amount;

    if (escrow.releasedAmount >= escrow.totalAmount) {
      escrow.status = EscrowStatus.RELEASED;
    } else {
      escrow.status = EscrowStatus.PARTIALLY_RELEASED;
    }

    escrow.releaseHistory.push({
      timestamp: new Date(),
      amount: releaseData.amount,
      trigger: releaseData.trigger,
      releasedBy: brokerId,
      paymentReference: releaseData.paymentReference,
      notes: releaseData.notes,
    });

    // Update release schedule if applicable
    if (escrow.releaseSchedule) {
      for (const schedule of escrow.releaseSchedule) {
        if (!schedule.released && schedule.amount === releaseData.amount) {
          schedule.released = true;
          schedule.releasedAt = new Date();
          break;
        }
      }
    }

    return this.escrowRepository.save(escrow);
  }

  /**
   * Get escrow account by ID
   */
  async getEscrow(
    escrowId: string,
    brokerId: string,
    tenantId: string,
  ): Promise<EscrowAccount> {
    const escrow = await this.escrowRepository.findOne({
      where: { id: escrowId, brokerId, tenantId },
      relations: ['broker', 'payer', 'payee', 'load', 'trip'],
    });

    if (!escrow) {
      throw new NotFoundException('Escrow account not found');
    }

    return escrow;
  }

  /**
   * Get escrow accounts for a broker
   */
  async getBrokerEscrows(
    brokerId: string,
    tenantId: string,
    filters?: {
      status?: EscrowStatus;
      loadId?: string;
    },
  ): Promise<EscrowAccount[]> {
    const where: any = { brokerId, tenantId };

    if (filters?.status) {
      where.status = filters.status;
    }
    if (filters?.loadId) {
      where.loadId = filters.loadId;
    }

    return this.escrowRepository.find({
      where,
      relations: ['payer', 'payee', 'load'],
      order: { createdAt: 'DESC' },
    });
  }
}

