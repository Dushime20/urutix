import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LoadContract, ContractStatus, ContractType } from '../../../entities/load-contract.entity';
import { Load } from '../../../entities/load.entity';
import { User, UserRole } from '../../../entities/user.entity';
import { CreateContractDto } from '../dto/create-contract.dto';
import { SignContractDto } from '../dto/sign-contract.dto';

@Injectable()
export class ContractService {
  private readonly logger = new Logger(ContractService.name);

  constructor(
    @InjectRepository(LoadContract)
    private readonly contractRepository: Repository<LoadContract>,
    @InjectRepository(Load)
    private readonly loadRepository: Repository<Load>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  /**
   * Create a new contract for a load
   */
  async createContract(
    brokerId: string,
    tenantId: string,
    createDto: CreateContractDto,
  ): Promise<LoadContract> {
    // Verify broker exists and has access
    const broker = await this.userRepository.findOne({
      where: { id: brokerId, role: UserRole.BROKER, tenantId },
    });

    if (!broker) {
      throw new ForbiddenException('Broker not found or access denied');
    }

    // Verify load exists and is assigned to broker
    const load = await this.loadRepository.findOne({
      where: { id: createDto.loadId, brokerId, tenantId },
      relations: ['cargoOwner'],
    });

    if (!load) {
      throw new NotFoundException('Load not found or not assigned to broker');
    }

    // Verify transporter exists
    const transporter = await this.userRepository.findOne({
      where: { id: createDto.transporterId, role: UserRole.TRUCK_OWNER },
    });

    if (!transporter) {
      throw new NotFoundException('Transporter not found');
    }

    // Calculate commission amount
    const commissionAmount = (createDto.agreedRate * createDto.commissionRate) / 100;

    // Generate contract content if not provided
    const contractContent =
      createDto.contractContent ||
      this.generateDefaultContractContent(load, transporter, createDto);

    // Create contract
    const contract = this.contractRepository.create({
      tenantId,
      brokerId,
      loadId: createDto.loadId,
      tripId: createDto.tripId,
      cargoOwnerId: load.cargoOwnerId,
      transporterId: createDto.transporterId,
      contractType: createDto.contractType || ContractType.LOAD_AGREEMENT,
      status: ContractStatus.DRAFT,
      agreedRate: createDto.agreedRate,
      currencyCode: createDto.currencyCode || 'KES',
      commissionRate: createDto.commissionRate,
      commissionAmount,
      paymentTerms: createDto.paymentTerms,
      paymentDueDate: createDto.paymentDueDate
        ? new Date(createDto.paymentDueDate)
        : undefined,
      pickupDate: createDto.pickupDate ? new Date(createDto.pickupDate) : undefined,
      deliveryDate: createDto.deliveryDate ? new Date(createDto.deliveryDate) : undefined,
      deliveryTerms: createDto.deliveryTerms,
      specialInstructions: createDto.specialInstructions,
      contractContent,
      contractData: createDto.contractData || {},
      templateId: createDto.templateId,
      expiresAt: createDto.expiresAt ? new Date(createDto.expiresAt) : undefined,
      negotiationHistory: [
        {
          timestamp: new Date(),
          changedBy: brokerId,
          changes: { status: 'DRAFT', created: true },
          notes: 'Contract created',
        },
      ],
    });

    const savedContract = await this.contractRepository.save(contract);

    this.logger.log(`Contract created: ${savedContract.id} for load ${createDto.loadId}`);

    return this.contractRepository.findOne({
      where: { id: savedContract.id },
      relations: ['broker', 'cargoOwner', 'transporter', 'load'],
    });
  }

  /**
   * Get contract by ID
   */
  async getContract(
    contractId: string,
    brokerId: string,
    tenantId: string,
  ): Promise<LoadContract> {
    const contract = await this.contractRepository.findOne({
      where: { id: contractId, brokerId, tenantId },
      relations: ['broker', 'cargoOwner', 'transporter', 'load', 'trip'],
    });

    if (!contract) {
      throw new NotFoundException('Contract not found');
    }

    return contract;
  }

  /**
   * Get contracts for a broker
   */
  async getBrokerContracts(
    brokerId: string,
    tenantId: string,
    filters?: {
      status?: ContractStatus;
      loadId?: string;
      transporterId?: string;
    },
  ): Promise<LoadContract[]> {
    const where: any = { brokerId, tenantId };

    if (filters?.status) {
      where.status = filters.status;
    }
    if (filters?.loadId) {
      where.loadId = filters.loadId;
    }
    if (filters?.transporterId) {
      where.transporterId = filters.transporterId;
    }

    return this.contractRepository.find({
      where,
      relations: ['cargoOwner', 'transporter', 'load'],
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Update contract terms (creates negotiation history)
   */
  async updateContractTerms(
    contractId: string,
    brokerId: string,
    tenantId: string,
    updates: Partial<CreateContractDto>,
  ): Promise<LoadContract> {
    const contract = await this.getContract(contractId, brokerId, tenantId);

    if (contract.status === ContractStatus.SIGNED || contract.status === ContractStatus.ACTIVE) {
      throw new BadRequestException('Cannot update signed or active contract');
    }

    // Track changes
    const changes: Record<string, any> = {};
    const oldValues: Record<string, any> = {};

    if (updates.agreedRate !== undefined && updates.agreedRate !== contract.agreedRate) {
      oldValues.agreedRate = contract.agreedRate;
      changes.agreedRate = updates.agreedRate;
      contract.agreedRate = updates.agreedRate;
    }

    if (updates.commissionRate !== undefined && updates.commissionRate !== contract.commissionRate) {
      oldValues.commissionRate = contract.commissionRate;
      changes.commissionRate = updates.commissionRate;
      contract.commissionRate = updates.commissionRate;
      contract.commissionAmount = (contract.agreedRate * updates.commissionRate) / 100;
    }

    if (updates.paymentTerms !== undefined) {
      oldValues.paymentTerms = contract.paymentTerms;
      changes.paymentTerms = updates.paymentTerms;
      contract.paymentTerms = updates.paymentTerms;
    }

    // Add to negotiation history
    contract.negotiationHistory.push({
      timestamp: new Date(),
      changedBy: brokerId,
      changes,
      notes: `Contract terms updated`,
    });

    contract.status = ContractStatus.DRAFT;

    return this.contractRepository.save(contract);
  }

  /**
   * Sign contract
   */
  async signContract(
    contractId: string,
    userId: string,
    tenantId: string,
    signDto: SignContractDto,
  ): Promise<LoadContract> {
    const contract = await this.contractRepository.findOne({
      where: { id: contractId, tenantId },
      relations: ['cargoOwner', 'transporter', 'broker'],
    });

    if (!contract) {
      throw new NotFoundException('Contract not found');
    }

    // Determine signer role
    let signatureField: 'cargoOwnerSignature' | 'transporterSignature' | 'brokerSignature' | null =
      null;

    if (contract.cargoOwnerId === userId) {
      signatureField = 'cargoOwnerSignature';
    } else if (contract.transporterId === userId) {
      signatureField = 'transporterSignature';
    } else if (contract.brokerId === userId) {
      signatureField = 'brokerSignature';
    } else {
      throw new ForbiddenException('You are not authorized to sign this contract');
    }

    // Check if already signed
    if (contract[signatureField]) {
      throw new BadRequestException('Contract already signed by this party');
    }

    // Record signature
    contract[signatureField] = {
      signedAt: new Date(),
      signatureMethod: signDto.signatureMethod,
      signatureData: signDto.signatureData,
      ipAddress: signDto.metadata?.ipAddress,
    };

    // Update status based on signatures
    const cargoOwnerSigned = !!contract.cargoOwnerSignature;
    const transporterSigned = !!contract.transporterSignature;
    const brokerSigned = !!contract.brokerSignature;

    if (cargoOwnerSigned && transporterSigned) {
      contract.status = ContractStatus.SIGNED;
      contract.fullySignedAt = new Date();
    } else if (cargoOwnerSigned || transporterSigned) {
      contract.status = ContractStatus.PARTIALLY_SIGNED;
    } else {
      contract.status = ContractStatus.PENDING_SIGNATURE;
    }

    // If fully signed, activate contract
    if (contract.status === ContractStatus.SIGNED) {
      contract.status = ContractStatus.ACTIVE;
    }

    return this.contractRepository.save(contract);
  }

  /**
   * Generate default contract content
   */
  private generateDefaultContractContent(
    load: Load,
    transporter: User,
    createDto: CreateContractDto,
  ): string {
    return `
LOAD TRANSPORTATION AGREEMENT

This agreement is entered into between:
- Cargo Owner: ${load.cargoOwner?.profile?.firstName || 'N/A'} ${load.cargoOwner?.profile?.lastName || ''}
- Transporter: ${transporter.profile?.firstName || 'N/A'} ${transporter.profile?.lastName || ''}
- Broker: [Broker Name]

LOAD DETAILS:
- Load Title: ${load.title}
- Pickup Location: ${(load.pickupLocation as any)?.locationData?.address || 'N/A'}
- Delivery Location: ${(load.deliveryLocation as any)?.locationData?.address || 'N/A'}
- Pickup Date: ${createDto.pickupDate || 'TBD'}
- Delivery Date: ${createDto.deliveryDate || 'TBD'}

FINANCIAL TERMS:
- Agreed Rate: ${createDto.agreedRate} ${createDto.currencyCode || 'KES'}
- Commission Rate: ${createDto.commissionRate}%
- Payment Terms: ${createDto.paymentTerms || 'Net 30'}

SPECIAL INSTRUCTIONS:
${createDto.specialInstructions || 'None'}

By signing this contract, all parties agree to the terms and conditions stated above.

Date: ${new Date().toLocaleDateString()}
    `.trim();
  }
}

