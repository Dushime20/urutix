import { IsString, IsOptional, IsNumber, IsObject, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class RouteDto {
  @IsObject()
  origin: {
    city: string;
    state?: string;
    country: string;
    coordinates?: { lat: number; lng: number };
  };

  @IsObject()
  destination: {
    city: string;
    state?: string;
    country: string;
    coordinates?: { lat: number; lng: number };
  };

  @IsNumber()
  distance: number;
}

export class AnalyzeMarketRateDto {
  @ValidateNested()
  @Type(() => RouteDto)
  route: RouteDto;

  @IsOptional()
  @IsString()
  loadId?: string;
}

export class MarketForecastDto {
  @ValidateNested()
  @Type(() => RouteDto)
  route: RouteDto;

  @IsOptional()
  @IsNumber()
  days?: number;
}

