import { IsString, IsNotEmpty, IsUUID, IsOptional, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * CreateAppealDto
 * 
 * DTO for creating a new appeal against an enforcement action.
 * Users submit appeals to contest suspensions, restrictions, or terminations.
 */
export class CreateAppealDto {
  @ApiProperty({
    description: 'ID of the enforcement action being appealed',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  @IsNotEmpty()
  enforcementActionId: string;

  @ApiProperty({
    description: 'Reason for the appeal',
    example: 'I believe this suspension was issued in error. I did not violate any terms.',
    minLength: 20,
    maxLength: 2000,
  })
  @IsString()
  @IsNotEmpty()
  reason: string;

  @ApiPropertyOptional({
    description: 'Supporting evidence for the appeal',
    example: {
      screenshots: ['url1', 'url2'],
      references: ['ticket-123'],
      explanation: 'Detailed explanation of the situation'
    },
  })
  @IsOptional()
  @IsObject()
  evidence?: Record<string, any>;

  @ApiPropertyOptional({
    description: 'Additional notes or context',
    example: 'This is my first violation and I was not aware of the policy.',
    maxLength: 1000,
  })
  @IsOptional()
  @IsString()
  additionalNotes?: string;
}
