import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  ManyToMany,
  JoinTable,
  JoinColumn,
  Index,
} from 'typeorm';
import { Lender } from './lender.entity';

export enum LenderUserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  PENDING = 'pending',
  SUSPENDED = 'suspended',
}

export enum PermissionLevel {
  READ = 'read',
  WRITE = 'write',
  ADMIN = 'admin',
}

export enum PermissionCategory {
  LOANS = 'loans',
  BORROWERS = 'borrowers',
  ANALYTICS = 'analytics',
  SETTINGS = 'settings',
  COMPLIANCE = 'compliance',
  FINANCIAL = 'financial',
}

@Entity('lender_permissions')
@Index(['category', 'level'])
export class LenderPermission {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({
    type: 'enum',
    enum: PermissionCategory,
  })
  category: PermissionCategory;

  @Column({
    type: 'enum',
    enum: PermissionLevel,
  })
  level: PermissionLevel;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}

@Entity('lender_roles')
@Index(['level', 'is_custom'])
export class LenderRole {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'int', default: 1 })
  level: number; // 1-5, higher = more access

  @Column({ type: 'boolean', default: true })
  is_custom: boolean;

  @ManyToMany(() => LenderPermission)
  @JoinTable({
    name: 'lender_role_permissions',
    joinColumn: { name: 'role_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'permission_id', referencedColumnName: 'id' },
  })
  default_permissions: LenderPermission[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}

@Entity('lender_users')
@Index(['lender_id', 'status'])
@Index(['email'], { unique: true })
export class LenderUser {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100 })
  first_name: string;

  @Column({ type: 'varchar', length: 100 })
  last_name: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  email: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  phone: string;

  @Column({ type: 'varchar', length: 255, select: false })
  password_hash: string;

  @ManyToOne(() => Lender, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'lender_id' })
  lender: Lender;

  @Column({ type: 'uuid' })
  lender_id: string;

  @ManyToOne(() => LenderRole)
  @JoinColumn({ name: 'role_id' })
  role: LenderRole;

  @Column({ type: 'uuid' })
  role_id: string;

  @Column({
    type: 'enum',
    enum: LenderUserStatus,
    default: LenderUserStatus.PENDING,
  })
  status: LenderUserStatus;

  @Column({ type: 'varchar', length: 100, nullable: true })
  department: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  avatar: string;

  @ManyToMany(() => LenderPermission)
  @JoinTable({
    name: 'lender_user_permissions',
    joinColumn: { name: 'user_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'permission_id', referencedColumnName: 'id' },
  })
  additional_permissions: LenderPermission[];

  @Column({ type: 'varchar', length: 255 })
  created_by: string;

  @Column({ type: 'timestamp', nullable: true })
  last_login: Date;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
