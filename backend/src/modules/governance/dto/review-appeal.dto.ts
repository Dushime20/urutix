import { IsString, IsNotEmpty, IsIn, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * ReviewAppealDto
 * 
 * DTO for admin review of an appeal.
 * Admins can approve or reject appeals with detailed notes.
 */
export class ReviewAppealDto {
  @ApiProperty({
    description: 'Decision on the appeal',
    enum: ['approved', 'rejected'],
    example: 'approved',
  })
  @IsString()
  @IsNotEmpty()
  @IsIn(['approved', 'rejected'])
  decision: 'approved' | 'rejected';

  @ApiProperty({
    description: 'Admin notes explaining the decision',
    example: 'After reviewing the evidence, we have determined that the suspension was issued in error. The user will be unsuspended.',
    minLength: 20,
    maxLength: 2000,
  })
  @IsString()
  @IsNotEmpty()
  adminNotes: string;

  @ApiPropertyOptional({
    description: 'Internal notes (not visible to user)',
    example: 'Consulted with legal team. User has clean history.',
    maxLength: 1000,
  })
  @IsOptional()
  @IsString()
  internalNotes?: string;
}
