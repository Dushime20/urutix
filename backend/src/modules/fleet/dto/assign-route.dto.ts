import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsUUID } from 'class-validator';

export class AssignRouteDto {
  @ApiProperty({
    description: 'Route ID to assign to the truck',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  routeId: string;

  @ApiProperty({
    description: 'Optional notes about the assignment',
    example: 'Primary route assignment',
    required: false,
  })
  @IsOptional()
  @IsString()
  notes?: string;
}
