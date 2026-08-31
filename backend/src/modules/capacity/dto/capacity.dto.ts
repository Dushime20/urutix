import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CapacityBookingMode } from '../../../entities/capacity-offer.entity';

export class CapacityPlaceDto {
  @IsString()
  @MaxLength(120)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  city?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  country?: string;

  @IsOptional()
  @IsString()
  @MaxLength(8)
  countryCode?: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  address?: string;

  @Type(() => Number)
  @IsNumber()
  lat: number;

  @Type(() => Number)
  @IsNumber()
  lng: number;
}

export class CreateCapacityOfferDto {
  @ApiProperty()
  @IsUUID()
  truckId: string;

  @ApiProperty({ description: 'Active trip carrying the partial load' })
  @IsUUID()
  tripId: string;

  @ApiPropertyOptional({ type: CapacityPlaceDto, description: 'Derived from trip cargo when tripId is set' })
  @IsOptional()
  @ValidateNested()
  @Type(() => CapacityPlaceDto)
  origin?: CapacityPlaceDto;

  @ApiPropertyOptional({ type: CapacityPlaceDto, description: 'Derived from trip cargo when tripId is set' })
  @IsOptional()
  @ValidateNested()
  @Type(() => CapacityPlaceDto)
  destination?: CapacityPlaceDto;

  @ApiPropertyOptional({ description: 'Derived from trip schedule when tripId is set' })
  @IsOptional()
  @IsDateString()
  departureAt?: string;

  @ApiPropertyOptional({ description: 'Derived from trip schedule when tripId is set' })
  @IsOptional()
  @IsDateString()
  arrivalAt?: string;

  @ApiPropertyOptional({ description: 'Leftover kg to sell. Defaults to unused truck capacity.' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(50)
  remainingWeightKg?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  remainingVolumeM3?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  floorPrice?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  pricePerTonne?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  pricePerM3?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(3)
  currencyCode?: string;

  @ApiPropertyOptional({ enum: CapacityBookingMode })
  @IsOptional()
  @IsEnum(CapacityBookingMode)
  bookingMode?: CapacityBookingMode;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  compatibleCargoTypes?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  generalCargoOnly?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  allowMixing?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}

export class UpdateCapacityOfferDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  floorPrice?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  pricePerTonne?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  pricePerM3?: number;

  @IsOptional()
  @IsEnum(CapacityBookingMode)
  bookingMode?: CapacityBookingMode;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}

export class SearchCapacityDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  originCity?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  destinationCity?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  originLat?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  originLng?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  destinationLat?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  destinationLng?: number;

  @IsOptional()
  @IsDateString()
  pickupAt?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  weightKg?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  volumeM3?: number;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  cargoType?: string;

  @IsOptional()
  @IsUUID()
  loadId?: string;
}

export class QuoteCapacityDto {
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  weightKg: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  volumeM3?: number;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  cargoType?: string;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isHazardous?: boolean;

  @IsOptional()
  @ValidateNested()
  @Type(() => CapacityPlaceDto)
  origin?: CapacityPlaceDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => CapacityPlaceDto)
  destination?: CapacityPlaceDto;

  @IsOptional()
  @IsDateString()
  pickupAt?: string;
}

export class BookCapacityDto extends QuoteCapacityDto {
  @IsOptional()
  @IsUUID()
  loadId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  loadValue?: number;

  @IsOptional()
  @IsDateString()
  pickupDate?: string;

  @IsOptional()
  @IsDateString()
  deliveryDate?: string;
}

export class RejectBookingDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}

export class CancelBookingDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}
