import {
  IsString,
  IsEnum,
  IsOptional,
  IsUUID,
  IsBoolean,
  MinLength,
  MaxLength,
  IsNumber,
  IsDateString,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  DisputeCategory,
  DisputePriority,
  DisputeStatusV2,
  DisputeDecision,
  SupportAssigneeRole,
  EscalationReason,
} from '../../../entities/dispute-v2.entity';
import { Type } from 'class-transformer';

// ─── Create Dispute ────────────────────────────────────────────────────────────

export class CreateDisputeDto {
  @ApiProperty({ example: 'Damaged cargo upon delivery' })
  @IsString()
  @MinLength(5)
  @MaxLength(255)
  title: string;

  @ApiProperty({ example: 'The cargo arrived with significant physical damage.' })
  @IsString()
  @MinLength(10)
  description: string;

  @ApiProperty({ enum: DisputeCategory })
  @IsEnum(DisputeCategory)
  category: DisputeCategory;

  @ApiPropertyOptional({ enum: DisputePriority })
  @IsOptional()
  @IsEnum(DisputePriority)
  priority?: DisputePriority;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  respondentUserId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  tripId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  shipmentId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  truckId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  contractId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  invoiceId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  auctionId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  paymentId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  driverId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  brokerId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  lenderId?: string;

  @ApiPropertyOptional({ example: 'Warehouse A, Lagos' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  location?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  incidentDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  additionalNotes?: string;
}

// ─── Update Dispute ────────────────────────────────────────────────────────────

export class UpdateDisputeDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(5)
  @MaxLength(255)
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ enum: DisputeCategory })
  @IsOptional()
  @IsEnum(DisputeCategory)
  category?: DisputeCategory;

  @ApiPropertyOptional({ enum: DisputePriority })
  @IsOptional()
  @IsEnum(DisputePriority)
  priority?: DisputePriority;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  additionalNotes?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  location?: string;
}

// ─── Add Comment ──────────────────────────────────────────────────────────────

export class AddCommentDto {
  @ApiProperty({ example: 'I have uploaded the photos showing the damage.' })
  @IsString()
  @MinLength(1)
  message: string;

  @ApiPropertyOptional({ description: 'Admin-only internal note' })
  @IsOptional()
  @IsBoolean()
  isInternal?: boolean;
}

// ─── Resolve Dispute ──────────────────────────────────────────────────────────

export class ResolveDisputeDto {
  @ApiProperty({ enum: DisputeDecision })
  @IsEnum(DisputeDecision)
  decision: DisputeDecision;

  @ApiProperty()
  @IsString()
  @MinLength(10)
  resolutionSummary: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  adminNotes?: string;
}

// ─── Change Status ────────────────────────────────────────────────────────────

export class ChangeStatusDto {
  @ApiProperty({ enum: DisputeStatusV2 })
  @IsEnum(DisputeStatusV2)
  status: DisputeStatusV2;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  reason?: string;
}

// ─── Assign Dispute ───────────────────────────────────────────────────────────

export class AssignDisputeDto {
  @ApiProperty()
  @IsUUID()
  assignedToUserId: string;

  @ApiPropertyOptional({ enum: SupportAssigneeRole })
  @IsOptional()
  @IsEnum(SupportAssigneeRole)
  assignedRole?: SupportAssigneeRole;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

// ─── Escalate Dispute ─────────────────────────────────────────────────────────

export class EscalateDisputeDto {
  @ApiProperty({ enum: EscalationReason })
  @IsEnum(EscalationReason)
  reason: EscalationReason;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

// ─── Filters ──────────────────────────────────────────────────────────────────

export class DisputeFilterDto {
  @ApiPropertyOptional({ enum: DisputeStatusV2 })
  @IsOptional()
  @IsEnum(DisputeStatusV2)
  status?: DisputeStatusV2;

  @ApiPropertyOptional({ enum: DisputeCategory })
  @IsOptional()
  @IsEnum(DisputeCategory)
  category?: DisputeCategory;

  @ApiPropertyOptional({ enum: DisputePriority })
  @IsOptional()
  @IsEnum(DisputePriority)
  priority?: DisputePriority;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  assignedToUserId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  fromDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  toDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  slaBreached?: boolean;
}
