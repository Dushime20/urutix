import { IsNumber, IsOptional, IsEnum, Min, Max } from 'class-validator';
import { LocationType } from './create-location.dto';

export class NearbyLocationsDto {
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude: number;

  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude: number;

  @IsNumber()
  @Min(0.1)
  @Max(1000)
  radiusKm: number;

  @IsOptional()
  @IsEnum(LocationType)
  type?: LocationType;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}
