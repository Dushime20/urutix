import {
  IsString,
  IsUUID,
  IsNumber,
  IsOptional,
  IsEnum,
  IsDateString,
  IsBoolean,
  ValidateNested,
  IsObject,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ContractType } from '../../../entities/load-contract.entity';

export class CreateContractDto {
  @ApiProperty({ description: 'Load ID for this contract' })
  @IsUUID()
  loadId: string;

  @ApiProperty({ description: 'Transporter ID (truck owner)' })
  @IsUUID()
  transporterId: string;

  @ApiPropertyOptional({ description: 'Trip ID if trip already exists' })
  @IsUUID()
  @IsOptional()
  tripId?: string;

  @ApiProperty({ enum: ContractType, default: ContractType.LOAD_AGREEMENT })
  @IsEnum(ContractType)
  @IsOptional()
  contractType?: ContractType;

  @ApiProperty({ description: 'Agreed rate for the load' })
  @IsNumber()
  @Min(0)
  agreedRate: number;

  @ApiProperty({ description: 'Currency code', default: 'KES' })
  @IsString()
  @IsOptional()
  currencyCode?: string;

  @ApiProperty({ description: 'Commission rate percentage', minimum: 0, maximum: 100 })
  @IsNumber()
  @Min(0)
  @Max(100)
  commissionRate: number;

  @ApiPropertyOptional({ description: 'Payment terms (e.g., "Net 30", "50% advance, 50% on delivery")' })
  @IsString()
  @IsOptional()
  paymentTerms?: string;

  @ApiPropertyOptional({ description: 'Payment due date' })
  @IsDateString()
  @IsOptional()
  paymentDueDate?: string;

  @ApiPropertyOptional({ description: 'Pickup date' })
  @IsDateString()
  @IsOptional()
  pickupDate?: string;

  @ApiPropertyOptional({ description: 'Delivery date' })
  @IsDateString()
  @IsOptional()
  deliveryDate?: string;

  @ApiPropertyOptional({ description: 'Delivery terms' })
  @IsString()
  @IsOptional()
  deliveryTerms?: string;

  @ApiPropertyOptional({ description: 'Special instructions' })
  @IsString()
  @IsOptional()
  specialInstructions?: string;

  @ApiPropertyOptional({ description: 'Contract content/template' })
  @IsString()
  @IsOptional()
  contractContent?: string;

  @ApiPropertyOptional({ description: 'Structured contract data' })
  @IsObject()
  @IsOptional()
  contractData?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Template ID if using a template' })
  @IsUUID()
  @IsOptional()
  templateId?: string;

  @ApiPropertyOptional({ description: 'Contract expiry date' })
  @IsDateString()
  @IsOptional()
  expiresAt?: string;
}

