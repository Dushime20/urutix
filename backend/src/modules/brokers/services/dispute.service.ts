import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  BrokerDispute,
  DisputeStatus,
  DisputeCategory,
  DisputeSeverity,
} from '../../../entities/broker-dispute.entity';
import { Load } from '../../../entities/load.entity';
import { User, UserRole } from '../../../entities/user.entity';
import { CreateDisputeDto } from '../dto/create-dispute.dto';

@Injectable()
export class DisputeService {
  private readonly logger = new Logger(DisputeService.name);

  constructor(
    @InjectRepository(BrokerDispute)
    private readonly disputeRepository: Repository<BrokerDispute>,
    @InjectRepository(Load)
    private readonly loadRepository: Repository<Load>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  /**
   * Create a new dispute
   */
  async createDispute(
    brokerId: string,
    tenantId: string,
    raisedById: string,
    createDto: CreateDisputeDto,
  ): Promise<BrokerDispute> {
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

    // Verify disputed party exists
    const disputedWith = await this.userRepository.findOne({
      where: { id: createDto.disputedWithId },
    });

    if (!disputedWith) {
      throw new NotFoundException('Disputed party not found');
    }

    // Create dispute
    const dispute = this.disputeRepository.create({
      tenantId,
      brokerId,
      loadId: createDto.loadId,
      tripId: createDto.tripId,
      raisedById,
      disputedWithId: createDto.disputedWithId,
      category: createDto.category,
      severity: createDto.severity || DisputeSeverity.MEDIUM,
      status: DisputeStatus.OPEN,
      description: createDto.description,
      claimedAmount: createDto.claimedAmount,
      evidence: (createDto.evidence || []).map((ev) => ({
        ...ev,
        uploadedAt: new Date(),
        uploadedBy: raisedById,
      })),
      mediationHistory: [],
      communications: [],
    });

    return this.disputeRepository.save(dispute);
  }

  /**
   * Get dispute by ID
   */
  async getDispute(
    disputeId: string,
    brokerId: string,
    tenantId: string,
  ): Promise<BrokerDispute> {
    const dispute = await this.disputeRepository.findOne({
      where: { id: disputeId, brokerId, tenantId },
      relations: ['broker', 'raisedBy', 'disputedWith', 'load', 'trip', 'mediator'],
    });

    if (!dispute) {
      throw new NotFoundException('Dispute not found');
    }

    return dispute;
  }

  /**
   * Get disputes for a broker
   */
  async getBrokerDisputes(
    brokerId: string,
    tenantId: string,
    filters?: {
      status?: DisputeStatus;
      category?: DisputeCategory;
      loadId?: string;
    },
  ): Promise<BrokerDispute[]> {
    const where: any = { brokerId, tenantId };

    if (filters?.status) {
      where.status = filters.status;
    }
    if (filters?.category) {
      where.category = filters.category;
    }
    if (filters?.loadId) {
      where.loadId = filters.loadId;
    }

    return this.disputeRepository.find({
      where,
      relations: ['raisedBy', 'disputedWith', 'load'],
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Start mediation (broker becomes mediator)
   */
  async startMediation(
    disputeId: string,
    brokerId: string,
    tenantId: string,
    notes?: string,
  ): Promise<BrokerDispute> {
    const dispute = await this.getDispute(disputeId, brokerId, tenantId);

    if (dispute.status !== DisputeStatus.OPEN) {
      throw new BadRequestException('Dispute is not in OPEN status');
    }

    dispute.status = DisputeStatus.MEDIATION;
    dispute.mediatorId = brokerId;

    dispute.mediationHistory.push({
      timestamp: new Date(),
      mediatorId: brokerId,
      action: 'MEDIATION_STARTED',
      notes: notes || 'Broker started mediation process',
    });

    return this.disputeRepository.save(dispute);
  }

  /**
   * Add communication to dispute
   */
  async addCommunication(
    disputeId: string,
    brokerId: string,
    tenantId: string,
    fromId: string,
    toId: string,
    message: string,
    type: 'MESSAGE' | 'OFFER' | 'COUNTER_OFFER' | 'ACCEPTANCE' | 'REJECTION',
  ): Promise<BrokerDispute> {
    const dispute = await this.getDispute(disputeId, brokerId, tenantId);

    dispute.communications.push({
      timestamp: new Date(),
      from: fromId,
      to: toId,
      message,
      type,
    });

    return this.disputeRepository.save(dispute);
  }

  /**
   * Resolve dispute
   */
  async resolveDispute(
    disputeId: string,
    brokerId: string,
    tenantId: string,
    resolution: {
      resolution: string;
      resolvedAmount?: number;
      resolutionTerms?: Record<string, any>;
    },
  ): Promise<BrokerDispute> {
    const dispute = await this.getDispute(disputeId, brokerId, tenantId);

    if (dispute.status === DisputeStatus.RESOLVED || dispute.status === DisputeStatus.CLOSED) {
      throw new BadRequestException('Dispute already resolved or closed');
    }

    dispute.status = DisputeStatus.RESOLVED;
    dispute.resolution = resolution.resolution;
    dispute.resolvedAmount = resolution.resolvedAmount;
    dispute.resolutionTerms = resolution.resolutionTerms;
    dispute.resolvedAt = new Date();
    dispute.resolvedBy = brokerId;

    dispute.mediationHistory.push({
      timestamp: new Date(),
      mediatorId: brokerId,
      action: 'DISPUTE_RESOLVED',
      notes: resolution.resolution,
      outcome: 'RESOLVED',
    });

    return this.disputeRepository.save(dispute);
  }

  /**
   * Close dispute
   */
  async closeDispute(
    disputeId: string,
    brokerId: string,
    tenantId: string,
  ): Promise<BrokerDispute> {
    const dispute = await this.getDispute(disputeId, brokerId, tenantId);

    if (dispute.status !== DisputeStatus.RESOLVED) {
      throw new BadRequestException('Dispute must be resolved before closing');
    }

    dispute.status = DisputeStatus.CLOSED;
    dispute.closedAt = new Date();

    return this.disputeRepository.save(dispute);
  }
}

