import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

/**
 * Stores the latest fetched exchange rates with USD as the base currency.
 * One row per target currency per fetch cycle.
 */
@Entity('exchange_rates')
@Index(['baseCurrency', 'targetCurrency'])
@Index(['fetchedAt'])
export class ExchangeRate {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** Always 'USD' for this platform */
  @Column({ length: 3, default: 'USD' })
  baseCurrency: string;

  /** Target currency code e.g. 'EUR', 'RWF' */
  @Column({ length: 3 })
  targetCurrency: string;

  /** Units of targetCurrency per 1 USD */
  @Column('decimal', { precision: 20, scale: 8 })
  rate: number;

  /** Provider that supplied the rate e.g. 'exchangerate-api' */
  @Column({ nullable: true })
  source?: string;

  /** When the rate was fetched from the external provider */
  @CreateDateColumn({ name: 'fetched_at' })
  fetchedAt: Date;
}
