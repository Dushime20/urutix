import {
  IsString,
  IsNumber,
  IsDate,
  IsOptional,
  IsEnum,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { InvoiceStatus, InvoiceItemType } from './../entities/invoice.entity';

export class CreateInvoiceItemDto {
  @ApiProperty({ description: 'Item description' })
  @IsString()
  description: string;

  @ApiProperty({ description: 'Item quantity' })
  @IsNumber()
  quantity: number;

  @ApiProperty({ description: 'Unit price' })
  @IsNumber()
  unitPrice: number;

  @ApiProperty({ description: 'Total price' })
  @IsNumber()
  totalPrice: number;

  @ApiProperty({ enum: InvoiceItemType, description: 'Item type' })
  @IsEnum(InvoiceItemType)
  type: InvoiceItemType;

  @ApiProperty({ description: 'Associated trip ID', required: false })
  @IsOptional()
  @IsString()
  tripId?: string;

  @ApiProperty({ description: 'Item notes', required: false })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class CreateInvoiceDto {
  @ApiProperty({ description: 'Invoice number' })
  @IsString()
  invoiceNumber: string;

  @ApiProperty({ description: 'Customer ID' })
  @IsString()
  customerId: string;

  @ApiProperty({ description: 'Customer name' })
  @IsString()
  customerName: string;

  @ApiProperty({ description: 'Associated trip ID', required: false })
  @IsOptional()
  @IsString()
  tripId?: string;

  @ApiProperty({ description: 'Associated truck ID', required: false })
  @IsOptional()
  @IsString()
  truckId?: string;

  @ApiProperty({ description: 'Associated driver ID', required: false })
  @IsOptional()
  @IsString()
  driverId?: string;

  @ApiProperty({ description: 'Issue date' })
  @IsDate()
  @Type(() => Date)
  issueDate: Date;

  @ApiProperty({ description: 'Due date' })
  @IsDate()
  @Type(() => Date)
  dueDate: Date;

  @ApiProperty({ enum: InvoiceStatus, description: 'Invoice status' })
  @IsEnum(InvoiceStatus)
  status: InvoiceStatus;

  @ApiProperty({ description: 'Subtotal amount' })
  @IsNumber()
  subtotal: number;

  @ApiProperty({ description: 'Tax amount' })
  @IsNumber()
  taxAmount: number;

  @ApiProperty({ description: 'Total amount' })
  @IsNumber()
  totalAmount: number;

  @ApiProperty({ description: 'Currency', default: 'USD' })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiProperty({ description: 'Invoice notes', required: false })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ description: 'Payment terms', default: 'Net 30' })
  @IsOptional()
  @IsString()
  paymentTerms?: string;

  @ApiProperty({ description: 'Payment method', required: false })
  @IsOptional()
  @IsString()
  paymentMethod?: string;

  @ApiProperty({ description: 'Invoice items' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateInvoiceItemDto)
  items: CreateInvoiceItemDto[];
}
