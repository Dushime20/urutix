import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsOptional, IsString, IsUUID, IsDateString, Min } from 'class-validator';
import { FuelLogStatus } from 'src/entities/fuel-log.entity';

export class CreateFuelLogDto {
    @ApiProperty({
        description: 'ID of the truck',
        example: 'truck-uuid-123',
    })
    @IsUUID()
    truckId: string;

    @ApiProperty({
        description: 'ID of the driver (optional)',
        example: 'driver-uuid-456',
        required: false,
    })
    @IsOptional()
    @IsUUID()
    driverId?: string;

    @ApiProperty({
        description: 'Date and time of fueling',
        example: '2026-01-20T14:30:00Z',
    })
    @IsDateString()
    fuelDate: string;

    @ApiProperty({
        description: 'Number of gallons',
        example: 50.5,
    })
    @IsNumber()
    @Min(0.1)
    gallons: number;

    @ApiProperty({
        description: 'Price per gallon',
        example: 4.20,
    })
    @IsNumber()
    @Min(0.01)
    pricePerGallon: number;

    @ApiProperty({
        description: 'Location of fuel station',
        example: "Shell #402, TX",
    })
    @IsString()
    location: string;

    @ApiProperty({
        description: 'Odometer reading (optional)',
        example: 125000,
        required: false,
    })
    @IsOptional()
    @IsNumber()
    odometer?: number;

    @ApiProperty({
        description: 'Receipt number (optional)',
        example: 'RCP-12345',
        required: false,
    })
    @IsOptional()
    @IsString()
    receiptNumber?: string;

    @ApiProperty({
        description: 'Payment method (optional)',
        example: 'Company Card',
        required: false,
    })
    @IsOptional()
    @IsString()
    paymentMethod?: string;

    @ApiProperty({
        description: 'Additional notes (optional)',
        required: false,
    })
    @IsOptional()
    @IsString()
    notes?: string;
}

export class UpdateFuelLogDto {
    @ApiProperty({
        description: 'Status of the fuel log',
        enum: FuelLogStatus,
        required: false,
    })
    @IsOptional()
    @IsEnum(FuelLogStatus)
    status?: FuelLogStatus;

    @ApiProperty({
        description: 'Flag reason (if flagged)',
        required: false,
    })
    @IsOptional()
    @IsString()
    flagReason?: string;

    @ApiProperty({
        description: 'Additional notes',
        required: false,
    })
    @IsOptional()
    @IsString()
    notes?: string;
}

export class GetFuelLogsDto {
    @ApiProperty({
        description: 'Filter by truck ID',
        required: false,
    })
    @IsOptional()
    @IsUUID()
    truckId?: string;

    @ApiProperty({
        description: 'Filter by driver ID',
        required: false,
    })
    @IsOptional()
    @IsUUID()
    driverId?: string;

    @ApiProperty({
        description: 'Filter by status',
        enum: FuelLogStatus,
        required: false,
    })
    @IsOptional()
    @IsEnum(FuelLogStatus)
    status?: FuelLogStatus;

    @ApiProperty({
        description: 'Start date for filtering',
        required: false,
    })
    @IsOptional()
    @IsDateString()
    startDate?: string;

    @ApiProperty({
        description: 'End date for filtering',
        required: false,
    })
    @IsOptional()
    @IsDateString()
    endDate?: string;
}
