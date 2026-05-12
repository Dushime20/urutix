import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, IsIn, IsEnum } from 'class-validator';
import { RouteType } from '../../../entities/route.entity';

export class CreateRouteDto {
  @ApiProperty({ description: 'Route name', example: 'NYC to Chicago' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Route origin display name', example: 'New York, NY' })
  @IsString()
  origin: string;

  @ApiProperty({ description: 'Route destination display name', example: 'Chicago, IL' })
  @IsString()
  destination: string;

  // ── Origin exact location ──────────────────────────────────────────────────
  @ApiProperty({ description: 'Origin latitude', example: 40.712776, required: false })
  @IsOptional()
  @IsNumber()
  originLat?: number;

  @ApiProperty({ description: 'Origin longitude', example: -74.005974, required: false })
  @IsOptional()
  @IsNumber()
  originLng?: number;

  @ApiProperty({ description: 'Origin full address from reverse geocoding', required: false })
  @IsOptional()
  @IsString()
  originAddress?: string;

  // ── Destination exact location ─────────────────────────────────────────────
  @ApiProperty({ description: 'Destination latitude', example: 41.878113, required: false })
  @IsOptional()
  @IsNumber()
  destinationLat?: number;

  @ApiProperty({ description: 'Destination longitude', example: -87.629799, required: false })
  @IsOptional()
  @IsNumber()
  destinationLng?: number;

  @ApiProperty({ description: 'Destination full address from reverse geocoding', required: false })
  @IsOptional()
  @IsString()
  destinationAddress?: string;

  @ApiProperty({ description: 'Route distance in kilometers', example: 800 })
  @IsNumber()
  distance: number;

  @ApiProperty({ description: 'Estimated time in hours', example: 12 })
  @IsNumber()
  estimatedTime: number;

  @ApiProperty({ description: 'Route type', enum: RouteType, example: RouteType.HIGHWAY })
  @IsOptional()
  @IsEnum(RouteType)
  routeType?: RouteType;

  @ApiProperty({ description: 'Route status', enum: ['active', 'inactive', 'maintenance'], example: 'active' })
  @IsString()
  @IsIn(['active', 'inactive', 'maintenance'])
  status: 'active' | 'inactive' | 'maintenance';

  @ApiProperty({ description: 'Route description', required: false })
  @IsOptional()
  @IsString()
  description?: string;
}
