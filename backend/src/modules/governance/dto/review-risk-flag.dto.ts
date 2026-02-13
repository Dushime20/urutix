import { IsString, IsNotEmpty, IsIn, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * ReviewRiskFlagDto
 * 
 * DTO for reviewing a risk flag.
 * Admins can dismiss false positives or escalate to enforcement.
 */
export class ReviewRiskFlagDto {
  @ApiProperty({
    description: 'Action to take on the risk flag',
    enum: ['dismiss', 'escalate', 'monitor'],
    example: 'escalate',
  })
  @IsString()
  @IsNotEmpty()
  @IsIn(['dismiss', 'escalate', 'monitor'])
  action: 'dismiss' | 'escalate' | 'monitor';

  @ApiProperty({
    description: 'Review notes explaining the decision',
    example: 'After investigation, confirmed fraudulent activity. Escalating to enforcement.',
    minLength: 20,
    maxLength: 1000,
  })
  @IsString()
  @IsNotEmpty()
  reviewNotes: string;

  @ApiPropertyOptional({
    description: 'Whether to automatically suspend the user (for escalate action)',
    example: true,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  autoSuspend?: boolean;

  @ApiPropertyOptional({
    description: 'Internal notes (not visible to user)',
    example: 'Consulted with fraud team. Pattern matches known fraud ring.',
    maxLength: 1000,
  })
  @IsOptional()
  @IsString()
  internalNotes?: string;
}
