import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { User, UserRole, UserStatus } from '../../entities/user.entity';
import { UserProfile } from '../../entities/user-profile.entity';
import { Load } from '../../entities/load.entity';
import { PasswordResetToken } from '../../entities/password-reset-token.entity';
import { CargoInspection, InspectionStatus, CargoInspectionType } from '../../entities/cargo-inspection.entity';
import { Epod, EpodStatus } from '../../entities/epod.entity';
import { EmailService } from '../auth/services/email.service';
import { ConfigService } from '@nestjs/config';
import { TripCompletionService } from '../trips/services/trip-completion.service';
import * as crypto from 'crypto';
import * as bcrypt from 'bcryptjs';
import { CreateReceiverDto } from './dto/create-receiver.dto';
import { SubmitCargoInspectionDto } from './dto/cargo-inspection.dto';
import { AssignCargoDto } from './dto/assign-cargo.dto';
import { CargoReceiverAssignedEvent } from '../notifications/events/cargo-events';

@Injectable()
export class ReceiversService {
  private readonly logger = new Logger(ReceiversService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(UserProfile)
    private readonly userProfileRepository: Repository<UserProfile>,
    @InjectRepository(Load)
    private readonly loadRepository: Repository<Load>,
    @InjectRepository(PasswordResetToken)
    private readonly passwordResetTokenRepository: Repository<PasswordResetToken>,
    @InjectRepository(CargoInspection)
    private readonly cargoInspectionRepository: Repository<CargoInspection>,
    @InjectRepository(Epod)
    private readonly epodRepository: Repository<Epod>,
    private readonly emailService: EmailService,
    private readonly configService: ConfigService,
    private readonly tripCompletionService: TripCompletionService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  /**
   * Create a new receiver for a cargo owner
   */
  async createReceiver(
    cargoOwnerId: string,
    createReceiverDto: CreateReceiverDto,
  ): Promise<{ receiver: User; message: string }> {
    this.logger.log(
      `Creating receiver for cargo owner ${cargoOwnerId}: ${createReceiverDto.email}`,
    );

    // Verify cargo owner exists
    const cargoOwner = await this.userRepository.findOne({
      where: { id: cargoOwnerId },
    });

    if (!cargoOwner) {
      throw new NotFoundException('Cargo owner not found');
    }

    if (cargoOwner.role !== UserRole.CARGO_OWNER) {
      throw new BadRequestException('User is not a cargo owner');
    }

    // Check if receiver (User) already exists for this tenant
    const existingUser = await this.userRepository.findOne({
      where: { 
          email: createReceiverDto.email.toLowerCase().trim(),
          role: UserRole.CARGO_RECEIVER,
          tenantId: cargoOwner.tenantId
      },
    });

    if (existingUser) {
      throw new ConflictException('A receiver with this email already exists in this tenant');
    }

    // Check for existing user account to reuse credentials
    const existingUserAccount = await this.userRepository.findOne({
      where: { email: createReceiverDto.email.toLowerCase().trim() }
    });

    let passwordHash;
    let userStatus = UserStatus.PENDING_VERIFICATION;
    let shouldSendInvitation = true;

    if (existingUserAccount && existingUserAccount.passwordHash) {
       passwordHash = existingUserAccount.passwordHash;
       userStatus = UserStatus.ACTIVE;
       shouldSendInvitation = false;
       this.logger.log(`Reusing existing credentials for receiver ${createReceiverDto.email}`);
    } else {
       const tempPassword = crypto.randomBytes(16).toString('hex');
       passwordHash = await bcrypt.hash(tempPassword, 10);
    }

    // Create receiver user
    const receiver = this.userRepository.create({
      email: createReceiverDto.email.toLowerCase().trim(),
      phone: createReceiverDto.phone?.trim(),
      passwordHash,
      role: UserRole.CARGO_RECEIVER,
      status: userStatus,
      tenantId: cargoOwner.tenantId,
      createdByCargoOwnerId: cargoOwnerId,
    });

    await this.userRepository.save(receiver);

    // Create user profile
    const profile = this.userProfileRepository.create({
      userId: receiver.id,
      tenantId: cargoOwner.tenantId,
      firstName: createReceiverDto.firstName,
      lastName: createReceiverDto.lastName,
    });

    await this.userProfileRepository.save(profile);

    // Only send invitation if needed
    if (shouldSendInvitation) {
        // Generate password setup token
        const token = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7); // Token expires in 7 days

        // Invalidate any existing tokens for this email
        await this.passwordResetTokenRepository.update(
          { email: receiver.email, used: false },
          { used: true },
        );

        const passwordSetupToken = this.passwordResetTokenRepository.create({
          email: receiver.email,
          token,
          expiresAt,
          used: false,
        });

        await this.passwordResetTokenRepository.save(passwordSetupToken);

        // Send invitation email
        try {
          await this.emailService.sendReceiverInvitationEmail(
            receiver.email,
            createReceiverDto.firstName,
            createReceiverDto.lastName,
            cargoOwner.email,
            token,
          );
          this.logger.log(`✅ Invitation email sent to ${receiver.email}`);
        } catch (error) {
          this.logger.error(
            `Failed to send invitation email: ${error.message}`,
          );
          // Don't fail the creation if email fails
        }
    } else {
       this.logger.log(`Existing credentials found for ${receiver.email}. Skipped invitation email.`);
    }

    return {
      receiver,
      message: 'Receiver created successfully. Invitation email sent.',
    };
  }

  /**
   * Get all receivers created by a cargo owner
   */
  async getReceiversByCargoOwner(cargoOwnerId: string): Promise<User[]> {
    const receivers = await this.userRepository.find({
      where: {
        createdByCargoOwnerId: cargoOwnerId,
        role: UserRole.CARGO_RECEIVER,
      },
      relations: ['profile'],
      order: { createdAt: 'DESC' },
    });

    return receivers;
  }

  /**
   * Get a single receiver by ID (if created by the cargo owner)
   */
  async getReceiverById(
    receiverId: string,
    cargoOwnerId: string,
  ): Promise<User> {
    const receiver = await this.userRepository.findOne({
      where: {
        id: receiverId,
        createdByCargoOwnerId: cargoOwnerId,
        role: UserRole.CARGO_RECEIVER,
      },
      relations: ['profile'],
    });

    if (!receiver) {
      throw new NotFoundException('Receiver not found');
    }

    return receiver;
  }

  /**
   * Update receiver information
   */
  async updateReceiver(
    receiverId: string,
    cargoOwnerId: string,
    updateData: Partial<CreateReceiverDto>,
  ): Promise<User> {
    const receiver = await this.getReceiverById(receiverId, cargoOwnerId);

    if (updateData.firstName || updateData.lastName) {
      const profile = await this.userProfileRepository.findOne({
        where: { userId: receiver.id },
      });

      if (profile) {
        if (updateData.firstName) profile.firstName = updateData.firstName;
        if (updateData.lastName) profile.lastName = updateData.lastName;
        await this.userProfileRepository.save(profile);
      }
    }

    if (updateData.phone) {
      receiver.phone = updateData.phone;
    }

    await this.userRepository.save(receiver);

    return this.getReceiverById(receiverId, cargoOwnerId);
  }

  /**
   * Delete a receiver
   */
  async deleteReceiver(receiverId: string, cargoOwnerId: string): Promise<void> {
    const receiver = await this.getReceiverById(receiverId, cargoOwnerId);

    // Check if receiver has assigned cargos
    const assignedCargos = await this.loadRepository.count({
      where: { receiverId: receiver.id },
    });

    if (assignedCargos > 0) {
      throw new BadRequestException(
        `Cannot delete receiver. They have ${assignedCargos} assigned cargo(s). Please reassign or remove cargo assignments first.`,
      );
    }

    // Soft delete
    await this.userRepository.softDelete(receiver.id);
  }

  /**
   * Assign cargo to a receiver
   */
  async assignCargoToReceiver(
    cargoId: string,
    cargoOwnerId: string,
    assignCargoDto: AssignCargoDto,
  ): Promise<Load> {
    // Verify cargo exists and belongs to cargo owner
    const cargo = await this.loadRepository.findOne({
      where: { id: cargoId, cargoOwnerId },
    });

    if (!cargo) {
      throw new NotFoundException('Cargo not found or you do not have permission');
    }

    // Verify receiver exists and was created by this cargo owner
    const receiver = await this.getReceiverById(
      assignCargoDto.receiverId,
      cargoOwnerId,
    );

    // Assign cargo to receiver
    cargo.receiverId = receiver.id;
    await this.loadRepository.save(cargo);

    const assignedCargo = await this.loadRepository.findOne({
      where: { id: cargoId },
      relations: [
        'receiver',
        'receiver.profile',
        'cargoOwner',
        'cargoOwner.profile',
      ],
    });

    if (assignedCargo) {
      const cargoOwnerName =
        [
          assignedCargo.cargoOwner?.profile?.firstName,
          assignedCargo.cargoOwner?.profile?.lastName,
        ]
          .filter(Boolean)
          .join(' ') || assignedCargo.cargoOwner?.email || 'Cargo owner';

      this.eventEmitter.emit(
        'cargo.receiver.assigned',
        new CargoReceiverAssignedEvent(
          assignedCargo.id,
          receiver.id,
          cargoOwnerId,
          assignedCargo.tenantId,
          {
            cargoTitle: assignedCargo.title,
            origin: this.formatLoadAddress(assignedCargo.origin),
            destination: this.formatLoadAddress(assignedCargo.destination),
            cargoOwnerName,
          },
        ),
      );
    }

    return assignedCargo;
  }

  /**
   * Unassign cargo from receiver
   */
  async unassignCargoFromReceiver(
    cargoId: string,
    cargoOwnerId: string,
  ): Promise<Load> {
    const cargo = await this.loadRepository.findOne({
      where: { id: cargoId, cargoOwnerId },
    });

    if (!cargo) {
      throw new NotFoundException('Cargo not found or you do not have permission');
    }

    cargo.receiverId = null;
    await this.loadRepository.save(cargo);

    return this.loadRepository.findOne({
      where: { id: cargoId },
    });
  }

  /**
   * Get all cargos assigned to a receiver
   */
  async getCargosByReceiver(
    receiverId: string,
    cargoOwnerId: string,
  ): Promise<Load[]> {
    // Verify receiver belongs to cargo owner
    await this.getReceiverById(receiverId, cargoOwnerId);

    const cargos = await this.loadRepository.find({
      where: { receiverId, cargoOwnerId },
      relations: ['cargoOwner', 'receiver'],
      order: { createdAt: 'DESC' },
    });

    return cargos;
  }

  /**
   * Get all cargos for a cargo owner (for assignment selection)
   */
  async getCargosForAssignment(cargoOwnerId: string): Promise<Load[]> {
    const cargos = await this.loadRepository.find({
      where: { cargoOwnerId },
      relations: ['receiver', 'receiver.profile'],
      order: { createdAt: 'DESC' },
    });

    return cargos;
  }

  /**
   * Get all cargos assigned to a receiver (for receiver users)
   */
  async getCargosByReceiverId(receiverId: string): Promise<any[]> {
    // Verify receiver exists
    const receiver = await this.userRepository.findOne({
      where: { id: receiverId, role: UserRole.CARGO_RECEIVER },
    });

    if (!receiver) {
      throw new NotFoundException('Receiver not found');
    }

    const cargos = await this.loadRepository.find({
      where: { receiverId },
      relations: ['cargoOwner', 'cargoOwner.profile'],
      order: { createdAt: 'DESC' },
    });

    // Fetch inspection status for each cargo
    const cargosWithInspection = await Promise.all(
      cargos.map(async (cargo) => {
        let inspection: CargoInspection | null = null;
        try {
          inspection = await this.cargoInspectionRepository.findOne({
            where: {
              loadId: cargo.id,
              receiverId,
              inspectionType: CargoInspectionType.DELIVERY,
            },
          });
        } catch (error) {
          this.logger.warn(
            `Could not load inspection for cargo ${cargo.id}: ${error.message}`,
          );
        }

        return {
          ...cargo,
          inspectionStatus: inspection?.status || 'PENDING',
          inspection: inspection ? {
            id: inspection.id,
            status: inspection.status,
            completedAt: inspection.completedAt,
            verifiedCount: inspection.verifiedCount,
            totalItems: inspection.totalItems,
            discrepancyCount: inspection.discrepancyCount,
            allItemsVerified: inspection.allItemsVerified,
          } : null,
        };
      })
    );

    return cargosWithInspection;
  }

  /**
   * Get cargo details for inspection (for receiver users)
   * Also returns the existing inspection if one exists, so the UI
   * can show the correct status (COMPLETED vs PENDING).
   */
  async getCargoForInspection(cargoId: string, receiverId: string): Promise<any> {
    // Verify receiver exists
    const receiver = await this.userRepository.findOne({
      where: { id: receiverId, role: UserRole.CARGO_RECEIVER },
    });

    if (!receiver) {
      throw new NotFoundException('Receiver not found');
    }

    // Get cargo and verify it's assigned to this receiver
    const cargo = await this.loadRepository.findOne({
      where: { id: cargoId, receiverId },
      relations: ['cargoOwner', 'cargoOwner.profile'],
    });

    if (!cargo) {
      throw new NotFoundException('Cargo not found or not assigned to you');
    }

    // Fetch existing inspection so the UI shows the real status
    const existingInspection = await this.cargoInspectionRepository.findOne({
      where: { loadId: cargoId, receiverId, inspectionType: CargoInspectionType.DELIVERY },
    });

    // Build inspection checklist from cargo details
    const checklist = this.buildInspectionChecklist(cargo);

    return {
      cargo,
      checklist,
      // Include inspection status so the frontend knows if already completed
      inspectionStatus: existingInspection?.status || 'PENDING',
      inspection: existingInspection
        ? {
            id: existingInspection.id,
            status: existingInspection.status,
            completedAt: existingInspection.completedAt,
            verifiedCount: existingInspection.verifiedCount,
            totalItems: existingInspection.totalItems,
            discrepancyCount: existingInspection.discrepancyCount,
            allItemsVerified: existingInspection.allItemsVerified,
          }
        : null,
    };
  }

  /**
   * Build inspection checklist from cargo details
   */
  private buildInspectionChecklist(cargo: Load): any[] {
    const checklist: any[] = [];

    // Basic Information
    checklist.push({
      id: 'title',
      label: 'Cargo Title',
      originalValue: cargo.title,
      category: 'Basic Information',
    });

    if (cargo.description) {
      checklist.push({
        id: 'description',
        label: 'Description',
        originalValue: cargo.description,
        category: 'Basic Information',
      });
    }

    checklist.push({
      id: 'weight',
      label: 'Weight (kg)',
      originalValue: cargo.weight,
      category: 'Physical Specifications',
    });

    if (cargo.volume) {
      checklist.push({
        id: 'volume',
        label: 'Volume (m³)',
        originalValue: cargo.volume,
        category: 'Physical Specifications',
      });
    }

    if (cargo.length && cargo.width && cargo.height) {
      checklist.push({
        id: 'dimensions',
        label: 'Dimensions (L x W x H)',
        originalValue: `${cargo.length}m x ${cargo.width}m x ${cargo.height}m`,
        category: 'Physical Specifications',
      });
    }

    // Cargo Type
    checklist.push({
      id: 'cargoType',
      label: 'Cargo Type',
      originalValue: cargo.cargoType,
      category: 'Cargo Classification',
    });

    checklist.push({
      id: 'loadType',
      label: 'Load Type',
      originalValue: cargo.loadType,
      category: 'Cargo Classification',
    });

    // Packaging
    checklist.push({
      id: 'packagingType',
      label: 'Packaging Type',
      originalValue: cargo.packagingType,
      category: 'Packaging',
    });

    if (cargo.numberOfPieces > 0) {
      checklist.push({
        id: 'numberOfPieces',
        label: 'Number of Pieces',
        originalValue: cargo.numberOfPieces,
        category: 'Packaging',
      });
    }

    if (cargo.numberOfPallets > 0) {
      checklist.push({
        id: 'numberOfPallets',
        label: 'Number of Pallets',
        originalValue: cargo.numberOfPallets,
        category: 'Packaging',
      });
    }

    // Special Requirements
    if (cargo.isFragile) {
      checklist.push({
        id: 'isFragile',
        label: 'Fragile Cargo',
        originalValue: 'Yes',
        category: 'Special Requirements',
      });
    }

    if (cargo.isHazardous) {
      checklist.push({
        id: 'isHazardous',
        label: 'Hazardous Material',
        originalValue: 'Yes',
        category: 'Special Requirements',
      });
      if (cargo.hazmatClass) {
        checklist.push({
          id: 'hazmatClass',
          label: 'Hazmat Class',
          originalValue: cargo.hazmatClass,
          category: 'Special Requirements',
        });
      }
    }

    if (cargo.requiresRefrigeration) {
      checklist.push({
        id: 'requiresRefrigeration',
        label: 'Requires Refrigeration',
        originalValue: 'Yes',
        category: 'Special Requirements',
      });
      if (cargo.temperatureMin && cargo.temperatureMax) {
        checklist.push({
          id: 'temperature',
          label: 'Temperature Range',
          originalValue: `${cargo.temperatureMin}°C to ${cargo.temperatureMax}°C`,
          category: 'Special Requirements',
        });
      }
    }

    // Instructions
    if (cargo.specialHandlingInstructions) {
      checklist.push({
        id: 'specialHandlingInstructions',
        label: 'Special Handling Instructions',
        originalValue: cargo.specialHandlingInstructions,
        category: 'Handling Instructions',
      });
    }

    if (cargo.loadingInstructions) {
      checklist.push({
        id: 'loadingInstructions',
        label: 'Loading Instructions',
        originalValue: cargo.loadingInstructions,
        category: 'Handling Instructions',
      });
    }

    if (cargo.unloadingInstructions) {
      checklist.push({
        id: 'unloadingInstructions',
        label: 'Unloading Instructions',
        originalValue: cargo.unloadingInstructions,
        category: 'Handling Instructions',
      });
    }

    // Value
    checklist.push({
      id: 'loadValue',
      label: 'Cargo Value',
      originalValue: `${cargo.currencyCode} ${cargo.loadValue}`,
      category: 'Value & Insurance',
    });

    return checklist;
  }

  /**
   * Submit cargo inspection (for receiver users)
   */
  async submitCargoInspection(
    cargoId: string,
    receiverId: string,
    inspectionData: SubmitCargoInspectionDto,
  ): Promise<CargoInspection> {
    // Verify receiver exists
    const receiver = await this.userRepository.findOne({
      where: { id: receiverId, role: UserRole.CARGO_RECEIVER },
    });

    if (!receiver) {
      throw new NotFoundException('Receiver not found');
    }

    // Get cargo and verify it's assigned to this receiver
    const cargo = await this.loadRepository.findOne({
      where: { id: cargoId, receiverId },
    });

    if (!cargo) {
      throw new NotFoundException('Cargo not found or not assigned to you');
    }

    // Check if inspection already exists
    let inspection = await this.cargoInspectionRepository.findOne({
      where: { loadId: cargoId, receiverId, inspectionType: CargoInspectionType.DELIVERY },
    });

    const verifiedCount = inspectionData.checklist.filter((item) => item.verified).length;
    const totalItems = inspectionData.checklist.length;
    const discrepancyCount = inspectionData.checklist.filter(
      (item) => item.discrepancy === true,
    ).length;
    const allItemsVerified = verifiedCount === totalItems && discrepancyCount === 0;
    
    // Mark as COMPLETED when inspection is submitted (regardless of discrepancies)
    // The inspection process is complete - discrepancies are just noted issues
    const inspectionStatus = InspectionStatus.COMPLETED;

    if (inspection) {
      // Update existing inspection - map DTO to entity format
      inspection.checklist = inspectionData.checklist.map((item) => ({
        id: item.id,
        label: item.label,
        originalValue: item.originalValue,
        verified: item.verified,
        notes: item.notes,
        discrepancy: item.discrepancy,
      }));
      inspection.overallNotes = inspectionData.overallNotes;
      inspection.verifiedCount = verifiedCount;
      inspection.totalItems = totalItems;
      inspection.discrepancyCount = discrepancyCount;
      inspection.allItemsVerified = allItemsVerified;
      inspection.status = inspectionStatus;
      inspection.completedAt = new Date();
      inspection.discrepancies = inspectionData.checklist
        .filter((item) => item.discrepancy)
        .map((item) => ({
          itemId: item.id,
          itemLabel: item.label,
          originalValue: item.originalValue,
          notes: item.notes || '',
        }));
      inspection.documents = inspectionData.documents || [];
    } else {
      // Create new inspection - map DTO to entity format
      inspection = this.cargoInspectionRepository.create({
        loadId: cargoId,
        receiverId,
        inspectionType: CargoInspectionType.DELIVERY,
        checklist: inspectionData.checklist.map((item) => ({
          id: item.id,
          label: item.label,
          originalValue: item.originalValue,
          verified: item.verified,
          notes: item.notes,
          discrepancy: item.discrepancy,
        })),
        overallNotes: inspectionData.overallNotes,
        verifiedCount,
        totalItems,
        discrepancyCount,
        allItemsVerified,
        status: inspectionStatus,
        completedAt: new Date(),
        discrepancies: inspectionData.checklist
          .filter((item) => item.discrepancy)
          .map((item) => ({
            itemId: item.id,
            itemLabel: item.label,
            originalValue: item.originalValue,
            notes: item.notes || '',
          })),
        documents: inspectionData.documents || [],
      });
    }

    const savedInspection = await this.cargoInspectionRepository.save(inspection);

    // ── When the receiver completes inspection the cargo has been physically
    //    delivered and accepted.  Update the load status to DELIVERED so all
    //    dashboard views reflect the real state.
    if (inspectionStatus === InspectionStatus.COMPLETED) {
      try {
        const { LoadStatus } = await import('../../entities/load.entity');
        cargo.status = LoadStatus.DELIVERED;
        await this.loadRepository.save(cargo);
        this.logger.log(`Load ${cargoId} status set to DELIVERED after receiver inspection`);
      } catch (err) {
        this.logger.error(`Failed to mark load ${cargoId} as DELIVERED: ${err.message}`);
      }
    }

    // If inspection is completed successfully, update ePOD status and trigger payment
    if (inspectionStatus === InspectionStatus.COMPLETED) {
      // Find the ePOD directly via the load → trip join, avoiding fragile string-based repo lookup
      try {
        const epod = await this.epodRepository
          .createQueryBuilder('epod')
          .innerJoin('epod.trip', 'trip')
          .where('trip.loadId = :loadId', { loadId: cargoId })
          .andWhere('epod.status = :status', { status: EpodStatus.PENDING })
          .orderBy('epod.submittedAt', 'DESC')
          .getOne();

        if (epod) {
          epod.status = EpodStatus.CONFIRMED;
          epod.confirmedAt = new Date();
          await this.epodRepository.save(epod);
          this.logger.log(`ePOD ${epod.id} status updated to CONFIRMED after cargo inspection`);

          // Trigger payment creation using the trip from the ePOD
          this.tripCompletionService
            .handleCargoReceiverConfirmation(epod.tripId, epod.tenantId, receiverId)
            .then(payment => {
              this.logger.log(`Created/updated payment ${payment.id} after cargo inspection completion`);
            })
            .catch(err => {
              this.logger.error(
                `Failed to handle cargo receiver confirmation after inspection: ${err.message}`,
                err.stack,
              );
            });
        } else {
          this.logger.warn(
            `No PENDING ePOD found for cargo ${cargoId} during inspection completion — may already be confirmed`,
          );
        }
      } catch (err) {
        this.logger.error(`Error updating ePOD status after inspection for cargo ${cargoId}:`, err);
        // Non-fatal — inspection is already saved
      }
    }

    return savedInspection;
  }

  /**
   * Get cargo inspection (for receiver users)
   */
  async getCargoInspection(cargoId: string, receiverId: string): Promise<CargoInspection | null> {
    // Verify receiver exists
    const receiver = await this.userRepository.findOne({
      where: { id: receiverId, role: UserRole.CARGO_RECEIVER },
    });

    if (!receiver) {
      throw new NotFoundException('Receiver not found');
    }

    // Get inspection
    const inspection = await this.cargoInspectionRepository.findOne({
      where: { loadId: cargoId, receiverId, inspectionType: CargoInspectionType.DELIVERY },
      relations: ['load', 'receiver'],
    });

    return inspection;
  }

  private formatLoadAddress(
    address?: { city?: string; country?: string; address?: string } | null,
  ): string {
    if (!address) {
      return 'N/A';
    }

    const parts = [address.city, address.country].filter(Boolean);
    if (parts.length > 0) {
      return parts.join(', ');
    }

    return address.address || 'N/A';
  }
}

