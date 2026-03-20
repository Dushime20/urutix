import { PartialType, ApiPropertyOptional } from '@nestjs/swagger';
import { CreateLoadDto } from '../dto/create-load.dto';
import { IsOptional, IsUUID, IsNumber } from 'class-validator';

export class UpdateLoadDto extends PartialType(CreateLoadDto) {
    @ApiPropertyOptional({ description: 'Assigned broker ID' })
    @IsOptional()
    @IsUUID()
    brokerId?: string;

    @ApiPropertyOptional({ description: 'Broker commission rate' })
    @IsOptional()
    @IsNumber()
    brokerCommissionRate?: number;

    @ApiPropertyOptional({ description: 'Broker commission amount' })
    @IsOptional()
    @IsNumber()
    brokerCommissionAmount?: number;
}
