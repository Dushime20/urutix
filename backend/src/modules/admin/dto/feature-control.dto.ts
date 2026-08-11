import { IsBoolean, IsEnum, IsOptional, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { FeatureControlScope } from '../../../entities/feature-control.entity';

export class UpdateFeatureControlDto {
  @ApiProperty({ example: 'bids:create' })
  @IsString()
  @MinLength(3)
  @MaxLength(150)
  permissionCode: string;

  @ApiProperty({ example: false })
  @IsBoolean()
  enabled: boolean;

  @ApiPropertyOptional({ example: 'Temporary bidding suspension for maintenance' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  reason?: string;

  @ApiPropertyOptional({ enum: FeatureControlScope, default: FeatureControlScope.PLATFORM })
  @IsOptional()
  @IsEnum(FeatureControlScope)
  scope?: FeatureControlScope;

  @ApiPropertyOptional({ description: 'Required when scope is TENANT' })
  @IsOptional()
  @IsUUID()
  tenantId?: string;
}

export class FeatureControlQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  tenantId?: string;
}
