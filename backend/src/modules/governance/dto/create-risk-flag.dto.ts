import { IsString, IsNotEmpty, IsUUID, IsIn, IsOptional, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * CreateRiskFlagDto
 * 
 * DTO for creating a risk flag manually.
 * Admins can flag users for suspicious activity.
 */
export class CreateRiskFlagDto {
  @ApiProperty({
    description: 'ID of the user to flag',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({
    description: 'Reason for flagging the user',
    example: 'Multiple failed payment attempts detected',
    minLength: 20,
    maxLength: 1000,
  })
  @IsString()
  @IsNotEmpty()
  reason: string;

  @ApiProperty({
    description: 'Severity level of the risk',
    enum: ['low', 'medium', 'high', 'critical'],
    example: 'high',
  })
  @IsString()
  @IsNotEmpty()
  @IsIn(['low', 'medium', 'high', 'critical'])
  severity: 'low' | 'medium' | 'high' | 'critical';

  @ApiProperty({
    description: 'Type of risk detected',
    example: 'payment_fraud',
  })
  @IsString()
  @IsNotEmpty()
  riskType: string;

  @ApiPropertyOptional({
    description: 'Supporting evidence for the flag',
    example: {
      failedAttempts: 5,
      suspiciousIPs: ['192.168.1.1', '10.0.0.1'],
      timeframe: '24 hours'
    },
  })
  @IsOptional()
  @IsObject()
  evidence?: Record<string, any>;

  @ApiPropertyOptional({
    description: 'Admin notes (internal)',
    example: 'User attempted multiple transactions with different cards',
    maxLength: 1000,
  })
  @IsOptional()
  @IsString()
  adminNotes?: string;
}
