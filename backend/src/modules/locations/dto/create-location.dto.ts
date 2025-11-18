import {
  IsString,
  IsNumber,
  IsOptional,
  IsEnum,
  Min,
  Max,
} from 'class-validator';

export enum LocationType {
  WAREHOUSE = 'warehouse',
  FACTORY = 'factory',
  DISTRIBUTION_CENTER = 'distribution_center',
  RETAIL_STORE = 'retail_store',
  CUSTOMER_LOCATION = 'customer_location',
  PICKUP_POINT = 'pickup_point',
  DELIVERY_POINT = 'delivery_point',
}

export class CreateLocationDto {
  @IsString()
  name: string;

  @IsString()
  address: string;

  @IsString()
  city: string;

  @IsString()
  state: string;

  @IsString()
  country: string;

  @IsString()
  postalCode: string;

  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude: number;

  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude: number;

  @IsEnum(LocationType)
  type: LocationType;

  @IsOptional()
  @IsString()
  contactPerson?: string;

  @IsOptional()
  @IsString()
  contactPhone?: string;

  @IsOptional()
  @IsString()
  contactEmail?: string;

  @IsOptional()
  @IsString()
  operatingHours?: string;

  @IsOptional()
  @IsString()
  specialInstructions?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
