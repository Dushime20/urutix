import { IsUUID, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class RequestFuelAdvanceDto {
    @IsNumber()
    @Min(0.01)
    advanceAmount: number;

    @IsOptional()
    @IsUUID()
    tripId?: string;

    @IsOptional()
    @IsString()
    notes?: string;
}

export class ApproveAdvanceDto {
    @IsOptional()
    @IsString()
    notes?: string;
}

export class RejectAdvanceDto {
    @IsString()
    rejectionReason: string;
}

export class ReconcileAdvanceDto {
    @IsNumber()
    @Min(0)
    reconciliationAmount: number;

    @IsOptional()
    @IsString()
    reconciliationNotes?: string;
}

export class GetDriverAdvancesDto {
    @IsOptional()
    @IsString()
    status?: string;
}
