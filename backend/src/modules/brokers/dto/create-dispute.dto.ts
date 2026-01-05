import {
  IsString,
  IsUUID,
  IsOptional,
  IsEnum,
  IsNumber,
  Min,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DisputeCategory, DisputeSeverity } from '../../../entities/broker-dispute.entity';

export class EvidenceItemDto {
  @ApiProperty({ enum: ['PHOTO', 'DOCUMENT', 'VIDEO', 'AUDIO', 'OTHER'] })
  @IsEnum(['PHOTO', 'DOCUMENT', 'VIDEO', 'AUDIO', 'OTHER'])
  type: 'PHOTO' | 'DOCUMENT' | 'VIDEO' | 'AUDIO' | 'OTHER';

  @ApiProperty({ description: 'URL or path to evidence file' })
  @IsString()
  url: string;

  @ApiPropertyOptional({ description: 'Description of evidence' })
  @IsString()
  @IsOptional()
  description?: string;
}

export class CreateDisputeDto {
  @ApiProperty({ description: 'Load ID related to dispute' })
  @IsUUID()
  loadId: string;

  @ApiPropertyOptional({ description: 'Trip ID if trip exists' })
  @IsUUID()
  @IsOptional()
  tripId?: string;

  @ApiProperty({ description: 'ID of the party being disputed with' })
  @IsUUID()
  disputedWithId: string;

  @ApiProperty({ enum: DisputeCategory })
  @IsEnum(DisputeCategory)
  category: DisputeCategory;

  @ApiProperty({ enum: DisputeSeverity, default: DisputeSeverity.MEDIUM })
  @IsEnum(DisputeSeverity)
  @IsOptional()
  severity?: DisputeSeverity;

  @ApiProperty({ description: 'Dispute description' })
  @IsString()
  description: string;

  @ApiPropertyOptional({ description: 'Claimed amount if applicable' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  claimedAmount?: number;

  @ApiPropertyOptional({ description: 'Evidence items', type: [EvidenceItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EvidenceItemDto)
  @IsOptional()
  evidence?: EvidenceItemDto[];
}

