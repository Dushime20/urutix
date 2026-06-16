import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

/**
 * Stores the platform's supported currencies.
 * Super-admins manage this table via the Currency CRUD API.
 * The exchange-rate service reads active currencies from here.
 */
@Entity('currencies')
export class Currency {
  /** ISO 4217 currency code — e.g. 'USD', 'RWF' */
  @PrimaryColumn({ length: 3 })
  code: string;

  /** Human-readable name — e.g. 'US Dollar' */
  @Column({ length: 64 })
  name: string;

  /** Display symbol — e.g. '$', 'FRw' */
  @Column({ length: 16 })
  symbol: string;

  /** BCP-47 locale for Intl.NumberFormat — e.g. 'en-US' */
  @Column({ length: 16 })
  locale: string;

  /** Decimal digits to show (0 for JPY/RWF, 2 for most others) */
  @Column({ type: 'int', default: 2 })
  decimals: number;

  /** Emoji flag — e.g. '🇺🇸' */
  @Column({ length: 8, default: '🏳' })
  flag: string;

  /** Whether this currency is shown to users */
  @Column({ default: true })
  isActive: boolean;

  /**
   * Optional manual rate override (units per 1 USD).
   * When set, the auto-fetched rate is ignored for this currency.
   */
  @Column('decimal', { precision: 20, scale: 8, nullable: true })
  manualRate: number | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
