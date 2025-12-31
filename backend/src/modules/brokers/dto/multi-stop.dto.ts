import { IsString, IsArray, IsNumber, IsEnum, IsDateString, IsObject, ValidateNested, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class StopLocationDto {
  @IsString()
  name: string;

  @IsString()
  address: string;

  @IsObject()
  coordinates: { lat: number; lng: number };

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  state?: string;
}

export class StopDto {
  @IsString()
  stopId: string;

  @IsNumber()
  sequence: number;

  @IsEnum(['PICKUP', 'DELIVERY', 'STOP'])
  type: 'PICKUP' | 'DELIVERY' | 'STOP';

  @ValidateNested()
  @Type(() => StopLocationDto)
  location: StopLocationDto;

  @IsDateString()
  scheduledTime: string;

  @IsNumber()
  estimatedDuration: number;

  @IsOptional()
  @IsObject()
  cargoDetails?: {
    weight?: number;
    volume?: number;
    pieces?: number;
  };

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  requirements?: string[];
}

export class CreateMultiStopLoadDto {
  @IsString()
  loadId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => StopDto)
  stops: StopDto[];
}

export class UpdateMultiStopLoadDto {
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => StopDto)
  stops?: StopDto[];

  @IsOptional()
  @IsString()
  notes?: string;
}

