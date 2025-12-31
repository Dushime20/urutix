import {
  IsString,
  IsUUID,
  IsOptional,
  IsEnum,
  IsNumber,
  Min,
  IsObject,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DocumentType } from '../../../entities/load-document.entity';

export class CreateDocumentDto {
  @ApiProperty({ description: 'Load ID' })
  @IsUUID()
  loadId: string;

  @ApiPropertyOptional({ description: 'Trip ID if trip exists' })
  @IsUUID()
  @IsOptional()
  tripId?: string;

  @ApiProperty({ enum: DocumentType })
  @IsEnum(DocumentType)
  documentType: DocumentType;

  @ApiProperty({ description: 'File name' })
  @IsString()
  fileName: string;

  @ApiProperty({ description: 'File URL or path' })
  @IsString()
  fileUrl: string;

  @ApiPropertyOptional({ description: 'File type/MIME type' })
  @IsString()
  @IsOptional()
  fileType?: string;

  @ApiPropertyOptional({ description: 'File size in bytes' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  fileSize?: number;

  @ApiPropertyOptional({ description: 'MIME type' })
  @IsString()
  @IsOptional()
  mimeType?: string;

  @ApiPropertyOptional({ description: 'Document content (for generated documents)' })
  @IsString()
  @IsOptional()
  documentContent?: string;

  @ApiPropertyOptional({ description: 'Structured document data' })
  @IsObject()
  @IsOptional()
  documentData?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: 'Expiry date' })
  @IsString()
  @IsOptional()
  expiresAt?: string;
}

