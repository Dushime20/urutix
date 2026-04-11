import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Tenant } from './tenant.entity';
import { User } from './user.entity';

@Entity('credit_marketplace_settings')
export class CreditMarketplaceSettings {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId: string;

  @Column({ name: 'tenant_admin_user_id', type: 'uuid' })
  tenantAdminUserId: string;

  @Column({ name: 'min_purchase_amount', type: 'integer', default: 500 })
  minPurchaseAmount: number;

  @Column({ name: 'max_purchase_amount', type: 'integer', nullable: true })
  maxPurchaseAmount: number | null;

  @Column({ name: 'price_per_credit', type: 'decimal', precision: 10, scale: 2, default: 1.0 })
  pricePerCredit: number;

  @Column({ name: 'is_enabled', type: 'boolean', default: true })
  isEnabled: boolean;

  @Column({ name: 'settings_metadata', type: 'jsonb', default: {} })
  settingsMetadata: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relations
  @ManyToOne(() => Tenant)
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'tenant_admin_user_id' })
  tenantAdmin: User;
}
