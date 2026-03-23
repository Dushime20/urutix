import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, IsIn, IsEnum } from 'class-validator';
import { RouteType } from '../../../entities/route.entity';

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
    description: 'Route distance in kilometers',
    example: 800,
  })
  @IsNumber()
  distance: number;

  @ApiProperty({
    description: 'Estimated time in hours',
    example: 12,
  })
  @IsNumber()
  estimatedTime: number;

  @ApiProperty({
    description: 'Route type',
    enum: RouteType,
    example: RouteType.HIGHWAY,
  })
  @IsOptional()
  @IsEnum(RouteType)
  routeType?: RouteType;

  @ApiProperty({
    description: 'Route status',
    enum: ['active', 'inactive', 'maintenance'],
    example: 'active',
  })
  @IsString()
  @IsIn(['active', 'inactive', 'maintenance'])
  status: 'active' | 'inactive' | 'maintenance';

  @ApiProperty({
    description: 'Route description',
    example: 'Main highway route with toll roads',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;
}
