import { IsString, IsEnum, IsOptional, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum SignatureMethod {
  DIGITAL = 'DIGITAL',
  E_SIGNATURE = 'E_SIGNATURE',
  MANUAL = 'MANUAL',
}

export class SignContractDto {
  @ApiProperty({ enum: SignatureMethod, description: 'Method of signature' })
  @IsEnum(SignatureMethod)
  signatureMethod: SignatureMethod;

  @ApiPropertyOptional({ description: 'Signature data (for digital signatures)' })
  @IsString()
  @IsOptional()
  signatureData?: string;

  @ApiPropertyOptional({ description: 'Additional metadata' })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}

