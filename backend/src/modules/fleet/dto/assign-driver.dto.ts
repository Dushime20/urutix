import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsUUID } from 'class-validator';

export class AssignDriverDto {
  @ApiProperty({
    description: 'Driver ID to assign to the truck',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  driverId: string;

  @ApiProperty({
    description: 'Optional notes about the assignment',
    example: 'Primary driver assignment',
    required: false,
  })
  @IsOptional()
  @IsString()
  notes?: string;
}
