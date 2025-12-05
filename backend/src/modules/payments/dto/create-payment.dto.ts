import {
  IsUUID,
  IsNumber,
  IsString,
  IsOptional,
  IsEnum,
  Min,
  IsDateString,
  IsObject,
} from 'class-validator';
import {
  PaymentType,
  PaymentStatus,
  PaymentMethod,
} from '../../../entities/payment.entity';

export interface PaymentMetadata {
  customerInfo?: {
    name: string;
    email: string;
    phone?: string;
  };
  billingInfo?: {
    address: string;
    city: string;
    country: string;
    postalCode?: string;
  };
  tripInfo?: {
    pickupLocation?: string;
    deliveryLocation?: string;
    cargoType?: string;
    weight?: number;
  };
  phoneNumber?: string;
  paymentMethod?: string;
  lenderId?: string;
  lenderName?: string;
  financedAmount?: number;
  isLenderPayment?: boolean;
  customFields?: Record<string, any>;
}

export class CreatePaymentDto {
  @IsUUID()
  tripId: string;

  @IsNumber()
  @Min(0.01)
  amount: number;

  @IsString()
  currency: string;

  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;

  @IsEnum(PaymentType)
  paymentType: PaymentType;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  referenceNumber?: string;

  @IsOptional()
  @IsDateString()
  dueDate?: Date;

  @IsOptional()
  @IsString()
  billingAddress?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsObject()
  metadata?: PaymentMetadata; // Proper object type for additional data
}
