import { IsUUID, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateFuelWalletDto {
    @IsUUID()
    driverId?: string;

    @IsUUID()
    truckId?: string;

    @IsNumber()
    @Min(0)
    initialBalance?: number;

    @IsOptional()
    @IsString()
    notes?: string;
}

export class AddCreditDto {
    @IsNumber()
    @Min(0.01)
    amount: number;

    @IsString()
    description: string;

    @IsOptional()
    @IsString()
    referenceId?: string;

    @IsOptional()
    metadata?: {
        petrolStation?: string;
        stationLocation?: string;
        transactionDate?: string;
        receiptNumber?: string;
        fuelType?: string;
        liters?: number;
        pricePerLiter?: number;
        paymentMethod?: string;
    };
}

export class DebitForFuelDto {
    @IsNumber()
    @Min(0.01)
    amount: number;

    @IsUUID()
    fuelLogId: string;
}

export class GetWalletTransactionsDto {
    @IsOptional()
    @IsNumber()
    limit?: number = 50;

    @IsOptional()
    @IsNumber()
    offset?: number = 0;
}
