import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from './user.entity';

@Entity('load_templates')
@Index(['tenantId', 'createdBy', 'isActive'])
@Index(['usageCount', 'createdAt'])
export class LoadTemplate {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  tenantId: string;

  @Column()
  name: string;

  @Column('text', { nullable: true })
  description?: string;

  @Column('jsonb')
  templateData: Record<string, any>;

  @Column('uuid')
  createdBy: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: 0 })
  usageCount: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt?: Date;

  // Relations
  @ManyToOne('User', 'loadTemplates')
  @JoinColumn({ name: 'createdBy' })
  creator: User;
}
