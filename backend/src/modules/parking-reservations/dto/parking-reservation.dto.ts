import {
  IsBoolean,
  IsDateString,
  IsEmail,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Matches,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ParkingReservationStatus } from '../../../entities/parking-reservation.entity';

const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

export class CreateParkingReservationDto {
  @Transform(trim)
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  companyName: string;

  @Transform(trim)
  @IsString()
  @MinLength(5)
  @MaxLength(40)
  mcNumber: string;

  @Transform(trim)
  @IsString()
  @MinLength(5)
  @MaxLength(40)
  usdotNumber: string;

  @Transform(trim)
  @IsString()
  @MinLength(7)
  @MaxLength(40)
  companyPhone: string;

  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  @IsEmail()
  @MaxLength(180)
  email: string;

  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  @IsEmail()
  @MaxLength(180)
  driverEmail: string;

  @Transform(trim)
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  driverFirstName: string;

  @Transform(trim)
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  driverLastName: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(700)
  truckSpacesRequested: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(60)
  contractMonths: number;

  @IsDateString()
  requestedStartDate: string;

  @IsBoolean()
  agreementAccepted: boolean;

  @IsString()
  @Matches(/^data:image\/(png|jpeg);base64,[A-Za-z0-9+/=]+$/, {
    message: 'A drawn signature is required',
  })
  @MaxLength(400000)
  signature: string;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(2000)
  customerNotes?: string;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(80)
  idempotencyKey?: string;

  /** Honeypot — must remain empty. */
  @IsOptional()
  @IsString()
  @MaxLength(200)
  website?: string;
}

export class ParkingReservationFilterDto {
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(200)
  search?: string;

  @IsOptional()
  @IsEnum(ParkingReservationStatus)
  status?: ParkingReservationStatus;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(200)
  companyName?: string;

  @IsOptional()
  @IsUUID()
  assignedToUserId?: string;

  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @IsOptional()
  @IsDateString()
  dateTo?: string;

  @IsOptional()
  @Transform(trim)
  @IsString()
  sortBy?: string;

  @IsOptional()
  @IsString()
  sortDir?: 'ASC' | 'DESC';

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}

export class AssignParkingReservationDto {
  @IsUUID()
  assignedToUserId: string;
}

export class RejectParkingReservationDto {
  @Transform(trim)
  @IsString()
  @MinLength(5)
  @MaxLength(1000)
  reason: string;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(2000)
  additionalExplanation?: string;
}

export class RequestInformationDto {
  @Transform(trim)
  @IsString()
  @MinLength(5)
  @MaxLength(2000)
  informationRequired: string;
}

export class CancelParkingReservationDto {
  @Transform(trim)
  @IsString()
  @MinLength(5)
  @MaxLength(1000)
  reason: string;
}

export class AddParkingNoteDto {
  @Transform(trim)
  @IsString()
  @MinLength(2)
  @MaxLength(4000)
  note: string;
}

export class LookupParkingReservationDto {
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(30)
  reservationReference: string;

  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  @IsEmail()
  email: string;
}

export class GuestInformationResponseDto extends LookupParkingReservationDto {
  @Transform(trim)
  @IsString()
  @MinLength(5)
  @MaxLength(4000)
  response: string;
}

export class UpdateParkingFacilityDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100000)
  totalCapacity?: number;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(160)
  facilityName?: string;

  @IsOptional()
  @IsBoolean()
  allowPastStartDates?: boolean;
}
