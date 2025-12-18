import { IsNotEmpty, IsString, IsBoolean, IsOptional, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class InspectionChecklistItemDto {
  @IsNotEmpty()
  @IsString()
  id: string;

  @IsNotEmpty()
  @IsString()
  label: string;

  @IsOptional()
  originalValue?: any;

  @IsNotEmpty()
  @IsBoolean()
  verified: boolean;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsBoolean()
  discrepancy?: boolean;
}

export class SubmitCargoInspectionDto {
  @IsNotEmpty()
  @IsString()
  loadId: string;

  @IsNotEmpty()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => InspectionChecklistItemDto)
  checklist: InspectionChecklistItemDto[];

  @IsOptional()
  @IsString()
  overallNotes?: string;
}

