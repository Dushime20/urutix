import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('private_carrier_networks')
@Index(['cargoOwnerId', 'truckOwnerId', 'tenantId'], { unique: true })
@Index(['cargoOwnerId', 'tenantId'])
export class PrivateCarrierNetwork {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  cargoOwnerId: string;

  @Column('uuid')
  truckOwnerId: string;

  @Column('uuid')
  tenantId: string;

  @Column('text', { nullable: true })
  notes?: string;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  addedAt: Date;
}
