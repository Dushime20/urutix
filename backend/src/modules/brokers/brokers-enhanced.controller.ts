import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../../entities/user.entity';
import { ContractService } from './services/contract.service';
import { BrokersService } from './brokers.service';
import { InsuranceVerificationService } from './services/insurance-verification.service';
import { DisputeService } from './services/dispute.service';
import { EscrowService } from './services/escrow.service';
import { DocumentService } from './services/document.service';
import { CreateContractDto } from './dto/create-contract.dto';
import { SignContractDto } from './dto/sign-contract.dto';
import { VerifyInsuranceDto } from './dto/verify-insurance.dto';
import { CreateDisputeDto } from './dto/create-dispute.dto';
import { CreateEscrowDto } from './dto/create-escrow.dto';
import { CreateDocumentDto } from './dto/create-document.dto';
import { ContractStatus } from '../../entities/load-contract.entity';
import { DisputeStatus, DisputeCategory } from '../../entities/broker-dispute.entity';
import { EscrowStatus } from '../../entities/escrow-account.entity';
import { DocumentType } from '../../entities/load-document.entity';
import { VerificationType } from '../../entities/insurance-verification.entity';

@Controller('brokers')
@UseGuards(JwtAuthGuard, RolesGuard)
export class BrokersEnhancedController {
  constructor(
    private readonly contractService: ContractService,
    private readonly brokersService: BrokersService,
    private readonly insuranceVerificationService: InsuranceVerificationService,
    private readonly disputeService: DisputeService,
    private readonly escrowService: EscrowService,
    private readonly documentService: DocumentService,
  ) { }

  // ==================== CONTRACT MANAGEMENT ====================

  @Post('contracts')
  @Roles(UserRole.BROKER, UserRole.CARGO_OWNER, UserRole.TENANT_ADMIN, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.CREATED)
  async createContract(@Request() req: any, @Body() createDto: CreateContractDto) {
    const userId = req.user.userId;
    const tenantId = req.user.tenantId;
    return this.contractService.createContract(userId, tenantId, createDto);
  }

  @Put('contracts/:contractId/accept')
  @Roles(UserRole.BROKER)
  async acceptContract(@Request() req: any, @Param('contractId') contractId: string) {
    const brokerId = req.user.userId;
    const tenantId = req.user.tenantId;
    return this.contractService.acceptContract(contractId, brokerId, tenantId);
  }

  @Get('contracts')
  @Roles(UserRole.BROKER, UserRole.CARGO_OWNER, UserRole.TENANT_ADMIN, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async getContracts(
    @Request() req: any,
    @Query('status') status?: ContractStatus,
    @Query('loadId') loadId?: string,
    @Query('transporterId') transporterId?: string,
  ) {
    const userId = req.user.userId;
    const userRole = req.user.role;
    const tenantId = req.user.tenantId;

    if (userRole === UserRole.BROKER) {
      return this.contractService.getBrokerContracts(userId, tenantId, {
        status,
        loadId,
        transporterId,
      });
    } else if (userRole === UserRole.CARGO_OWNER) {
      return this.contractService.getCargoOwnerContracts(userId, tenantId, {
        status,
        loadId,
      });
    }

    return [];
  }

  @Get('contracts/:contractId')
  @Roles(UserRole.BROKER, UserRole.TENANT_ADMIN)
  async getContract(@Request() req: any, @Param('contractId') contractId: string) {
    const brokerId = req.user.userId;
    const tenantId = req.user.tenantId;
    return this.contractService.getContract(contractId, brokerId, tenantId);
  }

  @Put('contracts/:contractId/sign')
  @Roles(UserRole.BROKER, UserRole.CARGO_OWNER, UserRole.TRUCK_OWNER)
  async signContract(
    @Request() req: any,
    @Param('contractId') contractId: string,
    @Body() signDto: SignContractDto,
  ) {
    const userId = req.user.userId;
    const tenantId = req.user.tenantId;
    return this.contractService.signContract(contractId, userId, tenantId, signDto);
  }

  // ==================== INSURANCE VERIFICATION ====================

  @Post('insurance/verify')
  @Roles(UserRole.BROKER, UserRole.TENANT_ADMIN)
  @HttpCode(HttpStatus.CREATED)
  async verifyInsurance(@Request() req: any, @Body() verifyDto: VerifyInsuranceDto) {
    const brokerId = req.user.userId;
    const tenantId = req.user.tenantId;
    return this.insuranceVerificationService.verifyInsurance(brokerId, tenantId, verifyDto);
  }

  @Get('insurance/verify/:transporterId')
  @Roles(UserRole.BROKER, UserRole.TENANT_ADMIN)
  async getVerifications(
    @Request() req: any,
    @Param('transporterId') transporterId: string,
    @Query('loadId') loadId?: string,
  ) {
    const brokerId = req.user.userId;
    const tenantId = req.user.tenantId;
    return this.insuranceVerificationService.getTransporterVerifications(
      transporterId,
      brokerId,
      tenantId,
      loadId,
    );
  }

  @Get('insurance/compliance/:transporterId')
  @Roles(UserRole.BROKER, UserRole.TENANT_ADMIN)
  async checkCompliance(
    @Request() req: any,
    @Param('transporterId') transporterId: string,
    @Query('types') types: string, // Comma-separated VerificationType values
  ) {
    const brokerId = req.user.userId;
    const tenantId = req.user.tenantId;
    const requiredTypes = types.split(',').map((t) => t.trim()) as VerificationType[];
    return this.insuranceVerificationService.checkCompliance(
      transporterId,
      brokerId,
      tenantId,
      requiredTypes,
    );
  }

  // ==================== DISPUTE RESOLUTION ====================

  @Post('disputes')
  @Roles(UserRole.BROKER, UserRole.CARGO_OWNER, UserRole.TRUCK_OWNER)
  @HttpCode(HttpStatus.CREATED)
  async createDispute(@Request() req: any, @Body() createDto: CreateDisputeDto) {
    const raisedById = req.user.userId;
    const brokerId = req.user.role === UserRole.BROKER ? raisedById : createDto.loadId; // Get broker from load
    const tenantId = req.user.tenantId;
    return this.disputeService.createDispute(brokerId, tenantId, raisedById, createDto);
  }

  @Get('disputes')
  @Roles(UserRole.BROKER, UserRole.TENANT_ADMIN)
  async getDisputes(
    @Request() req: any,
    @Query('status') status?: DisputeStatus,
    @Query('category') category?: DisputeCategory,
    @Query('loadId') loadId?: string,
  ) {
    const brokerId = req.user.userId;
    const tenantId = req.user.tenantId;
    return this.disputeService.getBrokerDisputes(brokerId, tenantId, { status, category, loadId });
  }

  @Get('disputes/:disputeId')
  @Roles(UserRole.BROKER, UserRole.TENANT_ADMIN)
  async getDispute(@Request() req: any, @Param('disputeId') disputeId: string) {
    const brokerId = req.user.userId;
    const tenantId = req.user.tenantId;
    return this.disputeService.getDispute(disputeId, brokerId, tenantId);
  }

  @Put('disputes/:disputeId/mediate')
  @Roles(UserRole.BROKER, UserRole.TENANT_ADMIN)
  async startMediation(
    @Request() req: any,
    @Param('disputeId') disputeId: string,
    @Body('notes') notes?: string,
  ) {
    const brokerId = req.user.userId;
    const tenantId = req.user.tenantId;
    return this.disputeService.startMediation(disputeId, brokerId, tenantId, notes);
  }

  @Put('disputes/:disputeId/resolve')
  @Roles(UserRole.BROKER, UserRole.TENANT_ADMIN)
  async resolveDispute(
    @Request() req: any,
    @Param('disputeId') disputeId: string,
    @Body() resolution: { resolution: string; resolvedAmount?: number; resolutionTerms?: Record<string, any> },
  ) {
    const brokerId = req.user.userId;
    const tenantId = req.user.tenantId;
    return this.disputeService.resolveDispute(disputeId, brokerId, tenantId, resolution);
  }

  // ==================== ESCROW MANAGEMENT ====================

  @Post('escrow')
  @Roles(UserRole.BROKER, UserRole.TENANT_ADMIN)
  @HttpCode(HttpStatus.CREATED)
  async createEscrow(@Request() req: any, @Body() createDto: CreateEscrowDto) {
    const brokerId = req.user.userId;
    const tenantId = req.user.tenantId;
    return this.escrowService.createEscrow(brokerId, tenantId, createDto);
  }

  @Get('escrow')
  @Roles(UserRole.BROKER, UserRole.TENANT_ADMIN)
  async getEscrows(
    @Request() req: any,
    @Query('status') status?: EscrowStatus,
    @Query('loadId') loadId?: string,
  ) {
    const brokerId = req.user.userId;
    const tenantId = req.user.tenantId;
    return this.escrowService.getBrokerEscrows(brokerId, tenantId, { status, loadId });
  }

  @Get('escrow/:escrowId')
  @Roles(UserRole.BROKER, UserRole.TENANT_ADMIN)
  async getEscrow(@Request() req: any, @Param('escrowId') escrowId: string) {
    const brokerId = req.user.userId;
    const tenantId = req.user.tenantId;
    return this.escrowService.getEscrow(escrowId, brokerId, tenantId);
  }

  @Put('escrow/:escrowId/fund')
  @Roles(UserRole.BROKER, UserRole.TENANT_ADMIN)
  async fundEscrow(
    @Request() req: any,
    @Param('escrowId') escrowId: string,
    @Body() fundingData: {
      amount: number;
      paymentMethod: string;
      paymentReference: string;
      transactionId?: string;
    },
  ) {
    const brokerId = req.user.userId;
    const tenantId = req.user.tenantId;
    return this.escrowService.fundEscrow(escrowId, brokerId, tenantId, fundingData);
  }

  @Put('escrow/:escrowId/release')
  @Roles(UserRole.BROKER, UserRole.TENANT_ADMIN)
  async releaseFunds(
    @Request() req: any,
    @Param('escrowId') escrowId: string,
    @Body() releaseData: {
      amount: number;
      trigger: string;
      paymentReference?: string;
      notes?: string;
    },
  ) {
    const brokerId = req.user.userId;
    const tenantId = req.user.tenantId;
    return this.escrowService.releaseFunds(escrowId, brokerId, tenantId, {
      ...releaseData,
      trigger: releaseData.trigger as any,
    });
  }

  // ==================== DOCUMENT MANAGEMENT ====================

  @Post('documents')
  @Roles(UserRole.BROKER, UserRole.TENANT_ADMIN)
  @HttpCode(HttpStatus.CREATED)
  async createDocument(@Request() req: any, @Body() createDto: CreateDocumentDto) {
    const brokerId = req.user.userId;
    const tenantId = req.user.tenantId;
    const uploadedById = req.user.userId;
    return this.documentService.createDocument(brokerId, tenantId, uploadedById, createDto);
  }

  @Post('documents/bol/:loadId')
  @Roles(UserRole.BROKER, UserRole.TENANT_ADMIN)
  @HttpCode(HttpStatus.CREATED)
  async generateBOL(
    @Request() req: any,
    @Param('loadId') loadId: string,
    @Body() data?: Record<string, any>,
  ) {
    const brokerId = req.user.userId;
    const tenantId = req.user.tenantId;
    return this.documentService.generateBOL(brokerId, tenantId, loadId, data);
  }

  @Post('documents/pod/:loadId')
  @Roles(UserRole.BROKER, UserRole.TENANT_ADMIN)
  @HttpCode(HttpStatus.CREATED)
  async generatePOD(
    @Request() req: any,
    @Param('loadId') loadId: string,
    @Query('tripId') tripId: string,
    @Body() data?: Record<string, any>,
  ) {
    const brokerId = req.user.userId;
    const tenantId = req.user.tenantId;
    return this.documentService.generatePOD(brokerId, tenantId, loadId, tripId, data);
  }

  @Get('documents/load/:loadId')
  @Roles(UserRole.BROKER, UserRole.TENANT_ADMIN)
  async getLoadDocuments(
    @Request() req: any,
    @Param('loadId') loadId: string,
    @Query('type') type?: DocumentType,
  ) {
    const brokerId = req.user.userId;
    const tenantId = req.user.tenantId;
    return this.documentService.getLoadDocuments(loadId, brokerId, tenantId, type);
  }

  @Put('documents/:documentId/verify')
  @Roles(UserRole.BROKER, UserRole.TENANT_ADMIN)
  async verifyDocument(
    @Request() req: any,
    @Param('documentId') documentId: string,
    @Body('notes') notes?: string,
  ) {
    const brokerId = req.user.userId;
    const tenantId = req.user.tenantId;
    const verifiedById = req.user.userId;
    return this.documentService.verifyDocument(documentId, brokerId, tenantId, verifiedById, notes);
  }
}

