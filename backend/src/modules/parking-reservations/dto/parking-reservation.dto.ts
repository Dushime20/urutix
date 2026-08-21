import {
  IsBoolean,
  IsDateString,
  IsEmail,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Matches,
  MaxLength,
  Min,
  MinLength,
  ValidateIf,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import {
  ParkingLateFeeType,
  ParkingPaymentDueType,
  ParkingPaymentFrequency,
  ParkingReservationFeeApplication,
  ParkingReservationFeeType,
  ParkingReservationPaymentMethod,
  ParkingReservationStatus,
} from '../../../entities/parking-reservation.entity';

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

  @IsUUID()
  parkingFacilityId: string;

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

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(80)
  city?: string;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(80)
  country?: string;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(80)
  region?: string;
}

export class SearchParkingFacilitiesDto {
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(200)
  search?: string;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(80)
  country?: string;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(80)
  city?: string;

  @IsOptional()
  @IsUUID()
  tenantId?: string;

  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true' || value === '1')
  @IsBoolean()
  availableOnly?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number;
}

export class UpdateParkingFeesDto {
  @IsOptional()
  @IsUUID()
  id?: string;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(160)
  name?: string;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(2000)
  description?: string;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(80)
  spaceType?: string;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(80)
  vehicleType?: string;

  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toUpperCase() : value))
  @IsString()
  @Matches(/^[A-Z]{3}$/, { message: 'Currency must be a 3-letter ISO 4217 code' })
  currency?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(1000000)
  monthlyRatePerSpace?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(1000000)
  dailyRate?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(1000000)
  weeklyRate?: number;

  @IsOptional()
  @Transform(({ value }) => (value === null || value === '' ? null : Number(value)))
  @ValidateIf((_, value) => value != null)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(1000000)
  longTermRate?: number | null;

  @IsOptional()
  @Transform(({ value }) => (value === null || value === '' ? null : Number(value)))
  @ValidateIf((_, value) => value != null)
  @IsInt()
  @Min(1)
  @Max(120)
  longTermMonths?: number | null;

  @IsOptional()
  @IsEnum(ParkingReservationFeeType)
  reservationFeeType?: ParkingReservationFeeType;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(1000000)
  reservationFee?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(1000000)
  reservationFeeValue?: number;

  @IsOptional()
  @IsEnum(ParkingReservationFeeApplication)
  reservationFeeApplication?: ParkingReservationFeeApplication;

  @IsOptional()
  @IsBoolean()
  taxEnabled?: boolean;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(80)
  taxName?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100)
  taxPercent?: number;

  @IsOptional()
  @IsEnum(ParkingPaymentFrequency)
  paymentFrequency?: ParkingPaymentFrequency;

  @IsOptional()
  @IsEnum(ParkingPaymentDueType)
  paymentDueType?: ParkingPaymentDueType;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(90)
  paymentDueDays?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(30)
  gracePeriodDays?: number;

  @IsOptional()
  @IsEnum(ParkingLateFeeType)
  lateFeeType?: ParkingLateFeeType;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(1000000)
  lateFeeValue?: number;

  @IsOptional()
  @IsBoolean()
  autoRenewal?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(120)
  minContractMonths?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(120)
  maxContractMonths?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(10000)
  minSpaces?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(10000)
  maxSpaces?: number;

  @IsOptional()
  @IsBoolean()
  cancellationAllowed?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(365)
  cancellationNoticeDays?: number;

  @IsOptional()
  @IsEnum(ParkingLateFeeType)
  cancellationFeeType?: ParkingLateFeeType;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(1000000)
  cancellationFeeValue?: number;

  @IsOptional()
  @IsBoolean()
  refundEligible?: boolean;

  @IsOptional()
  @IsBoolean()
  earlyTerminationAllowed?: boolean;

  @IsOptional()
  @IsDateString()
  effectiveFrom?: string;

  @IsOptional()
  @IsDateString()
  effectiveUntil?: string;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(2000)
  feeNotes?: string;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(4000)
  paymentInstructions?: string;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(160)
  facilityName?: string;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(80)
  city?: string;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(80)
  country?: string;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(80)
  region?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100000)
  totalCapacity?: number;
}

export class PreviewParkingQuoteDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(10000)
  spaces: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(120)
  months: number;

  @IsOptional()
  @IsDateString()
  reservationStartDate?: string;

  @IsOptional()
  @IsUUID()
  scheduleId?: string;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(80)
  spaceType?: string;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(80)
  vehicleType?: string;

  @IsOptional()
  @IsUUID()
  facilityId?: string;
}

export class SubmitParkingPaymentDto {
  @IsEnum(ParkingReservationPaymentMethod)
  paymentMethod: ParkingReservationPaymentMethod;

  @Transform(trim)
  @IsString()
  @MinLength(4)
  @MaxLength(80)
  paymentReference: string;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(500)
  notes?: string;
}

export class GuestParkingPaymentDto extends LookupParkingReservationDto {
  @IsEnum(ParkingReservationPaymentMethod)
  paymentMethod: ParkingReservationPaymentMethod;

  @Transform(trim)
  @IsString()
  @MinLength(4)
  @MaxLength(80)
  paymentReference: string;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(500)
  notes?: string;
}

export class GuestIshemaPayDto extends LookupParkingReservationDto {
  @Transform(trim)
  @IsString()
  @MinLength(9)
  @MaxLength(20)
  phoneNumber: string;
}

export class GuestIshemaPayStatusDto extends LookupParkingReservationDto {
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(80)
  referenceId?: string;
}

export class InitiateIshemaPayDto {
  @Transform(trim)
  @IsString()
  @MinLength(9)
  @MaxLength(20)
  phoneNumber: string;
}

export class IshemaPayStatusDto {
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(80)
  referenceId?: string;
}

export class WaiveParkingPaymentDto {
  @Transform(trim)
  @IsString()
  @MinLength(5)
  @MaxLength(1000)
  reason: string;
}
