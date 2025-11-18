import { IsIn, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateDisbursementStatusDto {
  @ApiProperty({
    description: 'New status for the disbursement',
    enum: ['pending', 'approved', 'disbursed', 'rejected', 'on_hold'],
    example: 'approved',
  })
  @IsIn(['pending', 'approved', 'disbursed', 'rejected', 'on_hold'])
  status: string;

  @ApiPropertyOptional({
    description: 'Reason for the status change',
    example: 'All documents verified and approved by risk assessment team',
  })
  @IsOptional()
  @IsString()
  reason?: string;

  @ApiPropertyOptional({
    description: 'Additional notes about the status change',
    example: 'Expedited processing due to high priority cargo',
  })
  @IsOptional()
  @IsString()
  notes?: string;
}
