import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsString, IsOptional, IsUUID, IsIn } from 'class-validator';

export class BulkAssignDto {
  @ApiProperty({
    description: 'Array of truck IDs to assign to',
    example: [
      '123e4567-e89b-12d3-a456-426614174000',
      '987fcdeb-51a2-43d1-b456-426614174000',
    ],
  })
  @IsArray()
  @IsUUID('4', { each: true })
  truckIds: string[];

  @ApiProperty({
    description: 'Array of driver IDs to assign (for driver assignments)',
    example: ['123e4567-e89b-12d3-a456-426614174000'],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  driverIds?: string[];

  @ApiProperty({
    description: 'Array of route IDs to assign (for route assignments)',
    example: ['123e4567-e89b-12d3-a456-426614174000'],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  routeIds?: string[];

  @ApiProperty({
    description: 'Type of assignment',
    enum: ['driver', 'route'],
    example: 'driver',
  })
  @IsString()
  @IsIn(['driver', 'route'])
  type: 'driver' | 'route';
}
