import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('credit_packages')
@Index(['isActive', 'displayOrder'])
export class CreditPackage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100 })
  name: string;

  @Column({ type: 'int' })
  credits: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @Column({ type: 'int', default: 0, name: 'discount_percentage' })
  discountPercentage: number;

  @Column({ type: 'boolean', default: true, name: 'is_active' })
  isActive: boolean;

  @Column({ type: 'int', default: 0, name: 'display_order' })
  displayOrder: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Virtual properties
  get pricePerCredit(): number {
    return Number((Number(this.price) / this.credits).toFixed(4));
  }

  get formattedPrice(): string {
    return `$${Number(this.price).toFixed(2)}`;
  }

  get savingsAmount(): number {
    // Calculate savings compared to base rate (15¢ per credit)
    const baseRate = 0.15;
    const basePrice = this.credits * baseRate;
    return basePrice - Number(this.price);
  }

  get formattedSavings(): string {
    const savings = this.savingsAmount;
    return savings > 0 ? `$${savings.toFixed(2)}` : '$0.00';
  }

  get isPopular(): boolean {
    // Mark 500 or 1000 credit packages as popular
    return this.credits === 500 || this.credits === 1000;
  }

  get isBestValue(): boolean {
    // Mark 5000 credit package as best value
    return this.credits === 5000;
  }
}
