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
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  DisputeCategory,
  DisputePriority,
  DisputeStatusV2,
  DisputeDecision,
} from '../../../entities/dispute-v2.entity';

// ─── Create Dispute ────────────────────────────────────────────────────────────

export class CreateDisputeDto {
  @ApiProperty({ example: 'Damaged cargo upon delivery' })
  @IsString()
  @MinLength(5)
  @MaxLength(255)
  title: string;

  @ApiProperty({ example: 'The cargo arrived with significant physical damage to the packaging and contents.' })
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

  @ApiPropertyOptional({ example: 'uuid-of-respondent' })
  @IsOptional()
  @IsUUID()
  respondentUserId?: string;

  @ApiPropertyOptional({ example: 'uuid-of-trip' })
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

  @ApiProperty({ example: 'After reviewing the evidence, cargo was damaged in transit.' })
  @IsString()
  @MinLength(10)
  resolutionSummary: string;

  @ApiPropertyOptional({ example: 'Internal notes for recordkeeping.' })
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
  @IsDateString()
  fromDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  toDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  page?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  limit?: number;
}
