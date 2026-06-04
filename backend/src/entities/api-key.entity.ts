import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn, Index,
} from 'typeorm';

@Entity('api_keys')
@Index(['tenantId', 'isActive'])
@Index(['keyHash'], { unique: true })
export class ApiKey {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  tenantId: string;

  @Column('uuid')
  createdBy: string;

  @Column()
  name: string;

  @Column({ length: 64 })
  keyHash: string;

  @Column({ length: 8 })
  keyPrefix: string; // first 8 chars shown in UI

  @Column('simple-array', { default: '' })
  permissions: string[];

  @Column({ default: true })
  isActive: boolean;

  @Column({ nullable: true })
  lastUsedAt?: Date;

  @Column({ nullable: true })
  expiresAt?: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
