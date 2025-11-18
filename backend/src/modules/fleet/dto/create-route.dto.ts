import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, IsIn } from 'class-validator';

export class CreateRouteDto {
  @ApiProperty({
    description: 'Route name',
    example: 'NYC to Chicago',
  })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Route origin',
    example: 'New York, NY',
  })
  @IsString()
  origin: string;

  @ApiProperty({
    description: 'Route destination',
    example: 'Chicago, IL',
  })
  @IsString()
  destination: string;

  @ApiProperty({
    description: 'Route distance in miles',
    example: 800,
  })
  @IsNumber()
  distance: number;

  @ApiProperty({
    description: 'Estimated duration in hours',
    example: 12,
  })
  @IsNumber()
  estimatedDuration: number;

  @ApiProperty({
    description: 'Route status',
    enum: ['active', 'inactive', 'maintenance'],
    example: 'active',
  })
  @IsString()
  @IsIn(['active', 'inactive', 'maintenance'])
  status: 'active' | 'inactive' | 'maintenance';
}
