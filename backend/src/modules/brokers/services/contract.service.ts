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
  ) { }

  /**
   * Create a new contract for a load (by cargo owner)
   */
  async createContract(
    cargoOwnerId: string,
    tenantId: string,
    createDto: CreateContractDto,
  ): Promise<LoadContract> {
    // Verify cargo owner exists
    const cargoOwner = await this.userRepository.findOne({
      where: { id: cargoOwnerId, role: UserRole.CARGO_OWNER, tenantId },
    });

    if (!cargoOwner) {
      throw new ForbiddenException('Cargo owner not found or access denied');
    }

    // Verify broker exists
    const broker = await this.userRepository.findOne({
      where: { id: createDto.brokerId, role: UserRole.BROKER },
    });

    if (!broker) {
      throw new NotFoundException('Broker not found');
    }

    // Verify load exists and belongs to cargo owner
    const load = await this.loadRepository.findOne({
      where: { id: createDto.loadId, cargoOwnerId, tenantId },
      relations: ['cargoOwner'],
    });

    if (!load) {
      throw new NotFoundException('Load not found or access denied');
    }

    // Verify transporter exists (if provided)
    if (createDto.transporterId) {
      const transporter = await this.userRepository.findOne({
        where: { id: createDto.transporterId, role: UserRole.TRUCK_OWNER },
      });

      if (!transporter) {
        throw new NotFoundException('Transporter not found');
      }
    }

    // Calculate commission amount
    const commissionAmount = (createDto.agreedRate * createDto.commissionRate) / 100;

    // Generate contract ID
    // const contractCount = await this.contractRepository.count({ where: { tenantId } });
    // const contractId = `contract-${String(contractCount + 1).padStart(6, '0')}`;

    // Generate contract content if not provided
    const transporter = createDto.transporterId
      ? await this.userRepository.findOne({ where: { id: createDto.transporterId } })
      : null;

    const contractContent =
      createDto.contractContent ||
      this.generateDefaultContractContent(load, transporter, createDto);

    // Create contract
    const contract = this.contractRepository.create({
      // id: contractId,
      tenantId,
      brokerId: createDto.brokerId,
      loadId: createDto.loadId,
      tripId: createDto.tripId,
      cargoOwnerId,
      transporterId: createDto.transporterId || null,
      contractType: createDto.contractType || ContractType.BROKER_AGREEMENT,
      status: ContractStatus.PENDING_SIGNATURE,
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
          changedBy: cargoOwnerId,
          changes: { status: 'PENDING_SIGNATURE', created: true },
          notes: 'Contract created by cargo owner',
        },
      ],
    });

    const savedContract = await this.contractRepository.save(contract);

    this.logger.log(`Contract created: ${savedContract.id} for load ${createDto.loadId} by cargo owner`);

    return this.contractRepository.findOne({
      where: { id: savedContract.id },
      relations: ['broker', 'cargoOwner', 'transporter', 'load'],
    });
  }

  /**
   * Create contract for broker assignment (automatically called when broker is assigned)
   */
  async createContractForBrokerAssignment(
    cargoOwnerId: string,
    tenantId: string,
    createDto: CreateContractDto,
  ): Promise<LoadContract> {
    // Verify cargo owner exists
    const cargoOwner = await this.userRepository.findOne({
      where: { id: cargoOwnerId },
    });

    if (!cargoOwner) {
      throw new ForbiddenException('Cargo owner not found');
    }

    // Verify broker exists
    const broker = await this.userRepository.findOne({
      where: { id: createDto.brokerId },
    });

    if (!broker) {
      throw new NotFoundException('Broker not found');
    }

    // Verify load exists and belongs to cargo owner
    const load = await this.loadRepository.findOne({
      where: { id: createDto.loadId, cargoOwnerId, tenantId },
      relations: ['cargoOwner'],
    });

    if (!load) {
      throw new NotFoundException('Load not found or access denied');
    }

    // Calculate commission amount
    const commissionAmount = (createDto.agreedRate * createDto.commissionRate) / 100;

    // Generate contract content
    const contractContent = this.generateDefaultContractContent(load, null, createDto);

    // Create contract with PENDING_BROKER_ACCEPTANCE status
    const contract = this.contractRepository.create({
      tenantId,
      brokerId: createDto.brokerId,
      loadId: createDto.loadId,
      tripId: createDto.tripId,
      cargoOwnerId,
      transporterId: createDto.transporterId || null,
      contractType: createDto.contractType || ContractType.BROKER_AGREEMENT,
      status: ContractStatus.PENDING_BROKER_ACCEPTANCE,
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
          changedBy: cargoOwnerId,
          changes: { status: 'PENDING_BROKER_ACCEPTANCE', created: true },
          notes: 'Contract created automatically when broker was assigned',
        },
      ],
    });

    this.logger.debug(`Saving contract: ${JSON.stringify(contract)}`);
    let savedContract;
    try {
      savedContract = await this.contractRepository.save(contract);
    } catch (err) {
      this.logger.error(`Error saving contract: ${err.message}`, err.stack);
      throw err;
    }

    this.logger.log(
      `Contract created for broker assignment: ${savedContract.id} for load ${createDto.loadId}`,
    );

    return this.contractRepository.findOne({
      where: { id: savedContract.id },
      relations: ['broker', 'broker.profile', 'cargoOwner', 'cargoOwner.profile', 'transporter', 'transporter.profile', 'load'],
    });
  }

  /**
   * Accept contract (by broker)
   */
  async acceptContract(
    contractId: string,
    brokerId: string,
    tenantId: string,
  ): Promise<LoadContract> {
    const contract = await this.contractRepository.findOne({
      where: { id: contractId, brokerId, tenantId },
      relations: ['broker', 'broker.profile', 'cargoOwner', 'cargoOwner.profile', 'load'],
    });

    if (!contract) {
      throw new NotFoundException('Contract not found');
    }

    if (
      contract.status !== ContractStatus.PENDING_SIGNATURE &&
      contract.status !== ContractStatus.PENDING_BROKER_ACCEPTANCE
    ) {
      throw new BadRequestException('Contract is not pending acceptance');
    }

    // Update contract status
    contract.status = ContractStatus.ACTIVE;
    contract.brokerSignature = {
      signedAt: new Date(),
      signatureMethod: 'DIGITAL',
      signatureData: 'Broker acceptance',
    };

    // Add to negotiation history
    contract.negotiationHistory.push({
      timestamp: new Date(),
      changedBy: brokerId,
      changes: { status: 'ACTIVE', brokerAccepted: true },
      notes: 'Contract accepted by broker',
    });

    const updatedContract = await this.contractRepository.save(contract);

    this.logger.log(`Contract ${contractId} accepted by broker ${brokerId}`);

    return this.contractRepository.findOne({
      where: { id: contractId },
      relations: ['broker', 'broker.profile', 'cargoOwner', 'cargoOwner.profile', 'transporter', 'transporter.profile', 'load'],
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
    tenantId?: string,
    filters?: {
      status?: ContractStatus;
      loadId?: string;
      transporterId?: string;
    },
  ): Promise<LoadContract[]> {
    this.logger.debug(`getBrokerContracts called for brokerId: ${brokerId} tenantId: ${tenantId || 'ALL'}`);
    const where: any = { brokerId };

    if (tenantId) {
      where.tenantId = tenantId;
    }

    if (filters?.status) {
      where.status = filters.status;
    }
    if (filters?.loadId) {
      where.loadId = filters.loadId;
    }
    if (filters?.transporterId) {
      where.transporterId = filters.transporterId;
    }

    const contracts = await this.contractRepository.find({
      where,
      relations: ['cargoOwner', 'cargoOwner.profile', 'transporter', 'transporter.profile', 'load', 'broker', 'broker.profile'],
      order: { createdAt: 'DESC' },
    });

    this.logger.debug(`Found ${contracts.length} contracts for broker`);
    return contracts;
  }

  /**
   * Get contracts for a cargo owner
   */
  async getCargoOwnerContracts(
    cargoOwnerId: string,
    tenantId: string,
    filters?: {
      status?: ContractStatus;
      loadId?: string;
    },
  ): Promise<LoadContract[]> {
    const where: any = { cargoOwnerId, tenantId };

    if (filters?.status) {
      where.status = filters.status;
    }
    if (filters?.loadId) {
      where.loadId = filters.loadId;
    }

    return this.contractRepository.find({
      where,
      relations: ['broker', 'broker.profile', 'transporter', 'load'],
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
      relations: ['cargoOwner', 'cargoOwner.profile', 'transporter', 'transporter.profile', 'broker', 'broker.profile'],
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

    // For broker agreements, broker signature is sufficient to mark as SIGNED
    if (contract.contractType === ContractType.BROKER_AGREEMENT && brokerSigned) {
      contract.status = ContractStatus.SIGNED;
      contract.fullySignedAt = new Date();
    } else if (cargoOwnerSigned && transporterSigned) {
      contract.status = ContractStatus.SIGNED;
      contract.fullySignedAt = new Date();
    } else if (cargoOwnerSigned || transporterSigned || brokerSigned) {
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
    transporter: User | null,
    createDto: CreateContractDto,
  ): string {
    const transporterName = transporter
      ? `${transporter.profile?.firstName || 'N/A'} ${transporter.profile?.lastName || ''}`
      : 'To be assigned';

    return `
LOAD TRANSPORTATION AGREEMENT

This agreement is entered into between:
- Cargo Owner: ${load.cargoOwner?.profile?.firstName || 'N/A'} ${load.cargoOwner?.profile?.lastName || ''}
- Transporter: ${transporterName}
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

