import { IsUUID, IsNumber, IsOptional, IsString, Min, Max } from 'class-validator';

export class CreateFuelBudgetDto {
    @IsUUID()
    tripId: string;

    @IsUUID()
    truckId: string;

    @IsNumber()
    @Min(0.01)
    budgetedAmount: number;

    @IsOptional()
    @IsNumber()
    @Min(1)
    @Max(100)
    alertThreshold?: number;

    @IsOptional()
    @IsString()
    notes?: string;
}

export class RecordFuelExpenseDto {
    @IsNumber()
    @Min(0.01)
    fuelCost: number;
}

export class UpdateBudgetStatusDto {
    @IsString()
    status: string;

    @IsOptional()
    @IsString()
    notes?: string;
}

export class GetBudgetAnalysisDto {
    @IsUUID()
    tripId: string;
}
